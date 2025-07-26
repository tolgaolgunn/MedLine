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
import {
  Form as ShadForm,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'  ;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

type AuthMode = "login" | "register" | "forgot-password" | "reset-password" | "reset-success";

// Helper to allow only letters and spaces (including Turkish)
function filterNameInput(value: string) {
  return value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s]/g, '');
}
// Helper to allow only digits and spaces for phone
function filterPhoneInput(value: string) {
  return value.replace(/[^0-9\s]/g, '');
}
// Password requirements
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
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetError, setResetError] = useState("");
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
    confirmPassword: ""
  });
  const [birthDateError, setBirthDateError] = useState("");

  // Sayfa yüklendiğinde localStorage'dan "Beni Hatırla" durumunu kontrol et
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe');
    if (savedRememberMe === 'true') {
      setRememberMe(true);
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
      }
    }
  }, []);

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === '/register') {
      setMode('register');
    } else if (pathname === '/forgot-password') {
      setMode('forgot-password');
    } else if (pathname.startsWith('/reset-password')) {
      setMode('reset-password');
      // Token query paramını al
      const params = new URLSearchParams(location.search);
      setResetToken(params.get("token") || "");
    } else if (pathname === '/reset-success') {
      setMode('reset-success');
    } else {
      setMode('login');
    }
  }, [location.pathname, location.search]);

  const API_URL = "http://localhost:3005/api";

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
        
        // "Beni Hatırla" işlemi
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberedEmail');
        }
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Giriş Başarılı");
        navigate("/dashboard");
      } catch (err) {
        toast.error("Sunucu Hatası:" + (err instanceof Error ? err.message : String(err)));
      }
    }
    if (mode === "register") {
      // 18 yaş kontrolü
      if (formData.birthDate) {
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
      // Şifreler eşleşiyor mu?
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
      // Tüm alanlar dolu mu?
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.birthDate || !formData.gender || !formData.address) {
        toast.error("Lütfen tüm alanları doldurun.");
        return;
      }
      // Telefon numarası birleştir
      const fullPhone = formData.phoneCountry + ' ' + formData.phone;
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
            gender: formData.gender,
            address: formData.address,
            role: "patient"
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

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setResetError("");
    if (!resetPassword || !resetPasswordConfirm) {
      setResetError("Lütfen tüm alanları doldurun.");
      setIsSubmitting(false);
      return;
    }
    if (resetPassword !== resetPasswordConfirm) {
      setResetError("Şifreler eşleşmiyor.");
      setIsSubmitting(false);
      return;
    }
    const errors = getPasswordErrors(resetPassword);
    if (Object.values(errors).some(Boolean)) {
      setResetError("Şifre gereksinimlerini karşılayınız.");
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: resetPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResetError(data.message || "Şifre sıfırlama başarısız.");
        setIsSubmitting(false);
        return;
      }
      setMode("reset-success");
      toast.success("Şifre başarıyla güncellendi.");
    } catch (error) {
      setResetError("Sunucu hatası: Şifre sıfırlama başarısız.");
    }
    setIsSubmitting(false);
  }

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgotPassword = mode === "forgot-password";
  const isResetSuccess = mode === "reset-success";

  // Forgot password modern form schema
  const forgotFormSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  });
  type ForgotFormType = z.infer<typeof forgotFormSchema>;
  const forgotForm = useForm<ForgotFormType>({
    resolver: zodResolver(forgotFormSchema),
    defaultValues: { email: '' },
  });
  async function onForgotSubmit(values: ForgotFormType) {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.");
        setIsSubmitting(false);
        return;
      }
      setResetEmail(values.email);
      setMode("reset-success");
      toast.success('Şifre sıfırlama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.');
    } catch (error) {
      toast.error('Sunucu hatası: Şifre sıfırlama e-postası gönderilemedi.');
    }
    setIsSubmitting(false);
  }

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
                {/* {isForgotPassword && "Şifremi Unuttum"} */}
                {isResetSuccess && "E-posta Gönderildi"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {isLogin && "Sağlıklı yaşamınıza devam edin"}
                {isRegister && "Sağlıklı yaşam yolculuğunuza başlayın"}
                {/* {isForgotPassword && "E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim"} */}
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
              <div className="flex min-h-[40vh] h-full w-full items-center justify-center px-4">
                <Card className="mx-auto max-w-sm w-full bg-blue-900/90 dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="text-2xl text-center text-white">Şifremi Unuttum</CardTitle>
                    <CardDescription className="text-center text-white">
                      Şifre sıfırlama bağlantısı almak için e-posta adresinizi girin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ShadForm {...forgotForm}>
                      <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-8">
                        <div className="grid gap-4">
                          <FormField
                            control={forgotForm.control}
                            name="email"
                            render={({ field }: { field: any }) => (
                              <FormItem className="grid gap-2">
                                <FormLabel htmlFor="email" className="text-white">E-posta</FormLabel>
                                <FormControl>
                                  <Input
                                    id="email"
                                    placeholder="ornek@email.com"
                                    type="email"
                                    autoComplete="email"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl font-semibold transition-colors">
                            Sıfırlama Bağlantısı Gönder
                          </Button>
                        </div>
                      </form>
                    </ShadForm>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Reset Success Message */}
            {isResetSuccess && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-slate-800 dark:text-slate-300" />
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Şifre başarıyla sıfırlandı. Artık yeni şifrenizle giriş yapabilirsiniz.
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

            {/* Reset Password Form */}
            {mode === "reset-password" && (
              <div className="flex min-h-[40vh] h-full w-full items-center justify-center px-4">
                <Card className="mx-auto max-w-sm w-full bg-blue-900/90 dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="text-2xl text-center text-white">Yeni Şifre Oluştur</CardTitle>
                    <CardDescription className="text-center text-white">
                      Lütfen yeni şifrenizi girin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleResetPassword} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="resetPassword" className="text-white">Yeni Şifre</Label>
                        <Input
                          id="resetPassword"
                          type="password"
                          placeholder="Yeni şifreniz"
                          value={resetPassword}
                          onChange={e => setResetPassword(e.target.value)}
                          className="h-11 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resetPasswordConfirm" className="text-white">Yeni Şifre Tekrar</Label>
                        <Input
                          id="resetPasswordConfirm"
                          type="password"
                          placeholder="Yeni şifrenizi tekrar girin"
                          value={resetPasswordConfirm}
                          onChange={e => setResetPasswordConfirm(e.target.value)}
                          className="h-11 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      {resetError && (
                        <div className="text-red-500 text-sm">{resetError}</div>
                      )}
                      <Button
                        type="submit"
                        className="w-full text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl font-semibold transition-colors"
                        disabled={isSubmitting}
                      >
                        Şifreyi Güncelle
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
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
                            onChange={e => setFormData(prev => ({ ...prev, firstName: filterNameInput(e.target.value) }))}
                            className="h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                            onChange={e => setFormData(prev => ({ ...prev, lastName: filterNameInput(e.target.value) }))}
                            className="h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  {isRegister && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Telefon alanı ülke kodu ile, büyük input */}
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Telefon</Label>
                        <div className="flex gap-2">
                          <select
                            id="phoneCountry"
                            value={formData.phoneCountry}
                            onChange={e => setFormData(prev => ({ ...prev, phoneCountry: e.target.value }))}
                            className="appearance-none outline-none h-14 border border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 rounded-md px-2 min-w-[80px] font-medium text-base text-gray-900 dark:text-white"
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
                              className="pl-9 h-14 text-lg border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      {/* Doğum tarihi ve cinsiyet yan yana */}
                      <div className="space-y-2">
                        <Label htmlFor="birthDate" className="text-gray-700 dark:text-gray-300">Doğum Tarihi</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                            className="pl-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                          className="appearance-none outline-none h-11 border border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 rounded-md px-3 w-full text-gray-900 dark:text-white"
                          required
                        >
                          <option value="">Seçiniz</option>
                          <option value="Erkek">Erkek</option>
                          <option value="Kadın">Kadın</option>
                          <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
                        </select>
                      </div>  
                      {/* Adres geniş ve kısa, alta */}
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">Adres</Label>
                        <textarea
                          id="address"
                          placeholder="Adresiniz"
                          value={formData.address}
                          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="appearance-none outline-none h-16 min-h-[48px] w-full border border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 rounded-md px-3 py-2 resize-none text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  )}
                  {/* Şifre alanı ve gereksinimler */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-9 pr-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                      <Label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        Beni Hatırla
                      </Label>
                    </div>
                  )}
                  
                  {/* Şifre tekrar ve hata */}
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
                          onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pl-9 pr-9 h-11 border-gray-300 dark:border-gray-600 focus:border-slate-800 dark:focus:border-slate-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  {/* Kullanım koşulları */}
                  {isRegister && (
                    <Label htmlFor="terms" className="flex flex-row items-center gap-2 text-sm text-gray-600 dark:text-gray-400 w-full cursor-pointer">
                      <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked: boolean | "indeterminate") => setAcceptTerms(checked as boolean)}
                        className="border-slate-300 data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800"
                      />
                      <span>
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-slate-800 dark:text-slate-300 hover:underline cursor-pointer inline">Kullanım Koşulları</a>
                        <span> ve </span>
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-slate-800 dark:text-slate-300 hover:underline cursor-pointer inline">Gizlilik Politikası</a>
                        <span>'nı okudum ve kabul ediyorum.</span>
                      </span>
                    </Label>
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
                    {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"} {" "}
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