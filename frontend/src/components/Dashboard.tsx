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
import Appointments from "./Appointments";
import { MedicalRecords } from "./MedicalRecords";
import { Prescriptions } from "./prescriptions";
import { Pharmacy } from "./pharmacy";
import { Notifications } from "./notifications";
import { Feedback } from "./feedback";    
import { Topbar } from "./Topbar";
import { DoctorAppointments, DoctorDashboard } from "./doctor";
import DoctorReports from "./DoctorReports";
import PatientVideoCallButton from "./PatientVideoCallButton";

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

  // Hasta randevu verilerini al
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const fetchAppointments = async () => {
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
      const upcoming = data
        .filter((appointment: any) => {
          if (!appointment.datetime) return false;
          if (appointment.status === 'cancelled') return false;
          return new Date(appointment.datetime) > now;
        })
        .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
        .slice(0, 5);

      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error("Randevular yüklenirken hata:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Randevu oluşturulduğunda dashboard'ı yenile
  useEffect(() => {
    const handleAppointmentCreated = () => {
      fetchAppointments();
    };

    window.addEventListener('appointmentCreated', handleAppointmentCreated);
    return () => {
      window.removeEventListener('appointmentCreated', handleAppointmentCreated);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const getGreetingTime = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi Günler";
    return "İyi Akşamlar";
  };

  // Sağlık metrikleri
  const healthMetrics: HealthMetric[] = [
    {
      label: "Kalp Atış Hızı",
      value: "72 bpm",
      icon: Heart,
      status: "normal"
    },
    {
      label: "Kan Basıncı",
      value: "120/80",
      icon: Activity,
      status: "normal"
    },
    {
      label: "Vücut Sıcaklığı",
      value: "36.8°C",
      icon: Thermometer,
      status: "normal"
    },
    {
      label: "Oksijen Seviyesi",
      value: "98%",
      icon: TrendingUp,
      status: "normal"
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return userRole === 'doctor' ? (
          <DoctorDashboard />
        ) : (
          <DashboardHome 
            upcomingAppointments={upcomingAppointments}
            loadingAppointments={loadingAppointments}
            healthMetrics={healthMetrics}
            getGreetingTime={getGreetingTime}
            setActiveSection={setActiveSection}
          />
        );
      case "profile":
        return <Profile />;
      case "ai-diagnosis":
        return <AIDiagnosis />;
      case "doctor-search":
        return <DoctorSearch />;
      case "appointments":
        return userRole === 'doctor' ? <DoctorAppointments /> : <Appointments />;
      case "medical-records":
        return <MedicalRecords />;
      case "prescriptions":
        return <Prescriptions />;
      case "pharmacy":
        return <Pharmacy />;
      case "notifications":
        return <Notifications />;
      case "feedback":
        return <Feedback />;
      case "reports":
        return userRole === 'doctor' ? <DoctorReports /> : <div>Raporlar</div>;
      default:
        return userRole === 'doctor' ? (
          <DoctorDashboard />
        ) : (
          <DashboardHome 
            upcomingAppointments={upcomingAppointments}
            loadingAppointments={loadingAppointments}
            healthMetrics={healthMetrics}
            getGreetingTime={getGreetingTime}
            setActiveSection={setActiveSection}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onLogout={handleLogout} setActiveSection={setActiveSection} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Hasta Dashboard Ana Sayfası
function DashboardHome({ theme, upcomingAppointments, loadingAppointments, healthMetrics, getGreetingTime, setActiveSection }: any) {
  // Kullanıcı adını ve ID'sini localStorage'dan al
  let userName = 'Kullanıcı';
  let userId = '';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (userObj.full_name) {
        userName = userObj.full_name;
      } else if (userObj.email) {
        userName = userObj.email;
      }
      userId = userObj.user_id || '';
    }
  } catch {}

  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (userObj.full_name) {
        userName = userObj.full_name;
      } else if (userObj.email) {
        userName = userObj.email;
      }
    }
  } catch {}

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Video Görüşme Bileşeni - Gizli olarak eklendi, sadece doktor aradığında görünecek */}
      {userId && <PatientVideoCallButton userId={userId} />}
      
      {/* Karşılama Bölümü */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{getGreetingTime()}, {userName}</h1>
          {theme === 'dark' && <Moon className="w-6 h-6 text-muted-foreground" />}
          {theme === 'light' && <Sun className="w-6 h-6 text-muted-foreground" />}
        </div>
        <p className="text-muted-foreground">Sağlığınızı takip edin ve randevularınızı yönetin.</p>
      </div>

      {/* Hızlı İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg transition-colors duration-200">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
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
              <Stethoscope className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Toplam Muayene</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg transition-colors duration-200">
              <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Yeni Mesaj</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Ana İçerik Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yaklaşan Randevular */}
        <Card className="lg:col-span-2 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Yaklaşan Randevular</h2>
            <Button variant="outline" size="sm" className="text-black dark:text-white" onClick={() => setActiveSection('appointments')}>
              Tümünü Gör
            </Button>
          </div>
          <div className="space-y-4">
            {loadingAppointments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Randevular yükleniyor...</p>
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Yaklaşan randevunuz bulunmuyor</p>
                          <Button 
                            variant="outline" 
                  className="mt-4 !border !border-black hover:!border-gray-700 hover:!bg-gray-50"
                  onClick={() => setActiveSection('doctor-search')}
                          >
                  Doktor Ara
                          </Button>
              </div>
            ) : (
              upcomingAppointments.map((appointment: any) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-colors duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{appointment.doctor_name || 'Doktor'}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.specialty || 'Uzmanlık'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(appointment.datetime).toLocaleDateString('tr-TR')} - {new Date(appointment.datetime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={appointment.type === 'online' ? 'secondary' : 'outline'}>
                      {appointment.type === 'online' ? 'Online' : 'Yüz Yüze'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedAppointment(appointment); setShowDetailModal(true); }}>
                      Detay
                    </Button>
                  </div>
                </div>
              ))
            )}
            </div>
          </Card>

        {showDetailModal && selectedAppointment && (
  <Dialog open={showDetailModal} onOpenChange={(open) => { if (!open) setShowDetailModal(false); }}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Randevu Detayı</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <div><b>Doktor:</b> {selectedAppointment.doctor_name || 'Doktor'}</div>
        <div><b>Tarih:</b> {selectedAppointment.datetime ? new Date(selectedAppointment.datetime).toLocaleDateString('tr-TR') : '-'}</div>
        <div><b>Saat:</b> {selectedAppointment.datetime ? new Date(selectedAppointment.datetime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
        <div><b>Tip:</b> {selectedAppointment.type === 'online' ? 'Online' : 'Yüz Yüze'}</div>
        <div><b>Branş:</b> {selectedAppointment.specialty || selectedAppointment.doctor_specialty || '-'}</div>
        <div><b>Durum:</b> {selectedAppointment.status === 'confirmed' ? 'Onaylandı' : selectedAppointment.status === 'pending' ? 'Beklemede' : selectedAppointment.status === 'cancelled' ? 'İptal Edildi' : selectedAppointment.status === 'completed' ? 'Tamamlandı' : '-'}</div>
      </div>
      <Button onClick={() => setShowDetailModal(false)} className="w-full mt-4">Kapat</Button>
    </DialogContent>
  </Dialog>
)}
        <div className="space-y-6">
          <Card className="p-6 transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-4">Sağlık Durumu</h2>
              <div className="space-y-4">
              {healthMetrics.map((metric: HealthMetric, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      metric.status === 'normal' ? 'bg-green-100 dark:bg-green-900/20' :
                      metric.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                      'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      <metric.icon className={`w-4 h-4 ${
                        metric.status === 'normal' ? 'text-green-600 dark:text-green-400' :
                        metric.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{metric.value}</span>
                </div>
              ))}
            </div>
                                                                                                                                                                       <Button 
                        variant="outline"
                        className="w-full mt-4 !border !border-black hover:!border-gray-700 hover:!bg-gray-50"
                        style={{ borderWidth: '2px', borderColor: 'black', borderStyle: 'solid' }}
                        onClick={() => setActiveSection('ai-diagnosis')}
                      >
                        AI Teşhis Al
                      </Button>
          </Card>


        </div>
      </div>
    </div>
  );
}