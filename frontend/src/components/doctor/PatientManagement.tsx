import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { PageHeader } from '../ui/PageHeader';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Search, Plus, Eye, Phone, Mail, Calendar } from 'lucide-react';

// Filter functions from HealthAuthForm
function filterNameInput(value: string) {
  return value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s]/g, '');
}

function filterPhoneInput(value: string) {
  return value.replace(/[^0-9\s]/g, '');
}

// Patient interface'ini güncelle
interface Patient {
  patient_id: string;      // backend'den gelen alan adı
  patient_name: string;    // backend'den gelen alan adı
  email: string;
  phone_number: string;    // backend'den gelen alan adı
  birth_date: string;
  gender: string;
  address: string;
  medical_history: string;
  doctor_id: string;
  total_appointments: number;
  last_appointment_date: string;
  first_appointment_date: string;
}

// Hasta kartı içeriğini güncelle
const PatientCard = ({ patient }: { patient: Patient }) => {
  return (
    <Card key={patient.patient_id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{patient.patient_name}</CardTitle>
            <p className="text-sm text-gray-600">ID: {patient.patient_id}</p>
          </div>
          <Badge className={getAppointmentStatusColor(patient.total_appointments)}>
            {patient.total_appointments > 0 ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-full">
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{calculateAge(patient.birth_date)} yaş</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Cinsiyet:</span>
              <span>{patient.gender}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{patient.phone_number}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{patient.email}</span>
          </div>

          <div className="pt-2">
            <p className="text-xs text-gray-500">
              Son randevu: {formatDate(patient.last_appointment_date)}
            </p>
            <p className="text-xs text-gray-500">
              Toplam randevu: {patient.total_appointments}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Yardımcı fonksiyonlar
const calculateAge = (birthDate: string) => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const formatDate = (date: string) => {
  if (!date) return 'Bilgi yok';
  return new Date(date).toLocaleDateString('tr-TR');
};

const getAppointmentStatusColor = (totalAppointments: number) => {
  return totalAppointments > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

const PatientManagement: React.FC = () => {
  // 1. All hooks at the top
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [formHasChanges, setFormHasChanges] = useState(false);

  // 2. Remove redundant state
  // Remove activeSearchTerm and activeFilterStatus states
  // Use searchTerm and filterStatus directly

  // 3. Use useMemo for doctor ID
  const currentDoctorId = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return '';
      const userData = JSON.parse(userStr);
      return userData?.user_id || userData?.id || '';
    } catch (error) {
      console.error('Error getting doctor ID:', error);
      return '';
    }
  }, []);

  // 4. Data fetching effect
  useEffect(() => {
    const fetchPatients = async () => {
      if (!currentDoctorId) {
        setError('Doktor ID bulunamadı');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3005/api/doctor/patients/${currentDoctorId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPatients(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Hasta verileri yüklenirken bir hata oluştu');
        setPatients([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [currentDoctorId]);

  // 5. Filtered patients with useMemo
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      if (!patient || !patient.patient_name || !patient.email) {
        return false;
      }

      const matchesDoctor = patient.doctor_id === currentDoctorId;
      const matchesSearch = searchTerm ? (
        patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone_number && patient.phone_number.includes(searchTerm))
      ) : true;
      
      return matchesDoctor && matchesSearch;
    });
  }, [patients, currentDoctorId, searchTerm]);

  // 6. Helper functions (not hooks)
  const handleAddPatient = (newPatient: Omit<Patient, 'id' | 'doctorId'>) => {
    const patient: Patient = {
      ...newPatient,
      patient_id: `P${String(patients.length + 1).padStart(3, '0')}`,
      doctor_id: currentDoctorId
    };
    setPatients([...patients, patient]);
    setIsAddPatientOpen(false);
  };

  const confirmExit = () => {
    setIsAddPatientOpen(false);
    setShowExitConfirm(false);
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  // Yükleme durumu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <p className="font-medium">Hata!</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Hasta Yönetimi"
          subtitle="Hastalarınızı görüntüleyin ve yönetin"
          showBackButton={true}
        />
        <Dialog open={isAddPatientOpen} onOpenChange={(open) => {
          if (!open) {
            if (formHasChanges) {
              setShowExitConfirm(true);
            } else {
              setIsAddPatientOpen(false);
            }
          } else {
            setIsAddPatientOpen(true);
            setFormHasChanges(false); // Reset when opening
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Hasta Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Hasta Ekle</DialogTitle>
            </DialogHeader>
            <AddPatientForm 
              onSubmit={handleAddPatient} 
              onFormChange={setFormHasChanges}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full border-2 border-gray-300 rounded-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Hasta ara (isim, email, telefon)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            
            {/* Remove Filter Dropdown */}
            
          </div>
        </CardContent>
      </Card>

      {/* Update Search Results Info */}
      {searchTerm && (
        <Card className="p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                Arama sonuçları: "{searchTerm}"
                {` (${filteredPatients.length} hasta bulundu)`}
              </span>
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-1.5 text-gray-600 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 rounded-md text-sm font-medium transition-colors"
            >
              Temizle
            </button>
          </div>
        </Card>
      )}

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <PatientCard key={patient.patient_id} patient={patient} />
        ))}
      </div>

      {/* Patient Detail Dialog */}
      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Hasta Detayları - {selectedPatient.patient_name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Kişisel Bilgiler</Label>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><span className="font-medium">Yaş:</span> {selectedPatient.age}</p>
                    <p><span className="font-medium">Cinsiyet:</span> {selectedPatient.gender}</p>
                    <p><span className="font-medium">Kan Grubu:</span> {selectedPatient.bloodType}</p>
                    <p><span className="font-medium">Telefon:</span> {selectedPatient.phone_number}</p>
                    <p><span className="font-medium">Email:</span> {selectedPatient.email}</p>
                    <p><span className="font-medium">Adres:</span> {selectedPatient.address}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Tıbbi Geçmiş</Label>
                  <div className="mt-2">
                    {selectedPatient.medicalHistory.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-2">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Alerjiler</Label>
                  <div className="mt-2">
                    {selectedPatient.allergies.length > 0 ? (
                      selectedPatient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="mr-2 mb-2">
                          {allergy}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Alerji bilgisi yok</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Mevcut İlaçlar</Label>
                  <div className="mt-2">
                    {selectedPatient.medications.map((medication, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-2">
                        {medication}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Ziyaret Bilgileri</Label>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><span className="font-medium">Son Ziyaret:</span> {selectedPatient.lastVisit}</p>
                    {selectedPatient.nextAppointment && (
                      <p><span className="font-medium">Sonraki Randevu:</span> {selectedPatient.nextAppointment}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Çıkış Onay Modalı */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kaydetmeden Çıkış</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Kaydetmeden çıkmak istediğinizden emin misiniz? <br />
              Girilen bilgiler kaybolacaktır.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={cancelExit}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              Çık
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add Patient Form Component
const AddPatientForm: React.FC<{ 
  onSubmit: (patient: Omit<Patient, 'id' | 'doctorId'>) => void;
  onFormChange: (hasChanges: boolean) => void;
}> = ({ onSubmit, onFormChange }) => {
  const initialFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCountry: '+90',
    birthDate: '',
    gender: '',
    address: '',
    bloodType: '',
    medicalHistory: '',
    allergies: '',
    medications: ''
  };
  
  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Check if form has any changes
  const hasChanges = () => {
    return formData.firstName !== initialFormData.firstName ||
           formData.lastName !== initialFormData.lastName ||
           formData.email !== initialFormData.email ||
           formData.phone !== initialFormData.phone ||
           formData.phoneCountry !== initialFormData.phoneCountry ||
           formData.birthDate !== initialFormData.birthDate ||
           formData.gender !== initialFormData.gender ||
           formData.address !== initialFormData.address ||
           formData.bloodType !== initialFormData.bloodType ||
           formData.medicalHistory !== initialFormData.medicalHistory ||
           formData.allergies !== initialFormData.allergies ||
           formData.medications !== initialFormData.medications;
  };

  // Notify parent component about form changes
  React.useEffect(() => {
    onFormChange(hasChanges());
  }, [formData, onFormChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hata mesajlarını temizle
    setErrors({});
    
    // Hata kontrolü
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad alanı zorunludur';
    } else if (formData.firstName.trim().length < 3) {
      newErrors.firstName = 'Ad en az 3 harf olmalıdır';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad alanı zorunludur';
    } else if (formData.lastName.trim().length < 3) {
      newErrors.lastName = 'Soyad en az 3 harf olmalıdır';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-posta alanı zorunludur';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Geçerli bir e-posta adresi girin';
      }
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon alanı zorunludur';
    } else if (formData.phone.length !== 11) {
      newErrors.phone = 'Telefon numarası 11 haneli olmalıdır';
    }
    
    if (!formData.birthDate.trim()) {
      newErrors.birthDate = 'Doğum tarihi zorunludur';
    }
    
    if (!formData.gender.trim()) {
      newErrors.gender = 'Cinsiyet seçimi zorunludur';
    }
    
    if (!formData.bloodType.trim()) {
      newErrors.bloodType = 'Kan grubu seçimi zorunludur';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Adres alanı zorunludur';
    }
    
    // Hata varsa formu gönderme
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Doğum tarihinden yaş hesapla
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    
    onSubmit({
      name: `${formData.firstName} ${formData.lastName}`,
      age: actualAge,
      gender: formData.gender,
      phone: `${formData.phoneCountry} ${formData.phone}`,
      email: formData.email,
      address: formData.address,
      bloodType: formData.bloodType,
      lastVisit: new Date().toISOString().split('T')[0],
      status: 'active' as const,
      medicalHistory: formData.medicalHistory.split(',').map(s => s.trim()).filter(Boolean),
      allergies: formData.allergies.split(',').map(s => s.trim()).filter(Boolean),
      medications: formData.medications.split(',').map(s => s.trim()).filter(Boolean)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Ad Soyad */}
      <div className="grid grid-cols-2 gap-4 " >
        <div>
          <Label htmlFor="firstName" className="mb-2 block">Ad</Label>
          <Input
            id="firstName"
            className="border border-gray-300 rounded-md"
            type="text"
            placeholder="Adınız"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: filterNameInput(e.target.value)})}
            required
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName" className="mb-2 block">Soyad</Label>
          <Input
            id="lastName"
            className={`border ${errors.lastName ? 'border-red-500' : 'border-border'}`}
            type="text" 
            placeholder="Soyadınız"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: filterNameInput(e.target.value)})}
            required
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email" className="mb-2 block">E-posta Adresi</Label>
        <Input
          id="email"
          className={`border ${errors.email ? 'border-red-500' : 'border-border'}`}
          type="email"
          placeholder="ornek@email.com"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      {/* Telefon ve Kan Grubu */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone" className="mb-2 block">Telefon</Label>
          <div className="flex gap-2">
            <div className="relative">
              <select
                id="phoneCountry"
                value={formData.phoneCountry}
                onChange={(e) => setFormData({...formData, phoneCountry: e.target.value})}
                className="appearance-none outline-none h-10 border border-border focus:border-slate-800 bg-white rounded-md px-2 pr-6 min-w-[80px] font-medium text-base text-gray-900"
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
              <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="555 555 55 55"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: filterPhoneInput(e.target.value)})}
              className={`flex-1 border ${errors.phone ? 'border-red-500' : 'border-border'}`}
              maxLength={11}
              required
            />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>
        <div>
          <Label htmlFor="bloodType" className="mb-2 block">Kan Grubu</Label>
          <Select value={formData.bloodType} onValueChange={(value) => setFormData({...formData, bloodType: value})}>
            <SelectTrigger className={`border ${errors.bloodType ? 'border-red-500' : 'border-border'}`}>
              <SelectValue placeholder="Seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
            </SelectContent>
          </Select>
          {errors.bloodType && (
            <p className="text-red-500 text-sm mt-1">{errors.bloodType}</p>
          )}
        </div>
      </div>

      {/* Doğum Tarihi ve Cinsiyet */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="birthDate" className="mb-2 block">Doğum Tarihi</Label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
            className={`border ${errors.birthDate ? 'border-red-500' : 'border-border'}`}
            required
          />
          {errors.birthDate && (
            <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
          )}
        </div>
        <div>
          <Label htmlFor="gender" className="mb-2 block">Cinsiyet</Label>
          <div className="relative">
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              className={`appearance-none outline-none h-10 border focus:border-slate-800 bg-white rounded-md px-3 pr-8 w-full text-gray-900 ${errors.gender ? 'border-red-500' : 'border-border'}`}
              required
            >
              <option value="">Seçiniz</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
              <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
          )}
        </div>
      </div>

      {/* Adres */}
      <div>
        <Label htmlFor="address" className="mb-2 block">Adres</Label>
        <Textarea
          id="address"
          placeholder="Adresiniz"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          maxLength={200}
          className={`border break-words overflow-wrap-anywhere h-32 ${errors.address ? 'border-red-500' : 'border-border'}`}
          style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
          required
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {formData.address.length}/200 karakter
        </div>
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
        )}
      </div>

            {/* Tıbbi Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="medicalHistory" className="mb-2 block">Tıbbi Geçmiş</Label>
          <Textarea
            id="medicalHistory"
            maxLength={100}
            value={formData.medicalHistory}
            onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
            placeholder="Hipertansiyon, Diyabet"
            className="border border-border break-words overflow-wrap-anywhere h-32"
            style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
           {formData.medicalHistory.length}/100 karakter
         </div>
        </div>
        <div>
          <Label htmlFor="allergies" className="mb-2 block">Alerjiler</Label>
          <Textarea
            id="allergies"
            maxLength={100}
            value={formData.allergies}
            onChange={(e) => setFormData({...formData, allergies: e.target.value})}
            placeholder="Penisilin, Lateks"
            className="border border-border break-words overflow-wrap-anywhere h-32"
            style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
           {formData.allergies.length}/100 karakter
         </div>
        </div>
        <div>
          <Label htmlFor="medications" className="mb-2 block">Mevcut İlaçlar </Label>
          <Textarea
            id="medications"
            maxLength={100}
            value={formData.medications}
            onChange={(e) => setFormData({...formData, medications: e.target.value})}
            placeholder="Metformin, Aspirin"
            className="border border-border break-words overflow-wrap-anywhere h-32"
            style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
           {formData.medications.length}/100 karakter
         </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">Hasta Ekle</Button>
      </div>
    </form>
  );
};

export default PatientManagement;