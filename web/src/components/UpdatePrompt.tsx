import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export function UpdatePrompt() {
    const [showPrompt, setShowPrompt] = useState(false);

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(registration) {
            console.log('SW Registered:', registration);
            // Check for updates every 60 seconds
            if (registration) {
                setInterval(() => {
                    registration.update();
                }, 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.log('SW registration error:', error);
        },
    });

    useEffect(() => {
        if (needRefresh) {
            setShowPrompt(true);
        }
    }, [needRefresh]);

    const handleUpdate = () => {
        updateServiceWorker(true);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setNeedRefresh(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
            <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-semibold text-sm">New version available!</p>
                    <p className="text-xs text-blue-100">Refresh to get the latest updates</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDismiss}
                        className="px-3 py-1.5 text-xs text-blue-100 hover:text-white transition-colors"
                    >
                        Later
                    </button>
                    <button
                        onClick={handleUpdate}
                        className="px-3 py-1.5 bg-white text-blue-600 rounded text-xs font-semibold hover:bg-blue-50 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
}
