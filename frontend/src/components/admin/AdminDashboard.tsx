import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PageHeader } from '../ui/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'react-hot-toast';
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
  Activity,
  ChevronDown,
  X
} from 'lucide-react';

interface PendingApproval {
  id: number;
  name: string;
  role: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  description?: string;
}

interface SystemNotification {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'info';
  timestamp: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AppointmentData {
  month: string;
  count: number;
}

const AdminDashboard: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    {
      id: 1,
      name: "Dr. Ahmet YILMAZ",
      role: "Doktor",
      date: "15.12.2024",
      time: "14:30",
      status: 'pending',
      description: "Kardiyoloji uzmanı olarak sisteme katılmak istiyorum. 10 yıllık deneyimim var ve MedLine platformunda hasta takibi yapmak istiyorum."
    },
    {
      id: 2,
      name: "Fatma ÖZKAN",
      role: "Hasta",
      date: "15.12.2024",
      time: "15:45",
      status: 'pending',
      description: "Online randevu almak ve doktorlarla görüşmek için sisteme kayıt olmak istiyorum. Kronik hastalığım nedeniyle düzenli takip gerekiyor."
    },
    
  ]);

  const [appointmentData] = useState<AppointmentData[]>([
    { month: 'Ocak', count: 100 },
    { month: 'Şubat', count: 520 },
    { month: 'Mart', count: 380 },
    { month: 'Nisan', count: 670 },
    { month: 'Mayıs', count: 730 },
    { month: 'Haziran', count: 890 },
    { month: 'Temmuz', count: 950 },
    { month: 'Ağustos', count: 780 },
    { month: 'Eylül', count: 820 },
    { month: 'Ekim', count: 910 },
    { month: 'Kasım', count: 760 },
    { month: 'Aralık', count: 10000 }
  ]);

  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [filteredApprovals, setFilteredApprovals] = useState<PendingApproval[]>([]);

  const availableYears = Array.from({ length: 12 }, (_, i) => 2024 + i);

  // Filtreleme fonksiyonu
  const applyFilters = () => {
    let filtered = [...pendingApprovals];

    // Rol filtresi
    if (roleFilter !== 'all') {
      filtered = filtered.filter(approval => approval.role === roleFilter);
    }

    // Tarih filtresi
    if (dateFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toLocaleDateString('tr-TR');
      
      filtered = filtered.filter(approval => {
        switch (dateFilter) {
          case 'today':
            return approval.date === todayStr;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return new Date(approval.date.split('.').reverse().join('-')) >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return new Date(approval.date.split('.').reverse().join('-')) >= monthAgo;
          case 'last7days':
            const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return new Date(approval.date.split('.').reverse().join('-')) >= last7Days;
          case 'last30days':
            const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return new Date(approval.date.split('.').reverse().join('-')) >= last30Days;
          default:
            return true;
        }
      });
    }

    setFilteredApprovals(filtered);
  };

  // Component mount olduğunda ve filtreler değiştiğinde filtreleme yap
  useEffect(() => {
    applyFilters();
  }, [roleFilter, dateFilter, pendingApprovals]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleViewAllApprovals = () => {
    setShowFiltersModal(true);
  };

  const handleApplyFilters = () => {
    console.log('Filtreler uygulandı:', { roleFilter, dateFilter });
    
    // Filtreleri uygula
    applyFilters();
    
    // Seçili filtreleri bildirimde göster
    const roleText = roleFilter === 'all' ? 'Tüm Roller' : roleFilter;
    const dateText = dateFilter === 'all' ? 'Tüm Tarihler' : 
                    dateFilter === 'today' ? 'Bugün' :
                    dateFilter === 'week' ? 'Bu Hafta' :
                    dateFilter === 'month' ? 'Bu Ay' :
                    dateFilter === 'last7days' ? 'Son 7 Gün' :
                    dateFilter === 'last30days' ? 'Son 30 Gün' : dateFilter;
    
    // Toast bildirimi
    toast.success(`✅ Filtreler uygulandı!\n\nRol: ${roleText}\nTarih: ${dateText}\n\nSonuç: ${filteredApprovals.length} onay talebi bulundu.`, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        fontSize: '14px',
        padding: '16px',
        borderRadius: '8px',
        maxWidth: '400px',
        whiteSpace: 'pre-line'
      }
    });
    
    setShowFiltersModal(false);
  };

  const handleClearFilters = () => {
    setRoleFilter('all');
    setDateFilter('all');
    console.log('Filtreler temizlendi');
    // Filtreleri temizledikten sonra tüm onayları göster
    setFilteredApprovals(pendingApprovals);
    
    // Toast bildirimi
    toast.success('🧹 Filtreler temizlendi!\n\nTüm onay talepleri gösteriliyor.', {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#6B7280',
        color: '#fff',
        fontSize: '14px',
        padding: '16px',
        borderRadius: '8px',
        maxWidth: '350px',
        whiteSpace: 'pre-line'
      }
    });
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setIsYearDropdownOpen(false);
    // Burada yıl değiştiğinde veri güncelleme işlemi yapılabilir
    console.log('Yıl değiştirildi:', year);
  };

  const handleApprovalClick = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setShowDetailModal(true);
  };

  const handleApprove = (approval: PendingApproval) => {
    console.log('Onaylandı:', approval.name);
    // Burada onaylama işlemi yapılabilir
    setShowDetailModal(false);
  };

  const handleReject = (approval: PendingApproval) => {
    console.log('Reddedildi:', approval.name);
    // Burada reddetme işlemi yapılabilir
    setShowDetailModal(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'addUser':
        // Kullanıcı Yönetimi sayfasına yönlendir
        window.location.href = '/admin/user-management';
        break;
      case 'userManagement':
        // Hasta Onayları sayfasına yönlendir
        window.location.href = '/admin/patient-approvals';
        break;
      case 'systemAnalysis':
        // İstatistikler sayfasına yönlendir
        window.location.href = '/admin/statistics';
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
        title="Admin Ana Sayfa"
        subtitle="Sistemin genel durumunu buradan takip edebilirsiniz"
        showBackButton={false}
      />


      {/* Ana İçerik Grid - Yan Yana Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                className="!border-2 !border-gray-300"
              >
                Filtreler
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredApprovals.map((approval) => (
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
                    <Badge variant="secondary" className="bg-black text-white">
                      Bekliyor
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="!border-2 !border-gray-300"
                      onClick={() => handleApprovalClick(approval)}
                    >
                      İncele
                    </Button>
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
                <span className="text-sm font-medium">Kullanıcı Yönetimi</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-purple-50 hover:border-purple-300 transition-colors border-2 border-gray-300"
                onClick={() => handleQuickAction('userManagement')}
              >
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Hasta Onayları</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-green-50 hover:border-green-300 transition-colors border-2 border-gray-300"
                onClick={() => handleQuickAction('systemAnalysis')}
              >
                <BarChart3 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">İstatistikler</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div> 

      {/* Randevu İstatistikleri Grafiği */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Aylık Randevu İstatistikleri
            </CardTitle>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center gap-2 border-2 border-gray-300 hover:border-blue-400"
              >
                <Calendar className="w-4 h-4" />
                {selectedYear}
                <ChevronDown className="w-4 h-4" />
              </Button>
              {isYearDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[120px] max-h-48 overflow-y-auto">
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                        year === selectedYear ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-end justify-between gap-3 p-6 bg-gray-50 rounded-lg" style={{ height: '384px' }}>
            {appointmentData.map((data, index) => {
              const maxCount = Math.max(...appointmentData.map(d => d.count));
              // Sıfırdan başlayarak gerçek oranları göster - piksel cinsinden
              const height = (data.count / maxCount) * 300;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1 group">
                  <div className="flex flex-col items-center mb-3 relative">
                    <span className="text-sm font-bold text-gray-800 mb-2">
                      {data.count}
                    </span>
                      <div 
                        className="w-12 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1"
                        style={{ height: `${height}px` }}
                      />
                  </div>
                  <span className="text-xs text-gray-600 mt-3 transform -rotate-45 origin-left group-hover:text-blue-600 group-hover:font-medium transition-all duration-300">
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Toplam Randevu</p>
              <p className="text-2xl font-bold text-blue-600">
                {appointmentData.reduce((sum, data) => sum + data.count, 0)}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Ortalama Aylık</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round(appointmentData.reduce((sum, data) => sum + data.count, 0) / appointmentData.length)}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">En Yüksek Ay</p>
              <p className="text-2xl font-bold text-purple-600">
                {appointmentData.find(d => d.count === Math.max(...appointmentData.map(d => d.count)))?.month}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedApproval && (
        <Dialog open={showDetailModal} onOpenChange={(open) => { if (!open) setShowDetailModal(false); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Onay Talebi Detayı</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><b>İsim:</b> {selectedApproval.name}</div>
              <div><b>Rol:</b> {selectedApproval.role}</div>
              <div><b>Durum:</b> Beklemede</div>
              <div><b>Tarih:</b> {selectedApproval.date} - {selectedApproval.time}</div>
              
              {selectedApproval.description && (
                <div>
                  <b>Talep Açıklaması:</b>
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedApproval.description}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => handleApprove(selectedApproval)} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Onayla
              </Button>
              <Button 
                onClick={() => handleReject(selectedApproval)} 
                variant="outline" 
                className="flex-1 !bg-red-600 !text-white !border-red-600"
              >
                <X className="w-4 h-4 mr-2" />
                Reddet
              </Button>
            </div>
            
            <Button 
              onClick={() => setShowDetailModal(false)} 
              variant="outline" 
              className="w-full mt-2 !bg-black !text-white"
            >
              Kapat
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Filtreler Modal */}
      {showFiltersModal && (
        <Dialog open={showFiltersModal} onOpenChange={(open) => { if (!open) setShowFiltersModal(false); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Filtreler</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanıcı Rolü
                </label>
                <select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-55 p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">Tüm Roller</option>
                  <option value="Doktor">Doktor</option>
                  <option value="Hasta">Hasta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih Aralığı
                </label>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-55 p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">Tüm Tarihler</option>
                  <option value="today">Bugün</option>
                  <option value="week">Bu Hafta</option>
                  <option value="month">Bu Ay</option>
                  <option value="last7days">Son 7 Gün</option>
                  <option value="last30days">Son 30 Gün</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleApplyFilters} 
                className="flex-1 !bg-black !text-white"
              >
                Filtreleri Uygula
              </Button>
              <Button 
                onClick={handleClearFilters} 
                className="flex-1 !bg-black !text-white"
              >
                Temizle
              </Button>
              <Button 
                onClick={() => setShowFiltersModal(false)} 
                className="flex-1 !bg-black !text-white"
              >
                Kapat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminDashboard;

