import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
} from 'lucide-react';
import { Profile } from "./Profile";
import { AIDiagnosis } from "./AIDiagnosis";
import { DoctorSearch } from "./DoctorSearch";
import { Appointments } from "./Appointments";
import { MedicalRecords } from "./MedicalRecords";
import { Prescriptions } from "./prescriptions";
import { Pharmacy } from "./pharmacy";
import { Notifications } from "./notifications";
import { Feedback } from "./Feedback";    
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
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Dinamik upcomingAppointments ve loadingAppointments state'leri
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
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
  }, []);

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
            <DashboardHome
              theme={theme}
              upcomingAppointments={upcomingAppointments}
              loadingAppointments={loadingAppointments}
              healthMetrics={healthMetrics}
              getGreetingTime={getGreetingTime}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "profile" && <Profile />}
          {activeSection === "ai-diagnosis" && <AIDiagnosis />}
          {activeSection === "doctor-search" && <DoctorSearch />}
          {activeSection === "appointments" && <Appointments />}
          {activeSection === "medical-records" && <MedicalRecords />}
          {activeSection === "prescriptions" && <Prescriptions />}
          {activeSection === "pharmacy" && <Pharmacy />}
          {activeSection === "notifications" && <Notifications />}
          {activeSection === "feedback" && <Feedback />}
        </main>
      </div>
    </div>
  );
}

function DashboardHome({ theme, upcomingAppointments, loadingAppointments, healthMetrics, getGreetingTime, setActiveSection }: any) {
  // Kullanıcı adını localStorage'dan al
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

export default Dashboard;