import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { zIndex } from '../../utils/constants';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const typeStyles = {
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        warning: 'bg-yellow-600 text-white',
        info: 'bg-sky-600 text-white',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div
                className="fixed top-4 right-4 space-y-2 pointer-events-none"
                style={{ zIndex: zIndex.toast }}
            >
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto px-6 py-3 rounded-lg shadow-lg ${typeStyles[toast.type]} animate-slide-in flex items-center justify-between min-w-[300px] max-w-[500px]`}
                    >
                        <span>{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-4 text-white hover:text-gray-200 font-bold"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};