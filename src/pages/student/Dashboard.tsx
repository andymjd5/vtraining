import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { BookOpen, CheckCircle, Clock, Award, Play, ChevronRight } from 'lucide-react';
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
    duration: number;
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

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  type: 'courses' | 'completed' | 'inProgress' | 'timeSpent';
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, data, type }) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case 'courses':
        return (
          <div className="space-y-4">
            {data.map((course, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{course.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {course.level}
                  </span>
                  <span className="text-xs text-gray-500">
                    {course.totalDuration}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      case 'completed':
        return (
          <div className="space-y-3">
            {data.map((course, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-600">Terminé le {new Date().toLocaleDateString()}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            ))}
          </div>
        );
      case 'inProgress':
        return (
          <div className="space-y-3">
            {data.map((course, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{course.title}</p>
                  <span className="text-sm text-gray-500">{course.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${course.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'timeSpent':
        return (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.course}</p>
                  <p className="text-sm text-gray-600">Dernière activité: {item.lastActivity}</p>
                </div>
                <span className="font-semibold text-blue-600">{item.time}</span>
              </div>
            ))}
          </div>
        );
      default:
        return <p>Aucune donnée disponible</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalTimeSpent: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    data: [],
    type: 'courses' as 'courses' | 'completed' | 'inProgress' | 'timeSpent'
  });

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
      if (loading || !user || !user.uid) {
        return;
      }

      try {
        setDataLoading(true);
        setError(null);

        const studentDoc = await getDoc(doc(db, 'users', user.uid));
        if (!studentDoc.exists()) throw new Error('Profil étudiant non trouvé');

        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
        setStudent(studentData);

        if (!studentData.companyId || studentData.companyId.trim() === '') {
          throw new Error("L'utilisateur n'est rattaché à aucune entreprise (companyId manquant).");
        }

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

        const enrollmentsRef = collection(db, 'enrollments');
        const enrollmentsQ = query(enrollmentsRef, where('userId', '==', user.uid));
        const enrollmentsSnap = await getDocs(enrollmentsQ);

        if (enrollmentsSnap.empty) {
          setStats({ totalCourses: 0, completedCourses: 0, inProgressCourses: 0, totalTimeSpent: 0 });
          setDataLoading(false);
          return;
        }

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
  }, [user, loading]);

  const openModal = (type: 'courses' | 'completed' | 'inProgress' | 'timeSpent') => {
    let title = '';
    let data: any[] = [];

    switch (type) {
      case 'courses':
        title = 'Tous les cours';
        data = courses;
        break;
      case 'completed':
        title = 'Cours terminés';
        data = courses.filter(course => course.progress === 100);
        break;
      case 'inProgress':
        title = 'Cours en cours';
        data = courses.filter(course => course.progress && course.progress > 0 && course.progress < 100);
        break;
      case 'timeSpent':
        title = 'Temps passé par cours';
        data = [
          { course: 'Introduction à la bureautique', time: '2h 30min', lastActivity: 'Hier' },
          { course: 'Droits humains avancés', time: '1h 15min', lastActivity: 'Il y a 3 jours' },
          { course: 'Justice transitionnelle', time: '45min', lastActivity: 'La semaine dernière' }
        ];
        break;
    }

    setModalState({
      isOpen: true,
      title,
      data,
      type
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      title: '',
      data: [],
      type: 'courses'
    });
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
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

      {/* Statistiques globales - Clickable Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
            className="cursor-pointer"
            onClick={() => openModal('courses')}
          >
            <div className="bg-white rounded-2xl shadow-md flex items-center p-6 hover:shadow-lg transition-shadow">
              <div className="p-3 rounded-lg bg-blue-100">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Cours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: 0.1 }}
            className="cursor-pointer"
            onClick={() => openModal('completed')}
          >
            <div className="bg-white rounded-2xl shadow-md flex items-center p-6 hover:shadow-lg transition-shadow">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cours Complétés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: 0.2 }}
            className="cursor-pointer"
            onClick={() => openModal('inProgress')}
          >
            <div className="bg-white rounded-2xl shadow-md flex items-center p-6 hover:shadow-lg transition-shadow">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En cours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgressCourses}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: 0.3 }}
            className="cursor-pointer"
            onClick={() => openModal('timeSpent')}
          >
            <div className="bg-white rounded-2xl shadow-md flex items-center p-6 hover:shadow-lg transition-shadow">
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

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                  <div className="mt-6 flex justify-end">
                    <button
                      className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
                      onClick={() => {
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

      {/* Detail Modal */}
      <DetailModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        data={modalState.data}
        type={modalState.type}
      />
    </div>
  );
};

export default Dashboard;