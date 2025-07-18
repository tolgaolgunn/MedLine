import React, { useState } from 'react';
import '../../styles.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) {
      setError('Lütfen e-mail adresinizi giriniz!');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3005/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Eğer e-mail mevcutsa bir sıfırlama bağlantısı gönderilmiştir.');
      } else {
        setError(data.error || data.message);
      }
    } catch {
      setError('Sunucuya bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box" style={{width: '600px', boxSizing: 'border-box', padding: '50px 55px', borderRadius: '18px', boxShadow: '0 4px 32px 0 rgba(60,60,100,0.10)', marginTop: '100px', marginBottom: '160px', background: 'white', overflow: 'visible'}}>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: 30}}>
          <span style={{fontSize: '1.2rem', color: '#145a8a',
             fontWeight: 400, letterSpacing: 1 , fontStyle: 'italic'}}>Şifremi Unuttum</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>{loading ? 'Gönderiliyor...' : 'Sıfırlama e-postasını gönder'}</button>
          <div className="register-link">
            <a href="/login">Giriş Yap</a>
          </div>
          {error && <div style={{color:'red',marginTop:10}}>{error}</div>}
          {success && <div style={{color:'green',marginTop:10}}>{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword; 