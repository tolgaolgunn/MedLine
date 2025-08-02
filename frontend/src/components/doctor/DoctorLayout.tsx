import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { Topbar } from '../Topbar';

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
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    switch (section) {
      case 'dashboard':
        navigate('/doctor/dashboard');
        break;
      case 'appointments':
        navigate('/doctor/appointments');
        break;
      case 'patients':
        navigate('/doctor/patients');
        break;
      case 'prescriptions':
        navigate('/doctor/prescriptions');
        break;
      case 'reports':
        navigate('/doctor/reports');
        break;
      case 'feedback':
        navigate('/doctor/feedback');
        break;
      case 'profile':
        navigate('/doctor/profile');
        break;
      case 'notifications':
        navigate('/doctor/notifications');
        break;
      default:
        console.log('Unknown section:', section);
    }
  };

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