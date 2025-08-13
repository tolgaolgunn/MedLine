import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  User, 
  Shield, 
  Settings, 
  Bell, 
  Key, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  location: string;
  joinDate: string;
  lastLogin: string;
  avatar?: string;
}

const AdminProfile: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfile>({
    id: 1,
    fullName: "Admin User",
    email: "admin@medline.com",
    phone: "+90 555 123 45 67",
    role: "Sistem Yöneticisi",
    department: "Bilgi Teknolojileri",
    location: "İstanbul, Türkiye",
    joinDate: "01.01.2024",
    lastLogin: "15.12.2024 14:30"
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<AdminProfile>(profile);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    alert('Profil başarıyla güncellendi!');
  };

  const handleInputChange = (field: keyof AdminProfile, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert('Yeni şifreler eşleşmiyor!');
      return;
    }
    if (newPassword.length < 8) {
      alert('Şifre en az 8 karakter olmalıdır!');
      return;
    }
    
    // Simulate password change
    alert('Şifre başarıyla değiştirildi!');
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Profili</h1>
          <p className="text-muted-foreground">Profil bilgilerinizi yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            Şifre Değiştir
          </Button>
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Düzenle
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                İptal
              </Button>
              <Button
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarFallback className="text-2xl font-bold">
                    {getInitials(profile.fullName)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.fullName}</h2>
                <p className="text-gray-600">{profile.role}</p>
                <Badge variant="default" className="mt-2">Admin</Badge>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  {profile.phone}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profil Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Ad Soyad"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.fullName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="E-posta"
                      type="email"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Telefon"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phone}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departman
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Departman"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.department}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konum
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Konum"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.location}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Katılım Tarihi
                  </label>
                  <p className="text-gray-900">{profile.joinDate}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sisteme giriş yapıldı</p>
                  <p className="text-xs text-gray-500">{profile.lastLogin}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Kullanıcı yönetimi güncellendi</p>
                  <p className="text-xs text-gray-500">14.12.2024 16:45</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sistem ayarları değiştirildi</p>
                  <p className="text-xs text-gray-500">13.12.2024 11:20</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Yedekleme işlemi tamamlandı</p>
                  <p className="text-xs text-gray-500">12.12.2024 03:00</p>
                </div>
              </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">İki Faktörlü Doğrulama</p>
                  <p className="text-xs text-gray-500">Hesap güvenliğini artırın</p>
                </div>
                <Badge variant="default" className="bg-green-600">Aktif</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Oturum Zaman Aşımı</p>
                  <p className="text-xs text-gray-500">30 dakika sonra otomatik çıkış</p>
                </div>
                <Badge variant="outline">30 dk</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Son Şifre Değişikliği</p>
                  <p className="text-xs text-gray-500">01.12.2024</p>
                </div>
                <Badge variant="outline">1 ay önce</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Aktif Oturumlar</p>
                  <p className="text-xs text-gray-500">Şu anda 1 aktif oturum</p>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Görüntüle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Şifre Değiştir</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordModal(false)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Şifre
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mevcut şifrenizi girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yeni şifrenizi girin"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre (Tekrar)
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={handlePasswordChange}
                className="flex-1"
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Şifreyi Değiştir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
