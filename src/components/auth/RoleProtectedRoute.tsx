import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import LoadingScreen from '../ui/LoadingScreen';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Wait for authentication to complete loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is not authenticated or not available
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but doesn't have the right role
  if (!allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return <Navigate to="/super-admin/dashboard" replace />;
      case UserRole.COMPANY_ADMIN:
        return <Navigate to="/company-admin/dashboard" replace />;
      case UserRole.STUDENT:
        return <Navigate to="/student/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // All good: show the page
  return <>{children}</>;
};

export default RoleProtectedRoute;