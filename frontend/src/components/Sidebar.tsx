import { Button } from './ui/button';
import { 
  User,Heart,Calendar, Pill, Settings,ChevronLeft,ChevronRight,
  Stethoscope,FileText,BarChart3,MessageSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';

export interface SidebarProps {
  readonly activeSection: string;
  readonly setActiveSection: (section: string) => void;
  readonly isCollapsed: boolean;
  readonly setIsCollapsed: (collapsed: boolean) => void;
  readonly onLogout?: () => void;
  readonly userRole?: 'admin' | 'doctor' | 'patient';
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({ activeSection, setActiveSection, isCollapsed, setIsCollapsed, onLogout, userRole: userRoleProp }: SidebarProps) {
  const [userRole, setUserRole] = useState<string>(userRoleProp || 'patient');

  // Prefer explicit prop from layout; otherwise read from localStorage
  useEffect(() => {
    if (userRoleProp) {
      setUserRole(userRoleProp);
      return;
    }
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        setUserRole(userObj.role || 'patient');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, [userRoleProp]);

  // Menu items for patients
  const patientMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: Heart },
    { id: 'ai-diagnosis', label: 'AI Ön Tanı', icon: Stethoscope },
    { id: 'doctor-search', label: 'Doktor Ara', icon: User },
    { id: 'appointments', label: 'Randevular', icon: Calendar },
    { id: 'medical-records', label: 'Tıbbi Kayıtlar', icon: FileText },
    { id: 'prescriptions', label: 'Reçeteler', icon: Pill },
    { id: 'feedback', label: 'Geri Bildirim', icon: MessageSquare },
  ];

  // Menu items for doctors
  const doctorMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: Heart },
    { id: 'appointments', label: 'Randevular', icon: Calendar },
    { id: 'patients', label: 'Hasta Yönetimi', icon: User },
    { id: 'reports', label: 'Raporlar', icon: BarChart3 },
    { id: 'feedback', label: 'Geri Bildirim', icon: MessageSquare },
    { id:'prescriptions', label: 'Reçeteler', icon: Pill },
  ];

  // Menu items for admins (must match AdminLayout sections)
  const adminMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: Heart },
    { id: 'user-management', label: 'Kullanıcı Yönetimi', icon: User },
    { id: 'doctors', label: 'Doktor Yönetimi', icon: Stethoscope },
    { id: 'patients', label: 'Hasta Yönetimi', icon: User },
    { id: 'patient-approvals', label: 'Hasta Onayları', icon: Stethoscope },
    { id: 'statistics', label: 'İstatistikler', icon: BarChart3 },
    { id: 'system-controls', label: 'Sistem Kontrolleri', icon: FileText },
    { id: 'complaints', label: 'Geri Bildirim', icon: MessageSquare },
    { id: 'system-settings', label: 'Sistem Ayarları', icon: Settings },
  ];

  // Use appropriate menu items based on user role
  let menuItems: MenuItem[];
  if (userRole === 'admin') {
    menuItems = adminMenuItems;
  } else if (userRole === 'doctor') {
    menuItems = doctorMenuItems;
  } else {
    menuItems = patientMenuItems;
  }

return (
    <div className={`bg-card border-r border-border transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
                     {!isCollapsed ? (
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                 <Heart className="w-5 h-5 text-primary-foreground" />
               </div>
               <span className="font-semibold">MedLine</span>
             </div>
           ) : (
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
               <Heart className="w-5 h-5 text-primary-foreground" />
             </div>
           )}
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="p-2"
           >
             {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
           </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'}`}
              onClick={() => setActiveSection(item.id)}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {userRole !== 'admin' && (
        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'}`}
          onClick={() => {
            setActiveSection('settings');
          }}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Ayarlar</span>}
        </Button>
      )}
    </div>
  );
}

