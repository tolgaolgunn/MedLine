import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles.css';

const Register = () => {
  const [form, setForm] = useState({
    full_name: '',
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
    setSuccess('');

    if (!form.terms) {
      setError('Please accept the terms of use!');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Invalid email address!');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3005/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          phone_number: form.phone_number,
          role: form.role,
          email: form.email,
          password: form.password
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Registration successful!');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || 'Registration failed!');
      }
    } catch {
      setError('Could not connect to the server!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="phone_number">Phone Number</label>
            <input type="text" id="phone_number" name="phone_number" value={form.phone_number} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={form.role} onChange={handleChange} required>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
          </div>
          <div className="terms">
            <label>
              <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} />
              <span>I have read and accept the terms of use</span>
            </label>
          </div>
          <button type="submit" className="login-btn" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          <div className="register-link">
            Already have an account? <a href="/login">Login</a>
          </div>
          {error && <div style={{color:'red',marginTop:10}}>{error}</div>}
          {success && <div style={{color:'green',marginTop:10}}>{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default Register; 