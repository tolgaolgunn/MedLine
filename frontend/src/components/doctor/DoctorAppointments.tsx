import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
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

// Interface for appointment data structure
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
  // State management for filters and UI
  const [filter, setFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // State for appointment details and modals
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // State for exit confirmation and unsaved changes
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Temporary filters state for modal
  const [tempFilters, setTempFilters] = useState({
    filter: 'today',
    startDate: '',
    endDate: '',
    activeFilters: [] as string[]
  });

  // Fetch appointments from API on component mount
  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const doctorId = userData?.user_id;
    
    if (doctorId) {
      axios.get(`http://localhost:3005/api/doctor/appointments/${doctorId}`)
        .then(res => {
          // Map API response to appointment objects
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

  // Synchronize tempFilters with actual filters
  useEffect(() => {
    setTempFilters({
      filter: filter,
      startDate: startDate,
      endDate: endDate,
      activeFilters: activeFilters
    });
  }, [filter, startDate, endDate, activeFilters]);

  // Check if appointment is currently active (within 30 minutes)
  const isCurrentAppointment = (appointment: Appointment) => {
    const [day, month, year] = appointment.date.split('.');
    const [hour, minute] = appointment.time.split(':');
    const appointmentDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    const now = new Date();
    const diff = (appointmentDate.getTime() - now.getTime()) / 60000;
    return diff <= 10 && diff >= -30;
  };

  // Filter options for date range selection
  const filterOptions = [
    { value: 'today', label: 'Bugün' },
    { value: 'tomorrow', label: 'Yarın' },
    { value: 'this_week', label: 'Bu Hafta' },
    { value: 'this_month', label: 'Bu Ay' },
    { value: 'custom', label: 'Tarih Aralığı Seç' }
  ];

  // Quick action filter options
  const quickActions = [
    { value: 'online', label: 'Online Randevular' },
    { value: 'face_to_face', label: 'Yüz Yüze Randevular' },
    { value: 'confirmed', label: 'Onaylanmış Randevular' },
    { value: 'pending', label: 'Bekleyen Randevular' }
  ];

  // Handle starting an online appointment
  const handleStartAppointment = (appointmentId: number) => {
    console.log('Randevu başlatılıyor:', appointmentId);
  };

  // Handle filter type changes in modal
  const handleFilterChange = (newFilter: string) => {
    setTempFilters(prev => ({
      ...prev,
      filter: newFilter,
      startDate: newFilter !== 'custom' ? '' : prev.startDate,
      endDate: newFilter !== 'custom' ? '' : prev.endDate
    }));
    setHasUnsavedChanges(true);
  };

  // Handle quick action filter toggles
  const handleQuickActionToggle = (action: string) => {
    setTempFilters(prev => ({
      ...prev,
      activeFilters: prev.activeFilters.includes(action) 
        ? prev.activeFilters.filter(f => f !== action)
        : [...prev.activeFilters, action]
    }));
    setHasUnsavedChanges(true);
  };

  // Apply filters and close modal
  const applyFilters = () => {
    setFilter(tempFilters.filter);
    setStartDate(tempFilters.startDate);
    setEndDate(tempFilters.endDate);
    setActiveFilters(tempFilters.activeFilters);
    setHasUnsavedChanges(false);
    setIsFilterModalOpen(false);
  };

  // Clear all filters in modal
  const clearAllFilters = () => {
    setTempFilters({
      filter: 'today',
      startDate: '',
      endDate: '',
      activeFilters: []
    });
    setHasUnsavedChanges(true);
  };

  // Handle filter modal close with unsaved changes check
  const handleCloseFilterModal = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      setIsFilterModalOpen(false);
    }
  };

  // Confirm exit without saving filters
  const confirmExit = () => {
    setShowExitConfirm(false);
    setIsFilterModalOpen(false);
    setHasUnsavedChanges(false);
    // Revert temporary filters to actual filters
    setTempFilters({
      filter,
      startDate,
      endDate,
      activeFilters
    });
  };

  // Cancel exit confirmation
  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  // Get active filters display text
  const getActiveFiltersText = () => {
    return 'Filtreler';
  };

  // Open filter modal and sync temp filters
  const handleOpenFilterModal = () => {
    setTempFilters({
      filter: filter,
      startDate: startDate,
      endDate: endDate,
      activeFilters: activeFilters
    });
    setHasUnsavedChanges(false);
    setIsFilterModalOpen(true);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  // Filter appointments based on selected criteria
  const getFilteredAppointments = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return appointments.filter(appointment => {
      // Parse appointment date from DD.MM.YYYY format
      const [day, month, year] = appointment.date.split('.');
      const appointmentDate = new Date(Number(year), Number(month) - 1, Number(day));
      
      // Apply date filter based on selected option
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

      // Apply quick action filters
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
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Randevu Yönetimi</h1>
        <p className="text-muted-foreground">Hasta randevularınızı yönetin ve takip edin.</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments Section */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {/* Section Header with Filters */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Yaklaşan Randevular</h2>
              <div className="flex items-center gap-3">
                {/* Filter Button */}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleOpenFilterModal}
                >
                  <Filter className="w-4 h-4" />
                  <span>{getActiveFiltersText()}</span>
                  {(filter !== 'today' || activeFilters.length > 0) && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilters.length + (filter !== 'today' ? 1 : 0)}
                    </Badge>
                  )}
                </Button>

                {/* Filter Modal */}
                <Dialog open={isFilterModalOpen} onOpenChange={handleCloseFilterModal}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Filtreler</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Date Range Filters */}
                      <div>
                        <h3 className="font-medium mb-3">Tarih Aralığı</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {filterOptions.map(option => (
                            <Button
                              key={option.value}
                              variant={tempFilters.filter === option.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleFilterChange(option.value)}
                              className="justify-start"
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                        {/* Custom Date Range Inputs */}
                        {tempFilters.filter === 'custom' && (
                          <div className="mt-3 space-y-2">
                            <Input 
                              type="date" 
                              value={tempFilters.startDate}
                              onChange={(e) => {
                                setTempFilters(prev => ({ ...prev, startDate: e.target.value }));
                                setHasUnsavedChanges(true);
                              }}
                              placeholder="Başlangıç"
                            />
                            <Input 
                              type="date" 
                              value={tempFilters.endDate}
                              onChange={(e) => {
                                setTempFilters(prev => ({ ...prev, endDate: e.target.value }));
                                setHasUnsavedChanges(true);
                              }}
                              placeholder="Bitiş"
                            />
                          </div>
                        )}
                      </div>

                      {/* Quick Action Filters */}
                      <div>
                        <h3 className="font-medium mb-3">Hızlı İşlemler</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {quickActions.map(action => (
                            <Button
                              key={action.value}
                              variant={tempFilters.activeFilters.includes(action.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleQuickActionToggle(action.value)}
                              className="justify-start"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="pt-4 border-t space-y-2">
                        <Button 
                          onClick={applyFilters}
                          disabled={!hasUnsavedChanges}
                          className="w-full"
                        >
                          Filtreleri Uygula
                        </Button>
                        
                        {(tempFilters.filter !== 'today' || tempFilters.activeFilters.length > 0) && (
                          <Button 
                            variant="outline"
                            onClick={clearAllFilters}
                            className="w-full"
                          >
                           Filtreleri Kaldır
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Appointments List */}
            <div className="space-y-4">
              {getFilteredAppointments().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Seçilen filtrelere uygun randevu bulunamadı.</p>
                </div>
              ) : (
                getFilteredAppointments()
                  .map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                      {/* Appointment Info */}
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-gray-600">{appointment.patientAge} yaş • {appointment.specialty}</p>
                        <p className="text-xs text-gray-500">{appointment.date} - {appointment.time} • {appointment.type === 'online' ? 'Online' : 'Yüz Yüze'}</p>
                        <p className="text-xs text-gray-500">Şikayet: {appointment.symptoms}</p>
                      </div>
                      {/* Action Buttons */}
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
          </Card>
        </div>

        {/* Current Appointment Section */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Şu Anki Randevu</h2>
            
            {appointments.find(app => isCurrentAppointment(app)) ? (
              <div className="space-y-4">
                {/* Time Display */}
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {appointments.find(app => isCurrentAppointment(app))?.time}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {appointments.find(app => isCurrentAppointment(app))?.date}
                  </div>
                </div>

                {/* Patient Information */}
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

                {/* Start Online Appointment Button */}
                {appointments.find(app => isCurrentAppointment(app))?.type === 'online' && (
                  <Button 
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50"
                    onClick={() => {
                      const current = appointments.find(app => isCurrentAppointment(app));
                      if (current) handleStartAppointment(current.id);
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Online Randevuyu Başlat
                  </Button>
                )}

                {/* Action Buttons */}
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

      {/* Appointment Detail Modal */}
      {showDetail && selectedAppointment && (
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Randevu Detayı</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div><b>Hasta:</b> {selectedAppointment.patientName}</div>
              <div><b>Tarih:</b> {selectedAppointment.date}</div>
              <div><b>Saat:</b> {selectedAppointment.time}</div>
              <div><b>Tip:</b> {selectedAppointment.type === 'online' ? 'Online' : 'Yüz Yüze'}</div>
              <div><b>Branş:</b> {selectedAppointment.specialty}</div>
              <div><b>Durum:</b> {selectedAppointment.status === 'confirmed' ? 'Onaylandı' : selectedAppointment.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}</div>
            </div>
            <Button onClick={() => setShowDetail(false)}>Kapat</Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Exit Confirmation Modal */}
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
              Filtreleriniz kaydedilmedi. Çıkmak istediğinizden emin misiniz?
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={cancelExit}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              Çık
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorAppointments; 