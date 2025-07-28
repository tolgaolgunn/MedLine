import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { useTheme } from './ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Activity, 
  Pill, 
  AlertCircle,
  TrendingUp,
  Heart,
  Thermometer,
  Sun,
  Moon,
  Users,
  BarChart3,
  Stethoscope,
  MessageSquare,
} from 'lucide-react';
import { Profile } from "./Profile";
import { AIDiagnosis } from "./AIDiagnosis";
import { DoctorSearch } from "./DoctorSearch";
import { Appointments } from "./Appointments";
import { MedicalRecords } from "./MedicalRecords";
import { Prescriptions } from "./prescriptions";
import { Pharmacy } from "./pharmacy";
import { Notifications } from "./notifications";
import { Feedback } from "./feedback";    
import { Topbar } from "./Topbar";

interface Appointment {
  id: number;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: 'Online' | 'Yüz Yüze';
}

interface HealthMetric {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'normal' | 'warning' | 'critical';
}

export function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>('patient');
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Kullanıcı rolünü al
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        setUserRole(userObj.role || 'patient');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  // Hasta rolü için randevu verilerini al
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
    if (userRole === 'patient') {
      async function fetchAppointments() {
        setLoadingAppointments(true);
        try {
          const userStr = localStorage.getItem("user");
          if (!userStr) return;
          const user = JSON.parse(userStr);

          const res = await fetch(`http://localhost:3005/api/appointments/${user.user_id}`);
          if (!res.ok) return;

          const data = await res.json();
          console.log("API'den gelen veri:", data); 

          const now = new Date();
          const upcoming = data.filter((appointment: any) => {
            if (!appointment.datetime) return false;
            return new Date(appointment.datetime) > now;
          }).sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
          setUpcomingAppointments(upcoming);
        } catch (e) {
          console.error("Randevu verisi alınamadı:", e);
          setUpcomingAppointments([]);
        } finally {
          setLoadingAppointments(false);
        }
      }

      fetchAppointments();
    }
  }, [userRole]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const healthMetrics: HealthMetric[] = [
    { label: 'Tansiyon', value: '120/80', icon: Heart, status: 'normal' },
    { label: 'Ateş', value: '36.5°C', icon: Thermometer, status: 'normal' },
    { label: 'Nabız', value: '72 bpm', icon: Activity, status: 'normal' }
  ];

  const getGreetingTime = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-auto">
        <Topbar onLogout={handleLogout} setActiveSection={setActiveSection} />
        <main className="flex-1 overflow-auto">
          {activeSection === "dashboard" && (
            userRole === 'doctor' ? (
              <DoctorDashboardHome
                theme={theme}
                getGreetingTime={getGreetingTime}
                setActiveSection={setActiveSection}
              />
            ) : (
              <DashboardHome
                theme={theme}
                upcomingAppointments={upcomingAppointments}
                healthMetrics={healthMetrics}
                getGreetingTime={getGreetingTime}
                setActiveSection={setActiveSection}
              />
            )
          )}
          {activeSection === "profile" && <Profile />}
          {activeSection === "ai-diagnosis" && userRole === 'patient' && <AIDiagnosis />}
          {activeSection === "doctor-search" && userRole === 'patient' && <DoctorSearch />}
          {activeSection === "appointments" && (
            userRole === 'doctor' ? (
              <DoctorAppointments />
            ) : (
              <Appointments />
            )
          )}
          {activeSection === "medical-records" && userRole === 'patient' && <MedicalRecords />}
          {activeSection === "prescriptions" && userRole === 'patient' && <Prescriptions />}
          {activeSection === "pharmacy" && userRole === 'patient' && <Pharmacy />}
          {activeSection === "notifications" && userRole === 'patient' && <Notifications />}
          {activeSection === "feedback" && <Feedback />}
          {activeSection === "reports" && userRole === 'doctor' && <DoctorReports />}
          {activeSection === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}

function DashboardHome({ theme, upcomingAppointments, loadingAppointments, healthMetrics, getGreetingTime, setActiveSection }: any) {
  // Kullanıcı adını al
  let userName = 'Kullanıcı';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (userObj.full_name) {
        userName = userObj.full_name;
      } else if (userObj.firstName && userObj.lastName) {
        userName = userObj.firstName + ' ' + userObj.lastName;
      } else if (userObj.firstName) {
        userName = userObj.firstName;
      } else if (userObj.email) {
        userName = userObj.email;
      }
    }
  } catch {}

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{getGreetingTime()}, {userName}</h1>
          {theme === 'dark' && <Moon className="w-6 h-6 text-muted-foreground" />}
          {theme === 'light' && <Sun className="w-6 h-6 text-muted-foreground" />}
        </div>
        <p className="text-muted-foreground">Sağlığınızı takip edin ve doktorlarınızla iletişim kurun.</p>
      </div>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg transition-colors duration-200">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">2</p>
              <p className="text-sm text-muted-foreground">Yaklaşan Randevu</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg transition-colors duration-200">
              <Pill className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Aktif Reçete</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg transition-colors duration-200">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">7</p>
              <p className="text-sm text-muted-foreground">Bu Ay Ölçüm</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg transition-colors duration-200">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">85%</p>
              <p className="text-sm text-muted-foreground">Sağlık Skoru</p>
            </div>
          </div>
        </Card>
      </div>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <Card className="lg:col-span-2 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Yaklaşan Randevular</h2>
            <Button
              variant="outline"
              size="sm"
              className="text-black dark:text-white"
              onClick={() => setActiveSection("appointments")}
            >
              Tümünü Gör
            </Button>
          </div>

          {loadingAppointments ? (
            <p className="text-sm text-muted-foreground">Randevular yükleniyor...</p>
          ) : upcomingAppointments.length === 0 ? (
            <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              Yaklaşan bir randevunuz bulunmamaktadır.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{appointment.doctor_name || '-'}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.doctor_specialty || '-'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {(appointment.datetime ? new Date(appointment.datetime).toLocaleDateString('tr-TR') : '-')}
                          {' - '}
                          {(appointment.datetime ? new Date(appointment.datetime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-')}
                        </span>
                        <Badge
                          variant={appointment.type?.toLowerCase() === "online" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {appointment.type || '-'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveSection("appointments")}>
                    Detay
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
        
        <Card className="p-6 transition-colors duration-200">
        <h2 className="text-xl font-semibold mb-4">AI Ön Tanı Sonuçları</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg transition-colors duration-200">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm">Ön tanı sonuçlarınız hazır</p>
              <p className="text-xs text-muted-foreground">2 saat önce</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg transition-colors duration-200">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <div className="flex flex-col">
              <p className="text-sm">Ön tanı sonuçlarınız kontrol edildi</p>
              <p className="text-xs text-muted-foreground">1 ay önce</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveSection('ai-diagnosis')}>
            AI Ön Tanı Sonuçlarını Gör
          </Button>
        </div>
        </Card>
      </div>
      {/* Recent Activity */}
      <Card className="p-6 transition-colors duration-200">
        <h2 className="text-xl font-semibold mb-4">Son Aktiviteler</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg transition-colors duration-200">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm">AI ön tanı tamamlandı</p>
              <p className="text-xs text-muted-foreground">2 saat önce</p>
            </div>
          </div>
         <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg transition-colors duration-200">
            <Calendar className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm">Randevu onaylandı</p>
              <p className="text-xs text-muted-foreground">2 gün önce</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Doctor Dashboard Home Component
function DoctorDashboardHome({ theme, getGreetingTime, setActiveSection }: any) {
  // Get doctor name from localStorage
  let doctorName = 'Doktor';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (userObj.full_name) {
        doctorName = userObj.full_name;
      } else if (userObj.email) {
        doctorName = userObj.email;
      }
    }
  } catch {}

  const upcomingAppointments = [
    // Sample data - will be replaced with real data
    { id: 1, patient: 'Ahmet Yılmaz', specialty: 'Kardiyoloji', date: '2024-01-15', time: '14:30', type: 'Yüz Yüze' },
    { id: 2, patient: 'Fatma Demir', specialty: 'Dahiliye', date: '2024-01-16', time: '10:00', type: 'Online' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{getGreetingTime()}, Dr. {doctorName}</h1>
          {theme === 'dark' && <Moon className="w-6 h-6 text-muted-foreground" />}
          {theme === 'light' && <Sun className="w-6 h-6 text-muted-foreground" />}
        </div>
        <p className="text-muted-foreground">Hastalarınızı yönetin ve randevularınızı takip edin.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg transition-colors duration-200">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Bugünkü Randevu</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg transition-colors duration-200">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-sm text-muted-foreground">Toplam Hasta</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg transition-colors duration-200">
              <Stethoscope className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Bu Hafta Muayene</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg transition-colors duration-200">
              <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">4.8</p>
              <p className="text-sm text-muted-foreground">Ortalama Puan</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <Card className="lg:col-span-2 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Yaklaşan Randevular</h2>
            <Button variant="outline" size="sm" className="text-black dark:text-white" onClick={() => setActiveSection('appointments')}>
              Tümünü Gör
            </Button>
          </div>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment: any) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-colors duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{appointment.patient}</h3>
                    <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{appointment.date} - {appointment.time}</span>
                      <Badge variant={appointment.type === 'Online' ? 'secondary' : 'outline'} className="text-xs">
                        {appointment.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Detay
                </Button>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6 transition-colors duration-200">
          <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={() => setActiveSection('appointments')}>
              <Calendar className="w-4 h-4 mr-2" />
              Randevu Yönetimi
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setActiveSection('reports')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Raporları Görüntüle
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setActiveSection('feedback')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Geri Bildirimler
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 transition-colors duration-200">
        <h2 className="text-xl font-semibold mb-4">Son Aktiviteler</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg transition-colors duration-200">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm">Yeni randevu oluşturuldu</p>
              <p className="text-xs text-muted-foreground">1 saat önce</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg transition-colors duration-200">
            <Users className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm">Yeni hasta kaydı</p>
              <p className="text-xs text-muted-foreground">2 gün önce</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Doktor Raporları
function DoctorReports() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Raporlar</h1>
        <p className="text-muted-foreground">Hasta ve randevu istatistiklerinizi görüntüleyin.</p>
      </div>
    </div>
  );
}

// Settings Component
function Settings() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">Hesap ve uygulama ayarlarınızı yönetin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hesap Ayarları</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ad Soyad</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md"
                placeholder="Ad Soyad"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">E-posta</label>
              <input 
                type="email" 
                className="w-full p-2 border rounded-md"
                placeholder="E-posta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefon</label>
              <input 
                type="tel" 
                className="w-full p-2 border rounded-md"
                placeholder="Telefon"
              />
            </div>
            <Button className="w-full">Değişiklikleri Kaydet</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Bildirim Ayarları</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>E-posta Bildirimleri</span>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span>SMS Bildirimleri</span>
              <input type="checkbox" className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span>Randevu Hatırlatmaları</span>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span>Güncelleme Bildirimleri</span>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Güvenlik</h2>
        <div className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            Şifre Değiştir
          </Button>
          <Button variant="outline" className="w-full justify-start">
            İki Faktörlü Doğrulama
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Oturum Geçmişi
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Doctor Appointments Component
function DoctorAppointments() {
  const [filter, setFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Sample data for upcoming appointments
  const upcomingAppointments = [
    {
      id: 1,
      patientName: 'Ahmet Yılmaz',
      patientAge: 45,
      specialty: 'Kardiyoloji',
      date: new Date().toISOString().split('T')[0], // Bugün
      time: '14:30',
      type: 'online',
      status: 'confirmed',
      symptoms: 'Göğüs ağrısı, nefes darlığı'
    },
    {
      id: 2,
      patientName: 'Fatma Demir',
      patientAge: 32,
      specialty: 'Dahiliye',
      date: new Date().toISOString().split('T')[0], // Bugün
      time: '16:00',
      type: 'face_to_face',
      status: 'confirmed',
      symptoms: 'Baş ağrısı, mide bulantısı'
    },
    {
      id: 3,
      patientName: 'Mehmet Kaya',
      patientAge: 28,
      specialty: 'Ortopedi',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yarın
      time: '10:00',
      type: 'online',
      status: 'confirmed',
      symptoms: 'Sırt ağrısı'
    },
    {
      id: 4,
      patientName: 'Ayşe Özkan',
      patientAge: 55,
      specialty: 'Nöroloji',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yarın
      time: '11:30',
      type: 'face_to_face',
      status: 'confirmed',
      symptoms: 'Baş dönmesi, denge problemi'
    },
    {
      id: 5,
      patientName: 'Ali Veli',
      patientAge: 38,
      specialty: 'Dermatoloji',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 gün sonra
      time: '09:00',
      type: 'online',
      status: 'confirmed',
      symptoms: 'Cilt döküntüsü, kaşıntı'
    },
    {
      id: 6,
      patientName: 'Zeynep Kaya',
      patientAge: 42,
      specialty: 'Göz Hastalıkları',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 hafta sonra
      time: '15:30',
      type: 'face_to_face',
      status: 'confirmed',
      symptoms: 'Görme bulanıklığı, göz ağrısı'
    }
  ];

  const currentAppointment = {
    id: 1,
    patientName: 'Ahmet Yılmaz',
    patientAge: 45,
    specialty: 'Kardiyoloji',
    date: new Date().toISOString().split('T')[0], // Bugün
    time: '14:30',
    type: 'online',
    status: 'confirmed',
    symptoms: 'Göğüs ağrısı, nefes darlığı',
    isCurrent: true
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
    // Burada online randevu başlatma sayfasına yönlendirme yapılacak
    
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

    return upcomingAppointments.filter(appointment => {
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
                            <input 
                              type="date" 
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md bg-background"
                              placeholder="Başlangıç"
                            />
                            <input 
                              type="date" 
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md bg-background"
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
              {getFilteredAppointments().map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{appointment.patientName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {appointment.patientAge} yaş • {appointment.specialty}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(appointment.date)} - {formatTime(appointment.time)}
                        </span>
                        <Badge variant={appointment.type === 'online' ? 'secondary' : 'outline'} className="text-xs">
                          {appointment.type === 'online' ? 'Online' : 'Yüz Yüze'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Şikayet: {appointment.symptoms}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {appointment.type === 'online' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStartAppointment(appointment.id)}
                        variant="outline"
                        className="bg-white hover:bg-gray-50"
                      >
                        Randevuyu Başlat
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
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
            
            {currentAppointment ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {formatTime(currentAppointment.time)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(currentAppointment.date)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Hasta</label>
                    <p className="font-medium">{currentAppointment.patientName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Yaş</label>
                    <p>{currentAppointment.patientAge} yaş</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Uzmanlık</label>
                    <p>{currentAppointment.specialty}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Randevu Türü</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={currentAppointment.type === 'online' ? 'secondary' : 'outline'}>
                        {currentAppointment.type === 'online' ? 'Online' : 'Yüz Yüze'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Şikayet</label>
                    <p className="text-sm">{currentAppointment.symptoms}</p>
                  </div>
                </div>

                {currentAppointment.type === 'online' && (
                  <Button 
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50"
                    onClick={() => handleStartAppointment(currentAppointment.id)}
                  >
                    Online Randevuyu Başlat
                  </Button>
                )}
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Randevu Detayı
                  </Button>
                  <Button variant="outline" className="flex-1">
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
}

export default Dashboard;