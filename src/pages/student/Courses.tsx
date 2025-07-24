import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import Card from '../../components/ui/Card';
import { BookOpen, Clock, User, Search, Filter, X, Play, CheckCircle, BookmarkIcon, Star } from 'lucide-react';
import type { Course, Category, Instructor } from '../../types/course';
import CourseCard from '../../components/course/CourseCard';
import CourseSkeleton from '../../components/course/CourseSkeleton';
import CourseFilters from '../../components/course/CourseFilters';

// Type local pour les cours enrichis
interface EnrichedCourse extends Course {
  instructor?: Instructor;
  category?: Category;
  progress?: number;
  status_user?: 'not-started' | 'in-progress' | 'completed';
  lastAccessedAt?: Date;
  chaptersCount?: number;
  sectionsCount?: number;
  contentBlocksCount?: number;
  estimatedDuration?: number;
  difficulty?: 'Facile' | 'Moyen' | 'Difficile';
  rating?: number;
  studentsCount?: number;
  thumbnailUrl?: string;
}

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<EnrichedCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrichingData, setEnrichingData] = useState(false);

  // 🔍 Filtres avancés
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'progress' | 'recent' | 'difficulty'>('title');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.companyId) {
      fetchAllData();
    }
  }, [user]);

  // 🚀 Fonction principale pour récupérer toutes les données
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1️⃣ Récupérer les cours assignés à l'entreprise
      const coursesData = await fetchCourses();

      // 2️⃣ Enrichir les données en parallèle
      setEnrichingData(true);
      const [enrichedCourses, categoriesData] = await Promise.all([
        enrichCoursesData(coursesData),
        fetchCategories()
      ]);

      setCourses(enrichedCourses as EnrichedCourse[]);
      setCategories(categoriesData);

    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
      setEnrichingData(false);
    }
  };

  // 📚 Récupération des cours de base
  const fetchCourses = async (): Promise<Course[]> => {
    const coursesQuery = query(
      collection(db, 'courses'),
      where('assignedTo', 'array-contains', user!.companyId!),
      where('status', '==', 'published') // Seulement les cours publiés
    );

    const coursesSnapshot = await getDocs(coursesQuery);
    return coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Course[];
  };

  // 🏷️ Récupération des catégories
  const fetchCategories = async (): Promise<Category[]> => {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    return categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
  };

  // 👨‍🏫 Récupération des instructeurs en batch
  const fetchInstructors = async (instructorIds: string[]): Promise<Instructor[]> => {
    const uniqueIds = [...new Set(instructorIds.filter(Boolean))];
    if (uniqueIds.length === 0) return [];

    const instructorsPromises = uniqueIds.map(async (id) => {
      const instructorDoc = await getDoc(doc(db, 'instructors', id));
      if (instructorDoc.exists()) {
        return { id: instructorDoc.id, ...instructorDoc.data() } as Instructor;
      }
      return null;
    });

    const instructorsResults = await Promise.all(instructorsPromises);
    return instructorsResults.filter(Boolean) as Instructor[];
  };

  // 📊 Calcul des statistiques de cours
  const calculateCourseStats = async (courseId: string, chaptersOrder: string[]) => {
    if (!chaptersOrder || chaptersOrder.length === 0) {
      return { chaptersCount: 0, sectionsCount: 0, contentBlocksCount: 0, estimatedDuration: 0 };
    }

    try {
      // Récupérer les sections pour chaque chapitre
      const sectionsPromises = chaptersOrder.map(async (chapterId) => {
        const sectionsQuery = query(
          collection(db, 'sections'),
          where('chapterId', '==', chapterId)
        );
        const sectionsSnapshot = await getDocs(sectionsQuery);
        return sectionsSnapshot.docs.map(doc => doc.data());
      });

      const sectionsResults = await Promise.all(sectionsPromises);
      const allSections = sectionsResults.flat();

      // Récupérer les content blocks
      const contentBlocksQuery = query(
        collection(db, 'content_blocks'),
        where('courseId', '==', courseId)
      );
      const contentBlocksSnapshot = await getDocs(contentBlocksQuery);
      const contentBlocks = contentBlocksSnapshot.docs.map(doc => doc.data());

      // Calculer la durée estimée (exemple : 2 min par bloc de texte, durée réelle pour vidéos)
      const estimatedDuration = contentBlocks.reduce((total, block) => {
        if (block.type === 'media' && block.media?.duration) {
          return total + (block.media.duration / 60); // Convertir en minutes
        }
        return total + 2; // 2 minutes par défaut pour les autres types
      }, 0);

      return {
        chaptersCount: chaptersOrder.length,
        sectionsCount: allSections.length,
        contentBlocksCount: contentBlocks.length,
        estimatedDuration: Math.round(estimatedDuration)
      };
    } catch (error) {
      console.error('Error calculating course stats:', error);
      return { chaptersCount: 0, sectionsCount: 0, contentBlocksCount: 0, estimatedDuration: 0 };
    }
  };

  // 🚀 Enrichissement des données des cours
  const enrichCoursesData = async (coursesData: Course[]): Promise<EnrichedCourse[]> => {
    if (coursesData.length === 0) return [];

    // Récupérer tous les instructeurs nécessaires
    const instructorIds = coursesData.map(course => course.instructorId).filter(Boolean) as string[];
    const instructorsData = await fetchInstructors(instructorIds);
    setInstructors(instructorsData);

    // Enrichir chaque cours
    const enrichedCoursesPromises = coursesData.map(async (course) => {
      // Trouver l'instructeur correspondant
      const instructor = instructorsData.find(inst => inst.id === course.instructorId);

      // Calculer les statistiques
      const stats = await calculateCourseStats(course.id, course.chaptersOrder || []);

      // Récupérer la progression utilisateur
      // const userProgress = getUserProgress(course.id); // Supprimé

      return {
        ...course,
        instructor,
        ...stats,
        // ...userProgress, // Supprimé
        // Ajouter des métadonnées calculées
        difficulty: course.level === 'Débutant' ? 'Facile' as const :
          course.level === 'Intermédiaire' ? 'Moyen' as const : 'Difficile' as const,
        rating: 4 + Math.random(), // Rating mockée entre 4 et 5
        studentsCount: Math.floor(Math.random() * 500) + 50 // Nombre d'étudiants mocké
      };
    });

    return Promise.all(enrichedCoursesPromises);
  };

  // 🔍 Filtrage et tri des cours
  const getFilteredAndSortedCourses = () => {
    let filtered: EnrichedCourse[] = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !categoryFilter || course.categoryId === categoryFilter;
      const matchesLevel = !levelFilter || course.level === levelFilter;
      const matchesStatus = !statusFilter || course.status_user === statusFilter;

      return matchesSearch && matchesCategory && matchesLevel && matchesStatus;
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'recent':
          return new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime();
        case 'difficulty':
          const difficultyOrder = { 'Facile': 1, 'Moyen': 2, 'Difficile': 3 };
          return (difficultyOrder[a.difficulty || 'Moyen'] || 2) - (difficultyOrder[b.difficulty || 'Moyen'] || 2);
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return filtered;
  };

  // 🎨 Fonctions utilitaires pour les couleurs et styles
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'débutant':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'intermédiaire':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'avancé':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setLevelFilter('');
    setStatusFilter('');
    setSortBy('title');
  };

  // Navigation intelligente vers un cours
  const handleCourseClick = (course: EnrichedCourse) => {
    // Si l'utilisateur a déjà une progression, aller directement au cours
    if (course.progress && course.progress > 0) {
      navigate(`/student/courses/${course.id}`);
    } else {
      // Sinon, aller à l'aperçu du cours
      navigate(`/student/courses/${course.id}/preview`);
    }
  };

  const filteredCourses = getFilteredAndSortedCourses();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Skeleton des filtres */}
        <Card>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </Card>

        {/* Skeleton des cours */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CourseSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-red-800 mb-2">Erreur</h3>
        <p className="text-red-700 mb-6">{error}</p>
        <button
          onClick={fetchAllData}
          className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 🎯 En-tête moderne */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Cours</h1>
          <p className="text-gray-600">
            Découvrez et continuez votre apprentissage avec {filteredCourses.length} cours disponibles
          </p>
        </div>

        {enrichingData && (
          <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm font-medium">Chargement des détails...</span>
          </div>
        )}
      </div>

      {/* 🔍 Filtres et recherche modernisés */}
      <CourseFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={(v) => setSortBy(v as typeof sortBy)}
        categories={categories}
        clearFilters={clearFilters}
      />

      {/* 📊 Statistiques rapides */}
      {courses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl">
            <div className="text-2xl font-bold">{courses.length}</div>
            <div className="text-blue-100">Cours disponibles</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl">
            <div className="text-2xl font-bold">
              {courses.filter(c => c.status_user === 'completed').length}
            </div>
            <div className="text-green-100">Cours terminés</div>
          </div>
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-2xl">
            <div className="text-2xl font-bold">
              {courses.filter(c => c.status_user === 'in-progress').length}
            </div>
            <div className="text-amber-100">En cours</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl">
            <div className="text-2xl font-bold">
              {Math.round(courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courses.length) || 0}%
            </div>
            <div className="text-purple-100">Progression moyenne</div>
          </div>
        </div>
      )}

      {/* 📚 Liste des cours */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BookOpen className="mx-auto h-16 w-16 text-gray-300 mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Aucun cours trouvé
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || categoryFilter || levelFilter || statusFilter
              ? "Aucun cours ne correspond à vos critères de recherche."
              : "Aucun cours n'est disponible pour le moment."}
          </p>
          {(searchTerm || categoryFilter || levelFilter || statusFilter) && (
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} onClick={handleCourseClick} userId={user?.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;