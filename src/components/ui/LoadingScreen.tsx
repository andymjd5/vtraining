import { motion } from 'framer-motion';
import Logo from './Logo';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo className="h-12 w-auto mx-auto" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-4"
        >
          <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <motion.div
              className="h-full bg-primary-600"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                repeat: Infinity,
                repeatType: 'reverse',
                duration: 1.5,
                ease: 'easeInOut'
              }}
            />
          </div>
          <p className="mt-4 text-gray-600">Chargement en cours...</p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;