import React from 'react';
import { NotificationList } from './NotificationList';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardContent } from '../ui/card';

export const Notifications = () => {
    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <PageHeader
                title="Bildirimler"
                subtitle="Sistem bildirimleri ve randevu güncellemeleri"
            />

            <Card>
                <CardContent className="p-0">
                    <NotificationList showHeader={false} />
                </CardContent>
            </Card>
        </div>
    );
};
