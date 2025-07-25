"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { Eye, EyeOff, Mail, Lock, Shield, Users, Phone, Calendar, ArrowLeft, CheckCircle, Activity, Stethoscope, Brain } from "lucide-react";
import { MedLineLogo } from "./ui/MedLineLogo"

type AuthMode = "login" | "register" | "forgot-password" | "reset-success";

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
    birthDate: "",
    password: "",
    confirmPassword: ""
  });

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
                <form onSubmit={handleSubmit} className="space-y-5">
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
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
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
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Telefon</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="0555 555 55 55"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="pl-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800"
                            required
                          />
                        </div>
                      </div>
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
                      </div>
                    </div>
                  )}

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
                        className="pl-9 pr-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800"
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
                  </div>

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
                      <span className="text-slate-800 dark:text-slate-300 hover:underline cursor-pointer">Kullanım Koşulları</span> ve{" "}
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

                {/* Google Sign In */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                        veya
                      </span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full mt-4 h-11 border-gray-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500"
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google ile {isLogin ? "Giriş Yap" : "Devam Et"}
                  </Button>
                </div>

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