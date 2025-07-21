import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UpdateProfile from './UpdateProfile';
import ChangePassword from './ChangePassword';
import '../../dashboard.css';
import '../../styles.css';
import { FiBell, FiLogOut } from 'react-icons/fi';

export default function Dashboard() {

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {}
  const role = user?.role || 'patient';

  const [selectedMenu, setSelectedMenu] = useState('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSubMenu, setSettingsSubMenu] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleMenuClick = (menu) => {
    setSelectedMenu(menu);
    setSettingsSubMenu('');
    setSettingsOpen(false);
    setAccountOpen(false);
  };

  const handleSettingsClick = (e) => {
    e.preventDefault();
    setSettingsOpen((prev) => !prev);
    setSelectedMenu('settings');
    setSettingsSubMenu('');
    setAccountOpen(false);
  };

  const handleSettingsSubMenu = (submenu) => {
    setSettingsSubMenu(submenu);
    setAccountOpen(false);
  };

  const handleAccountClick = (e) => {
    e.preventDefault();
    setAccountOpen((prev) => !prev);
    setSettingsSubMenu('');
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="logo">
          <span>MedLine</span>
        </div>
        <div className="sidebar-welcome">
          Hoş geldin, {user?.full_name || 'Kullanıcı'}
        </div>
        <nav style={{marginTop: '0'}}>
          <ul>
            {/* Hasta (patient) menüleri */}
            {role === 'patient' && <>
              <li className={selectedMenu === 'home' ? 'active' : ''}>
                <a href="#" onClick={() => handleMenuClick('home')}>
                  <span role="img" aria-label="home" style={{fontSize: '1.2em'}}>🏠</span>
                  <span>Ana Sayfa</span>
                </a>
              </li>
              <li className={selectedMenu === 'appointments' ? 'active' : ''}>
                <a href="#" onClick={() => handleMenuClick('appointments')}>
                  <span role="img" aria-label="calendar" style={{fontSize: '1.2em'}}>📅</span>
                  <span>Randevularım</span>
                </a>
              </li>
              <li className={selectedMenu === 'ai-diagnosis' ? 'active' : ''}>
                <a href="#" onClick={() => handleMenuClick('ai-diagnosis')}>
                  <span role="img" aria-label="ai" style={{fontSize: '1.2em'}}>🤖</span>
                  <span>AI Ön Tanı</span>
                </a>
              </li>
              <li className={selectedMenu === 'prescriptions' ? 'active' : ''}>
                <a href="#" onClick={() => handleMenuClick('prescriptions')}>
                  <span role="img" aria-label="prescriptions" style={{fontSize: '1.2em'}}>💊</span>
                  <span>Reçetelerim</span>
                </a>
              </li>
            </>}
            {/* Settings menüsü ve altı olduğu gibi kalsın */}
            <li className={selectedMenu === 'settings' ? 'active' : ''}>
              <a href="#" onClick={handleSettingsClick}>
                <span role="img" aria-label="settings" style={{fontSize: '1.2em'}}>⚙️</span>
                <span>Ayarlar</span>
                <span style={{marginLeft: 8, fontSize: 12}}>{settingsOpen ? '▲' : '▼'}</span>
              </a>
              {settingsOpen && (
                <ul className="sidebar-submenu">
                  <li className={settingsSubMenu === 'profile' ? 'active' : ''}>
                    <a href="#" onClick={() => handleSettingsSubMenu('profile')}>Hesap Güncelleme</a>
                  </li>
                  <li>
                    <a href="#" onClick={handleAccountClick}>
                      Hesap Ayarları <span style={{marginLeft: 8, fontSize: 12}}>{accountOpen ? '▲' : '▼'}</span>
                    </a>
                    {accountOpen && (
                      <ul className="sidebar-submenu">
                        <li className={settingsSubMenu === 'account-password' ? 'active' : ''}>
                          <a href="#" onClick={() => setSettingsSubMenu('account-password')}>Şifre Değiştirme</a>
                        </li>
                      </ul>
                    )}
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
      </div>
      <div className="main-content">
        <div className="topbar">
          <div className="search-bar" style={{ minWidth: 120, maxWidth: 180, width: '18vw', marginRight: 18 }}>
            <span role="img" aria-label="search" style={{fontSize: '1.2em'}}>🔍</span>
            <input type="text" placeholder="Ara..." style={{ width: '80%', minWidth: 60, maxWidth: 120, fontSize: '1em', padding: '4px 8px', borderRadius: 6, border: '1px solid #e3e8f0' }} />
          </div>
          <div className="user-profile" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            {/* Bildirim */}
            <div className="notifications" title="Bildirimler">
              <FiBell size={24} style={{ color: '#222', cursor: 'pointer' }} />
              <span className="badge">3</span>
            </div>
         
            {/* Hasta Profili */}
            <div className="profile-topbar" title="Profilim">
              <span role="img" aria-label="user" style={{display: 'inline-block', width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '2.5px solid #fff', fontSize: '1.3em', textAlign: 'center', lineHeight: '36px', color: '#e67e22', cursor: 'pointer'}} onClick={() => { setSelectedMenu('profile'); setSettingsOpen(false); }}>
                👤
              </span>
            </div>
            {/* Logout */}
            <div className="logout-topbar" title="Çıkış Yap">
              <FiLogOut size={24} style={{ color: '#222', cursor: 'pointer' }} onClick={handleLogout} />
            </div>
          </div>
        </div>
        <div className="dashboard-content">
          {/* Ana içerik: seçili menüye göre göster */}
          {role === 'patient' && selectedMenu === 'home' && (
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
          {/* Diğer menüler için örnek içerik */}
          {role === 'patient' && selectedMenu === 'appointments' && (
            <div style={{ color: '#1976d2', fontWeight: 600 }}>Randevularım sayfası (yakında)</div>
          )}
          {role === 'patient' && selectedMenu === 'ai-diagnosis' && (
            <div style={{ color: '#1976d2', fontWeight: 600 }}>AI Ön Tanı sayfası (yakında)</div>
          )}
          {selectedMenu === 'update-profile' && (
            <UpdateProfile />
          )}
          {role === 'patient' && selectedMenu === 'profile' && (
            <div style={{ color: '#1976d2', fontWeight: 600 }}>Profilim sayfası (yakında)</div>
          )}
          {role === 'patient' && selectedMenu === 'prescriptions' && (
            <div style={{ color: '#1976d2', fontWeight: 600 }}>Reçetelerim sayfası (yakında)</div>
          )}
          {/* Settings içeriği ve alt menüleri olduğu gibi kalsın */}
          {selectedMenu === 'settings' && settingsSubMenu === 'profile' && (
            <UpdateProfile />
          )}
          {selectedMenu === 'settings' && settingsSubMenu === 'account-password' && (
            <ChangePassword />
          )}
        </div>
      </div>
    </div>
  );
} 