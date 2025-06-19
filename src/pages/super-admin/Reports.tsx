import React, { useState, useEffect } from 'react';
import { BarChart, FileText, Download, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const SuperAdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState({
    companies: [],
    students: [],
    courses: [],
    enrollments: []
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch all data
      const [companiesSnap, usersSnap, coursesSnap, enrollmentsSnap] = await Promise.all([
        getDocs(collection(db, 'companies')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'enrollments'))
      ]);

      setReportData({
        companies: companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        students: usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(user => user.role === 'STUDENT'),
        courses: coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        enrollments: enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
  };

  const exportToPDF = () => {
    // Implementation for PDF export
    console.log('Exporting to PDF...');
  };

  const exportToCSV = () => {
    // Implementation for CSV export
    console.log('Exporting to CSV...');
  };

  // Calculate statistics
  const stats = {
    totalCompanies: reportData.companies.length,
    totalStudents: reportData.students.length,
    totalCourses: reportData.courses.length,
    completedCourses: reportData.enrollments.filter(e => e.status === 'COMPLETED').length,
    inProgressCourses: reportData.enrollments.filter(e => e.status === 'IN_PROGRESS').length,
    completionRate: reportData.enrollments.length > 0 
      ? Math.round((reportData.enrollments.filter(e => e.status === 'COMPLETED').length / reportData.enrollments.length) * 100)
      : 0
  };

  // Chart data
  const companyProgressData = {
    labels: reportData.companies.map(company => company.name),
    datasets: [{
      label: 'Étudiants par entreprise',
      data: reportData.companies.map(company => 
        reportData.students.filter(student => student.companyId === company.id).length
      ),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  };

  const courseCompletionData = {
    labels: ['Terminés', 'En cours', 'Non commencés'],
    datasets: [{
      data: [
        stats.completedCourses,
        stats.inProgressCourses,
        stats.totalCourses - stats.completedCourses - stats.inProgressCourses
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-600">
            Analyse complète des performances de la plateforme
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            isLoading={refreshing}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Actualiser
          </Button>
          <Button
            variant="outlined"
            onClick={exportToCSV}
            leftIcon={<Download className="h-4 w-4" />}
          >
            CSV
          </Button>
          <Button
            onClick={exportToPDF}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <BarChart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Entreprises</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Étudiants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cours Terminés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Taux de Complétion</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Étudiants par entreprise
            </h3>
            <div className="h-80">
              <Bar
                data={companyProgressData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Nombre d\'étudiants'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              État des cours
            </h3>
            <div className="flex justify-center">
              <div className="w-64">
                <Doughnut
                  data={courseCompletionData}
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
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Entreprises les plus actives
            </h3>
            <div className="space-y-3">
              {reportData.companies.slice(0, 5).map((company, index) => {
                const studentCount = reportData.students.filter(s => s.companyId === company.id).length;
                return (
                  <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{company.name}</p>
                        <p className="text-sm text-gray-500">{studentCount} étudiants</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {Math.round((studentCount / stats.totalStudents) * 100)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Course Performance */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cours les plus populaires
            </h3>
            <div className="space-y-3">
              {reportData.courses.slice(0, 5).map((course, index) => {
                const enrollmentCount = reportData.enrollments.filter(e => e.courseId === course.id).length;
                return (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-500">{enrollmentCount} inscriptions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {course.assignedTo?.length || 0} entreprises
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminReports;