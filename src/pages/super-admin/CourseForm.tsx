import React, { useState, useRef, useEffect } from 'react';
import {
  X, Upload, Save, FileVideo, User, BookOpen, Settings,
  Plus, ChevronRight, ChevronDown, Move, Image as ImageIcon,
  Bold, Italic, List, AlignLeft, AlignCenter, AlignRight,
  Trash2, GripVertical, Type
} from 'lucide-react';
import { collection, getDocs, addDoc, setDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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
  subcategory?: string; // Nouveau champ optionnel
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

  // Liste des catégories mise à jour selon les spécifications
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);


  // États pour les informations de base du cours
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    categoryId: course?.categoryId || (categories[0]?.id || ''), // Utilise l'id de la catégorie
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

  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];

  // Génération d'ID unique
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const applyFormatting = (
    chapterId: string,
    sectionId: string,
    blockId: string,
    formatType: string
  ) => {
    setChapters((prevChapters) =>
      prevChapters.map((ch) =>
        ch.id === chapterId
          ? {
            ...ch,
            sections: ch.sections.map((sec) =>
              sec.id === sectionId
                ? {
                  ...sec,
                  content: sec.content.map((block) => {
                    if (block.id !== blockId) return block;

                    // Toggle le formatage
                    let newFormatting = { ...(block.formatting || {}) };
                    if (formatType === 'bold') {
                      newFormatting.bold = !newFormatting.bold;
                    }
                    if (formatType === 'italic') {
                      newFormatting.italic = !newFormatting.italic;
                    }
                    if (formatType === 'list') {
                      newFormatting.list = !newFormatting.list;
                    }
                    if (
                      formatType === 'left' ||
                      formatType === 'center' ||
                      formatType === 'right'
                    ) {
                      newFormatting.alignment = formatType as
                        | 'left'
                        | 'center'
                        | 'right';
                    }
                    return { ...block, formatting: newFormatting };
                  }),
                }
                : sec
            ),
          }
          : ch
      )
    );
  };

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

  // Simulation d'upload de média pour le contenu (remplacez par votre logique Firebase)
  const uploadMedia = async (file: File, type: 'image' | 'video'): Promise<string> => {
    // Simulation d'upload - remplacez par votre logique Firebase
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 1000);
    });
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
      // Construction de l'objet course à enregistrer
      const courseData: any = {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        level: formData.level,
        duration: Number(formData.duration),
        instructor: {
          name: formData.instructorName,
          title: formData.instructorTitle,
          bio: formData.instructorBio,
          // photoUrl: à gérer si upload
        },
        chapters,
        assignedTo: course?.assignedTo || [],
        createdAt: course?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      // TODO: gérer l'upload de videoFile et photoFile si besoin

      if (course && course.id) {
        // Mise à jour
        await updateDoc(doc(db, 'courses', course.id), courseData);
      } else {
        // Création
        await addDoc(collection(db, 'courses'), courseData);
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
                  <option key={level} value={level.toLowerCase()}>
                    {level}
                  </option>
                ))}
              </select>
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
                placeholder="Ex: Expert en Justice Transitionnelle"
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
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 ${activeChapter === chapter.id ? 'bg-red-50 border-l-4 border-red-500' : ''
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
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      (e.target as HTMLInputElement).select();
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium hover:bg-gray-100 px-2 py-1 rounded"
                    placeholder="Nom du chapitre"
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
                        className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors ${activeSection === section.id ? 'bg-red-50 border-l-2 border-red-500' : ''
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
              {/* Header de la section */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {activeSectionData.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    {/* Boutons d'ajout de contenu */}
                    <button
                      type="button"
                      onClick={() => addContentBlock(activeChapter!, activeSection!, 'text')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <Type className="h-4 w-4" />
                      Texte
                    </button>
                    <button
                      type="button"
                      onClick={() => imageUploadRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => videoUploadRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
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
                      onClick={() => applyFormatting(activeChapter!, activeSection!, selectedBlockId, 'bold')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${textFormatting.bold ? 'bg-gray-300' : ''
                        }`}
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting(activeChapter!, activeSection!, selectedBlockId, 'italic')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${textFormatting.italic ? 'bg-gray-300' : ''
                        }`}
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting(activeChapter!, activeSection!, selectedBlockId, 'list')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${textFormatting.list ? 'bg-gray-300' : ''
                        }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    <button
                      type="button"
                      onClick={() => applyFormatting(activeChapter!, activeSection!, selectedBlockId, 'left')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${textFormatting.alignment === 'left' ? 'bg-gray-300' : ''
                        }`}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting(activeChapter!, activeSection!, selectedBlockId, 'center')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${textFormatting.alignment === 'center' ? 'bg-gray-300' : ''
                        }`}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting(activeChapter!, activeSection!, selectedBlockId, 'right')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${textFormatting.alignment === 'right' ? 'bg-gray-300' : ''
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
                    <div
                      key={block.id}
                      className="group relative border border-transparent hover:border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      {/* Poignée de déplacement */}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                      </div>

                      {/* Bouton de suppression */}
                      <button
                        type="button"
                        onClick={() => deleteContentBlock(activeChapter!, activeSection!, block.id)}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {/* Contenu du bloc */}
                      {block.type === 'text' ? (
                        <textarea
                          value={block.content}
                          onChange={(e) => updateSectionContent(activeChapter!, activeSection!, block.id, e.target.value)}
                          onFocus={() => {
                            setSelectedBlockId(block.id);
                            setTextFormatting({
                              bold: block.formatting?.bold || false,
                              italic: block.formatting?.italic || false,
                              list: block.formatting?.list || false,
                              alignment: block.formatting?.alignment || 'left'
                            });
                          }}
                          onBlur={() => setSelectedBlockId(null)}
                          placeholder="Tapez votre contenu ici..."
                          className={`w-full min-h-[100px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none ${block.formatting?.bold ? 'font-bold' : ''
                            } ${block.formatting?.italic ? 'italic' : ''
                            } ${block.formatting?.alignment === 'center' ? 'text-center' :
                              block.formatting?.alignment === 'right' ? 'text-right' : 'text-left'
                            }`}
                          style={{
                            listStyleType: block.formatting?.list ? 'disc' : 'none',
                            paddingLeft: block.formatting?.list ? '2rem' : '0.75rem'
                          }}
                        />
                      ) : block.type === 'media' && block.media ? (
                        <div className={`flex justify-${block.media.alignment}`}>
                          <div className="max-w-md">
                            {block.media.type === 'image' ? (
                              <img
                                src={block.media.url}
                                alt={block.media.caption || 'Image du cours'}
                                className="w-full h-auto rounded-lg shadow-md"
                              />
                            ) : (
                              <video
                                src={block.media.url}
                                controls
                                className="w-full h-auto rounded-lg shadow-md"
                              />
                            )}
                            {block.media.caption && (
                              <p className="text-sm text-gray-600 mt-2 text-center italic">
                                {block.media.caption}
                              </p>
                            )}

                            {/* Contrôles d'alignement des médias */}
                            <div className="flex justify-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  if (block.media) {
                                    const updatedMedia = { ...block.media, alignment: 'left' as const };
                                    updateSectionContent(activeChapter!, activeSection!, block.id, '');
                                    // Mise à jour du média - vous devrez adapter selon votre structure
                                  }
                                }}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <AlignLeft className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (block.media) {
                                    const updatedMedia = { ...block.media, alignment: 'center' as const };
                                    // Mise à jour du média
                                  }
                                }}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <AlignCenter className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (block.media) {
                                    const updatedMedia = { ...block.media, alignment: 'right' as const };
                                    // Mise à jour du média
                                  }
                                }}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <AlignRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <div className="text-4xl text-gray-400 mb-2">📄</div>
                            <div className="text-sm text-gray-500">Bloc de contenu vide</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Message si pas de contenu */}
                  {activeSectionData.content.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl text-gray-300 mb-4">📝</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Cette section est vide
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Commencez par ajouter du contenu à cette section
                      </p>
                      <div className="flex justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => addContentBlock(activeChapter!, activeSection!, 'text')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          <Type className="h-4 w-4" />
                          Ajouter du texte
                        </button>
                        <button
                          type="button"
                          onClick={() => imageUploadRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          <ImageIcon className="h-4 w-4" />
                          Ajouter une image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* État par défaut quand aucune section n'est sélectionnée */
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl text-gray-300 mb-6">📚</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Éditeur de Contenu
                </h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Sélectionnez un chapitre et une section dans la sidebar pour commencer à éditer le contenu de votre cours.
                </p>
                {chapters.length === 0 && (
                  <button
                    type="button"
                    onClick={addChapter}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                    Créer votre premier chapitre
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Inputs cachés pour les uploads */}
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

  useEffect(() => {
    // Charger dynamiquement les catégories Firestore
    const fetchCategories = async () => {
      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCategories();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="bg-red-500 text-white p-3 rounded-full">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {course ? 'Modifier le Cours' : 'Créer un Nouveau Cours'}
              </h2>
              <p className="text-gray-500">
                {currentView === 'basic'
                  ? 'Configurez les informations de base de votre cours'
                  : 'Structurez et rédigez le contenu de votre cours'
                }
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation entre les vues */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setCurrentView('basic')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${currentView === 'basic'
              ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            📋 Informations de Base
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('content')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${currentView === 'content'
              ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            ✍️ Contenu du Cours
          </button>
        </div>

        {/* Contenu principal */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {currentView === 'basic' ? renderBasicForm() : renderContentEditor()}
          </div>

          {/* Footer avec boutons d'action */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {currentView === 'basic'
                  ? '* Champs obligatoires'
                  : `${chapters.length} chapitre(s) • ${chapters.reduce((acc, ch) => acc + ch.sections.length, 0)} section(s)`
                }
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={uploading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading || !formData.title}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {course ? 'Mettre à Jour' : 'Créer le Cours'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
