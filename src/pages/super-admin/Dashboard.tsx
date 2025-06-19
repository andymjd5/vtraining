import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building, Users, BookOpen, Award, Activity, TrendingUp, Plus } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

import {
  Chart,
  LineElement,
  ArcElement,
  PointElement,
  LineController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  LineElement,
  ArcElement,
  PointElement,
  LineController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    companies: 0,
    totalStudents: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalCourses: 0
  });
  const [courses, setCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch companies
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesCount = companiesSnapshot.size;

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const students = usersSnapshot.docs.filter(doc => 
        doc.data().role === 'STUDENT' || doc.data().role === 'AGENT'
      );

      // Fetch courses
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch enrollments
      const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
      const enrollments = enrollmentsSnapshot.docs.map(doc => doc.data());
      
      const completedCount = enrollments.filter(e => e.status === 'COMPLETED').length;
      const inProgressCount = enrollments.filter(e => e.status === 'IN_PROGRESS').length;

      setStats({
        companies: companiesCount,
        totalStudents: students.length,
        completedCourses: completedCount,
        inProgressCourses: inProgressCount,
        totalCourses: coursesData.length
      });

      setCourses(coursesData);

      // Mock recent activity
      setRecentActivity([
        {
          id: 1,
          user: 'Jean Dupont',
          action: 'a terminé le cours',
          course: 'Introduction à la bureautique',
          time: new Date(),
          company: 'BESDU'
        },
        {
          id: 2,
          user: 'Marie Martin',
          action: 'a commencé le cours',
          course: 'Droits humains avancés',
          time: new Date(Date.now() - 3600000),
          company: 'FONAREV'
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const progressData = {
    labels: ['Terminés', 'En cours'],
    datasets: [{
      data: [stats.completedCourses, stats.inProgressCourses],
      backgroundColor: ['#10B981', '#F59E0B']
    }]
  };

  const monthlyData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      label: 'Cours complétés',
      data: [12, 19, 15, 25, 22, stats.completedCourses],
      borderColor: '#3B82F6',
      tension: 0.3
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <Button leftIcon={<Plus className="h-5 w-5" />}>
          Actions rapides
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Entreprises</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Apprenants</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <BookOpen className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Cours en cours</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgressCourses}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Cours terminés</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Courses Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Cours disponibles</h2>
              <span className="text-sm text-gray-500">{stats.totalCourses} cours au total</span>
            </div>
            
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun cours disponible</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par créer votre premier cours de formation.
                </p>
                <div className="mt-6">
                  <Button leftIcon={<Plus className="h-4 w-4" />}>
                    Créer un cours
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.slice(0, 6).map((course) => (
                  <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {course.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {course.assignedTo?.length || 0} entreprises
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progression mensuelle</h3>
              <div className="h-80">
                <Line 
                  data={monthlyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Nombre de cours'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">État des cours</h3>
              <div className="flex justify-center">
                <div className="w-64">
                  <Doughnut 
                    data={progressData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 border-b border-gray-200 last:border-0">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Activity className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span>
                      {' '}{activity.action}{' '}
                      <span className="text-blue-600">{activity.course}</span>
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {format(activity.time, 'PPp')}
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-medium text-gray-600">
                        {activity.company}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SuperAdminDashboard;