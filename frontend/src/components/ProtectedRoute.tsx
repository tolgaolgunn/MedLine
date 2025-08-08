import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    user = null;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Doktor rolü kontrolü - doktor olarak giriş yapmışsa ve /dashboard sayfasındaysa /doctor/dashboard'a yönlendir
  if (location.pathname === '/dashboard' && user && user.role === 'doctor') {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  // Doktor sayfalarına hasta erişmeye çalışıyorsa dashboard'a yönlendir
  if (location.pathname.startsWith('/doctor') && (!user || user.role !== 'doctor')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Admin'e özel route
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    user = null;
  }
  if (!token || !user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;