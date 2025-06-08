import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { X, Upload, Save, FileVideo, User, BookOpen, Settings } from 'lucide-react';

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

interface CourseFormProps {
  course?: Course | null;
  onClose: () => void;
  onSave: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ course, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    category: course?.category || 'informatique',
    level: course?.level || 'débutant',
    duration: course?.duration || 0,
    instructorName: '',
    instructorTitle: '',
    instructorBio: '',
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const categories = [
    'Informatique',
    'Droits Humains',
    'Justice Transitionnelle',
    'Accompagnement Psychologique',
    'Anglais'
  ];

  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let videoUrl = course?.videoUrl || '';
      let photoUrl = '';

      // Upload video if selected
      if (videoFile) {
        const videoRef = ref(storage, `course_videos/${Date.now()}_${videoFile.name}`);
        await uploadBytes(videoRef, videoFile);
        videoUrl = await getDownloadURL(videoRef);
      }

      // Upload instructor photo if selected
      if (photoFile) {
        const photoRef = ref(storage, `instructor_photos/${Date.now()}_${photoFile.name}`);
        await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(photoRef);
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        duration: Number(formData.duration),
        videoUrl,
        instructor: {
          name: formData.instructorName,
          title: formData.instructorTitle,
          bio: formData.instructorBio,
          photoUrl
        },
        assignedTo: course?.assignedTo || [],
        updatedAt: serverTimestamp()
      };

      if (course) {
        // Update existing course
        await updateDoc(doc(db, 'courses', course.id), courseData);
      } else {
        // Create new course
        await addDoc(collection(db, 'courses'), {
          ...courseData,
          createdAt: serverTimestamp()
        });
      }

      onSave();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du cours');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {course ? 'Modifier le cours' : 'Créer un nouveau cours'}
              </h2>
              <p className="text-red-100">
                Remplissez les informations du cours de formation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Information Section */}
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
                  placeholder="Ex: Introduction au JavaScript"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                  placeholder="Description détaillée du cours..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  >
                    {categories.map(category => (
                      <option key={category} value={category.toLowerCase()}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

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
                      <option key={level} value={level.toLowerCase()}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée estimée (heures)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Ex: 5"
                />
              </div>
            </div>
          </div>

          {/* Video Upload Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-500 text-white p-2 rounded-full">
                <FileVideo className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Vidéo d'Introduction
              </h3>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors"
              onClick={() => document.getElementById('video-upload')?.click()}
            >
              <div className="text-6xl text-gray-400 mb-4">🎬</div>
              <div className="text-lg font-medium text-gray-700 mb-2">
                {videoFile ? videoFile.name : 'Cliquez pour uploader la vidéo'}
              </div>
              <div className="text-sm text-gray-500">
                MP4, MOV, AVI - Max 500MB
              </div>
            </div>
            <input
              type="file"
              id="video-upload"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Instructor Information Section */}
        <div className="bg-gray-50 rounded-xl p-6 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-500 text-white p-2 rounded-full">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Informations de l'Instructeur
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  name="instructorName"
                  value={formData.instructorName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Ex: Dr. Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre/Fonction
                </label>
                <input
                  type="text"
                  name="instructorTitle"
                  value={formData.instructorTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Ex: Expert en Développement Web"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo de profil
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <div className="text-4xl text-gray-400 mb-2">📷</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {photoFile ? photoFile.name : 'Photo de l\'instructeur'}
                  </div>
                  <div className="text-xs text-gray-500">
                    JPG, PNG - Max 5MB
                  </div>
                </div>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div>
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

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            type="submit"
            disabled={uploading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:hover:transform-none"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sauvegarde en cours...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {course ? 'Mettre à jour le cours' : 'Créer le cours'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;