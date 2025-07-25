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

  const handleBookAppointment = (): void => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedDoctor(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      setAppointmentType("");
    }, 2000);
  };

  const handleDateSelect = (date: Date | undefined): void => {
    setSelectedDate(date);
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setSelectedDoctor(doctor)}
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
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date: Date ) => date < new Date()}
                            className="rounded-md border"
                          />
                        </div>

                        {selectedDate && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Saat Seç
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {timeSlots.map((time) => (
                                <Button
                                  key={time}
                                  variant={
                                    selectedTime === time
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    setSelectedTime(time)
                                  }
                                >
                                  {time}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

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
    </div>
  );
}