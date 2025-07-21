import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin'e özel route
export const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }
  if (!token || !user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute; 