import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import Card from '../../components/ui/Card';
import { BookOpen, Clock, User, Search, Filter, X, Play, CheckCircle, BookmarkIcon, Star } from 'lucide-react';

// 🎯 Interface modernisée avec la nouvelle structure
interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  categoryId: string;           // Nouvelle structure
  instructorId?: string;        // Nouvelle structure  
  chaptersOrder: string[];      // Nouvelle structure
  duration: number;
  status: 'draft' | 'published';
  previewVideoUrl?: string;
  thumbnailUrl?: string;
  createdAt: any;
  updatedAt: any;

  // 📊 Propriétés enrichies (calculées dynamiquement)
  instructor?: {
    id: string;
    name: string;
    title: string;
    photoUrl?: string;
    bio?: string;
  };
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };

  // 📈 Statistiques réelles
  chaptersCount?: number;
  sectionsCount?: number;
  contentBlocksCount?: number;
  estimatedDuration?: number;   // Calculée depuis les content blocks

  // 🎯 Progression réelle de l'utilisateur
  progress?: number;
  status_user?: 'not-started' | 'in-progress' | 'completed';
  lastAccessedAt?: Date;
  completedContentBlocks?: string[];

  // 🎨 Métadonnées pour l'affichage
  difficulty?: 'Facile' | 'Moyen' | 'Difficile';
  rating?: number;
  studentsCount?: number;
}

// 🎨 Interface pour les catégories enrichies
interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
}

// 👨‍🏫 Interface pour les instructeurs
interface Instructor {
  id: string;
  name: string;
  title: string;
  photoUrl?: string;
  bio?: string;
  rating?: number;
  coursesCount?: number;
}

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
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

      setCourses(enrichedCourses);
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
  const enrichCoursesData = async (coursesData: Course[]): Promise<Course[]> => {
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
    let filtered = courses.filter(course => {
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
  const handleCourseClick = (course: Course) => {
    // Si l'utilisateur a déjà une progression, aller directement au cours
    if (course.progress && course.progress > 0) {
      navigate(`/student/courses/${course.id}`);
    } else {
      // Sinon, aller à l'aperçu du cours
      navigate(`/student/courses/${course.id}/preview`);
    }
  };

  // 🎨 Composant Loading Skeleton moderne
  const CourseSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );

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
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Filtres & Recherche</h3>
            {(searchTerm || categoryFilter || levelFilter || statusFilter || sortBy !== 'title') && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-blue-600 hover:text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-200 hover:border-blue-300 transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              />
            </div>

            {/* Filtre par catégorie */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Filtre par niveau */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            >
              <option value="">Tous les niveaux</option>
              <option value="Débutant">Débutant</option>
              <option value="Intermédiaire">Intermédiaire</option>
              <option value="Avancé">Avancé</option>
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            >
              <option value="title">Trier par nom</option>
              <option value="progress">Trier par progression</option>
              <option value="recent">Récemment consultés</option>
              <option value="difficulty">Trier par difficulté</option>
            </select>
          </div>
        </div>
      </Card>

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
            <div
              key={course.id}
              onClick={() => handleCourseClick(course)}
              className="group block cursor-pointer"
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden bg-white">
                {/* Image/Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white opacity-70" />
                    </div>
                  )}

                  {/* Badges sur l'image */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                    {course.status_user === 'completed' && (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Terminé
                      </span>
                    )}
                  </div>

                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Play className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Titre et catégorie */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                        {course.title}
                      </h3>
                    </div>

                    {course.category && (
                      <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {course.category.name}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Statistiques */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {course.chaptersCount || 0} chapitres
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.estimatedDuration || course.duration}min
                    </div>
                    {course.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-400" />
                        {course.rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Instructeur */}
                  {course.instructor && (
                    <div className="flex items-center gap-3">
                      {course.instructor.photoUrl ? (
                        <img
                          src={course.instructor.photoUrl}
                          alt={course.instructor.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-gray-100"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{course.instructor.name}</div>
                        <div className="text-xs text-gray-500">{course.instructor.title}</div>
                      </div>
                    </div>
                  )}

                  {/* Progression */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Progression</span>
                      <span className="text-sm font-bold text-blue-600">{course.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${course.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Action et statut */}
                  <div className="flex justify-between items-center pt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(course.status_user || 'not-started')}`}>
                      {course.status_user === 'completed' ? 'Terminé' :
                        course.status_user === 'in-progress' ? 'En cours' :
                          'Commencer'}
                    </span>
                    <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-800 flex items-center gap-1">
                      {course.status_user === 'completed' ? 'Revoir' :
                        course.status_user === 'in-progress' ? 'Continuer' :
                          'Commencer'}
                      <Play className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;