import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useTheme } from './ThemeContext';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastIcons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const toastColors = {
    success: {
        dark: 'bg-green-500/10 border-green-500/30 text-green-400',
        light: 'bg-green-50 border-green-200 text-green-700',
        icon: 'text-green-500',
        bar: 'bg-green-500',
    },
    error: {
        dark: 'bg-red-500/10 border-red-500/30 text-red-400',
        light: 'bg-red-50 border-red-200 text-red-700',
        icon: 'text-red-500',
        bar: 'bg-red-500',
    },
    warning: {
        dark: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        light: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        icon: 'text-yellow-500',
        bar: 'bg-yellow-500',
    },
    info: {
        dark: 'bg-primary-500/10 border-primary-500/30 text-primary-400',
        light: 'bg-blue-50 border-blue-200 text-blue-700',
        icon: 'text-primary-500',
        bar: 'bg-primary-500',
    },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const Icon = toastIcons[toast.type];
    const colors = toastColors[toast.type];

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-sm animate-slide-in-right min-w-[320px] max-w-[420px] relative overflow-hidden ${isDark ? colors.dark : colors.light
                }`}
            role="alert"
        >
            {/* Progress bar */}
            <div
                className={`absolute bottom-0 left-0 h-0.5 ${colors.bar} animate-toast-progress`}
                style={{ animationDuration: `${toast.duration || 4000}ms` }}
            />

            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{toast.title}</p>
                {toast.message && (
                    <p className={`text-xs mt-0.5 ${isDark ? 'opacity-70' : 'opacity-80'}`}>
                        {toast.message}
                    </p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast = { ...toast, id };
        setToasts(prev => [...prev, newToast]);

        // Auto-remove after duration
        const duration = toast.duration || 4000;
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3" id="toast-container">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
