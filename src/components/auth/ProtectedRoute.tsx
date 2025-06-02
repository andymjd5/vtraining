import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import LoadingScreen from '../ui/LoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to appropriate login page based on the attempted route
    let loginPath = '/login';
    if (location.pathname.startsWith('/super-admin')) {
      loginPath = '/super-admin/login';
    } else if (location.pathname.startsWith('/company-admin')) {
      loginPath = '/company-admin/login';
    }
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's role
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return <Navigate to="/super-admin/dashboard" replace />;
      case UserRole.COMPANY_ADMIN:
        return <Navigate to="/company-admin/dashboard" replace />;
      case UserRole.STUDENT:
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;