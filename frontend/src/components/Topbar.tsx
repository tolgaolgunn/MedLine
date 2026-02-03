import React, { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";

import { LogOut, User, Search, Calendar, Pill, Users, FileText, Settings, HelpCircle, X, Clock, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { NotificationBell } from "./notifications/NotificationBell";

interface TopbarProps {
  onLogout: () => void;
  setActiveSection: (section: string) => void;
}

export function Topbar({ onLogout, setActiveSection }: TopbarProps) {
  const [userRole, setUserRole] = useState<string>('patient');
  const [searchValue, setSearchValue] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Array<{ text: string, timestamp: number }>>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        setUserRole(userObj.role || 'patient');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  // Eski aramaları localStorage'dan yükle
  useEffect(() => {
    const savedSearches = localStorage.getItem(`recentSearches_${userRole}`);
    if (savedSearches) {
      try {
        const parsed = JSON.parse(savedSearches);
        // Eski string formatını yeni format'a çevir
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          const converted = parsed.map((text: string) => ({ text, timestamp: Date.now() }));
          setRecentSearches(converted);
        } else {
          setRecentSearches(parsed);
        }
      } catch (error) {
        console.error('Error parsing recent searches:', error);
        setRecentSearches([]);
      }
    }
  }, [userRole]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for setSearchValue events from other components
  useEffect(() => {
    const handleSetSearchValue = (event: CustomEvent) => {
      if (event.detail && event.detail.value) {
        setSearchValue(event.detail.value);
        setShowSearchResults(true);
      }
    };

    window.addEventListener('setSearchValue', handleSetSearchValue as EventListener);
    return () => window.removeEventListener('setSearchValue', handleSetSearchValue as EventListener);
  }, []);

  const handleSearchAction = (action: { id: string; label: string; description: string; icon: any }) => {
    console.log('Search action clicked:', action); // Debug log
    setActiveSection(action.id);
    setSearchValue('');
    setShowSearchResults(false);

    // Aramayı geçmişe ekle - seçilen seçeneğin tam adını kullan
    const newSearch = { text: action.label, timestamp: Date.now() };
    const newSearches = [newSearch, ...recentSearches.filter(s => s.text !== action.label)].slice(0, 10);
    setRecentSearches(newSearches);
    localStorage.setItem(`recentSearches_${userRole}`, JSON.stringify(newSearches));
  };

  const handleSearchInput = (value: string) => {
    setSearchValue(value);
    setShowSearchResults(value.length > 0);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(`recentSearches_${userRole}`);
    // Modal'ın kapanmaması için showSearchResults'ı true tut
    setShowSearchResults(true);
  };

  const removeSearchItem = (searchToRemove: string) => {
    const newSearches = recentSearches.filter(s => s.text !== searchToRemove);
    setRecentSearches(newSearches);
    localStorage.setItem(`recentSearches_${userRole}`, JSON.stringify(newSearches));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();

    // Geçersiz tarih kontrolü
    if (isNaN(diffInMs) || diffInMs < 0) {
      return 'Az önce';
    }

    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} saat önce`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} gün önce`;
    }
  };

  // Hasta için arama seçenekleri
  const patientSearchOptions = [
    { id: 'appointments', label: 'Randevu Al', icon: Calendar, description: 'Yeni randevu oluştur' },
    { id: 'prescriptions', label: 'Reçetelerim', icon: Pill, description: 'Reçetelerimi görüntüle' },
    { id: 'medical-records', label: 'Sağlık Kayıtlarım', icon: FileText, description: 'Tıbbi geçmişim' },
    { id: 'doctor-search', label: 'Doktor Ara', icon: Users, description: 'Uzman doktor bul' },
    { id: 'profile', label: 'Profil Ayarları', icon: Settings, description: 'Hesap bilgilerini düzenle' },
    { id: 'help', label: 'Yardım', icon: HelpCircle, description: 'Destek ve kullanım kılavuzu' },
  ];

  // Doktor için arama seçenekleri
  const doctorSearchOptions = [
    { id: 'appointments', label: 'Randevularım', icon: Calendar, description: 'Randevu listesini görüntüle' },
    { id: 'patients', label: 'Hasta Yönetimi', icon: Users, description: 'Hastalarımı yönet' },
    { id: 'prescriptions', label: 'Reçete Yönetimi', icon: Pill, description: 'Reçete oluştur ve yönet' },
    { id: 'reports', label: 'Raporlar', icon: FileText, description: 'Hasta raporlarını görüntüle' },
    { id: 'profile', label: 'Profil Ayarları', icon: Settings, description: 'Hesap bilgilerini düzenle' },
    { id: 'help', label: 'Yardım', icon: HelpCircle, description: 'Destek ve kullanım kılavuzu' },
  ];

  const searchOptions = userRole === 'doctor' ? doctorSearchOptions : patientSearchOptions;

  // Arama sonuçlarını filtrele
  const filteredOptions = searchOptions.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    option.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-30 w-full bg-background border-b border-border flex items-center justify-between px-6 h-16">
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder={userRole === 'doctor' ? "Doktor işlemleri ara..." : "Hasta işlemleri ara..."}
            className="w-full pl-10 pr-4 border border-border"
            value={searchValue}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => {
                setSearchValue('');
                setShowSearchResults(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {searchValue ? (
              // Arama sonuçları
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Arama Sonuçları</h3>
                {filteredOptions.length > 0 ? (
                  <div className="space-y-1">
                    {filteredOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => handleSearchAction(option)}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 rounded-md"
                      >
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <option.icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-gray-500 text-center">
                    "{searchValue}" için sonuç bulunamadı
                  </div>
                )}
              </div>
            ) : (
              // Eski aramalar
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Son Aramalar</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearRecentSearches}
                    disabled={recentSearches.length === 0}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Tümünü Temizle
                  </Button>
                </div>
                {recentSearches.length > 0 ? (
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                      >
                        <div
                          className="flex items-center gap-2 flex-1"
                          onClick={() => {
                            setSearchValue(search.text);
                            setShowSearchResults(false);
                          }}
                        >
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <span className="text-sm text-gray-700">{search.text}</span>
                            <div className="text-xs text-gray-400">{formatDate(search.timestamp)}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSearchItem(search.text)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-gray-500 text-center text-sm">
                    Henüz arama geçmişi yok
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 ml-4">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Profile Avatar */}
        <Button variant="ghost" size="icon" className="text-black" onClick={() => setActiveSection('profile')}>
          <Avatar>
            <AvatarFallback>
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
        </Button>
        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={onLogout} title="Çıkış Yap">
          <LogOut className="w-5 h-5 text-destructive" />
        </Button>
      </div>
    </header>
  );
} 