import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Enrollment } from '../types';

export const enrollmentService = {
  // Create a new enrollment
  async createEnrollment(enrollmentData: {
    userId: string;
    courseId: string;
    companyId: string;
  }): Promise<string> {
    try {
      const enrollmentRef = doc(collection(db, 'enrollments'));
      
      await setDoc(enrollmentRef, {
        ...enrollmentData,
        status: 'NOT_STARTED',
        progress: 0,
        enrolledAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });
      
      return enrollmentRef.id;
    } catch (error) {
      console.error('Error creating enrollment:', error);
      throw error;
    }
  },
  
  // Get an enrollment by ID
  async getEnrollment(enrollmentId: string): Promise<Enrollment> {
    try {
      const enrollmentDoc = await getDoc(doc(db, 'enrollments', enrollmentId));
      
      if (!enrollmentDoc.exists()) {
        throw new Error('Enrollment not found');
      }
      
      return { id: enrollmentDoc.id, ...enrollmentDoc.data() } as Enrollment;
    } catch (error) {
      console.error('Error getting enrollment:', error);
      throw error;
    }
  },
  
  // Update an enrollment
  async updateEnrollment(enrollmentId: string, enrollmentData: Partial<Enrollment>): Promise<void> {
    try {
      await updateDoc(doc(db, 'enrollments', enrollmentId), {
        ...enrollmentData,
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating enrollment:', error);
      throw error;
    }
  },
  
  // Delete an enrollment
  async deleteEnrollment(enrollmentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'enrollments', enrollmentId));
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      throw error;
    }
  },
  
  // Get enrollments by user
  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    try {
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('userId', '==', userId)
      );
      
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      
      return enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Enrollment[];
    } catch (error) {
      console.error('Error getting enrollments by user:', error);
      throw error;
    }
  },
  
  // Get enrollments by course
  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    try {
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('courseId', '==', courseId)
      );
      
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      
      return enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Enrollment[];
    } catch (error) {
      console.error('Error getting enrollments by course:', error);
      throw error;
    }
  },
  
  // Get enrollments by company
  async getEnrollmentsByCompany(companyId: string): Promise<Enrollment[]> {
    try {
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('companyId', '==', companyId)
      );
      
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      
      return enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Enrollment[];
    } catch (error) {
      console.error('Error getting enrollments by company:', error);
      throw error;
    }
  },
  
  // Get enrollment by user and course
  async getEnrollmentByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null> {
    try {
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('userId', '==', userId),
        where('courseId', '==', courseId)
      );
      
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      
      if (enrollmentsSnapshot.empty) {
        return null;
      }
      
      return { 
        id: enrollmentsSnapshot.docs[0].id, 
        ...enrollmentsSnapshot.docs[0].data() 
      } as Enrollment;
    } catch (error) {
      console.error('Error getting enrollment by user and course:', error);
      throw error;
    }
  },
  
  // Update enrollment progress
  async updateEnrollmentProgress(enrollmentId: string, progress: number): Promise<void> {
    try {
      await updateDoc(doc(db, 'enrollments', enrollmentId), {
        progress,
        lastActivity: serverTimestamp(),
        status: progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
      });
    } catch (error) {
      console.error('Error updating enrollment progress:', error);
      throw error;
    }
  },
  
  // Update enrollment time spent
  async updateEnrollmentTimeSpent(enrollmentId: string, additionalTimeInSeconds: number): Promise<void> {
    try {
      const enrollmentDoc = await getDoc(doc(db, 'enrollments', enrollmentId));
      
      if (!enrollmentDoc.exists()) {
        throw new Error('Enrollment not found');
      }
      
      const currentTimeSpent = enrollmentDoc.data().timeSpent || 0;
      
      await updateDoc(doc(db, 'enrollments', enrollmentId), {
        timeSpent: currentTimeSpent + additionalTimeInSeconds,
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating enrollment time spent:', error);
      throw error;
    }
  }
};