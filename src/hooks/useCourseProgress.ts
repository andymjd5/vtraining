import { useEffect, useState, useCallback } from 'react';
import { userCourseProgressService } from '../services/userCourseProgressService';
import { UserCourseProgress } from '../types';
import { CourseWithStructure, ChapterWithSections, SectionWithContent, ContentBlock } from '../types/course';
import { courseService } from '../services/courseService';

interface UseCourseProgressResult {
  course: CourseWithStructure | null;
  progress: UserCourseProgress | null;
  loading: boolean;
  error: any;
  progressPercentage: number;
  timeSpent: number;
  estimatedTimeRemaining: number;
  currentChapter: ChapterWithSections | null;
  currentSection: SectionWithContent | null;
  currentBlock: ContentBlock | null;
  currentChapterIndex: number;
  currentSectionIndex: number;
  currentBlockIndex: number;
  selectChapter: (index: number) => void;
  selectSection: (index: number) => void;
  selectBlock: (index: number) => void;
  markBlockComplete: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProgress: (updates: Partial<UserCourseProgress>) => Promise<void>;
  trackProgress: (updates: Partial<UserCourseProgress>) => Promise<void>;
  validateBlock: () => Promise<void>;
  validateSection: () => Promise<void>;
}

export function useCourseProgress(userId: string, courseId: string): UseCourseProgressResult {
  const [course, setCourse] = useState<CourseWithStructure | null>(null);
  const [progress, setProgress] = useState<UserCourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Navigation state
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  // Fetch course and progress
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const courseData = await courseService.loadCourseWithStructure(courseId);
      setCourse(courseData);
      let prog = await userCourseProgressService.getProgressByUserAndCourse(userId, courseId);
      if (!prog) {
        prog = await userCourseProgressService.createOrInitProgress({ userId, courseId });
      }
      setProgress(prog);

      // Nouvelle logique : positionner l'utilisateur sur la dernière progression connue
      if (courseData && prog && Array.isArray(courseData.chapters)) {
        // Chercher l'index du chapitre
        let chapterIdx = 0;
        let sectionIdx = 0;
        let blockIdx = 0;
        if (prog.lastChapterId) {
          chapterIdx = courseData.chapters.findIndex(ch => ch.id === prog.lastChapterId);
          if (chapterIdx === -1) chapterIdx = 0;
        }
        if (prog.lastSectionId && courseData.chapters[chapterIdx]) {
          sectionIdx = courseData.chapters[chapterIdx].sections.findIndex(sec => sec.id === prog.lastSectionId);
          if (sectionIdx === -1) sectionIdx = 0;
        }
        if (prog.lastContentBlockId && courseData.chapters[chapterIdx]?.sections[sectionIdx]) {
          blockIdx = courseData.chapters[chapterIdx].sections[sectionIdx].content.findIndex(b => b.id === prog.lastContentBlockId);
          if (blockIdx === -1) blockIdx = 0;
        }
        // Aller à l'épisode suivant non validé si possible
        // Si le dernier bloc est validé, avancer au suivant
        const completedBlocks = prog.completedBlocks || [];
        const sectionContent = courseData.chapters[chapterIdx]?.sections[sectionIdx]?.content || [];
        if (blockIdx < sectionContent.length - 1) {
          // Si le bloc courant est validé, avancer au suivant non validé
          let nextBlock = blockIdx;
          while (nextBlock < sectionContent.length && completedBlocks.includes(sectionContent[nextBlock].id)) {
            nextBlock++;
          }
          if (nextBlock < sectionContent.length) {
            blockIdx = nextBlock;
          }
        }
        setCurrentChapterIndex(chapterIdx);
        setCurrentSectionIndex(sectionIdx);
        setCurrentBlockIndex(blockIdx);
      }
      // Sinon, ne rien faire (ne pas reset navigation)
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId, courseId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Navigation helpers
  const currentChapter = course?.chapters?.[currentChapterIndex] || null;
  const currentSection = currentChapter?.sections?.[currentSectionIndex] || null;
  const currentBlock = currentSection?.content?.[currentBlockIndex] || null;

  const selectChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setCurrentSectionIndex(0);
    setCurrentBlockIndex(0);
  };
  const selectSection = (index: number) => {
    setCurrentSectionIndex(index);
    setCurrentBlockIndex(0);
  };
  const selectBlock = (index: number) => {
    setCurrentBlockIndex(index);
  };

  // Calcul progression
  // Ancienne version (par blocs)
  // const totalBlocks = course?.chapters?.reduce((sum, ch) => sum + ch.sections.reduce((s, sec) => s + (sec.content?.length || 0), 0), 0) || 0;
  // const completedBlocks = progress?.completedBlocks?.length || 0;
  // const progressPercentage = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  // Nouvelle version : progression basée sur sections + quiz
  // 1. Nombre total de sections
  const totalSections = course?.chapters?.reduce((sum, ch) => sum + (ch.sections?.length || 0), 0) || 0;
  // 2. Nombre total de quiz (un par chapitre qui a un quiz)
  const totalQuizzes = course?.chapters?.filter(ch => ch.hasQuiz).length || 0;
  // 3. Total à compléter
  const totalToComplete = totalSections + totalQuizzes;
  // 4. Sections complétées
  const completedSections = progress?.completedSections?.length || 0;
  // 5. Quiz complétés
  const completedQuizzes = progress?.completedQuizzes?.length || 0;
  // 6. Total complété
  const totalCompleted = completedSections + completedQuizzes;
  // 7. Pourcentage
  const progressPercentage = totalToComplete > 0 ? Math.round((totalCompleted / totalToComplete) * 100) : 0;
  const timeSpent = progress?.timeSpent || 0;
  // Estimation naïve : 2 min par bloc restant
  const estimatedTimeRemaining = totalToComplete > totalCompleted ? (totalToComplete - totalCompleted) * 2 : 0;

  // Validation d'un bloc (à la volée, ex: scroll 40%)
  const validateBlock = async () => {
    if (!course || !currentChapter || !currentSection || !currentBlock || !progress) return;
    // Si déjà validé, ne rien faire
    if (progress.completedBlocks.includes(currentBlock.id)) return;
    await userCourseProgressService.updateProgress(userId, courseId, {
      completedBlocks: [...progress.completedBlocks, currentBlock.id],
      lastChapterId: currentChapter.id,
      lastSectionId: currentSection.id,
      lastContentBlockId: currentBlock.id,
    });
    await fetchAll();
  };

  // Validation manuelle d'une section (bouton)
  const validateSection = async () => {
    if (!course || !currentChapter || !currentSection || !progress) return;
    // 1. Valider tous les blocs de la section
    const allBlockIds = currentSection.content.map(b => b.id);
    const newCompletedBlocks = Array.from(new Set([
      ...progress.completedBlocks,
      ...allBlockIds
    ]));
    // 2. Valider la section
    const newCompletedSections = progress.completedSections.includes(currentSection.id)
      ? progress.completedSections
      : [...progress.completedSections, currentSection.id];
    // 3. Valider le chapitre si toutes les sections sont validées
    const allSectionIds = currentChapter.sections.map(s => s.id);
    const allSectionsCompleted = allSectionIds.every(id => newCompletedSections.includes(id));
    const newCompletedChapters = allSectionsCompleted && !progress.completedChapters.includes(currentChapter.id)
      ? [...progress.completedChapters, currentChapter.id]
      : progress.completedChapters;
    await userCourseProgressService.updateProgress(userId, courseId, {
      completedBlocks: newCompletedBlocks,
      completedSections: newCompletedSections,
      completedChapters: newCompletedChapters,
      lastChapterId: currentChapter.id,
      lastSectionId: currentSection.id,
      lastContentBlockId: currentSection.content[currentSection.content.length - 1]?.id || undefined,
    });
    await fetchAll();
  };

  const updateProgress = useCallback(async (updates: Partial<UserCourseProgress>) => {
    if (!userId || !courseId) return;
    setLoading(true);
    try {
      await userCourseProgressService.updateProgress(userId, courseId, updates);
      await fetchAll();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId, courseId, fetchAll]);

  const trackProgress = useCallback(async (updates: Partial<UserCourseProgress>) => {
    if (!userId || !courseId) return;
    setLoading(true);
    try {
      await userCourseProgressService.trackProgress({ userId, courseId, ...updates });
      await fetchAll();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId, courseId, fetchAll]);

  return {
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
    currentChapterIndex,
    currentSectionIndex,
    currentBlockIndex,
    selectChapter,
    selectSection,
    selectBlock,
    markBlockComplete: validateBlock,
    refresh: fetchAll,
    updateProgress,
    trackProgress,
    validateBlock,
    validateSection,
  };
} 