import React, { useState } from 'react';
import '../../styles.css';

// Şifre kuralları
const passwordRules = [
  { test: (pw) => /[A-Z]/.test(pw), message: 'En az bir büyük harf içermelidir.' },
  { test: (pw) => /[a-z]/.test(pw), message: 'En az bir küçük harf içermelidir.' },
  { test: (pw) => /[0-9]/.test(pw), message: 'En az bir rakam içermelidir.' },
  { test: (pw) => pw.length >= 8, message: 'En az 8 karakterden oluşmalıdır.' },
  { test: (pw) => !/[çğıöşüÇĞİÖŞÜ]/.test(pw), message: 'Türkçe karakter içermemelidir.' },
  { test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw), message: 'En az bir özel karakter içermelidir.' }
];

function getPasswordErrors(pw) {
  return passwordRules.filter(rule => !rule.test(pw)).map(rule => rule.message);
}

const EyeIcon = ({ visible }) => visible ? (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
) : (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7.5a11.09 11.09 0 0 1 5.17-5.61"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.38 0 2.63-.83 3.16-2.03"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 8.5c-.46 0-.9.08-1.32.21"/><path d="M22.54 6.42A11.09 11.09 0 0 0 12 5c-2.73 0-5.23.99-7.17 2.61"/></svg>
);

const ChangePassword = () => {
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const passwordErrors = getPasswordErrors(form.newPassword);
  const passwordsMatch = form.newPassword === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!passwordsMatch || passwordErrors.length > 0) {
      setError('Şifre kurallarına uyulmalı ve şifreler eşleşmelidir!');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3005/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Şifre başarıyla değiştirildi!');
        setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Şifre değiştirme başarısız!');
      }
    } catch {
      setError('Sunucuya bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{display: 'flex', alignItems: 'center', marginBottom: 30}}>
          <span style={{fontSize: '2.1rem',color: '#145a8a', fontWeight: 400, letterSpacing: 1 , fontStyle: 'italic'}}>Şifre Değiştir</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="oldPassword">Şimdiki şifre</label>
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
              <input
                type={showOldPassword ? 'text' : 'password'}
                id="oldPassword"
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                required
                style={{background:'#fff',color:'#111', width:'100%', paddingRight:'38px', boxSizing:'border-box'}}
                autoComplete="off"
              />
              <span
                onClick={() => setShowOldPassword(v => !v)}
                style={{ position: 'absolute', right: 8, top: 0, bottom: 0, margin: 'auto', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={showOldPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                <EyeIcon visible={showOldPassword} />
              </span>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">Yeni şifre</label>
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                style={{background:'#fff',color:'#111', width:'100%', paddingRight:'38px', boxSizing:'border-box'}}
                autoComplete="off"
              />
              <span
                onClick={() => setShowNewPassword(v => !v)}
                style={{ position: 'absolute', right: 8, top: 0, bottom: 0, margin: 'auto', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={showNewPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                <EyeIcon visible={showNewPassword} />
              </span>
            </div>
            {(form.newPassword && passwordErrors.length > 0) && (
              <ul style={{color: 'red', fontSize: '13px', margin: '8px 0 0 0', paddingLeft: '18px'}}>
                {passwordErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Şifreyi doğrula</label>
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                style={{background:'#fff',color:'#111', width:'100%', paddingRight:'38px', boxSizing:'border-box'}}
                autoComplete="off"
              />
              <span
                onClick={() => setShowConfirmPassword(v => !v)}
                style={{ position: 'absolute', right: 8, top: 0, bottom: 0, margin: 'auto', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                <EyeIcon visible={showConfirmPassword} />
              </span>
            </div>
            {(form.confirmPassword && !passwordsMatch) && (
              <div style={{color:'red',fontSize:'13px',marginTop:6}}>Şifreler eşleşmiyor.</div>
            )}
          </div>
          <button type="submit" style={{width:'100%', fontSize:'1.1 rem', padding:'12px 19px', marginTop:'15px'}} className="login-btn" disabled={loading}>{loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}</button>
          {error && <div style={{color:'red',marginTop:10}}>{error}</div>}
          {success && <div style={{color:'green',marginTop:10}}>{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default ChangePassword; 