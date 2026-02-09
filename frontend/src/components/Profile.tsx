import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Eye, EyeOff, User } from "lucide-react";
import { toast } from "react-toastify";

// Şifre gereksinimleri kontrolü
function getPasswordErrors(password: string) {
  return {
    length: password.length < 8,
    upper: !/[A-Z]/.test(password),
    lower: !/[a-z]/.test(password),
    digit: !/[0-9]/.test(password),
    punct: !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  };
}

const passwordRequirements = [
  { key: 'length', label: 'En az 8 karakter uzunluğunda olmalıdır.' },
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
    address: "",
    bloodType: ""
  });

  const [originalFormData, setOriginalFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    birthDate: "",
    bloodType: ""
  });

  const [birthDate, setBirthDate] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Kullanıcı verilerini yükle
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Profil bilgileri alınamadı');

        const userData = await response.json();
        const nameParts = (userData.full_name || "").split(" ");

        const newFormData = {
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: userData.email || "",
          phone: userData.phone_number || "",
          gender: userData.gender || "",
          address: userData.address || "",
          bloodType: userData.blood_type || ""
        };

        setFormData(newFormData);
        setOriginalFormData({
          ...newFormData,
          birthDate: userData.birth_date || ""
        });

        // Doğum tarihini işle (YYYY-MM-DD formatında sakla)
        if (userData.birth_date) {
          const date = new Date(userData.birth_date);
          const formattedDate = date.toISOString().split('T')[0];
          setBirthDate(formattedDate);
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
    let validatedValue = value;

    switch (field) {
      case 'firstName':
      case 'lastName':
        validatedValue = value.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '');
        break;
      case 'phone':
        validatedValue = value.replace(/[^0-9]/g, '');
        break;
      case 'address':
        if (value.length > 200) {
          toast.error('Adres en fazla 200 karakter olabilir');
          return;
        }
        break;
    }

    setFormData(prev => ({ ...prev, [field]: validatedValue }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  // Değişiklik kontrolü
  const hasChanges = () => {
    return (
      formData.firstName !== originalFormData.firstName ||
      formData.lastName !== originalFormData.lastName ||
      formData.email !== originalFormData.email ||
      formData.phone !== originalFormData.phone ||
      formData.gender !== originalFormData.gender ||
      formData.address !== originalFormData.address ||
      formData.bloodType !== originalFormData.bloodType ||
      birthDate !== originalFormData.birthDate
    );
  };

  // Profil bilgilerini kaydet
  const handleSaveProfile = async () => {
    // Validasyonlar
    if (!formData.firstName.trim()) return toast.error('Ad alanı boş bırakılamaz');
    if (!formData.lastName.trim()) return toast.error('Soyad alanı boş bırakılamaz');
    if (!formData.email.trim()) return toast.error('E-posta alanı boş bırakılamaz');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return toast.error('Geçerli bir e-posta adresi giriniz');
    if (!formData.phone.trim()) return toast.error('Telefon alanı boş bırakılamaz');
    if (formData.phone.length < 10) return toast.error('Telefon numarası en az 10 haneli olmalıdır');

    try {
      const token = localStorage.getItem('token');
      if (!token) return toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');

      const updateData = {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone_number: formData.phone,
        gender: formData.gender,
        address: formData.address,
        birth_date: birthDate || null,
        blood_type: formData.bloodType || null
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profil güncellenemedi');
      }

      toast.success("Profil bilgileriniz başarıyla güncellendi!");
      setOriginalFormData({
        ...formData,
        birthDate: birthDate
      });

    } catch (error: any) {
      console.error('Profil güncellenirken hata:', error);
      toast.error(error.message || 'Profil bilgileri güncellenemedi. Lütfen tekrar deneyin.');
    }
  };

  // Şifre değiştirme
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Şifreler eşleşmiyor!");
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      return toast.error("Mevcut şifre yeni şifre ile aynı olamaz!");
    }

    const errors = getPasswordErrors(passwordData.newPassword);
    if (Object.values(errors).some(Boolean)) {
      return toast.error("Şifre gereksinimlerini karşılayınız.");
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Şifre değiştirilemedi');
      }

      toast.success("Şifreniz başarıyla değiştirildi!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

    } catch (error: any) {
      console.error('Şifre değiştirilirken hata:', error);
      toast.error(error.message || 'Şifre değiştirilemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="flex-1 p-6 bg-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl text-gray-900">Profil Düzenle</h1>
            <p className="text-gray-600">Kişisel bilgilerinizi güncelleyin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kişisel Bilgiler */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Kişisel Bilgiler</CardTitle>
              <CardDescription>Temel profil bilgilerinizi burada düzenleyebilirsiniz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Adınızı giriniz"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Soyadınızı giriniz"
                    maxLength={50}
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
                  placeholder="ornek@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon Numarası</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Telefon numaranızı giriniz"
                  maxLength={11}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Cinsiyet</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cinsiyet seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Kadın</SelectItem>
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="other">Belirtmek istemiyorum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">Kan Grubu</Label>
                  <Select value={formData.bloodType} onValueChange={(value) => handleInputChange('bloodType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kan grubu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="0+">0+</SelectItem>
                      <SelectItem value="0-">0-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Doğum Tarihi</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Adresinizi girin (maksimum 200 karakter)"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 text-right">
                  {formData.address.length}/200 karakter
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                className="w-full"
                disabled={!hasChanges()}
              >
                Profil Bilgilerini Kaydet
              </Button>
            </CardContent>
          </Card>

          {/* Şifre Değiştirme */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Mevcut şifrenizi girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-slate-800 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Yeni şifrenizi girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-slate-800 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yeni Şifre Tekrar</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-slate-800 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <ul className="list-disc list-inside space-y-1">
                  {passwordRequirements.map(req => {
                    const errors = getPasswordErrors(passwordData.newPassword);
                    if (!errors[req.key as keyof typeof errors]) return null;
                    return <li key={req.key} className="text-red-600">{req.label}</li>;
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