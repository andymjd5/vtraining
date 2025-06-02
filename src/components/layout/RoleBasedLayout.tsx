import { ReactNode } from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface RoleBasedLayoutProps {
  children: ReactNode;
  role: UserRole;
}

const RoleBasedLayout = ({ children, role }: RoleBasedLayoutProps) => {
  const { user } = useAuth();

  if (!user || user.role !== role) {
    return null;
  }

  const getLayoutClasses = () => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-gray-100';
      case UserRole.COMPANY_ADMIN:
        return 'bg-blue-50';
      case UserRole.STUDENT:
        return 'bg-green-50';
      default:
        return 'bg-white';
    }
  };

  return (
    <div className={`min-h-screen ${getLayoutClasses()}`}>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

export default RoleBasedLayout;