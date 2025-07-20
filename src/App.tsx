import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';
import ToastContainer from './components/ui/ToastContainer';
import { useToast } from './hooks/useToast';
import { SidebarProvider } from './contexts/SidebarContext';
import { UserRole } from './types';

// Lazy loaded components
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const CompanySelection = lazy(() => import('./pages/auth/CompanySelection'));
const Login = lazy(() => import('./pages/auth/Login'));
const SuperAdminLogin = lazy(() => import('./pages/auth/SuperAdminLogin'));
const CompanyAdminLogin = lazy(() => import('./pages/auth/CompanyAdminLogin'));

// Student pages
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentCourses = lazy(() => import('./pages/student/Courses'));
const CourseView = lazy(() => import('./pages/student/CourseView'));
const CoursePreview = lazy(() => import('./pages/student/CoursePreview'));
const QuizView = lazy(() => import('./pages/student/QuizView'));
const Certificates = lazy(() => import('./pages/student/Certificates'));
const Profile = lazy(() => import('./pages/student/Profile'));

// Company admin pages
const CompanyAdminDashboard = lazy(() => import('./pages/company-admin/Dashboard'));
const CompanyUserManagement = lazy(() => import('./pages/company-admin/UserManagement'));
const AssignedCourses = lazy(() => import('./pages/company-admin/AssignedCourses'));
const CompanyReports = lazy(() => import('./pages/company-admin/Reports'));
const CompanySettings = lazy(() => import('./pages/company-admin/Settings'));

// Super admin pages
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/Dashboard'));
const CompanyManagement = lazy(() => import('./pages/super-admin/CompanyManagement'));
const CourseManagement = lazy(() => import('./pages/super-admin/CourseManagement'));
const AdminUserManagement = lazy(() => import('./pages/super-admin/UserManagement'));
const CourseAssignment = lazy(() => import('./pages/super-admin/CourseAssignment'));
const SuperAdminReports = lazy(() => import('./pages/super-admin/Reports'));
const SuperAdminSettings = lazy(() => import('./pages/super-admin/Settings'));

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SidebarProvider>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Auth routes */}
          <Route
            path="/login"
            element={
              isAuthenticated 
                ? <Navigate to={user?.role === UserRole.STUDENT ? '/student/dashboard' : `/${user?.role.toLowerCase().replace('_', '-')}/dashboard`} replace /> 
                : <CompanySelection />
            }
          />
          <Route
            path="/login/:companyId"
            element={
              isAuthenticated 
                ? <Navigate to={user?.role === UserRole.STUDENT ? '/student/dashboard' : `/${user?.role.toLowerCase().replace('_', '-')}/dashboard`} replace /> 
                : <Login />
            }
          />
          <Route
            path="/super-admin/login"
            element={
              isAuthenticated && user?.role === UserRole.SUPER_ADMIN
                ? <Navigate to="/super-admin/dashboard" replace />
                : <SuperAdminLogin />
            }
          />
          <Route
            path="/company-admin/login"
            element={
              isAuthenticated && user?.role === UserRole.COMPANY_ADMIN
                ? <Navigate to="/company-admin/dashboard" replace />
                : <CompanyAdminLogin />
            }
          />

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <RoleProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <Layout isAuthenticated />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="courses/:courseId" element={<CourseView />} />
            <Route path="courses/:courseId/preview" element={<CoursePreview />} />
            <Route path="quiz/:quizId" element={<QuizView />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Legacy dashboard route redirect */}
          <Route
            path="/dashboard"
            element={
              <RoleProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <Navigate to="/student/dashboard" replace />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <RoleProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <Navigate to="/student/dashboard" replace />
              </RoleProtectedRoute>
            }
          />

          {/* Company admin routes */}
          <Route
            path="/company-admin"
            element={
              <RoleProtectedRoute allowedRoles={[UserRole.COMPANY_ADMIN]}>
                <Layout isAuthenticated />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CompanyAdminDashboard />} />
            <Route path="users" element={<CompanyUserManagement />} />
            <Route path="assigned-courses" element={<AssignedCourses />} />
            <Route path="reports" element={<CompanyReports />} />
            <Route path="settings" element={<CompanySettings />} />
          </Route>

          {/* Super admin routes */}
          <Route
            path="/super-admin"
            element={
              <RoleProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <Layout isAuthenticated />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="companies" element={<CompanyManagement />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="courses/assign" element={<CourseAssignment />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="reports" element={<SuperAdminReports />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </SidebarProvider>
  );
}

export default App;