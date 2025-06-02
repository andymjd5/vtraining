import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Award, Clock, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import CompanyFileManager from '../../components/storage/CompanyFileManager';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalTimeSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchStudentStats();
    }
  }, [user]);

  const fetchStudentStats = async () => {
    try {
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(enrollmentsRef, where('userId', '==', user!.id));
      const snapshot = await getDocs(q);
      
      const stats = {
        totalCourses: snapshot.size,
        completedCourses: snapshot.docs.filter(doc => doc.data().status === 'COMPLETED').length,
        inProgressCourses: snapshot.docs.filter(doc => doc.data().status === 'IN_PROGRESS').length,
        totalTimeSpent: snapshot.docs.reduce((acc, doc) => acc + (doc.data().timeSpent || 0), 0)
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-primary-100">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-success-100">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-warning-100">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgressCourses}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-accent-100">
                <Award className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(stats.totalTimeSpent / 3600)}h
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Company Files Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <CompanyFileManager />
      </motion.div>
    </div>
  );
};

export default StudentDashboard;