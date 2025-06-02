import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Users, BookOpen, Award, Activity, TrendingUp } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';

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
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { format } from 'date-fns';

const SuperAdminDashboard = () => {
  const { 
    companyStats, 
    recentActivity,
    isLoading,
    error,
    fetchCompanyStats,
    fetchRecentActivity
  } = useAnalyticsStore();

  useEffect(() => {
    fetchCompanyStats();
    fetchRecentActivity();
  }, []);

if (!companyStats || typeof companyStats !== 'object') {
  return <div>Aucune donnée d’analyse disponible</div>;
}

  const stats = {
    companies: Object.keys(companyStats).length,
    totalStudents: Object.values(companyStats).reduce((acc: number, company: any) => 
      acc + company.studentCount, 0),
    completedCourses: Object.values(companyStats).reduce((acc: number, company: any) => 
      acc + company.completedCourses, 0),
    inProgressCourses: Object.values(companyStats).reduce((acc: number, company: any) => 
      acc + company.inProgressCourses, 0)
  };

  const progressData = {
    labels: ['Terminés', 'En cours'],
    datasets: [{
      data: [stats.completedCourses, stats.inProgressCourses],
      backgroundColor: ['#29B275', '#FF5C29']
    }]
  };

  const companyProgressData = {
    labels: Object.values(companyStats).map((company: any) => company.name),
    datasets: [{
      label: 'Taux de complétion',
      data: Object.values(companyStats).map((company: any) => 
        (company.completedCourses / company.totalEnrollments) * 100 || 0),
      borderColor: '#2B4DB8',
      tension: 0.3
    }]
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
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
                <Building className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Entreprises</p>
                <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
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
                <Users className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Apprenants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
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
                <p className="text-sm font-medium text-gray-500">Cours en cours</p>
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
                <Award className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cours terminés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card title="Progression globale">
            <div className="h-80">
              <Line 
                data={companyProgressData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Pourcentage'
                      }
                    }
                  }
                }}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card title="État des cours">
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
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card title="Activité récente">
          <div className="space-y-4">
            {Array.isArray(recentActivity) && recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 border-b border-gray-200 last:border-0">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Activity className="h-5 w-5 text-gray-600" />
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
                {activity.users.companies && (
                  <span className="text-xs font-medium text-gray-500">
                    {activity.users.companies.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SuperAdminDashboard;