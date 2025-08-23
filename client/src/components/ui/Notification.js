import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Notification = ({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Aguarda a animação terminar
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    const baseStyles = 'fixed top-4 right-4 z-[9999] max-w-sm w-full border-2 rounded-lg shadow-2xl transform transition-all duration-300 backdrop-blur-md';
    
    const typeStyles = {
      success: 'bg-green-100/95 dark:bg-green-900/95 border-green-400 dark:border-green-500 shadow-green-300/50 dark:shadow-green-600/30',
      error: 'bg-red-100/95 dark:bg-red-900/95 border-red-400 dark:border-red-500 shadow-red-300/50 dark:shadow-red-600/30',
      warning: 'bg-yellow-100/95 dark:bg-yellow-900/95 border-yellow-400 dark:border-yellow-500 shadow-yellow-300/50 dark:shadow-yellow-600/30',
      info: 'bg-blue-100/95 dark:bg-blue-900/95 border-blue-400 dark:border-blue-500 shadow-blue-300/50 dark:shadow-blue-600/30'
    };

    const visibilityStyles = isVisible 
      ? 'translate-x-0 opacity-100' 
      : 'translate-x-full opacity-0';

    return `${baseStyles} ${typeStyles[type]} ${visibilityStyles} ${className}`;
  };

  const getIconStyles = () => {
    const baseStyles = 'flex-shrink-0 w-5 h-5';
    
    const typeStyles = {
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500'
    };

    return `${baseStyles} ${typeStyles[type]}`;
  };

  return (
    <div className={getStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={getIconStyles()}>
            {getIcon()}
          </div>
          
          <div className="ml-3 flex-1">
            {title && (
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {message && (
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook para gerenciar notificações
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message, title = 'Sucesso') => {
    return addNotification({ type: 'success', title, message });
  };

  const showError = (message, title = 'Erro') => {
    return addNotification({ type: 'error', title, message });
  };

  const showWarning = (message, title = 'Aviso') => {
    return addNotification({ type: 'warning', title, message });
  };

  const showInfo = (message, title = 'Informação') => {
    return addNotification({ type: 'info', title, message });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Componente para renderizar todas as notificações
export const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Notification
            {...notification}
            onClose={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default Notification;
