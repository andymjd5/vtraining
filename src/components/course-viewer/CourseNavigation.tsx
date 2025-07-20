import React, { useEffect } from 'react';
import { CheckCircle, BookOpen, ChevronDown, ChevronRight, Lock, Award } from 'lucide-react';
import { useCourseProgress } from '../../hooks/useCourseProgress';

interface CourseNavigationProps {
  chapters: any[];
  currentChapterId: string;
  onSelectChapter: (chapterIndex: number) => void;
  currentSectionId: string | null;
  onSelectSection: (sectionIndex: number) => void;
  completedQuizzes?: string[]; // Liste des chapterId dont le quiz est réussi
  completedChapters?: string[]; // Liste des chapterId validés
  completedSections?: {chapterId: string, sectionId: string}[]; // Liste des sections validées
  onSelectQuiz?: (chapterId: string) => void; // Nouveau callback pour les quiz
}

const CourseNavigation: React.FC<CourseNavigationProps> = ({
  chapters,
  currentChapterId,
  onSelectChapter,
  currentSectionId,
  onSelectSection,
  completedQuizzes = [],
  completedChapters = [],
  completedSections = [],
  onSelectQuiz,
}) => {
  // Fonction pour déterminer si un quiz est disponible
  const isQuizAvailable = (chapter: any) => {
    if (!chapter.hasQuiz) return false;
    
    // Vérifier si toutes les sections du chapitre sont complétées
    const chapterSections = chapter.sections || [];
    const completedSectionsForChapter = completedSections.filter(cs => cs.chapterId === chapter.id);
    
    return chapterSections.length > 0 && 
           chapterSections.every((section: any) => 
             completedSectionsForChapter.some(cs => cs.sectionId === section.id)
           );
  };

  // Fonction pour déterminer si un quiz est réussi
  const isQuizCompleted = (chapterId: string) => {
    return completedQuizzes.includes(chapterId);
  };

  return (
    <nav className="py-4 px-2 h-full overflow-y-auto overflow-x-hidden">
      <ul className="space-y-2">
        {chapters.map((chapter, cIdx) => {
          const isCurrent = chapter.id === currentChapterId;
          const isCompleted = completedChapters.includes(chapter.id);
          const quizAvailable = isQuizAvailable(chapter);
          const quizCompleted = isQuizCompleted(chapter.id);
          
          return (
            <li key={chapter.id}>
              <button
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all group shadow-sm
                  ${isCurrent ? 'bg-blue-600 text-white font-bold' : isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-blue-50 text-gray-800'}
                  border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                onClick={() => onSelectChapter(cIdx)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Chapitre ${cIdx + 1} : ${chapter.title}`}
                style={{overflowX: 'hidden'}}
              >
                <span className="flex items-center gap-2 w-0 flex-1 min-w-0">
                  <BookOpen className={`w-5 h-5 ${isCurrent ? 'text-white' : isCompleted ? 'text-gray-400' : 'text-blue-500'}`} />
                  <span className="whitespace-normal break-words text-left">{chapter.title}</span>
                </span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  {isCompleted && (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-400" aria-label="Chapitre validé" />
                      <span className="sr-only">Chapitre validé</span>
                    </>
                  )}
                  {isCurrent ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </span>
              </button>
              
              {/* Sections du chapitre courant */}
              {isCurrent && chapter.sections && chapter.sections.length > 0 && (
                <ul className="pl-8 py-2 space-y-1">
                  {chapter.sections.map((section: any, sIdx: number) => {
                    const isSectionCurrent = section.id === currentSectionId;
                    const isSectionCompleted = completedSections.some(cs => cs.chapterId === chapter.id && cs.sectionId === section.id);
                    return (
                      <li key={section.id}>
                        <button
                          className={`w-full text-left px-3 py-2 rounded-md transition-all
                            ${isSectionCurrent ? 'bg-blue-100 text-blue-800 font-semibold' : isSectionCompleted ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-100 text-gray-700'}
                            focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm whitespace-normal break-words`}
                          onClick={() => onSelectSection(sIdx)}
                          aria-current={isSectionCurrent ? 'step' : undefined}
                          aria-label={`Section : ${section.title}`}
                        >
                          {isSectionCompleted && <CheckCircle className="inline h-4 w-4 text-green-400 ml-1" aria-label="Section validée" />}
                          • {section.title}
                        </button>
                      </li>
                    );
                  })}
                  
                  {/* Quiz du chapitre */}
                  {chapter.hasQuiz && (
                    <li className="mt-2">
                      <button
                        className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-2
                          ${quizCompleted 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : quizAvailable 
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200' 
                              : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                          }
                          focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm whitespace-normal break-words`}
                        onClick={() => {
                          if (quizAvailable && onSelectQuiz) {
                            onSelectQuiz(chapter.id);
                          }
                        }}
                        disabled={!quizAvailable}
                        aria-label={`Quiz : ${quizCompleted ? 'Réussi' : quizAvailable ? 'Disponible' : 'Verrouillé'}`}
                      >
                        {quizCompleted ? (
                          <>
                            <Award className="h-4 w-4 text-green-600" />
                            <span>🎯 Quiz réussi</span>
                          </>
                        ) : quizAvailable ? (
                          <>
                            <Award className="h-4 w-4 text-yellow-600" />
                            <span>🎯 Quiz disponible</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 text-gray-400" />
                            <span>🔒 Quiz verrouillé</span>
                          </>
                        )}
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CourseNavigation; 