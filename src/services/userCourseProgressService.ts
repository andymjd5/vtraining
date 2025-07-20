import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserCourseProgress } from '../types';

const COLLECTION = 'user_course_progress';

export const userCourseProgressService = {
  // Crée ou initialise la progression pour un user/course
  async createOrInitProgress({ userId, courseId }: { userId: string; courseId: string; }): Promise<UserCourseProgress> {
    const id = `${userId}_${courseId}`;
    const progressRef = doc(db, COLLECTION, id);
    const progressSnap = await getDoc(progressRef);
    if (progressSnap.exists()) {
      return { id, ...progressSnap.data() } as UserCourseProgress;
    }
    const newProgress: UserCourseProgress = {
      id,
      userId,
      courseId,
      completedChapters: [],
      completedSections: [],
      completedBlocks: [],
      completedQuizzes: [],
      contentBlocksTimeSpent: {},
      timeSpent: 0,
      lastAccessedAt: serverTimestamp(),
      status: 'NOT_STARTED',
    };
    await setDoc(progressRef, newProgress);
    return newProgress;
  },

  // Récupère la progression détaillée pour un user/course
  async getProgressByUserAndCourse(userId: string, courseId: string): Promise<UserCourseProgress | null> {
    const id = `${userId}_${courseId}`;
    const progressRef = doc(db, COLLECTION, id);
    const progressSnap = await getDoc(progressRef);
    if (!progressSnap.exists()) return null;
    return { id, ...progressSnap.data() } as UserCourseProgress;
  },

  // Met à jour la progression
  async updateProgress(userId: string, courseId: string, updates: Partial<UserCourseProgress>): Promise<void> {
    const id = `${userId}_${courseId}`;
    const progressRef = doc(db, COLLECTION, id);
    await updateDoc(progressRef, { ...updates, lastAccessedAt: serverTimestamp() });
  },

  // Enregistre une action de progression (valider bloc, ajouter temps, etc.)
  async trackProgress({ userId, courseId, ...updates }: { userId: string; courseId: string; [key: string]: any }): Promise<void> {
    await userCourseProgressService.updateProgress(userId, courseId, updates);
  },

  // Supprime la progression détaillée
  async deleteProgress(userId: string, courseId: string): Promise<void> {
    const id = `${userId}_${courseId}`;
    const progressRef = doc(db, COLLECTION, id);
    await deleteDoc(progressRef);
  },

  // Récupère toutes les progressions d'un user (optionnel)
  async getAllProgressByUser(userId: string): Promise<UserCourseProgress[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as UserCourseProgress[];
  },
}; 