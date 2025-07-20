import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  showScrollbar?: boolean;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ 
  children, 
  className = "", 
  showScrollbar = true 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const updateScrollInfo = () => {
      setScrollTop(element.scrollTop);
      setScrollHeight(element.scrollHeight);
      setClientHeight(element.clientHeight);
    };

    const handleScroll = () => {
      setIsScrolling(true);
      updateScrollInfo();
      
      const timeout = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
      
      return () => clearTimeout(timeout);
    };

    updateScrollInfo();
    element.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateScrollInfo);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollInfo);
    };
  }, []);

  const scrollPercentage = scrollHeight > clientHeight 
    ? (scrollTop / (scrollHeight - clientHeight)) * 100 
    : 0;

  const thumbHeight = Math.max((clientHeight / scrollHeight) * 100, 20);

  const handleThumbClick = (e: React.MouseEvent) => {
    const element = scrollRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const scrollPercentage = clickY / rect.height;
    const newScrollTop = scrollPercentage * (element.scrollHeight - element.clientHeight);
    
    element.scrollTo({
      top: newScrollTop,
      behavior: 'smooth'
    });
  };

  const handleThumbDrag = (e: React.MouseEvent) => {
    const element = scrollRef.current;
    if (!element) return;

    const startY = e.clientY;
    const startScrollTop = element.scrollTop;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const scrollRatio = deltaY / (element.clientHeight - 40); // 40px pour la hauteur du thumb
      const newScrollTop = startScrollTop + (scrollRatio * (element.scrollHeight - element.clientHeight));
      
      element.scrollTop = Math.max(0, Math.min(newScrollTop, element.scrollHeight - element.clientHeight));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto scrollbar-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {children}
      </div>
      
      <AnimatePresence>
        {showScrollbar && scrollHeight > clientHeight && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ 
              opacity: isScrolling ? 1 : 0.3, 
              scaleX: 1 
            }}
            exit={{ opacity: 0, scaleX: 0 }}
            className="absolute top-0 right-1 bottom-0 w-2 flex flex-col"
          >
            {/* Track */}
            <div className="flex-1 relative">
              <div 
                className="absolute top-0 left-0 right-0 bottom-0 bg-white/10 rounded-full cursor-pointer"
                onClick={handleThumbClick}
              />
              
              {/* Thumb */}
              <motion.div
                className="absolute left-0 right-0 bg-white/30 hover:bg-white/50 rounded-full cursor-pointer transition-colors duration-200"
                style={{
                  top: `${scrollPercentage}%`,
                  height: `${thumbHeight}%`,
                  transform: 'translateY(-50%)'
                }}
                onMouseDown={handleThumbDrag}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomScrollbar; 