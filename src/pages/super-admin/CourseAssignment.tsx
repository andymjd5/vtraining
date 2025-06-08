import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';

// Types
interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  instructor: {
    name: string;
    title: string;
  };
  assignedTo?: string[];
  status: 'draft' | 'published';
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

const CourseAssignment: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  // Charger les cours
  const loadCourses = async () => {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        orderBy('createdAt', 'desc')
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      setCourses(coursesData);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
      toast.error('Erreur lors du chargement des cours');
    }
  };

  // Charger les entreprises
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
      toast.error('Erreur lors du chargement des entreprises');
    }
  };

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadCourses(), loadCompanies()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Gérer la sélection des entreprises
  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  // Affecter le cours aux entreprises
  const assignCourse = async () => {
    if (!selectedCourse || selectedCompanies.length === 0) {
      toast.error('Veuillez sélectionner un cours et au moins une entreprise');
      return;
    }

    setAssigning(true);
    try {
      const courseRef = doc(db, 'courses', selectedCourse);
      await updateDoc(courseRef, {
        assignedTo: selectedCompanies
      });

      toast.success('Cours affecté avec succès !');
      
      // Réinitialiser les sélections
      setSelectedCourse('');
      setSelectedCompanies([]);
      
      // Recharger les cours pour voir les mises à jour
      await loadCourses();
    } catch (error) {
      console.error('Erreur lors de l\'affectation:', error);
      toast.error('Erreur lors de l\'affectation du cours');
    } finally {
      setAssigning(false);
    }
  };

  // Obtenir les initiales d'une entreprise
  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Obtenir le cours sélectionné
  const selectedCourseData = courses.find(course => course.id === selectedCourse);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Affectation des Formations
          </h1>
          <p className="text-gray-600">
            Attribuez des cours aux entreprises partenaires
          </p>
        </div>

        {/* Sélection du cours */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
              📚
            </div>
            Sélectionner un Cours
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cours disponibles
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              >
                <option value="">Choisir un cours...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title} - {course.category}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedCourseData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedCourseData.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {selectedCourseData.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {selectedCourseData.category}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {selectedCourseData.level}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    {selectedCourseData.duration}h
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sélection des entreprises */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Liste des entreprises */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                  🏢
                </div>
                Entreprises Partenaires
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedCompanies.length} entreprise(s) sélectionnée(s)
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {companies.map(company => (
                <div
                  key={company.id}
                  className={`px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedCompanies.includes(company.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => toggleCompanySelection(company.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
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
                    
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedCompanies.includes(company.id)
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {selectedCompanies.includes(company.id) && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé de l'affectation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                  🎯
                </div>
                Résumé de l'Affectation
              </h3>
            </div>
            
            <div className="p-6">
              {selectedCourse && selectedCompanies.length > 0 ? (
                <div className="space-y-4">
                  {/* Cours sélectionné */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cours :</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          📖
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedCourseData?.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedCourseData?.instructor.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Entreprises sélectionnées */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Entreprises ({selectedCompanies.length}) :
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedCompanies.map(companyId => {
                        const company = companies.find(c => c.id === companyId);
                        return company ? (
                          <div key={companyId} className="bg-green-50 border border-green-200 rounded-lg p-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded text-white text-xs font-bold flex items-center justify-center">
                                {getCompanyInitials(company.name)}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {company.name}
                              </span>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* Bouton d'affectation */}
                  <button
                    onClick={assignCourse}
                    disabled={assigning}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {assigning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Affectation en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>🎯</span>
                        <span>Affecter le Cours</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <p className="text-gray-500">
                    Sélectionnez un cours et des entreprises pour commencer l'affectation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Actions Rapides
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setSelectedCompanies(companies.map(c => c.id))}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-medium transition-colors"
            >
              Sélectionner toutes les entreprises
            </button>
            <button
              onClick={() => setSelectedCompanies([])}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Désélectionner tout
            </button>
            <button
              onClick={() => {
                setSelectedCourse('');
                setSelectedCompanies([]);
              }}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseAssignment;