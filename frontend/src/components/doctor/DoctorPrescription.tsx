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
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Pill, 
  Printer, 
  Download,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medications: Medication[];
  instructions: string;
  status: 'active' | 'completed' | 'cancelled';
  nextVisit?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const DoctorPrescription: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: 'RX001',
      patientId: 'P001',
      patientName: 'Ahmet Yılmaz',
      doctorName: 'Dr. Mehmet Özkan',
      date: '2024-01-15',
      diagnosis: 'Hipertansiyon',
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Günde 1 kez',
          duration: '30 gün',
          instructions: 'Sabah aç karnına alın'
        },
        {
          name: 'Amlodipine',
          dosage: '5mg',
          frequency: 'Günde 1 kez',
          duration: '30 gün',
          instructions: 'Sabah alın'
        }
      ],
      instructions: 'Tuz tüketimini azaltın, düzenli egzersiz yapın',
      status: 'active',
      nextVisit: '2024-02-15'
    },
    {
      id: 'RX002',
      patientId: 'P002',
      patientName: 'Fatma Demir',
      doctorName: 'Dr. Mehmet Özkan',
      date: '2024-01-10',
      diagnosis: 'Astım',
      medications: [
        {
          name: 'Salbutamol',
          dosage: '100mcg',
          frequency: 'Gerektiğinde',
          duration: '30 gün',
          instructions: 'Nefes darlığında kullanın'
        }
      ],
      instructions: 'Sigara içmeyin, tozlu ortamlardan kaçının',
      status: 'active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddPrescription = (newPrescription: Omit<Prescription, 'id'>) => {
    const prescription: Prescription = {
      ...newPrescription,
      id: `RX${String(prescriptions.length + 1).padStart(3, '0')}`
    };
    setPrescriptions([...prescriptions, prescription]);
    setIsAddPrescriptionOpen(false);
  };

  const handleDeletePrescription = (prescriptionId: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== prescriptionId));
  };

  const printPrescription = (prescription: Prescription) => {
    // Print functionality would be implemented here
    console.log('Printing prescription:', prescription.id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reçete Yönetimi</h1>
          <p className="text-gray-600">Reçetelerinizi oluşturun ve yönetin</p>
        </div>
        <Dialog open={isAddPrescriptionOpen} onOpenChange={setIsAddPrescriptionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Reçete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Reçete Oluştur</DialogTitle>
            </DialogHeader>
            <AddPrescriptionForm onSubmit={handleAddPrescription} />
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
                placeholder="Hasta adı veya teşhis ara..."
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
                <SelectItem value="completed">Tamamlanan</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPrescriptions.map((prescription) => (
          <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{prescription.patientName}</CardTitle>
                    <p className="text-sm text-gray-600">Reçete No: {prescription.id}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(prescription.status)}>
                  {prescription.status === 'active' ? 'Aktif' :
                   prescription.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Teşhis:</span>
                  <p className="text-gray-600">{prescription.diagnosis}</p>
                </div>
                <div>
                  <span className="font-medium">Tarih:</span>
                  <p className="text-gray-600">{prescription.date}</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-sm">İlaçlar:</span>
                <div className="mt-2 space-y-2">
                  {prescription.medications.map((med, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Pill className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{med.name}</span>
                      <span className="text-gray-600">- {med.dosage}</span>
                    </div>
                  ))}
                </div>
              </div>

              {prescription.nextVisit && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Sonraki ziyaret: {prescription.nextVisit}</span>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPrescription(prescription)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Görüntüle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printPrescription(prescription)}
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Yazdır
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  İndir
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4 mr-1" />
                  Düzenle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeletePrescription(prescription.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prescription Detail Dialog */}
      {selectedPrescription && (
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reçete Detayları - {selectedPrescription.patientName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-semibold">Hasta</Label>
                  <p className="text-sm">{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Doktor</Label>
                  <p className="text-sm">{selectedPrescription.doctorName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Tarih</Label>
                  <p className="text-sm">{selectedPrescription.date}</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <Label className="font-semibold">Teşhis</Label>
                <p className="mt-2 p-3 bg-blue-50 rounded-lg">{selectedPrescription.diagnosis}</p>
              </div>

              {/* Medications */}
              <div>
                <Label className="font-semibold">İlaçlar</Label>
                <div className="mt-2 space-y-3">
                  {selectedPrescription.medications.map((medication, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium">{medication.name}</p>
                            <p className="text-sm text-gray-600">{medication.dosage}</p>
                          </div>
                          <div>
                            <p className="text-sm"><span className="font-medium">Sıklık:</span> {medication.frequency}</p>
                            <p className="text-sm"><span className="font-medium">Süre:</span> {medication.duration}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm"><span className="font-medium">Kullanım:</span> {medication.instructions}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <Label className="font-semibold">Genel Talimatlar</Label>
                <p className="mt-2 p-3 bg-yellow-50 rounded-lg">{selectedPrescription.instructions}</p>
              </div>

              {selectedPrescription.nextVisit && (
                <div>
                  <Label className="font-semibold">Sonraki Ziyaret</Label>
                  <p className="mt-2 p-3 bg-green-50 rounded-lg">{selectedPrescription.nextVisit}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Add Prescription Form Component
const AddPrescriptionForm: React.FC<{ onSubmit: (prescription: Omit<Prescription, 'id'>) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    diagnosis: '',
    instructions: '',
    nextVisit: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  });

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = { ...updatedMedications[index], [field]: value };
    setFormData({ ...formData, medications: updatedMedications });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientId: 'P001', // This would come from patient selection
      patientName: formData.patientName,
      doctorName: 'Dr. Mehmet Özkan', // This would come from logged in doctor
      date: new Date().toISOString().split('T')[0],
      diagnosis: formData.diagnosis,
      medications: formData.medications.filter(med => med.name && med.dosage),
      instructions: formData.instructions,
      status: 'active' as const,
      nextVisit: formData.nextVisit || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patientName">Hasta Adı</Label>
          <Input
            id="patientName"
            value={formData.patientName}
            onChange={(e) => setFormData({...formData, patientName: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="diagnosis">Teşhis</Label>
          <Input
            id="diagnosis"
            value={formData.diagnosis}
            onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="instructions">Genel Talimatlar</Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) => setFormData({...formData, instructions: e.target.value})}
          placeholder="Hasta için genel talimatlar..."
        />
      </div>

      <div>
        <Label htmlFor="nextVisit">Sonraki Ziyaret (Opsiyonel)</Label>
        <Input
          id="nextVisit"
          type="date"
          value={formData.nextVisit}
          onChange={(e) => setFormData({...formData, nextVisit: e.target.value})}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <Label className="font-semibold">İlaçlar</Label>
          <Button type="button" variant="outline" size="sm" onClick={addMedication}>
            <Plus className="w-4 h-4 mr-1" />
            İlaç Ekle
          </Button>
        </div>
        
        <div className="space-y-4">
          {formData.medications.map((medication, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>İlaç Adı</Label>
                    <Input
                      value={medication.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      placeholder="İlaç adı"
                    />
                  </div>
                  <div>
                    <Label>Doz</Label>
                    <Input
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      placeholder="10mg"
                    />
                  </div>
                  <div>
                    <Label>Sıklık</Label>
                    <Input
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      placeholder="Günde 2 kez"
                    />
                  </div>
                  <div>
                    <Label>Süre</Label>
                    <Input
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      placeholder="7 gün"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Kullanım Talimatları</Label>
                  <Textarea
                    value={medication.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    placeholder="Kullanım talimatları..."
                  />
                </div>
                {formData.medications.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 text-red-600"
                    onClick={() => removeMedication(index)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    İlaçı Kaldır
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">Reçete Oluştur</Button>
      </div>
    </form>
  );
};

export default DoctorPrescription; 