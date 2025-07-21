import React, { useState, useEffect } from 'react';
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
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'patient') {
      setLoadingDoctors(true);
      fetch('http://localhost:3005/api/doctors')
        .then(res => res.json())
        .then(data => setDoctors(data))
        .catch(() => setDoctors([]))
        .finally(() => setLoadingDoctors(false));
    }
  }, [role]);

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

  // Filtrelenmiş doktorlar
  const filteredDoctors = doctors.filter(doc => {
    const q = search.toLowerCase();
    return (
      doc.full_name.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.city.toLowerCase().includes(q) ||
      doc.district.toLowerCase().includes(q) ||
      (doc.hospital_name || '').toLowerCase().includes(q)
    );
  });

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
            {/* Admin menüsü */}
            {role === 'admin' && (
              <li>
                <a href="#" onClick={() => navigate('/admin/add-doctor')} style={{color: '#1976d2', fontWeight: 'bold'}}>
                  <span role="img" aria-label="doctor" style={{fontSize: '1.2em'}}>➕</span>
                  <span>Doktor Ekle</span>
                </a>
              </li>
            )}
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
            <input
              type="text"
              placeholder="Ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '80%', minWidth: 60, maxWidth: 120, fontSize: '1em', padding: '4px 8px', borderRadius: 6, border: '1px solid #e3e8f0', color: '#1a237e' }}
            />
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
              {/* Doktorlar Tablosu */}
              <div style={{marginBottom: 32}}>
                <h2 style={{color:'#1976d2', fontWeight:600, marginBottom:12}}>Doktorlar</h2>
                {loadingDoctors ? (
                  <div>Yükleniyor...</div>
                ) : (
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                      <thead>
                        <tr style={{background:'#e3efff'}}>
                          <th style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>Ad Soyad</th>
                          <th style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>Uzmanlık</th>
                          <th style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>Şehir</th>
                          <th style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>İlçe</th>
                          <th style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>Hastane</th>
                          <th style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>Randevu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctors.length === 0 ? (
                          <tr><td colSpan={6} style={{textAlign:'center', padding:16, color:'#1a237e'}}>Kayıtlı doktor bulunamadı.</td></tr>
                        ) : filteredDoctors.map((doc) => (
                          <tr key={doc.user_id}>
                            <td style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>{doc.full_name}</td>
                            <td style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>{doc.specialty}</td>
                            <td style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>{doc.city}</td>
                            <td style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>{doc.district}</td>
                            <td style={{padding:8, border:'1px solid #e3e8f0', color:'#1a237e'}}>{doc.hospital_name}</td>
                            <td style={{padding:8, border:'1px solid #e3e8f0', textAlign:'center'}}>
                              <button style={{background:'#1976d2', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontWeight:'bold', cursor:'pointer'}} onClick={() => navigate(`/appointment/${doc.user_id}`)}>Randevu Al</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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