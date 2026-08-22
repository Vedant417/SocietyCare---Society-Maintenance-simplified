import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-brand-card border-brand-success text-brand-charcoal hover:shadow-md shadow-sm border-l-4',
            error: 'bg-brand-card border-brand-danger text-brand-charcoal hover:shadow-md shadow-sm border-l-4',
            warning: 'bg-brand-card border-brand-warning text-brand-charcoal hover:shadow-md shadow-sm border-l-4',
            info: 'bg-brand-card border-brand-primary text-brand-charcoal hover:shadow-md shadow-sm border-l-4',
          };

          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-brand-success shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-brand-danger shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-brand-warning shrink-0" />,
            info: <Info className="w-5 h-5 text-brand-primary shrink-0" />,
          };

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl pointer-events-auto border border-brand-gray/40 shadow-sm transition-all duration-300 animate-fade-in ${typeStyles[toast.type]}`}
            >
              {icons[toast.type]}
              <div className="flex-1 text-sm font-medium leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-lg hover:bg-gray-100 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
