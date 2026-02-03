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
  DialogFooter,
} from './ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
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
  History,
} from 'lucide-react';
import { Profile } from "./Profile";
import { AIDiagnosis } from "./AIDiagnosis";
import { DoctorSearch } from "./DoctorSearch";
import Appointments from "./Appointments";
import { MedicalRecords } from "./MedicalRecords";
import { Prescriptions } from "./prescriptions";
import { Notifications } from "./notifications";
import { Topbar } from "./Topbar";
import { DoctorAppointments, DoctorDashboard } from "./doctor";
import { DoctorProfile } from "./doctor/DoctorProfile";
import DoctorReports from "./doctor/DoctorReports";
import Feedback from "./feedback";
import PatientVideoCallButton from "./PatientVideoCallButton";
import { Settings } from "./Settings";

interface Appointment {
  id: number;
  doctor: string;
  specialty: string;
  hospital_name?: string;
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
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Kullanıcı rolünü al
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const role = userObj.role || 'patient';
        setUserRole(role);
        setUserId(userObj.user_id);

        // Eğer doktor ise ve /dashboard sayfasındaysa /doctor/dashboard'a yönlendir
        if (role === 'doctor' && window.location.pathname === '/dashboard') {
          navigate('/doctor/dashboard');
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, [navigate]);

  // URL yolunu (path) activeSection ile senkronize et (hasta için)
  useEffect(() => {
    if (userRole === 'doctor') return;
    const path = location.pathname || '';
    // /dashboard veya /dashboard/{section}
    if (path.startsWith('/dashboard')) {
      const parts = path.split('/').filter(Boolean); // ['dashboard', 'section?']
      const sectionFromPath = parts[1] || 'dashboard';
      if (sectionFromPath !== activeSection) {
        setActiveSection(sectionFromPath);
      }
    }
  }, [location.pathname, userRole]);

  // setActiveSection çağrılarını URL'ye yönlendiren 
  const setActiveSectionWithRoute = (section: string) => {
    if (userRole === 'doctor') return;
    const target = section && section !== 'dashboard' ? `/dashboard/${section}` : '/dashboard';
    if (location.pathname !== target) {
      navigate(target, { state: { from: location.pathname } });
    }
  };

  // Hasta randevu verilerini al
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [activePrescriptionCount, setActivePrescriptionCount] = useState<number>(0);
  const [completedAppointmentCount, setCompletedAppointmentCount] = useState<number>(0);

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

  // Hasta istatistiklerini çek
  const fetchPatientStatistics = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user.user_id;

      const [prescriptionsRes, appointmentsRes] = await Promise.all([
        fetch(`http://localhost:3005/api/patient/patient/prescriptions/active/count/${userId}`),
        fetch(`http://localhost:3005/api/patient/patient/appointments/completed/count/${userId}`)
      ]);

      if (prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json();
        setActivePrescriptionCount(prescriptionsData.count || 0);
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setCompletedAppointmentCount(appointmentsData.count || 0);
      }
    } catch (error) {
      console.error("İstatistikler yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPatientStatistics();
  }, []);

  // Randevu oluşturulduğunda dashboard'ı yenile
  useEffect(() => {
    const handleAppointmentCreated = () => {
      fetchAppointments();
      fetchPatientStatistics();
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



  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return userRole === 'doctor' ? (
          <DoctorDashboard />
        ) : (
          <DashboardHome
            upcomingAppointments={upcomingAppointments}
            loadingAppointments={loadingAppointments}
            getGreetingTime={getGreetingTime}
            setActiveSection={setActiveSection}
            activePrescriptionCount={activePrescriptionCount}
            completedAppointmentCount={completedAppointmentCount}
          />
        );
      case "profile":
        return userRole === 'doctor' ? <DoctorProfile /> : <Profile />;
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
      case "notifications":
        return <Notifications />;
      case "feedback":
        return <Feedback />;
      case "reports":
        return userRole === 'doctor' ? <DoctorReports /> : <div>Raporlar</div>;
      case "settings":
        return <Settings />;
      default:
        return userRole === 'doctor' ? (
          <DoctorDashboard />
        ) : (
          <DashboardHome
            upcomingAppointments={upcomingAppointments}
            loadingAppointments={loadingAppointments}
            getGreetingTime={getGreetingTime}
            setActiveSection={setActiveSection}
            activePrescriptionCount={activePrescriptionCount}
            completedAppointmentCount={completedAppointmentCount}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Global Video Call Component for Patients */}
      {userRole === 'patient' && userId && (
        <PatientVideoCallButton userId={String(userId)} />
      )}

      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSectionWithRoute}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onLogout={handleLogout} setActiveSection={setActiveSectionWithRoute} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Hasta Dashboard Ana Sayfası
function DashboardHome({ theme, upcomingAppointments, loadingAppointments, healthMetrics, getGreetingTime, setActiveSection, activePrescriptionCount = 0, completedAppointmentCount = 0 }: any) {
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
  } catch { }

  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Array<{ text: string, timestamp: number }>>([]);
  const [searchFilter, setSearchFilter] = useState<string>('all');
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
  } catch { }

  // Mount olduğunda localStorage'dan yükle
  useEffect(() => {
    // userRole'a göre doğru localStorage anahtarını kullan
    const userStr = localStorage.getItem('user');
    let currentUserRole = 'patient';
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        currentUserRole = userObj.role || 'patient';
      } catch (err) {
        console.error("User parse hatası:", err);
      }
    }

    const localStorageKey = `recentSearches_${currentUserRole}`;
    const savedSearches = localStorage.getItem(localStorageKey);

    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (err) {
        console.error("JSON parse hatası:", err);
        setRecentSearches([]);
      }
    } else {
      // localStorage'da veri yoksa state'i boş yap
      setRecentSearches([]);
    }
  }, []);




  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();

    // Geçersiz tarih kontrolü
    if (isNaN(diffInMs) || diffInMs < 0) {
      return 'Az önce';
    }

    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} saat önce`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} gün önce`;
    }
  };

  // Filtrelenmiş aramaları hesapla
  const getFilteredSearches = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate());
    const yearAgo = new Date(today.getFullYear() - 1, now.getMonth(), now.getDate());

    return recentSearches.filter(search => {
      const searchDate = new Date(search.timestamp);

      switch (searchFilter) {
        case 'today':
          return searchDate >= today;
        case 'yesterday':
          return searchDate >= yesterday && searchDate < today;
        case 'week':
          return searchDate >= weekAgo;
        case 'month':
          return searchDate >= monthAgo;
        case 'year':
          return searchDate >= yearAgo;
        default:
          return true;
      }
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Video Görüşme Bileşeni - Dashboard'a taşındı */}

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className="text-2xl font-bold">{activePrescriptionCount}</p>
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
              <p className="text-2xl font-bold">{completedAppointmentCount}</p>
              <p className="text-sm text-muted-foreground">Toplam Muayene</p>
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
                <div><b>Hastane:</b> {selectedAppointment.hospital_name || '-'}</div>
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
          {/* Hızlı İşlemler */}
          <Card className="p-6 transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                onClick={() => setActiveSection('doctor-search')}
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Doktor Ara</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-green-50 hover:border-green-300 transition-colors"
                onClick={() => setActiveSection('appointments')}
              >
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Randevu Al</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                onClick={() => setShowHistoryModal(true)}
              >
                <History className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">Geçmiş Aramalar</span>
              </Button>
            </div>
          </Card>
          {/* Geçmiş Aramalar Modal */}
          <Dialog open={showHistoryModal} onOpenChange={(open) => {
            if (!open) {
              setShowHistoryModal(false);
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&>button]:hidden"
              onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Geçmiş Aramalar</DialogTitle>
              </DialogHeader>

              {/* Filtre Butonları */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={searchFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilter('all')}
                >
                  Tümü
                </Button>
                <Button
                  variant={searchFilter === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilter('today')}
                >
                  Bugün
                </Button>
                <Button
                  variant={searchFilter === 'yesterday' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilter('yesterday')}
                >
                  Dün
                </Button>
                <Button
                  variant={searchFilter === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilter('week')}
                >
                  Bu Hafta
                </Button>
                <Button
                  variant={searchFilter === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilter('month')}
                >
                  Bu Ay
                </Button>
                <Button
                  variant={searchFilter === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilter('year')}
                >
                  Bu Yıl
                </Button>
              </div>

              <div className="py-4">
                {getFilteredSearches().length > 0 ? (
                  <div className="space-y-3">
                    {getFilteredSearches().map((search, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{search.text}</div>
                            <div className="text-sm text-gray-500">{formatDate(search.timestamp)}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Arama yapmak için topbar'daki search fonksiyonunu tetikle
                            window.dispatchEvent(new CustomEvent('setSearchValue', {
                              detail: { value: search.text }
                            }));
                            setShowHistoryModal(false);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Tekrar Ara
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{searchFilter === 'all' ? 'Henüz arama geçmişi yok' : 'Bu filtrede arama bulunamadı'}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    // userRole'a göre doğru localStorage anahtarını kullan
                    const userStr = localStorage.getItem('user');
                    let currentUserRole = 'patient';
                    if (userStr) {
                      try {
                        const userObj = JSON.parse(userStr);
                        currentUserRole = userObj.role || 'patient';
                      } catch (err) {
                        console.error("User parse hatası:", err);
                      }
                    }

                    const localStorageKey = `recentSearches_${currentUserRole}`;
                    setRecentSearches([]);
                    localStorage.removeItem(localStorageKey);
                    // Modal'ın kapanmaması için bu satırı kaldırıyorum
                    // setShowHistoryModal(false);
                  }}
                  disabled={recentSearches.length === 0}
                >
                  Aramaları Temizle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowHistoryModal(false);
                  }}
                >
                  Kapat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
}