import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { 
  Settings, 
  Power, 
  Shield, 
  Database, 
  Cloud, 
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface SystemService {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  description: string;
  lastCheck: string;
  uptime: string;
}

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  critical: boolean;
}

const SystemControls: React.FC = () => {
  const [systemServices, setSystemServices] = useState<SystemService[]>([
    {
      id: 'web-server',
      name: 'Web Sunucu',
      status: 'running',
      description: 'Ana web uygulaması sunucusu',
      lastCheck: '2 dakika önce',
      uptime: '15 gün 8 saat'
    },
    {
      id: 'database',
      name: 'Veritabanı',
      status: 'running',
      description: 'PostgreSQL veritabanı servisi',
      lastCheck: '1 dakika önce',
      uptime: '15 gün 8 saat'
    },
    {
      id: 'email-service',
      name: 'E-posta Servisi',
      status: 'running',
      description: 'SMTP e-posta gönderim servisi',
      lastCheck: '3 dakika önce',
      uptime: '15 gün 8 saat'
    },
    {
      id: 'backup-service',
      name: 'Yedekleme Servisi',
      status: 'stopped',
      description: 'Otomatik veri yedekleme servisi',
      lastCheck: '5 dakika önce',
      uptime: '0 gün 0 saat'
    },
    {
      id: 'monitoring',
      name: 'İzleme Servisi',
      status: 'error',
      description: 'Sistem performans izleme servisi',
      lastCheck: '10 dakika önce',
      uptime: '0 gün 0 saat'
    }
  ]);

  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([
    {
      id: 'two-factor',
      name: 'İki Faktörlü Doğrulama',
      description: 'Kullanıcı girişlerinde 2FA zorunluluğu',
      enabled: true,
      critical: true
    },
    {
      id: 'password-policy',
      name: 'Güçlü Şifre Politikası',
      description: 'Minimum şifre karmaşıklığı gereksinimleri',
      enabled: true,
      critical: true
    },
    {
      id: 'session-timeout',
      name: 'Oturum Zaman Aşımı',
      description: 'Kullanıcı oturumlarının otomatik sonlanması',
      enabled: true,
      critical: false
    },
    {
      id: 'ip-whitelist',
      name: 'IP Beyaz Listesi',
      description: 'Sadece belirli IP adreslerinden erişim',
      enabled: false,
      critical: false
    },
    {
      id: 'audit-logging',
      name: 'Denetim Günlüğü',
      description: 'Tüm kullanıcı işlemlerinin kaydedilmesi',
      enabled: true,
      critical: false
    }
  ]);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-4 h-4" />;
      case 'stopped':
        return <Power className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSystemServices(prev => 
      prev.map(service => 
        service.id === serviceId 
          ? { ...service, status: service.status === 'running' ? 'stopped' : 'running' }
          : service
      )
    );
  };

  const handleSecurityToggle = (settingId: string) => {
    setSecuritySettings(prev => 
      prev.map(setting => 
        setting.id === settingId 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const handleRefreshServices = () => {
    alert('Servisler yenileniyor...');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistem Kontrolleri</h1>
          <p className="text-muted-foreground">Sistem servislerini ve güvenlik ayarlarını yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshServices}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Servisleri Yenile
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Bakım Modu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Bakım modu aktifken sadece admin kullanıcıları sisteme erişebilir
              </p>
              <p className="text-xs text-gray-500">
                Bu işlem tüm kullanıcıları sistemden çıkarır
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Sistem Servisleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(service.status)}
                    <Badge className={getStatusColor(service.status)}>
                      {service.status === 'running' ? 'Çalışıyor' : 
                       service.status === 'stopped' ? 'Durdu' : 'Hata'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>Son kontrol: {service.lastCheck}</span>
                      <span>Çalışma süresi: {service.uptime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={service.status === 'running' ? 'destructive' : 'default'}
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    {service.status === 'running' ? 'Durdur' : 'Başlat'}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Güvenlik Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securitySettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {setting.critical && (
                      <Badge variant="destructive" className="text-xs">Kritik</Badge>
                    )}
                    <Lock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">{setting.name}</h3>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => handleSecurityToggle(setting.id)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Sistem Günlükleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Son sistem günlüklerini görüntüleyin
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
            >
              {showLogs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showLogs ? 'Gizle' : 'Göster'}
            </Button>
          </div>
          
          {showLogs && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              <div>[2024-12-15 14:30:15] INFO: Web sunucu başlatıldı</div>
              <div>[2024-12-15 14:30:16] INFO: Veritabanı bağlantısı kuruldu</div>
              <div>[2024-12-15 14:30:17] INFO: E-posta servisi aktif</div>
              <div>[2024-12-15 14:30:18] WARN: Yedekleme servisi başlatılamadı</div>
              <div>[2024-12-15 14:30:19] ERROR: İzleme servisi hatası</div>
              <div>[2024-12-15 14:30:20] INFO: Sistem başlatma tamamlandı</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemControls;
