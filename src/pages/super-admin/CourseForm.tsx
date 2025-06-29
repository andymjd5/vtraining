import React, { useState, useEffect, useRef } from 'react';
import {
  X, Save, FileVideo, User, BookOpen, Settings,
  Image as ImageIcon, Search, Plus, ChevronDown
} from 'lucide-react';
import { uploadCourseIntroVideo } from '../../lib/uploadCourseIntroVideo';
import CourseContentEditor from '../../components/course-editor/CourseContentEditor';
import { courseService } from '../../services/courseService';
import { instructorService } from '../../services/instructorService';
import { categoryService } from '../../services/categoryService';
import {
  Course,
  ChapterWithSections
} from '../../types/course';

// Interface locale pour le formulaire
interface CourseFormData {
  title: string;
  description: string;
  categoryId: string;
  level: string;
  duration: number;
  status: 'draft' | 'published';  // État du cours
  instructorId?: string;  // Référence à un profil d'instructeur existant
  instructorName: string;
  instructorTitle: string;
  instructorBio: string;
  instructorPhotoUrl?: string;
}

interface CourseFormProps {
  course?: Course | null;
  onClose: () => void;
  onSave: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ course, onClose, onSave }) => {
  // Liste des catégories
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  // États pour les informations de base du cours
  const [formData, setFormData] = useState<CourseFormData>({
    title: course?.title || '',
    description: course?.description || '',
    categoryId: course?.categoryId || (categories[0]?.id || ''),
    level: course?.level || 'Débutant',
    duration: course?.duration || 0,
    status: course?.status || 'draft',
    instructorId: course?.instructorId,
    instructorName: '',
    instructorTitle: '',
    instructorBio: '',
  });// États pour les fichiers
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // États pour le contenu structuré
  const [chapters, setChapters] = useState<ChapterWithSections[]>([]);
  const [currentView, setCurrentView] = useState<'basic' | 'content'>('basic');

  // États pour la progression et l'URL de la vidéo
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>(course?.videoUrl || '');
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  // Nouveaux états pour les instructeurs
  const [instructors, setInstructors] = useState<any[]>([]);
  const [isLoadingInstructors, setIsLoadingInstructors] = useState(false);
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [createNewInstructor, setCreateNewInstructor] = useState(!formData.instructorId);
  const instructorDropdownRef = useRef<HTMLDivElement>(null);

  // Nouveaux états pour les catégories
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [createNewCategory, setCreateNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];
  // Charger les catégories lors de l'initialisation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await categoryService.getAllCategories();
        setCategories(categoriesData);

        if (categoriesData.length > 0 && !formData.categoryId) {
          setFormData(prev => ({ ...prev, categoryId: categoriesData[0].id }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Charger les données complètes du cours
  useEffect(() => {
    const loadCourseData = async () => {
      if (!course || !course.id) return;

      try {
        // Charger le cours avec sa structure complète
        const courseWithStructure = await courseService.loadCourseWithStructure(course.id);

        // Mettre à jour l'état des chapitres
        setChapters(courseWithStructure.chapters || []);

        // Mettre à jour les données de l'instructeur
        if (courseWithStructure.instructorId) {
          const instructor = courseWithStructure.instructor;

          setFormData(prev => ({
            ...prev,
            instructorId: courseWithStructure.instructorId,
            instructorName: instructor?.name || '',
            instructorTitle: instructor?.title || '',
            instructorBio: instructor?.bio || '',
            instructorPhotoUrl: instructor?.photoUrl || '',
          }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement du cours:', error);
      }
    };

    loadCourseData();
  }, [course]);

  // Charger les instructeurs
  useEffect(() => {
    const fetchInstructors = async () => {
      setIsLoadingInstructors(true);
      try {
        const instructorsData = await instructorService.getInstructors();
        setInstructors(instructorsData);
      } catch (error) {
        console.error('Erreur lors du chargement des instructeurs:', error);
      } finally {
        setIsLoadingInstructors(false);
      }
    };

    fetchInstructors();
  }, []);

  // Gestion des clics en dehors des dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (instructorDropdownRef.current && !instructorDropdownRef.current.contains(event.target as Node)) {
        setShowInstructorDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Gestion des changements dans le formulaire de base
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  // Gestion des uploads de fichiers
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoUploadProgress(0);
    setVideoUploadError(null);

    try {
      const result = await uploadCourseIntroVideo(file, (progress) => setVideoUploadProgress(progress));
      setVideoUrl(result.url);
      setVideoUploadProgress(null);
    } catch (err: any) {
      setVideoUploadError('Erreur lors de l\'upload de la vidéo.');
      setVideoUploadProgress(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoFile(file);
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.categoryId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setUploading(true);

    try {
      let instructorId = formData.instructorId;

      // Si l'instructeur a changé ou est nouveau, on le crée ou met à jour
      if (formData.instructorName) {
        const instructorData = {
          name: formData.instructorName,
          title: formData.instructorTitle,
          bio: formData.instructorBio,
          photoUrl: formData.instructorPhotoUrl
        }; if (instructorId) {
          await instructorService.saveInstructor({
            ...instructorData,
            id: instructorId
          }, false);
        } else {
          instructorId = await instructorService.saveInstructor(instructorData, true);
        }
      }      // Préparation des données du cours
      const courseData: Partial<Course> = {
        id: course?.id,
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        level: formData.level,
        duration: formData.duration,
        videoUrl,
        instructorId,
        status: formData.status,
        assignedTo: course?.assignedTo || [],
        chaptersOrder: chapters.map(ch => ch.id)
      };

      // Sauvegarde du cours
      let courseId: string;

      if (course?.id) {
        await courseService.updateCourse(course.id, courseData);
        courseId = course.id;
      } else {
        courseId = await courseService.saveCourse(courseData);
      }

      // Sauvegarder les chapitres et sections
      if (chapters.length > 0) {
        await courseService.saveChaptersAndSections(courseId, chapters);
      }

      // Si un nouvel instructeur, l'associer au cours
      if (instructorId && !formData.instructorId) {
        await courseService.associateInstructorWithCourse(instructorId, courseId);
      }

      onSave();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du cours');
    } finally {
      setUploading(false);
    }
  };

  // Gestion du contenu modulaire
  const handleChaptersChange = (updatedChapters: ChapterWithSections[]) => {
    setChapters(updatedChapters);
  };

  // Filtrer les instructeurs
  const filteredInstructors = instructors.filter(instructor =>
    instructor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // Sélectionner un instructeur
  const handleSelectInstructor = (instructor: any) => {
    setFormData({
      ...formData,
      instructorId: instructor.id,
      instructorName: instructor.name,
      instructorTitle: instructor.title || '',
      instructorBio: instructor.bio || '',
      instructorPhotoUrl: instructor.photoUrl || ''
    });
    setShowInstructorDropdown(false);
  };

  // Filtrer les catégories
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  // Sélectionner une catégorie
  const handleSelectCategory = (category: any) => {
    setFormData({ ...formData, categoryId: category.id });
    setShowCategoryDropdown(false);
    setCategorySearchTerm('');
  };
  // Créer une nouvelle catégorie
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      // Créer la nouvelle catégorie via le service
      const newCategoryId = await categoryService.createCategory(newCategoryName.trim());

      // Ajouter à l'état local
      const newCategory = {
        id: newCategoryId,
        name: newCategoryName.trim(),
        createdAt: new Date()
      };
      setCategories(prev => [...prev, newCategory]);

      // Sélectionner la nouvelle catégorie
      setFormData({ ...formData, categoryId: newCategory.id });

      // Réinitialiser les états
      setNewCategoryName('');
      setCreateNewCategory(false);
      setShowCategoryDropdown(false);
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la création de la catégorie');
    }
  };

  // Rendu du formulaire de base
  const renderBasicForm = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Informations du cours */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-500 text-white p-2 rounded-full">
            <Settings className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Informations du Cours
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du cours *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="Ex: Introduction à la justice transitionnelle"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description courte
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
              placeholder="Description courte du cours..."
            />
          </div>          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Catégorie *
              </label>
              <button
                type="button"
                onClick={() => setCreateNewCategory(!createNewCategory)}
                className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                {createNewCategory ? (
                  <>
                    <Search className="h-4 w-4" />
                    Sélectionner une catégorie existante
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Créer une nouvelle catégorie
                  </>
                )}
              </button>
            </div>

            {createNewCategory ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nom de la nouvelle catégorie"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Appuyez sur Entrée ou cliquez sur + pour créer la catégorie
                </p>
              </div>
            ) : (
              <div className="relative" ref={categoryDropdownRef}>
                <div
                  className="flex items-center justify-between w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <span className={formData.categoryId ? 'text-gray-900' : 'text-gray-500'}>
                    {formData.categoryId
                      ? categories.find(c => c.id === formData.categoryId)?.name || 'Catégorie inconnue'
                      : 'Sélectionner une catégorie...'
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>

                {showCategoryDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          value={categorySearchTerm}
                          onChange={(e) => setCategorySearchTerm(e.target.value)}
                          placeholder="Rechercher une catégorie..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map(category => (
                          <div
                            key={category.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                            onClick={() => handleSelectCategory(category)}
                          >
                            <span className="text-gray-900">{category.name}</span>
                            {formData.categoryId === category.id && (
                              <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center">
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {categorySearchTerm ? 'Aucune catégorie trouvée' : 'Aucune catégorie disponible'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              >
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min={0}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Statut du cours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Statut du cours
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={formData.status === 'draft'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${formData.status === 'draft'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}>
                  <div className={`w-3 h-3 rounded-full ${formData.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}></div>
                  <div>
                    <div className="font-medium">Brouillon</div>
                    <div className="text-xs opacity-75">Cours en cours de création</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={formData.status === 'published'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${formData.status === 'published'
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}>
                  <div className={`w-3 h-3 rounded-full ${formData.status === 'published' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  <div>
                    <div className="font-medium">Publié</div>
                    <div className="text-xs opacity-75">Disponible pour les étudiants</div>
                  </div>
                </div>
              </label>
            </div>            <p className="text-xs text-gray-500 mt-2">
              {formData.status === 'draft'
                ? '📝 Le cours n\'est pas visible par les étudiants et peut être modifié librement'
                : '✅ Le cours est visible et accessible aux étudiants assignés'
              }
            </p>

            {formData.status === 'published' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-500 mt-0.5">ℹ️</div>
                  <div className="text-xs text-blue-700">
                    <div className="font-medium mb-1">Cours publié</div>
                    <div>Une fois publié, le cours sera immédiatement disponible pour tous les étudiants des entreprises assignées. Assurez-vous que le contenu est complet et vérifié.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vidéo d'introduction
            </label>            <div className="flex items-center">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                id="video-upload"
                className="hidden"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex items-center px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FileVideo className="h-5 w-5 mr-2" />
                Choisir une vidéo
              </label>
              {videoUrl && (
                <span className="ml-3 text-sm text-green-600">Vidéo téléchargée</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Formats supportés : MP4, AVI, MKV. Taille maximale : 500 Mo.
            </p>
            {videoUploadProgress !== null && (
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${videoUploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            {videoUploadError && (
              <p className="mt-2 text-sm text-red-500">{videoUploadError}</p>
            )}
          </div>

          {videoUrl && <video controls className="mt-2 w-full rounded-lg">
            <source src={videoUrl} type="video/mp4" />
            Votre navigateur ne prend pas en charge la lecture de vidéos.
          </video>}
        </div>
      </div>

      {/* Informations de l'instructeur */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 text-white p-2 rounded-full">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Informations de l'Instructeur
            </h3>
          </div>

          {/* Bouton pour basculer entre création et sélection */}
          <button
            type="button"
            onClick={() => setCreateNewInstructor(!createNewInstructor)}
            className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            {createNewInstructor ? (
              <>
                <Search className="h-4 w-4" />
                Sélectionner un instructeur existant
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Créer un nouvel instructeur
              </>
            )}
          </button>
        </div>

        {!createNewInstructor ? (
          <div className="space-y-4">
            {/* Sélection d'un instructeur existant */}
            <div className="relative" ref={instructorDropdownRef}>
              <div
                className="flex items-center justify-between w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer"
                onClick={() => setShowInstructorDropdown(!showInstructorDropdown)}
              >
                {formData.instructorId ? (
                  <div className="flex items-center gap-3">
                    {formData.instructorPhotoUrl ? (
                      <img
                        src={formData.instructorPhotoUrl}
                        alt={formData.instructorName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{formData.instructorName}</div>
                      <div className="text-sm text-gray-500">{formData.instructorTitle}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Sélectionner un instructeur...</span>
                )}
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>

              {showInstructorDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher un instructeur..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {isLoadingInstructors ? (
                      <div className="p-4 text-center text-gray-500">Chargement...</div>
                    ) : filteredInstructors.length > 0 ? (
                      filteredInstructors.map(instructor => (
                        <div
                          key={instructor.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                          onClick={() => handleSelectInstructor(instructor)}
                        >
                          {instructor.photoUrl ? (
                            <img
                              src={instructor.photoUrl}
                              alt={instructor.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{instructor.name}</div>
                            <div className="text-sm text-gray-500">{instructor.title}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Aucun instructeur trouvé
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Afficher les informations de l'instructeur sélectionné */}
            {formData.instructorId && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Informations de l'instructeur</h4>
                <p className="text-sm mb-2"><span className="font-medium">Nom:</span> {formData.instructorName}</p>
                <p className="text-sm mb-2"><span className="font-medium">Titre:</span> {formData.instructorTitle}</p>
                <p className="text-sm">
                  <span className="font-medium">Bio:</span>
                  <span className="block mt-1 text-gray-600">{formData.instructorBio || "Aucune biographie disponible"}</span>
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setCreateNewInstructor(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Modifier les informations
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Formulaire pour créer/modifier un instructeur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'instructeur
              </label>
              <input
                type="text"
                name="instructorName"
                value={formData.instructorName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Nom complet"
              />
            </div>

            {/* Les autres champs d'instructeur existants restent inchangés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre / Poste
              </label>
              <input
                type="text"
                name="instructorTitle"
                value={formData.instructorTitle}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Ex: Professeur en droit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo de profil
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex items-center px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Choisir une photo
                </label>
                {photoFile && (
                  <span className="ml-3 text-sm text-green-600">
                    {photoFile.name}
                  </span>
                )}
                {formData.instructorPhotoUrl && !photoFile && (
                  <span className="ml-3 text-sm text-green-600">
                    Photo existante
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biographie
              </label>
              <textarea
                name="instructorBio"
                value={formData.instructorBio}
                onChange={handleInputChange}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                placeholder="Biographie détaillée de l'instructeur..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Rendu de l'éditeur de contenu
  const renderContentEditor = () => (
    <div className="h-[600px]">
      <CourseContentEditor
        chapters={chapters}
        onChaptersChange={handleChaptersChange}
        courseId={course?.id || 'new-course'}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[90vh] overflow-auto shadow-xl">
        <div className="flex flex-col h-full">          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-900">
                {course ? 'Modifier le cours' : 'Créer un nouveau cours'}
              </h2>
              {course && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${formData.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {formData.status === 'published' ? '✅ Publié' : '📝 Brouillon'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex items-center gap-2 p-4 ${currentView === 'basic'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-500 hover:text-gray-900'
                }`}
              onClick={() => setCurrentView('basic')}
            >
              <Settings className="h-5 w-5" />
              Informations de base
            </button>
            <button
              className={`flex items-center gap-2 p-4 ${currentView === 'content'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-500 hover:text-gray-900'
                }`}
              onClick={() => setCurrentView('content')}
            >
              <BookOpen className="h-5 w-5" />
              Contenu du cours
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            {currentView === 'basic' ? renderBasicForm() : renderContentEditor()}            <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center gap-2 ${formData.status === 'published'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                  }`}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full"></span>
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>
                      {formData.status === 'published' ? 'Publier le cours' : 'Enregistrer en brouillon'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseForm;
