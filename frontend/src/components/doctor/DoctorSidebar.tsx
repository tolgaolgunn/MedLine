import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Pill, 
  Stethoscope,
  Settings,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';

const DoctorSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/doctor/dashboard',
      description: 'Ana panel'
    },
    {
      title: 'Hasta Yönetimi',
      icon: Users,
      path: '/doctor/patients',
      description: 'Hastaları yönet'
    },
    {
      title: 'Randevular',
      icon: Calendar,
      path: '/doctor/appointments',
      description: 'Randevu yönetimi'
    },
    {
      title: 'Reçeteler',
      icon: Pill,
      path: '/doctor/prescriptions',
      description: 'Reçete yönetimi'
    },
    {
      title: 'Tıbbi Kayıtlar',
      icon: FileText,
      path: '/doctor/records',
      description: 'Hasta kayıtları'
    },
    {
      title: 'Raporlar',
      icon: BarChart3,
      path: '/doctor/reports',
      description: 'Raporlar ve analizler'
    }
  ];

  const bottomMenuItems = [
    {
      title: 'Bildirimler',
      icon: Bell,
      path: '/doctor/notifications',
      description: 'Bildirimler'
    },
    {
      title: 'Profil',
      icon: User,
      path: '/doctor/profile',
      description: 'Profil ayarları'
    },
    {
      title: 'Ayarlar',
      icon: Settings,
      path: '/doctor/settings',
      description: 'Sistem ayarları'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-gray-900">MedLine</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500'}`} />
            {!collapsed && (
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            )}
          </Link>
        ))}
      </nav>

      <Separator />

      {/* Bottom Navigation */}
      <nav className="p-4 space-y-2">
        {bottomMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500'}`} />
            {!collapsed && (
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Çıkış Yap</span>}
        </Button>
      </div>
    </div>
  );
};

export default DoctorSidebar; 