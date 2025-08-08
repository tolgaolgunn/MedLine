import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Eye, EyeOff, User } from "lucide-react";
import { toast } from "react-toastify";

// Constants
const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'En az 8 karakter uzunluğunda olmalıdır.' },
  { key: 'upper', label: '1 büyük harf içermelidir.' },
  { key: 'lower', label: '1 küçük harf içermelidir.' },
  { key: 'digit', label: '1 sayı içermelidir.' },
  { key: 'punct', label: '1 noktalama işareti içermelidir.' }
];

const MAX_ADDRESS_LENGTH = 200;

// Types
type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  birthDate: string;
};

type DoctorData = {
  specialty: string;
  license_number: string;
  experience_years: string;
  biography: string;
  city: string;
  district: string;
  hospital_name: string;
};

type PasswordData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// Helper functions
function getPasswordErrors(password: string) {
  return {
    length: password.length < 8,
    upper: !/[A-Z]/.test(password),
    lower: !/[a-z]/.test(password),
    digit: !/[0-9]/.test(password),
    punct: !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  };
}

function validateName(name: string): string {
  return name.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '');
}

function validatePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function DoctorProfile() {
  // State
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    birthDate: ""
  });

  const [doctorData, setDoctorData] = useState<DoctorData>({
    specialty: "",
    license_number: "",
    experience_years: "",
    biography: "",
    city: "",
    district: "",
    hospital_name: ""
  });

  const [originalFormData, setOriginalFormData] = useState({
    ...formData,
    ...doctorData
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Effects
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
          birthDate: userData.birth_date ? new Date(userData.birth_date).toISOString().split('T')[0] : ""
        };

        const newDoctorData = userData.doctor_profile ? {
          specialty: userData.doctor_profile.specialty || "",
          license_number: userData.doctor_profile.license_number || "",
          experience_years: userData.doctor_profile.experience_years?.toString() || "",
          biography: userData.doctor_profile.biography || "",
          city: userData.doctor_profile.city || "",
          district: userData.doctor_profile.district || "",
          hospital_name: userData.doctor_profile.hospital_name || ""
        } : {
          specialty: "",
          license_number: "",
          experience_years: "",
          biography: "",
          city: "",
          district: "",
          hospital_name: ""
        };

        setFormData(newFormData);
        setDoctorData(newDoctorData);
        setOriginalFormData({
          ...newFormData,
          ...newDoctorData
        });

      } catch (error) {
        console.error('Profil bilgileri alınırken hata:', error);
        toast.error('Profil bilgileri yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Handlers
  const handleInputChange = (field: keyof FormData, value: string) => {
    let validatedValue = value;
    
    switch (field) {
      case 'firstName':
      case 'lastName':
        validatedValue = validateName(value);
        break;
      case 'phone':
        validatedValue = validatePhone(value);
        break;
    }

    setFormData(prev => ({ ...prev, [field]: validatedValue }));
  };

  const handleDoctorInputChange = (field: keyof DoctorData, value: string) => {
    setDoctorData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const hasChanges = (): boolean => {
    const currentData = { ...formData, ...doctorData };
    return Object.keys(currentData).some(
      key => currentData[key as keyof typeof currentData] !== 
             originalFormData[key as keyof typeof originalFormData]
    );
  };

  const validateProfileForm = (): boolean => {
    if (!formData.firstName.trim()) {
      toast.error('Ad alanı boş bırakılamaz');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Soyad alanı boş bırakılamaz');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('E-posta alanı boş bırakılamaz');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Geçerli bir e-posta adresi giriniz');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Telefon alanı boş bırakılamaz');
      return false;
    }
    if (formData.phone.length < 10) {
      toast.error('Telefon numarası en az 10 haneli olmalıdır');
      return false;
    }
    if (!doctorData.specialty.trim()) {
      toast.error('Uzmanlık alanı boş bırakılamaz');
      return false;
    }
    if (!doctorData.city.trim()) {
      toast.error('Şehir boş bırakılamaz');
      return false;
    }
    if (!doctorData.district.trim()) {
      toast.error('İlçe boş bırakılamaz');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      const updateData = {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone_number: formData.phone,
        gender: formData.gender,
        address: formData.address,
        birth_date: formData.birthDate || null,
        specialty: doctorData.specialty,
        experience_years: doctorData.experience_years ? parseInt(doctorData.experience_years) : 0,
        biography: doctorData.biography,
        city: doctorData.city,
        district: doctorData.district,
        hospital_name: doctorData.hospital_name
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profil güncellenemedi');
      }

      toast.success("Profil bilgileriniz başarıyla güncellendi!");
      setOriginalFormData({
        ...formData,
        ...doctorData
      });
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
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("Mevcut şifre yeni şifre ile aynı olamaz!");
      return;
    }

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

  // Render
  if (isLoading) {
    return <div className="flex-1 p-6 bg-white flex items-center justify-center">Yükleniyor...</div>;
  }

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
          {/* Profile Information */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Doktor Profili</CardTitle>
              <CardDescription>Doktor profil bilgilerinizi burada düzenleyebilirsiniz</CardDescription>
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

              {/* Doctor Specific Fields */}
              <div className="space-y-2 border-t pt-4 mt-4">
                <Label htmlFor="specialty">Uzmanlık</Label>
                <Input
                  id="specialty"
                  value={doctorData.specialty}
                  onChange={e => handleDoctorInputChange('specialty', e.target.value)}
                  placeholder="Uzmanlık alanınızı giriniz"
                />

                <div className="space-y-2">
                  <Label htmlFor="license_number" className="text-sm">Lisans Numarası</Label>
                  <div className="p-1">
                    {doctorData.license_number || "Lisans numarası bulunamadı"}
                  </div>
                </div>

                <Label htmlFor="experience_years">Deneyim Yılı</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min={0}
                  value={doctorData.experience_years}
                  onChange={e => handleDoctorInputChange('experience_years', e.target.value)}
                  placeholder="Deneyim yılınızı giriniz"
                />

                <Label htmlFor="biography">Biyografi</Label>
                <Textarea
                  id="biography"
                  value={doctorData.biography}
                  onChange={e => handleDoctorInputChange('biography', e.target.value)}
                  placeholder="Kısa bir biyografi yazınız"
                />

                <Label htmlFor="city">Şehir</Label>
                <Input
                  id="city"
                  value={doctorData.city}
                  onChange={e => handleDoctorInputChange('city', e.target.value)}
                  placeholder="Şehir"
                />

                <Label htmlFor="district">İlçe</Label>
                <Input
                  id="district"
                  value={doctorData.district}
                  onChange={e => handleDoctorInputChange('district', e.target.value)}
                  placeholder="İlçe"
                />

                <Label htmlFor="hospital_name">Çalıştığınız Hastane</Label>
                <Input
                  id="hospital_name"
                  value={doctorData.hospital_name}
                  onChange={e => handleDoctorInputChange('hospital_name', e.target.value)}
                  placeholder="Hastane adı"
                />
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

          {/* Password Change */}
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
                    type={showPassword.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Mevcut şifrenizi girin"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Yeni şifrenizi girin"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yeni Şifre Tekrar</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <ul className="list-disc list-inside space-y-1">
                  {PASSWORD_REQUIREMENTS.map(req => {
                    const errors = getPasswordErrors(passwordData.newPassword);
                    if (!errors[req.key as keyof typeof errors]) return null;
                    return <li key={req.key} className="text-red-600">{req.label}</li>;
                  })}
                </ul>
              </div>

              <Button 
                onClick={handleChangePassword} 
                className="w-full"
                disabled={
                  !passwordData.currentPassword || 
                  !passwordData.newPassword || 
                  !passwordData.confirmPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword ||
                  Object.values(getPasswordErrors(passwordData.newPassword)).some(Boolean)
                }
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