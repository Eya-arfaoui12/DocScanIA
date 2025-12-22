import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SuccessToastProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export default function SuccessToast({
  isOpen,
  onClose,
  title,
  message,
  duration = 3000,
  type = 'success'
}: SuccessToastProps) {
  // Fermeture automatique après la durée spécifiée
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-500',
      icon: (
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: 'text-green-800 dark:text-green-200'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-500',
      icon: (
        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: 'text-red-800 dark:text-red-200'
    },
    warning: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-500',
      icon: (
        <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      text: 'text-orange-800 dark:text-orange-200'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-500',
      icon: (
        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: 'text-blue-800 dark:text-blue-200'
    }
  };

  const style = typeStyles[type];

  const toastContent = (
    <div className="fixed top-4 right-4 z-[99999] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className={`flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg ${style.bg} ${style.border} min-w-[320px] max-w-md`}>
        {/* Icon */}
        <div className="flex-shrink-0">
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`font-semibold ${style.text}`}>
            {title}
          </h3>
          {message && (
            <p className={`mt-1 text-sm ${style.text} opacity-90`}>
              {message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
}