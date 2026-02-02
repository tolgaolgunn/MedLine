import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import StartAppointmentButton from './StartAppointmentButton';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PageHeader } from '../ui/PageHeader';
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
  appointment_id: number;
  patient_id: number;
  patientname: string; // Backend'den gelen property adı
  patientAge: string;
  specialty: string;
  date: string;
  time: string;
  datetime: string;
  type: 'online' | 'face_to_face';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
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
  
  // State for patient history modal
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [historyPatientId, setHistoryPatientId] = useState<number | null>(null);
  
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
  
  const token = localStorage.getItem('token');
  if (!doctorId) {
    console.error('Doktor ID bulunamadı');
    return;
  }
  if (!token) {
    console.error('Token bulunamadı');
    return;
  }

  if (doctorId) {
    axios.get(`http://localhost:3005/api/doctor/appointments/${doctorId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        console.log('API Yanıtı:', res.data);
        
        // API'den gelen veriyi işlerken yaşı tam sayıya yuvarla
const mapped = res.data.map((item: any) => {
  console.log('Hasta bilgisi:', {
    id: item.appointment_id,
    patientname: item.patientName,
    hasPatientname: !!item.patientname,
    rawData: item
  });
  
  const dateObj = new Date(item.datetime);
  return {
    id: item.appointment_id,
    appointment_id: item.appointment_id,
    patient_id: item.patient_id,
    patientname: item.patientName || 'İsimsiz Hasta',
    patientAge: Math.floor(parseFloat(item.patientage || item.patientAge || '0')), // Yaşı tam sayıya yuvarla
    specialty: item.specialty,
    date: dateObj.toLocaleDateString('tr-TR'),
    time: dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    datetime: item.datetime,
    type: item.type,
    status: item.status,
  };
});
        console.log('Map edilmiş veri:', mapped);
        setAppointments(mapped);
      })
      .catch(error => {
        console.error('API hatası:', error);
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
    // Tarih ve saat bilgilerini birleştir
    const [day, month, year] = appointment.date.split('.');
    const [hour, minute] = appointment.time.split(':');
    const appointmentDateTime = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    const now = new Date();
    const diff = (appointmentDateTime.getTime() - now.getTime()) / 60000; // dakika cinsinden fark
    
    // Randevu zamanından 30 dakika önce ve 10 dakika sonrasına kadar aktif say
    return diff >= -30 && diff <= 10;
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

  // Handle opening patient history
  const handleOpenPatientHistory = () => {
    const current = appointments.find(app => isCurrentAppointment(app));
    setHistoryPatientId(current?.patient_id ?? null);
    setShowPatientHistory(true);
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
      const appointmentDate = new Date(appointment.datetime);
      
      // Set today to start of day
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // End dates for comparisons
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      // Apply date filter based on selected option
      let dateFilter = true;
      switch (filter) {
        case 'today':
          dateFilter = appointmentDate >= today && appointmentDate <= endOfDay;
          break;
        case 'tomorrow':
          dateFilter = appointmentDate >= tomorrow && appointmentDate <= endOfTomorrow;
          break;
        case 'this_week':
          dateFilter = appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
          break;
        case 'this_month':
          dateFilter = appointmentDate >= startOfMonth && appointmentDate <= endOfMonth;
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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-full mx-auto overflow-x-hidden">
      {/* Page Header */}
      <PageHeader 
        title="Randevu Yönetimi"
        subtitle="Hasta randevularınızı yönetin ve takip edin."
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Upcoming Appointments Section */}
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6">
            {/* Section Header with Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <h2 className="text-lg sm:text-xl font-semibold">Randevular</h2>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Filter Button */}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 border-2 border-gray-300 shadow-sm text-xs sm:text-sm flex-1 sm:flex-initial"
                  onClick={handleOpenFilterModal}
                >
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{getActiveFiltersText()}</span>
                  <span className="sm:hidden">Filtre</span>
                  {(filter !== 'today' || activeFilters.length > 0) && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {activeFilters.length + (filter !== 'today' ? 1 : 0)} 
                    </Badge>
                  )}
                </Button>

                {/* Filter Modal */}
                <Dialog open={isFilterModalOpen} onOpenChange={handleCloseFilterModal}>
                  <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                              className="justify-start border-2 border-gray-300 shadow-sm"
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>

                        {/* Custom Date Range Inputs */}
                        {tempFilters.filter === 'custom' && (
                          <div className="mt-3 flex gap-2">
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
                              className="justify-start border-2 border-gray-300 shadow-sm"
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
                          className="w-full border-2 border-gray-300 shadow-sm"
                        >
                          Filtreleri Uygula
                        </Button>
                        
                        {(tempFilters.filter !== 'today' || tempFilters.activeFilters.length > 0) && (
                          <Button 
                            variant="outline"
                            onClick={clearAllFilters}
                            className="w-full border-2 border-gray-300 shadow-sm rounded-md"
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
            <div className="space-y-3 sm:space-y-4">
              {getFilteredAppointments().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Seçilen filtrelere uygun randevu bulunamadı.</p>
                </div>
              ) : (
                getFilteredAppointments()
                  .map((appointment) => (
                    <div key={appointment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors gap-3">
                      {/* Appointment Info */}
                      <div className="min-w-0 flex-1">
    <p className="font-medium text-sm sm:text-base truncate">
      {appointment.patientname || 'İsimsiz Hasta'}
    </p>
    <p className="text-xs sm:text-sm text-gray-600 truncate">
      {appointment.patientAge} yaş • {appointment.specialty}
    </p>
    <p className="text-xs text-gray-500 truncate">
      {appointment.date} - {appointment.time} • 
      {appointment.type === 'online' ? 'Online' : 'Yüz Yüze'}
    </p>
  </div>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowDetail(true);
                          }}
                          className="border border-gray-400 text-gray-700 hover:border-blue-500 hover:text-blue-600 font-medium py-1.5 px-3 sm:px-4 rounded-md transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
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
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Şu Anki Randevu</h2>
            
            {appointments.find(app => isCurrentAppointment(app)) ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Time Display */}
                <div className="text-center p-3 sm:p-4 bg-primary/10 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-primary mb-2">
                    {appointments.find(app => isCurrentAppointment(app))?.time}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {appointments.find(app => isCurrentAppointment(app))?.date}
                  </div>
                </div>

                {/* Patient Information */}
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Hasta</Label>
                    <p className="font-medium text-sm sm:text-base truncate">{appointments.find(app => isCurrentAppointment(app))?.patientname}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Yaş</Label>
                    <p className="text-sm sm:text-base">{appointments.find(app => isCurrentAppointment(app))?.patientAge} yaş</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Uzmanlık</Label>
                    <p className="text-sm sm:text-base truncate">{appointments.find(app => isCurrentAppointment(app))?.specialty}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Randevu Türü</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={appointments.find(app => isCurrentAppointment(app))?.type === 'online' ? 'secondary' : 'outline'} className="text-xs">
                        {appointments.find(app => isCurrentAppointment(app))?.type === 'online' ? 'Online' : 'Yüz Yüze'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Şikayet</Label>
                    <p className="text-xs sm:text-sm">Belirtilmemiş</p>
                  </div>
                </div>

                {/* Start Online Appointment Button */}
                {appointments.find(app => isCurrentAppointment(app))?.type === 'online' && (
  <StartAppointmentButton 
    appointments={appointments} 
    handleStartAppointment={handleStartAppointment}
    isCurrentAppointment={isCurrentAppointment}
  />
)}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedAppointment(appointments.find(app => isCurrentAppointment(app)) || null);
                            setShowDetail(true);
                          }}
                          className="flex-1 border-2 border-gray-300 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors text-xs sm:text-sm"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Randevu Detayı</span>
                        <span className="sm:hidden">Detay</span>
                        </Button>
                                     <Button 
                     variant="outline" 
                     className="flex-1 border-2 border-gray-300 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors text-xs sm:text-sm"
                     onClick={handleOpenPatientHistory}
                   >
                     <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                     <span className="hidden sm:inline">Hasta Geçmişi</span>
                     <span className="sm:hidden">Geçmiş</span>
                   </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Şu anda aktif randevu yok</p>
              </div>
            )}
          </Card>
        </div>
      </div>

             {/* Appointment Detail Modal */}
       {showDetail && selectedAppointment && (
         <Dialog open={showDetail} onOpenChange={setShowDetail}>
           <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle className="text-lg sm:text-xl">Randevu Detayı</DialogTitle>
             </DialogHeader>
             <div className="space-y-2 text-sm sm:text-base">
               <div className="break-words"><b>Hasta:</b> {selectedAppointment.patientname}</div>
               <div><b>Tarih:</b> {selectedAppointment.date}</div>
               <div><b>Saat:</b> {selectedAppointment.time}</div>
               <div><b>Tip:</b> {selectedAppointment.type === 'online' ? 'Online' : 'Yüz Yüze'}</div>
               <div className="break-words"><b>Branş:</b> {selectedAppointment.specialty}</div>
               <div><b>Durum:</b> {selectedAppointment.status === 'confirmed' ? 'Onaylandı' : selectedAppointment.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}</div>
             </div>
             <Button onClick={() => setShowDetail(false)} className="border-2 border-gray-300 shadow-sm text-xs sm:text-sm w-full sm:w-auto">Kapat</Button>
           </DialogContent>
         </Dialog>
       )}

       {/* Patient History Modal */}
       <Dialog open={showPatientHistory} onOpenChange={setShowPatientHistory}>
         <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="text-lg sm:text-xl">Hasta Geçmişi</DialogTitle>
             <DialogDescription className="text-xs sm:text-sm">Hastaya ait son 1 senelik geçmiş kayıtları görüntüleyebilirsiniz.</DialogDescription>
           </DialogHeader>
           {/* Geçmiş randevuları filtrele ve göster */}
           {(() => {
             if (!historyPatientId) {
               return (
                 <div className="text-center py-8">
                   <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                   <p className="text-lg font-medium text-gray-600 mb-2">Kayıt Bulunamadı</p>
                   <p className="text-sm text-gray-500">Bu hasta için henüz geçmiş kayıt bulunmamaktadır.</p>
                 </div>
               );
             }
             // Bugünden önceki randevuları ve ilgili hastanınkileri al
             const now = new Date();
             const historyList = appointments.filter(app => {
               if (app.patient_id !== historyPatientId) return false;
               // Tarih parse
               const [day, month, year] = app.date.split('.');
               const appDate = new Date(Number(year), Number(month) - 1, Number(day));
               return appDate < now;
             });
             if (historyList.length === 0) {
               return (
                 <div className="text-center py-8">
                   <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                   <p className="text-lg font-medium text-gray-600 mb-2">Kayıt Bulunamadı</p>
                   <p className="text-sm text-gray-500">Bu hasta için henüz geçmiş kayıt bulunmamaktadır.</p>
                 </div>
               );
             }
             return (
               <div className="space-y-3 sm:space-y-4 max-h-[350px] overflow-y-auto px-1 sm:px-2">
                 {historyList.map((app, idx) => (
                   <div key={app.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border">
                     <div className="min-w-0 flex-1">
                       <p className="font-medium text-sm sm:text-base truncate">{app.date} - {app.time}</p>
                       <p className="text-xs sm:text-sm text-gray-700 truncate">{app.specialty}</p>
                       <p className="text-xs text-gray-500 truncate">{app.type === 'online' ? 'Online' : 'Yüz Yüze'} • {app.status === 'confirmed' ? 'Onaylandı' : app.status === 'completed' ? 'Tamamlandı' : app.status === 'pending' ? 'Beklemede' : 'İptal'}</p>
                     </div>
                   </div>
                 ))}
               </div>
             );
           })()}
           <DialogFooter>
             <Button onClick={() => setShowPatientHistory(false)} className="border-2 border-gray-300 shadow-sm">Kapat</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

      

      {/* Exit Confirmation Modal */}
      <Dialog open={showExitConfirm} onOpenChange={(open) => {
        if (!open) {
          setShowExitConfirm(false);
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Çıkış Onayı</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Filtreleriniz kaydedilmedi. Çıkmak istediğinizden emin misiniz?
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={cancelExit} className="border-2 border-gray-300 shadow-sm text-xs sm:text-sm w-full sm:w-auto">
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmExit} className="border-2 border-gray-300 shadow-sm text-xs sm:text-sm w-full sm:w-auto">
              Çık
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorAppointments; 