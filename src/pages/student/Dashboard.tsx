import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { BookOpen, CheckCircle, Clock, Award, Play, ChevronRight, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import CompanyFileManager from '../../components/storage/CompanyFileManager';
import { motion } from 'framer-motion';

interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  instructor: {
    name: string;
    title: string;
    photoUrl?: string;
    bio?: string;
  };
  chapters: Array<{
    id: string;
    title: string;
    duration: number; // en minutes
    completed?: boolean;
  }>;
  totalDuration: number;
  progress?: number;
  assignedTo: string[];
  createdAt: any;
}

interface Student {
  id: string;
  email: string;
  name: string;
  companyId: string;
}

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth(); // Utilisation du loading du contexte
  const location = useLocation();
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalTimeSpent: 0,
  });
  const [dataLoading, setDataLoading] = useState(true); // Loading spécifique aux données
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Debug log
  console.log("Dashboard - user:", user, "loading:", loading);

  // Fonction utilitaire pour générer les initiales
  const getInitials = (name: string): string => {
    if (!name || typeof name !== 'string') return 'NN';
    return name
      .split(' ')
      .filter((word: string) => word.trim().length > 0)
      .map((word: string) => word[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    const fetchAllData = async () => {
      // Ne pas charger les données si l'auth est encore en cours ou si pas d'utilisateur
      if (loading || !user || !user.uid) {
        return;
      }

      try {
        setDataLoading(true);
        setError(null);

        // 1. Charger le profil étudiant
        const studentDoc = await getDoc(doc(db, 'users', user.uid));
        if (!studentDoc.exists()) throw new Error('Profil étudiant non trouvé');

        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
        setStudent(studentData);

        // Vérification du companyId avant la requête Firestore
        if (!studentData.companyId || studentData.companyId.trim() === '') {
          throw new Error("L'utilisateur n'est rattaché à aucune entreprise (companyId manquant).");
        }

        // 2. Charger les cours assignés à l'entreprise
        const coursesQuery = query(
          collection(db, 'courses'),
          where('assignedTo', 'array-contains', studentData.companyId)
        );
        
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesData = coursesSnapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data()
        })) as Course[];
        setCourses(coursesData);

        
        // 3. Statistiques générales depuis "enrollments"
        const enrollmentsRef = collection(db, 'enrollments');
        const enrollmentsQ = query(enrollmentsRef, where('userId', '==', user.uid));
        const enrollmentsSnap = await getDocs(enrollmentsQ);

        // Si aucun enrollment, stats à zéro
        if (enrollmentsSnap.empty) {
          setStats({ totalCourses: 0, completedCourses: 0, inProgressCourses: 0, totalTimeSpent: 0 });
          setDataLoading(false);
          return;
        }

        // Calcul des statistiques
        const totalCourses = enrollmentsSnap.size;
        const completedCourses = enrollmentsSnap.docs.filter(docSnapshot => {
          const data = docSnapshot.data();
          return data && data.status === 'COMPLETED';
        }).length;

        const inProgressCourses = enrollmentsSnap.docs.filter(docSnapshot => {
          const data = docSnapshot.data();
          return data && data.status === 'IN_PROGRESS';
        }).length;

        const totalTimeSpent = enrollmentsSnap.docs.reduce((acc, docSnapshot) => {
          const data = docSnapshot.data();
          const timeSpent = data && typeof data.timeSpent === 'number' ? data.timeSpent : 0;
          return acc + timeSpent;
        }, 0);

        setStats({
          totalCourses,
          completedCourses,
          inProgressCourses,
          totalTimeSpent,
        });

      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setDataLoading(false);
      }
    };

    fetchAllData();
  }, [user, loading]); // Dépendance sur user ET loading

  // --- Helpers UI ---
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant':
        return 'bg-green-100 text-green-800';
      case 'Intermédiaire':
        return 'bg-yellow-100 text-yellow-800';
      case 'Avancé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || typeof minutes !== 'number') return '0min';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'min' : ''}`;
    }
    return `${remainingMinutes}min`;
  };

  const getProgressPercentage = (course: Course) => {
    if (!course.chapters || course.chapters.length === 0) return 0;
    const completedChapters = course.chapters.filter(chapter => chapter.completed).length;
    return Math.round((completedChapters / course.chapters.length) * 100);
  };

  const getButtonText = (course: Course) => {
    const progress = getProgressPercentage(course);
    return progress > 0 ? 'Continuer' : 'Démarrer';
  };

  // Navigation items
  const navigationItems = [
    {
      name: 'Tableau de bord',
      href: '/student/dashboard',
      icon: BookOpen,
      current: location.pathname === '/student/dashboard'
    },
    {
      name: 'Mes cours',
      href: '/student/courses',
      icon: Play,
      current: location.pathname === '/student/courses'
    }
  ];

  // --- Gestion des états de loading et d'erreur ---

  // 1. Si l'authentification est encore en cours d'initialisation
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // 2. Si pas d'utilisateur connecté (après que l'auth soit initialisée)
  if (!user || !user.uid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
            <p className="text-gray-600 mb-4">Vous devez être connecté pour accéder à cette page.</p>
            <Link
              to="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Si chargement des données en cours
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  // 4. Si erreur lors du chargement des données
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Rendu principal du Dashboard ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Fermer le menu</span>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    item.current
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <button
                className="md:hidden mr-4 text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bonjour, {student?.name || user?.name || 'Utilisateur'} !
                </h1>
                <p className="text-gray-600 mt-1">
                  Découvrez vos cours assignés et suivez vos progrès
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <div className="text-right">
                <p className="text-sm text-gray-500">Cours disponibles</p>
                <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
              </div>
              <Link
                to="/student/courses"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Voir mes cours</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="bg-white rounded-2xl shadow-md flex items-center p-6">
                <div className="p-3 rounded-lg bg-blue-100">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Cours</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <div className="bg-white rounded-2xl shadow-md flex items-center p-6">
                <div className="p-3 rounded-lg bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Cours Complétés</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <div className="bg-white rounded-2xl shadow-md flex items-center p-6">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">En cours</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgressCourses}</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              <div className="bg-white rounded-2xl shadow-md flex items-center p-6">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Temps passé</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.totalTimeSpent / 3600)}h</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Aperçu des cours récents */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cours récents</h2>
            <Link
              to="/student/courses"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              Voir tous les cours
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun cours disponible
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Aucun cours n'a encore été assigné à votre entreprise.
                Contactez votre administrateur pour plus d'informations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {courses.slice(0, 4).map((course) => (
                <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Course Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
                        <p className="text-blue-100 mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(course.level)}`}>
                            {course.level}
                          </span>
                          <div className="flex items-center text-blue-100">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="text-sm">{formatDuration(course.totalDuration)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Instructor Info */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-600">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {course.instructor?.photoUrl ? (
                                <img
                                  src={course.instructor.photoUrl}
                                  alt={course.instructor.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span>
                                  {course.instructor?.name ? getInitials(course.instructor.name) : 'NN'}
                              </span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{course.instructor?.name || 'Instructeur'}</h3>
                              <p className="text-sm text-gray-600">{course.instructor?.title || 'Formateur'}</p>
                            </div>
                          </div>
                          {course.instructor?.bio && (
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {course.instructor.bio}
                            </p>
                          )}
                        </div>

                        {/* Progress */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progression</span>
                            <span className="text-sm font-bold text-blue-600">{getProgressPercentage(course)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getProgressPercentage(course)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Chapters List */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <div className="w-6 h-6 bg-blue-600 rounded mr-2"></div>
                          Plan du Cours
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {course.chapters?.slice(0, 3).map((chapter, index) => (
                            <div key={chapter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                  chapter.completed
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-600 text-white'
                                }`}>
                                  {chapter.completed ? '✓' : index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{chapter.title}</p>
                                  <p className="text-xs text-gray-500">{formatDuration(chapter.duration)}</p>
                                </div>
                              </div>
                            </div>
                          )) || []}
                          {(course.chapters?.length || 0) > 3 && (
                            <div className="text-center pt-2">
                              <span className="text-sm text-gray-500">
                                +{(course.chapters?.length || 0) - 3} autres chapitres
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 flex justify-end">
                      <button
                        className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
                        onClick={() => {
                          // Navigation vers le cours (à implémenter)
                          console.log(`Navigating to course: ${course.id}`);
                        }}
                      >
                        <Play className="w-5 h-5" />
                        <span>{getButtonText(course)}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Company files section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
            <h2 className="text-xl font-bold mb-4">Fichiers & Ressources de l'entreprise</h2>
            <CompanyFileManager />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;