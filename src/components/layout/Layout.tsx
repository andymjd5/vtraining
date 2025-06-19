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
        
        <main className={`flex-grow ${isAuthenticated ? 'ml-64' : ''} min-h-[calc(100vh-4rem)]`}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      {!isAuthenticated && <Footer />}
    </div>
  );
};

export default Layout;