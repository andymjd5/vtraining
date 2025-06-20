import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
    ...context,
    getDashboardPath: () => {
      if (!context.user) return '/login';
      
      switch (context.user.role) {
        case UserRole.SUPER_ADMIN:
          return '/super-admin/dashboard';
        case UserRole.COMPANY_ADMIN:
          return '/company-admin/dashboard';
        case UserRole.STUDENT:
          return '/student/dashboard';
        default:
          return '/login';
      }
    },
    getLoginPath: (role?: UserRole) => {
      switch (role) {
        case UserRole.SUPER_ADMIN:
          return '/super-admin/login';
        case UserRole.COMPANY_ADMIN:
          return '/company-admin/login';
        default:
          return '/login';
      }
    }
  };
};