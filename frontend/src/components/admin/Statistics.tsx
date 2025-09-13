import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Eye,
  Download,
  Filter
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ChartData {
  month: string;
  patients: number;
  doctors: number;
  appointments: number;
}

const Statistics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedChart, setSelectedChart] = useState('overview');

  const statCards: StatCard[] = [
    {
      title: "Toplam Kullanıcı",
      value: "2,847",
      change: "+12%",
      changeType: "increase",
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: "Aktif Doktorlar",
      value: "156",
      change: "+8%",
      changeType: "increase",
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "Toplam Randevu",
      value: "1,234",
      change: "+23%",
      changeType: "increase",
      icon: Calendar,
      color: "bg-purple-500"
    },
    {
      title: "Sistem Performansı",
      value: "98.5%",
      change: "+2.1%",
      changeType: "increase",
      icon: Activity,
      color: "bg-orange-500"
    }
  ];

  const chartData: ChartData[] = [
    { month: "Ocak", patients: 120, doctors: 15, appointments: 89 },
    { month: "Şubat", patients: 135, doctors: 18, appointments: 102 },
    { month: "Mart", patients: 142, doctors: 20, appointments: 118 },
    { month: "Nisan", patients: 158, doctors: 22, appointments: 134 },
    { month: "Mayıs", patients: 167, doctors: 25, appointments: 145 },
    { month: "Haziran", patients: 189, doctors: 28, appointments: 167 }
  ];

  const getChangeIcon = (changeType: string) => {
    if (changeType === 'increase') {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getChangeColor = (changeType: string) => {
    if (changeType === 'increase') {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">İstatistikler</h1>
          <p className="text-muted-foreground">Sistem performansı ve kullanım istatistikleri</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="quarter">Bu Çeyrek</option>
            <option value="year">Bu Yıl</option>
          </select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {getChangeIcon(stat.changeType)}
                    <span className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-muted-foreground">geçen dönem</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Genel Bakış
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Aylık Büyüme</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Hastalar</Badge>
                  <Badge variant="outline">Doktorlar</Badge>
                  <Badge variant="outline">Randevular</Badge>
                </div>
              </div>
              <div className="space-y-3">
                {chartData.map((data, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-16 text-sm text-gray-600">{data.month}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Hastalar: {data.patients}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Doktorlar: {data.doctors}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">Randevular: {data.appointments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performans Metrikleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sistem Uptime</span>
                  <span className="text-sm font-bold text-green-600">99.9%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ortalama Yanıt Süresi</span>
                  <span className="text-sm font-bold text-blue-600">45ms</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Kullanıcı Memnuniyeti</span>
                  <span className="text-sm font-bold text-purple-600">4.8/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Güvenlik Skoru</span>
                  <span className="text-sm font-bold text-orange-600">A+</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Detaylı Analiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">Kullanıcı Dağılımı</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Hastalar</span>
                  <span className="text-sm font-medium">2,156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Doktorlar</span>
                  <span className="text-sm font-medium">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Adminler</span>
                  <span className="text-sm font-medium">12</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Randevu Durumu</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tamamlanan</span>
                  <span className="text-sm font-medium">1,089</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bekleyen</span>
                  <span className="text-sm font-medium">89</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">İptal Edilen</span>
                  <span className="text-sm font-medium">56</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Sistem Kullanımı</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">CPU Kullanımı</span>
                  <span className="text-sm font-medium">23%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">RAM Kullanımı</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Disk Kullanımı</span>
                  <span className="text-sm font-medium">67%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;