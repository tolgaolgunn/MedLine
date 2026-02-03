import React from 'react';
import { useNotifications, Notification } from '../../contexts/NotificationContext';
import { Card, CardContent } from '../ui/card';
import { Bell, Check, Trash2, Calendar, Pill, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NotificationListProps {
    limit?: number;
    showHeader?: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({ limit, showHeader = true }) => {
    const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

    const displayedNotifications = limit ? notifications.slice(0, limit) : notifications;

    const getIcon = (type?: Notification['type']) => {
        switch (type) {
            case 'appointment':
                return <Calendar className="w-5 h-5 text-green-500" />;
            case 'prescription':
                return <Pill className="w-5 h-5 text-purple-500" />;
            case 'info':
            default:
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mb-2 opacity-20" />
                <p>Henüz bildiriminiz yok.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {showHeader && (
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-lg">Bildirimler</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-blue-600">
                            Tümünü Okundu İşaretle
                        </Button>
                    )}
                </div>
            )}
            <div className="divide-y max-h-[400px] overflow-y-auto">
                {displayedNotifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                        {notification.title}
                                    </p>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {format(new Date(notification.timestamp), 'dd MMM HH:mm', { locale: tr })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {notification.body}
                                </p>
                                {!notification.read && (
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" />
                                        Okundu işaretle
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
