import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../config/firebase';
import { Play, Clock, User, BookOpen, Star, ChevronRight, Filter } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  category: string; // Obligatoire
  subcategory?: string; // Optionnel
  instructor: {
    name: string;
    title: string;
    avatar?: string;
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

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentAndCourses = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Récupérer les données de l'étudiant
        const studentDoc = await getDoc(doc(db, 'users', user.uid));
        if (!studentDoc.exists()) {
          throw new Error('Profil étudiant non trouvé');
        }

        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
        setStudent(studentData);

        // Récupérer les cours assignés à l'entreprise de l'étudiant
        const coursesQuery = query(
          collection(db, 'courses'),
          where('assignedTo', 'array-contains', studentData.companyId)
        );

        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Course[];

        setCourses(coursesData);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndCourses();
  }, [user]);

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

  const getCategoryColor = (category: string) => {
    // Couleurs pour les catégories - vous pouvez personnaliser selon vos catégories
    const colors = {
      'Développement Web': 'bg-blue-500 text-white',
      'Design': 'bg-purple-500 text-white',
      'Marketing': 'bg-pink-500 text-white',
      'Gestion': 'bg-orange-500 text-white',
      'Communication': 'bg-green-500 text-white',
      'Techniques': 'bg-red-500 text-white',
      'Formation': 'bg-indigo-500 text-white',
      'default': 'bg-gray-500 text-white'
    };
    return colors[category as keyof typeof colors] || colors.default;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? mins + 'min' : ''}`;
    }
    return `${mins}min`;
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

  // Optionnel : fonction pour récupérer les catégories uniques (pour un futur filtre)
  const getUniqueCategories = () => {
    return [...new Set(courses.map(course => course.category))];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos cours...</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tableau de Bord Étudiant
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenue {student?.name}, découvrez vos cours assignés
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Cours disponibles</p>
                <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
              </div>
              {/* Optionnel : Bouton pour un futur filtre par catégorie */}
              {/* 
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span>Filtrer</span>
              </button>
              */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Course Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Catégorie et sous-catégorie */}
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(course.category)}`}>
                          {course.category}
                        </span>
                        {course.subcategory && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                            {course.subcategory}
                          </span>
                        )}
                      </div>
                      
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
                            {course.instructor.avatar ? (
                              <img 
                                src={course.instructor.avatar} 
                                alt={course.instructor.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              course.instructor.name.split(' ').map(n => n[0]).join('').toUpperCase()
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{course.instructor.name}</h3>
                            <p className="text-sm text-gray-600">{course.instructor.title}</p>
                          </div>
                        </div>
                        {course.instructor.bio && (
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
                        {course.chapters.slice(0, 5).map((chapter, index) => (
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
                        ))}
                        {course.chapters.length > 5 && (
                          <div className="text-center pt-2">
                            <span className="text-sm text-gray-500">
                              +{course.chapters.length - 5} autres chapitres
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
    </div>
  );
};

export default StudentDashboard;