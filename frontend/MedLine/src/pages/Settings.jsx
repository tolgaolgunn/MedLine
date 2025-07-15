import React, { useState } from 'react';
import UpdateProfile from './UpdateProfile';
import ChangePassword from './ChangePassword';
import '../../styles.css';

const Settings = () => {
  const [open, setOpen] = useState('profile');

  return (
    <div className="login-container">
      <div className="login-box" style={{maxWidth: 500}}>
        <h1>Settings</h1>
        <div className="accordion">
          <div className="accordion-item">
            <button
              className={`accordion-title${open === 'profile' ? ' active' : ''}`}
              onClick={() => setOpen(open === 'profile' ? '' : 'profile')}
            >
              Update Profile
            </button>
            {open === 'profile' && (
              <div className="accordion-content">
                <UpdateProfile />
              </div>
            )}
          </div>
          <div className="accordion-item">
            <button
              className={`accordion-title${open === 'password' ? ' active' : ''}`}
              onClick={() => setOpen(open === 'password' ? '' : 'password')}
            >
              Change Password
            </button>
            {open === 'password' && (
              <div className="accordion-content">
                <ChangePassword />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 