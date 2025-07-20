import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  BookCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  GraduationCap,
  Target,
  PieChart,
  Shield,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../contexts/SidebarContext';
import CustomScrollbar from '../ui/CustomScrollbar';
import SidebarIcon from '../ui/SidebarIcon';
import { UserRole } from '../../types';
import { useEffect } from 'react';

interface SidebarProps {
  userRole: UserRole;
}

const Sidebar = ({ userRole }: SidebarProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, isCollapsed, isMobile, closeSidebar, toggleCollapse } = useSidebar();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavItems = () => {
    switch (userRole) {
      case UserRole.STUDENT:
        return [
          { 
            name: 'Tableau de bord', 
            path: '/student/dashboard', 
            icon: Home,
            description: 'Vue d\'ensemble de vos progrès'
          },
          { 
            name: 'Mes cours', 
            path: '/student/courses', 
            icon: BookOpen,
            description: 'Cours disponibles et en cours'
          },
          { 
            name: 'Mes certificats', 
            path: '/student/certificates', 
            icon: Award,
            description: 'Certificats obtenus'
          },
          { 
            name: 'Mon profil', 
            path: '/student/profile', 
            icon: User,
            description: 'Gérer votre profil'
          },
        ];
      case UserRole.COMPANY_ADMIN:
        return [
          { 
            name: 'Tableau de bord', 
            path: '/company-admin/dashboard', 
            icon: Home,
            description: 'Vue d\'ensemble de l\'entreprise'
          },
          { 
            name: 'Gestion des agents', 
            path: '/company-admin/users', 
            icon: Users,
            description: 'Gérer les utilisateurs'
          },
          { 
            name: 'Cours affectés', 
            path: '/company-admin/assigned-courses', 
            icon: BookCheck,
            description: 'Cours assignés à l\'entreprise'
          },
          { 
            name: 'Rapports', 
            path: '/company-admin/reports', 
            icon: BarChart,
            description: 'Analyses et statistiques'
          },
          { 
            name: 'Paramètres', 
            path: '/company-admin/settings', 
            icon: Settings,
            description: 'Configuration de l\'entreprise'
          },
        ];
      case UserRole.SUPER_ADMIN:
        return [
          { 
            name: 'Tableau de bord', 
            path: '/super-admin/dashboard', 
            icon: Home,
            description: 'Vue d\'ensemble du système'
          },
          { 
            name: 'Entreprises', 
            path: '/super-admin/companies', 
            icon: Building,
            description: 'Gestion des entreprises'
          },
          { 
            name: 'Formations', 
            path: '/super-admin/courses', 
            icon: GraduationCap,
            description: 'Gestion des formations'
          },
          { 
            name: 'Utilisateurs', 
            path: '/super-admin/users', 
            icon: Users,
            description: 'Gestion des utilisateurs'
          },
          { 
            name: 'Affectations', 
            path: '/super-admin/assignments', 
            icon: Target,
            description: 'Affectation des cours'
          },
          { 
            name: 'Rapports', 
            path: '/super-admin/reports', 
            icon: PieChart,
            description: 'Rapports et analyses'
          },
          { 
            name: 'Paramètres', 
            path: '/super-admin/settings', 
            icon: Settings,
            description: 'Configuration système'
          },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Desktop sidebar avec collapse
  const DesktopSidebar = () => (
    <motion.div 
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-red-600 to-red-700 shadow-xl z-30 sidebar-transition ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
    >
      {/* Header avec bouton collapse */}
      <div className="flex items-center justify-between p-4 border-b border-red-500/50">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-white font-bold text-lg"
          >
            Menu
          </motion.div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg bg-red-500/80 hover:bg-red-400 text-white transition-all duration-200 hover:scale-105 sidebar-hover"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation items avec scrollbar personnalisé */}
      <div className="h-[calc(100%-8rem)]">
        <CustomScrollbar className="h-full">
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `group flex items-center px-3 py-3 rounded-xl sidebar-transition sidebar-hover relative overflow-hidden ${
                    isActive 
                      ? 'bg-white text-red-600 shadow-lg sidebar-item-active' 
                      : 'text-white hover:bg-white/10 hover:shadow-md'
                  }`
                }
              >
                {/* Background effect pour l'item actif */}
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                <div className="relative z-10 flex items-center w-full">
                  <div className="flex-shrink-0">
                    <SidebarIcon
                      icon={item.icon}
                      isActive={location.pathname === item.path}
                      isCollapsed={isCollapsed}
                      size={20}
                    />
                  </div>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-3 flex-1"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-75 mt-1">{item.description}</div>
                    </motion.div>
                  )}
                </div>
              </NavLink>
            ))}
          </div>
        </CustomScrollbar>
          </div>

      {/* Footer avec logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-red-500/50 bg-red-600/90 backdrop-blur-sm">
            <button
              onClick={handleLogout}
          className="group flex items-center w-full px-3 py-3 text-white hover:bg-white/10 rounded-xl sidebar-transition sidebar-hover"
        >
          <div className="flex-shrink-0">
            <SidebarIcon
              icon={LogOut}
              isActive={false}
              isCollapsed={isCollapsed}
              size={20}
            />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-3 font-medium"
            >
              Déconnexion
            </motion.span>
          )}
        </button>
      </div>
    </motion.div>
  );

  // Mobile sidebar overlay
  const MobileSidebar = () => {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => {
                closeSidebar();
              }}
            />
            
            {/* Sidebar slide-in */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-red-600 to-red-700 z-50 shadow-2xl flex flex-col"
            >
              {/* Header mobile */}
              <div className="flex items-center justify-between p-6 border-b border-red-500/50">
                <div className="text-white">
                  <div className="font-bold text-xl">Menu</div>
                  {user && (
                    <div className="text-sm opacity-75 mt-1">
                      {user.name || user.email}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    closeSidebar();
                  }} 
                  className="p-2 rounded-full bg-red-500/80 hover:bg-red-400 text-white transition-all duration-200 hover:scale-105 sidebar-hover"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation mobile avec scrollbar personnalisé */}
              <div className="flex-1">
                <CustomScrollbar className="h-full">
                  <div className="p-4 space-y-2">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => 
                          `group flex items-center px-4 py-4 rounded-xl sidebar-transition sidebar-hover ${
                          isActive 
                              ? 'bg-white text-red-600 shadow-lg sidebar-item-active' 
                              : 'text-white hover:bg-white/10 hover:shadow-md'
                          }`
                        }
                        onClick={() => {
                          closeSidebar();
                        }}
                      >
                        <div className="flex-shrink-0">
                          <SidebarIcon
                            icon={item.icon}
                            isActive={location.pathname === item.path}
                            isCollapsed={false}
                            size={20}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm opacity-75 mt-1">{item.description}</div>
                        </div>
                    </NavLink>
                  ))}
                </div>
                </CustomScrollbar>
              </div>

              {/* Footer mobile */}
              <div className="p-4 border-t border-red-500/50 bg-red-600/90 backdrop-blur-sm">
                  <button
                  onClick={() => { 
                    handleLogout(); 
                    closeSidebar(); 
                  }}
                  className="flex items-center w-full px-4 py-4 text-white hover:bg-white/10 rounded-xl sidebar-transition sidebar-hover"
                >
                  <div className="flex-shrink-0">
                    <SidebarIcon
                      icon={LogOut}
                      isActive={false}
                      isCollapsed={false}
                      size={20}
                    />
                  </div>
                  <span className="ml-4 font-medium">Déconnexion</span>
                  </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };
  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && <DesktopSidebar />}
      
      {/* Mobile sidebar */}
      {isMobile && <MobileSidebar />}
    </>
  );
};

export default Sidebar;