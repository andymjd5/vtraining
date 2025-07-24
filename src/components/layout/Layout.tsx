import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../contexts/SidebarContext';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface LayoutProps {
  isAuthenticated?: boolean;
}

const Layout = ({ isAuthenticated = false }: LayoutProps) => {
  const { user } = useAuth();
  const { isOpen, isCollapsed, isMobile, toggleSidebar } = useSidebar();

  // Déterminer si on doit afficher le sidebar
  const shouldShowSidebar = isAuthenticated && user;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar onMenuToggle={toggleSidebar} />
      
      <div className="flex flex-grow pt-16">
        {/* Sidebar */}
        {shouldShowSidebar && (
          <Sidebar userRole={user.role} />
        )}
        
        {/* Conteneur pour le contenu principal et le footer */}
        <div
          className={`flex flex-col flex-grow transition-all duration-300 ${
            shouldShowSidebar && !isMobile ? (isCollapsed ? 'md:ml-16' : 'md:ml-64') : ''
          }`}
        >
          {/* Contenu principal */}
          <main className="flex-grow">
            <div className="p-4 md:p-6">
              <Outlet />
            </div>
          </main>
          
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;