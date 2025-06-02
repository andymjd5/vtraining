import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: (id: string) => void;
}

const Toast = ({ id, message, type = 'info', duration = 5000, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-success-500" />,
    error: <AlertCircle className="h-5 w-5 text-error-500" />,
    info: <Info className="h-5 w-5 text-primary-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning-500" />
  };

  const colors = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-error-50 border-error-200 text-error-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-center justify-between w-full max-w-sm rounded-lg border p-4 shadow-lg ${colors[type]}`}
    >
      <div className="flex items-center space-x-3">
        {icons[type]}
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="ml-4 inline-flex flex-shrink-0 rounded-md p-1.5 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export default Toast;