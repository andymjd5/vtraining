import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleCollapse: () => void;
  forceExpand: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Détecter si on est sur mobile - logique simplifiée
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []); // Pas de dépendances

  // Auto-collapse sidebar sur CourseView pour plus d'espace
  useEffect(() => {
    const isCourseView = location.pathname.includes('/courses/') && location.pathname.split('/').length > 3;
    
    if (isCourseView && !isMobile) {
      // Sur desktop, collapser automatiquement le sidebar sur CourseView
      setIsCollapsed(true);
    } else if (!isCourseView && isCollapsed) {
      // Sur les autres pages, remettre le sidebar normal si il était collapsé
      setIsCollapsed(false);
    }
  }, [location.pathname, isMobile]); // Retiré isCollapsed des dépendances

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const forceExpand = () => {
    setIsCollapsed(false);
  };

  const value: SidebarContextType = {
    isOpen,
    isCollapsed,
    isMobile,
    toggleSidebar,
    closeSidebar,
    toggleCollapse,
    forceExpand,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}; 