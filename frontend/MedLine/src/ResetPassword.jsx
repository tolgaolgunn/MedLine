import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("http://localhost:3005/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      setMessage(data.message || data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
      if (data.message === "Password reset successful.") {
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setMessage("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 24, border: "1px solid #eee", borderRadius: 8, background: "#fff" }}>
      <h2 style={{ color: '#1976d2' }}>Şifreyi Sıfırla</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Yeni şifre"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        />
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Gönderiliyor..." : "Şifreyi Değiştir"}
        </button>
      </form>
      {message && <p style={{ marginTop: 16 }}>{message}</p>}
    </div>
  );
} 