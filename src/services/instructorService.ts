// src/services/instructorService.ts
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
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Instructor } from '../types/course';

/**
 * Service pour la gestion des instructeurs
 */
export const instructorService = {
    /**
     * Crée ou met à jour un instructeur
     * @param instructorData Les données de l'instructeur
     * @param isNew Si l'instructeur est nouveau ou une mise à jour
     * @returns L'ID de l'instructeur
     */
    async saveInstructor(instructorData: Partial<Instructor>, isNew = true): Promise<string> {
        try {
            const instructorId = instructorData.id || doc(collection(db, 'instructors')).id;
            console.log('Test pour voir ', instructorData)
            // Préparation des données de l'instructeur
            const instructorToSave = {
                ...instructorData,
                id: instructorId,
                photoUrl: instructorData.photoUrl || '',
                updatedAt: serverTimestamp(),
            };

            if (isNew) {
                instructorToSave.createdAt = serverTimestamp();
            }

            // Enregistrer le document de l'instructeur
            if (isNew) {
                await setDoc(doc(db, 'instructors', instructorId), instructorToSave);
            } else {
                // Ne pas écraser les champs non fournis lors d'une mise à jour
                const { id, ...updateData } = instructorToSave;
                await updateDoc(doc(db, 'instructors', instructorId), updateData);
            }

            return instructorId;
        } catch (error) {
            console.error('Error saving instructor:', error);
            throw error;
        }
    },

    /**
     * Récupère un instructeur par son ID
     * @param instructorId ID de l'instructeur
     * @returns Les données de l'instructeur
     */
    async getInstructor(instructorId: string): Promise<Instructor> {
        try {
            const instructorDoc = await getDoc(doc(db, 'instructors', instructorId));

            if (!instructorDoc.exists()) {
                throw new Error('Instructor not found');
            }

            return { id: instructorDoc.id, ...instructorDoc.data() } as Instructor;
        } catch (error) {
            console.error('Error getting instructor:', error);
            throw error;
        }
    },

    /**
     * Récupère tous les instructeurs
     * @returns Liste des instructeurs
     */
    async getAllInstructors(): Promise<Instructor[]> {
        try {
            const instructorsQuery = query(
                collection(db, 'instructors'),
                orderBy('name', 'asc')
            );

            const instructorsSnapshot = await getDocs(instructorsQuery);

            return instructorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Instructor[];
        } catch (error) {
            console.error('Error getting all instructors:', error);
            throw error;
        }
    },

    /**
     * Récupère la liste de tous les instructeurs
     */
    async getInstructors(): Promise<Instructor[]> {
        try {
            const instructorsSnapshot = await getDocs(collection(db, 'instructors'));
            return instructorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Instructor[];
        } catch (error) {
            console.error('Error fetching instructors:', error);
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
    },

    /**
     * Recherche des instructeurs par expertise
     * @param expertise Domaine d'expertise
     * @returns Liste des instructeurs avec cette expertise
     */
    async getInstructorsByExpertise(expertise: string): Promise<Instructor[]> {
        try {
            const instructorsQuery = query(
                collection(db, 'instructors'),
                where('expertise', 'array-contains', expertise)
            );

            const instructorsSnapshot = await getDocs(instructorsQuery);

            return instructorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Instructor[];
        } catch (error) {
            console.error('Error getting instructors by expertise:', error);
            throw error;
        }
    }
};
