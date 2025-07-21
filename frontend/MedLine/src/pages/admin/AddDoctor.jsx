import React, { useState } from 'react';
import '../../../styles.css';

const AddDoctor = () => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    specialty: '',
    license_number: '',
    experience_years: '',
    biography: '',
    city: '',
    district: '',
    hospital_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3005/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: 'doctor',
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Doktor başarıyla eklendi!');
        setForm({
          full_name: '', email: '', password: '', confirmPassword: '', phone_number: '',
          specialty: '', license_number: '', experience_years: '', biography: '', city: '', district: '', hospital_name: ''
        });
      } else {
        setError(data.message || 'Doktor eklenemedi!');
      }
    } catch {
      setError('Sunucuya bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'white',
    color: 'black',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '10px',
    width: '100%',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '10px',
  };

  return (
    <div className="login-container" style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e3efff', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: '60px 0', overflowY: 'auto' }}>
      <div className="login-box" style={{ width: '480px', boxSizing: 'border-box', padding: '48px 36px', borderRadius: '18px', boxShadow: '0 4px 32px 0 rgba(60,60,100,0.10)', marginTop: '100px', marginBottom: '160px', background: 'white', overflow: 'visible' }}>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: 30}}>
          <span style={{fontSize: '1.2rem', color: '#222', fontWeight: 400, letterSpacing: 1 , fontStyle: 'italic'}}>DOKTOR EKLE</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
            {/* 1. Satır: Temel Bilgiler */}
            <div style={{ flex: 1 }}>
              <div className="form-group">
                <label htmlFor="full_name">Ad Soyad</label>
                <input type="text" id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required style={inputStyle} />
              </div>
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} />
              </div>
              <div className="form-group">
                <label htmlFor="password">Şifre</label>
                <input type="password" id="password" name="password" value={form.password} onChange={handleChange} required style={inputStyle} />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Şifre Tekrar</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required style={inputStyle} />
              </div>
              <div className="form-group">
                <label htmlFor="phone_number">Telefon Numarası</label>
                <input type="text" id="phone_number" name="phone_number" value={form.phone_number} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
            {/* 2. Satır: Mesleki Bilgiler ve Adres */}
            <div style={{ flex: 1 }}>
              <div className="form-group">
                <label htmlFor="specialty">Uzmanlık</label>
                <input type="text" id="specialty" name="specialty" value={form.specialty} onChange={handleChange} required style={inputStyle} />
              </div>
              <div className="form-group">
                <label htmlFor="license_number">Lisans Numarası</label>
                <input type="text" id="license_number" name="license_number" value={form.license_number} onChange={handleChange} required style={inputStyle} />
              </div>
              <div className="form-group">
                <label htmlFor="experience_years">Deneyim (Yıl)</label>
                <input type="number" id="experience_years" name="experience_years" value={form.experience_years} onChange={handleChange} min="0" style={inputStyle} />
              </div>
              <div className="form-group">
                <label htmlFor="biography">Biyografi</label>
                <textarea id="biography" name="biography" value={form.biography} onChange={handleChange} style={{...inputStyle, minHeight: 60}} />
              </div>
              <div className="form-group">
                <label htmlFor="city">Şehir</label>
                <input type="text" id="city" name="city" value={form.city} onChange={handleChange} required style={inputStyle} />
              </div>
              <div className="form-group">
                <label htmlFor="district">İlçe</label>
                <input type="text" id="district" name="district" value={form.district} onChange={handleChange} required style={inputStyle} />
              </div>
              <div className="form-group">
                <label htmlFor="hospital_name">Hastane Adı</label>
                <input type="text" id="hospital_name" name="hospital_name" value={form.hospital_name} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>
          <button type="submit" className="login-btn" disabled={loading} style={{...inputStyle, width: '100%', marginBottom: 0, background: 'linear-gradient(90deg, #2196f3 0%, #21cbf3 100%)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer'}}>{loading ? 'Ekleniyor...' : 'Doktoru Ekle'}</button>
          {error && <div style={{color:'red',marginTop:10, textAlign: 'center'}}>{error}</div>}
          {success && <div style={{color:'green',marginTop:10, textAlign: 'center'}}>{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default AddDoctor; 