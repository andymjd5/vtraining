import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { courseService } from '../../services/courseService';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';

import {
  CheckCircle,
  Clock,
  BookOpen,
  ArrowLeft,
  PlayCircle,
  Users,
  Star,
  Award,
  ChevronRight,
  GraduationCap,
  FileText,
  Play,
  RotateCcw,
  Target,
  TrendingUp
} from 'lucide-react';
import ContentBlockViewer from '../../components/course-viewer/ContentBlockViewer';
import {
  CourseWithStructure,
  ChapterWithSections,
  SectionWithContent
} from '../../types/course';

// 📊 Interface pour les statistiques de progression
interface ProgressStats {
  totalContentBlocks: number;
  completedContentBlocks: number;
  currentContentBlock: string | null;
  timeSpent: number; // en minutes
  estimatedTimeRemaining: number; // en minutes
}

interface UserProgress {
  courseId: string;
  completedChapters: string[];
  completedContentBlocks: string[];
  currentChapter: string;
  currentSection: string | null;
  progressPercentage: number;
  lastAccessedAt: any;
  timeSpent: number; // temps total passé en minutes
  lastContentBlockId: string | null;
  contentBlocksTimeSpent: { [blockId: string]: number }; // temps par bloc
}

const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message)
};

// 📊 Interface pour les statistiques de progression
interface ProgressStats {
  totalContentBlocks: number;
  completedContentBlocks: number;
  currentContentBlock: string | null;
  timeSpent: number; // en minutes
  estimatedTimeRemaining: number; // en minutes
}

interface UserProgress {
  courseId: string;
  completedChapters: string[];
  completedContentBlocks: string[];
  currentChapter: string;
  currentSection: string | null;
  progressPercentage: number;
  lastAccessedAt: any;
  timeSpent: number; // temps total passé en minutes
  lastContentBlockId: string | null;
}

export default function CourseView() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  // 🎯 States mis à jour pour la nouvelle structure
  const [course, setCourse] = useState<CourseWithStructure | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterWithSections | null>(null);
  const [currentSection, setCurrentSection] = useState<SectionWithContent | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  // 🕒 États pour le tracking du temps réel
  const [currentBlockStartTime, setCurrentBlockStartTime] = useState<Date | null>(null);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  useEffect(() => {
    if (courseId && user) {
      loadCourseData();
      loadUserProgress();
    }
  }, [courseId, user]);

  // 🕒 Effect pour gérer l'arrêt automatique du timer
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopContentBlockTimer();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopContentBlockTimer();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopContentBlockTimer();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentBlockId, currentBlockStartTime]);

  // 🔄 Effect pour recalculer les statistiques quand les progrès changent
  useEffect(() => {
    if (course && userProgress) {
      calculateProgressStats(course);
    }
  }, [userProgress, course]);

  // 🔄 Fonction modernisée pour charger le cours avec sa structure complète
  const loadCourseData = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setEnriching(true);

      // Charger le cours avec toute sa structure (chapitres, sections, blocs)
      const courseWithStructure = await courseService.loadCourseWithStructure(courseId);
      setCourse(courseWithStructure);

      // Définir le premier chapitre comme actuel s'il y en a un
      if (courseWithStructure.chapters && courseWithStructure.chapters.length > 0) {
        const firstChapter = courseWithStructure.chapters[0];
        setCurrentChapter(firstChapter);

        // Définir la première section du premier chapitre
        if (firstChapter.sections && firstChapter.sections.length > 0) {
          setCurrentSection(firstChapter.sections[0]);
        }
      }

      // Calculer les statistiques de progression
      calculateProgressStats(courseWithStructure);

    } catch (error) {
      console.error('Erreur lors du chargement du cours:', error);
      toast.error('Erreur lors du chargement du cours');
    } finally {
      setLoading(false);
      setEnriching(false);
    }
  };  // 📊 Calcul des statistiques de progression réelles
  const calculateProgressStats = (courseData: CourseWithStructure) => {
    if (!courseData.chapters) {
      setProgressStats({
        totalContentBlocks: 0,
        completedContentBlocks: 0,
        currentContentBlock: null,
        timeSpent: 0,
        estimatedTimeRemaining: 0
      });
      return;
    }

    let totalContentBlocks = 0;
    let estimatedTime = 0;

    courseData.chapters.forEach(chapter => {
      chapter.sections.forEach(section => {
        totalContentBlocks += section.content.length;

        // Estimer le temps par bloc de contenu
        section.content.forEach(block => {
          if (block.type === 'media' && block.media?.duration) {
            estimatedTime += Math.ceil(block.media.duration / 60); // Convertir secondes en minutes
          } else if (block.type === 'text') {
            estimatedTime += 2; // 2 minutes par bloc de texte
          } else {
            estimatedTime += 3; // 3 minutes pour les autres types
          }
        });
      });
    });

    const completedContentBlocks = userProgress?.completedContentBlocks?.length || 0;
    const timeSpent = userProgress?.timeSpent || 0;
    const estimatedTimeRemaining = Math.max(0, estimatedTime - timeSpent); setProgressStats({
      totalContentBlocks,
      completedContentBlocks,
      currentContentBlock: userProgress?.lastContentBlockId || null,
      timeSpent,
      estimatedTimeRemaining
    });
  };

  // 🕒 Fonctions de tracking du temps réel
  const startContentBlockTimer = (blockId: string) => {
    // Arrêter le timer précédent si il y en a un
    if (currentBlockId && currentBlockStartTime) {
      stopContentBlockTimer();
    }

    setCurrentBlockId(blockId);
    setCurrentBlockStartTime(new Date());
  };

  const stopContentBlockTimer = () => {
    if (currentBlockId && currentBlockStartTime) {
      const timeSpent = Math.round((new Date().getTime() - currentBlockStartTime.getTime()) / 1000 / 60); // en minutes

      if (timeSpent > 0) {
        setBlockTimeSpent(prev => ({
          ...prev,
          [currentBlockId]: (prev[currentBlockId] || 0) + timeSpent
        }));

        // Mettre à jour les progrès utilisateur
        if (userProgress && user?.uid && courseId) {
          const updatedProgress = {
            ...userProgress,
            timeSpent: userProgress.timeSpent + timeSpent,
            contentBlocksTimeSpent: {
              ...userProgress.contentBlocksTimeSpent,
              [currentBlockId]: (userProgress.contentBlocksTimeSpent?.[currentBlockId] || 0) + timeSpent
            },
            lastContentBlockId: currentBlockId,
            lastAccessedAt: new Date()
          };

          setDoc(doc(db, 'userProgress', `${user.uid}_${courseId}`), updatedProgress);
          setUserProgress(updatedProgress);
        }
      }
    }

    setCurrentBlockId(null);
    setCurrentBlockStartTime(null);
  };
  // 🎯 Marquer un content block comme terminé
  const markContentBlockComplete = async (blockId: string) => {
    if (!user?.uid || !userProgress || !courseId) return;

    try {
      // Arrêter le timer pour ce bloc
      stopContentBlockTimer(); const updatedCompletedContentBlocks = [...(userProgress.completedContentBlocks || [])];
      if (!updatedCompletedContentBlocks.includes(blockId)) {
        updatedCompletedContentBlocks.push(blockId);
      }

      // Calculer le pourcentage de progression basé sur les blocs de contenu
      const totalContentBlocks = progressStats?.totalContentBlocks || 1;
      const progressPercentage = Math.round(
        (updatedCompletedContentBlocks.length / totalContentBlocks) * 100
      );

      // Vérifier si le chapitre est maintenant terminé
      const currentChapterBlocks = getAllContentBlocksForChapter(currentChapter?.id || '');
      const chapterCompleted = currentChapterBlocks.every(id =>
        updatedCompletedContentBlocks.includes(id)
      );

      let updatedCompletedChapters = [...userProgress.completedChapters];
      if (chapterCompleted && currentChapter && !updatedCompletedChapters.includes(currentChapter.id)) {
        updatedCompletedChapters.push(currentChapter.id);
      }

      const updatedProgress: UserProgress = {
        ...userProgress,
        completedChapters: updatedCompletedChapters,
        completedContentBlocks: updatedCompletedContentBlocks,
        progressPercentage,
        lastAccessedAt: new Date(),
        lastContentBlockId: blockId
      };

      await setDoc(doc(db, 'userProgress', `${user.uid}_${courseId}`), updatedProgress);
      setUserProgress(updatedProgress);

      // Recalculer les statistiques
      if (course) {
        calculateProgressStats(course);
      }

      toast.success(chapterCompleted ? 'Chapitre terminé ! 🎉' : 'Bloc terminé ! ✅');

      // Auto-navigation vers le prochain bloc
      setTimeout(() => {
        navigateToNextIncompleteBlock();
      }, 1000);

    } catch (error) {
      console.error('Erreur lors de la mise à jour des progrès:', error);
      toast.error('Erreur lors de la sauvegarde des progrès');
    }
  };

  // 🧭 Naviguer automatiquement vers le prochain bloc non terminé
  const navigateToNextIncompleteBlock = () => {
    if (!course?.chapters || !userProgress || !currentSection) return;

    // D'abord, chercher dans la section actuelle
    const currentSectionIndex = currentSection.content.findIndex(block =>
      userProgress.lastContentBlockId === block.id
    );    // Chercher le prochain bloc dans la section actuelle
    for (let i = currentSectionIndex + 1; i < currentSection.content.length; i++) {
      const block = currentSection.content[i];
      if (!(userProgress.completedContentBlocks || []).includes(block.id)) {
        startContentBlockTimer(block.id);
        return;
      }
    }

    // Si pas de bloc suivant dans la section actuelle, chercher dans les sections suivantes
    const currentChapterIndex = course.chapters.findIndex(ch => ch.id === currentChapter?.id);
    if (currentChapterIndex === -1) return;

    const currentChapter = course.chapters[currentChapterIndex];
    const currentSectionIdx = currentChapter.sections.findIndex(sec => sec.id === currentSection.id);    // Chercher dans les sections suivantes du même chapitre
    for (let i = currentSectionIdx + 1; i < currentChapter.sections.length; i++) {
      const section = currentChapter.sections[i];
      for (const block of section.content) {
        if (!(userProgress.completedContentBlocks || []).includes(block.id)) {
          setCurrentSection(section);
          setTimeout(() => startContentBlockTimer(block.id), 100);
          return;
        }
      }
    }    // Chercher dans les chapitres suivants
    for (let i = currentChapterIndex + 1; i < course.chapters.length; i++) {
      const chapter = course.chapters[i];
      for (const section of chapter.sections) {
        for (const block of section.content) {
          if (!(userProgress.completedContentBlocks || []).includes(block.id)) {
            setCurrentChapter(chapter);
            setCurrentSection(section);
            setTimeout(() => startContentBlockTimer(block.id), 100);
            return;
          }
        }
      }
    }
  };

  // 🔍 Obtenir tous les content blocks d'un chapitre
  const getAllContentBlocksForChapter = (chapterId: string): string[] => {
    if (!course?.chapters) return [];

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return [];

    const blockIds: string[] = [];
    chapter.sections.forEach(section => {
      section.content.forEach(block => {
        blockIds.push(block.id);
      });
    });

    return blockIds;
  };  // 🚀 Reprendre là où l'utilisateur s'est arrêté
  const resumeFromLastPosition = () => {
    if (!course?.chapters || !userProgress) return;

    // Trouver le premier bloc non terminé
    for (const chapter of course.chapters) {
      for (const section of chapter.sections) {
        for (const block of section.content) {
          if (!(userProgress.completedContentBlocks || []).includes(block.id)) {
            // Naviguer vers le bon chapitre et section
            setCurrentChapter(chapter);
            setCurrentSection(section);

            // Attendre un peu pour que le DOM se mette à jour, puis démarrer le timer
            setTimeout(() => {
              startContentBlockTimer(block.id);

              // Faire défiler jusqu'au bloc
              const blockElement = document.querySelector(`[data-block-id="${block.id}"]`);
              if (blockElement) {
                blockElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              }
            }, 100);

            toast.success(`Reprise du cours au chapitre "${chapter.title}"`);
            return;
          }
        }
      }
    }

    toast.success('Félicitations ! Vous avez terminé tout le cours !');
  };
  const loadUserProgress = async () => {
    if (!user?.uid || !courseId) return;

    try {
      const progressDoc = await getDoc(doc(db, 'userProgress', `${user.uid}_${courseId}`));
      if (progressDoc.exists()) {
        const progress = progressDoc.data() as UserProgress;
        setUserProgress(progress);

        // Charger les temps passés par bloc
        setBlockTimeSpent(progress.contentBlocksTimeSpent || {});

        // Restaurer la position dans le cours
        if (course?.chapters && progress.currentChapter) {
          const currentChap = course.chapters.find(ch => ch.id === progress.currentChapter);
          if (currentChap) {
            setCurrentChapter(currentChap);
            if (progress.currentSection && currentChap.sections) {
              const currentSec = currentChap.sections.find(sec => sec.id === progress.currentSection);
              if (currentSec) {
                setCurrentSection(currentSec);
              }
            }
          }
        }
      } else {
        // Initialiser les progrès
        const initialProgress: UserProgress = {
          courseId: courseId,
          completedChapters: [],
          completedContentBlocks: [],
          currentChapter: course?.chapters?.[0]?.id || '',
          currentSection: course?.chapters?.[0]?.sections?.[0]?.id || null,
          progressPercentage: 0,
          lastAccessedAt: new Date(),
          timeSpent: 0,
          lastContentBlockId: null,
          contentBlocksTimeSpent: {}
        };

        // Sauvegarder les progrès initiaux
        await setDoc(doc(db, 'userProgress', `${user.uid}_${courseId}`), initialProgress);
        setUserProgress(initialProgress);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des progrès:', error);
    }
  };
  // 🎯 Marquer un chapitre comme terminé (logique modernisée)
  const markChapterComplete = async (chapterId: string) => {
    if (!user?.uid || !course || !userProgress || !courseId) return;

    try {
      const chapter = course.chapters?.find(ch => ch.id === chapterId);
      if (!chapter) return;

      // Marquer tous les blocs de contenu du chapitre comme terminés
      const allContentBlockIds: string[] = [];
      chapter.sections.forEach(section => {
        section.content.forEach(block => {
          allContentBlockIds.push(block.id);
        });
      });

      const updatedCompletedChapters = [...userProgress.completedChapters];
      if (!updatedCompletedChapters.includes(chapterId)) {
        updatedCompletedChapters.push(chapterId);
      } const updatedCompletedContentBlocks = [
        ...new Set([...(userProgress.completedContentBlocks || []), ...allContentBlockIds])
      ];

      // Calculer le pourcentage de progression basé sur les blocs de contenu
      const totalContentBlocks = progressStats?.totalContentBlocks || 1;
      const progressPercentage = Math.round(
        (updatedCompletedContentBlocks.length / totalContentBlocks) * 100
      );

      const updatedProgress: UserProgress = {
        ...userProgress,
        completedChapters: updatedCompletedChapters,
        completedContentBlocks: updatedCompletedContentBlocks,
        progressPercentage,
        lastAccessedAt: new Date(),
        timeSpent: userProgress.timeSpent + 15 // Ajouter 15 minutes estimées par chapitre
      };

      await setDoc(doc(db, 'userProgress', `${user.uid}_${courseId}`), updatedProgress);
      setUserProgress(updatedProgress);

      // Recalculer les statistiques
      if (course) {
        calculateProgressStats(course);
      }

      toast.success('Chapitre terminé !');

      // Passer au chapitre suivant s'il y en a un
      const currentIndex = course.chapters?.findIndex(ch => ch.id === chapterId) || 0;
      if (course.chapters && currentIndex < course.chapters.length - 1) {
        const nextChapter = course.chapters[currentIndex + 1];
        setCurrentChapter(nextChapter);
        if (nextChapter.sections.length > 0) {
          setCurrentSection(nextChapter.sections[0]);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des progrès:', error);
      toast.error('Erreur lors de la sauvegarde des progrès');
    }
  };

  // 🔄 Sélectionner un chapitre et sa première section
  const selectChapter = (chapter: ChapterWithSections) => {
    setCurrentChapter(chapter);
    setVideoLoading(true);

    if (chapter.sections.length > 0) {
      setCurrentSection(chapter.sections[0]);
    } else {
      setCurrentSection(null);
    }

    // Mettre à jour les progrès utilisateur
    if (userProgress && user?.uid && courseId) {
      const updatedProgress = {
        ...userProgress,
        currentChapter: chapter.id,
        currentSection: chapter.sections[0]?.id || null,
        lastAccessedAt: new Date()
      };

      setDoc(doc(db, 'userProgress', `${user.uid}_${courseId}`), updatedProgress);
      setUserProgress(updatedProgress);
    }
  };
  // 📍 Sélectionner une section spécifique
  const selectSection = (section: SectionWithContent) => {
    // Arrêter le timer actuel
    stopContentBlockTimer(); setCurrentSection(section);

    // Commencer le timer pour le premier bloc non terminé de cette section
    const firstIncompleteBlock = section.content.find(block =>
      !(userProgress?.completedContentBlocks || []).includes(block.id)
    );

    if (firstIncompleteBlock) {
      startContentBlockTimer(firstIncompleteBlock.id);
    }

    // Mettre à jour les progrès utilisateur
    if (userProgress && user?.uid && courseId) {
      const updatedProgress = {
        ...userProgress,
        currentSection: section.id,
        lastAccessedAt: new Date()
      };

      setDoc(doc(db, 'userProgress', `${user.uid}_${courseId}`), updatedProgress);
      setUserProgress(updatedProgress);
    }
  };

  // 🎨 Fonction utilitaire pour les initiales
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // 📊 Calculer le temps estimé total du cours
  const getTotalEstimatedTime = () => {
    if (!course?.chapters) return 0;

    let total = 0;
    course.chapters.forEach(chapter => {
      if (chapter.estimatedTime) {
        total += chapter.estimatedTime;
      } else {
        // Estimer basé sur le contenu
        chapter.sections.forEach(section => {
          section.content.forEach(block => {
            if (block.type === 'media' && block.media?.duration) {
              total += Math.ceil(block.media.duration / 60);
            } else {
              total += 2; // 2 minutes par défaut
            }
          });
        });
      }
    });

    return total;
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          {/* Loading spinner glassmorphism */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-spin">
                <div className="absolute inset-2 bg-white rounded-full"></div>
              </div>
              <div className="absolute inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/30 rounded-2xl px-8 py-6 border border-white/20 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Chargement du cours</h3>
            <div className="flex items-center justify-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
            {enriching && (
              <p className="text-sm text-gray-600 mt-3">
                Préparation de votre expérience d'apprentissage...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="backdrop-blur-sm bg-white/30 rounded-2xl px-8 py-8 border border-white/20 shadow-xl max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cours non trouvé</h2>
            <p className="text-gray-600 mb-6">
              Le cours que vous recherchez n'existe pas ou n'est plus disponible.
            </p>
            <Button
              onClick={() => navigate('/student/dashboard')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header modernisé avec glassmorphism */}
      <div className="backdrop-blur-sm bg-white/70 shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/student/dashboard')}
                className="text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded-xl px-4 py-2 transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Button>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h1>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {getTotalEstimatedTime()} min
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200"
                    >
                      {course.level}
                    </Badge>
                    {course.instructor && (
                      <span className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        {course.instructor.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Indicateur de progression moderne */}
            <div className="flex items-center space-x-6">
              {progressStats && (
                <div className="text-right">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-sm font-semibold text-gray-900">
                      Progression: {Math.round((progressStats.completedContentBlocks / progressStats.totalContentBlocks) * 100)}%
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>{progressStats.completedContentBlocks}/{progressStats.totalContentBlocks} blocs</span>
                    </div>
                  </div>
                  <div className="w-40">
                    <Progress
                      value={(progressStats.completedContentBlocks / progressStats.totalContentBlocks) * 100}
                      className="h-2 bg-gray-200"
                    />
                  </div>
                  {progressStats.estimatedTimeRemaining > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      ~{progressStats.estimatedTimeRemaining} min restantes
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">

            {/* Video Player modernisé */}
            <Card className="overflow-hidden backdrop-blur-sm bg-white/60 border border-white/20 shadow-xl">
              <CardContent className="p-0">
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>                  {course.videoUrl ? (
                  <div className="relative w-full h-full">
                    {videoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                        <div className="text-center text-white">
                          <div className="w-16 h-16 mx-auto mb-4 relative">
                            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                            <Play className="h-6 w-6 absolute inset-0 m-auto text-blue-400" />
                          </div>
                          <p className="text-lg font-medium">Chargement de la vidéo...</p>
                        </div>
                      </div>
                    )}
                    <video
                      controls
                      className="w-full h-full object-cover"
                      onLoadStart={() => setVideoLoading(true)}
                      onCanPlay={() => setVideoLoading(false)}
                      src={course.videoUrl}
                    >
                      Votre navigateur ne supporte pas les vidéos HTML5.
                    </video>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <PlayCircle className="h-10 w-10 opacity-70" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Vidéo Introductive</h3>
                      <p className="opacity-75">Découvrez ce que vous allez apprendre</p>
                    </div>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>            {/* Course Content Tabs modernisés */}
            <div className="backdrop-blur-sm bg-white/60 border border-white/20 shadow-xl rounded-2xl overflow-hidden">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/50 p-1 m-1 rounded-xl">
                  <TabsTrigger
                    value="content"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium transition-all duration-200"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Contenu
                  </TabsTrigger>
                  <TabsTrigger
                    value="overview"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium transition-all duration-200"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Aperçu
                  </TabsTrigger>
                  <TabsTrigger
                    value="instructor"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium transition-all duration-200"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Instructeur
                  </TabsTrigger>
                </TabsList>

                {/* Contenu principal avec les sections et blocs */}
                <TabsContent value="content" className="p-6 space-y-6">
                  {currentChapter && currentSection ? (
                    <div className="space-y-6">
                      {/* En-tête du chapitre actuel */}
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{currentChapter.title}</h3>
                          </div>
                          {currentChapter.description && (
                            <p className="text-gray-700 mb-4">{currentChapter.description}</p>
                          )}
                          {currentChapter.learningObjectives && currentChapter.learningObjectives.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-800 mb-2">Objectifs d'apprentissage :</h4>
                              <ul className="space-y-1">
                                {currentChapter.learningObjectives.map((objective, index) => (
                                  <li key={index} className="flex items-center text-sm text-gray-600">
                                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                    {objective}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => markChapterComplete(currentChapter.id)}
                          disabled={userProgress?.completedChapters.includes(currentChapter.id)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {userProgress?.completedChapters.includes(currentChapter.id) ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Terminé
                            </>
                          ) : (
                            <>
                              <Award className="h-4 w-4 mr-2" />
                              Terminer ce chapitre
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Navigation entre sections */}
                      {currentChapter.sections.length > 1 && (
                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl">
                          <span className="text-sm font-medium text-gray-700 mr-2">Sections :</span>
                          {currentChapter.sections.map((section) => (
                            <button
                              key={section.id}
                              onClick={() => selectSection(section)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${currentSection?.id === section.id
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                              {section.title}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Contenu de la section actuelle */}
                      <div className="space-y-6">
                        <div className="border-l-4 border-gradient-to-b from-blue-500 to-purple-500 pl-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <ChevronRight className="h-5 w-5 text-blue-600 mr-2" />
                            {currentSection.title}
                          </h4>                          {currentSection.content.length > 0 ? (
                            <div className="space-y-6">
                              {currentSection.content.map((block) => {
                                const isCompleted = userProgress?.completedContentBlocks?.includes(block.id) || false;
                                const isActive = currentBlockId === block.id;

                                return (
                                  <div key={block.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <ContentBlockViewer
                                      block={block}
                                      className="p-6"
                                      isCompleted={isCompleted}
                                      isActive={isActive}
                                      onBlockEnter={(blockId) => startContentBlockTimer(blockId)}
                                      onBlockComplete={(blockId) => markContentBlockComplete(blockId)}
                                      onBlockExit={() => stopContentBlockTimer()}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600">Aucun contenu disponible pour cette section</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Sélectionnez un chapitre</h3>
                      <p className="text-gray-600">Choisissez un chapitre dans le menu de navigation pour commencer votre apprentissage</p>
                    </div>
                  )}
                </TabsContent>                <TabsContent value="overview" className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Description du cours */}
                    <div className="md:col-span-2">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <Target className="h-5 w-5 text-blue-600 mr-2" />
                          Description du cours
                        </h4>
                        <p className="text-gray-700 leading-relaxed">{course.description}</p>
                      </div>
                    </div>

                    {/* Statistiques du cours */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-4">Statistiques</h4>
                      <div className="space-y-4">                        <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600">Étudiants inscrits</span>
                        </div>
                        <span className="font-semibold text-gray-900">Non disponible</span>
                      </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">Évaluation</span>
                          </div>
                          <span className="font-semibold text-gray-900">Pas encore noté</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-600">Chapitres</span>
                          </div>
                          <span className="font-semibold text-gray-900">{course.chapters?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-gray-600">Durée estimée</span>
                          </div>
                          <span className="font-semibold text-gray-900">{getTotalEstimatedTime()} min</span>
                        </div>
                      </div>
                    </div>

                    {/* Progression personnelle */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-4">Votre progression</h4>
                      {progressStats && (
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Blocs de contenu</span>
                              <span className="font-medium text-gray-900">
                                {progressStats.completedContentBlocks}/{progressStats.totalContentBlocks}
                              </span>
                            </div>
                            <Progress
                              value={(progressStats.completedContentBlocks / progressStats.totalContentBlocks) * 100}
                              className="h-3"
                            />
                          </div>
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Temps passé</span>
                              <span className="font-medium text-gray-900">{progressStats.timeSpent} min</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="instructor" className="p-6">
                  {course.instructor ? (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
                      <div className="flex items-start space-x-6">
                        <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                          <AvatarImage src={course.instructor.photoUrl} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold">
                            {getInitials(course.instructor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {course.instructor.name}
                          </h3>
                          {course.instructor.title && (
                            <p className="text-blue-600 font-semibold text-lg mb-4">{course.instructor.title}</p>
                          )}
                          {course.instructor.bio && (
                            <div className="bg-white/50 rounded-lg p-4 border border-white/50">
                              <p className="text-gray-700 leading-relaxed">{course.instructor.bio}</p>
                            </div>
                          )}
                          {course.instructor.expertise && course.instructor.expertise.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-semibold text-gray-900 mb-2">Domaines d'expertise</h4>
                              <div className="flex flex-wrap gap-2">
                                {course.instructor.expertise.map((skill, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructeur non défini</h3>
                      <p className="text-gray-600">Les informations sur l'instructeur ne sont pas disponibles</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>          {/* Sidebar modernisée - Navigation des chapitres */}
          <div className="space-y-6">
            {/* Plan du cours */}
            <Card className="backdrop-blur-sm bg-white/60 border border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-bold">Plan du cours</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {course.chapters && course.chapters.length > 0 ? (
                  <div className="space-y-2 p-4">
                    {course.chapters.map((chapter, index) => {
                      const isCompleted = userProgress?.completedChapters.includes(chapter.id);
                      const isCurrent = currentChapter?.id === chapter.id;
                      const completedSections = chapter.sections.filter(section =>
                        section.content.every(block =>
                          userProgress?.completedContentBlocks?.includes(block.id)
                        )
                      ).length; return (
                        <div key={chapter.id} className="group">
                          <button
                            onClick={() => selectChapter(chapter)}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${isCurrent
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-md'
                              : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${isCompleted
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                  : isCurrent
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                  }`}>
                                  {isCompleted ? (
                                    <CheckCircle className="h-5 w-5" />
                                  ) : (
                                    index + 1
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className={`font-semibold leading-tight ${isCurrent ? 'text-blue-900' : 'text-gray-900'
                                    }`}>
                                    {chapter.title}
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {chapter.estimatedTime && (
                                      <span className="flex items-center text-xs text-gray-500">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {chapter.estimatedTime}min
                                      </span>
                                    )}
                                    <span className="flex items-center text-xs text-gray-500">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {completedSections}/{chapter.sections.length} sections
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isCurrent ? 'rotate-90 text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                                }`} />
                            </div>
                          </button>

                          {/* Liste des sections (en dehors du bouton du chapitre) */}
                          {isCurrent && chapter.sections.length > 0 && (
                            <div className="space-y-2 pl-4 mt-2 border-l-2 border-blue-200 ml-4">
                              {chapter.sections.map((section) => {
                                const sectionCompleted = section.content.every(block =>
                                  userProgress?.completedContentBlocks?.includes(block.id)
                                );
                                const isCurrentSection = currentSection?.id === section.id;

                                return (
                                  <button
                                    key={section.id}
                                    onClick={() => selectSection(section)}
                                    className={`w-full text-left p-2 rounded-lg text-sm transition-all duration-200 ${isCurrentSection
                                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                      : sectionCompleted
                                        ? 'bg-green-50 text-green-800 hover:bg-green-100'
                                        : 'bg-white hover:bg-gray-100 text-gray-700'
                                      }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${sectionCompleted
                                        ? 'bg-green-500'
                                        : isCurrentSection
                                          ? 'bg-white'
                                          : 'bg-gray-300'
                                        }`}>
                                        {sectionCompleted && (
                                          <CheckCircle className="h-2.5 w-2.5 text-white" />
                                        )}
                                      </div>
                                      <span className="font-medium">{section.title}</span>
                                      <span className="text-xs opacity-75">
                                        ({section.content.length} blocs)
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">Pas de chapitres disponibles</p>
                    <p className="text-xs mt-1">Le contenu sera bientôt ajouté</p>
                  </div>
                )}
              </CardContent>
            </Card>            {/* Résumé de progression moderne */}
            {progressStats && (
              <Card className="backdrop-blur-sm bg-white/60 border border-white/20 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold">Progression</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progression globale */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progression globale</span>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round((progressStats.completedContentBlocks / progressStats.totalContentBlocks) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(progressStats.completedContentBlocks / progressStats.totalContentBlocks) * 100}
                      className="h-3 bg-gray-200"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      {progressStats.completedContentBlocks} sur {progressStats.totalContentBlocks} blocs terminés
                    </p>
                  </div>

                  {/* Statistiques détaillées */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700 mb-1">
                        {userProgress?.completedChapters.length || 0}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        Chapitres terminés
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-700 mb-1">
                        {progressStats.timeSpent}
                      </div>
                      <div className="text-xs text-purple-600 font-medium">
                        Minutes étudiées
                      </div>
                    </div>
                  </div>

                  {/* Temps restant estimé */}
                  {progressStats.estimatedTimeRemaining > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">
                            Temps restant estimé
                          </div>
                          <div className="text-xl font-bold text-orange-600">
                            ~{progressStats.estimatedTimeRemaining} min
                          </div>
                        </div>
                      </div>
                    </div>
                  )}                  {/* Bouton de reprise */}
                  {progressStats.completedContentBlocks > 0 && progressStats.completedContentBlocks < progressStats.totalContentBlocks && (
                    <Button
                      onClick={resumeFromLastPosition}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Continuer l'apprentissage
                    </Button>
                  )}{/* Reset progression (pour test) */}
                  {progressStats.completedContentBlocks > 0 && (
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={async () => {
                        if (user?.uid && courseId && window.confirm('Êtes-vous sûr de vouloir réinitialiser votre progression ?')) {
                          const resetProgress: UserProgress = {
                            courseId,
                            completedChapters: [],
                            completedContentBlocks: [],
                            currentChapter: course.chapters?.[0]?.id || '',
                            currentSection: course.chapters?.[0]?.sections?.[0]?.id || null,
                            progressPercentage: 0,
                            lastAccessedAt: new Date(),
                            timeSpent: 0,
                            lastContentBlockId: null,
                            contentBlocksTimeSpent: {}
                          };
                          await setDoc(doc(db, 'userProgress', `${user.uid}_${courseId}`), resetProgress);
                          setUserProgress(resetProgress);
                          if (course) calculateProgressStats(course);
                          toast.success('Progression réinitialisée');
                        }
                      }}
                      className="w-full text-xs text-gray-500 hover:text-gray-700"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Réinitialiser la progression
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}