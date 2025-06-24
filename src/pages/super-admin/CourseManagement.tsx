import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from "../../lib/firebase";
import { Plus, Edit2, Trash2, Users, Clock, BookOpen, Building2, X, Filter, Search } from 'lucide-react';
import CourseForm from './CourseForm';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';

interface Course {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  level: string;
  duration: number;
  videoUrl?: string;
  assignedTo: string[];
  createdAt: any;
}

const CourseManagement: React.FC = () => {
  const { success, error: showError } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  // States for filters
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  // Charger les catégories Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const fetchCompanies = async () => {
      const companiesSnap = await getDocs(collection(db, 'companies'));
      setCompanies(companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCategories();
    fetchCompanies();
  }, []);

  // Adapter les filtres pour utiliser categoryId
  const availableCategories = useMemo(() => {
    const ids = Array.from(new Set(courses.map(course => course.categoryId).filter(Boolean)));
    return ids.map(id => {
      const cat = categories.find(c => c.id === id);
      return cat ? cat : { id, name: id };
    });
  }, [courses, categories]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesCategory = !filterCategory || course.categoryId === filterCategory;
      const matchesSearch = !searchTerm ||
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (categories.find(c => c.id === course.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [courses, filterCategory, searchTerm, categories]);

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setShowForm(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowForm(true);
  };

  const handleAssignCourse = (course: Course) => {
    setSelectedCourse(course);
    setSelectedCompanies(course.assignedTo || []);
    setShowAssignModal(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        success('Cours supprimé avec succès');
      } catch (error) {
        console.error('Error deleting course:', error);
        showError('Erreur lors de la suppression du cours');
      }
    }
  };

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const saveAssignment = async () => {
    if (!selectedCourse) return;

    setAssigning(true);
    try {
      const courseRef = doc(db, 'courses', selectedCourse.id);
      await updateDoc(courseRef, {
        assignedTo: selectedCompanies
      });
      success('Cours affecté avec succès');
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning course:', error);
      showError('Erreur lors de l\'affectation du cours');
    } finally {
      setAssigning(false);
    }
  };

  // Utilitaire pour obtenir le nom de la catégorie
  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Entreprise inconnue';
  };

  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
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

  const getCategoryColor = (category: string) => {
    const colors = {
      'informatique': 'bg-blue-100 text-blue-800',
      'droits humains': 'bg-purple-100 text-purple-800',
      'justice transitionnelle': 'bg-indigo-100 text-indigo-800',
      'accompagnement psychologique': 'bg-teal-100 text-teal-800',
      'anglais': 'bg-orange-100 text-orange-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category?.toLowerCase()] || colors.default;
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
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

  const clearFilters = () => {
    setFilterCategory('');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des formations</h1>
          <p className="text-gray-600">
            Créez, gérez et attribuez des cours aux entreprises partenaires
          </p>
        </div>
        <Button
          onClick={handleAddCourse}
          leftIcon={<Plus className="h-5 w-5" />}
          className="bg-red-600 hover:bg-red-700"
        >
          Ajouter un cours
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
            {(filterCategory || searchTerm) && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-red-600 hover:text-red-800 underline"
              >
                Effacer les filtres
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {availableCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active filter indicators */}
          {(filterCategory || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  Recherche: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterCategory && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Catégorie: {getCategoryName(filterCategory)}
                  <button
                    onClick={() => setFilterCategory('')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Action Bar */}
      <Card>
        <div className="p-6">
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
                  {filteredCourses.length} cours affichés sur {courses.length} au total
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {courses.length === 0 ? 'Aucun cours disponible' : 'Aucun cours ne correspond aux filtres'}
            </h3>
            <p className="text-gray-600 mb-6">
              {courses.length === 0
                ? 'Commencez par créer votre premier cours de formation'
                : 'Essayez de modifier ou supprimer vos filtres'
              }
            </p>
            {courses.length === 0 ? (
              <Button
                onClick={handleAddCourse}
                leftIcon={<Plus className="h-5 w-5" />}
                className="bg-red-600 hover:bg-red-700"
              >
                Créer le premier cours
              </Button>
            ) : (
              <Button
                onClick={clearFilters}
                leftIcon={<Filter className="h-5 w-5" />}
              >
                Effacer les filtres
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Course Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">
                    {getCategoryIcon(getCategoryName(course.categoryId))}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)} bg-white/20 text-white`}>
                    {course.level}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 line-clamp-2">
                  {course.title}
                </h3>

                {/* Category and subcategory */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(getCategoryName(course.categoryId))} bg-white/90`}>
                    {getCategoryName(course.categoryId)}
                  </span>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration}h
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.assignedTo?.length || 0} entreprises
                  </div>
                </div>

                {/* Assigned Companies */}
                {course.assignedTo && course.assignedTo.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Affecté à :</p>
                    <div className="flex flex-wrap gap-2">
                      {course.assignedTo.slice(0, 3).map(companyId => (
                        <div
                          key={companyId}
                          className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
                        >
                          <Building2 className="h-3 w-3" />
                          {getCompanyName(companyId)}
                        </div>
                      ))}
                      {course.assignedTo.length > 3 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{course.assignedTo.length - 3} autres
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditCourse(course)}
                    variant="outlined"
                    size="sm"
                    leftIcon={<Edit2 className="h-4 w-4" />}
                    className="flex-1"
                  >
                    Modifier
                  </Button>
                  <Button
                    onClick={() => handleAssignCourse(course)}
                    variant="outlined"
                    size="sm"
                    leftIcon={<Building2 className="h-4 w-4" />}
                    className="flex-1"
                  >
                    Affecter
                  </Button>
                  <Button
                    onClick={() => handleDeleteCourse(course.id)}
                    variant="error"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Form Modal */}
      {showForm && (
        <CourseForm
          course={selectedCourse}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            success(selectedCourse ? 'Cours mis à jour avec succès' : 'Cours créé avec succès');
          }}
        />
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Affecter le cours</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {selectedCourse.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Sélectionner les entreprises ({selectedCompanies.length} sélectionnées)
                </h3>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedCompanies(companies.map(c => c.id))}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm transition-colors"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={() => setSelectedCompanies([])}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              {/* Companies List */}
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                {companies.map(company => (
                  <div
                    key={company.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${selectedCompanies.includes(company.id) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    onClick={() => toggleCompanySelection(company.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          {getCompanyInitials(company.name)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {company.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {company.email}
                          </p>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedCompanies.includes(company.id)
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300'
                        }`}>
                        {selectedCompanies.includes(company.id) && (
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <Button
                variant="outlined"
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
              >
                Annuler
              </Button>
              <Button
                onClick={saveAssignment}
                disabled={assigning}
                isLoading={assigning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;