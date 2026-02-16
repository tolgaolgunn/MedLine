import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { Topbar } from '../Topbar';
import getSocket from '../../lib/socket';

const DoctorLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // URL'ye göre aktif section'ı güncelle
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/doctor/dashboard')) {
      setActiveSection('dashboard');
    } else if (path.includes('/doctor/appointments')) {
      setActiveSection('appointments');
    } else if (path.includes('/doctor/patients')) {
      setActiveSection('patients');
    } else if (path.includes('/doctor/prescriptions')) {
      setActiveSection('prescriptions');
    } else if (path.includes('/doctor/reports')) {
      setActiveSection('reports');
    } else if (path.includes('/doctor/feedback')) {
      setActiveSection('feedback');
    } else if (path.includes('/doctor/profile')) {
      setActiveSection('profile');
    } else if (path.includes('/doctor/notifications')) {
      setActiveSection('notifications');
    } else if (path.includes('/doctor/settings')) {
      setActiveSection('settings');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSectionChange = (section: string) => {
    console.log('handleSectionChange çağrıldı:', section);
    setActiveSection(section);
    switch (section) {
      case 'dashboard':
        navigate('/doctor/dashboard');
        break;
      case 'appointments':
        navigate('/doctor/appointments', { state: { from: '/doctor/dashboard' } });
        break;
      case 'patients':
        navigate('/doctor/patients', { state: { from: '/doctor/dashboard' } });
        break;
      case 'prescriptions':
        navigate('/doctor/prescriptions', { state: { from: '/doctor/dashboard' } });
        break;
      case 'reports':
        navigate('/doctor/reports', { state: { from: '/doctor/dashboard' } });
        break;
      case 'feedback':
        navigate('/doctor/feedback', { state: { from: '/doctor/dashboard' } });
        break;
      case 'profile':
        navigate('/doctor/profile', { state: { from: '/doctor/dashboard' } });
        break;
      case 'notifications':
        navigate('/doctor/notifications', { state: { from: '/doctor/dashboard' } });
        break;
      case 'settings':
        navigate('/doctor/settings', { state: { from: '/doctor/dashboard' } });
        break;
      default:
        console.log('Unknown section:', section);
    }
  };

  // Socket üzerinden odaya katıl (WebRTC ve bildirimler için)
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userId = user.user_id || user.id; // user_id anahtarını backend login cevabına göre ayarlayın

        if (userId) {
          // Socket'i başlat ve odaya katıl
          const socket = getSocket();

          if (!socket.connected) {
            socket.connect();
          }

          console.log("DoctorLayout: Joining socket room:", userId);
          socket.emit('join', userId);
        }
      } catch (e) {
        console.error("DoctorLayout: Error parsing user for socket join:", e);
      }
    }
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar onLogout={handleLogout} setActiveSection={handleSectionChange} />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout; 