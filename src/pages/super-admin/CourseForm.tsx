import React, { useState, useRef } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from "../../lib/firebase";
import { 
  X, Upload, Save, FileVideo, User, BookOpen, Settings, 
  Plus, ChevronRight, ChevronDown, Move, Image as ImageIcon,
  Bold, Italic, List, AlignLeft, AlignCenter, AlignRight,
  Trash2, GripVertical, Type
} from 'lucide-react';

// Types pour la structure du contenu
interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  alignment: 'left' | 'center' | 'right';
  caption?: string;
}

interface ContentBlock {
  id: string;
  type: 'text' | 'media';
  content: string;
  media?: MediaItem;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    list?: boolean;
    alignment?: 'left' | 'center' | 'right';
  };
}

interface CourseSection {
  id: string;
  title: string;
  content: ContentBlock[];
  order: number;
}

interface CourseChapter {
  id: string;
  title: string;
  sections: CourseSection[];
  order: number;
  expanded?: boolean;
}

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
  chapters?: CourseChapter[];
  instructor?: {
    name: string;
    title: string;
    bio: string;
    photoUrl: string;
  };
}

interface CourseFormProps {
  course?: Course | null;
  onClose: () => void;
  onSave: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ course, onClose, onSave }) => {
  // États pour les informations de base du cours
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    category: course?.category || 'informatique',
    level: course?.level || 'débutant',
    duration: course?.duration || 0,
    instructorName: course?.instructor?.name || '',
    instructorTitle: course?.instructor?.title || '',
    instructorBio: course?.instructor?.bio || '',
  });

  // États pour les fichiers
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // États pour le contenu structuré
  const [chapters, setChapters] = useState<CourseChapter[]>(course?.chapters || []);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'basic' | 'content'>('basic');

  // États pour l'éditeur de texte
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [textFormatting, setTextFormatting] = useState({
    bold: false,
    italic: false,
    list: false,
    alignment: 'left' as 'left' | 'center' | 'right'
  });

  // Références pour les uploads de médias
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Informatique',
    'Droits Humains',
    'Justice Transitionnelle',
    'Accompagnement Psychologique',
    'Anglais'
  ];

  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];

  // Génération d'ID unique
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Gestion des changements dans le formulaire de base
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gestion des uploads de fichiers
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoFile(file);
  };

  // Upload de média pour le contenu
  const uploadMedia = async (file: File, type: 'image' | 'video'): Promise<string> => {
    const folder = type === 'image' ? 'course_images' : 'course_videos';
    const mediaRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(mediaRef, file);
    return await getDownloadURL(mediaRef);
  };

  // Gestion des chapitres
  const addChapter = () => {
    const newChapter: CourseChapter = {
      id: generateId(),
      title: `Chapitre ${chapters.length + 1}`,
      sections: [],
      order: chapters.length,
      expanded: true
    };
    setChapters([...chapters, newChapter]);
    setActiveChapter(newChapter.id);
  };

  const updateChapterTitle = (chapterId: string, title: string) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId ? { ...ch, title } : ch
    ));
  };

  const deleteChapter = (chapterId: string) => {
    setChapters(chapters.filter(ch => ch.id !== chapterId));
    if (activeChapter === chapterId) {
      setActiveChapter(null);
      setActiveSection(null);
    }
  };

  const toggleChapter = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChapters(chapters.map(ch => 
      ch.id === chapterId ? { ...ch, expanded: !ch.expanded } : ch
    ));
  };

  // Gestion des sections
  const addSection = (chapterId: string) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    const newSection: CourseSection = {
      id: generateId(),
      title: `Section ${chapter.sections.length + 1}`,
      content: [{
        id: generateId(),
        type: 'text',
        content: '',
        formatting: {
          bold: false,
          italic: false,
          list: false,
          alignment: 'left'
        }
      }],
      order: chapter.sections.length
    };

    setChapters(chapters.map(ch => 
      ch.id === chapterId 
        ? { ...ch, sections: [...ch.sections, newSection] }
        : ch
    ));
    setActiveSection(newSection.id);
  };

  const updateSectionTitle = (chapterId: string, sectionId: string, title: string) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId 
        ? { 
            ...ch, 
            sections: ch.sections.map(sec => 
              sec.id === sectionId ? { ...sec, title } : sec
            )
          }
        : ch
    ));
  };

  const deleteSection = (chapterId: string, sectionId: string) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId 
        ? { ...ch, sections: ch.sections.filter(sec => sec.id !== sectionId) }
        : ch
    ));
    if (activeSection === sectionId) {
      setActiveSection(null);
    }
  };

  // Gestion du contenu des sections
  const updateSectionContent = (chapterId: string, sectionId: string, blockId: string, content: string) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId 
        ? { 
            ...ch, 
            sections: ch.sections.map(sec => 
              sec.id === sectionId 
                ? {
                    ...sec,
                    content: sec.content.map(block => 
                      block.id === blockId ? { ...block, content } : block
                    )
                  }
                : sec
            )
          }
        : ch
    ));
  };

  const updateBlockFormatting = (chapterId: string, sectionId: string, blockId: string, formatting: any) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId 
        ? { 
            ...ch, 
            sections: ch.sections.map(sec => 
              sec.id === sectionId 
                ? {
                    ...sec,
                    content: sec.content.map(block => 
                      block.id === blockId ? { ...block, formatting: { ...block.formatting, ...formatting } } : block
                    )
                  }
                : sec
            )
          }
        : ch
    ));
  };

  const addContentBlock = (chapterId: string, sectionId: string, type: 'text' | 'media') => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: type === 'text' ? '' : 'media-placeholder',
      formatting: type === 'text' ? {
        bold: false,
        italic: false,
        list: false,
        alignment: 'left'
      } : undefined
    };

    setChapters(chapters.map(ch => 
      ch.id === chapterId 
        ? { 
            ...ch, 
            sections: ch.sections.map(sec => 
              sec.id === sectionId 
                ? { ...sec, content: [...sec.content, newBlock] }
                : sec
            )
          }
        : ch
    ));
  };

  // Ajout de média dans une section
  const addMediaToSection = async (chapterId: string, sectionId: string, file: File, type: 'image' | 'video') => {
    try {
      const url = await uploadMedia(file, type);
      const mediaItem: MediaItem = {
        id: generateId(),
        type,
        url,
        alignment: 'center'
      };

      const newBlock: ContentBlock = {
        id: generateId(),
        type: 'media',
        content: '',
        media: mediaItem
      };

      setChapters(chapters.map(ch => 
        ch.id === chapterId 
          ? { 
              ...ch, 
              sections: ch.sections.map(sec => 
                sec.id === sectionId 
                  ? { ...sec, content: [...sec.content, newBlock] }
                  : sec
              )
            }
          : ch
      ));
    } catch (error) {
      console.error('Erreur upload média:', error);
      alert('Erreur lors de l\'upload du média');
    }
  };

  // Suppression d'un bloc de contenu
  const deleteContentBlock = (chapterId: string, sectionId: string, blockId: string) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId 
        ? { 
            ...ch, 
            sections: ch.sections.map(sec => 
              sec.id === sectionId 
                ? { ...sec, content: sec.content.filter(block => block.id !== blockId) }
                : sec
            )
          }
        : ch
    ));
  };

  // Gestion des uploads de médias via input
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file && activeChapter && activeSection) {
      await addMediaToSection(activeChapter, activeSection, file, type);
    }
    // Reset input
    e.target.value = '';
  };

  // Gestion de la sélection de chapitre
  const handleChapterClick = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveChapter(chapterId);
    
    // Si le chapitre a des sections, sélectionner la première
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (chapter && chapter.sections.length > 0) {
      setActiveSection(chapter.sections[0].id);
    } else {
      setActiveSection(null);
    }
  };

  // Gestion de la sélection de section
  const handleSectionClick = (chapterId: string, sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveChapter(chapterId);
    setActiveSection(sectionId);
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let videoUrl = course?.videoUrl || '';
      let photoUrl = course?.instructor?.photoUrl || '';

      // Upload video si sélectionné
      if (videoFile) {
        const videoRef = ref(storage, `course_videos/${Date.now()}_${videoFile.name}`);
        await uploadBytes(videoRef, videoFile);
        videoUrl = await getDownloadURL(videoRef);
      }

      // Upload photo instructeur si sélectionnée
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
        chapters: chapters,
        assignedTo: course?.assignedTo || [],
        updatedAt: serverTimestamp()
      };

      if (course) {
        await updateDoc(doc(db, 'courses', course.id), courseData);
      } else {
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
              placeholder="Ex: Introduction au JavaScript"
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

      {/* Upload vidéo d'introduction */}
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

      {/* Informations instructeur */}
      <div className="lg:col-span-2 bg-gray-50 rounded-xl p-6">
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
    </div>
  );

  // Rendu de l'éditeur de contenu
  const renderContentEditor = () => {
    const activeChapterData = chapters.find(ch => ch.id === activeChapter);
    const activeSectionData = activeChapterData?.sections.find(sec => sec.id === activeSection);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Sidebar des chapitres */}
        <div className="lg:col-span-1 bg-gray-50 rounded-xl p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Structure</h3>
            <button
              type="button"
              onClick={addChapter}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 ${
                    activeChapter === chapter.id ? 'bg-red-50 border-l-4 border-red-500' : ''
                  }`}
                  onClick={(e) => handleChapterClick(chapter.id, e)}
                >
                  <button
                    type="button"
                    onClick={(e) => toggleChapter(chapter.id, e)}
                    className="mr-2 text-gray-500 hover:text-gray-700"
                  >
                    {chapter.expanded ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </button>
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateChapterTitle(chapter.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChapter(chapter.id);
                    }}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {chapter.expanded && (
                  <div className="border-t border-gray-200 bg-white">
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => addSection(chapter.id)}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        + Ajouter une section
                      </button>
                    </div>
                    {chapter.sections.map((section) => (
                      <div
                        key={section.id}
                        className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          activeSection === section.id ? 'bg-red-50 border-l-2 border-red-500' : ''
                        }`}
                        onClick={(e) => handleSectionClick(chapter.id, section.id, e)}
                      >
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateSectionTitle(chapter.id, section.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-transparent border-none outline-none text-sm"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(chapter.id, section.id);
                          }}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Zone d'édition principale */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {activeSectionData ? (
            <div className="h-full flex flex-col">
              {/* Barre d'outils */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {activeSectionData.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addContentBlock(activeChapter!, activeSection!, 'text')}
                      className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Type className="h-4 w-4" />
                      Texte
                    </button>
                    <button
                      type="button"
                      onClick={() => imageUploadRef.current?.click()}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => videoUploadRef.current?.click()}

className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <FileVideo className="h-4 w-4" />
                      Vidéo
                    </button>
                  </div>
                </div>

                {/* Barre d'outils de formatage */}
                {selectedBlockId && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        const newFormatting = { bold: !textFormatting.bold };
                        setTextFormatting(prev => ({ ...prev, ...newFormatting }));
                        updateBlockFormatting(activeChapter!, activeSection!, selectedBlockId, newFormatting);
                      }}
                      className={`p-2 rounded transition-colors ${
                        textFormatting.bold ? 'bg-red-500 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newFormatting = { italic: !textFormatting.italic };
                        setTextFormatting(prev => ({ ...prev, ...newFormatting }));
                        updateBlockFormatting(activeChapter!, activeSection!, selectedBlockId, newFormatting);
                      }}
                      className={`p-2 rounded transition-colors ${
                        textFormatting.italic ? 'bg-red-500 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newFormatting = { list: !textFormatting.list };
                        setTextFormatting(prev => ({ ...prev, ...newFormatting }));
                        updateBlockFormatting(activeChapter!, activeSection!, selectedBlockId, newFormatting);
                      }}
                      className={`p-2 rounded transition-colors ${
                        textFormatting.list ? 'bg-red-500 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const newFormatting = { alignment: 'left' as 'left' };
                        setTextFormatting(prev => ({ ...prev, ...newFormatting }));
                        updateBlockFormatting(activeChapter!, activeSection!, selectedBlockId, newFormatting);
                      }}
                      className={`p-2 rounded transition-colors ${
                        textFormatting.alignment === 'left' ? 'bg-red-500 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newFormatting = { alignment: 'center' as 'center' };
                        setTextFormatting(prev => ({ ...prev, ...newFormatting }));
                        updateBlockFormatting(activeChapter!, activeSection!, selectedBlockId, newFormatting);
                      }}
                      className={`p-2 rounded transition-colors ${
                        textFormatting.alignment === 'center' ? 'bg-red-500 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newFormatting = { alignment: 'right' as 'right' };
                        setTextFormatting(prev => ({ ...prev, ...newFormatting }));
                        updateBlockFormatting(activeChapter!, activeSection!, selectedBlockId, newFormatting);
                      }}
                      className={`p-2 rounded transition-colors ${
                        textFormatting.alignment === 'right' ? 'bg-red-500 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      <AlignRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Contenu de la section */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {activeSectionData.content.map((block, index) => (
                    <div key={block.id} className="group relative">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 cursor-move"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteContentBlock(activeChapter!, activeSection!, block.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex-1">
                          {block.type === 'text' ? (
                            <textarea
                              value={block.content}
                              onChange={(e) => updateSectionContent(activeChapter!, activeSection!, block.id, e.target.value)}
                              onFocus={() => {
                                setSelectedBlockId(block.id);
                                setTextFormatting(block.formatting || {
                                  bold: false,
                                  italic: false,
                                  list: false,
                                  alignment: 'left'
                                });
                              }}
                              onBlur={() => setSelectedBlockId(null)}
                              placeholder="Tapez votre contenu ici..."
                              className={`w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none ${
                                block.formatting?.bold ? 'font-bold' : ''
                              } ${
                                block.formatting?.italic ? 'italic' : ''
                              } ${
                                block.formatting?.alignment === 'center' ? 'text-center' : 
                                block.formatting?.alignment === 'right' ? 'text-right' : 'text-left'
                              }`}
                              style={{
                                listStyle: block.formatting?.list ? 'disc' : 'none'
                              }}
                            />
                          ) : (
                            <div className="border border-gray-300 rounded-lg p-4">
                              {block.media ? (
                                <div className={`text-${block.media.alignment}`}>
                                  {block.media.type === 'image' ? (
                                    <img
                                      src={block.media.url}
                                      alt={block.media.caption || 'Contenu média'}
                                      className="max-w-full h-auto rounded-lg"
                                    />
                                  ) : (
                                    <video
                                      src={block.media.url}
                                      controls
                                      className="max-w-full h-auto rounded-lg"
                                    />
                                  )}
                                  {block.media.caption && (
                                    <p className="text-sm text-gray-600 mt-2 italic">
                                      {block.media.caption}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <div className="text-4xl mb-2">📁</div>
                                  <p>Média en attente d'upload</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeSectionData.content.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">Section vide</p>
                      <p className="text-sm">Ajoutez du contenu en utilisant les boutons ci-dessus</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-medium mb-2">Sélectionnez une section</p>
                <p className="text-sm">Choisissez un chapitre et une section pour commencer l'édition</p>
              </div>
            </div>
          )}
        </div>

        {/* Inputs cachés pour upload de médias */}
        <input
          ref={imageUploadRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleMediaUpload(e, 'image')}
          className="hidden"
        />
        <input
          ref={videoUploadRef}
          type="file"
          accept="video/*"
          onChange={(e) => handleMediaUpload(e, 'video')}
          className="hidden"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {course ? 'Modifier le cours' : 'Nouveau cours'}
            </h2>
            <p className="text-gray-600 mt-1">
              {currentView === 'basic' 
                ? 'Configurez les informations de base de votre cours'
                : 'Structurez et rédigez le contenu de votre cours'
              }
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setCurrentView('basic')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              currentView === 'basic'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Settings className="h-5 w-5" />
              Informations de base
            </div>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('content')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              currentView === 'content'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="h-5 w-5" />
              Contenu du cours
            </div>
          </button>
        </div>

        {/* Contenu principal */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 p-6 overflow-y-auto">
            {currentView === 'basic' ? renderBasicForm() : renderContentEditor()}
          </div>

          {/* Footer avec actions */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              {currentView === 'basic' 
                ? 'Remplissez tous les champs obligatoires avant de passer au contenu'
                : `${chapters.length} chapitre(s) • ${chapters.reduce((acc, ch) => acc + ch.sections.length, 0)} section(s)`
              }
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={uploading || !formData.title.trim()}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {uploading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;