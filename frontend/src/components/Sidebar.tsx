import { Button } from './ui/button';
import { useTheme } from './ThemeProvider';
import { 
  User,Heart,Calendar, Pill, MessageSquare, Bell, Settings,LogOut,Menu,X,
  Stethoscope,FileText,Package,Sun,Moon,Monitor,BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';

export interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onLogout?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({ activeSection, setActiveSection, isCollapsed, setIsCollapsed, onLogout }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [userRole, setUserRole] = useState<string>('patient');

  // Get user role from localStorage
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
    { id: 'feedback', label: 'Geri Bildirim', icon: MessageSquare },
    { id: 'reports', label: 'Raporlar', icon: BarChart3 },
  ];

  // Use appropriate menu items based on user role
  const menuItems = userRole === 'doctor' ? doctorMenuItems : patientMenuItems;

  const getThemeIcon = (): React.ComponentType<{ className?: string }> => {
    switch (theme) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      default:
        return Monitor;
    }
  };

  const getThemeLabel = (): string => {
    switch (theme) {
      case 'light':
        return 'Açık Tema';
      case 'dark':
        return 'Koyu Tema';
      default:
        return 'Sistem Teması';
    }
  };

  const cycleTheme = (): void => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <div className={`bg-card border-r border-border transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">MedLine</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
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
              className={`w-full justify-start gap-3 ${isCollapsed ? 'px-2' : 'px-3'}`}
              onClick={() => setActiveSection(item.id)}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      <Button
        variant="ghost"
        className={`w-full justify-start gap-3 ${isCollapsed ? 'px-2' : 'px-3'}`}
        onClick={() => setActiveSection('settings')}
      >
        <Settings className="w-4 h-4 flex-shrink-0" />
        {!isCollapsed && <span>Ayarlar</span>}
      </Button>
    </div>
  );
}

export default Sidebar;