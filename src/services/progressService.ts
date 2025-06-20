import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProgressTracking } from '../types';

export const progressService = {
  // Create or update progress tracking
  async trackProgress(progressData: {
    enrollmentId: string;
    userId: string;
    courseId: string;
    companyId: string;
    chapterId: string;
    completed: boolean;
    timeSpent: number;
  }): Promise<void> {
    try {
      // Check if progress tracking already exists
      const progressQuery = query(
        collection(db, 'progress_tracking'),
        where('enrollmentId', '==', progressData.enrollmentId),
        where('chapterId', '==', progressData.chapterId)
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      
      if (!progressSnapshot.empty) {
        // Update existing progress tracking
        const progressDoc = progressSnapshot.docs[0];
        
        await updateDoc(doc(db, 'progress_tracking', progressDoc.id), {
          completed: progressData.completed,
          timeSpent: progressData.timeSpent,
          lastAccessed: serverTimestamp()
        });
      } else {
        // Create new progress tracking
        const progressRef = doc(collection(db, 'progress_tracking'));
        
        await setDoc(progressRef, {
          ...progressData,
          lastAccessed: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error tracking progress:', error);
      throw error;
    }
  },
  
  // Get progress tracking by enrollment
  async getProgressByEnrollment(enrollmentId: string): Promise<ProgressTracking[]> {
    try {
      const progressQuery = query(
        collection(db, 'progress_tracking'),
        where('enrollmentId', '==', enrollmentId)
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      
      return progressSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProgressTracking[];
    } catch (error) {
      console.error('Error getting progress by enrollment:', error);
      throw error;
    }
  },
  
  // Get progress tracking by user and course
  async getProgressByUserAndCourse(userId: string, courseId: string): Promise<ProgressTracking[]> {
    try {
      const progressQuery = query(
        collection(db, 'progress_tracking'),
        where('userId', '==', userId),
        where('courseId', '==', courseId)
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      
      return progressSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProgressTracking[];
    } catch (error) {
      console.error('Error getting progress by user and course:', error);
      throw error;
    }
  },
  
  // Get progress tracking by chapter
  async getProgressByChapter(chapterId: string, userId: string): Promise<ProgressTracking | null> {
    try {
      const progressQuery = query(
        collection(db, 'progress_tracking'),
        where('chapterId', '==', chapterId),
        where('userId', '==', userId)
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      
      if (progressSnapshot.empty) {
        return null;
      }
      
      return { 
        id: progressSnapshot.docs[0].id, 
        ...progressSnapshot.docs[0].data() 
      } as ProgressTracking;
    } catch (error) {
      console.error('Error getting progress by chapter:', error);
      throw error;
    }
  },
  
  // Mark chapter as completed
  async markChapterCompleted(
    enrollmentId: string, 
    userId: string, 
    courseId: string, 
    companyId: string, 
    chapterId: string, 
    timeSpent: number
  ): Promise<void> {
    try {
      await this.trackProgress({
        enrollmentId,
        userId,
        courseId,
        companyId,
        chapterId,
        completed: true,
        timeSpent
      });
    } catch (error) {
      console.error('Error marking chapter as completed:', error);
      throw error;
    }
  },
  
  // Calculate course progress percentage
  async calculateCourseProgress(enrollmentId: string, totalChapters: number): Promise<number> {
    try {
      const progressTracking = await this.getProgressByEnrollment(enrollmentId);
      
      const completedChapters = progressTracking.filter(progress => progress.completed).length;
      
      return Math.round((completedChapters / totalChapters) * 100);
    } catch (error) {
      console.error('Error calculating course progress:', error);
      throw error;
    }
  }
};