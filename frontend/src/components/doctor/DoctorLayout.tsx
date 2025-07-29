import React from 'react';
import { Outlet } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';

const DoctorLayout: React.FC = () => {
  const handleLogout = () => {
    // Handle logout logic
    console.log('Logout clicked');
  };

  const setActiveSection = (section: string) => {
    // Handle section change logic
    console.log('Section changed to:', section);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <DoctorSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Simple Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">MedLine Doktor Paneli</h1>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">Bildirimler</button>
              <button className="text-gray-600 hover:text-gray-900">Profil</button>
              <button 
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout; 