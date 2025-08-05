import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from './button';

interface BackButtonProps {
  className?: string;
  showAvatar?: boolean;
}

export function BackButton({ className = "", showAvatar = false }: BackButtonProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Button
      onClick={handleGoBack}
      variant="ghost"
      size="sm"
      className={`flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors ${className}`}
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