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

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Award, TrendingUp, Download, FileSpreadsheet, UserPlus } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { format } from 'date-fns';
import AssignedCoursesSection from './AssignedCoursesSection';

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses?: string[];
  status: string;
  createdAt: any;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  students: Student[];
  type: 'students' | 'completed' | 'inProgress' | 'completion';
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, students, type }) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case 'students':
        return (
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Inscrit le {student.createdAt ? format(student.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {student.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Cours inscrits: {student.enrolledCourses?.length || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Données en cours de développement</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const CompanyAdminDashboard = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState({
    studentCount: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    students: [] as Student[],
    type: 'students' as 'students' | 'completed' | 'inProgress' | 'completion'
  });

  useEffect(() => {
    if (user?.companyId) {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);

      // Fetch students from the company
      const studentsQuery = query(
        collection(db, 'users'),
        where('companyId', '==', user!.companyId!),
        where('role', '==', 'STUDENT')
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];

      setStudents(studentsData);

      // Fetch enrollments for statistics
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('companyId', '==', user!.companyId!)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrollments = enrollmentsSnapshot.docs.map(doc => doc.data());

      const completedCount = enrollments.filter(e => e.status === 'COMPLETED').length;
      const inProgressCount = enrollments.filter(e => e.status === 'IN_PROGRESS').length;
      const totalEnrollments = enrollments.length;

      setStats({
        studentCount: studentsData.length,
        completedCourses: completedCount,
        inProgressCourses: inProgressCount,
        completionRate: totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0
      });

    } catch (error) {
      console.error('Error fetching company data:', error);
      showError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: 'students' | 'completed' | 'inProgress' | 'completion') => {
    let title = '';
    let modalStudents = students;

    switch (type) {
      case 'students':
        title = 'Tous les apprenants';
        break;
      case 'completed':
        title = 'Cours terminés';
        break;
      case 'inProgress':
        title = 'Cours en cours';
        break;
      case 'completion':
        title = 'Taux de complétion';
        break;
    }

    setModalState({
      isOpen: true,
      title,
      students: modalStudents,
      type
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      title: '',
      students: [],
      type: 'students'
    });
  };

  const handleExportPDF = async () => {
    try {
      // Implementation for PDF export
      success('Export PDF en cours...');
    } catch (error) {
      showError('Erreur lors de l\'export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      // Implementation for Excel export
      success('Export Excel en cours...');
    } catch (error) {
      showError('Erreur lors de l\'export Excel');
    }
  };

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
          <Button
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Ajouter un utilisateur
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="cursor-pointer"
          onClick={() => openModal('students')}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-primary-100">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Apprenants</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.studentCount}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="cursor-pointer"
          onClick={() => openModal('completed')}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-success-100">
                  <Award className="h-6 w-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Cours terminés</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="cursor-pointer"
          onClick={() => openModal('inProgress')}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-warning-100">
                  <BookOpen className="h-6 w-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">En cours</p>
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
          className="cursor-pointer"
          onClick={() => openModal('completion')}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-accent-100">
                  <TrendingUp className="h-6 w-6 text-accent-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Taux de complétion</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                </div>
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
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progression des cours</h3>
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
          </div>
        </Card>
      </motion.div>

      {/* Assigned Courses Section */}
      {user?.companyId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <AssignedCoursesSection companyId={user.companyId} />
        </motion.div>
      )}

      {/* Detail Modal */}
      <DetailModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        students={modalState.students}
        type={modalState.type}
      />
    </div>
  );
};

export default CompanyAdminDashboard;