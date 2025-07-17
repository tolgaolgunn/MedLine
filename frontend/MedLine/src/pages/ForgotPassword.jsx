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
      setError('Please enter your email address!');
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
        setSuccess(data.message || 'If this email exists, a reset link has been sent.');
      } else {
        setError(data.error || data.message);
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
        <h1>Forgot Password</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
          <div className="register-link">
            <a href="/login">Back to Login</a>
          </div>
          {error && <div style={{color:'red',marginTop:10}}>{error}</div>}
          {success && <div style={{color:'green',marginTop:10}}>{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword; 