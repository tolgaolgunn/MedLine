import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UpdateProfile from './UpdateProfile';
import ChangePassword from './ChangePassword';
import '../../dashboard.css';
import '../../styles.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedMenu, setSelectedMenu] = useState('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSubMenu, setSettingsSubMenu] = useState('');

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleMenuClick = (menu) => {
    setSelectedMenu(menu);
    setSettingsSubMenu('');
    setSettingsOpen(false);
  };

  const handleSettingsClick = (e) => {
    e.preventDefault();
    setSettingsOpen((prev) => !prev);
    setSelectedMenu('settings');
    setSettingsSubMenu('');
  };

  const handleSettingsSubMenu = (submenu) => {
    setSettingsSubMenu(submenu);
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="logo">
          <i className="fas fa-heartbeat"></i>
          <span>MedLine</span>
        </div>
        <nav>
          <ul>
            <li className={selectedMenu === 'home' ? 'active' : ''}>
              <a href="#" onClick={() => handleMenuClick('home')}>
                <span role="img" aria-label="home" style={{fontSize: '1.2em'}}>🏠</span>
                <span>Home</span>
              </a>
            </li>
            <li className={selectedMenu === 'patients' ? 'active' : ''}>
              <a href="#" onClick={() => handleMenuClick('patients')}>
                <span role="img" aria-label="doctor" style={{fontSize: '1.2em'}}>🩺</span>
                <span>Patient Tracking</span>
              </a>
            </li>
            <li className={selectedMenu === 'appointments' ? 'active' : ''}>
              <a href="#" onClick={() => handleMenuClick('appointments')}>
                <span role="img" aria-label="calendar" style={{fontSize: '1.2em'}}>📅</span>
                <span>Appointments</span>
              </a>
            </li>
            <li className={selectedMenu === 'files' ? 'active' : ''}>
              <a href="#" onClick={() => handleMenuClick('files')}>
                <span role="img" aria-label="files" style={{fontSize: '1.2em'}}>📁</span>
                <span>Files</span>
              </a>
            </li>
            <li className={selectedMenu === 'settings' ? 'active' : ''}>
              <a href="#" onClick={handleSettingsClick}>
                <span role="img" aria-label="settings" style={{fontSize: '1.2em'}}>⚙️</span>
                <span>Settings</span>
                <span style={{marginLeft: 8, fontSize: 12}}>{settingsOpen ? '▲' : '▼'}</span>
              </a>
              {settingsOpen && (
                <ul className="sidebar-submenu">
                  <li className={settingsSubMenu === 'profile' ? 'active' : ''}>
                    <a href="#" onClick={() => handleSettingsSubMenu('profile')}>Update Profile</a>
                  </li>
                  <li className={settingsSubMenu === 'password' ? 'active' : ''}>
                    <a href="#" onClick={() => handleSettingsSubMenu('password')}>Change Password</a>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
        <div className="logout">
          <a href="/login" onClick={handleLogout}>
            <span role="img" aria-label="logout" style={{fontSize: '1.2em', marginRight: 8}}>🚶‍</span>
            <span>Logout</span>
          </a>
        </div>
      </div>
      <div className="main-content">
        <div className="topbar">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search..." />
          </div>
          <div className="user-profile">
            <div className="notifications">
              <span role="img" aria-label="bell" style={{fontSize: '1.3em'}}>🔔</span>
              <span className="badge">3</span>
            </div>
            <div className="user-info">
              <span
                role="img"
                aria-label="user"
                style={{
                  display: 'inline-block',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2.5px solid #e67e22',
                  fontSize: '1.7em',
                  textAlign: 'center',
                  lineHeight: '40px'
                }}
              >
                👤
              </span>
              <span className="username">Admin User</span>
            </div>
          </div>
        </div>
        <div className="dashboard-content">
          {selectedMenu === 'settings' && settingsSubMenu === 'profile' && (
            <UpdateProfile />
          )}
          {selectedMenu === 'settings' && settingsSubMenu === 'password' && (
            <ChangePassword />
          )}
          {selectedMenu === 'home' && !settingsOpen && (
            <div className="dashboard-row">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Total Patients</h3>
                    <p>1,245</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Today's Appointments</h3>
                    <p>15</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-file-medical-alt"></i>
                  </div>
                  <div className="stat-info">
                    <h3>New Files</h3>
                    <p>7</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-clipboard-list"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Total Appointments</h3>
                    <p>548</p>
                  </div>
                </div>
              </div>
              <div className="appointments-section dashboard-appointments-inline">
                <h2>Recent Appointments</h2>
                <div className="appointments-grid">
                  <div className="appointment-card">
                    <div className="appointment-info">
                      <h3>Ali Veli</h3>
                      <p className="date">July 10, 2025, 14:00</p>
                      <p className="status pending">Pending</p>
                    </div>
                  </div>
                  <div className="appointment-card">
                    <div className="appointment-info">
                      <h3>Ayşe Yılmaz</h3>
                      <p className="date">July 10, 2025, 15:00</p>
                      <p className="status completed">Completed</p>
                    </div>
                  </div>
                  <div className="appointment-card">
                    <div className="appointment-info">
                      <h3>Hasan Uğur</h3>
                      <p className="date">July 11, 2025, 10:00</p>
                      <p className="status pending">Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedMenu !== 'settings' && selectedMenu !== 'home' && (
            <div className="coming-soon-message" style={{textAlign:'center',marginTop:40}}>
              <h2>Coming Soon</h2>
              <p>This section is under construction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 