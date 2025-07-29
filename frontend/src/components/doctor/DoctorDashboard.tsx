import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Activity, 
  Pill, 
  AlertCircle,
  TrendingUp,
  Heart,
  Thermometer,
  Sun,
  Moon,
  Users,
  BarChart3,
  Stethoscope,
  MessageSquare,
  User,
  Bell,
} from 'lucide-react';

interface Appointment {
  id: number;
  patientName: string;
  patientAge: number;
  specialty: string;
  date: string;
  time: string;
  type: 'online' | 'face_to_face';
  status: 'confirmed' | 'pending' | 'completed';
  symptoms: string;
  isCurrent?: boolean;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

const DoctorDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 1,
      patientName: 'Ahmet Yılmaz',
      patientAge: 45,
      specialty: 'Kardiyoloji',
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      type: 'online',
      status: 'confirmed',
      symptoms: 'Göğüs ağrısı, nefes darlığı'
    },
    {
      id: 2,
      patientName: 'Fatma Demir',
      patientAge: 32,
      specialty: 'Dahiliye',
      date: new Date().toISOString().split('T')[0],
      time: '16:00',
      type: 'face_to_face',
      status: 'confirmed',
      symptoms: 'Baş ağrısı, mide bulantısı'
    },
    {
      id: 3,
      patientName: 'Mehmet Kaya',
      patientAge: 28,
      specialty: 'Ortopedi',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      type: 'online',
      status: 'confirmed',
      symptoms: 'Sırt ağrısı'
    },
    {
      id: 4,
      patientName: 'Ayşe Özkan',
      patientAge: 55,
      specialty: 'Nöroloji',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '11:30',
      type: 'face_to_face',
      status: 'confirmed',
      symptoms: 'Baş dönmesi, denge problemi'
    },
    {
      id: 5,
      patientName: 'Ali Veli',
      patientAge: 38,
      specialty: 'Dermatoloji',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '09:00',
      type: 'face_to_face',
      status: 'completed',
      symptoms: 'Cilt problemi'
    },
    {
      id: 6,
      patientName: 'Zeynep Kaya',
      patientAge: 42,
      specialty: 'Göz Hastalıkları',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '15:30',
      type: 'online',
      status: 'completed',
      symptoms: 'Görme problemi'
    },
    {
      id: 7,
      patientName: 'Can Demir',
      patientAge: 29,
      specialty: 'Psikiyatri',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '13:00',
      type: 'online',
      status: 'pending',
      symptoms: 'Anksiyete'
    }
  ]);

  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 'P001',
      name: 'Ahmet Yılmaz',
      age: 45,
      gender: 'Erkek',
      lastVisit: '2024-01-10',
      status: 'active'
    },
    {
      id: 'P002',
      name: 'Fatma Demir',
      age: 32,
      gender: 'Kadın',
      lastVisit: '2024-01-08',
      status: 'active'
    },
    {
      id: 'P003',
      name: 'Mehmet Kaya',
      age: 58,
      gender: 'Erkek',
      lastVisit: '2024-01-15',
      status: 'active'
    }
  ]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtreleme fonksiyonu
  const getFilteredAppointments = () => {
    return appointments.filter(appointment => {
      // Status filtresi
      if (filterStatus !== 'all') {
        if (filterStatus === 'scheduled' && appointment.status !== 'confirmed') return false;
        if (filterStatus === 'completed' && appointment.status !== 'completed') return false;
        if (filterStatus === 'cancelled' && appointment.status !== 'pending') return false;
      }
      
      // Tip filtresi
      if (filterType !== 'all' && appointment.type !== filterType) return false;
      
      // Uzmanlık filtresi
      if (filterSpecialty !== 'all' && appointment.specialty !== filterSpecialty) return false;
      
      return true;
    });
  };

  const todayAppointments = getFilteredAppointments().filter(appointment => {
    const today = new Date().toISOString().split('T')[0];
    return appointment.date === today;
  });

  // Filtrelenmiş randevuları al
  const filteredTodayAppointments = todayAppointments;

  // Boş durum mesajını belirle
  const getEmptyMessage = () => {
    if (filterStatus === 'completed') {
      return 'Tamamlanan randevu bulunmuyor';
    } else if (filterStatus === 'cancelled') {
      return 'Beklemede olan randevu bulunmuyor';
    } else if (filterType === 'online') {
      return 'Online randevu bulunmuyor';
    } else if (filterType === 'face_to_face') {
      return 'Yüz yüze randevu bulunmuyor';
    } else {
      return 'Bu tarih için randevu bulunmuyor';
    }
  };



  return (
    <div className="p-6 space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doktor Paneli</h1>
          <p className="text-gray-600">Hoş geldiniz, Dr. [İsim]</p>
          <p className="text-gray-600">Sağlıklı günler dileriz.</p>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Hasta</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bugünkü Randevular</p>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bekleyen</p>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reçeteler</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yaklaşan Randevular */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Yaklaşan Randevular</CardTitle>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Durumlar</SelectItem>
                    <SelectItem value="scheduled">Onaylandı</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">Beklemede</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Randevu Tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Randevular</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="face_to_face">Yüz Yüze</SelectItem>

                  </SelectContent>
                </Select>
              
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTodayAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{getEmptyMessage()}</p>
                </div>
              ) : (
                filteredTodayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-gray-600">{appointment.time} - {appointment.type === 'online' ? 'Online' : 'Yüz Yüze'}</p>
                        <p className="text-xs text-gray-500">{appointment.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status === 'confirmed' ? 'Onaylandı' :
                         appointment.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                      </Badge>
                      <Button size="sm" variant="outline">Detay</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hızlı İşlemler */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Hasta Yönetimi</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <Pill className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Reçete Yönetimi</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-orange-50 hover:border-orange-300 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">Raporlar</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start space-x-3 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium">Geri Bildirim</span>
              </Button>
              
            </div>
          </CardContent>
        </Card>
      </div>



    </div>
  );
};

export default DoctorDashboard; 