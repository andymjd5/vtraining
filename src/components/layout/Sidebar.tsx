import { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface SidebarProps {
  userRole: UserRole;
}

const Sidebar = ({ userRole }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();

  const getNavItems = () => {
    switch (userRole) {
      case UserRole.AGENT:
        return [
          { name: 'Tableau de bord', path: '/dashboard', icon: <Home className="h-5 w-5" /> },
          { name: 'Mes cours', path: '/dashboard/courses', icon: <BookOpen className="h-5 w-5" /> },
          { name: 'Mes certificats', path: '/dashboard/certificates', icon: <Award className="h-5 w-5" /> },
          { name: 'Mon profil', path: '/dashboard/profile', icon: <User className="h-5 w-5" /> },
          { name: 'Notifications', path: '/dashboard/notifications', icon: <Bell className="h-5 w-5" /> },
          { name: 'Support / Aide', path: '/dashboard/support', icon: <HelpCircle className="h-5 w-5" /> },
        ];
      case UserRole.COMPANY_ADMIN:
        return [
          { name: 'Tableau de bord', path: '/company-admin', icon: <Home className="h-5 w-5" /> },
          { name: 'Gestion des agents', path: '/company-admin/users', icon: <Users className="h-5 w-5" /> },
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
    <motion.div 
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-primary-600 text-white overflow-y-auto z-40 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
    >
      <div className="p-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center px-2 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-500 text-white' 
                    : 'text-white/80 hover:bg-primary-500 hover:text-white'
                }`
              }
            >
              <div className="flex items-center">
                <div className="mr-3">{item.icon}</div>
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </div>
            </NavLink>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-primary-500">
          <button
            onClick={logout}
            className="flex items-center w-full px-2 py-3 text-white/80 hover:bg-primary-500 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            {!isCollapsed && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
