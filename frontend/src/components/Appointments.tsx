import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Calendar, 
  Clock, 
  Filter, 
  Eye, 
  Play, 
  FileText,
  User,
  Stethoscope,
  Video,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

// Randevu veri yapısı için interface tanımı
interface Appointment {
  id: number;
  doctorId: number;
  doctorName: string;
  doctorSpecialty: string;
  doctorPhone?: string;
  doctorEmail?: string;
  doctorAddress?: string;
  date: string;
  time: string;
  type: 'online' | 'face_to_face';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  complaint?: string;
  notes?: string;
}

// Durum çevirileri için mapping
const statusMap: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  cancelled: "İptal Edildi",
  completed: "Tamamlandı",
};

// Örnek randevu verileri
const sampleAppointments: Appointment[] = [
  {
    id: 1,
    doctorId: 1,
    doctorName: "Dr. Ahmet Yılmaz",
    doctorSpecialty: "Kardiyoloji",
    doctorPhone: "0532 123 45 67",
    doctorEmail: "ahmet.yilmaz@medline.com",
    doctorAddress: "Atatürk Cad. No:123, Ankara",
    date: "15.12.2024",
    time: "14:30",
    type: "online",
    status: "confirmed",
    complaint: "Göğüs ağrısı ve nefes darlığı",
    notes: "Hasta düzenli ilaç kullanıyor"
  },
  {
    id: 2,
    doctorId: 2,
    doctorName: "Dr. Ayşe Demir",
    doctorSpecialty: "Dermatoloji",
    doctorPhone: "0533 234 56 78",
    doctorEmail: "ayse.demir@medline.com",
    doctorAddress: "İnönü Cad. No:456, İstanbul",
    date: "16.12.2024",
    time: "10:00",
    type: "face_to_face",
    status: "pending",
    complaint: "Cilt döküntüsü",
    notes: "İlk kez görüşme"
  },
  {
    id: 3,
    doctorId: 3,
    doctorName: "Dr. Mehmet Kaya",
    doctorSpecialty: "Ortopedi",
    doctorPhone: "0534 345 67 89",
    doctorEmail: "mehmet.kaya@medline.com",
    doctorAddress: "Cumhuriyet Cad. No:789, İzmir",
    date: "14.12.2024",
    time: "16:00",
    type: "online",
    status: "completed",
    complaint: "Bel ağrısı",
    notes: "Fizik tedavi önerildi"
  },
  {
    id: 4,
    doctorId: 4,
    doctorName: "Dr. Fatma Özkan",
    doctorSpecialty: "Nöroloji",
    doctorPhone: "0535 456 78 90",
    doctorEmail: "fatma.ozkan@medline.com",
    doctorAddress: "Gazi Cad. No:321, Bursa",
    date: "17.12.2024",
    time: "11:30",
    type: "face_to_face",
    status: "confirmed",
    complaint: "Baş ağrısı ve baş dönmesi",
    notes: "Migren şüphesi"
  },
     {
     id: 5,
     doctorId: 5,
     doctorName: "Dr. Ali Çelik",
     doctorSpecialty: "Göz Hastalıkları",
     doctorPhone: "0536 567 89 01",
     doctorEmail: "ali.celik@medline.com",
     doctorAddress: "Millet Cad. No:654, Antalya",
     date: "18.12.2024",
     time: "09:00",
     type: "online",
     status: "pending",
     complaint: "Görme bozukluğu",
     notes: "Göz muayenesi gerekli"
   },
   {
     id: 6,
     doctorId: 6,
     doctorName: "Dr. Zeynep Arslan",
     doctorSpecialty: "Psikiyatri",
     doctorPhone: "0537 678 90 12",
     doctorEmail: "zeynep.arslan@medline.com",
     doctorAddress: "Bağdat Cad. No:987, İstanbul",
     date: "19.12.2024",
     time: "15:00",
     type: "online",
     status: "confirmed",
     complaint: "Uyku problemleri ve kaygı",
     notes: "Düzenli terapi seansları"
   },
   {
     id: 7,
     doctorId: 7,
     doctorName: "Dr. Mustafa Özkan",
     doctorSpecialty: "Genel Cerrahi",
     doctorPhone: "0538 789 01 23",
     doctorEmail: "mustafa.ozkan@medline.com",
     doctorAddress: "Kızılay Cad. No:555, Ankara",
     date: "20.12.2024",
     time: "13:30",
     type: "face_to_face",
     status: "pending",
     complaint: "Karın ağrısı",
     notes: "Acil muayene gerekli"
   },
   {
     id: 8,
     doctorId: 8,
     doctorName: "Dr. Elif Yıldız",
     doctorSpecialty: "Kadın Hastalıkları",
     doctorPhone: "0539 890 12 34",
     doctorEmail: "elif.yildiz@medline.com",
     doctorAddress: "Alsancak Cad. No:777, İzmir",
     date: "21.12.2024",
     time: "10:30",
     type: "face_to_face",
     status: "confirmed",
     complaint: "Düzenli kontrol",
     notes: "Yıllık jinekolojik muayene"
   },
   {
     id: 9,
     doctorId: 9,
     doctorName: "Dr. Burak Demir",
     doctorSpecialty: "Çocuk Sağlığı",
     doctorPhone: "0540 901 23 45",
     doctorEmail: "burak.demir@medline.com",
     doctorAddress: "Nilüfer Cad. No:888, Bursa",
     date: "22.12.2024",
     time: "14:00",
     type: "online",
     status: "pending",
     complaint: "Çocuk ateşi ve öksürük",
     notes: "5 yaşında çocuk hasta"
   },
   {
     id: 10,
     doctorId: 10,
     doctorName: "Dr. Seda Kaya",
     doctorSpecialty: "Fizik Tedavi",
     doctorPhone: "0541 012 34 56",
     doctorEmail: "seda.kaya@medline.com",
     doctorAddress: "Muratpaşa Cad. No:999, Antalya",
     date: "23.12.2024",
     time: "16:30",
     type: "face_to_face",
     status: "confirmed",
     complaint: "Boyun ve omuz ağrısı",
     notes: "Fizik tedavi seansı"
   }

 ];

const Appointments: React.FC = () => {
  // Temel state yönetimi
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Filtre state'leri
  const [filter, setFilter] = useState('all'); // Varsayılan olarak tüm randevuları göster
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Modal state'leri
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  
  // Filtre modal state'leri
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    filter: 'all',
    startDate: '',
    endDate: '',
    activeFilters: [] as string[]
  });

  // TempFilters'ı gerçek filtrelerle senkronize et
  useEffect(() => {
    setTempFilters({
      filter: filter,
      startDate: startDate,
      endDate: endDate,
      activeFilters: activeFilters
    });
  }, [filter, startDate, endDate, activeFilters]);

  // Randevunun şu anda aktif olup olmadığını kontrol et (30 dakika öncesi ve 10 dakika sonrası)
  const isCurrentAppointment = (appointment: Appointment) => {
    const [day, month, year] = appointment.date.split('.');
    const [hour, minute] = appointment.time.split(':');
    const appointmentDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    const now = new Date();
    const diff = (appointmentDate.getTime() - now.getTime()) / 60000;
    return diff <= 10 && diff >= -30;
  };

  // Tarih filtre seçenekleri
  const filterOptions = [
    { value: 'all', label: 'Tüm Randevular' },
    { value: 'today', label: 'Bugün' },
    { value: 'tomorrow', label: 'Yarın' },
    { value: 'this_week', label: 'Bu Hafta' },
    { value: 'this_month', label: 'Bu Ay' },
    { value: 'custom', label: 'Tarih Aralığı Seç' }
  ];

  // Hızlı işlem filtre seçenekleri
  const quickActions = [
    { value: 'online', label: 'Online Randevular' },
    { value: 'face_to_face', label: 'Yüz Yüze Randevular' },
    { value: 'confirmed', label: 'Onaylanmış Randevular' },
    { value: 'pending', label: 'Bekleyen Randevular' }
  ];

  // Online randevu başlatma işlemi
  const handleStartAppointment = (appointmentId: number) => {
    console.log('Online randevu başlatılıyor:', appointmentId);
    alert('Video görüşmesi başlatılıyor...');
  };

  // Randevu iptal etme işlemi
  const handleCancelAppointment = async (appointment: Appointment) => {
    try {
      // Örnek veri olduğu için sadece state'i güncelle
      setAppointments(prev => prev.map(app => 
        app.id === appointment.id 
          ? { ...app, status: 'cancelled' as const }
          : app
      ));
      setShowCancelConfirm(false);
      setAppointmentToCancel(null);
      alert('Randevu başarıyla iptal edildi.');
    } catch (err: any) {
      setError(err.message || "Randevu iptal edilirken hata oluştu");
    }
  };

  // Filtre değişikliklerini handle et
  const handleFilterChange = (newFilter: string) => {
    setTempFilters(prev => ({
      ...prev,
      filter: newFilter,
      startDate: newFilter !== 'custom' ? '' : prev.startDate,
      endDate: newFilter !== 'custom' ? '' : prev.endDate
    }));
    setHasUnsavedChanges(true);
  };

  // Hızlı işlem filtrelerini toggle et
  const handleQuickActionToggle = (action: string) => {
    setTempFilters(prev => ({
      ...prev,
      activeFilters: prev.activeFilters.includes(action) 
        ? prev.activeFilters.filter(f => f !== action)
        : [...prev.activeFilters, action]
    }));
    setHasUnsavedChanges(true);
  };

  // Filtreleri uygula
  const applyFilters = () => {
    setFilter(tempFilters.filter);
    setStartDate(tempFilters.startDate);
    setEndDate(tempFilters.endDate);
    setActiveFilters(tempFilters.activeFilters);
    setHasUnsavedChanges(false);
    setIsFilterModalOpen(false);
  };

  // Tüm filtreleri temizle
  const clearAllFilters = () => {
    setTempFilters({
      filter: 'all',
      startDate: '',
      endDate: '',
      activeFilters: []
    });
    setHasUnsavedChanges(true);
  };

  // Filtre modalını kapatma işlemi
  const handleCloseFilterModal = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      setIsFilterModalOpen(false);
    }
  };

  // Çıkış onayını onayla
  const confirmExit = () => {
    setShowExitConfirm(false);
    setIsFilterModalOpen(false);
    setHasUnsavedChanges(false);
    setTempFilters({
      filter,
      startDate,
      endDate,
      activeFilters
    });
  };

  // Çıkış onayını iptal et
  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  // Aktif filtrelerin metnini al
  const getActiveFiltersText = () => {
    if (filter === 'all' && activeFilters.length === 0) {
      return 'Tüm Randevular';
    }
    return 'Filtreler';
  };

  // Filtre modalını aç
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

  // Randevuları filtrele
  const getFilteredAppointments = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return appointments.filter(appointment => {
      // Tarih filtreleme
      const [day, month, year] = appointment.date.split('.');
      const appointmentDate = new Date(Number(year), Number(month) - 1, Number(day));
      
             let dateFilter = true;
       switch (filter) {
         case 'all':
           dateFilter = true; // Tüm randevuları göster
           break;
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

      // Hızlı işlem filtreleme
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
             {/* Sayfa Başlığı */}
       <div className="mb-8">
         <h1 className="text-3xl font-bold mb-2">Randevu Yönetimi</h1>
         <p className="text-muted-foreground">Randevularınızı görüntüleyin ve yönetin.</p>
       </div>

      {/* Ana İçerik */}
      <div className="w-full">
        {/* Randevular Bölümü */}
        <div className="w-full">
          <Card className="p-6">
                         {/* Bölüm Başlığı ve Filtreler */}
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-semibold">Randevular</h2>
              <div className="flex items-center gap-3">
                {/* Filtre Butonu */}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 border-2 border-gray-300 shadow-sm"
                  onClick={handleOpenFilterModal}
                >
                  <Filter className="w-4 h-4" />
                                     <span>{getActiveFiltersText()}</span>
                   {(filter !== 'all' || activeFilters.length > 0) && (
                     <Badge variant="secondary" className="ml-1">
                       {activeFilters.length + (filter !== 'all' ? 1 : 0)}
                     </Badge>
                   )}
                </Button>

                {/* Filtre Modal */}
                <Dialog open={isFilterModalOpen} onOpenChange={handleCloseFilterModal}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Filtreler</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      
                      {/* Tarih Aralığı Filtreleri */}
                      <div>
                        <h3 className="font-medium mb-3">Tarih Aralığı</h3>
                            <div className="grid grid-cols-2 gap-3">
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

                        {/* Özel Tarih Aralığı Girişleri */}
                        {tempFilters.filter === 'custom' && (
                          <div className="mt-3 flex gap-2">
                            <Input 
                              type="date" 
                              value={tempFilters.startDate}
                              className="w-full"
                              onChange={(e) => {
                                setTempFilters(prev => ({ ...prev, startDate: e.target.value }));
                                setHasUnsavedChanges(true);
                              }}
                              placeholder="Başlangıç"
                            />
                            <Input 
                              type="date" 
                              value={tempFilters.endDate}
                              className="w-full"
                              onChange={(e) => {
                                setTempFilters(prev => ({ ...prev, endDate: e.target.value }));
                                setHasUnsavedChanges(true);
                              }}
                              placeholder="Bitiş"
                            />
                          </div>
                        )}
                      </div>

                      {/* Hızlı İşlem Filtreleri */}
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
                      
                      {/* Aksiyon Butonları */}
                      <div className="pt-4 border-t space-y-2">
                        <Button 
                          onClick={applyFilters}
                          disabled={!hasUnsavedChanges}
                          className="w-full border-2 border-gray-300 shadow-sm"
                        >
                          Filtreleri Uygula
                        </Button>
                        
                                                 {(tempFilters.filter !== 'all' || tempFilters.activeFilters.length > 0) && (
                           <Button 
                             variant="outline"
                             onClick={clearAllFilters}
                             className="w-full border-2 border-gray-300 shadow-sm"
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

            {/* Randevular Listesi */}
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
                       {/* Randevu Bilgileri */}
                       <div>
                         <div className="flex items-center gap-3 mb-1">
                           <p className="font-medium">{appointment.doctorName}</p>
                            <Badge variant="outline" className="bg-black text-white border-black">
                              {statusMap[appointment.status]}
                            </Badge>
                         </div>
                         <p className="text-sm text-gray-600">{appointment.doctorSpecialty}</p>
                         <p className="text-xs text-gray-500">{appointment.date} - {appointment.time} • {appointment.type === 'online' ? 'Online' : 'Yüz Yüze'}</p>
                         <p className="text-xs text-gray-500">Şikayet: {appointment.complaint || 'Belirtilmemiş'}</p>
                       </div>
                      
                      {/* Aksiyon Butonları */}
                      <div className="flex items-center gap-2">
                                                 {isCurrentAppointment(appointment) && appointment.type === 'online' && appointment.status === 'confirmed' && (
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleStartAppointment(appointment.id)}
                             className="border-2 border-gray-300 shadow-sm"
                           >
                             <Video className="w-4 h-4 mr-1" />
                             Görüşmeye Katıl
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
                        
                        {appointment.status === 'confirmed' && !isCurrentAppointment(appointment) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setAppointmentToCancel(appointment);
                              setShowCancelConfirm(true);
                            }}
                            className="border-2 border-gray-300 shadow-sm"
                          >
                            İptal Et
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>


      </div>

      {/* Randevu Detay Modal */}
      {showDetail && selectedAppointment && (
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Randevu Detayı</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Doktor Bilgileri */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Doktor Bilgileri
                </h3>
                <div className="space-y-2">
                  <p><strong>Ad Soyad:</strong> {selectedAppointment.doctorName}</p>
                  <p><strong>Uzmanlık:</strong> {selectedAppointment.doctorSpecialty}</p>
                  {selectedAppointment.doctorPhone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <strong>Telefon:</strong> {selectedAppointment.doctorPhone}
                    </p>
                  )}
                  {selectedAppointment.doctorEmail && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <strong>E-posta:</strong> {selectedAppointment.doctorEmail}
                    </p>
                  )}
                  {selectedAppointment.doctorAddress && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <strong>Adres:</strong> {selectedAppointment.doctorAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Randevu Bilgileri */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Randevu Bilgileri
                </h3>
                <div className="space-y-2">
                  <p><strong>Tarih:</strong> {selectedAppointment.date}</p>
                  <p><strong>Saat:</strong> {selectedAppointment.time}</p>
                  <p><strong>Tür:</strong> {selectedAppointment.type === 'online' ? 'Online' : 'Yüz Yüze'}</p>
                  <p><strong>Durum:</strong> {statusMap[selectedAppointment.status]}</p>
                  {selectedAppointment.complaint && (
                    <p><strong>Şikayet:</strong> {selectedAppointment.complaint}</p>
                  )}
                  {selectedAppointment.notes && (
                    <p><strong>Notlar:</strong> {selectedAppointment.notes}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowDetail(false)} className="border-2 border-gray-300 shadow-sm">
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Randevu İptal Onay Modal */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Randevu İptali</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Bu randevuyu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            {appointmentToCancel && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{appointmentToCancel.doctorName}</p>
                <p className="text-sm text-gray-600">{appointmentToCancel.date} - {appointmentToCancel.time}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)} className="border-2 border-gray-300 shadow-sm">
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => appointmentToCancel && handleCancelAppointment(appointmentToCancel)}
              className="border-2 border-gray-300 shadow-sm"
            >
              Randevuyu İptal Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Çıkış Onay Modal */}
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
            <Button variant="outline" onClick={cancelExit} className="border-2 border-gray-300 shadow-sm">
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmExit} className="border-2 border-gray-300 shadow-sm">
              Çık
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;