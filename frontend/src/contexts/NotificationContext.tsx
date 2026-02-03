import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { messaging, onMessage, requestPermission } from '../firebase';
import { toast } from 'react-hot-toast';

export interface Notification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    timestamp: Date;
    type?: 'appointment' | 'prescription' | 'info';
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:3005/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Map backend data to frontend Notification interface
                const mappedNotifications: Notification[] = data.map((n: any) => ({
                    id: n.notification_id || n.id,
                    title: n.title,
                    body: n.message || n.body,
                    read: n.is_read || n.read,
                    timestamp: new Date(n.created_at || n.timestamp),
                    type: n.type
                }));
                setNotifications(mappedNotifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        const initNotifications = async () => {
            const token = await requestPermission();
            if (token) {
                console.log('FCM Token:', token);
            }
        };

        initNotifications();
        fetchNotifications();

        if (messaging) {
            const unsubscribe = onMessage(messaging, (payload: any) => {
                console.log('Message received. ', payload);
                const { title, body } = payload.notification || {};

                if (title && body) {
                    const newNotification: Notification = {
                        id: Date.now().toString(),
                        title,
                        body,
                        read: false,
                        timestamp: new Date(),
                        type: 'info'
                    };

                    setNotifications(prev => [newNotification, ...prev]);
                    toast.success(`${title}: ${body}`);
                }
            });

            return () => unsubscribe();
        }
    }, []);

    // Socket.IO Connection
    useEffect(() => {
        let socket: any;

        const initSocket = async () => {
            const { io } = await import('socket.io-client');
            socket = io('http://localhost:3005');

            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const userId = user.id || user.user_id;

                    socket.emit('join', userId);
                    console.log('Joined socket room:', userId);

                    socket.on('notification', (data: any) => {
                        console.log('Socket notification received:', data);
                        // Check if notification with same ID already exists to prevent duplicates
                        setNotifications(prev => {
                            if (prev.some(n => n.id === data.id || n.id === data.notification_id)) {
                                return prev;
                            }

                            const newNotification: Notification = {
                                id: data.id || Date.now().toString(),
                                title: data.title,
                                body: data.message || data.body,
                                read: false,
                                timestamp: new Date(data.timestamp || Date.now()),
                                type: data.type || 'info'
                            };
                            toast.success(`${newNotification.title}: ${newNotification.body}`);
                            return [newNotification, ...prev];
                        });
                    });

                } catch (e) {
                    console.error('Error parsing user for socket:', e);
                }
            }
        };

        initSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:3005/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:3005/api/notifications/mark-all-read', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const addNotification = (n: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
        const newNotification: Notification = {
            ...n,
            id: Date.now().toString(),
            read: false,
            timestamp: new Date()
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
