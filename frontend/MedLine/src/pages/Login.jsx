import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles.css';

const Login = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      setError('Please fill in all fields!');
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
        localStorage.setItem('token', data.token);
        if (form.remember) {
          localStorage.setItem('rememberEmail', form.email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed!');
      }
    } catch {
      setError('Could not connect to the server!');
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

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <div className="remember-forgot">
            <label className="remember">
              <input type="checkbox" id="remember" name="remember" checked={form.remember} onChange={handleChange} />
              Remember me
            </label>
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>
          <button type="submit" className="login-btn" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          <div className="register-link">
            Don't have an account? <a href="/register">Register</a>
          </div>
          {error && <div style={{color:'red',marginTop:10}}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login; 