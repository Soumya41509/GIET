
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType, duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const api = useMemo(() => ({
        showToast,
        success: (msg: string, dur?: number) => showToast(msg, 'success', dur),
        error: (msg: string, dur?: number) => showToast(msg, 'error', dur),
        warning: (msg: string, dur?: number) => showToast(msg, 'warning', dur),
        info: (msg: string, dur?: number) => showToast(msg, 'info', dur),
    }), [showToast]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            {createPortal(
                <div className="fixed top-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
                    <AnimatePresence mode="popLayout">
                        {toasts.map((toast) => (
                            <motion.div
                                key={toast.id}
                                layout
                                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                className="pointer-events-auto"
                            >
                                <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-emerald-50/80 border-emerald-100/50',
        error: 'bg-red-50/80 border-red-100/50',
        warning: 'bg-amber-50/80 border-amber-100/50',
        info: 'bg-blue-50/80 border-blue-100/50',
    };

    return (
        <div className={cn(
            "relative group flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl",
            bgColors[toast.type]
        )}>
            <div className="flex-shrink-0 mt-0.5">
                {icons[toast.type]}
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                    {toast.message}
                </p>
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-white/50"
            >
                <X className="h-4 w-4" />
            </button>

            {/* Progress Bar */}
            {toast.duration !== Infinity && (
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: (toast.duration || 4000) / 1000, ease: "linear" }}
                    className={cn(
                        "absolute bottom-0 left-0 h-1 rounded-full",
                        toast.type === 'success' && "bg-emerald-500/30",
                        toast.type === 'error' && "bg-red-500/30",
                        toast.type === 'warning' && "bg-amber-500/30",
                        toast.type === 'info' && "bg-blue-500/30"
                    )}
                />
            )}
        </div>
    );
};
