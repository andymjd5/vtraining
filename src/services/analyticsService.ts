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
          name: companyDoc.data().name,
          totalUsers: usersSnapshot.size,
          totalCourses: coursesSnapshot.size,
          totalEnrollments: enrollmentsSnapshot.size,
          ...companyDoc.data()
        };
      } else {
        // Get all companies with their stats
        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        const companiesStats = [];

        for (const companyDoc of companiesSnapshot.docs) {
          const companyId = companyDoc.id;
          
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
            name: companyDoc.data().name,
            totalUsers: usersSnapshot.size,
            totalCourses: coursesSnapshot.size,
            ...companyDoc.data()
          });
        }

        return companiesStats;
      }
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  },

  // User Progress
  async getUserProgress(userId: string) {
    try {
      // Get user enrollments
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('userId', '==', userId)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      const progressData = [];

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data();
        
        // Get course details
        const courseRef = doc(db, 'courses', enrollment.courseId);
        const courseDoc = await getDoc(courseRef);

        // Get progress tracking
        const progressQuery = query(
          collection(db, 'progressTracking'),
          where('enrollmentId', '==', enrollmentDoc.id)
        );
        const progressSnapshot = await getDocs(progressQuery);

        const progressItems = progressSnapshot.docs.map(doc => doc.data());
        const completedLessons = progressItems.filter(p => p.completed).length;
        const totalLessons = progressItems.length;

        progressData.push({
          enrollmentId: enrollmentDoc.id,
          courseId: enrollment.courseId,
          courseName: courseDoc.exists() ? courseDoc.data().title : 'Unknown Course',
          status: enrollment.status,
          completedLessons,
          totalLessons,
          progressPercentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
          lastActivity: enrollment.lastActivity,
          timeSpent: progressItems.reduce((sum, p) => sum + (p.timeSpent || 0), 0)
        });
      }

      return progressData;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  },

  // Course Analytics
  async getCourseAnalytics(courseId: string) {
    try {
      // Get all enrollments for this course
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('courseId', '==', courseId)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      const analytics: { [key: string]: any } = {};

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data();
        
        // Get user details
        const userRef = doc(db, 'users', enrollment.userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) continue;
        
        const user = userDoc.data();
        const companyId = user.companyId;

        // Get company details
        const companyRef = doc(db, 'companies', companyId);
        const companyDoc = await getDoc(companyRef);
        
        if (!companyDoc.exists()) continue;
        
        const company = companyDoc.data();

        // Initialize company analytics if not exists
        if (!analytics[companyId]) {
          analytics[companyId] = {
            name: company.name,
            total_students: 0,
            completed: 0,
            in_progress: 0,
            not_started: 0,
            avg_progress: 0
          };
        }

        analytics[companyId].total_students++;
        analytics[companyId][enrollment.status.toLowerCase()]++;

        // Get progress for this enrollment
        const progressQuery = query(
          collection(db, 'progressTracking'),
          where('enrollmentId', '==', enrollmentDoc.id)
        );
        const progressSnapshot = await getDocs(progressQuery);
        
        const progressItems = progressSnapshot.docs.map(doc => doc.data());
        const completedCount = progressItems.filter(p => p.completed).length;
        const totalCount = progressItems.length;
        
        analytics[companyId].avg_progress += (completedCount / totalCount) * 100 || 0;
      }

      // Calculate average progress
      Object.values(analytics).forEach((company: any) => {
        if (company.total_students > 0) {
          company.avg_progress = company.avg_progress / company.total_students;
        }
      });

      return analytics;
    } catch (error) {
      console.error('Error fetching course analytics:', error);
      throw error;
    }
  },

  // Activity Logs
  async getActivityLogs(companyId?: string, limit = 50) {
    try {
      let logsQuery = query(
        collection(db, 'activityLogs'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );

      if (companyId) {
        logsQuery = query(
          collection(db, 'activityLogs'),
          where('companyId', '==', companyId),
          orderBy('createdAt', 'desc'),
          firestoreLimit(limit)
        );
      }

      const logsSnapshot = await getDocs(logsQuery);
      const logs = [];

      for (const logDoc of logsSnapshot.docs) {
        const log = logDoc.data();
        
        // Get user details
        const userRef = doc(db, 'users', log.userId);
        const userDoc = await getDoc(userRef);
        
        let userData = null;
        let companyData = null;

        if (userDoc.exists()) {
          userData = userDoc.data();
          
          // Get company details
          if (userData.companyId) {
            const companyRef = doc(db, 'companies', userData.companyId);
            const companyDoc = await getDoc(companyRef);
            
            if (companyDoc.exists()) {
              companyData = companyDoc.data();
            }
          }
        }

        logs.push({
          id: logDoc.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          details: log.details,
          createdAt: log.createdAt,
          user: userData ? {
            id: log.userId,
            name: userData.name,
            role: userData.role,
            company: companyData ? {
              id: userData.companyId,
              name: companyData.name
            } : null
          } : null
        });
      }

      return logs;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  },

  // Export Functions
  async exportToPDF(data: any[], columns: string[], title: string) {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(format(new Date(), 'PPP'), 14, 25);

    (doc as any).autoTable({
      head: [columns],
      body: data.map(item => columns.map(col => item[col])),
      startY: 30,
    });

    return doc.output('blob');
  },

  async exportToExcel(data: any[], sheetName: string) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  }
};