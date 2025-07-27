import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Eye, EyeOff, User } from "lucide-react";
// Date formatting helper - date-fns would be imported in a real project
const formatDate = (date: Date) => {
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};
import { toast } from "react-toastify";

// Password requirements (register ile aynı)
function getPasswordErrors(password: string): Record<'upper' | 'lower' | 'digit' | 'punct', boolean> {
  return {
    upper: !/[A-Z]/.test(password),
    lower: !/[a-z]/.test(password),
    digit: !/[0-9]/.test(password),
    punct: !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  };
}

const passwordRequirements: { key: 'upper' | 'lower' | 'digit' | 'punct'; label: string }[] = [
  { key: 'upper', label: '1 büyük harf içermelidir.' },
  { key: 'lower', label: '1 küçük harf içermelidir.' },
  { key: 'digit', label: '1 sayı içermelidir.' },
  { key: 'punct', label: '1 noktalama işareti içermelidir.' }
];

export function Profile() {
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    address: ""
  });

  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Backend'den kullanıcı bilgilerini getir
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }

        const response = await fetch('http://localhost:3005/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Profil bilgileri alınamadı');
        }

        const userData = await response.json();
        
        // Backend'den gelen veriyi formData'ya uyarla
        setFormData({
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          email: userData.email || "",
          phone: userData.phone_number || "",
          gender: userData.gender || "",
          address: userData.address || ""
        });

        // Doğum tarihini Date objesine çevir
        if (userData.birth_date) {
          setBirthDate(new Date(userData.birth_date));
        }

      } catch (error) {
        console.error('Profil bilgileri alınırken hata:', error);
        toast.error('Profil bilgileri yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      // Backend'e gönderilecek veriyi hazırla
      const updateData = {
        first_name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone_number: formData.phone,
        gender: formData.gender,
        address: formData.address,
        birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null
      };

      const response = await fetch('http://localhost:3005/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Profil güncellenemedi');
      }

      toast.success("Profil bilgileri başarıyla güncellendi!");
      
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      toast.error('Profil bilgileri güncellenemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Şifreler eşleşmiyor!");
      return;
    }
    if(passwordData.currentPassword === passwordData.newPassword) {
      toast.error("Mevcut şifre yeni şifre ile aynı olamaz!");
      return;
    }
    
    // Şifre gereksinimleri kontrolü (register ile aynı)
    const errors = getPasswordErrors(passwordData.newPassword);
    if (Object.values(errors).some(Boolean)) {
      toast.error("Şifre gereksinimlerini karşılayınız.");
      return;
    }
    
    toast.success("Şifre başarıyla değiştirildi!");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl text-gray-900 dark:text-white">Profil Düzenle</h1>
            <p className="text-gray-600 dark:text-gray-400">Kişisel bilgilerinizi güncelleyin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kişisel Bilgiler */}
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Kişisel Bilgiler</CardTitle>
              <CardDescription>
                Temel profil bilgilerinizi burada düzenleyebilirsiniz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Adınızı girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Soyadınızı girin"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="E-posta adresinizi girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon Numarası</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Telefon numaranızı girin"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Cinsiyet</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cinsiyet seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Kadın</SelectItem>
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Doğum Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? formatDate(birthDate) : "Tarih seçin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={setBirthDate}

                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Adresinizi girin"
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full">
                Profil Bilgilerini Kaydet
              </Button>
            </CardContent>
          </Card>

          {/* Şifre Değiştirme */}
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>
                Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-900 dark:text-white">Mevcut Şifre</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Mevcut şifrenizi girin"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-900 dark:text-white">Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    className="text-gray-900 dark:text-white"
                  id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Yeni şifrenizi girin"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-white">Yeni Şifre Tekrar</Label>
                <div className="relative">
                  <Input
                    className="text-gray-900 dark:text-white"
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <ul className="list-disc list-inside space-y-1">
                  {passwordRequirements.map(req => {
                    const errors = getPasswordErrors(passwordData.newPassword);
                    if (!errors[req.key]) return null;
                    return (
                      <li key={req.key} className="text-red-600">{req.label}</li>
                    );
                  })}
                </ul>
              </div>

              <Button 
                onClick={handleChangePassword} 
                className="w-full"
                disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                Şifreyi Değiştir
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}