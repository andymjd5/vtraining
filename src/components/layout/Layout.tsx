import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { UserRole } from '../../types';

interface LayoutProps {
  isAuthenticated?: boolean;
}

const Layout = ({ isAuthenticated = false }: LayoutProps) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex flex-grow">
        {isAuthenticated && user && (
          <Sidebar userRole={user.role} />
        )}
        
        <main className={`flex-grow ${isAuthenticated ? 'ml-0 md:ml-64' : ''}`}>
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Layout;