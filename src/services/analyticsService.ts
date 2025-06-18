import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  getDoc 
} from 'firebase/firestore';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const analyticsService = {
  // Company Statistics
  async getCompanyStats(companyId?: string) {
    try {
      if (companyId) {
        // Get specific company stats
        const companyRef = doc(db, 'companies', companyId);
        const companyDoc = await getDoc(companyRef);
        
        if (!companyDoc.exists()) {
          throw new Error('Company not found');
        }

        const companyData = companyDoc.data();

        // Get users count for this company
        const usersQuery = query(
          collection(db, 'users'),
          where('companyId', '==', companyId)
        );
        const usersSnapshot = await getDocs(usersQuery);

        // Get courses count for this company
        const coursesQuery = query(
          collection(db, 'courses'),
          where('companyId', '==', companyId)
        );
        const coursesSnapshot = await getDocs(coursesQuery);

        // Get enrollments for this company
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('companyId', '==', companyId)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

        return {
          id: companyDoc.id,
          name: companyData?.name || 'Unknown Company', // Protection contre undefined
          totalUsers: usersSnapshot.size,
          totalCourses: coursesSnapshot.size,
          totalEnrollments: enrollmentsSnapshot.size,
          ...companyData
        };
      } else {
        // Get all companies with their stats
        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        const companiesStats = [];

        for (const companyDoc of companiesSnapshot.docs) {
          const companyId = companyDoc.id;
          const companyData = companyDoc.data();
          
          // Get users count
          const usersQuery = query(
            collection(db, 'users'),
            where('companyId', '==', companyId)
          );
          const usersSnapshot = await getDocs(usersQuery);

          // Get courses count
          const coursesQuery = query(
            collection(db, 'courses'),
            where('companyId', '==', companyId)
          );
          const coursesSnapshot = await getDocs(coursesQuery);

          companiesStats.push({
            id: companyDoc.id,
            name: companyData?.name || 'Unknown Company', // Protection contre undefined
            totalUsers: usersSnapshot.size,
            totalCourses: coursesSnapshot.size,
            ...companyData
          });
        }

        return companiesStats;
      }
    } catch (error) {
      console.error('Error fetching company stats:', error);
      // Retourner une structure vide plutôt que de lancer l'erreur
      return companyId ? {
        id: companyId,
        name: 'Unknown Company',
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0
      } : [];
    }
  },

  // User Progress
  async getUserProgress(userId: string) {
    try {
      // Vérification de l'userId
      if (!userId) {
        return [];
      }

      // Get user enrollments
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('userId', '==', userId)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      const progressData = [];

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data();
        
        // Protection contre les données manquantes d'enrollment
        if (!enrollment?.courseId) {
          continue;
        }
        
        // Get course details
        const courseRef = doc(db, 'courses', enrollment.courseId);
        const courseDoc = await getDoc(courseRef);

        // Get progress tracking - CORRECTION: nom de collection en minuscule
        const progressQuery = query(
          collection(db, 'progress_tracking'),
          where('enrollmentId', '==', enrollmentDoc.id)
        );
        const progressSnapshot = await getDocs(progressQuery);

        const progressItems = progressSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            completed: data?.completed || false,
            timeSpent: data?.timeSpent || 0,
            ...data
          };
        });
        
        const completedLessons = progressItems.filter(p => p.completed === true).length;
        const totalLessons = progressItems.length;

        const courseData = courseDoc.exists() ? courseDoc.data() : null;

        progressData.push({
          enrollmentId: enrollmentDoc.id,
          courseId: enrollment.courseId,
          courseName: courseData?.title || 'Unknown Course', // Protection contre undefined
          status: enrollment?.status || 'not_started', // Valeur par défaut
          completedLessons,
          totalLessons,
          progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          lastActivity: enrollment?.lastActivity || null,
          timeSpent: progressItems.reduce((sum, p) => sum + (p.timeSpent || 0), 0)
        });
      }

      return progressData;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return []; // Retourner un tableau vide plutôt que de lancer l'erreur
    }
  },

  // Course Analytics
  async getCourseAnalytics(courseId: string) {
    try {
      // Vérification du courseId
      if (!courseId) {
        return {};
      }

      // Get all enrollments for this course
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('courseId', '==', courseId)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      const analytics: { [key: string]: any } = {};

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data();
        
        // Protection contre les données manquantes
        if (!enrollment?.userId) {
          continue;
        }
        
        // Get user details
        const userRef = doc(db, 'users', enrollment.userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) continue;
        
        const user = userDoc.data();
        const companyId = user?.companyId;

        if (!companyId) continue; // Ignorer si pas de companyId

        // Get company details
        const companyRef = doc(db, 'companies', companyId);
        const companyDoc = await getDoc(companyRef);
        
        if (!companyDoc.exists()) continue;
        
        const company = companyDoc.data();

        // Initialize company analytics if not exists
        if (!analytics[companyId]) {
          analytics[companyId] = {
            name: company?.name || 'Unknown Company',
            total_students: 0,
            completed: 0,
            in_progress: 0,
            not_started: 0,
            avg_progress: 0
          };
        }

        analytics[companyId].total_students++;
        
        // Protection contre enrollment.status undefined
        const status = enrollment?.status?.toLowerCase() || 'not_started';
        if (analytics[companyId][status] !== undefined) {
          analytics[companyId][status]++;
        }

        // Get progress for this enrollment - CORRECTION: nom de collection en minuscule
        const progressQuery = query(
          collection(db, 'progress_tracking'),
          where('enrollmentId', '==', enrollmentDoc.id)
        );
        const progressSnapshot = await getDocs(progressQuery);
        
        const progressItems = progressSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            completed: data?.completed || false,
            ...data
          };
        });
        
        const completedCount = progressItems.filter(p => p.completed === true).length;
        const totalCount = progressItems.length;
        
        const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        analytics[companyId].avg_progress += progressPercentage;
      }

      // Calculate average progress
      Object.values(analytics).forEach((company: any) => {
        if (company.total_students > 0) {
          company.avg_progress = Math.round(company.avg_progress / company.total_students);
        }
      });

      return analytics;
    } catch (error) {
      console.error('Error fetching course analytics:', error);
      return {}; // Retourner un objet vide plutôt que de lancer l'erreur
    }
  },

  // Activity Logs
  async getActivityLogs(companyId?: string, limit = 50) {
    try {
      let logsQuery = query(
        collection(db, 'activity_logs'), // CORRECTION: nom de collection en minuscule
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );

      if (companyId) {
        logsQuery = query(
          collection(db, 'activity_logs'), // CORRECTION: nom de collection en minuscule
          where('companyId', '==', companyId),
          orderBy('createdAt', 'desc'),
          firestoreLimit(limit)
        );
      }

      const logsSnapshot = await getDocs(logsQuery);
      const logs = [];

      for (const logDoc of logsSnapshot.docs) {
        const log = logDoc.data();
        
        // CORRECTION CRITIQUE: Protection contre log.userId undefined
        if (!log?.userId) {
          // Ajouter le log même sans userId mais avec des valeurs par défaut
          logs.push({
            id: logDoc.id,
            action: log?.action || 'unknown_action',
            entityType: log?.entityType || 'unknown',
            entityId: log?.entityId || '',
            details: log?.details || '', // CORRECTION: Protection contre undefined qui causait l'erreur indexOf
            createdAt: log?.createdAt || null,
            user: null
          });
          continue;
        }
        
        // Get user details
        const userRef = doc(db, 'users', log.userId);
        const userDoc = await getDoc(userRef);
        
        let userData = null;
        let companyData = null;

        if (userDoc.exists()) {
          const user = userDoc.data();
          userData = user;
          
          // Get company details
          if (user?.companyId) {
            const companyRef = doc(db, 'companies', user.companyId);
            const companyDoc = await getDoc(companyRef);
            
            if (companyDoc.exists()) {
              companyData = companyDoc.data();
            }
          }
        }

        logs.push({
          id: logDoc.id,
          action: log?.action || 'unknown_action',
          entityType: log?.entityType || 'unknown',
          entityId: log?.entityId || '',
          details: log?.details || '', // CORRECTION PRINCIPALE: Protection contre undefined
          createdAt: log?.createdAt || null,
          user: userData ? {
            id: log.userId,
            name: userData?.name || 'Unknown User',
            role: userData?.role || 'user',
            company: companyData ? {
              id: userData.companyId,
              name: companyData?.name || 'Unknown Company'
            } : null
          } : null
        });
      }

      return logs;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return []; // CORRECTION: Retourner un tableau vide plutôt que de lancer l'erreur
    }
  },

  // Export Functions
  async exportToPDF(data: any[], columns: string[], title: string) {
    try {
      // Protection contre les paramètres undefined
      if (!data || !Array.isArray(data) || !columns || !Array.isArray(columns)) {
        throw new Error('Invalid parameters for PDF export');
      }

      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text(title || 'Export Report', 14, 15);
      doc.setFontSize(10);
      doc.text(format(new Date(), 'PPP'), 14, 25);

      (doc as any).autoTable({
        head: [columns],
        body: data.map(item => columns.map(col => item?.[col] || '')), // Protection contre item undefined
        startY: 30,
      });

      return doc.output('blob');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  },

  async exportToExcel(data: any[], sheetName: string) {
    try {
      // Protection contre les paramètres undefined
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data for Excel export');
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Export');
      return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }
};