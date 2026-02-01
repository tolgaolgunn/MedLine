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
    // 1) Tarayıcı geçmişi varsa her durumda bir önceki sayfaya dön
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    // 2) Explicit 'from' varsa oraya dön (geçmiş yoksa)
    const from = location.state?.from;
    if (from) {
      navigate(from);
      return;
    }

    // 3) Geçmiş ve from yoksa role'a göre makul başlangıca yönlendir
    let userRole = 'patient';
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userRole = user.role || 'patient';
    } catch {}

    if (userRole === 'doctor') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/dashboard');
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