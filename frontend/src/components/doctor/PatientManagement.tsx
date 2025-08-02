import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Search, Plus, Filter, Eye, Trash2, Phone, Mail, Calendar } from 'lucide-react';

// Filter functions from HealthAuthForm
function filterNameInput(value: string) {
  return value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s]/g, '');
}

function filterPhoneInput(value: string) {
  return value.replace(/[^0-9\s]/g, '');
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  lastVisit: string;
  nextAppointment?: string;
  status: 'active' | 'inactive';
  medicalHistory: string[];
  allergies: string[];
  medications: string[];
}

const PatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 'P001',
      name: 'Ahmet Yılmaz',
      age: 45,
      gender: 'Erkek',
      phone: '+90 532 123 4567',
      email: 'ahmet.yilmaz@email.com',
      address: 'İstanbul, Türkiye',
      bloodType: 'A+',
      lastVisit: '2024-01-10',
      nextAppointment: '2024-01-20',
      status: 'active',
      medicalHistory: ['Hipertansiyon', 'Diyabet'],
      allergies: ['Penisilin'],
      medications: ['Metformin', 'Lisinopril']
    },
    {
      id: 'P002',
      name: 'Fatma Demir',
      age: 32,
      gender: 'Kadın',
      phone: '+90 533 987 6543',
      email: 'fatma.demir@email.com',
      address: 'Ankara, Türkiye',
      bloodType: 'O+',
      lastVisit: '2024-01-08',
      status: 'active',
      medicalHistory: ['Astım'],
      allergies: ['Lateks'],
      medications: ['Salbutamol']
    },
    {
      id: 'P003',
      name: 'Mehmet Kaya',
      age: 58,
      gender: 'Erkek',
      phone: '+90 534 555 1234',
      email: 'mehmet.kaya@email.com',
      address: 'İzmir, Türkiye',
      bloodType: 'B+',
      lastVisit: '2024-01-15',
      status: 'active',
      medicalHistory: ['Koroner arter hastalığı'],
      allergies: [],
      medications: ['Aspirin', 'Atorvastatin']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const handleAddPatient = (newPatient: Omit<Patient, 'id'>) => {
    const patient: Patient = {
      ...newPatient,
      id: `P${String(patients.length + 1).padStart(3, '0')}`
    };
    setPatients([...patients, patient]);
    setIsAddPatientOpen(false);
  };

  const handleDeletePatient = (patientId: string) => {
    setPatients(patients.filter(p => p.id !== patientId));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hasta Yönetimi</h1>
          <p className="text-gray-600">Hastalarınızı görüntüleyin ve yönetin</p>
        </div>
        <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
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
            <AddPatientForm onSubmit={handleAddPatient} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Hasta ara (isim, email, telefon)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{patient.name}</CardTitle>
                  <p className="text-sm text-gray-600">ID: {patient.id}</p>
                </div>
                <Badge className={getStatusColor(patient.status)}>
                  {patient.status === 'active' ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{patient.age} yaş</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Kan:</span>
                    <span>{patient.bloodType}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{patient.phone}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{patient.email}</span>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-gray-500">Son ziyaret: {patient.lastVisit}</p>
                  {patient.nextAppointment && (
                    <p className="text-xs text-blue-600">Sonraki randevu: {patient.nextAppointment}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-4 mt-auto">
                <Button
                  size="sm"
                  className="text-black hover:text-black border border-black hover:border-black"
                  variant="outline"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Görüntüle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 bg-red-50"
                  onClick={() => handleDeletePatient(patient.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Patient Detail Dialog */}
      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Hasta Detayları - {selectedPatient.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Kişisel Bilgiler</Label>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><span className="font-medium">Yaş:</span> {selectedPatient.age}</p>
                    <p><span className="font-medium">Cinsiyet:</span> {selectedPatient.gender}</p>
                    <p><span className="font-medium">Kan Grubu:</span> {selectedPatient.bloodType}</p>
                    <p><span className="font-medium">Telefon:</span> {selectedPatient.phone}</p>
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
    </div>
  );
};

// Add Patient Form Component
const AddPatientForm: React.FC<{ onSubmit: (patient: Omit<Patient, 'id'>) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
            className={`border ${errors.firstName ? 'border-red-500' : 'border-border'}`}
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