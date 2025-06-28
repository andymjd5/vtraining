import React, { useState, useEffect } from 'react';
import {
  X, Save, FileVideo, User, BookOpen, Settings,
  Image as ImageIcon
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { uploadCourseIntroVideo } from '../../lib/uploadCourseIntroVideo';
import CourseContentEditor from '../../components/course-editor/CourseContentEditor';
import { courseService } from '../../services/courseService';
import { instructorService } from '../../services/instructorService';
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
    instructorId: course?.instructorId,
    instructorName: '',
    instructorTitle: '',
    instructorBio: '',
  });  // États pour les fichiers
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // États pour le contenu structuré
  const [chapters, setChapters] = useState<ChapterWithSections[]>([]);
  const [currentView, setCurrentView] = useState<'basic' | 'content'>('basic');

  // États pour la progression et l'URL de la vidéo
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>(course?.videoUrl || '');
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];

  // Charger les catégories lors de l'initialisation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
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
      }

      // Préparation des données du cours
      const courseData: Partial<Course> = {
        id: course?.id,
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        level: formData.level,
        duration: formData.duration,
        videoUrl,
        instructorId,
        status: course?.status || 'draft',
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie *
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              required
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-500 text-white p-2 rounded-full">
            <User className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Informations de l'Instructeur
          </h3>
        </div>

        <div className="space-y-4">
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
            </label>            <div className="flex items-center">
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
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {course ? 'Modifier le cours' : 'Créer un nouveau cours'}
            </h2>
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
            {currentView === 'basic' ? renderBasicForm() : renderContentEditor()}

            <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
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
                    <span>Enregistrer</span>
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
