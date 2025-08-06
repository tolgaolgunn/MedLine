import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  User
} from "lucide-react";
import { toast } from "react-toastify";

interface SettingsData {
  // Bildirim Ayarları
  emailNotifications: boolean;
  appointmentReminders: boolean;
  prescriptionUpdates: boolean;
  marketingEmails: boolean;
  
  // Gizlilik Ayarları
  profileVisibility: 'public' | 'private' | 'doctors_only';
  shareMedicalData: boolean;
  allowResearchData: boolean;
  
  // Görünüm Ayarları
  theme: 'light' | 'dark' | 'auto';
  language: 'tr' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  
  // Güvenlik Ayarları
  twoFactorAuth: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
}

export function Settings() {
  const [userRole, setUserRole] = useState<string>('patient');
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [settings, setSettings] = useState<SettingsData>({
    // Bildirim Ayarları
    emailNotifications: true,
    appointmentReminders: true,
    prescriptionUpdates: true,
    marketingEmails: false,
    
    // Gizlilik Ayarları
    profileVisibility: 'doctors_only',
    shareMedicalData: true,
    allowResearchData: false,
    
    // Görünüm Ayarları
    theme: 'light',
    language: 'tr',
    fontSize: 'medium',
    
    // Güvenlik Ayarları
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginNotifications: true,
  });

  const [originalSettings, setOriginalSettings] = useState<SettingsData>({ ...settings });

  // Kullanıcı rolünü al
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
    setIsLoading(false);
  }, []);

  // Ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:3005/api/settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          setOriginalSettings(data);
        }
      } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
      }
    };

    loadSettings();
  }, []);

  // Değişiklik kontrolü
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      const response = await fetch('http://localhost:3005/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Ayarlar başarıyla kaydedildi!');
        setOriginalSettings({ ...settings });
        setHasChanges(false);
      } else {
        throw new Error('Ayarlar kaydedilemedi');
      }
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      toast.error('Ayarlar kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-600">Hesap ve uygulama ayarlarınızı yönetin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bildirim Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Bildirim Ayarları
            </CardTitle>
            <CardDescription>
              Hangi bildirimleri almak istediğinizi seçin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>E-posta Bildirimleri</Label>
                <p className="text-sm text-gray-500">Önemli güncellemeler için e-posta al</p>
              </div>
              <Checkbox
                checked={settings.emailNotifications}
                onCheckedChange={(checked: boolean) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Randevu Hatırlatmaları</Label>
                <p className="text-sm text-gray-500">Randevularınızdan önce hatırlatma al</p>
              </div>
              <Checkbox
                checked={settings.appointmentReminders}
                onCheckedChange={(checked: boolean) => handleSettingChange('appointmentReminders', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Reçete Güncellemeleri</Label>
                <p className="text-sm text-gray-500">Yeni reçeteler ve değişiklikler için bildirim al</p>
              </div>
              <Checkbox
                checked={settings.prescriptionUpdates}
                onCheckedChange={(checked: boolean) => handleSettingChange('prescriptionUpdates', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pazarlama E-postaları</Label>
                <p className="text-sm text-gray-500">Özel teklifler ve güncellemeler için e-posta al</p>
              </div>
              <Checkbox
                checked={settings.marketingEmails}
                onCheckedChange={(checked: boolean) => handleSettingChange('marketingEmails', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Gizlilik Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Gizlilik Ayarları
            </CardTitle>
            <CardDescription>
              Verilerinizin nasıl kullanılacağını kontrol edin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Profil Görünürlüğü</Label>
              <Select
                value={settings.profileVisibility}
                onValueChange={(value: 'public' | 'private' | 'doctors_only') => 
                  handleSettingChange('profileVisibility', value)
                }
              >
                <SelectTrigger className="w-32 hover:border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Herkese Açık</SelectItem>
                  <SelectItem value="doctors_only">Sadece Doktorlar</SelectItem>
                  <SelectItem value="private">Gizli</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tıbbi Veri Paylaşımı</Label>
                <p className="text-sm text-gray-500">Doktorlarınızla tıbbi verilerinizi paylaş</p>
              </div>
              <Checkbox
                checked={settings.shareMedicalData}
                onCheckedChange={(checked: boolean) => handleSettingChange('shareMedicalData', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Araştırma Verileri</Label>
                <p className="text-sm text-gray-500">Anonim verilerinizi araştırma için kullan</p>
              </div>
              <Checkbox
                checked={settings.allowResearchData}
                onCheckedChange={(checked: boolean) => handleSettingChange('allowResearchData', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Görünüm Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Görünüm Ayarları
            </CardTitle>
            <CardDescription>
              Uygulamanın görünümünü kişiselleştirin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tema</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: 'light' | 'dark' | 'auto') => 
                  handleSettingChange('theme', value)
                }
              >
                <SelectTrigger className="w-32 hover:border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Açık</SelectItem>
                  <SelectItem value="dark">Koyu</SelectItem>
                  <SelectItem value="auto">Otomatik</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Dil</Label>
              <Select
                value={settings.language}
                onValueChange={(value: 'tr' | 'en') => 
                  handleSettingChange('language', value)
                }
              >
                <SelectTrigger className="w-32 hover:border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Yazı Boyutu</Label>
              <Select
                value={settings.fontSize}
                onValueChange={(value: 'small' | 'medium' | 'large') => 
                  handleSettingChange('fontSize', value)
                }
              >
                <SelectTrigger className="w-32 hover:border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Küçük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="large">Büyük</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Güvenlik Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Güvenlik Ayarları
            </CardTitle>
            <CardDescription>
              Hesabınızın güvenliğini artırın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>İki Faktörlü Doğrulama</Label>
                <p className="text-sm text-gray-500">Ekstra güvenlik için doğrulama</p>
              </div>
              <Checkbox
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked: boolean) => handleSettingChange('twoFactorAuth', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Oturum Zaman Aşımı (dakika)</Label>
              <Select
                value={settings.sessionTimeout.toString()}
                onValueChange={(value) => handleSettingChange('sessionTimeout', parseInt(value))}
              >
                <SelectTrigger className="w-32 hover:border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dakika</SelectItem>
                  <SelectItem value="60">1 saat</SelectItem>
                  <SelectItem value="120">2 saat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Giriş Bildirimleri</Label>
                <p className="text-sm text-gray-500">Yeni girişler için e-posta al</p>
              </div>
              <Checkbox
                checked={settings.loginNotifications}
                onCheckedChange={(checked: boolean) => handleSettingChange('loginNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kaydet ve Çıkış */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-4">
          <Button 
            onClick={handleSaveSettings} 
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Ayarları Kaydet
          </Button>
          
          {hasChanges && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSettings({ ...originalSettings });
                setHasChanges(false);
              }}
            >
              Değişiklikleri İptal Et
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 