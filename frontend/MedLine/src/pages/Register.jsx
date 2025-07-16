import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles.css';
import Select from 'react-select';

const countryOptions = [
  { value: 'TR', label: 'Turkey', flag: '🇹🇷', phoneCode: '+90' },
  { value: 'US', label: 'United States', flag: '🇺🇸', phoneCode: '+1' },
  { value: 'GB', label: 'United Kingdom', flag: '🇬🇧', phoneCode: '+44' },
  { value: 'DE', label: 'Germany', flag: '🇩🇪', phoneCode: '+49' },
  { value: 'FR', label: 'France', flag: '🇫🇷', phoneCode: '+33' },
  { value: 'IT', label: 'Italy', flag: '🇮🇹', phoneCode: '+39' },
  { value: 'ES', label: 'Spain', flag: '🇪🇸', phoneCode: '+34' },
  { value: 'NL', label: 'Netherlands', flag: '🇳🇱', phoneCode: '+31' },
  { value: 'CH', label: 'Switzerland', flag: '🇨🇭', phoneCode: '+41' },
  { value: 'AT', label: 'Austria', flag: '🇦🇹', phoneCode: '+43' },
  { value: 'BE', label: 'Belgium', flag: '🇧🇪', phoneCode: '+32' },
  { value: 'SE', label: 'Sweden', flag: '🇸🇪', phoneCode: '+46' },
  { value: 'NO', label: 'Norway', flag: '🇳🇴', phoneCode: '+47' },
  { value: 'DK', label: 'Denmark', flag: '🇩🇰', phoneCode: '+45' },
  { value: 'FI', label: 'Finland', flag: '🇫🇮', phoneCode: '+358' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦', phoneCode: '+1' },
  { value: 'AU', label: 'Australia', flag: '🇦🇺', phoneCode: '+61' },
  { value: 'JP', label: 'Japan', flag: '🇯🇵', phoneCode: '+81' },
  { value: 'KR', label: 'South Korea', flag: '🇰🇷', phoneCode: '+82' },
  { value: 'CN', label: 'China', flag: '🇨🇳', phoneCode: '+86' },
  { value: 'IN', label: 'India', flag: '🇮🇳', phoneCode: '+91' },
  { value: 'BR', label: 'Brazil', flag: '🇧🇷', phoneCode: '+55' },
  { value: 'MX', label: 'Mexico', flag: '🇲🇽', phoneCode: '+52' },
  { value: 'AR', label: 'Argentina', flag: '🇦🇷', phoneCode: '+54' },
  { value: 'RU', label: 'Russia', flag: '🇷🇺', phoneCode: '+7' },
  { value: 'SA', label: 'Saudi Arabia', flag: '🇸🇦', phoneCode: '+966' },
  { value: 'AE', label: 'UAE', flag: '🇦🇪', phoneCode: '+971' },
  { value: 'EG', label: 'Egypt', flag: '🇪🇬', phoneCode: '+20' },
  { value: 'ZA', label: 'South Africa', flag: '🇿🇦', phoneCode: '+27' },
  { value: 'GR', label: 'Greece', flag: '🇬🇷', phoneCode: '+30' }
]; //ülke seçenekleri

const Register = () => {
  const [form, setForm] = useState({
    full_name: '',
    country: 'TR',
    phone_number: '',
    role: 'patient',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState(countryOptions[0]); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Şifre kuralları 
  const passwordRules = [
    { test: (pw) => /[A-Z]/.test(pw), message: 'En az bir büyük harf içermelidir.' },
    { test: (pw) => /[a-z]/.test(pw), message: 'En az bir küçük harf içermelidir.' },
    { test: (pw) => /[0-9]/.test(pw), message: 'En az bir rakam içermelidir.' },
    { test: (pw) => pw.length >= 8, message: 'En az 8 karakterden oluşmalıdır.' },
    { test: (pw) => !/[çğıöşüÇĞİÖŞÜ]/.test(pw), message: 'Türkçe karakter içermemelidir.' },
    { test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw), message: 'En az bir özel karakter içermelidir.' }
  ];

  // Şifre kuralları kontrol fonksiyonu
  const getPasswordErrors = (pw) => {
    return passwordRules.filter(rule => !rule.test(pw)).map(rule => rule.message);
  };

  const passwordErrors = getPasswordErrors(form.password);
  const passwordsMatch = form.password === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.terms) {
      setError('Lütfen kullanm koşullarını ve gizlilik sözleşmesini kabul edin!');
      return;
    }
    if (!passwordsMatch || passwordErrors.length > 0) {
      setError('Şifre kurallarına uyulmalı ve şifreler eşleşmelidir!');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Geçerli bir e-posta adresi girin!');
      return;
    }
    setLoading(true);
    try {
      const fullPhoneNumber = form.phone_number ? `${selectedCountry.phoneCode}${form.phone_number}` : '';
      const response = await fetch('http://localhost:3005/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          phone_number: fullPhoneNumber,
          role: form.role,
          email: form.email,
          password: form.password
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Kayıt olma işlemi başarılı!');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || 'Kayıt olma işlemi başarısız!');
      }
    } catch {
      setError('Sunucuya bağlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
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
    // placeholder rengi için
    '::placeholder': { color: 'black', opacity: 1 }
  };

  const selectStyle = {
    ...inputStyle
  };

  const phoneContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: '10px',
    width: '100%'
  };

  const countrySelectStyle = {
    ...inputStyle,
    width: '100%',
    minWidth: 0,
    maxWidth: 'none',
    marginBottom: 0
  };

  const phoneInputStyle = {
    ...inputStyle,
    width: '100%',
    minWidth: 0,
    maxWidth: 'none',
    marginBottom: 0
  };

  // Sade göz ikonları (SVG)
  const EyeIcon = ({ visible }) => visible ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a237e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7.5a11.09 11.09 0 0 1 5.17-5.61"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.38 0 2.63-.83 3.16-2.03"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 8.5c-.46 0-.9.08-1.32.21"/><path d="M22.54 6.42A11.09 11.09 0 0 0 12 5c-2.73 0-5.23.99-7.17 2.61"/></svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a237e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
  );

  return (
    <div className="login-container" style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e3efff', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, paddingTop: '60px', paddingBottom: '60px', overflowY: 'auto' }}>
      <div className="login-box" style={{ width: '450px', boxSizing: 'border-box', padding: '48px 36px', borderRadius: '18px', boxShadow: '0 4px 32px 0 rgba(60,60,100,0.10)', marginTop: '100px', marginBottom: '100px', background: 'white', overflow: 'visible' }}>
        <h1 style={{fontStyle: 'italic', fontSize: '2.1rem', marginBottom: '10px', color: '#333', textAlign: 'center'}}>MedLine</h1>
        <h2 style={{marginTop: '0', marginBottom: '20px', fontWeight: 'normal', color: '#333', fontSize: '1.4rem'}}>Kayıt ol</h2>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
          <div className="form-group" style={{width: '100%'}}>
            <label htmlFor="full_name">Ad Soyad</label>
            <input type="text" id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required style={inputStyle} autoComplete="off" onInput={e => e.target.value = e.target.value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '')} />
          </div>
          <div className="form-group" style={{width: '100%'}}>
            <label htmlFor="phone_number">Telefon Numarası</label>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <div style={{ width: 160, minWidth: 100 }}>
                <Select
                  options={countryOptions}
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                  getOptionLabel={option => `${option.label} ${option.phoneCode}`}
                  getOptionValue={option => option.value}
                  styles={{
                    control: (base) => ({ ...base, minHeight: 40, fontSize: 15, color: 'black', backgroundColor: 'white' }),
                    menu: (base) => ({ ...base, zIndex: 9999, color: 'black', backgroundColor: 'white' }),
                    option: (base, state) => ({ ...base, fontSize: 15, color: 'black', backgroundColor: state.isFocused ? '#e3efff' : 'white' }),
                    singleValue: (base) => ({ ...base, color: 'black' }),
                  }}
                  isSearchable
                />
              </div>
              <input 
                type="text"
                id="phone_number"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                onInput={e => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                placeholder={``}
                style={{ flex: 1, ...inputStyle, minWidth: 0 }}
                maxLength={15}
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="form-group" style={{width: '100%'}}>
            <label htmlFor="role">Rol</label>
            <select id="role" name="role" value={form.role} onChange={handleChange} required style={selectStyle}>
              <option value="patient">Hasta</option>
              <option value="doctor">Doktor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group" style={{width: '100%'}}>
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} autoComplete="off" />
          </div>
          <div className="form-group" style={{width: '100%'}}>
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
            {((form.password && passwordErrors.length > 0) || (!passwordsMatch && form.confirmPassword)) && (
              <ul style={{color: 'red', fontSize: '13px', margin: '8px 0 0 0', paddingLeft: '18px'}}>
                {passwordErrors.map((err, i) => <li key={i}>{err}</li>)}
                {!passwordsMatch && form.confirmPassword && <li>Şifreler eşleşmiyor.</li>}
              </ul>
            )}
          </div>
          <div className="form-group" style={{width: '100%'}}>
            <label htmlFor="confirmPassword">Şifre Tekrar</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                style={{ ...inputStyle, paddingRight: '40px' }}
                autoComplete="off"
              />
              <span
                onClick={() => setShowConfirmPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: 0, bottom: 0, margin: 'auto', cursor: 'pointer', fontSize: 15, color: '#1a237e', background: 'none', border: 'none', padding: 0, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                <EyeIcon visible={showConfirmPassword} />
              </span>
            </div>
          </div>
          <div className="terms" style={{width: '100%'}}>
            <label>
              <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} />
              <span>Kullanım koşullarını ve Gizlilik Politikasını okudum, onaylıyorum.</span>
            </label>
          </div>
          <button type="submit" className="login-btn" disabled={loading} style={{...inputStyle, width: '100%', marginBottom: 0, background: 'linear-gradient(90deg, #2196f3 0%, #21cbf3 100%)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer'}}>{loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}</button>
        </form>
        <div style={{textAlign: 'center', marginTop: '32px'}}>
          <span style={{fontSize: '15px', color: '#444'}}>Zaten hesabın var mı?</span>
          <button
            type="button"
            onClick={() => navigate('/login')}
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
            Giriş Yap
          </button>
        </div>
        {error && <div style={{color:'red',marginTop:10, textAlign: 'center'}}>{error}</div>}
        {success && <div style={{color:'green',marginTop:10, textAlign: 'center'}}>{success}</div>}
      </div>
    </div>
  );
};

export default Register;