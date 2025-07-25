"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { Eye, EyeOff, Mail, Lock, Shield, Users, Phone, Calendar, ArrowLeft, CheckCircle, Activity, Stethoscope, Brain, AlertCircle } from "lucide-react";
import { MedLineLogo } from "./ui/MedLineLogo"

type AuthMode = "login" | "register" | "forgot-password" | "reset-success";

// Password validation helper
function isPasswordValid(password: string) {
  return (
    /[A-Z]/.test(password) && // at least one uppercase
    /[a-z]/.test(password) && // at least one lowercase
    /[0-9]/.test(password) && // at least one digit
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password) // at least one punctuation
  );
}

// Password validation helper
function getPasswordErrors(password: string): Record<'upper' | 'lower' | 'digit' | 'punct', boolean> {
  return {
    upper: !/[A-Z]/.test(password),
    lower: !/[a-z]/.test(password),
    digit: !/[0-9]/.test(password),
    punct: !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  };
}

// Helper to allow only letters and spaces (including Turkish)
function filterNameInput(value: string) {
  return value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s]/g, '');
}

// Helper to allow only digits and spaces for phone
function filterPhoneInput(value: string) {
  return value.replace(/[^0-9\s]/g, '');
}

export function HealthAuthForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneCountry: "+90",
    birthDate: "",
    password: "",
    confirmPassword: "",
    address: "",
    gender: ""
  });
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [birthDateError, setBirthDateError] = useState<string>("");

  // URL'ye göre mod'u ayarla
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === '/register') {
      setMode('register');
    } else if (pathname === '/forgot-password') {
      setMode('forgot-password');
    } else if (pathname === '/reset-password' || pathname === '/reset-success') {
      setMode('reset-success');
    } else {
      setMode('login');
    }
  }, [location.pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 18 yaş kontrolü
    if (isRegister && formData.birthDate) {
      const today = new Date();
      const birthDate = new Date(formData.birthDate);
      const age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      const d = today.getDate() - birthDate.getDate();
      const isUnder18 = age < 18 || (age === 18 && (m < 0 || (m === 0 && d < 0)));
      if (isUnder18) {
        setBirthDateError("18 yaş altı üyeler kayıt olamaz.");
        return;
      } else {
        setBirthDateError("");
      }
    }
    // Check password match for register
    if (isRegister && formData.password !== formData.confirmPassword) {
      setConfirmPasswordError("Şifreler uyuşmamaktadır.");
      return;
    } else {
      setConfirmPasswordError("");
    }
    // Password validation for both login and register
    if (!isPasswordValid(formData.password)) {
      setPasswordError("Şifre en az 1 büyük harf, 1 küçük harf, 1 sayı ve 1 noktalama işareti içermelidir.");
      return;
    } else {
      setPasswordError("");
    }
    console.log("Form submitted:", formData);
    
    // Login veya Register modunda ise geçici olarak dashboard'a yönlendir
    if (mode === "login" || mode === "register") {
      // Geçici olarak localStorage'a token ekle
      localStorage.setItem('token', 'temp-token-123');
      localStorage.setItem('user', JSON.stringify({
        email: formData.email,
        role: 'user'
      }));
      
      // Dashboard'a yönlendir
      navigate('/dashboard');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setMode("reset-success");
  };

  const handleGoogleSignIn = () => {
    console.log("Google sign-in initiated");
  };

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgotPassword = mode === "forgot-password";
  const isResetSuccess = mode === "reset-success";

  const passwordRequirements: { key: 'upper' | 'lower' | 'digit' | 'punct'; label: string }[] = [
    { key: 'upper', label: 'En az 1 büyük harf içermelidir' },
    { key: 'lower', label: 'En az 1 küçük harf içermelidir' },
    { key: 'digit', label: 'En az 1 sayı içermelidir' },
    { key: 'punct', label: 'En az 1 noktalama işareti içermelidir' }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 relative overflow-hidden">
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
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 bg-slate-800 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MedLineLogo size={48} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MedLine</h1>
            </div>

            {/* Back Button for Forgot Password */}
            {(isForgotPassword || isResetSuccess) && (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-slate-300 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Geri Dön
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isLogin && "Hesabınıza Giriş Yapın"}
                {isRegister && "Yeni Hesabınızı Oluşturun"}
                {isForgotPassword && "Şifremi Unuttum"}
                {isResetSuccess && "E-posta Gönderildi"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {isLogin && "Sağlıklı yaşamınıza devam edin"}
                {isRegister && "Sağlıklı yaşam yolculuğunuza başlayın"}
                {isForgotPassword && "E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim"}
                {isResetSuccess && "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi"}
              </p>
            </div>

            {/* Success Message */}
            {isResetSuccess && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-slate-800 dark:text-slate-300" />
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">{resetEmail}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    E-postanızı kontrol edin ve bağlantıya tıklayarak yeni şifrenizi oluşturun.
                  </p>
                  <Button
                    onClick={() => navigate("/login")}
                    variant="outline"
                    className="w-full mt-6 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Giriş Sayfasına Dön
                  </Button>
                </div>
              </div>
            )}

            {/* Forgot Password Form */}
            {isForgotPassword && (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail" className="text-gray-700 dark:text-gray-300">E-posta Adresi</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="ornek@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısı Gönder"}
                </Button>
              </form>
            )}

            {/* Login/Register Form */}
            {(isLogin || isRegister) && (
              <>
                <form onSubmit={handleSubmit} className="space-y-5 min-h-[650px]">
                  {isRegister && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">Ad</Label>
                        <div className="relative">
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Adınız"
                            value={formData.firstName}
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: filterNameInput(e.target.value) }))}
                            className="h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">Soyad</Label>
                        <div className="relative">
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Soyadınız"
                            value={formData.lastName}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: filterNameInput(e.target.value) }))}
                            className="h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">E-posta Adresi</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800"
                        required
                      />
                    </div>
                  </div>

                  {isRegister && (
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Telefon</Label>
                      <div className="flex gap-2">
                        <select
                          id="phoneCountry"
                          value={formData.phoneCountry}
                          onChange={e => setFormData(prev => ({ ...prev, phoneCountry: e.target.value }))}
                          className="h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 rounded-md px-2 min-w-[80px] font-medium text-base"
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
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="555 555 55 55"
                            value={formData.phone}
                            onChange={e => setFormData(prev => ({ ...prev, phone: filterPhoneInput(e.target.value) }))}
                            className="pl-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {isRegister && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Birth date and gender side by side */}
                      <div className="space-y-2">
                        <Label htmlFor="birthDate" className="text-gray-700 dark:text-gray-300">Doğum Tarihi</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                            className="pl-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800"
                            required
                          />
                        </div>
                        {birthDateError && (
                          <div className="flex items-center gap-1 text-xs text-red-600 mt-1">{birthDateError}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-gray-700 dark:text-gray-300">Cinsiyet</Label>
                        <select
                          id="gender"
                          value={formData.gender}
                          onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                          className="h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 rounded-md px-3 w-full"
                          required
                        >
                          <option value="">Seçiniz</option>
                          <option value="Erkek">Erkek</option>
                          <option value="Kadın">Kadın</option>
                          <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
                        </select>
                      </div>
                      {/* Address full width, less height */}
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">Adres</Label>
                        <textarea
                          id="address"
                          placeholder="Adresiniz"
                          value={formData.address}
                          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="h-16 min-h-[48px] w-full border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 rounded-md px-3 py-2 resize-none"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {isRegister && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Şifre</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className={`pl-9 pr-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-slate-800 dark:hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <ul className="text-xs mt-1 ml-4 list-disc space-y-1">
                        {passwordRequirements.map(req => {
                          const errors = getPasswordErrors(formData.password);
                          if (!errors[req.key]) return null; // Only show missing requirements
                          return (
                            <li key={req.key} className="text-red-600">{req.label}</li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {isRegister && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">Şifre Tekrar</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pl-9 pr-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-slate-800 dark:hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">Şifreler uyuşmamaktadır.</div>
                      )}
                    </div>
                  )}

                  {isRegister && (
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                      id="terms" 
                      checked={acceptTerms}
                      onCheckedChange={(checked: boolean | "indeterminate") => setAcceptTerms(checked as boolean)}
                      className="border-slate-300 data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800"
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-slate-800 dark:text-slate-300 hover:underline cursor-pointer">Kullanım Koşulları</span> ve
                      <span className="text-slate-800 dark:text-slate-300 hover:underline cursor-pointer">Gizlilik Politikası</span>'nı okudum ve kabul ediyorum.
                      </Label>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
                    disabled={isRegister && !acceptTerms}
                  >
                    {isLogin ? "Giriş Yap" : "Hesap Oluştur"}
                  </Button>

                  {isLogin && (
                    <div className="text-center">
                      <button 
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-sm text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200 hover:underline transition-colors"
                      >
                        Şifremi Unuttum
                      </button>
                    </div>
                  )}
                </form>

                {/* Switch Mode */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
                    <button
                      type="button"
                      onClick={() => navigate(isLogin ? "/register" : "/login")}
                      className="text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200 hover:underline font-semibold transition-colors"
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
    </div>
  );
}