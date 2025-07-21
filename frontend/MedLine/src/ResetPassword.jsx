import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

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

// EyeIcon bileşenini ekle
const EyeIcon = ({ visible }) => visible ? (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a237e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7.5a11.09 11.09 0 0 1 5.17-5.61"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.38 0 2.63-.83 3.16-2.03"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 8.5c-.46 0-.9.08-1.32.21"/><path d="M22.54 6.42A11.09 11.09 0 0 0 12 5c-2.73 0-5.23.99-7.17 2.61"/></svg>
) : (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a237e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
);

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const passwordErrors = getPasswordErrors(password);
  // Şifre göster/gizle state
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    if (passwordErrors.length > 0) {
      setMessage("Şifre kurallarına uyulmalı!");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("http://localhost:3005/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      setMessage(data.message || data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
      if (data.message === "Şifre sıfırlandı.") {
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setMessage("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
    setLoading(false);
  };

  return (
    <div className="reset-outer">
      <div className="reset-container">
        <h2 className="reset-title reset-title-left">Şifreyi Sıfırla</h2>
        <form onSubmit={handleSubmit} style={{width: '100%'}}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Yeni Şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="reset-input reset-input-small"
              style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
            />
            <span
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 10, top: 0, bottom: 0, margin: 'auto', cursor: 'pointer', fontSize: 20, color: '#1a237e', background: 'none', border: 'none', padding: 0, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster' }
            >
              <EyeIcon visible={showPassword} />
            </span>
          </div>
          {(password && passwordErrors.length > 0) && (
            <ul style={{color: 'red', fontSize: '13px', margin: '8px 0 0 0', paddingLeft: '18px'}}>
              {passwordErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
          <button type="submit" disabled={loading} className="reset-btn reset-btn-small reset-btn-block">
            {loading ? "Gönderiliyor..." : "Şifreyi Değiştir"}
          </button>
        </form>
        {message && <p style={{ marginTop: 16 }}>{message}</p>}
      </div>
    </div>
  );
} 