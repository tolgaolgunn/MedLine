import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { toast } from "react-toastify";
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { PageHeader } from '../ui/PageHeader';
import { 
  Calendar as CalendarIcon, 
  Activity, 
  Pill, 
  AlertCircle,
  User,
  Bell,
  History,
  Users,
  Clock,
  Play
} from 'lucide-react';
import axios from '../../lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';
type AppointmentType = 'online' | 'face_to_face';

interface Appointment {
  id: number;
  patientName: string;
  patientAge: number;
  specialty: string;
  date: string;
  time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  symptoms: string;
  isCurrent?: boolean;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [pendingAppointments, setPendingAppointments] = useState<number>(0);
  const [todayAppointmentCount, setTodayAppointmentCount] = useState<number>(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Array<{text: string, timestamp: number}>>([]);
  const [searchFilter, setSearchFilter] = useState<string>('all');

  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 'P001',
      name: 'Ahmet Yılmaz',
      age: 45,
      gender: 'Erkek',
      lastVisit: '2024-01-10',
      status: 'active'
    },
    {
      id: 'P002',
      name: 'Fatma Demir',
      age: 32,
      gender: 'Kadın',
      lastVisit: '2024-01-08',
      status: 'active'
    },
    {
      id: 'P003',
      name: 'Mehmet Kaya',
      age: 58,
      gender: 'Erkek',
      lastVisit: '2024-01-15',
      status: 'active'
    }
  ]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Kullanıcı bilgisini localStorage'dan al
  const [userName, setUserName] = useState('');
  const [doctorId, setDoctorId] = useState<string>('');

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUserName(userData.full_name || userData.name || userData.email || '');
        setDoctorId(userData.user_id || userData.id || '');
      } catch (error) {
        console.error('Kullanıcı bilgisi çözümlenirken hata oluştu:', error);
        toast.error('Kullanıcı bilgisi yüklenirken hata oluştu');
      }
    }
  }, []);

  useEffect(() => {
    const fetchDoctorStats = async () => {
      if (!doctorId) {
        console.log('No doctorId available');
        return;
      }

      console.log('Fetching stats for doctorId:', doctorId);
      console.log('Auth Token:', localStorage.getItem('token'));

      try {
        const [patientsRes, pendingRes, todayRes] = await Promise.all([
          axios.get(`/doctor/patients/count/${doctorId}`),
          axios.get(`/doctor/appointments/pending/count/${doctorId}`),
          axios.get(`/doctor/appointments/today/count/${doctorId}`)
        ]);

        console.log('API Responses:', {
          patients: patientsRes.data,
          pending: pendingRes.data,
          today: todayRes.data
        });

        setTotalPatients(patientsRes.data.count || 0);
        setPendingAppointments(pendingRes.data.count || 0);
        setTodayAppointmentCount(todayRes.data.count || 0);
      } catch (error: any) {
        console.error('API Error Details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        const errorMessage = error.response?.data?.message || 'İstatistikler yüklenirken hata oluştu';
        toast.error(errorMessage);
      }
    };

    fetchDoctorStats();
  }, [doctorId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800'; 
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtreleme fonksiyonu
  const getFilteredAppointments = () => {
    return appointments.filter(appointment => {
      // Status filtresi
      if (filterStatus !== 'all') {
        if (filterStatus === 'scheduled' && appointment.status !== 'confirmed') return false;
        if (filterStatus === 'completed' && appointment.status !== 'completed') return false;
        if (filterStatus === 'cancelled' && appointment.status !== 'cancelled') return false;
        if (filterStatus === 'pending' && appointment.status !== 'pending') return false;
      }
     
     // Tip filtresi
     if (filterType !== 'all' && appointment.type !== filterType) return false;
     
     // Uzmanlık filtresi
     if (filterSpecialty !== 'all' && appointment.specialty !== filterSpecialty) return false;
     
     return true;
   });
  };

  // Filtre değişikliklerini takip et
  const handleFilterChange = (type: string, value: string) => {
    if (type === 'status') setFilterStatus(value);
    if (type === 'type') setFilterType(value);
    if (type === 'specialty') setFilterSpecialty(value);
  };

  // Çıkış onayı fonksiyonları
  const handleCloseDetail = () => {
    setShowDetail(false);
  };

  // Yaklaşan (bugün ve sonrası) randevuları al
  const todayISO = new Date().toISOString().split('T')[0];
  const upcomingAppointments = getFilteredAppointments().filter(appointment => {
    // appointment.date şu anda 'DD.MM.YYYY' formatında, bunu 'YYYY-MM-DD' formatına çevir
    const [day, month, year] = appointment.date.split('.');
    const appointmentISO = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return appointmentISO >= todayISO;
  });

  // Boş durum mesajını belirle
  const getEmptyMessage = () => {
    if (filterStatus === 'completed') {
      return 'Tamamlanan randevu bulunmuyor';
    } else if (filterStatus === 'cancelled') {
      return 'İptal edilen randevu bulunmuyor';
    } else if (filterStatus === 'pending') {
      return 'Beklemede olan randevu bulunmuyor';
    } else if (filterStatus === 'scheduled') {
      return 'Onaylanan randevu bulunmuyor';
    } else if (filterType === 'online') {
      return 'Online randevu bulunmuyor';
    } else if (filterType === 'face_to_face') {
      return 'Yüz yüze randevu bulunmuyor';
    } else {
      return 'Bu tarih için randevu bulunmuyor';
    }
  };

  const isCurrentAppointment = (appointment: Appointment) => {
    // appointment.date: 'DD.MM.YYYY'
    // appointment.time: 'HH:mm'
    const [day, month, year] = appointment.date.split('.');
    const [hour, minute] = appointment.time.split(':');
    const appointmentDate = new Date(
      Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)
    );
    const now = new Date();

    // Randevu zamanı ile şimdi arasındaki fark (ör: 10 dakika öncesi ve sonrası başlatılabilir)
    const diff = (appointmentDate.getTime() - now.getTime()) / 60000;
    return diff <= 10 && diff >= -30; // 10 dakika sonrası ve 30 dakika öncesi arası başlatılabilir
  };

  // Geçmiş aramaları yükle
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches_doctor');
    if (savedSearches) {
      try {
        const parsed = JSON.parse(savedSearches);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          const converted = parsed.map((text: string) => ({ text, timestamp: Date.now() }));
          setRecentSearches(converted);
        } else {
          setRecentSearches(parsed);
        }
      } catch (error) {
        console.error('Error parsing recent searches:', error);
        setRecentSearches([]);
      }
    }
  }, []);

  // Toplam hasta sayısını veritabanından çek
  useEffect(() => {
    if (doctorId) {
      const fetchTotalPatients = async () => {
        try {
          const response = await axios.get(`http://localhost:3005/api/doctor/patients/count/${doctorId}`);
          if (response.data && typeof response.data.count === 'number') {
            setTotalPatients(response.data.count);
          }
        } catch (error) {
          console.error('Hasta sayısı çekilirken hata oluştu:', error);
        }
      };
      
      fetchTotalPatients();
    }
  }, [doctorId]);

  // Bekleyen randevu sayısını veritabanından çek
  useEffect(() => {
    if (doctorId) {
      const fetchPendingAppointments = async () => {
        try {
          const response = await axios.get(`http://localhost:3005/api/doctor/appointments/pending/count/${doctorId}`);
          if (response.data && typeof response.data.count === 'number') {
            setPendingAppointments(response.data.count);
          }
        } catch (error) {
          console.error('Bekleyen randevu sayısı çekilirken hata oluştu:', error);
        }
      };
      
      fetchPendingAppointments();
    }
  }, [doctorId]);

  // Bugünkü randevu sayısını veritabanından çek
  useEffect(() => {
    if (doctorId) {
      const fetchTodayAppointments = async () => {
        try {
          const response = await axios.get(`http://localhost:3005/api/doctor/appointments/today/count/${doctorId}`);
          if (response.data && typeof response.data.count === 'number') {
            setTodayAppointmentCount(response.data.count);
          }
        } catch (error) {
          console.error('Bugünkü randevu sayısı çekilirken hata oluştu:', error);
        }
      };
      
      fetchTodayAppointments();
    }
  }, [doctorId]);

  // Doktora ait randevuları backend'den çek
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!doctorId) return;
      
      try {
        const response = await axios.get(`http://localhost:3005/api/doctor/appointments/${doctorId}`);
        
        const mapped = response.data.map((item: any) => {
          const dateObj = new Date(item.datetime);
          
          return {
            id: item.appointment_id,
            patientName: item.patientName,
            patientAge: item.patientAge || 0,
            specialty: item.specialty,
            date: dateObj.toLocaleDateString('tr-TR'), // örnek: 29.07.2025
            time: dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), // örnek: 11:00
            type: item.type === 'face_to_face' ? 'face_to_face' : 'online',
            status: item.status,
            symptoms: item.symptoms,
          };
        });
    
        setAppointments(mapped);
      } catch (error) {
        console.error('Randevular çekilirken hata oluştu:', error);
      }
    };
    
    fetchAppointments();
  }, [doctorId]);

  const handleUpdateStatus = async (appointmentId: number, newStatus: 'confirmed' | 'cancelled' | 'completed' | 'pending') => {
    try {
      await axios.patch(`http://localhost:3005/api/doctor/appointments/${appointmentId}/status`, { status: newStatus });
      // Güncel randevuları tekrar çek veya local state'i güncelle
      setAppointments(prev =>
        prev.map(app =>
          app.id === appointmentId ? { ...app, status: newStatus } : app
        )
      );
      toast.success('Randevu durumu güncellendi!');
    } catch (e) {
      toast.error('Durum güncellenemedi!');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    // Geçersiz tarih kontrolü
    if (isNaN(diffInMs) || diffInMs < 0) {
      return 'Az önce';
    }
    
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} saat önce`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} gün önce`;
    }
  };

  // Filtrelenmiş aramaları hesapla
  const getFilteredSearches = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate());
    const yearAgo = new Date(today.getFullYear() - 1, now.getMonth(), now.getDate());

    return recentSearches.filter(search => {
      const searchDate = new Date(search.timestamp);
      
      switch (searchFilter) {
        case 'today':
          return searchDate >= today;
        case 'yesterday':
          return searchDate >= yesterday && searchDate < today;
        case 'week':
          return searchDate >= weekAgo;
        case 'month':
          return searchDate >= monthAgo;
        case 'year':
          return searchDate >= yearAgo;
        default:
          return true;
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Başlık */}
      <PageHeader 
        title="Doktor Paneli"
        subtitle={`Hoş geldiniz, ${userName}. Sağlıklı günler dileriz.`}
        showBackButton={false}
      />
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Hasta</p>
                <p className="text-2xl font-bold">{totalPatients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bugünkü Randevular</p>
                <p className="text-2xl font-bold">{todayAppointmentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bekleyen</p>
                <p className="text-2xl font-bold">{pendingAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reçeteler</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yaklaşan Randevular */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Yaklaşan Randevular</CardTitle>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                    <SelectContent>
                     <SelectItem value="all">Durumlar</SelectItem>
                     <SelectItem value="scheduled">Onaylandı</SelectItem>
                     <SelectItem value="completed">Tamamlandı</SelectItem>
                     <SelectItem value="cancelled">İptal Edildi</SelectItem>
                     <SelectItem value="pending">Beklemede</SelectItem>
                   </SelectContent>
                </Select>
                
                <Select value={filterType} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Randevu Tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Randevular</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="face_to_face">Yüz Yüze</SelectItem>
                  </SelectContent>
                </Select>

                
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{getEmptyMessage()}</p>
                </div>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-gray-600">{appointment.time} - {appointment.type === 'online' ? 'Online' : 'Yüz Yüze'}</p>
                        <p className="text-xs text-gray-500">{appointment.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(appointment.status)}>
                       {appointment.status === 'confirmed' ? 'Onaylandı' :
                       appointment.status === 'completed' ? 'Tamamlandı' : 
                       appointment.status === 'cancelled' ? 'İptal Edildi' : 'Beklemede'}
                    </Badge>
                                             {appointment.status === 'pending' && (
                         <>
                          <button
                             className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-4 rounded-md shadow-sm transition-all duration-200 text-sm"
                             onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                             >
                             Onayla
                             </button>
                             <button
                             onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                             className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-4 rounded-md shadow-sm transition-all duration-200 text-sm"
                             >
                             İptal Et
                             </button>
                         </>
                       )}
                       
                       {appointment.status === 'confirmed' && (
                         <button
                           className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded-md shadow-sm transition-all duration-200 text-sm"
                           onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                         >
                           Tamamlandı
                         </button>
                       )}
                         {isCurrentAppointment(appointment) && appointment.status !== 'cancelled' && (
                          <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* Randevuyu başlat işlemi */}}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Randevuyu Başlat
                        </Button>
                       )}
                      <button
                            type="button"
                            onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowDetail(true);
                            }}
                            className="border border-gray-400 text-gray-700 hover:border-blue-500 hover:text-blue-600 font-medium py-1 px-4 rounded-md transition-all duration-200 text-sm"
                            >
                            Detay
                            </button>

                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hızlı İşlemler */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-green-50 hover:border-green-300 transition-colors"
                onClick={() => {
                  navigate('/doctor/patients', { state: { from: '/doctor/dashboard' } });
                }}
              >
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Hasta Yönetimi</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                onClick={() => {
                  navigate('/doctor/prescriptions', { state: { from: '/doctor/dashboard' } });
                }}
              >
                <Pill className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Reçete Yönetimi</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                onClick={() => setShowHistoryModal(true)}
              >
                <History className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">Geçmiş Aramalar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showDetail && selectedAppointment && (
        <Dialog open={showDetail} onOpenChange={handleCloseDetail}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Randevu Detayı</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><b>Hasta:</b> {selectedAppointment.patientName}</div>
                <div><b>Yaş:</b> {selectedAppointment.patientAge}</div>
                <div><b>Tarih:</b> {selectedAppointment.date}</div>
                <div><b>Saat:</b> {selectedAppointment.time}</div>
                <div><b>Tip:</b> {selectedAppointment.type === 'online' ? 'Online' : 'Yüz Yüze'}</div>
                <div><b>Branş:</b> {selectedAppointment.specialty}</div>
                <div className="col-span-2"><b>Durum:</b> 
                  <Badge className={`ml-2 ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status === 'confirmed' ? 'Onaylandı' :
                     selectedAppointment.status === 'completed' ? 'Tamamlandı' :
                     selectedAppointment.status === 'cancelled' ? 'İptal Edildi' : 'Beklemede'}
                  </Badge>
                </div>
                {selectedAppointment.symptoms && (
                  <div className="col-span-2">
                    <b>Semptomlar:</b> {selectedAppointment.symptoms}
                  </div>
                )}
              </div>
              
            {/* Status Değiştirme Butonları */}
               <div className="border-t pt-4">
                                   <div className="flex items-center gap-4">
                    <h4 className="font-semibold text-gray-900 whitespace-nowrap">Durum Değiştir:</h4>
                   <div className="flex gap-2">
                     {selectedAppointment.status === 'pending' && (
                       <>
                         <Button
                           size="sm"
                           className="bg-green-500 hover:bg-green-600 text-white"
                           onClick={() => {
                             handleUpdateStatus(selectedAppointment.id, 'confirmed');
                             setShowDetail(false);
                           }}
                         >
                           Onayla
                         </Button>
                         <Button
                           size="sm"
                           variant="destructive"
                           onClick={() => {
                             handleUpdateStatus(selectedAppointment.id, 'cancelled');
                             setShowDetail(false);
                           }}
                         >
                           İptal Et
                         </Button>
                       </>
                     )}
                     
                     {selectedAppointment.status === 'confirmed' && (
                       <>
                         <Button
                           size="sm"
                           className="bg-blue-500 hover:bg-blue-600 text-white"
                           onClick={() => {
                             handleUpdateStatus(selectedAppointment.id, 'completed');
                             setShowDetail(false);
                           }}
                         >
                           Tamamlandı
                         </Button>
                         <Button
                           size="sm"
                           variant="destructive"
                           onClick={() => {
                             handleUpdateStatus(selectedAppointment.id, 'cancelled');
                             setShowDetail(false);
                           }}
                         >
                           İptal Et
                         </Button>
                       </>
                     )}
                     
                     {selectedAppointment.status === 'cancelled' && (
                       <>
                         <Button
                           size="sm"
                           className="bg-green-500 hover:bg-green-600 text-white"
                           onClick={() => {
                             handleUpdateStatus(selectedAppointment.id, 'confirmed');
                             setShowDetail(false);
                           }}
                         >
                           Onayla
                         </Button>
                         <Button
                           size="sm"
                           className="bg-yellow-500 hover:bg-yellow-600 text-white"
                           onClick={() => {
                             handleUpdateStatus(selectedAppointment.id, 'pending');
                             setShowDetail(false);
                           }}
                         >
                           Bekleniyor
                         </Button>
                       </>
                     )}
                     
                                           {selectedAppointment.status === 'completed' && (
                        <div className="text-sm text-gray-500 justify-center items-center mt-2">
                          Bu randevu tamamlanmıştır ve durumu değiştirilemez.
                        </div>
                      )}
                   </div>
                 </div>
               </div>
            </div>
             <DialogFooter>
               <Button 
                 variant="outline" 
                 onClick={handleCloseDetail}
                 className="border-2 border-gray-300 hover:border-gray-400">
                 Kapat
               </Button>
             </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Geçmiş Aramalar Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Geçmiş Aramalar</DialogTitle>
          </DialogHeader>
          
          {/* Filtre Butonları */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={searchFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchFilter('all')}
            >
              Tümü
            </Button>
            <Button
              variant={searchFilter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchFilter('today')}
            >
              Bugün
            </Button>
            <Button
              variant={searchFilter === 'yesterday' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchFilter('yesterday')}
            >
              Dün
            </Button>
            <Button
              variant={searchFilter === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchFilter('week')}
            >
              Bu Hafta
            </Button>
            <Button
              variant={searchFilter === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchFilter('month')}
            >
              Bu Ay
            </Button>
            <Button
              variant={searchFilter === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchFilter('year')}
            >
              Bu Yıl
            </Button>
          </div>

          <div className="py-4">
            {getFilteredSearches().length > 0 ? (
              <div className="space-y-3">
                {getFilteredSearches().map((search, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{search.text}</div>
                        <div className="text-sm text-gray-500">{formatDate(search.timestamp)}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Arama yapmak için topbar'daki search fonksiyonunu tetikle
                        window.dispatchEvent(new CustomEvent('setSearchValue', { 
                          detail: { value: search.text } 
                        }));
                        setShowHistoryModal(false);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Tekrar Ara
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{searchFilter === 'all' ? 'Henüz arama geçmişi yok' : 'Bu filtrede arama bulunamadı'}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={() => {
                setRecentSearches([]);
                localStorage.removeItem('recentSearches_doctor');
                setShowHistoryModal(false);
              }}
              disabled={recentSearches.length === 0}
            >
              Aramaları Temizle
            </Button>
            <Button 
              variant="outline" 
              className="!border-2 !border-gray-300 !rounded-md"
              onClick={() => setShowHistoryModal(false)}
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Çıkış Onayı Modal */}
      <Dialog open={showExitConfirm} onOpenChange={(open) => {
        if (!open) {
          setShowExitConfirm(false);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Çıkış Onayı</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Filtreleriniz uygulanmamış. Çıkmak istediğinizden emin misiniz?
            </p>
          </div>
                     <DialogFooter className="flex gap-2">
             <Button variant="outline" onClick={() => setShowExitConfirm(false)}>
               İptal
             </Button>
             <Button variant="destructive" onClick={() => {
               setShowExitConfirm(false);
               setShowDetail(false);
             }}>
               Çık
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDashboard;