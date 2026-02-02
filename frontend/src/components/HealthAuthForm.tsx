"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Eye, EyeOff, Mail, Lock, Phone, Calendar, ArrowLeft, CheckCircle, Stethoscope, Users, Shield, Brain, Activity } from "lucide-react";
import { MedLineLogo } from "./ui/MedLineLogo";
import { toast } from 'react-toastify';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast as sonnerToast } from 'sonner';
import {
  Form as ShadForm,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'  ;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

type AuthMode = "login" | "register" | "forgot-password" | "reset-password" | "reset-success";

function filterNameInput(value: string) {
  return value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s]/g, '');
}

function filterPhoneInput(value: string) {
  return value.replace(/[^0-9\s]/g, '');
}

function getPasswordErrors(password: string): Record<'upper' | 'lower' | 'digit' | 'punct', boolean> {
  return {
    upper: !/[A-Z]/.test(password),
    lower: !/[a-z]/.test(password),
    digit: !/[0-9]/.test(password),
    punct: !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  };
}
const passwordRequirements: { key: 'upper' | 'lower' | 'digit' | 'punct'; label: string }[] = [
  { key: 'upper', label: '1 büyük harf' },
  { key: 'lower', label: '1 küçük harf' },
  { key: 'digit', label: '1 sayı' },
  { key: 'punct', label: '1 noktalama işareti' }
];

export function HealthAuthForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [isSamePassword, setIsSamePassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneCountry: "+90",
    birthDate: "",
    gender: "",
    address: "",
    password: "",
    confirmPassword: "",
    national_id: "",
    blood_type: ""
  });
  
  // TC Kimlik input değişikliğini kontrol eden fonksiyon
  const handleTCKimlikInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    setFormData(prev => ({
      ...prev,
      national_id: value
    }));
  };
  const [birthDateError, setBirthDateError] = useState("");

  useEffect(() => {
    const pathname = location.pathname;
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (pathname === '/register') {
      setMode('register');
    } else if (pathname === '/forgot-password') {
      setMode('forgot-password');
    } else if (pathname === '/reset-password') {
      if (token) {
        setResetToken(token);
        setMode('reset-password');
      } else {
        navigate('/forgot-password');
      }
    } else if (pathname === '/reset-success') {
      setMode('reset-success');
    } else {
      setMode('login');
    }
  }, [location.pathname, location.search]);

  // Beni hatırla özelliği - sayfa yüklendiğinde hatırlanan email'i yükle
  // Token kontrolü ve yenileme için useEffect
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Token'ı decode et ve süresini kontrol et
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = decodedToken.exp * 1000; // Unix timestamp'i milisaniyeye çevir
          
          // Token'ın süresi dolmak üzereyse (15 dakika kala) yenile
          if (expirationTime - Date.now() < 15 * 60 * 1000) {
            const success = await refreshToken();
            if (!success) {
              // Token yenilenemezse login sayfasına yönlendir
              navigate('/login');
            }
          }
        } catch (error) {
          console.error('Token kontrol hatası:', error);
        }
      }
    };

    const tokenCheckInterval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);
    
    checkAndRefreshToken();

    return () => clearInterval(tokenCheckInterval);
  }, []);

  useEffect(() => {
    if (mode === 'login') {
      const rememberedEmail = localStorage.getItem("rememberedEmail");
      const isRemembered = localStorage.getItem("rememberMe") === "true";
      
      if (rememberedEmail && isRemembered) {
        setFormData(prev => ({ ...prev, email: rememberedEmail }));
        setRememberMe(true);
      }
    }
  }, [mode]);

  // Reset password token'ını URL'den al
  useEffect(() => {
    if (mode === 'reset-password') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        setResetToken(token);
      }
    }
  }, [mode]);

  const API_URL = "http://localhost:3005/api";

  // Login işlemini güncelle
  // Token yenileme fonksiyonu
  const refreshToken = async () => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const isRemembered = localStorage.getItem("rememberMe") === "true";
    
    if (rememberedEmail && isRemembered) {
      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: rememberedEmail,
            password: formData.password
          })
        });

        const data = await response.json();
        if (data.token) {
          localStorage.setItem("token", data.token);
          return true;
        }
      } catch (error) {
        console.error('Token yenileme hatası:', error);
        return false;
      }
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          toast.error(data.message || "Giriş Başarısız.");
          return;
        }

        // Token'ı kaydet
        localStorage.setItem("token", data.token);

        // User verisini kontrol et ve kaydet
        const userData = {
          user_id: data.user.id || data.user.user_id,
          email: data.user.email,
          role: data.user.role,
          full_name: data.user.full_name
        };

        localStorage.setItem('user', JSON.stringify(userData));
        
        // Beni hatırla özelliği
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("rememberedEmail");
        }
        
        toast.success("Giriş Başarılı");
        navigate("/dashboard");
      } catch (err) {
        console.error('Login error:', err);
        toast.error("Sunucu Hatası:" + (err instanceof Error ? err.message : String(err)));
      }
    }
    if (mode === "register") {
      // 18 yaş kontrolü
      // if (formData.birthDate) {
      //   const today = new Date();
      //   const birthDate = new Date(formData.birthDate);
      //   const age = today.getFullYear() - birthDate.getFullYear();
      //   const m = today.getMonth() - birthDate.getMonth();
      //   const d = today.getDate() - birthDate.getDate();
      //   const isUnder18 = age < 18 || (age === 18 && (m < 0 || (m === 0 && d < 0)));
      //   if (isUnder18) {
      //     setBirthDateError("18 yaş altı üyeler kayıt olamaz.");
      //     return;
      //   } else {
      //     setBirthDateError("");
      //   }
      // }
      
      if (formData.password !== formData.confirmPassword) {
        toast.error("Şifreler Eşleşmiyor.");
        return;
      }
      // Şifre gereksinimleri
      const errors = getPasswordErrors(formData.password);
      if (Object.values(errors).some(Boolean)) {
        toast.error("Şifre gereksinimlerini karşılayınız.");
        return;
      }
      
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
          !formData.birthDate || !formData.gender || !formData.address || 
          !formData.national_id || !formData.blood_type) {
        toast.error("Lütfen tüm alanları doldurun.");
        return;
      }

      // TC Kimlik Numarası validasyonu
      if (!formData.national_id) {
        toast.error("TC Kimlik Numarası zorunludur.");
        return;
      }
      if (formData.national_id.length !== 11) {
        toast.error("TC Kimlik Numarası 11 haneli olmalıdır.");
        return;
      }
      if (!/^\d+$/.test(formData.national_id)) {
        toast.error("TC Kimlik Numarası sadece rakamlardan oluşmalıdır.");
        return;
      }
      // TC Kimlik numarası mantıksal doğrulama
      if (formData.national_id[0] === '0') {
        toast.error("TC Kimlik Numarası 0 ile başlayamaz.");
        return;
      }
      // Telefon numarası birleştir
      const fullPhone = formData.phoneCountry + ' ' + formData.phone;

     //Cinsiyet değerini veritabanı formatına çevir
      let genderDB = formData.gender;
      if (formData.gender === 'Erkek') genderDB = 'male';
      else if (formData.gender === 'Kadın') genderDB = 'female';
      else if (formData.gender === 'Belirtmek istemiyorum') genderDB = 'other';
      
      try {
        const response = await fetch(`${API_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            password: formData.password,
            phone_number: fullPhone,
            birth_date: formData.birthDate,
            gender: genderDB,
            address: formData.address,
            role: "patient",
            national_id: formData.national_id,
            blood_type: formData.blood_type
          })
        });
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.message || "Kayıt başarısız.");
          return;
        }
        toast.success("Kayıt Başarılı");
        navigate("/login");
      } catch (err) {
        toast.error("Sunucu Hatası:" + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setMode("reset-success");
  };

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgotPassword = mode === "forgot-password";
  const isResetPassword = mode === "reset-password";
  const isResetSuccess = mode === "reset-success";

  // Şifremi unuttum formu
  const forgotFormSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  });
  type ForgotFormType = z.infer<typeof forgotFormSchema>;
  const forgotForm = useForm<ForgotFormType>({
    resolver: zodResolver(forgotFormSchema),
    defaultValues: { email: '' },
  });
  async function onForgotSubmit(values: ForgotFormType) {
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        sonnerToast.error(data.message || 'Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.');
        return;
      }
      
      setResetEmail(values.email);
      sonnerToast.success('Şifre sıfırlama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.');
      setMode("reset-success");
    } catch (error) {
      sonnerToast.error('Sunucu hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Şifre kontrolü fonksiyonu
  const checkPassword = async (password: string) => {
    if (!resetToken || !password) {
      setIsSamePassword(false);
      return;
    }

    try {
      setIsCheckingPassword(true);
      const response = await fetch(`${API_URL}/check-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: password
        })
      });
      
      const data = await response.json();
      setIsSamePassword(response.status === 400 && data.message === "Şifreniz önceki şifrenizle aynı olamaz.");
    } catch (error) {
      setIsSamePassword(false);
    } finally {
      setIsCheckingPassword(false);
    }
  };

  // Şifre sıfırlama fonksiyonu
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetToken) {
      sonnerToast.error('Geçersiz veya eksik token.');
      return;
    }

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      sonnerToast.error('Şifreler eşleşmiyor.');
      return;
    }

    // Şifre gereksinimleri kontrolü
    const errors = getPasswordErrors(resetPasswordData.newPassword);
    if (Object.values(errors).some(Boolean)) {
      sonnerToast.error('Şifre gereksinimlerini karşılayınız.');
      return;
    }

    // Aynı şifre kontrolü
    if (isSamePassword) {
      sonnerToast.error('Şifreniz önceki şifrenizle aynı olamaz.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: resetPasswordData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        sonnerToast.error(data.message || 'Şifre sıfırlama başarısız. Lütfen tekrar deneyin.');
        return;
      }
      
      sonnerToast.success('Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.');
      navigate("/login");
    } catch (error) {
      sonnerToast.error('Sunucu hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white w-full">
          {/* Logo & Header */}
          <div className="text-center mb-12">
            <MedLineLogo size={80} className="mb-6 mx-auto" />
            <h1 className="text-4xl font-bold mb-3 text-white">MedLine</h1>
            <p className="text-slate-300 text-xl mb-8">Sağlığınız bizim önceliğimiz</p>
          </div>

          {/* Features */}
          <div className="space-y-6 max-w-sm w-full">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Kişiselleştirilmiş Takip</h3>
                <p className="text-slate-300 text-sm">Size özel sağlık planları ve takip</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Uzman Doktor Kadrosu</h3>
                <p className="text-slate-300 text-sm">Alanında uzman doktorlardan destek</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Güvenli & Gizli</h3>
                <p className="text-slate-300 text-sm">Verileriniz tamamen güvende</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Ön Tanı</h3>
                <p className="text-slate-300 text-sm">Yapay zeka ile hızlı ön tanı</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Anlık Raporlama</h3>
                <p className="text-slate-300 text-sm">Sağlık durumunuzu anlık takip edin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MedLineLogo size={48} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MedLine</h1>
            </div>

            {/* Back Button for Forgot Password */}
            {(isForgotPassword || isResetPassword || isResetSuccess) && (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 text-gray-600 hover:text-slate-800 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Geri Dön
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin && "Hesabınıza Giriş Yapın"}
                {isRegister && "Yeni Hesabınızı Oluşturun"}
              
              </h2>
              <p className="text-gray-600">
                {isRegister && "Sağlıklı yaşam yolculuğunuza başlayın"}
               
              </p>
            </div>

            {/* Success Message */}
            {isResetSuccess && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-slate-800" />
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    <strong className="text-gray-900">{resetEmail}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
                  </p>
                  <p className="text-sm text-gray-500">
                    E-postanızı kontrol edin ve bağlantıya tıklayarak yeni şifrenizi oluşturun.
                  </p>
                  <Button
                    onClick={() => navigate("/login")}
                    variant="outline"
                    className="w-42 mt-6 !border-2 !border-gray-300 text-slate-800 hover:bg-slate-50"
                  >
                    Giriş Sayfasına Dön
                  </Button>
                </div>
              </div>
            )}

            {/* Reset Password Form */}
            {isResetPassword && (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Yeni Şifre Belirleyin
                  </h2>
                  <p className="text-gray-600">
                    Güvenliğiniz için güçlü bir şifre seçin.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-700">Yeni Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={resetPasswordData.newPassword}
                        onChange={e => {
                          const newPassword = e.target.value;
                          setResetPasswordData(prev => ({ ...prev, newPassword }));
                          if (newPassword.length >= 8) {
                            setTimeout(() => checkPassword(newPassword), 500);
                          } else {
                            setIsSamePassword(false);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleResetPassword(e as any);
                          }
                        }}
                        className="pl-9 pr-9 h-11 border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-slate-800 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Şifre gereksinimleri */}
                    <ul className="text-xs mt-1 ml-4 list-disc space-y-1">
                      {passwordRequirements.map(req => {
                        const errors = getPasswordErrors(resetPasswordData.newPassword);
                        if (!errors[req.key]) return null;
                        return (
                          <li key={req.key} className="text-red-600">{req.label}</li>
                        );
                      })}
                    </ul>

                    {/* Aynı şifre uyarısı */}
                    {isSamePassword && (
                      <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                        <span>⚠️</span>
                        Şifreniz önceki şifrenizle aynı olamaz.
                      </div>
                    )}

                    {/* Şifre kontrol ediliyor mesajı */}
                    {isCheckingPassword && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                        <span>⏳</span>
                        Şifre kontrol ediliyor...
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmResetPassword" className="text-gray-700">Şifre Tekrar</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmResetPassword"
                        type={showConfirmResetPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={resetPasswordData.confirmPassword}
                        onChange={e => setResetPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleResetPassword(e as any);
                          }
                        }}
                        className="pl-9 pr-9 h-11 border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-slate-800 transition-colors"
                      >
                        {showConfirmResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {resetPasswordData.newPassword && resetPasswordData.confirmPassword && resetPasswordData.newPassword !== resetPasswordData.confirmPassword && (
                      <div className="flex items-center gap-1 text-xs text-red-600 mt-1">Şifreler uyuşmamaktadır.</div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-blue-950 hover:to-blue-950 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? "Şifre Sıfırlanıyor..." : "Şifreyi Sıfırla"}
                  </Button>
                </form>

                {/* Switch Mode */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Şifrenizi hatırladınız mı? {" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-slate-800 hover:text-slate-900 hover:underline font-semibold transition-colors"
                    >
                      Giriş Yap
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* Forgot Password Form */}
            {isForgotPassword && (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Şifremi Unuttum
                  </h2>
                  <p className="text-gray-600">
                    Şifre sıfırlama bağlantısı almak için e-posta adresinizi girin.
                  </p>
                </div>

                <ShadForm {...forgotForm}>
                  <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">E-posta Adresi</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <FormField
                          control={forgotForm.control}
                          name="email"
                          render={({ field }: { field: any }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="ornek@email.com"
                                  className="pl-9 h-11 border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                                  autoComplete="email"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      forgotForm.handleSubmit(onForgotSubmit)();
                                    }
                                  }}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-12 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-blue-950 hover:to-blue-950 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {isSubmitting ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                    </Button>
                  </form>
                </ShadForm>

                {/* Switch Mode */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Şifrenizi hatırladınız mı? {" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-slate-800 hover:text-slate-900 hover:underline font-semibold transition-colors"
                    >
                      Giriş Yap
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* Login/Register Form */}
            {(isLogin || isRegister) && (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {isRegister && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-700">Ad</Label>
                        <div className="relative">
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Adınız"
                            value={formData.firstName}
                            onChange={e => setFormData(prev => ({ ...prev, firstName: filterNameInput(e.target.value) }))}
                            className="h-11 border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-700">Soyad</Label>
                        <div className="relative">
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Soyadınız"
                            value={formData.lastName}
                            onChange={e => setFormData(prev => ({ ...prev, lastName: filterNameInput(e.target.value) }))}
                            className="h-11 border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">E-posta Adresi</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmit(e as any);
                          }
                        }}
                        className="pl-9 h-11 border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                        required
                      />
                    </div>
                  </div>
                  {isRegister && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Telefon alanı ülke kodu ile, büyük input */}
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="phone" className="text-gray-700">Telefon</Label>
                        <div className="flex gap-2">
                          <select
                            id="phoneCountry"
                            value={formData.phoneCountry}
                            onChange={e => setFormData(prev => ({ ...prev, phoneCountry: e.target.value }))}
                            className="appearance-none outline-none h-14 border border-gray-300 focus:border-slate-800 bg-white rounded-md px-2 min-w-[80px] font-medium text-base text-gray-900"
                            required
                          >
                            <option value="+90">🇹🇷 +90</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+49">🇩🇪 +49</option>
                            <option value="+33">🇫🇷 +33</option>
                            <option value="+7">🇷🇺 +7</option>
                            <option value="+39">🇮🇹 +39</option>
                            <option value="+34">🇪🇸 +34</option>
                            <option value="+61">🇦🇺 +61</option>
                            <option value="+81">🇯🇵 +81</option>
                            <option value="+86">🇨🇳 +86</option>
                          </select>
                          <div className="relative flex-1">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="555 555 55 55"
                              value={formData.phone}
                              onChange={e => setFormData(prev => ({ ...prev, phone: filterPhoneInput(e.target.value) }))}
                              className="pl-9 h-14 text-lg border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      {/* Doğum tarihi ve Cinsiyet*/}
                      <div className="space-y-2">
                        <Label htmlFor="birthDate" className="text-gray-700">Doğum Tarihi</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                            className="pl-9 h-11 border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                            required
                          />
                        </div>
                        {birthDateError && (
                          <div className="flex items-center gap-1 text-xs text-red-600 mt-1">{birthDateError}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-gray-700">Cinsiyet</Label>
                        <select
                          id="gender"
                          value={formData.gender}
                          onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                          className="appearance-none outline-none h-11 border border-gray-300 focus:border-slate-800 bg-white rounded-md px-3 w-full text-gray-900"
                          required
                        >
                          <option value="">Seçiniz</option>
                          <option value="Erkek">Erkek</option>
                          <option value="Kadın">Kadın</option>
                          <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
                        </select>
                      </div>

                      {/* TC Kimlik Numarası */}
                      <div className="space-y-2">
                        <Label htmlFor="national_id" className="text-gray-700">TC Kimlik No</Label>
                        <div>
                          <Input
                            id="national_id"
                            type="text"
                            placeholder="TC Kimlik Numaranız"
                            value={formData.national_id}
                            onChange={e => {
                              // Sadece rakam girişine izin ver
                              const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                              setFormData(prev => ({ ...prev, national_id: value }))
                            }}
                            onKeyPress={(e) => {
                              // Rakam dışındaki tuşlara izin verme
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            pattern="\d{11}"
                            className="h-11 border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                            maxLength={11}
                            required
                          />
                          {formData.national_id && formData.national_id.length !== 11 && (
                            <div className="text-xs text-red-500 mt-1">
                              TC Kimlik Numarası 11 haneli olmalıdır. ({11 - formData.national_id.length} hane kaldı)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Kan Grubu */}
                      <div className="space-y-2">
                        <Label htmlFor="blood_type" className="text-gray-700">Kan Grubu</Label>
                        <select
                          id="blood_type"
                          value={formData.blood_type}
                          onChange={e => setFormData(prev => ({ ...prev, blood_type: e.target.value }))}
                          className="appearance-none outline-none h-11 border border-gray-300 focus:border-slate-800 bg-white rounded-md px-3 w-full text-gray-900"
                          required
                        >
                          <option value="">Seçiniz</option>
                          <option value="A+">A RH+</option>
                          <option value="A-">A RH-</option>
                          <option value="B+">B RH+</option>
                          <option value="B-">B RH-</option>
                          <option value="AB+">AB RH+</option>
                          <option value="AB-">AB RH-</option>
                          <option value="0+">0 RH+</option>
                          <option value="0-">0 RH-</option>
                        </select>
                      </div>
                      {/* Adres geniş ve kısa, alta */}
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="address" className="text-gray-700">Adres</Label>
                        <textarea
                          id="address"
                          placeholder="Adresiniz"
                          value={formData.address}
                          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="appearance-none outline-none h-16 min-h-[48px] w-full border border-gray-300 focus:border-slate-800 bg-white rounded-md px-3 py-2 resize-none text-gray-900"
                          required
                        />
                      </div>
                    </div>
                  )}
                  {/* Şifre alanı ve gereksinimler */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmit(e as any);
                          }
                        }}
                        className="pl-9 pr-9 h-11 border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-slate-800 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Şifre gereksinimleri */}
                    {isRegister && (
                      <ul className="text-xs mt-1 ml-4 list-disc space-y-1 text-white">
                        {passwordRequirements.map(req => {
                          const errors = getPasswordErrors(formData.password);
                          if (!errors[req.key]) return null;
                          return (
                            <li key={req.key} className="text-red-600">{req.label}</li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  
                  {/* Beni Hatırla - Sadece login modunda göster */}
                  {isLogin && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked: boolean | "indeterminate") => setRememberMe(checked as boolean)}
                        className="border-slate-300 data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800"
                      />
                      <Label 
                        htmlFor="rememberMe" 
                        className="text-sm text-gray-600 cursor-pointer"
                        onClick={() => setRememberMe(!rememberMe)}
                      >
                        Beni Hatırla
                      </Label>
                    </div>
                  )}
                  
                  {/* Şifre tekrar ve hata */}
                  {isRegister && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700">Şifre Tekrar</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSubmit(e as any);
                            }
                          }}
                          className="pl-9 pr-9 h-11 border-gray-300 focus:border-slate-800 bg-white text-gray-900"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-slate-800 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">Şifreler uyuşmamaktadır.</div>
                      )}
                    </div>
                  )}
                  {/* Kullanım koşulları */}
                  {isRegister && (
                    <Label htmlFor="terms" className="flex flex-row items-center gap-2 text-sm text-gray-600 w-full cursor-pointer">
                      <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked: boolean | "indeterminate") => setAcceptTerms(checked as boolean)}
                        className="border-slate-300 data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800"
                      />
                      <span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTermsModal(true);
                          }}
                          className="text-slate-800 hover:underline cursor-pointer inline"
                        >
                          Kullanım Koşulları
                        </button>
                        <span> ve </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPrivacyModal(true);
                          }}
                          className="text-slate-800 hover:underline cursor-pointer inline"
                        >
                          Gizlilik Politikası
                        </button>
                        <span>'nı okudum ve kabul ediyorum.</span>
                      </span>
                    </Label>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-blue-950 hover:to-blue-950 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    disabled={isRegister && !acceptTerms}
                  >
                    {isLogin ? "Giriş Yap" : "Hesap Oluştur"}
                  </Button>
                  {isLogin && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-sm text-slate-800 hover:text-slate-900 hover:underline transition-colors"
                      >
                        Şifremi Unuttum
                      </button>
                    </div>
                  )}
                </form>
                {/* Switch Mode */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"} {" "}
                    <button
                      type="button"
                      onClick={() => navigate(isLogin ? "/register" : "/login")}
                      className="text-slate-800 hover:text-slate-900 hover:underline font-semibold transition-colors"
                    >
                      {isLogin ? "Hesap Oluştur" : "Giriş Yap"}
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kullanım Koşulları Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-3xl max-h-[calc(100vh-3rem)] sm:max-h-[90vh] overflow-y-auto mx-auto my-auto">
          <DialogHeader>
            <DialogTitle>Kullanım Koşulları</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-base mb-2">1. Genel Hükümler</h3>
              <p>
                MedLine sağlık platformu , kullanıcılarına sağlık hizmetleri sunmak amacıyla tasarlanmıştır. 
                Bu kullanım koşulları, Platform'un kullanımına ilişkin hak ve yükümlülükleri düzenlemektedir. 
                Platform'u kullanarak, bu koşulları kabul etmiş sayılırsınız.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">2. Hizmet Kapsamı</h3>
              <p>
                MedLine platformu aşağıdaki hizmetleri sunmaktadır:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Doktor-hasta randevu yönetimi</li>
                <li>Online ve yüz yüze randevu seçenekleri</li>
                <li>Reçete yönetimi ve görüntüleme</li>
                <li>Tıbbi kayıt takibi</li>
                <li>AI destekli sağlık danışmanlığı</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">3. Kullanıcı Yükümlülükleri</h3>
              <p>Kullanıcılar aşağıdaki yükümlülüklere uymakla sorumludur:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Doğru, güncel ve eksiksiz bilgi sağlamak</li>
                <li>Hesap güvenliğini sağlamak ve şifreyi gizli tutmak</li>
                <li>Platform'u yasalara aykırı amaçlarla kullanmamak</li>
                <li>Başkalarının haklarına saygı göstermek</li>
                <li>Sahte veya yanıltıcı bilgi vermemek</li>
                <li>Kullanım koşullarını ve gizlilik politikasını okumak ve kabul etmek</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">4. Randevu İptali ve Değişiklik</h3>
              <p>
                Randevularınızı en az 24 saat öncesinden iptal veya değiştirme hakkına sahipsiniz. 
                Geç iptaller için doktorunuzla iletişime geçmeniz gerekmektedir.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">5. Sorumluluk Reddi</h3>
              <p>
                Platform, sağlık hizmetlerinin yerine geçmez. Acil durumlarda 112'yi arayınız. 
                Platform üzerinden verilen bilgiler genel bilgilendirme amaçlıdır ve profesyonel tıbbi tavsiye yerine geçmez.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">6. Fikri Mülkiyet</h3>
              <p>
                Platform'un tüm içeriği, tasarımı ve yazılımı MedLine'a aittir ve telif hakları ile korunmaktadır.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">7. Değişiklikler</h3>
              <p>
                MedLine, bu kullanım koşullarını herhangi bir zamanda değiştirme hakkını saklı tutar. 
                Değişiklikler Platform üzerinden duyurulacaktır.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">8. İletişim</h3>
              <p>
                Kullanım koşulları ile ilgili sorularınız için bizimle iletişime geçebilirsiniz.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gizlilik Politikası Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-3xl max-h-[calc(100vh-3rem)] sm:max-h-[90vh] overflow-y-auto mx-auto my-auto">
          <DialogHeader>
            <DialogTitle>Gizlilik Politikası ve KVKK Aydınlatma Metni</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-base mb-2">1. Veri Sorumlusu</h3>
              <p>
                MedLine sağlık platformu olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında 
                veri sorumlusu sıfatıyla kişisel verilerinizi işlemekteyiz.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">2. İşlenen Kişisel Veriler</h3>
              <p>Aşağıdaki kişisel verileriniz işlenmektedir:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, TC Kimlik No, doğum tarihi</li>
                <li><strong>İletişim Bilgileri:</strong> E-posta, telefon numarası, adres</li>
                <li><strong>Sağlık Verileri:</strong> Tıbbi geçmiş, randevu kayıtları, reçete bilgileri, kan grubu</li>
                <li><strong>Hesap Bilgileri:</strong> Kullanıcı adı, şifre (şifrelenmiş)</li>
                <li><strong>İşlem Bilgileri:</strong> Randevu geçmişi, platform kullanım kayıtları</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">3. Veri İşleme Amaçları</h3>
              <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Sağlık hizmetlerinin sunulması ve yönetimi</li>
                <li>Randevu oluşturma ve takibi</li>
                <li>Reçete yönetimi</li>
                <li>Hasta-doktor iletişiminin sağlanması</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Platform güvenliğinin sağlanması</li>
                <li>Hizmet kalitesinin iyileştirilmesi</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">4. Veri İşleme Hukuki Sebepleri</h3>
              <p>Kişisel verileriniz aşağıdaki hukuki sebeplere dayanarak işlenmektedir:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>KVKK Madde 5/2-a: Açık rıza</li>
                <li>KVKK Madde 5/2-c: Sözleşmenin kurulması veya ifası</li>
                <li>KVKK Madde 5/2-e: Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi</li>
                <li>KVKK Madde 6/3: Sağlık hizmetlerinin planlanması, yönetimi ve finansmanı</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">5. Verilerin Paylaşılması</h3>
              <p>
                Kişisel verileriniz, yalnızca yasal zorunluluklar ve hizmet sunumu için gerekli olduğu ölçüde, 
                aşağıdaki taraflarla paylaşılabilir:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Randevu aldığınız doktorlar ve sağlık kuruluşları</li>
                <li>Yasal yükümlülükler gereği yetkili kamu kurum ve kuruluşları</li>
                <li>Hizmet sağlayıcılarımız (sunucu, hosting vb.) - sadece teknik destek amaçlı</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">6. Veri Güvenliği</h3>
              <p>
                Kişisel verilerinizin güvenliği için teknik ve idari önlemler alınmaktadır:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>SSL/TLS şifreleme protokolleri</li>
                <li>Güvenli veritabanı yönetimi</li>
                <li>Erişim kontrolü ve yetkilendirme</li>
                <li>Düzenli güvenlik denetimleri</li>
                <li>Şifrelerin hash'lenerek saklanması</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">7. KVKK Kapsamındaki Haklarınız</h3>
              <p>KVKK Madde 11 uyarınca aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse bilgi talep etme</li>
                <li>İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içi/yurt dışı aktarılan üçüncü kişileri bilme</li>
                <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                <li>KVKK'da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
                <li>Düzeltme, silme, yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                <li>İşlenen verilerin münhasıran otomatik sistemler ile analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                <li>Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">8. Çerezler</h3>
              <p>
                Platform, kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır. 
                Çerez tercihlerinizi tarayıcı ayarlarınızdan yönetebilirsiniz.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">9. Veri Saklama Süresi</h3>
              <p>
                Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve yasal saklama süreleri 
                (örneğin, sağlık kayıtları için 10 yıl) boyunca saklanmaktadır.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">10. İletişim ve Başvuru</h3>
              <p>
                KVKK kapsamındaki haklarınızı kullanmak için bizimle iletişime geçebilirsiniz. 
                Ayrıca, Kişisel Verileri Koruma Kurulu'na şikayette bulunma hakkınız saklıdır.
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Bu politika KVKK'ya uygun olarak hazırlanmıştır. 
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}