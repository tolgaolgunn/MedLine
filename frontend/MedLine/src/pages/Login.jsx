import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles.css';

const EyeIcon = ({ visible }) => visible ? (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a237e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7.5a11.09 11.09 0 0 1 5.17-5.61"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.38 0 2.63-.83 3.16-2.03"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 8.5c-.46 0-.9.08-1.32.21"/><path d="M22.54 6.42A11.09 11.09 0 0 0 12 5c-2.73 0-5.23.99-7.17 2.61"/></svg>
) : (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a237e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
);

const Login = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Lütfen tüm alanları doldurunuz!');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3005/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Login successful!');
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (form.remember) {
          localStorage.setItem('rememberEmail', form.email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
        navigate('/dashboard');
      } else {
        setError(data.message || 'Giriş yapılamadı!');
      }
    } catch {
      setError('Sunucuya bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail');
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail, remember: true }));
    }
  }, []);

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
    '::placeholder': { color: 'black', opacity: 1 }
  };

  return (
    <div className="login-container" style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e3efff', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: '60px 0', overflowY: 'auto' }}>
      <div className="login-box" style={{ width: '450px', boxSizing: 'border-box', padding: '48px 36px', borderRadius: '18px', boxShadow: '0 4px 32px 0 rgba(60,60,100,0.10)', marginTop: '100px', marginBottom: '160px', background: 'white', overflow: 'visible' }}>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: 30}}>
          <span style={{fontSize: '1.2rem', color: '#222', fontWeight: 400, letterSpacing: 1 , fontStyle: 'italic'}}>LOGIN</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} autoComplete="off" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ ...inputStyle, paddingRight: '40px' }}
                autoComplete="off"
              />
              <span
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: 0, bottom: 0, margin: 'auto', cursor: 'pointer', fontSize: 20, color: '#1a237e', background: 'none', border: 'none', padding: 0, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                <EyeIcon visible={showPassword} />
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 0 10px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: '#333', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="remember"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                style={{ width: 18, height: 18, borderRadius: '50%', accentColor: '#1976d2', marginRight: 6 }}
              />
              Beni Hatırla
            </label>
            <a href="/forgot-password" className="forgot-password" style={{ color: '#1976d2', fontSize: 15, textDecoration: 'underline', fontWeight: 500, marginLeft: 10, marginRight: 0 }}>Şifremi unuttum</a>
          </div>
          <button type="submit" className="login-btn" disabled={loading} style={{...inputStyle, width: '100%', marginBottom: 0, background: 'linear-gradient(90deg, #2196f3 0%, #21cbf3 100%)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer'}}>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</button>
          <div style={{textAlign: 'center', marginTop: '32px'}}>
            <span style={{fontSize: '15px', color: '#444'}}>Hesabınız yok mu?</span>
            <button
              type="button"
              onClick={() => navigate('/register')}
              style={{
                marginLeft: '10px',
                background: 'none',
                border: 'none',
                color: '#1976d2',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Kayıt Ol
            </button>
          </div>
          {error && <div style={{color:'red',marginTop:10, textAlign: 'center'}}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login; 