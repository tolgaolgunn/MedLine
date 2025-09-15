import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { Topbar } from '../Topbar';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import DoctorManagement from './DoctorManagement';
import PatientManagement from './PatientManagement';
import PatientApprovals from './PatientApprovals';
import Statistics from './Statistics';
import SystemControls from './SystemControls';
import Complaints from './Complaints';
import SystemSettings from './SystemSettings';
import AdminProfile from './AdminProfile';

const AdminLayout: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Admin kontrolü
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!token || user.role !== 'admin') {
      alert('Admin yetkisi gerekli!');
      navigate('/');
      return;
    }
  }, [navigate]);

  // URL'den aktif section'ı al
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin')) {
      const section = path.split('/').pop() || 'dashboard';
      setActiveSection(section);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleSectionChange = (section: string) => {
    setIsLoading(true);
    setActiveSection(section);
    
    // URL'i React Router ile güncelle
    navigate(`/admin/${section}`);
    
    // Loading state'ini kısa süre sonra kaldır
    setTimeout(() => setIsLoading(false), 300);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Sayfa yükleniyor...</p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'user-management':
        return <UserManagement />;
      case 'doctors':
        return <DoctorManagement />;
      case 'patients':
        return <PatientManagement />;
      case 'patient-approvals':
        return <PatientApprovals />;
      case 'statistics':
        return <Statistics />;
      case 'system-controls':
        return <SystemControls />;
      case 'complaints':
        return <Complaints />;
      case 'system-settings':
        return <SystemSettings />;
      case 'profile':
        return <AdminProfile />;
      case 'notifications':
        return (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">Bildirimler</h1>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Bildirimler</h3>
                  <p className="text-gray-600">Bildirimler sayfası geliştirilecek...</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onLogout={handleLogout} setActiveSection={handleSectionChange} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

