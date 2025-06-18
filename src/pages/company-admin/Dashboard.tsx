import {
  Chart as ChartJS,
  LinearScale,
  BarElement,
  CategoryScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  LinearScale,
  BarElement,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Award, TrendingUp, Download, FileSpreadsheet } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { analyticsService } from '../../services/analyticsService';
import { format } from 'date-fns';
import AssignedCoursesSection from './AssignedCoursesSection';

const CompanyAdminDashboard = () => {
  const { user } = useAuth();
  const { companyStats, recentActivity, isLoading, error, fetchCompanyStats, fetchRecentActivity } = useAnalyticsStore();

  useEffect(() => {
    if (user?.company_id) {
      fetchCompanyStats(user.company_id);
      fetchRecentActivity();
    }
  }, [user]);

  const handleExportPDF = async () => {
    const data = Object.values(companyStats).map(stat => ({
      studentName: stat.name,
      coursesCompleted: stat.completedCourses,
      coursesInProgress: stat.inProgressCourses,
      completionRate: `${((stat.completedCourses / stat.totalEnrollments) * 100).toFixed(1)}%`
    }));

    const blob = await analyticsService.exportToPDF(
      data,
      ['Student Name', 'Completed', 'In Progress', 'Completion Rate'],
      'Student Progress Report'
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `progress-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    link.click();
  };

  const handleExportExcel = async () => {
    const data = Object.values(companyStats).map(stat => ({
      studentName: stat.name,
      coursesCompleted: stat.completedCourses,
      coursesInProgress: stat.inProgressCourses,
      completionRate: `${((stat.completedCourses / stat.totalEnrollments) * 100).toFixed(1)}%`
    }));

    const blob = await analyticsService.exportToExcel(data, 'Student Progress');
    const url = URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `progress-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    link.click();
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur: {error}</div>;
  }

  const stats = companyStats[user?.company_id || ''] || {
    studentCount: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalEnrollments: 0
  };

  const completionRate = stats.totalEnrollments > 0
    ? (stats.completedCourses / stats.totalEnrollments) * 100
    : 0;

  const progressData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Cours complétés',
        data: [10, 15, 20, 25, 30, stats.completedCourses],
        backgroundColor: '#29B275',
      },
      {
        label: 'Cours en cours',
        data: [5, 8, 12, 15, 18, stats.inProgressCourses],
        backgroundColor: '#FF5C29',
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="flex space-x-4">
          <Button
            variant="outlined"
            size="sm"
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-primary-100">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Apprenants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.studentCount}</p>
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
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-success-100">
                <Award className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cours terminés</p>
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
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-warning-100">
                <BookOpen className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En cours</p>
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
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-accent-100">
                <TrendingUp className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Taux de complétion</p>
                <p className="text-2xl font-bold text-gray-900">{completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card title="Progression des cours">
          <div className="h-80">
            <Bar
              data={progressData}
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
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card title="Activité récente">
          <div className="space-y-4">
            {recentActivity
              .filter(activity => activity.users.company_id === user?.company_id)
              .map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 border-b border-gray-200 last:border-0">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.users.name}</span>
                      {' '}{activity.action}{' '}
                      <span className="text-gray-500">{activity.entity_type}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(activity.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </motion.div>

      {/* Assigned Courses Section */}
      {user?.company_id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <AssignedCoursesSection companyId={user.company_id} />
        </motion.div>
      )}
    </div>
  );
};

export default CompanyAdminDashboard;