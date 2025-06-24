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
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course } from '../types';

export const courseService = {
  // Create a new course
  async createCourse(courseData: Partial<Course>): Promise<string> {
    try {
      const courseRef = doc(collection(db, 'courses'));

      await setDoc(courseRef, {
        ...courseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: courseData.status || 'draft',
        assignedTo: courseData.assignedTo || []
      });

      return courseRef.id;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  // Get a course by ID
  async getCourse(courseId: string): Promise<Course> {
    try {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));

      if (!courseDoc.exists()) {
        throw new Error('Course not found');
      }

      return { id: courseDoc.id, ...courseDoc.data() } as Course;
    } catch (error) {
      console.error('Error getting course:', error);
      throw error;
    }
  },

  // Update a course
  async updateCourse(courseId: string, courseData: Partial<Course>): Promise<void> {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        ...courseData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  // Delete a course
  async deleteCourse(courseId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  // Get all courses
  async getAllCourses(): Promise<Course[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        orderBy('createdAt', 'desc')
      );

      const coursesSnapshot = await getDocs(coursesQuery);

      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting all courses:', error);
      throw error;
    }
  },

  // Get courses by company
  async getCoursesByCompany(companyId: string): Promise<Course[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('assignedTo', 'array-contains', companyId)
      );

      const coursesSnapshot = await getDocs(coursesQuery);

      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting courses by company:', error);
      throw error;
    }
  },

  // Assign course to companies
  async assignCourseToCompanies(courseId: string, companyIds: string[]): Promise<void> {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        assignedTo: companyIds,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error assigning course to companies:', error);
      throw error;
    }
  },

  // Get courses by categoryId (normalisé)
  async getCoursesByCategoryId(categoryId: string): Promise<Course[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('categoryId', '==', categoryId)
      );

      const coursesSnapshot = await getDocs(coursesQuery);

      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting courses by categoryId:', error);
      throw error;
    }
  },

  // Get courses by level
  async getCoursesByLevel(level: string): Promise<Course[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('level', '==', level)
      );

      const coursesSnapshot = await getDocs(coursesQuery);

      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting courses by level:', error);
      throw error;
    }
  },

  // Get published courses
  async getPublishedCourses(): Promise<Course[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('status', '==', 'published')
      );

      const coursesSnapshot = await getDocs(coursesQuery);

      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting published courses:', error);
      throw error;
    }
  }
};