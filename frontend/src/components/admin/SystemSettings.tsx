import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Globe,
  Clock,
  Users,
  Bell,
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react';

interface SystemSetting {
  id: string;
  name: string;
  description: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'select';
  category: string;
  required: boolean;
  options?: string[];
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([
    {
      id: 'site-name',
      name: 'Site Adı',
      description: 'Web sitesinin görünen adı',
      value: 'MedLine Sağlık Sistemi',
      type: 'text',
      category: 'genel',
      required: true
    },
    {
      id: 'site-description',
      name: 'Site Açıklaması',
      description: 'Web sitesinin meta açıklaması',
      value: 'Modern sağlık hizmetleri için dijital platform',
      type: 'text',
      category: 'genel',
      required: false
    },
    {
      id: 'maintenance-mode',
      name: 'Bakım Modu',
      description: 'Sadece admin kullanıcıları erişebilir',
      value: false,
      type: 'boolean',
      category: 'genel',
      required: false
    },
    {
      id: 'session-timeout',
      name: 'Oturum Zaman Aşımı (dakika)',
      description: 'Kullanıcı oturumunun otomatik sonlanma süresi',
      value: 30,
      type: 'number',
      category: 'güvenlik',
      required: true
    },
    {
      id: 'max-login-attempts',
      name: 'Maksimum Giriş Denemesi',
      description: 'Hesap kilitleme öncesi izin verilen giriş denemesi',
      value: 5,
      type: 'number',
      category: 'güvenlik',
      required: true
    },
    {
      id: 'two-factor-required',
      name: 'İki Faktörlü Doğrulama Zorunlu',
      description: 'Tüm kullanıcılar için 2FA zorunluluğu',
      value: true,
      type: 'boolean',
      category: 'güvenlik',
      required: false
    },
    {
      id: 'smtp-host',
      name: 'SMTP Sunucu',
      description: 'E-posta gönderimi için SMTP sunucu adresi',
      value: 'smtp.gmail.com',
      type: 'text',
      category: 'e-posta',
      required: true
    },
    {
      id: 'smtp-port',
      name: 'SMTP Port',
      description: 'SMTP sunucu port numarası',
      value: 587,
      type: 'number',
      category: 'e-posta',
      required: true
    },
    {
      id: 'smtp-username',
      name: 'SMTP Kullanıcı Adı',
      description: 'E-posta hesabı kullanıcı adı',
      value: 'noreply@medline.com',
      type: 'text',
      category: 'e-posta',
      required: true
    },
    {
      id: 'backup-frequency',
      name: 'Yedekleme Sıklığı',
      description: 'Otomatik yedekleme yapılma sıklığı',
      value: 'daily',
      type: 'select',
      category: 'veritabanı',
      required: true,
      options: ['hourly', 'daily', 'weekly', 'monthly']
    },
    {
      id: 'backup-retention',
      name: 'Yedek Saklama Süresi (gün)',
      description: 'Yedeklerin saklanma süresi',
      value: 30,
      type: 'number',
      category: 'veritabanı',
      required: true
    },
    {
      id: 'auto-updates',
      name: 'Otomatik Güncellemeler',
      description: 'Sistem güncellemelerini otomatik yükle',
      value: false,
      type: 'boolean',
      category: 'sistem',
      required: false
    },
    {
      id: 'debug-mode',
      name: 'Hata Ayıklama Modu',
      description: 'Geliştirici modunda hata ayıklama bilgilerini göster',
      value: false,
      type: 'boolean',
      category: 'sistem',
      required: false
    },
    {
      id: 'notification-email',
      name: 'Bildirim E-postası',
      description: 'Sistem bildirimleri için e-posta adresi',
      value: 'admin@medline.com',
      type: 'text',
      category: 'bildirimler',
      required: true
    },
    {
      id: 'push-notifications',
      name: 'Push Bildirimleri',
      description: 'Kullanıcılara push bildirim gönder',
      value: true,
      type: 'boolean',
      category: 'bildirimler',
      required: false
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    { id: 'all', name: 'Tüm Ayarlar', icon: Settings },
    { id: 'genel', name: 'Genel', icon: Globe },
    { id: 'güvenlik', name: 'Güvenlik', icon: Shield },
    { id: 'e-posta', name: 'E-posta', icon: Mail },
    { id: 'veritabanı', name: 'Veritabanı', icon: Database },
    { id: 'sistem', name: 'Sistem', icon: Settings },
    { id: 'bildirimler', name: 'Bildirimler', icon: Bell }
  ];

  const filteredSettings = selectedCategory === 'all' 
    ? settings 
    : settings.filter(setting => setting.category === selectedCategory);

  const handleSettingChange = (settingId: string, newValue: any) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === settingId ? { ...setting, value: newValue } : setting
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSaving(false);
    setHasUnsavedChanges(false);
    alert('Ayarlar başarıyla kaydedildi!');
  };

  const handleReset = () => {
    if (window.confirm('Tüm ayarları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
      // Reset to default values
      setHasUnsavedChanges(false);
      alert('Ayarlar varsayılan değerlere sıfırlandı!');
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'text':
        return (
          <Input
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            placeholder={setting.description}
            className="w-full"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={setting.value as number}
            onChange={(e) => handleSettingChange(setting.id, parseInt(e.target.value))}
            placeholder={setting.description}
            className="w-full"
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={setting.value as boolean}
            onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
          />
        );
      case 'select':
        return (
          <select
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {setting.options?.map((option) => (
              <option key={option} value={option}>
                {option === 'hourly' ? 'Saatlik' : 
                 option === 'daily' ? 'Günlük' : 
                 option === 'weekly' ? 'Haftalık' : 
                 option === 'monthly' ? 'Aylık' : option}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : Settings;
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistem Ayarları</h1>
          <p className="text-muted-foreground">Sistem konfigürasyonunu yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Varsayılana Sıfırla
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Dışa Aktar
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            İçe Aktar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center gap-2"
          >
            <category.icon className="w-4 h-4" />
            {category.name}
          </Button>
        ))}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSettings.map((setting) => (
          <Card key={setting.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {React.createElement(getCategoryIcon(setting.category), { className: "w-5 h-5" })}
                  <span>{setting.name}</span>
                  {setting.required && (
                    <Badge variant="destructive" className="text-xs">Gerekli</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{setting.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {renderSettingInput(setting)}
                </div>
                <div className="text-sm text-gray-500">
                  {setting.type === 'boolean' ? (setting.value ? 'Aktif' : 'Pasif') : ''}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Kategori: {getCategoryName(setting.category)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Hızlı İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => alert('Sistem yedeklemesi başlatılıyor...')}
            >
              <Database className="w-6 h-6" />
              <span className="text-sm">Sistem Yedekle</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => alert('Önbellek temizleniyor...')}
            >
              <RefreshCw className="w-6 h-6" />
              <span className="text-sm">Önbelleği Temizle</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => alert('Sistem durumu kontrol ediliyor...')}
            >
              <Shield className="w-6 h-6" />
              <span className="text-sm">Güvenlik Taraması</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sistem Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">v2.1.0</div>
              <div className="text-sm text-gray-600">Sistem Versiyonu</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">15.12.2024</div>
              <div className="text-sm text-gray-600">Son Güncelleme</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">99.9%</div>
              <div className="text-sm text-gray-600">Sistem Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">2,847</div>
              <div className="text-sm text-gray-600">Toplam Kullanıcı</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Status */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">Kaydedilmemiş değişiklikler var</span>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="ml-2"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
