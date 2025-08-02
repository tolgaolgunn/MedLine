import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Eye, EyeOff, User } from "lucide-react";
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
function getPasswordErrors(password: string): Record<'length' | 'upper' | 'lower' | 'digit' | 'punct', boolean> {
  return {
    length: password.length < 8,
    upper: !/[A-Z]/.test(password),
    lower: !/[a-z]/.test(password),
    digit: !/[0-9]/.test(password),
    punct: !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  };
}

const passwordRequirements: { key: 'length' | 'upper' | 'lower' | 'digit' | 'punct'; label: string }[] = [
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
    address: ""
  });

  // Orijinal form verilerini saklamak için
  const [originalFormData, setOriginalFormData] = useState({
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
        
        // Backend'den gelen full_name'i ad ve soyada ayır
        const nameParts = (userData.full_name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        // Backend'den gelen veriyi formData'ya uyarla
        const newFormData = {
          firstName: firstName,
          lastName: lastName,
          email: userData.email || "",
          phone: userData.phone_number || "",
          gender: userData.gender || "",
          address: userData.address || ""
        };
        
        setFormData(newFormData);
        setOriginalFormData(newFormData); // Orijinal verileri de sakla

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
    let validatedValue = value;
    
    switch (field) {
      case 'firstName':
      case 'lastName':
        // Sadece harf ve boşluk
        validatedValue = value.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '');
        break;
      case 'email':
        // E-posta için anında validasyon yok, sadece kaydetme sırasında kontrol edilecek
        break;
      case 'phone':
        // Sadece rakam
        validatedValue = value.replace(/[^0-9]/g, '');
        break;
      case 'address':
        // 200 karakter sınırı
        if (value.length > 200) {
          toast.error('Adres en fazla 200 karakter olabilir');
          return;
        }
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: validatedValue
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Form verilerinde değişiklik olup olmadığını kontrol et
  const hasChanges = () => {
    return (
      formData.firstName !== originalFormData.firstName ||
      formData.lastName !== originalFormData.lastName ||
      formData.email !== originalFormData.email ||
      formData.phone !== originalFormData.phone ||
      formData.gender !== originalFormData.gender ||
      formData.address !== originalFormData.address
    );
  };

  const handleSaveProfile = async () => {
    // Form validasyonu
    if (!formData.firstName.trim()) {
      toast.error('Ad alanı boş bırakılamaz');
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error('Soyad alanı boş bırakılamaz');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('E-posta alanı boş bırakılamaz');
      return;
    }
    
    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Geçerli bir e-posta adresi giriniz');
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error('Telefon alanı boş bırakılamaz');
      return;
    }
    if (formData.phone.length < 10) {
      toast.error('Telefon numarası en az 10 haneli olmalıdır');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      // Backend'e gönderilecek veriyi hazırla - userController.js'deki updateProfile endpoint'i ile uyumlu
      const updateData = {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone_number: formData.phone,
        gender: formData.gender,
        address: formData.address,
        birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null
      };

      console.log('Gönderilen profil verileri:', updateData);

      const response = await fetch('http://localhost:3005/api/profile', {
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
      
      // Başarılı kaydetme sonrası orijinal verileri güncelle
      setOriginalFormData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        address: formData.address
      });

      // Kullanıcı bilgilerini localStorage'da güncelle
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userObj.full_name = updateData.full_name;
        userObj.email = updateData.email;
        userObj.phone_number = updateData.phone_number;
        localStorage.setItem('user', JSON.stringify(userObj));
      }
      
    } catch (error: any) {
      console.error('Profil güncellenirken hata:', error);
      toast.error(error.message || 'Profil bilgileri güncellenemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleChangePassword = async () => {
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

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      const response = await fetch('http://localhost:3005/api/change-password', {
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
        {/* Header */}
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
                      <SelectItem value="other">Belirtmek istemiyorum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                                 <div className="space-y-2">
                   <Label htmlFor="birthDate">Doğum Tarihi</Label>
                   <Input
                     id="birthDate"
                     type="date"
                     value={birthDate ? birthDate.toISOString().split('T')[0] : ''}
                     onChange={(e) => {
                       if (e.target.value) {
                         setBirthDate(new Date(e.target.value));
                       } else {
                         setBirthDate(undefined);
                       }
                     }}
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
              <CardDescription>
                Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirin
              </CardDescription>
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
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <div className="relative">
                  <Input
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
                <Label htmlFor="confirmPassword">Yeni Şifre Tekrar</Label>
                <div className="relative">
                  <Input
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