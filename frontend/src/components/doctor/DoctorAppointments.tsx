import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Calendar, 
  Clock, 
  Users, 
  Filter, 
  Eye, 
  Play, 
  FileText,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from 'axios';

interface Appointment {
  id: number;
  patientName: string;
  patientAge: number;
  specialty: string;
  date: string;
  time: string;
  type: 'online' | 'face_to_face';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  symptoms: string;
}

const DoctorAppointments: React.FC = () => {
  const [filter, setFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const doctorId = userData?.user_id;
    if (doctorId) {
      axios.get(`http://localhost:3005/api/doctor/appointments/${doctorId}`)
        .then(res => {
          const mapped = res.data.map((item: any) => {
            const dateObj = new Date(item.datetime);
            return {
              id: item.id,
              patientName: item.patientname || item.patientName,
              patientAge: item.patientAge,
              specialty: item.specialty,
              date: dateObj.toLocaleDateString('tr-TR'),
              time: dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
              type: item.type === 'face_to_face' ? 'face_to_face' : 'online',
              status: item.status,
            };
          });
          setAppointments(mapped);
        });
    }
  }, []);

  const isCurrentAppointment = (appointment: Appointment) => {
    const [day, month, year] = appointment.date.split('.');
    const [hour, minute] = appointment.time.split(':');
    const appointmentDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    const now = new Date();
    const diff = (appointmentDate.getTime() - now.getTime()) / 60000;
    return diff <= 10 && diff >= -30;
  };

  const filterOptions = [
    { value: 'today', label: 'Bugün' },
    { value: 'tomorrow', label: 'Yarın' },
    { value: 'this_week', label: 'Bu Hafta' },
    { value: 'this_month', label: 'Bu Ay' },
    { value: 'custom', label: 'Tarih Aralığı Seç' }
  ];

  const quickActions = [
    { value: 'online', label: 'Online Randevular' },
    { value: 'face_to_face', label: 'Yüz Yüze Randevular' },
    { value: 'confirmed', label: 'Onaylanmış Randevular' },
    { value: 'pending', label: 'Bekleyen Randevular' }
  ];

  const handleStartAppointment = (appointmentId: number) => {
    // Online randevu başlatma işlemi
    console.log('Randevu başlatılıyor:', appointmentId);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    if (newFilter !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleQuickActionToggle = (action: string) => {
    setActiveFilters(prev => 
      prev.includes(action) 
        ? prev.filter(f => f !== action)
        : [...prev, action]
    );
  };

  const clearAllFilters = () => {
    setFilter('today');
    setStartDate('');
    setEndDate('');
    setActiveFilters([]);
  };

  const getActiveFiltersText = () => {
    return 'Filtreler';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  // Filtreleme fonksiyonu
  const getFilteredAppointments = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      
      // Tarih filtresi
      let dateFilter = true;
      switch (filter) {
        case 'today':
          dateFilter = appointmentDate.toDateString() === today.toDateString();
          break;
        case 'tomorrow':
          dateFilter = appointmentDate.toDateString() === tomorrow.toDateString();
          break;
        case 'this_week':
          dateFilter = appointmentDate >= startOfWeek && appointmentDate <= today;
          break;
        case 'this_month':
          dateFilter = appointmentDate >= startOfMonth && appointmentDate <= today;
          break;
        case 'custom':
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            dateFilter = appointmentDate >= start && appointmentDate <= end;
          }
          break;
        default:
          dateFilter = true;
      }

      // Hızlı işlem filtreleri
      let actionFilter = true;
      if (activeFilters.includes('online')) {
        actionFilter = actionFilter && appointment.type === 'online';
      }
      if (activeFilters.includes('face_to_face')) {
        actionFilter = actionFilter && appointment.type === 'face_to_face';
      }
      if (activeFilters.includes('confirmed')) {
        actionFilter = actionFilter && appointment.status === 'confirmed';
      }
      if (activeFilters.includes('pending')) {
        actionFilter = actionFilter && appointment.status === 'pending';
      }

      return dateFilter && actionFilter;
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Randevu Yönetimi</h1>
        <p className="text-muted-foreground">Hasta randevularınızı yönetin ve takip edin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Taraf - Yaklaşan Randevular */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Yaklaşan Randevular</h2>
              <div className="flex items-center gap-3">
                <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <span>{getActiveFiltersText()}</span>
                      {(filter !== 'today' || activeFilters.length > 0) && (
                        <Badge variant="secondary" className="ml-1">
                          {activeFilters.length + (filter !== 'today' ? 1 : 0)}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Filtreler</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Tarih Filtreleri */}
                      <div>
                        <h3 className="font-medium mb-3">Tarih Aralığı</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {filterOptions.map(option => (
                            <Button
                              key={option.value}
                              variant={filter === option.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleFilterChange(option.value)}
                              className="justify-start"
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                        {filter === 'custom' && (
                          <div className="mt-3 space-y-2">
                            <Input 
                              type="date" 
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              placeholder="Başlangıç"
                            />
                            <Input 
                              type="date" 
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              placeholder="Bitiş"
                            />
                          </div>
                        )}
                      </div>

                      {/* Hızlı İşlemler */}
                      <div>
                        <h3 className="font-medium mb-3">Hızlı İşlemler</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {quickActions.map(action => (
                            <Button
                              key={action.value}
                              variant={activeFilters.includes(action.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleQuickActionToggle(action.value)}
                              className="justify-start"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Filtreleri Kaldır */}
                      {(filter !== 'today' || activeFilters.length > 0) && (
                        <div className="pt-4 border-t">
                          <Button 
                            variant="outline"
                            onClick={clearAllFilters}
                            className="w-full"
                          >
                            Tüm Filtreleri Kaldır
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-4">
              {appointments
                .filter(app => {
                  // appointment.date şu anda 'DD.MM.YYYY' formatında, bunu 'YYYY-MM-DD' formatına çevir
                  const [day, month, year] = app.date.split('.');
                  const appointmentISO = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                  const todayISO = new Date().toISOString().split('T')[0];
                  return appointmentISO >= todayISO;
                })
                .map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-sm text-gray-600">{appointment.patientAge} yaş • {appointment.specialty}</p>
                      <p className="text-xs text-gray-500">{appointment.date} - {appointment.time} • {appointment.type === 'online' ? 'Online' : 'Yüz Yüze'}</p>
                      <p className="text-xs text-gray-500">Şikayet: {appointment.symptoms}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrentAppointment(appointment) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* Randevuyu başlat işlemi */}}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Randevuyu Başlat
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Detay
                      </Button>
                    </div>
                  </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sağ Taraf - Şu Anki Randevu */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Şu Anki Randevu</h2>
            
            {appointments.find(app => isCurrentAppointment(app)) ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {appointments.find(app => isCurrentAppointment(app))?.time}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {appointments.find(app => isCurrentAppointment(app))?.date}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Hasta</Label>
                    <p className="font-medium">{appointments.find(app => isCurrentAppointment(app))?.patientName}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Yaş</Label>
                    <p>{appointments.find(app => isCurrentAppointment(app))?.patientAge} yaş</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Uzmanlık</Label>
                    <p>{appointments.find(app => isCurrentAppointment(app))?.specialty}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Randevu Türü</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={appointments.find(app => isCurrentAppointment(app))?.type === 'online' ? 'secondary' : 'outline'}>
                        {appointments.find(app => isCurrentAppointment(app))?.type === 'online' ? 'Online' : 'Yüz Yüze'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Şikayet</Label>
                    <p className="text-sm">{appointments.find(app => isCurrentAppointment(app))?.symptoms}</p>
                  </div>
                </div>

                {appointments.find(app => isCurrentAppointment(app))?.type === 'online' && (
                  <Button 
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50"
                    onClick={() => handleStartAppointment(appointments.find(app => isCurrentAppointment(app))?.id || 0)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Online Randevuyu Başlat
                  </Button>
                )}
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Randevu Detayı
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <FileText className="w-4 h-4 mr-1" />
                    Hasta Geçmişi
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Şu anda aktif randevu yok</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments; 