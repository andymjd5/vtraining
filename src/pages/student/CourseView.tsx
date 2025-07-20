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
import { useSidebar } from '../../contexts/SidebarContext';

import {
  CheckCircle,
  Clock,
  BookOpen,
  ArrowLeft,
  PlayCircle,
  Users,
  Award,
  ChevronRight,
  GraduationCap,
  FileText,
  Play,
  RotateCcw,
  Target,
  TrendingUp,
  Menu,
  List,
  ChevronDown
} from 'lucide-react';
import ContentBlockViewer from '../../components/course-viewer/ContentBlockViewer';
import {
  CourseWithStructure,
  ChapterWithSections,
  SectionWithContent
} from '../../types/course';
import CourseNavigation from '../../components/course-viewer/CourseNavigation';
import CourseProgressBar from '../../components/course-viewer/CourseProgressBar';
import CourseContentDisplay from '../../components/course-viewer/CourseContentDisplay';
import CourseQuiz from '../../components/course-viewer/CourseQuiz';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ui/ToastContainer';

// 📊 Interface pour les statistiques de progression
interface ProgressStats {
  totalContentBlocks: number;
  completedContentBlocks: number;
  currentContentBlock: string | null;
  timeSpent: number; // en minutes
  estimatedTimeRemaining: number; // en minutes
}

const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message)
};

export default function CourseView() {
  const { courseId } = useParams<{ courseId: string }>();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { forceExpand } = useSidebar();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const {
    course,
    progress,
    loading,
    error,
    progressPercentage,
      timeSpent,
    estimatedTimeRemaining,
    currentChapter,
    currentSection,
    currentBlock,
    selectChapter,
    selectSection,
    selectBlock,
    currentChapterIndex,
    currentSectionIndex,
    currentBlockIndex,
    markBlockComplete,
    validateBlock,
    validateSection
  } = useCourseProgress(user?.uid || '', courseId || '');

  const { toasts, success, removeToast } = useToast();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">Chargement du cours...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-lg w-full">
          <h2 className="text-red-600 text-xl font-semibold mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-lg w-full">
          <h2 className="text-gray-800 text-xl font-semibold mb-4">Cours introuvable</h2>
          <button
            onClick={() => window.history.back()}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Calcul navigation fine
  const hasPrevBlock = currentBlockIndex > 0 || currentSectionIndex > 0 || currentChapterIndex > 0;
  const hasNextBlock = (() => {
    if (!currentSection || !currentChapter || !course) return false;
    // S'il reste des blocs dans la section
    if (currentBlockIndex < (currentSection.content?.length || 0) - 1) return true;
    // S'il reste des sections dans le chapitre
    if (currentSectionIndex < (currentChapter.sections?.length || 0) - 1) return true;
    // S'il reste des chapitres
    if (currentChapterIndex < (course.chapters?.length || 0) - 1) return true;
    return false;
  })();

  const goToPrev = () => {
    if (currentBlockIndex > 0) {
      selectBlock(currentBlockIndex - 1);
    } else if (currentSectionIndex > 0 && currentChapter) {
      selectSection(currentSectionIndex - 1);
      // Aller au dernier bloc de la section précédente
      setTimeout(() => {
        if (currentChapter?.sections?.[currentSectionIndex - 1]?.content?.length) {
          selectBlock(currentChapter.sections[currentSectionIndex - 1].content.length - 1);
        }
      }, 0);
    } else if (currentChapterIndex > 0 && course?.chapters) {
      selectChapter(currentChapterIndex - 1);
      // Aller à la dernière section et au dernier bloc du chapitre précédent
      setTimeout(() => {
        const prevChapter = course?.chapters?.[currentChapterIndex - 1];
        if (prevChapter?.sections?.length) {
          selectSection(prevChapter.sections.length - 1);
          const lastSection = prevChapter.sections[prevChapter.sections.length - 1];
          if (lastSection?.content?.length) {
            selectBlock(lastSection.content.length - 1);
          }
        }
      }, 0);
    }
  };

  const goToNext = () => {
    if (currentSection && currentBlockIndex < (currentSection.content?.length || 0) - 1) {
      selectBlock(currentBlockIndex + 1);
    } else if (currentChapter && currentSectionIndex < (currentChapter.sections?.length || 0) - 1) {
      selectSection(currentSectionIndex + 1);
      setTimeout(() => selectBlock(0), 0);
    } else if (course?.chapters && currentChapterIndex < (course.chapters.length || 0) - 1) {
      selectChapter(currentChapterIndex + 1);
      setTimeout(() => {
        if (course.chapters?.[currentChapterIndex + 1]?.sections?.length) {
          selectSection(0);
          setTimeout(() => selectBlock(0), 0);
        }
      }, 0);
    }
  };

  // Callback pour la validation d'un bloc
  const handleBlockComplete = async () => {
    await markBlockComplete();
    success('Bloc validé avec succès !');
  };

  // Callback pour la navigation vers un quiz
  const handleQuizSelect = (chapterId: string) => {
    navigate(`/quiz/${chapterId}`);
  };

  const isCurrentChapterCompleted = currentChapter?.id ? progress?.completedChapters?.includes(currentChapter.id) : false;

  const completedSections = (progress?.completedSections || [])
    .map(sectionId => {
      let chapterId: string | undefined = undefined;
      if (course && Array.isArray(course.chapters)) {
        for (const chap of course.chapters) {
          if (Array.isArray(chap.sections) && chap.sections.some(sec => sec.id === sectionId)) {
            chapterId = chap.id;
            break;
          }
        }
      }
      return chapterId ? { chapterId, sectionId } : undefined;
    })
    .filter((item): item is { chapterId: string; sectionId: string } => Boolean(item && typeof item.chapterId === 'string'));

  const isSectionValidated = !!(currentSection && progress?.completedSections?.includes(currentSection.id));

    return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar navigation */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r shadow-lg sticky top-0 h-screen z-20">
        <div className="flex-1 overflow-y-auto">
                    <CourseNavigation
            chapters={course.chapters || []}
            currentChapterId={currentChapter?.id || ''}
            onSelectChapter={selectChapter}
            currentSectionId={currentSection?.id || ''}
            onSelectSection={selectSection}
            completedQuizzes={progress?.completedQuizzes || []}
            completedChapters={progress?.completedChapters || []}
            completedSections={completedSections}
            onSelectQuiz={handleQuizSelect}
                    />
        </div>
        <div className="p-4 border-t bg-gray-50">
          <CourseProgressBar
            progressPercentage={progressPercentage}
            timeSpent={timeSpent}
            estimatedTimeRemaining={estimatedTimeRemaining}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header sticky */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-white shadow-sm sticky top-0 z-30 border-b">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate max-w-xs md:max-w-md" title={course.title}>{course.title}</h1>
              {/* Navigation mobile - affichage du chapitre/section actuel */}
              <div className="md:hidden flex items-center gap-2 mt-1">
                <button
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  <List className="w-4 h-4" />
                  <span className="truncate max-w-32">
                    {currentChapter?.title || 'Chapitre'} - {currentSection?.title || 'Section'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
            <Badge className="ml-2 bg-blue-100 text-blue-800">{progressPercentage}%</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Avatar>
              {course.instructor?.photoUrl ? (
                <AvatarImage src={course.instructor.photoUrl} alt={course.instructor.name} />
              ) : (
                <AvatarFallback>{course.instructor?.name?.[0] || '?'}</AvatarFallback>
              )}
            </Avatar>
            <span className="hidden md:inline text-gray-700 text-sm font-medium">{course.instructor?.name}</span>
          </div>
        </header>

        {/* Navigation mobile déroulante */}
        {mobileNavOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
            <div className="p-4 max-h-64 overflow-y-auto">
              <CourseNavigation
                chapters={course.chapters || []}
                currentChapterId={currentChapter?.id || ''}
                onSelectChapter={(index) => {
                  selectChapter(index);
                  setMobileNavOpen(false);
                }}
                currentSectionId={currentSection?.id || ''}
                onSelectSection={(index) => {
                  selectSection(index);
                  setMobileNavOpen(false);
                }}
                completedQuizzes={progress?.completedQuizzes || []}
                completedChapters={progress?.completedChapters || []}
                completedSections={completedSections}
                onSelectQuiz={(chapterId) => {
                  handleQuizSelect(chapterId);
                  setMobileNavOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Barre de progression mobile */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Progression</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Temps passé: {Math.round(timeSpent / 60)}min</span>
            <span>Reste: {Math.round(estimatedTimeRemaining / 60)}min</span>
          </div>
        </div>

        {/* Content block */}
        <section className="flex-1 flex flex-col items-center justify-center px-2 md:px-8 py-6 md:py-12 pb-20 md:pb-12">
          <div className="w-full max-w-3xl">
            <CourseContentDisplay
              contentBlock={currentBlock}
              progress={progress}
              validateBlock={validateBlock}
              onComplete={handleBlockComplete}
              onStart={() => {}}
              onPrev={goToPrev}
              onNext={goToNext}
              hasPrev={hasPrevBlock}
              hasNext={hasNextBlock}
            />
            {/* Quiz à la fin du chapitre */}
            {currentChapter?.hasQuiz &&
              currentBlockIndex === (currentSection?.content?.length || 1) - 1 &&
              currentSectionIndex === (currentChapter.sections?.length || 1) - 1 && (
                <div className="mt-8">
                  <CourseQuiz
                    chapterId={currentChapter.id}
                    courseId={course.id}
                    onQuizComplete={() => {}}
                  />
                </div>
              )}
            </div>
        </section>

        {/* Footer navigation (mobile ou sticky desktop) */}
        <footer className="fixed bottom-0 left-0 w-full bg-white shadow-lg flex justify-between px-4 md:px-8 py-4 md:static md:shadow-none z-40 border-t md:border-0">
          <Button
            onClick={goToPrev}
            disabled={!hasPrevBlock}
            className="px-4 md:px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm md:text-base"
          >
            <span className="hidden sm:inline">Précédent</span>
            <span className="sm:hidden">←</span>
          </Button>
          <Button
            type="button"
            onClick={async () => {
              await validateSection();
              goToNext();
            }}
            disabled={!currentSection || isSectionValidated}
            className="px-4 md:px-8 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 shadow-md transition-all disabled:opacity-50 text-sm md:text-base"
          >
            <span className="hidden sm:inline">
              {isSectionValidated ? 'Section validée' : 'Valider la section'}
            </span>
            <span className="sm:hidden">
              {isSectionValidated ? '✓' : 'Valider'}
            </span>
          </Button>
          <Button
            onClick={goToNext}
            disabled={!hasNextBlock}
            className="px-4 md:px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm md:text-base"
          >
            <span className="hidden sm:inline">Suivant</span>
            <span className="sm:hidden">→</span>
          </Button>
        </footer>
      </main>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}