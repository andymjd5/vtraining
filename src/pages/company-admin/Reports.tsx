import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { analyticsService } from '../../services/analyticsService';
import LoadingScreen from '../../components/ui/LoadingScreen';

interface CourseProgress {
  courseId: string;
  courseName: string;
  progressPercentage: number;
  status: string;
}

interface StudentProgress {
  studentId: string;
  studentName: string;
  courses: CourseProgress[];
}

const CompanyReports = () => {
  const { user } = useAuth();
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (user?.companyId) {
        try {
          setLoading(true);
          const progressData = await analyticsService.getCompanyStudentProgress(user.companyId);
          setStudentProgress(progressData);
        } catch (err) {
          setError('Erreur lors de la récupération des rapports.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError("Aucune entreprise n'est associée à ce compte.");
      }
    };

    fetchReports();
  }, [user]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Rapports de Performance des Étudiants</h1>
      
      <div className="bg-white shadow rounded-lg p-4">
        {studentProgress.length === 0 ? (
          <p>Aucune donnée de progression disponible pour les étudiants de cette entreprise.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étudiant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentProgress.map(studentData => (
                  studentData.courses.map((course, index) => (
                    <tr key={`${studentData.studentId}-${course.courseId}`}>
                      {index === 0 && (
                        <td rowSpan={studentData.courses.length} className="px-6 py-4 whitespace-nowrap align-top font-medium text-gray-900">
                          {studentData.studentName}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.courseName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${course.progressPercentage}%` }}></div>
                          </div>
                          <span className="ml-3 text-sm font-medium">{course.progressPercentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          course.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          course.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {course.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyReports;
