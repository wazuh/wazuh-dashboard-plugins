import React, {
  useContext,
  createContext,
  ReactNode,
  useState,
  useCallback,
} from 'react';
import { Toast } from '@elastic/eui';

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (toast: Toast) => void;
  addSuccessToast: (title: string, text?: string) => void;
  addErrorToast: (title: string, text?: string) => void;
  addWarningToast: (title: string, text?: string) => void;
  addInfoToast: (title: string, text?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const newToast: Toast = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random()}`,
    };
    setToasts(prevToasts => [...prevToasts, newToast]);
  }, []);

  const removeToast = useCallback((removedToast: Toast) => {
    setToasts(prevToasts =>
      prevToasts.filter(toast => toast.id !== removedToast.id),
    );
  }, []);

  const addSuccessToast = useCallback(
    (title: string, text?: string) => {
      addToast({
        title,
        text,
        color: 'success',
        iconType: 'check',
      });
    },
    [addToast],
  );

  const addErrorToast = useCallback(
    (title: string, text?: string) => {
      addToast({
        title,
        text,
        color: 'danger',
        iconType: 'alert',
      });
    },
    [addToast],
  );

  const addWarningToast = useCallback(
    (title: string, text?: string) => {
      addToast({
        title,
        text,
        color: 'warning',
        iconType: 'warning',
      });
    },
    [addToast],
  );

  const addInfoToast = useCallback(
    (title: string, text?: string) => {
      addToast({
        title,
        text,
        color: 'primary',
        iconType: 'iInCircle',
      });
    },
    [addToast],
  );

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    addSuccessToast,
    addErrorToast,
    addWarningToast,
    addInfoToast,
  };

  return React.createElement(ToastContext.Provider, { value }, children);
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
