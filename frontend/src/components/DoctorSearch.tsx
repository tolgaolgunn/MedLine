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
  const [selectedDoctor, setSelectedDoctor] =
    useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<
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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

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

  const specialties: string[] = [
    "Tümü",
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
        .includes(searchTerm.toLocaleLowerCase("tr")) ||
      doctor.specialty
        .toLocaleLowerCase("tr")
        .includes(searchTerm.toLocaleLowerCase("tr"));
    const matchesSpecialty =
      !selectedSpecialty ||
      selectedSpecialty === "Tümü" ||
      doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookAppointment = async (): Promise<void> => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !appointmentType) return;

    // Kullanıcı bilgisini localStorage'dan al
    const userDataStr = localStorage.getItem('user');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const patient_id = userData?.user_id;

    // Tarih ve saat birleştir
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const datetime = `${dateStr} ${selectedTime}:00`;

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
        // Hata mesajı göster
        alert('Randevu kaydedilemedi!');
      }
    } catch (e) {
      alert('Sunucu hatası!');
    }
  };

  const handleDateSelect = (date: Date | null): void => {
    console.log('Seçilen tarih:', date);
    setSelectedDate(date || undefined);
  };

  const clearSelections = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setAppointmentType("");
    setShowCalendar(false);
  };

  const handleOpenAppointmentModal = (doctor: Doctor) => {
    // Önceki seçimleri temizle
    clearSelections();
    setSelectedDoctor(doctor);
  };

  const handleCloseModal = () => {
    // Eğer seçim yapılmışsa onay sor
    if (appointmentType || selectedDate || selectedTime) {
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Doktor adı veya uzmanlık alanı..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={selectedSpecialty}
            onValueChange={setSelectedSpecialty}
          >
            <SelectTrigger>
              <SelectValue placeholder="Uzmanlık Alanı" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button className="w-full">
            <Search className="w-4 h-4 mr-2" />
            Ara
          </Button>
        </div>
      </Card>

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
                                            const isSelected = selectedDate && isSameDay(currentDate, selectedDate);
                                            
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
                                                    setSelectedDate(currentDate);
                                                    setShowCalendar(false);
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
                                        onClick={() => setShowCalendar(false)}
                                        className="flex-1"
                                      >
                                        İptal
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => setShowCalendar(false)}
                                        className="flex-1"
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
                             <div className="grid grid-cols-3 gap-3">
                               {timeSlots.map((time) => (
                                 <Button
                                   key={time}
                                   variant={
                                     selectedTime === time
                                       ? "default"
                                       : "outline"
                                   }
                                   size="sm"
                                   className="h-10 text-sm font-medium"
                                   onClick={() => {
                                     console.log('Seçilen saat:', time);
                                     setSelectedTime(time);
                                   }}
                                 >
                                   {time}
                                 </Button>
                               ))}
                             </div>
                             {selectedTime && (
                               <p className="text-sm text-green-600 mt-2">
                                 Seçilen saat: {selectedTime}
                               </p>
                             )}
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
                               !selectedTime
                             }
                           >
                             Randevuyu Onayla ({doctor.price})
                           </Button>
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
 }