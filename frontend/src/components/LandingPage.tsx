import React from 'react';
import { Activity, Stethoscope, Shield, Brain, Users, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { MedLineLogo } from './ui/MedLineLogo';

export default function LandingPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex">
      {/* Sağ üst köşe tema switcher (Topbar ile aynı) */}
      <div className="absolute top-6 right-8 z-50 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
         >
        </Button>
      </div>
      
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
      {/* Sağ taraf - Beyaz tema */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-12">
        <div className="w-full max-w-md">
          <Card className="bg-white shadow-xl border border-gray-200">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <MedLineLogo size={48} className="mx-auto mb-3" />
                <h1 className="text-2xl font-bold mb-3 text-gray-900">Hesabınıza Giriş Yapın</h1>
                <h2 className="text-2xl font-bold mb-3 text-gray-900">Veya Yeni Hesap Oluşturun</h2>
                <p className="text-gray-500 text-sm mb-8">Sağlık Her Zaman Sizinle</p>
              </div>
                             <div className="space-y-6">
                 <Button   
                   onClick={() => navigate('/login')}
                   className="w-full bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-blue-950 hover:to-blue-950 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                 >
                   Giriş Yap
                 </Button>
                 <div className="relative">
                   <div className="absolute inset-0 flex items-center">
                     <div className="w-full border-t border-gray-200"></div>
                   </div>
                   <div className="relative flex justify-center text-sm">
                     <span className="px-4 bg-white text-gray-500">VEYA</span>
                   </div>
                 </div>
                 <Button 
                   onClick={() => navigate('/register')}
                   className="w-full bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-blue-950 hover:to-blue-950 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                 >
                   Yeni Hesap Oluştur
                 </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}