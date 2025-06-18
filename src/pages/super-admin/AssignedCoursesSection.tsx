import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BadgeCheck, Calendar, User, Clock, X } from 'lucide-react';

const COURSE_CATEGORIES = [
  'Justice transitionnelle',
  'Droits humains',
  'Droit international humanitaire',
  'Finances & Comptabilité',
  'Droit',
  'Management',
  'Gouvernance',
  'Économie',
  'Informatique',
  'Cours linguistiques',
  'Statistiques',
  'Politique',
  'Médecine',
];

interface Course {
  id: string;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  assignedTo: string[];
  duration?: number;
  level?: string;
  instructor?: { name: string; title?: string; };
  createdAt?: any;
  updatedAt?: any;
}

interface AssignedCoursesSectionProps {
  companyId: string;
}

const AssignedCoursesSection: React.FC<AssignedCoursesSectionProps> = ({ companyId }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchAssignedCourses = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'courses'),
          where('assignedTo', 'array-contains', companyId)
        );
        const querySnapshot = await getDocs(q);
        const result: Course[] = [];
        querySnapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() } as Course);
        });
        result.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
        });
        setCourses(result);
      } catch (err) {
        console.error('Erreur lors du chargement des cours affectés:', err);
        setError('Erreur lors du chargement des cours');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedCourses();
  }, [companyId]);

  const filteredCourses = categoryFilter
    ? courses.filter((course) => course.category === categoryFilter)
    : courses;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (err) {
      return '';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Justice transitionnelle': 'bg-purple-100 text-purple-700',
      'Droits humains': 'bg-blue-100 text-blue-700',
      'Droit international humanitaire': 'bg-red-100 text-red-700',
      'Finances & Comptabilité': 'bg-green-100 text-green-700',
      'Droit': 'bg-indigo-100 text-indigo-700',
      'Management': 'bg-orange-100 text-orange-700',
      'Gouvernance': 'bg-yellow-100 text-yellow-700',
      'Économie': 'bg-teal-100 text-teal-700',
      'Informatique': 'bg-cyan-100 text-cyan-700',
      'Cours linguistiques': 'bg-pink-100 text-pink-700',
      'Statistiques': 'bg-gray-100 text-gray-700',
      'Politique': 'bg-rose-100 text-rose-700',
      'Médecine': 'bg-emerald-100 text-emerald-700',
    };
    return colors[category as keyof typeof colors] || 'bg-blue-100 text-blue-700';
  };

  // Fermeture de la modale avec Échap
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && selectedCourse) {
      setSelectedCourse(null);
    }
  }, [selectedCourse]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Empêcher le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (selectedCourse) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedCourse]);

  // ----------- Modale d'affichage du détail d'un cours -----------
  const CourseDetailsModal = ({ course, onClose }: { course: Course, onClose: () => void }) => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h3>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(course.category)}`}>
                  {course.category}
                </span>
                {course.subcategory && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                    {course.subcategory}
                  </span>
                )}
                {course.level && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Niveau {course.level}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          {course.description && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700 leading-relaxed">{course.description}</p>
            </div>
          )}

          {/* Informations détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations générales */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Informations</h4>
              <div className="space-y-3">
                {course.instructor && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <span className="font-medium">{course.instructor.name}</span>
                      {course.instructor.title && (
                        <span className="text-gray-500 ml-1">({course.instructor.title})</span>
                      )}
                    </div>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{course.duration} heures de formation</span>
                  </div>
                )}
                {course.createdAt && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                    <span>Créé le {formatDate(course.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques ou autres infos */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Détails</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Catégorie :</span>
                    <span className="font-medium">{course.category}</span>
                  </div>
                  {course.subcategory && (
                    <div className="flex justify-between">
                      <span>Sous-catégorie :</span>
                      <span className="font-medium">{course.subcategory}</span>
                    </div>
                  )}
                  {course.level && (
                    <div className="flex justify-between">
                      <span>Niveau :</span>
                      <span className="font-medium">{course.level}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Statut :</span>
                    <span className="font-medium text-green-600">Disponible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
              Commencer le cours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  // ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BadgeCheck className="text-primary-600 h-6 w-6" />
            Cours affectés à mon entreprise
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Chargement des cours...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BadgeCheck className="text-primary-600 h-6 w-6" />
            Cours affectés à mon entreprise
          </h2>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="text-primary-600 hover:text-primary-700 text-sm underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BadgeCheck className="text-primary-600 h-6 w-6" />
            Cours affectés à mon entreprise
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredCourses.length} cours disponible{filteredCourses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          value={categoryFilter || ''}
          onChange={(e) => setCategoryFilter(e.target.value || null)}
        >
          <option value="">Toutes les catégories</option>
          {COURSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BadgeCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {categoryFilter ? 'Aucun cours dans cette catégorie' : 'Aucun cours affecté'}
          </h3>
          <p className="text-gray-500">
            {categoryFilter
              ? 'Essayez de sélectionner une autre catégorie.'
              : "Aucun cours n'a encore été affecté à votre entreprise."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:shadow-md transition-all duration-200 bg-gray-50 flex flex-col">
              {/* Header avec titre et badges */}
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2">
                  {course.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(course.category)}`}>
                    {course.category}
                  </span>
                  {course.subcategory && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                      {course.subcategory}
                    </span>
                  )}
                  {course.level && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {course.level}
                    </span>
                  )}
                </div>
              </div>
              {/* Description */}
              {course.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {course.description}
                </p>
              )}
              {/* Métadonnées */}
              <div className="space-y-2 mb-4">
                {course.instructor && (
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="h-3 w-3 mr-1" />
                    <span>{course.instructor.name}</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{course.duration}h de formation</span>
                  </div>
                )}
                {course.createdAt && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Créé le {formatDate(course.createdAt)}</span>
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="mt-auto">
                <button
                  onClick={() => setSelectedCourse(course)}
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
                >
                  Voir les détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale détail cours */}
      {selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
};

export default AssignedCoursesSection;