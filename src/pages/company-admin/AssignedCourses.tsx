import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import { BookCheck, Users, Clock, User, CheckCircle, Plus, UserX, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  instructor: {
    name: string;
    title: string;
  };
  assignedTo: string[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses?: string[];
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  companyId: string;
  status: string;
  progress: number;
  enrolledAt: Date;
  lastActivity: Date;
}

const AssignedCourses = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [selectedEnrolledStudents, setSelectedEnrolledStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  useEffect(() => {
    if (user?.companyId) {
      fetchAssignedCourses();
      fetchStudents();
    }
  }, [user]);

  const fetchAssignedCourses = async () => {
    try {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }
      const coursesData = await courseService.getCoursesByCompany(user.companyId);
      console.log('Fetched assigned courses:', coursesData);
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching assigned courses:', error);
      showError('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }
      const q = query(
        collection(db, 'users'),
        where('companyId', '==', user.companyId),
        where('role', '==', 'STUDENT')
      );
      const querySnapshot = await getDocs(q);
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      console.log('Fetched students:', studentsData);
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      showError('Erreur lors du chargement des étudiants');
    }
  };

  const fetchEnrolledStudents = async (courseId: string) => {
    try {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }
      const q = query(
        collection(db, 'enrollments'),
        where('courseId', '==', courseId),
        where('companyId', '==', user.companyId)
      );
      const querySnapshot = await getDocs(q);
      const enrollments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Enrollment[];

      // Get student details for enrolled students
      const enrolledStudentIds = enrollments.map(e => e.userId);
      const enrolledStudentsData = students.filter(student =>
        enrolledStudentIds.includes(student.id)
      );

      setEnrolledStudents(enrolledStudentsData);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      showError('Erreur lors du chargement des étudiants inscrits');
    }
  };

  const handleAssignCourse = (course: Course) => {
    setSelectedCourse(course);
    setSelectedStudents([]);
    setShowAssignModal(true);
  };

  const handleUnassignCourse = async (course: Course) => {
    setSelectedCourse(course);
    setSelectedEnrolledStudents([]);
    await fetchEnrolledStudents(course.id);
    setShowUnassignModal(true);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleEnrolledStudentSelection = (studentId: string) => {
    setSelectedEnrolledStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const assignCourseToStudents = async () => {
    if (!selectedCourse || selectedStudents.length === 0 || !user?.companyId) return;

    setAssigning(true);
    try {
      // Create enrollments for selected students
      const enrollmentPromises = selectedStudents.map(async (studentId) => {
        const enrollmentRef = doc(collection(db, 'enrollments'));
        await setDoc(enrollmentRef, {
          userId: studentId,
          courseId: selectedCourse.id,
          companyId: user.companyId,
          status: 'NOT_STARTED',
          progress: 0,
          enrolledAt: new Date(),
          lastActivity: new Date()
        });

        // Update user's enrolled courses
        const userRef = doc(db, 'users', studentId);
        await updateDoc(userRef, {
          enrolledCourses: arrayUnion(selectedCourse.id)
        });
      });

      await Promise.all(enrollmentPromises);

      success(`Cours "${selectedCourse.title}" assigné à ${selectedStudents.length} étudiant(s)`);
      setShowAssignModal(false);
      setSelectedCourse(null);
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error assigning course:', error);
      showError('Erreur lors de l\'assignation du cours');
    } finally {
      setAssigning(false);
    }
  };

  const unassignCourseFromStudents = async () => {
    if (!selectedCourse || selectedEnrolledStudents.length === 0 || !user?.companyId) return;

    setUnassigning(true);
    try {
      // Remove enrollments for selected students
      const unassignPromises = selectedEnrolledStudents.map(async (studentId) => {
        // Find and delete enrollment
        const enrollmentQuery = query(
          collection(db, 'enrollments'),
          where('userId', '==', studentId),
          where('courseId', '==', selectedCourse.id),
          where('companyId', '==', user.companyId!)
        );
        const enrollmentSnapshot = await getDocs(enrollmentQuery);

        enrollmentSnapshot.docs.forEach(async (enrollmentDoc) => {
          await deleteDoc(doc(db, 'enrollments', enrollmentDoc.id));
        });

        // Update user's enrolled courses
        const userRef = doc(db, 'users', studentId);
        await updateDoc(userRef, {
          enrolledCourses: arrayRemove(selectedCourse.id)
        });
      });

      await Promise.all(unassignPromises);

      success(`Cours "${selectedCourse.title}" désassigné de ${selectedEnrolledStudents.length} étudiant(s)`);
      setShowUnassignModal(false);
      setSelectedCourse(null);
      setSelectedEnrolledStudents([]);
      setEnrolledStudents([]);
    } catch (error) {
      console.error('Error unassigning course:', error);
      showError('Erreur lors de la désassignation du cours');
    } finally {
      setUnassigning(false);
    }
  };

  const assignToAllStudents = () => {
    setSelectedStudents(students.map(s => s.id));
  };

  const unassignFromAllStudents = () => {
    setSelectedEnrolledStudents(enrolledStudents.map(s => s.id));
  };

  // Early return if user is not available or loading
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Authentification requise</div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Cours affectés</h1>
          <p className="text-gray-600">
            Gérez l'assignation des cours à vos étudiants
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {courses.length} cours disponibles
        </div>
      </div>

      {courses.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <BookCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun cours affecté
            </h3>
            <p className="text-gray-600">
              Aucun cours n'a encore été affecté à votre entreprise par l'administrateur.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-2" />
                    {course.instructor?.name || 'Instructeur non défini'}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    {course.duration} heures
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.level === 'Débutant' ? 'bg-green-100 text-green-800' :
                    course.level === 'Intermédiaire' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                    {course.level}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleAssignCourse(course)}
                    leftIcon={<Users className="h-4 w-4" />}
                    className="flex-1"
                  >
                    Assigner
                  </Button>
                  <Button
                    size="sm"
                    variant="outlined"
                    onClick={() => handleUnassignCourse(course)}
                    leftIcon={<UserX className="h-4 w-4" />}
                    className="flex-1"
                  >
                    Désassigner
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Assigner le cours
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {selectedCourse.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  Sélectionner les étudiants ({selectedStudents.length} sélectionnés)
                </h3>
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={assignToAllStudents}
                >
                  Sélectionner tous
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedStudents.includes(student.id) ? 'bg-blue-50' : ''
                      }`}
                    onClick={() => toggleStudentSelection(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedStudents.includes(student.id)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300'
                        }`}>
                        {selectedStudents.includes(student.id) && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {students.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun étudiant trouvé dans votre entreprise
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                variant="outlined"
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
              >
                Annuler
              </Button>
              <Button
                onClick={assignCourseToStudents}
                disabled={selectedStudents.length === 0 || assigning}
                isLoading={assigning}
              >
                Assigner le cours
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unassignment Modal */}
      {showUnassignModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Désassigner le cours
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {selectedCourse.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowUnassignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  Étudiants inscrits ({selectedEnrolledStudents.length} sélectionnés)
                </h3>
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={unassignFromAllStudents}
                >
                  Sélectionner tous
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {enrolledStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedEnrolledStudents.includes(student.id) ? 'bg-red-50' : ''
                      }`}
                    onClick={() => toggleEnrolledStudentSelection(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedEnrolledStudents.includes(student.id)
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-gray-300'
                        }`}>
                        {selectedEnrolledStudents.includes(student.id) && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {enrolledStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun étudiant inscrit à ce cours
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                variant="outlined"
                onClick={() => setShowUnassignModal(false)}
                disabled={unassigning}
              >
                Annuler
              </Button>
              <Button
                onClick={unassignCourseFromStudents}
                disabled={selectedEnrolledStudents.length === 0 || unassigning}
                isLoading={unassigning}
                variant="destructive"
              >
                Désassigner le cours
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedCourses;