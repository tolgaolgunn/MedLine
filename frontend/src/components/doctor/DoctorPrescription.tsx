import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  patient_id: number;
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
  const [formKey, setFormKey] = useState(0);
  const [editFormKey, setEditFormKey] = useState(0);

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
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/prescriptions`, {
          params: { doctorId: currentDoctorId },
          headers: {
            Authorization: `Bearer ${token}`
          }
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
      } catch (err) {
        const error = err as any;
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

  const handleCloseAddModal = () => {
    setIsAddPrescriptionOpen(false);
    setFormKey(prev => prev + 1);
  };

  const handleCloseEditModal = () => {
    setIsEditPrescriptionOpen(false);
    setEditingPrescription(null);
    setEditFormKey(prev => prev + 1);
  };

  const fetchPatients = async () => {
    try {
      setPatientsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/patients/${currentDoctorId}`, {
        params: { doctorId: currentDoctorId },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const patientsData = response.data?.data || response.data;
      if (!Array.isArray(patientsData)) {
        throw new Error('API did not return patient data in expected format');
      }

      setPatients(patientsData);
    } catch (err) {
      const error = err as any;
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

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(prescription => {
      const matchesSearch = prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, searchTerm, filterStatus]);

  const handleAddPrescription = async (newPrescription: Omit<Prescription, 'id'>) => {
    try {
      if (!newPrescription.patientId || !newPrescription.patientName.trim()) {
        toast.error('Lütfen geçerli bir hasta seçin');
        return;
      }

      const timestamp = new Date().getTime().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
      const prescriptionCode = `RX-${timestamp}-${randomStr}`;

      const prescriptionData = {
        ...newPrescription,
        patientId: String(newPrescription.patientId),
        patientName: String(newPrescription.patientName),
        doctorId: currentDoctorId,
        doctorName: currentDoctorName,
        prescriptionCode: prescriptionCode,
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

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/prescriptions`, prescriptionData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data) {
        setPrescriptions(prev => [response.data, ...prev]);
        setIsAddPrescriptionOpen(false);
        toast.success('Reçete başarıyla oluşturuldu');
      }
    } catch (err) {
      const error = err as any;
      console.error('Error creating prescription:', error);
      toast.error(`Reçete oluşturulurken hata: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdatePrescription = async (updatedPrescription: Prescription) => {
  try {
    const token = localStorage.getItem('token');
    
    // Get the selected patient's information
    const selectedPatient = patients.find(p => String(p.patient_id) === String(updatedPrescription.patientId));
    if (!selectedPatient) {
      toast.error('Geçerli hasta bulunamadı');
      return;
    }

    // Format the prescription data properly
    const prescriptionData = {
      id: updatedPrescription.id,
      patientId: String(updatedPrescription.patientId),
      patientName: selectedPatient.patient_name, // Bu satırı düzeltin
      doctorId: currentDoctorId,
      doctorName: currentDoctorName,
      prescriptionCode: updatedPrescription.prescriptionCode,
      date: updatedPrescription.date || new Date().toISOString().split('T')[0],
      diagnosis: updatedPrescription.diagnosis,
      medications: updatedPrescription.medications.map(med => ({
        name: med.name.trim(),
        dosage: med.dosage.trim(),
        frequency: med.frequency?.trim() || '',
        duration: med.duration?.trim() || '',
        instructions: med.instructions?.trim() || ''
      })),
      instructions: updatedPrescription.instructions,
      status: updatedPrescription.status,
      nextVisit: updatedPrescription.nextVisit
    };

    const response = await axios.put(
      `${API_BASE_URL}/prescriptions/${updatedPrescription.id}`, 
      prescriptionData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data) {
      // API'den gelen veriyi kullanmak yerine, gönderdiğimiz veriyi kullanıyoruz
      const updatedData = {
        ...response.data,
        patientId: prescriptionData.patientId,
        patientName: prescriptionData.patientName // Bu satırı ekleyin
      };
      
      setPrescriptions(prevPrescriptions => 
        prevPrescriptions.map(p => 
          p.id === updatedPrescription.id ? updatedData : p
        )
      );

      setIsEditPrescriptionOpen(false);
      setEditingPrescription(null);
      toast.success('Reçete başarıyla güncellendi');
    }
  } catch (err) {
    const error = err as any;
    console.error('Error updating prescription:', error);
    toast.error(`Reçete güncellenirken hata: ${error.response?.data?.message || error.message}`);
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
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/prescriptions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPrescriptions(prescriptions.filter(p => p.id !== id));
      toast.success('Reçete başarıyla silindi');
    } catch (err) {
      const error = err as any;
      console.error('Error deleting prescription:', error);
      toast.error('Reçete silinirken hata');
    }
  };

  const printPrescription = (prescription: Prescription) => {
    console.log('Printing prescription:', prescription.id);
    toast.info('Reçete yazdırılıyor');
  };

  const AddPrescriptionForm = ({ onSubmit, onClose }: { 
    onSubmit: (prescription: Omit<Prescription, 'id'>) => void;
    onClose: () => void;
  }) => {
    const formRef = useRef<HTMLFormElement>(null);
    const [formData, setFormData] = useState({
      patientId: '',
      patientName: '',
      diagnosis: '',
      instructions: '',
      nextVisit: '',
      medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });

    const hasChanges = useMemo(() => {
      return (
        formData.patientId !== '' ||
        formData.patientName !== '' ||
        formData.diagnosis !== '' ||
        formData.instructions !== '' ||
        formData.nextVisit !== '' ||
        formData.medications.some(med => 
          med.name !== '' || med.dosage !== '' || med.frequency !== '' || 
          med.duration !== '' || med.instructions !== ''
        )
      );
    }, [formData]);

    const handleClose = () => {
      if (!hasChanges || confirm('Değişiklikler kaydedilmeden kapatılacak. Devam etmek istiyor musunuz?')) {
        onClose();
      }
    };

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

    const handlePatientSelect = (patientId: string) => {
  const selectedPatient = patients.find(p => String(p.patient_id) === patientId);
  if (!selectedPatient) {
    toast.error('Geçersiz hasta seçimi');
    return;
  }
  
  setFormData({
    ...formData,
    patientId: patientId,
    patientName: selectedPatient.patient_name
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
        patientId: formData.patientId,
        patientName: formData.patientName,
        diagnosis: formData.diagnosis,
        instructions: formData.instructions,
        nextVisit: formData.nextVisit,
        medications: validMedications,
        status: 'active' as const,
        date: new Date().toISOString().split('T')[0],
        prescriptionCode: `RX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        doctorName: currentDoctorName
      });
    };

    return (
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
              <Select value={formData.patientId} onValueChange={handlePatientSelect}>
                <SelectTrigger className="border border-gray-300 rounded-md">
                  <SelectValue placeholder="Hasta seçin...">
                    {formData.patientId ? (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {patients.find(p => String(p.patient_id) === formData.patientId)?.patient_name}
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.patient_id} value={String(patient.patient_id)}>
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
              className="border border-gray-300 rounded-md"
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
            className="border border-gray-300 rounded-md py-2 px-3"
            maxLength={200}
          />
          <div className="text-sm text-gray-500 mt-1 text-right">
            {formData.instructions.length}/200
          </div>
        </div>

        <div>
          <Label htmlFor="nextVisit">Sonraki Kontrol (Opsiyonel)</Label>
          <Input
            id="nextVisit"
            type="date"
            className="border border-gray-300 rounded-md shadow-sm w-1/3"
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
                        className="border border-gray-300 rounded-md"
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
                        className="border border-gray-300 rounded-md"
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
                        className="border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`medication-duration-${index}`}>Süre</Label>
                      <Input
                        id={`medication-duration-${index}`}
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        placeholder="Örn: 7 gün"
                        className="border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor={`medication-instructions-${index}`}>Kullanım Talimatları</Label>
                    <Textarea
                      id={`medication-instructions-${index}`}
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      className="border border-gray-300 rounded-md py-2 px-3"
                      maxLength={200}
                    />
                    <div className="text-sm text-gray-500 mt-1 text-right">
                      {medication.instructions.length}/200
                    </div>
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
            onClick={handleClose}
            className="!border-2 !border-gray-300 !rounded-md"
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

  const EditPrescriptionForm = ({ prescription, onSubmit, onClose }: { 
    prescription: Prescription;
    onSubmit: (prescription: Prescription) => void;
    onClose: () => void;
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

    const hasChanges = useMemo(() => {
      return (
        formData.patientId !== prescription.patientId ||
        formData.patientName !== prescription.patientName ||
        formData.diagnosis !== prescription.diagnosis ||
        formData.instructions !== prescription.instructions ||
        formData.nextVisit !== (prescription.nextVisit || '') ||
        formData.status !== prescription.status ||
        JSON.stringify(formData.medications) !== JSON.stringify(prescription.medications)
      );
    }, [formData, prescription]);

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

    const handlePatientSelect = (patientId: string) => {
      const selectedPatient = patients.find(p => String(p.patient_id) === patientId);
      if (!selectedPatient) {
        toast.error('Geçersiz hasta seçimi');
        return;
      }
      
      setFormData({
        ...formData,
        patientId: patientId,
        patientName: selectedPatient.patient_name
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
                <SelectTrigger className="border border-gray-300 rounded-md">
                  <SelectValue placeholder="Hasta seçin...">
                    {formData.patientId ? (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {patients.find(p => String(p.patient_id) === formData.patientId)?.patient_name}
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.patient_id} value={String(patient.patient_id)}>
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
              className="border border-gray-300 rounded-md"
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
            className="border border-gray-300 rounded-md py-2 px-3"
            maxLength={200}
            placeholder="Genel kullanım talimatları (maksimum 200 karakter)"
          />
          <div className="text-sm text-gray-500 mt-1 text-right">
            {formData.instructions.length}/200
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-nextVisit">Sonraki Kontrol (Opsiyonel)</Label>
            <Input
              id="edit-nextVisit"
              type="date"
              value={formData.nextVisit}
              onChange={(e) => setFormData({...formData, nextVisit: e.target.value})}
              className="border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <Label htmlFor="edit-status">Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({...formData, status: value as 'active' | 'completed' | 'cancelled'})}
            >
              <SelectTrigger className="border border-gray-300 rounded-md">
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
                        className="border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-medication-dosage-${index}`}>Doz *</Label>
                      <Input
                        id={`edit-medication-dosage-${index}`}
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-medication-frequency-${index}`}>Sıklık</Label>
                      <Input
                        id={`edit-medication-frequency-${index}`}
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-medication-duration-${index}`}>Süre</Label>
                      <Input
                        id={`edit-medication-duration-${index}`}
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor={`edit-medication-instructions-${index}`}>Kullanım Talimatları</Label>
                    <Textarea
                      id={`edit-medication-instructions-${index}`}
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      className="border border-gray-300 rounded-md py-2 px-3"
                      maxLength={200}
                      placeholder="Kullanım talimatları (maksimum 200 karakter)"
                    />
                    <div className="text-sm text-gray-500 mt-1 text-right">
                      {medication.instructions.length}/200
                    </div>
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
            onClick={onClose}
            className="!border-2 !border-gray-300 !rounded-md"
          >
            İptal
          </Button>
          <Button 
            type="submit" 
            disabled={!hasChanges}
            className={!hasChanges ? "opacity-50 cursor-not-allowed" : ""}
          >
            Güncelle
          </Button>
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
            <Button onClick={() => setIsAddPrescriptionOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Reçete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button[data-slot='dialog-close']]:hidden">
            <DialogHeader>
              <DialogTitle>Yeni Reçete Oluştur</DialogTitle>
            </DialogHeader>
            <AddPrescriptionForm 
              key={formKey}
              onSubmit={handleAddPrescription}
              onClose={handleCloseAddModal}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full border border-gray-300 rounded-md">
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
                <SelectTrigger className="border border-gray-300 rounded-md">
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
                    className="border border-black hover:border-black"
                    onClick={() => setSelectedPrescription(prescription)}
                  >
                    <Eye className="w-4 h-4 mr-1" /> Görüntüle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border border-black hover:border-black"
                    onClick={() => printPrescription(prescription)}
                  >
                    <Printer className="w-4 h-4 mr-1" /> Yazdır
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border border-black hover:border-black"
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
                    className="border-2 border-red-300 hover:border-red-400"
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
                      <CardContent className="p-4 bg-gray-50 rounded-lg">
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
        <Dialog open={isEditPrescriptionOpen} onOpenChange={setIsEditPrescriptionOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button[data-slot='dialog-close']]:hidden">
            <DialogHeader>
              <DialogTitle>Reçete Düzenle - {editingPrescription.patientName}</DialogTitle>
            </DialogHeader>
            <EditPrescriptionForm 
              key={editFormKey}
              prescription={editingPrescription}
              onSubmit={handleUpdatePrescription}
              onClose={handleCloseEditModal}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PrescriptionManagement;