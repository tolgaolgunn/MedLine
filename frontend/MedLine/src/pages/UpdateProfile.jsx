import React, { useState, useEffect } from 'react';
import '../../styles.css';

const UpdateProfile = () => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    birth_date: '',
    gender: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3005/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setForm({
            full_name: data.full_name || '',
            email: data.email || '',
            phone_number: data.phone_number || '',
            birth_date: data.birth_date || '',
            gender: data.gender || '',
            address: data.address || '',
          });
        } else {
          setError(data.message || 'Failed to fetch profile.');
        }
      } catch {
        setError('Could not connect to the server!');
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3005/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Profile updated successfully!');
      } else {
        setError(data.message || 'Profile update failed!');
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
        <h1>Update Profile</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="birth_date">Birth Date</label>
            <input type="date" id="birth_date" name="birth_date" value={form.birth_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select id="gender" name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              style={{
                minHeight: 60,
                width: '100%',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: '1rem',
                border: '1px solid #d1d5db',
                background: '#222',
                color: '#fff',
                resize: 'vertical',
                marginBottom: 0
              }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="phone_number">Phone Number</label>
            <input type="text" id="phone_number" name="phone_number" value={form.phone_number} onChange={handleChange} />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>{loading ? 'Updating...' : 'Update'}</button>
          {error && <div style={{color:'red',marginTop:10}}>{error}</div>}
          {success && <div style={{color:'green',marginTop:10}}>{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile; 