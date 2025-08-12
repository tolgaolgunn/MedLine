import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { PageHeader } from '../ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Search, FileText, Calendar, User, Pill, Printer, Download, Edit, Trash2, Eye, Users } from 'lucide-react';
import { toast } from 'react-toastify';

interface Patient {
  patient_id: number; // Changed from string to number
  patient_name: string;
  email: string;
  phone_number: string;
  birth_date: string;
  gender: string;
  address: string;
  medical_history: string;
  doctor_id: string;
  total_appointments: number;
  last_appointment_date: string;
  first_appointment_date: string;
}

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  prescriptionCode: string;
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

const API_BASE_URL = 'http://localhost:3005/api/doctor';

const PrescriptionManagement: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);
  const [isEditPrescriptionOpen, setIsEditPrescriptionOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);

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

  const currentDoctorName = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return 'Dr. Bilinmiyor';
      const userData = JSON.parse(userStr);
      return userData?.full_name || userData?.name || 'Dr. Bilinmiyor';
    } catch (error) {
      console.error('Error getting doctor name:', error);
      return 'Dr. Bilinmiyor';
    }
  }, []);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/prescriptions`, {
          params: { doctorId: currentDoctorId }
        });

        let fetchedPrescriptions: Prescription[] = [];
        if (response.data && Array.isArray(response.data.data)) {
          fetchedPrescriptions = response.data.data;
        } else if (Array.isArray(response.data)) {
          fetchedPrescriptions = response.data;
        } else {
          console.warn('Unexpected API response format:', response.data);
          setPrescriptions([]);
          setError('Received unexpected data format');
          return;
        }

        const fixedPrescriptions = fetchedPrescriptions.map(prescription => ({
          ...prescription,
          doctorName: prescription.doctorName && prescription.doctorName.trim() !== '' ? prescription.doctorName : currentDoctorName
        }));

        setPrescriptions(fixedPrescriptions);
      } catch (error) {
        console.error('Error loading prescriptions:', error);
        setError('Error loading prescriptions');
        toast.error(`Error loading prescriptions: ${error.response?.status || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (currentDoctorId) {
      fetchPrescriptions();
    }
  }, [currentDoctorId, currentDoctorName]);

  const fetchPatients = async () => {
    try {
      setPatientsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/patients/${currentDoctorId}`, {
        params: { doctorId: currentDoctorId }
      });
      
      const patientsData = response.data?.data || response.data;
      if (!Array.isArray(patientsData)) {
        throw new Error('API did not return patient data in expected format');
      }

      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error(`Error loading patients: ${error.message}`);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    if ((isAddPrescriptionOpen || isEditPrescriptionOpen) && patients.length === 0 && currentDoctorId) {
      fetchPatients();
    }
  }, [isAddPrescriptionOpen, isEditPrescriptionOpen, currentDoctorId]);

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddPrescription = async (newPrescription: Omit<Prescription, 'id'>) => {
    try {
      if (!newPrescription.patientId || !newPrescription.patientName.trim()) {
        toast.error('Lütfen geçerli bir hasta seçin');
        return;
      }

      // Reçete kodu oluştur
      const timestamp = new Date().getTime().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
      const prescriptionCode = `RX-${timestamp}-${randomStr}`;

      const prescriptionData = {
        ...newPrescription,
        patientId: String(newPrescription.patientId),
        patientName: String(newPrescription.patientName),
        doctorId: currentDoctorId,
        doctorName: currentDoctorName,
        prescriptionCode: prescriptionCode, // Benzersiz kod ekle
        date: new Date().toISOString().split('T')[0],
        status: 'active' as const,
        medications: newPrescription.medications.map(med => ({
          name: med.name.trim(),
          dosage: med.dosage.trim(),
          frequency: med.frequency?.trim() || '',
          duration: med.duration?.trim() || '',
          instructions: med.instructions?.trim() || ''
        }))
      };

      console.log('Sending prescription data:', prescriptionData); // Debug için

      const response = await axios.post(`${API_BASE_URL}/prescriptions`, prescriptionData);
      
      if (response.data) {
        // Yeni reçeteyi state'e ekle
        setPrescriptions(prev => [response.data, ...prev]);
        setIsAddPrescriptionOpen(false);
        toast.success('Reçete başarıyla oluşturuldu');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error(`Reçete oluşturulurken hata: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdatePrescription = async (updatedPrescription: Prescription) => {
    try {
      console.log('Updating prescription:', updatedPrescription); // Debug için

      const response = await axios.put(
        `${API_BASE_URL}/prescriptions/${updatedPrescription.id}`, 
        {
          ...updatedPrescription,
          patientId: Number(updatedPrescription.patientId), // ID'yi number'a çevir
          doctorId: currentDoctorId,
          doctorName: currentDoctorName,
          date: updatedPrescription.date || new Date().toISOString().split('T')[0]
        }
      );

      if (response.data) {
        // State'i güncelle
        setPrescriptions(prevPrescriptions => 
          prevPrescriptions.map(p => 
            p.id === updatedPrescription.id ? response.data : p
          )
        );

        // Modal'ları kapat
        setIsEditPrescriptionOpen(false);
        setEditingPrescription(null);

        // Başarı mesajı göster
        toast.success('Reçete başarıyla güncellendi');

        // Reçeteleri yeniden yükle
        const refreshResponse = await axios.get(`${API_BASE_URL}/prescriptions`, {
          params: { doctorId: currentDoctorId }
        });
        
        if (refreshResponse.data) {
          setPrescriptions(Array.isArray(refreshResponse.data) ? 
            refreshResponse.data : 
            refreshResponse.data.data || []
          );
        }
      }
    } catch (error) {
      console.error('Error updating prescription:', error);
      toast.error('Reçete güncellenirken hata oluştu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!confirm('Bu reçeteyi silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_BASE_URL}/prescriptions/${id}`);
      setPrescriptions(prescriptions.filter(p => p.id !== id));
      toast.success('Reçete başarıyla silindi');
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast.error('Reçete silinirken hata');
    }
  };

  const printPrescription = (prescription: Prescription) => {
    console.log('Printing prescription:', prescription.id);
    toast.info('Reçete yazdırılıyor');
  };

  const AddPrescriptionForm = ({ onSubmit }: { 
    onSubmit: (prescription: Omit<Prescription, 'id'>) => void;
  }) => {
    const [formData, setFormData] = useState({
      patientId: '',
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
      if (formData.medications.length > 1) {
        setFormData({
          ...formData,
          medications: formData.medications.filter((_, i) => i !== index)
        });
      }
    };

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
      const updatedMedications = [...formData.medications];
      updatedMedications[index] = { ...updatedMedications[index], [field]: value };
      setFormData({ ...formData, medications: updatedMedications });
    };

    const handlePatientSelect = (patientId: number) => {
      const selectedPatient = patients.find(p => p.patient_id === patientId);
      
      if (!selectedPatient) {
        toast.error('Geçersiz hasta seçimi');
        console.log('Selected ID:', patientId); // Debug için
        console.log('Available patients:', patients); // Debug için
        return;
      }
      
      setFormData({
        ...formData,
        patientId: patientId, // Artık number olarak saklıyoruz
        patientName: selectedPatient.patient_name,
        medications: formData.medications
      });
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.patientId || !formData.diagnosis.trim()) {
        toast.error('Lütfen bir hasta seçin ve tanı girin');
        return;
      }

      const validMedications = formData.medications.filter(med => med.name.trim() && med.dosage.trim());
      
      if (validMedications.length === 0) {
        toast.error('En az bir ilaç gereklidir');
        return;
      }

      // Reçete verilerini hazırla
      const prescriptionData = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        diagnosis: formData.diagnosis.trim(),
        instructions: formData.instructions.trim(),
        nextVisit: formData.nextVisit,
        medications: validMedications,
        status: 'active' as const
      };

      onSubmit(prescriptionData);

      // Formu sıfırla
      setFormData({
        patientId: '',
        patientName: '',
        diagnosis: '',
        instructions: '',
        nextVisit: '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="patientSelect">Hasta Seç *</Label>
            {patientsLoading ? (
              <div className="flex items-center space-x-2 p-2 border rounded-md">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-500">Hastalar yükleniyor...</span>
              </div>
            ) : patients.length === 0 ? (
              <div className="p-2 border rounded-md bg-yellow-50 border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Henüz kayıtlı hasta yok</span>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-yellow-700 font-medium"
                  onClick={() => window.open('/patients', '_blank')}
                >
                  Hasta eklemek için tıklayın
                </Button>
              </div>
            ) : (
              <Select value={String(formData.patientId)} onValueChange={(value) => handlePatientSelect(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Hasta seçin...">
                    {formData.patientId ? (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {patients.find(p => p.patient_id === Number(formData.patientId))?.patient_name}
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem 
                      key={patient.patient_id} 
                      value={String(patient.patient_id)} // Select için string olarak gönder
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{patient.patient_name}</span>
                        {patient.phone_number && (
                          <span className="text-xs text-gray-500">({patient.phone_number})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label htmlFor="diagnosis">Tanı *</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              placeholder="Tanı girin..."
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
            placeholder="Genel kullanım talimatları..."
          />
        </div>

        <div>
          <Label htmlFor="nextVisit">Sonraki Kontrol (Opsiyonel)</Label>
          <Input
            id="nextVisit"
            type="date"
            value={formData.nextVisit}
            onChange={(e) => setFormData({...formData, nextVisit: e.target.value})}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <Label className="font-semibold">İlaçlar *</Label>
            <Button type="button" variant="outline" size="sm" onClick={addMedication}>
              <Plus className="w-4 h-4 mr-1" /> İlaç Ekle
            </Button>
          </div>
          
          <div className="space-y-4">
            {formData.medications.map((medication, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`medication-name-${index}`}>İlaç Adı *</Label>
                      <Input
                        id={`medication-name-${index}`}
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        placeholder="İlaç adı girin..."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`medication-dosage-${index}`}>Doz *</Label>
                      <Input
                        id={`medication-dosage-${index}`}
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="Örn: 500mg"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`medication-frequency-${index}`}>Sıklık</Label>
                      <Input
                        id={`medication-frequency-${index}`}
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="Örn: Günde 3 kez"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`medication-duration-${index}`}>Süre</Label>
                      <Input
                        id={`medication-duration-${index}`}
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        placeholder="Örn: 7 gün"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor={`medication-instructions-${index}`}>Kullanım Talimatları</Label>
                    <Textarea
                      id={`medication-instructions-${index}`}
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      placeholder="Yemeklerden önce/sonra, özel talimatlar..."
                    />
                  </div>
                  {formData.medications.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={() => removeMedication(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Kaldır
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsAddPrescriptionOpen(false)}
          >
            İptal
          </Button>
          <Button type="submit" disabled={!formData.patientId || patientsLoading}>
            Reçete Oluştur
          </Button>
        </div>
      </form>
    );
  };

  const EditPrescriptionForm = ({ prescription, onSubmit }: { 
    prescription: Prescription;
    onSubmit: (prescription: Prescription) => void;
  }) => {
    const [formData, setFormData] = useState({
      patientId: prescription.patientId,
      patientName: prescription.patientName,
      diagnosis: prescription.diagnosis,
      instructions: prescription.instructions,
      nextVisit: prescription.nextVisit || '',
      medications: prescription.medications,
      status: prescription.status
    });

    const addMedication = () => {
      setFormData({
        ...formData,
        medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
      });
    };

    const removeMedication = (index: number) => {
      if (formData.medications.length > 1) {
        setFormData({
          ...formData,
          medications: formData.medications.filter((_, i) => i !== index)
        });
      }
    };

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
      const updatedMedications = [...formData.medications];
      updatedMedications[index] = { ...updatedMedications[index], [field]: value };
      setFormData({ ...formData, medications: updatedMedications });
    };

    const handlePatientSelect = (patientId: number) => {
      const selectedPatient = patients.find(p => p.patient_id === patientId);
      if (!selectedPatient) {
        toast.error('Geçersiz hasta seçimi');
        return;
      }
      
      setFormData({
        ...formData,
        patientId: patientId, // Artık number olarak saklıyoruz
        patientName: selectedPatient.patient_name,
        medications: formData.medications
      });
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.patientId || !formData.diagnosis.trim()) {
        toast.error('Lütfen bir hasta seçin ve tanı girin');
        return;
      }

      const validMedications = formData.medications.filter(med => med.name.trim() && med.dosage.trim());
      
      if (validMedications.length === 0) {
        toast.error('En az bir ilaç gereklidir');
        return;
      }

      onSubmit({
        ...prescription,
        patientId: formData.patientId,
        patientName: formData.patientName,
        diagnosis: formData.diagnosis,
        medications: validMedications,
        instructions: formData.instructions,
        nextVisit: formData.nextVisit || undefined,
        status: formData.status
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-patientSelect">Hasta Seç *</Label>
            {patientsLoading ? (
              <div className="flex items-center space-x-2 p-2 border rounded-md">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-500">Hastalar yükleniyor...</span>
              </div>
            ) : patients.length === 0 ? (
              <div className="p-2 border rounded-md bg-yellow-50 border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Henüz kayıtlı hasta yok</span>
                </div>
              </div>
            ) : (
              <Select 
                value={formData.patientId} 
                onValueChange={handlePatientSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hasta seçin...">
                    {formData.patientId ? (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {patients.find(p => p.patient_id === formData.patientId)?.patient_name}
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.patient_id} value={patient.patient_id}>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{patient.patient_name}</span>
                        {patient.phone_number && (
                          <span className="text-xs text-gray-500">({patient.phone_number})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label htmlFor="edit-diagnosis">Tanı *</Label>
            <Input
              id="edit-diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="edit-instructions">Genel Talimatlar</Label>
          <Textarea
            id="edit-instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({...formData, instructions: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-nextVisit">Sonraki Kontrol (Opsiyonel)</Label>
            <Input
              id="edit-nextVisit"
              type="date"
              value={formData.nextVisit}
              onChange={(e) => setFormData({...formData, nextVisit: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="edit-status">Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({...formData, status: value as 'active' | 'completed' | 'cancelled'})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <Label className="font-semibold">İlaçlar *</Label>
            <Button type="button" variant="outline" size="sm" onClick={addMedication}>
              <Plus className="w-4 h-4 mr-1" /> İlaç Ekle
            </Button>
          </div>
          
          <div className="space-y-4">
            {formData.medications.map((medication, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`edit-medication-name-${index}`}>İlaç Adı *</Label>
                      <Input
                        id={`edit-medication-name-${index}`}
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-medication-dosage-${index}`}>Doz *</Label>
                      <Input
                        id={`edit-medication-dosage-${index}`}
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-medication-frequency-${index}`}>Sıklık</Label>
                      <Input
                        id={`edit-medication-frequency-${index}`}
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-medication-duration-${index}`}>Süre</Label>
                      <Input
                        id={`edit-medication-duration-${index}`}
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor={`edit-medication-instructions-${index}`}>Kullanım Talimatları</Label>
                    <Textarea
                      id={`edit-medication-instructions-${index}`}
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    />
                  </div>
                  {formData.medications.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={() => removeMedication(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Kaldır
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsEditPrescriptionOpen(false);
              setEditingPrescription(null);
            }}
          >
            İptal
          </Button>
          <Button type="submit">Güncelle</Button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Reçete Yönetimi"
          subtitle="Reçetelerinizi oluşturun ve yönetin"
        />
        <Dialog open={isAddPrescriptionOpen} onOpenChange={setIsAddPrescriptionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Yeni Reçete
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

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Hasta adı veya tanıya göre ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-40">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>Yükleniyor...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <FileText className="w-12 h-12 text-red-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Hata oluştu</h3>
                <p className="text-gray-600 mt-2">{error}</p>
              </div>
              <Button 
                onClick={() => window.location.reload()}
                className="mt-4"
                variant="outline"
              >
                Tekrar Dene
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredPrescriptions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <FileText className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Reçete bulunamadı</h3>
                {prescriptions.length === 0 ? (
                  <p className="text-gray-600 mt-2">
                    Henüz hiç reçete oluşturulmadı. "Yeni Reçete" butonuna tıklayarak oluşturabilirsiniz.
                  </p>
                ) : (
                  <p className="text-gray-600 mt-2">
                    Arama kriterlerinize uygun reçete bulunamadı. Farklı arama terimleri deneyin.
                  </p>
                )}
              </div>
              <Button 
                onClick={() => setIsAddPrescriptionOpen(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" /> İlk Reçetenizi Oluşturun
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPrescriptions.map((prescription) => (
            <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{prescription.patientName}</CardTitle>
                    <p className="text-sm text-gray-600">Reçete No: {prescription.prescriptionCode}</p>
                  </div>
                  <Badge className={getStatusColor(prescription.status)}>
                    {prescription.status === 'active' ? 'Aktif' :
                     prescription.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Tanı:</span>
                    <p className="text-gray-600">{prescription.diagnosis}</p>
                  </div>
                  <div>
                    <span className="font-medium">Tarih:</span>
                    <p className="text-gray-600">{prescription.date}</p>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-sm">İlaçlar:</span>
                  <div className="mt-1 space-y-1">
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
                    <span>Sonraki kontrol: {prescription.nextVisit}</span>
                  </div>
                )}

                <div className="flex space-x-2 pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedPrescription(prescription)}
                  >
                    <Eye className="w-4 h-4 mr-1" /> Görüntüle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => printPrescription(prescription)}
                  >
                    <Printer className="w-4 h-4 mr-1" /> Yazdır
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingPrescription(prescription);
                      setIsEditPrescriptionOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Düzenle
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeletePrescription(prescription.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedPrescription && (
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reçete Detayları - {selectedPrescription.patientName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-semibold">Hasta</Label>
                  <p>{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Doktor</Label>
                  <p>{currentDoctorName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Tarih</Label>
                  <p>{selectedPrescription.date}</p>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Tanı</Label>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg">{selectedPrescription.diagnosis}</p>
              </div>

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

              <div>
                <Label className="font-semibold">Genel Talimatlar</Label>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg">{selectedPrescription.instructions}</p>
              </div>

              {selectedPrescription.nextVisit && (
                <div>
                  <Label className="font-semibold">Sonraki Kontrol</Label>
                  <p className="mt-2 p-3 bg-gray-50 rounded-lg">{selectedPrescription.nextVisit}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingPrescription && (
        <Dialog open={isEditPrescriptionOpen} onOpenChange={(open) => {
          setIsEditPrescriptionOpen(open);
          if (!open) {
            setEditingPrescription(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reçete Düzenle - {editingPrescription.patientName}</DialogTitle>
            </DialogHeader>
            <EditPrescriptionForm 
              prescription={editingPrescription}
              onSubmit={handleUpdatePrescription}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PrescriptionManagement;