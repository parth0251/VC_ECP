import { useState, useEffect, useCallback } from 'react';

const TOAST_DURATION = 4000;

/**
 * Toast notification system.
 * Displays auto-adjustments, validation errors, and constraint messages.
 */
export function Notifications({ notifications = [] }) {
    const [toasts, setToasts] = useState([]);

    // Add new notifications as toasts
    useEffect(() => {
        if (notifications.length === 0) return;

        const newToasts = notifications.map((msg, i) => ({
            id: Date.now() + i,
            message: msg,
            type: msg.toLowerCase().includes('not available') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('not compatible')
                ? 'warning'
                : msg.toLowerCase().includes('includes') || msg.toLowerCase().includes('requires')
                    ? 'info'
                    : 'info',
        }));

        setToasts(prev => [...prev, ...newToasts]);
    }, [notifications]);

    // Auto-remove toasts
    useEffect(() => {
        if (toasts.length === 0) return;
        const timer = setTimeout(() => {
            setToasts(prev => prev.slice(1));
        }, TOAST_DURATION);
        return () => clearTimeout(timer);
    }, [toasts]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <span className="toast-icon">
                        {toast.type === 'warning' ? '⚠' : toast.type === 'error' ? '✕' : 'ℹ'}
                    </span>
                    <span className="toast-message">{toast.message}</span>
                    <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
                </div>
            ))}
        </div>
    );
}

export default Notifications;
