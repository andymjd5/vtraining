import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from "../../../lib/firebase";
import { Plus, Edit2, Trash2, Users, Clock, BookOpen } from 'lucide-react';
import CourseForm from '../../components/courses/CourseForm';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  videoUrl?: string;
  assignedTo: string[];
  createdAt: any;
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      setCourses(coursesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setShowForm(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowForm(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'débutant':
        return 'bg-green-100 text-green-800';
      case 'intermédiaire':
        return 'bg-yellow-100 text-yellow-800';
      case 'avancé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'informatique':
        return '💻';
      case 'droits humains':
        return '⚖️';
      case 'justice transitionnelle':
        return '🏛️';
      case 'accompagnement psychologique':
        return '🧠';
      case 'anglais':
        return '🇬🇧';
      default:
        return '📚';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestion des formations
        </h1>
        <p className="text-gray-600">
          Créez, gérez et attribuez des cours aux entreprises partenaires
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Cours disponibles
              </h2>
              <p className="text-gray-600">
                {courses.length} cours au total
              </p>
            </div>
          </div>
          
          <button
            onClick={handleAddCourse}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Ajouter un cours
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun cours disponible
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez par créer votre premier cours de formation
          </p>
          <button
            onClick={handleAddCourse}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 mx-auto"
          >
            <Plus className="h-5 w-5" />
            Créer le premier cours
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Course Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">
                    {getCategoryIcon(course.category)}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)} bg-white/20 text-white`}>
                    {course.level}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-red-100 text-sm">
                  {course.category}
                </p>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration}h
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.assignedTo?.length || 0} entreprises
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CourseForm
              course={selectedCourse}
              onClose={() => setShowForm(false)}
              onSave={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;