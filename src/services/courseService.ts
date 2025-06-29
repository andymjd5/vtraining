import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Course,
  Instructor,
  ContentBlock,
  CourseWithStructure,
  ChapterWithSections,
  SectionWithContent
} from '../types/course';

/**
 * Nettoie un objet en remplaçant les valeurs undefined par null
 * Firestore ne supporte pas les valeurs undefined
 */
function cleanObjectForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanObjectForFirestore);
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanObjectForFirestore(value);
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Valide qu'un objet ne contient pas de valeurs undefined
 * Utilisé pour le debugging
 */
function validateObjectForFirestore(obj: any, path = ''): string[] {
  const errors: string[] = [];

  if (obj === undefined) {
    errors.push(`Valeur undefined trouvée à ${path || 'racine'}`);
    return errors;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      errors.push(...validateObjectForFirestore(item, `${path}[${index}]`));
    });
  } else if (obj !== null && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      errors.push(...validateObjectForFirestore(value, currentPath));
    }
  }

  return errors;
}

/**
 * Service pour la gestion des cours avec la nouvelle structure optimisée
 */
export const courseService = {
  /**
   * Crée ou met à jour un cours
   * @param courseData Les données du cours
   * @param isNew Si le cours est nouveau ou une mise à jour
   * @returns L'ID du cours
   */
  async saveCourse(courseData: Partial<Course>, isNew = true): Promise<string> {
    try {
      const courseId = courseData.id || doc(collection(db, 'courses')).id;      // Préparation des données du cours
      const courseToSave = cleanObjectForFirestore({
        ...courseData,
        id: courseId,
        updatedAt: serverTimestamp(),
        createdAt: isNew ? serverTimestamp() : courseData.createdAt,
        status: courseData.status || 'draft',
        assignedTo: courseData.assignedTo || [],
        chaptersOrder: courseData.chaptersOrder || []
      });

      // Enregistrer le document du cours
      if (isNew) {
        await setDoc(doc(db, 'courses', courseId), courseToSave);
      } else {
        // Ne pas écraser les champs non fournis lors d'une mise à jour
        const { id, ...updateData } = courseToSave;
        await updateDoc(doc(db, 'courses', courseId), updateData);
      }

      return courseId;
    } catch (error) {
      console.error('Error saving course:', error);
      throw error;
    }
  },

  /**
   * Récupère un cours par son ID (métadonnées uniquement)
   * @param courseId ID du cours
   * @returns Les données du cours
   */
  async getCourse(courseId: string): Promise<Course> {
    try {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));

      if (!courseDoc.exists()) {
        throw new Error('Course not found');
      }

      return { id: courseDoc.id, ...courseDoc.data() } as Course;
    } catch (error) {
      console.error('Error getting course:', error);
      throw error;
    }
  },

  /**
   * Charge un cours complet avec toute sa structure (chapitres, sections, blocs de contenu)
   * @param courseId ID du cours
   * @returns Le cours avec sa structure complète
   */
  async loadCourseWithStructure(courseId: string): Promise<CourseWithStructure> {
    try {
      // Récupérer le document du cours
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (!courseDoc.exists()) {
        throw new Error('Course not found');
      }

      const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
      // Récupérer l'instructeur si nécessaire
      let instructor = undefined;
      if (courseData.instructorId) {
        const instructorDoc = await getDoc(doc(db, 'instructors', courseData.instructorId));
        if (instructorDoc.exists()) {
          instructor = { id: instructorDoc.id, ...instructorDoc.data() } as Instructor;
        }
      }

      // Récupérer les chapitres
      const chaptersQuery = query(
        collection(db, 'chapters'),
        where('courseId', '==', courseId),
        orderBy('order', 'asc')
      );

      const chaptersSnapshot = await getDocs(chaptersQuery);
      const chaptersData: { [id: string]: ChapterWithSections } = {};
      chaptersSnapshot.forEach(doc => {
        const data = doc.data();
        const chapterData: ChapterWithSections = {
          id: doc.id,
          courseId: data.courseId,
          title: data.title,
          description: data.description,
          order: data.order,
          estimatedTime: data.estimatedTime,
          learningObjectives: data.learningObjectives,
          sectionsOrder: data.sectionsOrder || [],
          hasQuiz: data.hasQuiz,
          quizSettings: data.quizSettings,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          sections: []
        };
        chaptersData[doc.id] = chapterData;
      });

      // Récupérer les sections
      const sectionsQuery = query(
        collection(db, 'sections'),
        where('courseId', '==', courseId)
      );

      const sectionsSnapshot = await getDocs(sectionsQuery);
      const sectionsData: { [id: string]: SectionWithContent } = {};

      sectionsSnapshot.forEach(doc => {
        const data = doc.data(); const sectionData: SectionWithContent = {
          id: doc.id,
          courseId: data.courseId,
          chapterId: data.chapterId,
          title: data.title,
          order: data.order,
          contentBlocksOrder: data.contentBlocksOrder || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          content: []
        };

        sectionsData[doc.id] = sectionData;

        // Ajouter la section au chapitre correspondant
        if (chaptersData[sectionData.chapterId]) {
          chaptersData[sectionData.chapterId].sections.push(sectionData);
        }
      });

      // Trier les sections par ordre pour chaque chapitre
      Object.values(chaptersData).forEach(chapter => {
        chapter.sections.sort((a, b) => a.order - b.order);
      });

      // Récupérer les blocs de contenu
      const blocksQuery = query(
        collection(db, 'content_blocks'),
        where('courseId', '==', courseId)
      );

      const blocksSnapshot = await getDocs(blocksQuery);

      blocksSnapshot.forEach(doc => {
        const blockData = {
          id: doc.id,
          ...doc.data()
        } as ContentBlock;

        // Ajouter le bloc à la section correspondante
        if (sectionsData[blockData.sectionId]) {
          sectionsData[blockData.sectionId].content.push(blockData);
        }
      });

      // Trier les blocs de contenu par ordre pour chaque section
      Object.values(sectionsData).forEach(section => {
        section.content.sort((a, b) => a.order - b.order);
      });

      // Construire la structure du cours selon l'ordre des chapitres
      const orderedChapters = (courseData.chaptersOrder || [])
        .map(chapterId => chaptersData[chapterId])
        .filter(Boolean);

      // Si l'ordre est incomplet, ajouter les chapitres manquants à la fin
      Object.values(chaptersData).forEach(chapter => {
        if (!orderedChapters.some(c => c.id === chapter.id)) {
          orderedChapters.push(chapter);
        }
      });

      // Assembler le cours complet
      return {
        ...courseData,
        chapters: orderedChapters,
        instructor
      };
    } catch (error) {
      console.error('Error loading course with structure:', error);
      throw error;
    }
  },

  /**
   * Met à jour les métadonnées d'un cours
   * @param courseId ID du cours
   * @param courseData Données à mettre à jour
   */  async updateCourse(courseId: string, courseData: Partial<Course>): Promise<void> {
    try {
      await updateDoc(doc(db, 'courses', courseId), cleanObjectForFirestore({
        ...courseData,
        updatedAt: serverTimestamp()
      }));
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  /**
   * Supprime un cours et toute sa structure (chapitres, sections, blocs)
   * @param courseId ID du cours
   */
  async deleteCourse(courseId: string): Promise<void> {
    try {
      // Rechercher tous les éléments liés au cours
      const chaptersQuery = query(collection(db, 'chapters'), where('courseId', '==', courseId));
      const sectionsQuery = query(collection(db, 'sections'), where('courseId', '==', courseId));
      const blocksQuery = query(collection(db, 'content_blocks'), where('courseId', '==', courseId));

      const [chaptersSnapshot, sectionsSnapshot, blocksSnapshot] = await Promise.all([
        getDocs(chaptersQuery),
        getDocs(sectionsQuery),
        getDocs(blocksQuery)
      ]);

      // Supprimer par lots pour de meilleures performances
      const batch = writeBatch(db);

      // Supprimer les blocs de contenu
      blocksSnapshot.docs.forEach(blockDoc => {
        batch.delete(blockDoc.ref);
      });

      // Supprimer les sections
      sectionsSnapshot.docs.forEach(sectionDoc => {
        batch.delete(sectionDoc.ref);
      });

      // Supprimer les chapitres
      chaptersSnapshot.docs.forEach(chapterDoc => {
        batch.delete(chapterDoc.ref);
      });

      // Supprimer le cours lui-même
      batch.delete(doc(db, 'courses', courseId));

      // Exécuter toutes les suppressions
      await batch.commit();
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  /**
   * Sauvegarde les chapitres et sections d'un cours
   * @param courseId ID du cours
   * @param chapters Liste des chapitres avec leurs sections
   */
  async saveChaptersAndSections(courseId: string, chapters: ChapterWithSections[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Mettre à jour l'ordre des chapitres dans le cours
      const chaptersOrder = chapters.map(ch => ch.id);
      batch.update(doc(db, 'courses', courseId), {
        chaptersOrder,
        updatedAt: serverTimestamp()
      });      // Sauvegarder chaque chapitre
      for (const chapter of chapters) {
        const chapterRef = doc(db, 'chapters', chapter.id);

        batch.set(chapterRef, cleanObjectForFirestore({
          id: chapter.id,
          courseId,
          title: chapter.title,
          description: chapter.description,
          order: chapter.order,
          estimatedTime: chapter.estimatedTime,
          learningObjectives: chapter.learningObjectives,
          hasQuiz: chapter.hasQuiz || false,
          quizSettings: chapter.quizSettings || null,
          sectionsOrder: chapter.sections.map(sec => sec.id),
          createdAt: chapter.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        }));        // Sauvegarder les sections de ce chapitre
        for (const section of chapter.sections) {
          const sectionRef = doc(db, 'sections', section.id);

          batch.set(sectionRef, cleanObjectForFirestore({
            id: section.id,
            chapterId: chapter.id,
            courseId,
            title: section.title,
            order: section.order,
            contentBlocksOrder: section.content?.map(block => block.id) || [],
            createdAt: section.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp()
          }));// Sauvegarder les blocs de contenu de cette section
          if (section.content && section.content.length > 0) {
            for (const block of section.content) {
              const blockRef = doc(db, 'content_blocks', block.id);              // Nettoyer l'objet media pour éviter les valeurs undefined
              const cleanMedia = block.media ? cleanObjectForFirestore(block.media) : null; batch.set(blockRef, cleanObjectForFirestore({
                id: block.id,
                sectionId: section.id,
                chapterId: chapter.id,
                courseId,
                type: block.type,
                content: block.content || '',
                order: section.content.indexOf(block),
                formatting: block.formatting || null,
                media: cleanMedia,
                createdAt: block.createdAt || serverTimestamp(),
                updatedAt: serverTimestamp()
              }));
            }
          }
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error saving chapters and sections:', error);
      throw error;
    }
  },

  /**
   * Récupère la liste des cours (métadonnées uniquement)
   */
  async getAllCourses(): Promise<Course[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        orderBy('createdAt', 'desc')
      );

      const coursesSnapshot = await getDocs(coursesQuery);

      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting all courses:', error);
      throw error;
    }
  },

  /**
   * Récupère les cours assignés à une entreprise
   * @param companyId ID de l'entreprise
   */
  async getCoursesByCompany(companyId: string): Promise<Course[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('assignedTo', 'array-contains', companyId)
      );

      const coursesSnapshot = await getDocs(coursesQuery);

      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting courses by company:', error);
      throw error;
    }
  },

  /**
   * Assigne un cours à des entreprises
   * @param courseId ID du cours
   * @param companyIds IDs des entreprises
   */
  async assignCourseToCompanies(courseId: string, companyIds: string[]): Promise<void> {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        assignedTo: companyIds,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error assigning course to companies:', error);
      throw error;
    }
  },

  /**
   * Récupère les cours par catégorie
   * @param categoryId ID de la catégorie
   */
  async getCoursesByCategoryId(categoryId: string): Promise<Course[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('categoryId', '==', categoryId)
      );

      const coursesSnapshot = await getDocs(coursesQuery);

      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting courses by categoryId:', error);
      throw error;
    }
  },

  /**
   * Récupère les cours par niveau de difficulté
   * @param level Niveau (débutant, intermédiaire, avancé)
   */
  async getCoursesByLevel(level: string): Promise<Course[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('level', '==', level)
      );

      const coursesSnapshot = await getDocs(coursesQuery);

      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting courses by level:', error);
      throw error;
    }
  },

  /**
   * Récupère uniquement les cours publiés
   */
  async getPublishedCourses(): Promise<Course[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('status', '==', 'published')
      );

      const coursesSnapshot = await getDocs(coursesQuery);

      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting published courses:', error);
      throw error;
    }
  },

  /**
   * Associe un instructeur à un cours
   * @param instructorId ID de l'instructeur
   * @param courseId ID du cours
   */
  async associateInstructorWithCourse(instructorId: string, courseId: string): Promise<void> {
    try {
      // Ajouter le cours à la liste des cours de l'instructeur
      await updateDoc(doc(db, 'instructors', instructorId), {
        courses: arrayUnion(courseId),
        updatedAt: serverTimestamp()
      });

      // Définir l'instructeur comme instructeur du cours
      await updateDoc(doc(db, 'courses', courseId), {
        instructorId: instructorId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error associating instructor with course:', error);
      throw error;
    }
  },

  /**
   * Dissocie un instructeur d'un cours
   * @param instructorId ID de l'instructeur
   * @param courseId ID du cours
   */
  async dissociateInstructorFromCourse(instructorId: string, courseId: string): Promise<void> {
    try {
      // Retirer le cours de la liste des cours de l'instructeur
      await updateDoc(doc(db, 'instructors', instructorId), {
        courses: arrayRemove(courseId),
        updatedAt: serverTimestamp()
      });

      // Retirer l'instructeur du cours
      await updateDoc(doc(db, 'courses', courseId), {
        instructorId: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error dissociating instructor from course:', error);
      throw error;
    }
  }
};