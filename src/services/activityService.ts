import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ActivityLog } from '../types';

export const activityService = {
  // Log user activity
  async logActivity(data: {
    userId: string;
    companyId: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName?: string;
  }): Promise<void> {
    try {
      const logRef = doc(collection(db, 'activity_logs'));
      
      await setDoc(logRef, {
        ...data,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to prevent disrupting user flow
    }
  },
  
  // Get recent activity logs
  async getRecentActivity(limit: number = 20): Promise<ActivityLog[]> {
    try {
      const logsQuery = query(
        collection(db, 'activity_logs'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      
      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  },
  
  // Get activity logs by user
  async getActivityByUser(userId: string, limit: number = 20): Promise<ActivityLog[]> {
    try {
      const logsQuery = query(
        collection(db, 'activity_logs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      
      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
    } catch (error) {
      console.error('Error getting activity by user:', error);
      throw error;
    }
  },
  
  // Get activity logs by company
  async getActivityByCompany(companyId: string, limit: number = 20): Promise<ActivityLog[]> {
    try {
      const logsQuery = query(
        collection(db, 'activity_logs'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      
      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
    } catch (error) {
      console.error('Error getting activity by company:', error);
      throw error;
    }
  },
  
  // Get activity logs by entity
  async getActivityByEntity(entityType: string, entityId: string, limit: number = 20): Promise<ActivityLog[]> {
    try {
      const logsQuery = query(
        collection(db, 'activity_logs'),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      
      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
    } catch (error) {
      console.error('Error getting activity by entity:', error);
      throw error;
    }
  }
};