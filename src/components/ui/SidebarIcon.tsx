import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SidebarIconProps {
  icon: LucideIcon;
  isActive?: boolean;
  isCollapsed?: boolean;
  size?: number;
  className?: string;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ 
  icon: Icon, 
  isActive = false, 
  isCollapsed = false,
  size = 20,
  className = ""
}) => {
  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      whileHover={{ 
        scale: 1.1,
        rotate: isCollapsed ? 5 : 0
      }}
      whileTap={{ scale: 0.95 }}
      initial={false}
      animate={{
        scale: isActive ? 1.05 : 1,
        filter: isActive 
          ? "drop-shadow(0 2px 8px rgba(255, 255, 255, 0.4))" 
          : "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))"
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    >
      <div className="relative">
        {/* Effet de glow pour les icônes actives */}
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-full blur-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        {/* Icône principale */}
        <Icon 
          size={size} 
          className={`relative z-10 transition-all duration-200 ${
            isActive 
              ? 'text-red-600 drop-shadow-sm' 
              : 'text-white drop-shadow-sm'
          }`}
        />
        
        {/* Effet de pulse pour les icônes actives */}
        {isActive && (
          <motion.div
            className="absolute inset-0 border-2 border-white/30 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default SidebarIcon; 