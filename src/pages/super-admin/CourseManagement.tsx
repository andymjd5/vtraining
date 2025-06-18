import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from "../../lib/firebase";
import { Plus, Edit2, Trash2, Users, Clock, BookOpen, Building2, X, Filter, Search } from 'lucide-react';
import CourseForm from './CourseForm';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string; // Ajout de la sous-catégorie
  level: string;
  duration: number;
  videoUrl?: string;
  assignedTo: string[];
  createdAt: any;
}

interface Company {
  id: string;
  name: string;
  email: string;
  employeesCount: number;
  industry: string;
  logoUrl?: string;
  createdAt: any;
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  // États pour les filtres
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('');
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

  // Charger les entreprises
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesQuery = query(
          collection(db, 'companies'),
          orderBy('name', 'asc')
        );
        const companiesSnapshot = await getDocs(companiesQuery);
        const companiesData = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Company[];
        setCompanies(companiesData);
      } catch (error) {
        console.error('Erreur lors du chargement des entreprises:', error);
      }
    };
    loadCompanies();
  }, []);

  // Calcul des catégories et sous-catégories disponibles
  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(courses.map(course => course.category).filter(Boolean)));
    return categories.sort();
  }, [courses]);

  const availableSubcategories = useMemo(() => {
    const subcategories = Array.from(new Set(
      courses
        .filter(course => !filterCategory || course.category === filterCategory)
        .map(course => course.subcategory)
        .filter(Boolean)
    ));
    return subcategories.sort();
  }, [courses, filterCategory]);

  // Filtrage des cours
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesCategory = !filterCategory || course.category === filterCategory;
      const matchesSubcategory = !filterSubcategory || course.subcategory === filterSubcategory;
      const matchesSearch = !searchTerm || 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.subcategory && course.subcategory.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesCategory && matchesSubcategory && matchesSearch;
    });
  }, [courses, filterCategory, filterSubcategory, searchTerm]);

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
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
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
      setShowAssignModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'affectation:', error);
    } finally {
      setAssigning(false);
    }
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
    return colors[category.toLowerCase()] || colors.default;
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

  const clearFilters = () => {
    setFilterCategory('');
    setFilterSubcategory('');
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

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
          {(filterCategory || filterSubcategory || searchTerm) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-red-600 hover:text-red-800 underline"
            >
              Effacer les filtres
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
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

          {/* Filtre par catégorie */}
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterSubcategory(''); // Reset sous-catégorie quand on change de catégorie
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Toutes les catégories</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Filtre par sous-catégorie */}
          <select
            value={filterSubcategory}
            onChange={(e) => setFilterSubcategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={!filterCategory || availableSubcategories.length === 0}
          >
            <option value="">Toutes les sous-catégories</option>
            {availableSubcategories.map(subcategory => (
              <option key={subcategory} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </select>
        </div>

        {/* Indicateurs de filtres actifs */}
        {(filterCategory || filterSubcategory || searchTerm) && (
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
                Catégorie: {filterCategory}
                <button
                  onClick={() => {
                    setFilterCategory('');
                    setFilterSubcategory('');
                  }}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filterSubcategory && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                Sous-catégorie: {filterSubcategory}
                <button
                  onClick={() => setFilterSubcategory('')}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
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
                {filteredCourses.length} cours affichés sur {courses.length} au total
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
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
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
            <button
              onClick={handleAddCourse}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              Créer le premier cours
            </button>
          ) : (
            <button
              onClick={clearFilters}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <Filter className="h-5 w-5" />
              Effacer les filtres
            </button>
          )}
        </div>
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
                    {getCategoryIcon(course.category)}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)} bg-white/20 text-white`}>
                    {course.level}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 line-clamp-2">
                  {course.title}
                </h3>
                
                {/* Catégorie et sous-catégorie */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(course.category)} bg-white/90`}>
                    {course.category}
                  </span>
                  {course.subcategory && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                      {course.subcategory}
                    </span>
                  )}
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
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleAssignCourse(course)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Affecter
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

      {/* Assignment Modal */}
      {showAssignModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedCompanies.includes(company.id) ? 'bg-blue-50 border-blue-200' : ''
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
                            {company.employeesCount} employés • {company.industry}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedCompanies.includes(company.id)
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
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={assigning}
              >
                Annuler
              </button>
              <button
                onClick={saveAssignment}
                disabled={assigning}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {assigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sauvegarde...
                  </>
                ) : (
                  'Sauvegarder'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;