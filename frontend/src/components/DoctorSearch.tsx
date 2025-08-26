import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import { Calendar } from "./ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Calendar as CalendarIcon,
  Video,
  User,
  CheckCircle,
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from "react-toastify";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  reviewCount: number;
  location: string;
  image: string;
  onlineAvailable: boolean;
  officeAvailable: boolean;
  nextAvailable: string;
  price: string;
}

type AppointmentType = "online" | "office";

export function DoctorSearch() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<string>("");
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>("");
  const [activeSelectedSpecialty, setActiveSelectedSpecialty] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] =
    useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<
    Date | undefined
  >();
  const [tempSelectedDate, setTempSelectedDate] = useState<
    Date | undefined
  >();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<
    AppointmentType | ""
  >("");
  const [showSuccess, setShowSuccess] =
    useState<boolean>(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showAppointmentTypeError, setShowAppointmentTypeError] = useState<boolean>(false);
  const [showDateError, setShowDateError] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [doctorAppointments, setDoctorAppointments] = useState<any[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState<boolean>(false);

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:3005/api/doctors");
        const data = await res.json();
        const mapped = data.map((doc: any) => ({
          id: doc.user_id,
          name: doc.full_name,
          specialty: doc.specialty,
          experience: (doc.experience_years || 0) + " yıl",
          rating: 4.5, 
          reviewCount: 0,
          location: `${doc.city || ""}, ${doc.district || ""}`.replace(/^[,\s]+|[,\s]+$/g, ""),
          image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
          onlineAvailable: true,
          officeAvailable: true,
          nextAvailable: "Yakında",
          price: "-",
        }));
        setDoctors(mapped);
      } catch (e) {
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  // Tarih veya doktor değiştiğinde randevuları kontrol et
  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      checkAppointments(selectedDate, selectedDoctor.id);
    }
  }, [selectedDate, selectedDoctor]);

  const specialties: string[] = [
    "Kardiyoloji",
    "Genel Dahiliye",
    "Nöroloji",
    "Dermatoloji",
    "Pediatri",
    "Ortopedi",
    "Göz Hastalıkları",
    "KBB",
  ];

  const timeSlots: string[] = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name
        .toLocaleLowerCase("tr")
        .includes(activeSearchTerm.toLocaleLowerCase("tr")) ||
      doctor.specialty
        .toLocaleLowerCase("tr")
        .includes(activeSearchTerm.toLocaleLowerCase("tr")) ||
      doctor.location
        .toLocaleLowerCase("tr")
        .includes(activeSearchTerm.toLocaleLowerCase("tr"));
    const matchesSpecialty =
      !activeSelectedSpecialty ||
      activeSelectedSpecialty === "Tümü" ||
      doctor.specialty === activeSelectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setActiveSelectedSpecialty(selectedSpecialty);
  };

  const handleBookAppointment = async (): Promise<void> => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !appointmentType) return;
    
    // Seçilen saat disabled ise işlemi durdur
    if (isTimeSlotDisabled(selectedTime)) {
      toast.error(getTimeSlotMessage(selectedTime));
      return;
    }

    // Kullanıcı bilgisini localStorage'dan al
    const userDataStr = localStorage.getItem('user');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const patient_id = userData?.user_id;

    // Seçilen tarihi UTC olarak ayarla
    const dateObj = new Date(selectedDate);
    // Saat ve dakikayı ayır
    const [hours, minutes] = selectedTime.split(':');
    // Tarihe saat ve dakikayı ekle (yerel saat olarak)
    dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    // Timezone offset'i dakika cinsinden al
    const timezoneOffset = dateObj.getTimezoneOffset();
    // Timezone farkını ekle
    dateObj.setMinutes(dateObj.getMinutes() - timezoneOffset);
    // ISO string formatına çevir
    const datetime = dateObj.toISOString();

    try {
      const response = await fetch('http://localhost:3005/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id,
          doctor_id: selectedDoctor.id,
          datetime,
          type: appointmentType === 'online' ? 'online' : 'face_to_face'
        })
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSelectedDoctor(null);
          clearSelections();
        }, 2000);
      } else {
        // Hata mesajını al ve göster
        const errorData = await response.json();
        toast.error(errorData.message || 'Randevu kaydedilemedi!');
      }
    } catch (e) {
      toast.error('Sunucu hatası!');
    }
  };

  const handleDateSelect = (date: Date | null): void => {
    setSelectedDate(date || undefined);
    
    setSelectedTime("");
  };

  const checkAppointments = async (date: Date, doctorId: number) => {
    setLoadingAppointments(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    try {
      // Kullanıcı bilgisini localStorage'dan al
      const userDataStr = localStorage.getItem('user');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const patient_id = userData?.user_id;

      // Doktorun randevularını getir
      const doctorResponse = await fetch(`http://localhost:3005/api/doctor-appointments/${doctorId}/${dateStr}`);
      const doctorData = await doctorResponse.json();
      setDoctorAppointments(doctorData);

      // Hastanın randevularını getir
      const patientResponse = await fetch(`http://localhost:3005/api/patient-appointments/${patient_id}/${dateStr}`);
      const patientData = await patientResponse.json();
      setPatientAppointments(patientData);
      if (selectedTime && isTimeSlotDisabled(selectedTime)) {
        setSelectedTime("");
        toast.error(getTimeSlotMessage(selectedTime));
      }
    } catch (error) {
      console.error('Randevu kontrolü hatası:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const isTimeSlotDisabled = (time: string): boolean => {
    if (!selectedDate || !selectedDoctor || !time) return false;

    // Eğer seçilen tarih bugünse ve seçilen saat şu andan önceyse, buton disabled
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate);
    const isToday = today.toDateString() === selectedDateOnly.toDateString();
    if (isToday) {
      const [hour, minute] = time.split(":").map(Number);
      const slotDate = new Date(selectedDateOnly);
      slotDate.setHours(hour, minute, 0, 0);
      if (slotDate.getTime() <= today.getTime()) {
        return true;
      }
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const expectedDateTime = `${dateStr} ${time}:00`;
    
    // Doktorun bu saatte randevusu var mı kontrol et
    const doctorHasAppointment = doctorAppointments.some(
      (appointment: any) => {
        try {
          const appointmentDateTime = new Date(appointment.datetime);
          const expectedDate = new Date(expectedDateTime);
          return appointmentDateTime.getTime() === expectedDate.getTime();
        } catch (error) {
          return false;
        }
      }
    );
    
    // Hastanın bu saatte başka randevusu var mı kontrol et
    const patientHasAppointment = patientAppointments.some(
      (appointment: any) => {
        try {
          const appointmentDateTime = new Date(appointment.datetime);
          const expectedDate = new Date(expectedDateTime);
          return appointmentDateTime.getTime() === expectedDate.getTime();
        } catch (error) {
          return false;
        }
      }
    );
    
    return doctorHasAppointment || patientHasAppointment;
  };

  const getTimeSlotMessage = (time: string): string => {
    if (!selectedDate || !selectedDoctor || !time) return '';
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const expectedDateTime = `${dateStr} ${time}:00`;
    
    // Doktorun bu saatte randevusu var mı kontrol et
    const doctorAppointment = doctorAppointments.find(
      (appointment: any) => {
        try {
          const appointmentDateTime = new Date(appointment.datetime);
          const expectedDate = new Date(expectedDateTime);
          return appointmentDateTime.getTime() === expectedDate.getTime();
        } catch (error) {
          return false;
        }
      }
    );
    
    if (doctorAppointment) {
      return 'Bu saatte doktorun randevusu var';
    }
    
    // Hastanın bu saatte başka randevusu var mı kontrol et
    const patientAppointment = patientAppointments.find(
      (appointment: any) => {
        try {
          const appointmentDateTime = new Date(appointment.datetime);
          const expectedDate = new Date(expectedDateTime);
          return appointmentDateTime.getTime() === expectedDate.getTime();
        } catch (error) {
          return false;
        }
      }
    );
    
    if (patientAppointment) {
      return 'Bu saatte başka randevunuz var';
    }
    
    return '';
  };

  const clearSelections = () => {
    setSelectedDate(undefined);
    setTempSelectedDate(undefined);
    setSelectedTime("");
    setAppointmentType("");
    setShowCalendar(false);
    setShowDateError(false);
    setShowAppointmentTypeError(false);
    setDoctorAppointments([]);
    setPatientAppointments([]);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSelectedSpecialty("");
    setActiveSearchTerm("");
    setActiveSelectedSpecialty("");
  };

  const handleOpenAppointmentModal = (doctor: Doctor) => {
    // Önceki seçimleri temizle
    clearSelections();
    setSelectedDoctor(doctor);
  };

  const handleCloseModal = () => {
    // Eğer seçim yapılmışsa onay sor
    if (appointmentType || selectedDate || selectedTime || tempSelectedDate) {
      setShowExitConfirm(true);
    } else {
      setSelectedDoctor(null);
      clearSelections();
    }
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    setSelectedDoctor(null);
    clearSelections();
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Doktor Ara & Randevu Al
        </h1>
        <p className="text-muted-foreground">
          Uzmanlık alanına göre doktor bulun ve randevu alın.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative w-full border-2 border-gray-300 rounded-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Doktor adı, il, ilçe veya uzmanlık alanı..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="pl-10"
            />
          </div>

          <Select
              value={selectedSpecialty}
              onValueChange={(value) => setSelectedSpecialty(value)}
            >
            <SelectTrigger className="w-full border-2 border-gray-300 rounded-md">
              <SelectValue placeholder="Uzmanlık Alanı" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tümü">Tümü</SelectItem>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

                      <Button className="w-full" onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Ara
            </Button>
        </div>
      </Card>

              {/* Search Results Info */}
        {(activeSearchTerm || activeSelectedSpecialty) && (
          <Card className="p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  Arama sonuçları: 
                  {activeSearchTerm && ` "${activeSearchTerm}"`}
                  {activeSelectedSpecialty && activeSelectedSpecialty !== "Tümü" && ` - ${activeSelectedSpecialty}`}
                  {` (${filteredDoctors.length} doktor bulundu)`}
                </span>
              </div>
              <button
                onClick={clearSearch}
                className="px-3 py-1.5 text-gray-600 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 rounded-md text-sm font-medium transition-colors"
              >
                Temizle
              </button>
            </div>
          </Card>
        )}

      {/* Doctor Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <Card className="p-12 text-center">
            <span>Doktorlar yükleniyor...</span>
          </Card>
        ) : (
          filteredDoctors.map((doctor) => (
            <Card
              key={doctor.id}
              className="p-6 transition-colors duration-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage
                    src={doctor.image}
                    alt={doctor.name}
                  />
                  <AvatarFallback>
                    {doctor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{doctor.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {doctor.specialty}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm">
                      {doctor.rating}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({doctor.reviewCount})
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{doctor.experience} deneyim</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{doctor.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span>En erken: {doctor.nextAvailable}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {doctor.onlineAvailable && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Video className="w-3 h-3" />
                    Online
                  </Badge>
                )}
                {doctor.officeAvailable && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <User className="w-3 h-3" />
                    Muayenehane
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">
                  {doctor.price}
                </span>
                                 <Dialog open={selectedDoctor?.id === doctor.id} onOpenChange={(open) => {
                   if (!open) {
                     handleCloseModal();
                   }
                 }}>
                   <DialogTrigger asChild>
                     <Button
                       onClick={() => handleOpenAppointmentModal(doctor)}
                     >
                       Randevu Al
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="max-w-md">
                     <DialogHeader>
                       <DialogTitle>
                         Randevu Al - {doctor.name}
                       </DialogTitle>
                     </DialogHeader>

                    {showSuccess ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">
                          Randevu Oluşturuldu!
                        </h3>
                        <p className="text-muted-foreground">
                          Randevunuz başarıyla kaydedildi. Onay
                          e-postası gönderilecek.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Randevu Türü
                          </label>
                          <Select
                            value={appointmentType}
                            onValueChange={(
                              value: AppointmentType,
                            ) => setAppointmentType(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Randevu türünü seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {doctor.onlineAvailable && (
                                <SelectItem value="online">
                                  Online Görüşme
                                </SelectItem>
                              )}
                              {doctor.officeAvailable && (
                                <SelectItem value="office">
                                  Muayenehane Ziyareti
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                          <div>
                           <label className="block text-sm font-medium mb-2">
                             Tarih Seç
                           </label>
                           <div className="space-y-2">
                             <div className="flex gap-2">
                               <Input
                                 value={selectedDate ? selectedDate.toLocaleDateString('tr-TR') : ''}
                                 placeholder="gg/aa/yyyy formatında tarih seçin"
                                 readOnly
                                 className="flex-1"
                               />
                               <Button
                                 type="button"
                                 variant="outline"
                                 onClick={() => setShowCalendar(!showCalendar)}
                                 className="px-3"
                               >
                                 📅
                               </Button>
                             </div>
                             
                              {showCalendar && (
                                <div className="border rounded-lg p-4 bg-white shadow-lg">
                                  <div className="calendar">
                                    {/* Month */}
                                    <div className="flex items-center justify-between mb-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                      >
                                        ←
                                      </Button>
                                      <h3 className="font-semibold">
                                        {format(currentMonth, 'MMMM yyyy', { locale: tr })}
                                      </h3>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                      >
                                        →
                                      </Button>
                                    </div>

                                     {/* Days */}
                                     <div className="grid grid-cols-7 gap-1 mb-2">
                                       {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                                         <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                                           {day}
                                         </div>
                                       ))}
                                     </div>

                                                                         {/* Dates */}
                                     <div className="grid grid-cols-7 gap-1">
                                       {(() => {
                                         const start = startOfMonth(currentMonth);
                                         const end = endOfMonth(currentMonth);
                                         const startDay = start.getDay(); 
                                         const daysInMonth = end.getDate();
                                         
                                         const mondayOffset = startDay === 0 ? 6 : startDay - 1;
                                         const days = [];
                                        
                                         for (let i = 0; i < mondayOffset; i++) {
                                           days.push(<div key={`empty-${i}`} className="p-2"></div>);
                                         }
                                         
                                                                                   for (let day = 1; day <= daysInMonth; day++) {
                                            const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                            const today = new Date();
                                            const isToday = isSameDay(currentDate, today);
                                            const isSelected = (selectedDate && isSameDay(currentDate, selectedDate)) || 
                                                           (tempSelectedDate && isSameDay(currentDate, tempSelectedDate));
                                            
                                            // Bugünün başlangıcını al (saat 00:00:00)
                                            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                            // Seçilen günün başlangıcını al (saat 00:00:00)
                                            const currentDateStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                                            const isPast = currentDateStart < todayStart;
                                            
                                            days.push(
                                              <button
                                                key={day}
                                                onClick={() => {
                                                  if (!isPast) {
                                                    if (appointmentType) {
                                                      setTempSelectedDate(currentDate);
                                                    } else {
                                                      setShowAppointmentTypeError(true);
                                                    }
                                                  }
                                                }}
                                                disabled={isPast}
                                                className={`
                                                  p-2 text-sm rounded-md transition-colors
                                                  ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-100 cursor-pointer'}
                                                  ${isToday ? 'bg-blue-50 text-blue-600 font-medium' : ''}
                                                  ${isSelected ? 'bg-blue-600 text-white font-medium' : ''}
                                                `}
                                              >
                                                {day}
                                              </button>
                                            );
                                          }
                                         
                                         return days;
                                       })()}
                                     </div>
                                     {/* Butonlar */}
                                    <div className="flex gap-2 mt-4">
                                                                            <Button
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                         
                                          setTempSelectedDate(undefined);
                                          setShowCalendar(false);
                                        }}
                                        className="flex-1 border-2 border-gray-300 hover:border-gray-400"
                                      >
                                        İptal
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setSelectedDate(tempSelectedDate);
                                          setShowCalendar(false);
                                        }}
                                        className="flex-1"
                                        disabled={!tempSelectedDate}
                                      >
                                        Onayla
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                           </div>
                         </div>

                         {selectedDate && (
                           <div>
                             <label className="block text-sm font-medium mb-2">
                               Saat Seç
                             </label>
                             {loadingAppointments && (
                               <p className="text-sm text-blue-600 mb-2">
                                 Randevular kontrol ediliyor...
                               </p>
                             )}
                             <div className="grid grid-cols-3 gap-3">
                               {timeSlots.map((time) => {
                                 const isDisabled = isTimeSlotDisabled(time);
                                 const message = getTimeSlotMessage(time);
                                 
                                 return (
                                   <div key={time} className="relative">
                                     <Button
                                       variant={
                                         selectedTime === time
                                           ? "default"
                                           : "outline"
                                       }
                                       size="sm"
                                       className={`h-10 text-sm font-medium w-full border border-black ${
                                         selectedTime === time
                                           ? 'border-black'
                                           : 'border-gray-400'
                                       } ${
                                         isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                       }`}
                                       onClick={() => {
                                         if (!isDisabled) {
                                           setSelectedTime(time);
                                         } else {
                                           toast.error(message);
                                         }
                                       }}
                                       disabled={isDisabled}
                                     >
                                       {time}
                                     </Button>
                                     {isDisabled && (
                                       <div className="absolute -bottom-6 left-0 right-0 text-xs text-red-500 text-center">
                                         {message}
                                       </div>
                                     )}
                                   </div>
                                 );
                               })}
                            </div>
                          </div>
                        )}

                          <div className="space-y-3">
                           <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                             <p className="font-medium mb-2">Seçimleriniz:</p>
                             <ul className="space-y-1">
                               <li>• Randevu Türü: {appointmentType === 'online' ? 'Online Görüşme' : appointmentType === 'office' ? 'Muayenehane Ziyareti' : 'Seçilmedi'}</li>
                               <li>• Tarih: {selectedDate ? selectedDate.toLocaleDateString('tr-TR') : 'Seçilmedi'}</li>
                               <li>• Saat: {selectedTime || 'Seçilmedi'}</li>
                             </ul>
                           </div>
                           
                                                       <Button
                              className="w-full"
                              onClick={handleBookAppointment}
                              disabled={
                                !appointmentType ||
                                !selectedDate ||
                                !selectedTime ||
                                isTimeSlotDisabled(selectedTime)
                              }
                            >
                              Randevuyu Onayla ({doctor.price})
                            </Button>
                           {selectedTime && isTimeSlotDisabled(selectedTime) && (
                             <p className="text-sm text-red-600 text-center">
                               {getTimeSlotMessage(selectedTime)}
                             </p>
                           )}
                         </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          ))
        )}
      </div>

      {filteredDoctors.length === 0 && (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">
            Doktor bulunamadı
          </h3>
          <p className="text-muted-foreground">
            Arama kriterlerinizi değiştirerek tekrar deneyin.
          </p>
        </Card>
             )}

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
                Seçimleriniz kaydedilmedi. Çıkmak istediğinizden emin misiniz?
              </p>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400"
              onClick={cancelExit}>
                İptal
              </Button>
              <Button variant="destructive" onClick={confirmExit}>
                Çıkış
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Randevu Uyarı Modal */}
        <Dialog open={showAppointmentTypeError} onOpenChange={(open) => {
          if (!open) {
            setShowAppointmentTypeError(false);
          }
        }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Uyarı</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Lütfen randevu türünü seçin.
              </p>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => setShowAppointmentTypeError(false)}
                className="w-1/4 border-2 border-gray-300 hover:border-gray-400"
              >
                Tamam
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
     </div>
   );
 }