import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-600" />,
        error: <AlertCircle className="w-5 h-5 text-red-600" />,
        info: <Info className="w-5 h-5 text-blue-600" />,
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
    };

    const textColors = {
        success: 'text-green-800',
        error: 'text-red-800',
        info: 'text-blue-800',
    };

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
            <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${bgColors[type]} max-w-md`}>
                {icons[type]}
                <p className={`flex-1 text-sm font-medium ${textColors[type]}`}>{message}</p>
                <button
                    onClick={onClose}
                    className={`flex-shrink-0 ${textColors[type]} hover:opacity-70`}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
