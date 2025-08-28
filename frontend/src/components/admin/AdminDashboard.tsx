import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PageHeader } from '../ui/PageHeader';
import { 
  Users, 
  Clock, 
  Calendar, 
  Brain, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  BarChart3,
  Settings,
  LogOut,
  UserPlus,
  FileText,
  Activity
} from 'lucide-react';

interface PendingApproval {
  id: number;
  name: string;
  role: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface SystemNotification {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'info';
  timestamp: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AdminDashboard: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    {
      id: 1,
      name: "Dr. Ahmet YILMAZ",
      role: "Doktor",
      date: "15.12.2024",
      time: "14:30",
      status: 'pending'
    },
    {
      id: 2,
      name: "Fatma ÖZKAN",
      role: "Hasta",
      date: "15.12.2024",
      time: "15:45",
      status: 'pending'
    },
    
  ]);

  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([
    {
      id: 1,
      message: "Sistem yedeklemesi başarıyla tamamlandı",
      type: 'success',
      timestamp: "1 saat önce",
      icon: CheckCircle
    },
    {
      id: 2,
      message: "Yüksek CPU kullanımı tespit edildi",
      type: 'warning',
      timestamp: "2 saat önce",
      icon: AlertTriangle
    },
    {
      id: 3,
      message: "Yeni kullanıcı onayları bekleniyor",
      type: 'info',
      timestamp: "3 saat önce",
      icon: Clock
    }
  ]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleViewAllApprovals = () => {
    // Tüm onayları görüntüleme sayfasına yönlendir
    console.log('Tüm onayları görüntüle');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'addUser':
        console.log('Kullanıcı ekleme sayfasına yönlendir');
        break;
      case 'aiReports':
        console.log('AI raporları sayfasına yönlendir');
        break;
      case 'systemAnalysis':
        console.log('Sistem analizi sayfasına yönlendir');
        break;
      default:
        break;
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-orange-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Admin Dashboard"
        subtitle="Sistemin genel durumunu buradan takip edebilirsiniz"
        showBackButton={false}
      />

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Toplam Kullanıcı</p>
                <p className="text-3xl font-bold">2,847</p>
                <p className="text-sm opacity-90 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12%
                </p>
              </div>
              <Users className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Bekleyen Onaylar</p>
                <p className="text-3xl font-bold">23</p>
                <p className="text-sm opacity-90 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +5
                </p>
              </div>
              <Clock className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Günlük Randevular</p>
                <p className="text-3xl font-bold">156</p>
                <p className="text-sm opacity-90 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +8%
                </p>
              </div>
              <Calendar className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">AI Analizleri</p>
                <p className="text-3xl font-bold">89</p>
                <p className="text-sm opacity-90 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +15%
                </p>
              </div>
              <Brain className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ana İçerik Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bekleyen Onaylar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Bekleyen Onaylar
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Kullanıcı kayıt onayları bekleniyor
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewAllApprovals}
                className="border-2 border-gray-300"
              >
                Tümünü Gör
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{approval.name}</h3>
                      <p className="text-sm text-gray-600">{approval.role}</p>
                      <p className="text-xs text-gray-500">{approval.date} - {approval.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Bekliyor
                    </Badge>
                    <Button size="sm" variant="outline" className="border-2 border-gray-300">
                      İncele
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sistem Bildirimleri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Sistem Bildirimleri
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Son sistem güncellemeleri
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <notification.icon className={`w-5 h-5 mt-0.5 ${getNotificationIconColor(notification.type)}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <p className="text-xs text-gray-500">{notification.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hızlı İşlemler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Hızlı İşlemler
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Sık kullanılan admin işlemleri
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-blue-50 hover:border-blue-300 transition-colors border-2 border-gray-300"
                onClick={() => handleQuickAction('addUser')}
              >
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Kullanıcı Ekle</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-purple-50 hover:border-purple-300 transition-colors border-2 border-gray-300"
                onClick={() => handleQuickAction('aiReports')}
              >
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">AI Raporları</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-green-50 hover:border-green-300 transition-colors border-2 border-gray-300"
                onClick={() => handleQuickAction('systemAnalysis')}
              >
                <BarChart3 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Sistem Analizi</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div> 

      {/* Alt Bilgi */}
      <div className="text-center text-sm text-gray-500">
        <p>MedLine Admin Panel v1.0 - Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;

