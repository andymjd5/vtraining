import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  BookOpen, 
  Award, 
  User, 
  Bell, 
  HelpCircle, 
  LogOut,
  Users,
  BarChart,
  Settings,
  Building,
  FileText,
  UserPlus,
  BookCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface SidebarProps {
  userRole: UserRole;
}

const Sidebar = ({ userRole }: SidebarProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavItems = () => {
    switch (userRole) {
      case UserRole.STUDENT:
        return [
          { name: 'Tableau de bord', path: '/student/dashboard', icon: <Home className="h-5 w-5" /> },
          { name: 'Mes cours', path: '/student/courses', icon: <BookOpen className="h-5 w-5" /> },
          { name: 'Mes certificats', path: '/student/certificates', icon: <Award className="h-5 w-5" /> },
          { name: 'Mon profil', path: '/student/profile', icon: <User className="h-5 w-5" /> },
        ];
      case UserRole.COMPANY_ADMIN:
        return [
          { name: 'Tableau de bord', path: '/company-admin/dashboard', icon: <Home className="h-5 w-5" /> },
          { name: 'Gestion des agents', path: '/company-admin/users', icon: <Users className="h-5 w-5" /> },
          { name: 'Cours affectés', path: '/company-admin/assigned-courses', icon: <BookCheck className="h-5 w-5" /> },
          { name: 'Rapports', path: '/company-admin/reports', icon: <BarChart className="h-5 w-5" /> },
          { name: 'Paramètres', path: '/company-admin/settings', icon: <Settings className="h-5 w-5" /> },
        ];
      case UserRole.SUPER_ADMIN:
        return [
          { name: 'Tableau de bord', path: '/super-admin/dashboard', icon: <Home className="h-5 w-5" /> },
          { name: 'Entreprises', path: '/super-admin/companies', icon: <Building className="h-5 w-5" /> },
          { name: 'Formations', path: '/super-admin/courses', icon: <BookOpen className="h-5 w-5" /> },
          { name: 'Utilisateurs', path: '/super-admin/users', icon: <Users className="h-5 w-5" /> },
          { name: 'Rapports', path: '/super-admin/reports', icon: <FileText className="h-5 w-5" /> },
          { name: 'Paramètres', path: '/super-admin/settings', icon: <Settings className="h-5 w-5" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-red-600 overflow-y-auto z-30">
      <div className="p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-black text-white' 
                    : 'text-white hover:bg-black hover:text-white'
                }`
              }
            >
              <div className="mr-3">{item.icon}</div>
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-red-500">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-white hover:bg-black hover:text-white rounded-lg transition-all duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;