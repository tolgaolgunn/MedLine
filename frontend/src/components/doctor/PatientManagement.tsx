import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Search, Plus, Filter, Eye, Edit, Trash2, Phone, Mail, Calendar } from 'lucide-react';

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
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.name}`} />
                    <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{patient.name}</CardTitle>
                    <p className="text-sm text-gray-600">ID: {patient.id}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(patient.status)}>
                  {patient.status === 'active' ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
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

              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Görüntüle
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4 mr-1" />
                  Düzenle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
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
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    bloodType: '',
    medicalHistory: '',
    allergies: '',
    medications: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      phone: formData.phone,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Ad Soyad</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="age">Yaş</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="gender">Cinsiyet</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Erkek">Erkek</SelectItem>
              <SelectItem value="Kadın">Kadın</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bloodType">Kan Grubu</Label>
          <Select value={formData.bloodType} onValueChange={(value) => setFormData({...formData, bloodType: value})}>
            <SelectTrigger>
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
        </div>
        <div>
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="address">Adres</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="medicalHistory">Tıbbi Geçmiş (virgülle ayırın)</Label>
          <Textarea
            id="medicalHistory"
            value={formData.medicalHistory}
            onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
            placeholder="Hipertansiyon, Diyabet"
          />
        </div>
        <div>
          <Label htmlFor="allergies">Alerjiler (virgülle ayırın)</Label>
          <Textarea
            id="allergies"
            value={formData.allergies}
            onChange={(e) => setFormData({...formData, allergies: e.target.value})}
            placeholder="Penisilin, Lateks"
          />
        </div>
        <div>
          <Label htmlFor="medications">Mevcut İlaçlar (virgülle ayırın)</Label>
          <Textarea
            id="medications"
            value={formData.medications}
            onChange={(e) => setFormData({...formData, medications: e.target.value})}
            placeholder="Metformin, Aspirin"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">Hasta Ekle</Button>
      </div>
    </form>
  );
};

export default PatientManagement; 