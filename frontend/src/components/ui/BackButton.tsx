import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from './button';

interface BackButtonProps {
  className?: string;
  showAvatar?: boolean;
}

export function BackButton({ className = "", showAvatar = false }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    const currentPath = window.location.pathname;
    const from = location.state?.from;
    
    // Eğer location state'den gelen bir from değeri varsa, oraya git
    if (from) {
      navigate(from);
      return;
    }
    
    // Kullanıcı rolünü kontrol et
    let userRole = 'patient';
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userRole = user.role || 'patient';
    } catch {
      userRole = 'patient';
    }
    
    // Doktor sayfaları için özel kontrol
    if (currentPath.startsWith('/doctor/')) {
      if (currentPath === '/doctor/dashboard') {
        // Eğer zaten dashboard'daysa, ana sayfaya git
        navigate('/');
      } else {
        // Doktor alt sayfalarından dashboard'a git
        navigate('/doctor/dashboard');
      }
    } else if (currentPath.startsWith('/patient/')) {
      // Hasta sayfaları için
      if (currentPath === '/patient/dashboard') {
        navigate('/');
      } else {
        navigate('/patient/dashboard');
      }
    } else if (currentPath === '/dashboard') {
      // /dashboard sayfasından geri gitme
      if (userRole === 'doctor') {
        // Doktor ise doctor dashboard'a git
        navigate('/doctor/dashboard');
      } else {
        // Hasta ise ana sayfaya git
        navigate('/');
      }
    } else {
      // Diğer sayfalar için güvenli geri gitme
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        // Geçmiş yoksa ana sayfaya git
        navigate('/');
      }
    }
  };

  return (
    <Button
      onClick={handleGoBack}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-gray-300 transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {showAvatar && (
        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="w-3 h-3 text-gray-600" />
        </div>
      )}
      <span className="text-sm font-medium">Geri</span>
    </Button>
  );
}