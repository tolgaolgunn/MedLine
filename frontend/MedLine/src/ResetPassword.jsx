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

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const passwordErrors = getPasswordErrors(password);

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
          <input
            type="password"
            placeholder="Yeni Şifre"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="reset-input reset-input-small"
          />
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