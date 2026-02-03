import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { NotificationList } from './NotificationList';
import { Button } from '../ui/button';

export const NotificationBell = () => {
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative relative w-10 h-10 rounded-full hover:bg-gray-100">
                    <Bell className="w-6 h-6 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 bg-white shadow-xl border border-gray-100 rounded-lg overflow-hidden">
                <NotificationList limit={5} />
                <div className="p-3 border-t bg-gray-50 text-center">
                    <button
                        onClick={() => {
                            setOpen(false);
                            const userStr = localStorage.getItem('user');
                            let role = 'patient';
                            if (userStr) {
                                try {
                                    const user = JSON.parse(userStr);
                                    role = user.role || 'patient';
                                } catch (e) {
                                    console.error('Error parsing user', e);
                                }
                            }

                            if (role === 'doctor') {
                                navigate('/doctor/notifications');
                            } else {
                                navigate('/dashboard/notifications');
                            }
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-none cursor-pointer"
                    >
                        Tüm Bildirimleri Gör
                    </button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
