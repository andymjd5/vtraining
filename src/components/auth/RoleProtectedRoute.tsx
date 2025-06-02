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

  // ✅ Attente du chargement complet de l'authentification
  if (isLoading) {
    return <LoadingScreen />;
  }

  // ✅ Si l'utilisateur n'est pas connecté ou non disponible
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ❌ Si l'utilisateur est connecté mais n'a pas le bon rôle
  if (!allowedRoles.includes(user.role)) {
    // ✅ Redirection vers son dashboard correct
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

  // ✅ Tout va bien : on affiche la page
  return <>{children}</>;
};

export default RoleProtectedRoute;
