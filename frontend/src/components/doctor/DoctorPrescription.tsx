import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { Plus, Search, FileText, Calendar, User, Pill, Printer, Edit, Trash2, Eye, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNotifications } from '../../contexts/NotificationContext';

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

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3005') + '/api/doctor';

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
  // const { addNotification } = useNotifications();

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
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up engelleyiciyi kapatıp tekrar deneyin.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçete - ${prescription.patientName}</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 14px; }
          .prescription-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          .info-group strong { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
          .info-group span { font-size: 16px; font-weight: 500; }
          .diagnosis-section { margin-bottom: 30px; }
          .section-title { font-size: 18px; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-weight: 600; }
          .medications-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .medications-table th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-weight: 600; font-size: 14px; }
          .medications-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .instructions-box { background: #fdfce8; border: 1px solid #fef9c3; padding: 15px; border-radius: 6px; margin-bottom: 30px; font-size: 14px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 30px; border-top: 1px solid #e2e8f0; }
          .doc-signature { text-align: center; }
          .doc-signature .line { width: 200px; border-bottom: 1px solid #000; margin-bottom: 10px; }
          .footer-note { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MEDLINE SAĞLIK MERKEZİ</h1>
          <p>Modern Tıp, Güvenilir Bakım</p>
          <p>Tel: (0212) 555 00 00 | Web: www.medline.com</p>
        </div>

        <div class="prescription-info">
          <div class="info-group">
            <strong>HASTA ADI SOYADI</strong>
            <span>${prescription.patientName}</span>
          </div>
          <div class="info-group">
            <strong>REÇETE NO</strong>
            <span>${prescription.prescriptionCode}</span>
          </div>
          <div class="info-group">
            <strong>TARİH</strong>
            <span>${new Date(prescription.date).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>

        <div class="diagnosis-section">
          <div class="section-title">TANI</div>
          <p>${prescription.diagnosis}</p>
        </div>

        <div class="medications-section">
          <div class="section-title">İLAÇLAR</div>
          <table class="medications-table">
            <thead>
              <tr>
                <th>İlaç Adı</th>
                <th>Doz</th>
                <th>Sıklık</th>
                <th>Kullanım Talimatı</th>
              </tr>
            </thead>
            <tbody>
              ${prescription.medications.map(med => `
                <tr>
                  <td style="font-weight: 500;">${med.name}</td>
                  <td>${med.dosage}</td>
                  <td>${med.frequency || '-'}</td>
                  <td>${med.instructions || med.duration || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${prescription.instructions ? `
          <div class="section-title">GENEL TALİMATLAR</div>
          <div class="instructions-box">
            ${prescription.instructions}
          </div>
        ` : ''}

        <div class="footer">
          <div>
            <div style="font-size: 12px; color: #666;">
              Bu belge elektronik ortamda oluşturulmuştur.<br>
              Geçerlilik Tarihi: ${new Date().toLocaleDateString('tr-TR')}
            </div>
          </div>
          <div class="doc-signature">
            <div class="line"></div>
            <strong>${prescription.doctorName || 'Doktor'}</strong>
            <div style="font-size: 12px; color: #666;">İmza / Kaşe</div>
          </div>
        </div>

        <div class="footer-note">
          Sağlıklı günler dileriz. | MedLine
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="patientSelect" className="text-xs sm:text-sm">Hasta Seç *</Label>
            {patientsLoading ? (
              <div className="flex items-center space-x-2 p-2 border rounded-md">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-500"></div>
                <span className="text-xs sm:text-sm text-gray-500">Hastalar yükleniyor...</span>
              </div>
            ) : patients.length === 0 ? (
              <div className="p-2 border rounded-md bg-yellow-50 border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                  <span className="text-xs sm:text-sm text-yellow-800">Henüz kayıtlı hasta yok</span>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-yellow-700 font-medium text-xs sm:text-sm"
                  onClick={() => window.open('/patients', '_blank')}
                >
                  Hasta eklemek için tıklayın
                </Button>
              </div>
            ) : (
              <Select value={formData.patientId} onValueChange={handlePatientSelect}>
                <SelectTrigger className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Hasta seçin...">
                    {formData.patientId ? (
                      <div className="flex items-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="truncate">{patients.find(p => String(p.patient_id) === formData.patientId)?.patient_name}</span>
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.patient_id} value={String(patient.patient_id)} className="text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">{patient.patient_name}</span>
                        {patient.phone_number && (
                          <span className="text-xs text-gray-500 truncate">({patient.phone_number})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label htmlFor="diagnosis" className="text-xs sm:text-sm">Tanı *</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis}
              className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Tanı girin..."
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="instructions" className="text-xs sm:text-sm">Genel Talimatlar</Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="Genel kullanım talimatları..."
            className="border border-gray-300 rounded-md py-2 px-3 text-xs sm:text-sm h-20 sm:h-24"
            maxLength={200}
          />
          <div className="text-xs sm:text-sm text-gray-500 mt-1 text-right">
            {formData.instructions.length}/200
          </div>
        </div>

        <div>
          <Label htmlFor="nextVisit" className="text-xs sm:text-sm">Sonraki Kontrol (Opsiyonel)</Label>
          <Input
            id="nextVisit"
            type="date"
            className="border border-gray-300 rounded-md shadow-sm w-full sm:w-1/3 h-9 sm:h-10 text-xs sm:text-sm"
            value={formData.nextVisit}
            onChange={(e) => setFormData({ ...formData, nextVisit: e.target.value })}
          />
        </div>

        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
            <Label className="font-semibold text-xs sm:text-sm">İlaçlar *</Label>
            <Button type="button" variant="outline" size="sm" onClick={addMedication} className="text-xs sm:text-sm w-full sm:w-auto">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> İlaç Ekle
            </Button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {formData.medications.map((medication, index) => (
              <Card key={index}>
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor={`medication-name-${index}`} className="text-xs sm:text-sm">İlaç Adı *</Label>
                      <Input
                        id={`medication-name-${index}`}
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        placeholder="İlaç adı girin..."
                        className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`medication-dosage-${index}`} className="text-xs sm:text-sm">Doz *</Label>
                      <Input
                        id={`medication-dosage-${index}`}
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="Örn: 500mg"
                        className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`medication-frequency-${index}`} className="text-xs sm:text-sm">Sıklık</Label>
                      <Input
                        id={`medication-frequency-${index}`}
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="Örn: Günde 3 kez"
                        className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`medication-duration-${index}`} className="text-xs sm:text-sm">Süre</Label>
                      <Input
                        id={`medication-duration-${index}`}
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        placeholder="Örn: 7 gün"
                        className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <Label htmlFor={`medication-instructions-${index}`} className="text-xs sm:text-sm">Kullanım Talimatları</Label>
                    <Textarea
                      id={`medication-instructions-${index}`}
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      className="border border-gray-300 rounded-md py-2 px-3 text-xs sm:text-sm h-16 sm:h-20"
                      maxLength={200}
                    />
                    <div className="text-xs sm:text-sm text-gray-500 mt-1 text-right">
                      {medication.instructions.length}/200
                    </div>
                  </div>
                  {formData.medications.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-2 text-xs sm:text-sm"
                      onClick={() => removeMedication(index)}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Kaldır
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="!border-2 !border-gray-300 !rounded-md text-xs sm:text-sm w-full sm:w-auto"
          >
            İptal
          </Button>
          <Button type="submit" disabled={!formData.patientId || patientsLoading} className="text-xs sm:text-sm w-full sm:w-auto">
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
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="edit-patientSelect" className="text-xs sm:text-sm">Hasta Seç *</Label>
            {patientsLoading ? (
              <div className="flex items-center space-x-2 p-2 border rounded-md">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-500"></div>
                <span className="text-xs sm:text-sm text-gray-500">Hastalar yükleniyor...</span>
              </div>
            ) : patients.length === 0 ? (
              <div className="p-2 border rounded-md bg-yellow-50 border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                  <span className="text-xs sm:text-sm text-yellow-800">Henüz kayıtlı hasta yok</span>
                </div>
              </div>
            ) : (
              <Select
                value={formData.patientId}
                onValueChange={handlePatientSelect}
              >
                <SelectTrigger className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Hasta seçin...">
                    {formData.patientId ? (
                      <div className="flex items-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="truncate">{patients.find(p => String(p.patient_id) === formData.patientId)?.patient_name}</span>
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.patient_id} value={String(patient.patient_id)} className="text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">{patient.patient_name}</span>
                        {patient.phone_number && (
                          <span className="text-xs text-gray-500 truncate">({patient.phone_number})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label htmlFor="edit-diagnosis" className="text-xs sm:text-sm">Tanı *</Label>
            <Input
              id="edit-diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="edit-instructions" className="text-xs sm:text-sm">Genel Talimatlar</Label>
          <Textarea
            id="edit-instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="border border-gray-300 rounded-md py-2 px-3 text-xs sm:text-sm h-20 sm:h-24"
            maxLength={200}
            placeholder="Genel kullanım talimatları (maksimum 200 karakter)"
          />
          <div className="text-xs sm:text-sm text-gray-500 mt-1 text-right">
            {formData.instructions.length}/200
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="edit-nextVisit" className="text-xs sm:text-sm">Sonraki Kontrol (Opsiyonel)</Label>
            <Input
              id="edit-nextVisit"
              type="date"
              value={formData.nextVisit}
              onChange={(e) => setFormData({ ...formData, nextVisit: e.target.value })}
              className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="edit-status" className="text-xs sm:text-sm">Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'completed' | 'cancelled' })}
            >
              <SelectTrigger className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm">
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
            <Label className="font-semibold text-xs sm:text-sm">İlaçlar *</Label>
            <Button type="button" variant="outline" size="sm" onClick={addMedication} className="text-xs sm:text-sm w-full sm:w-auto">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> İlaç Ekle
            </Button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {formData.medications.map((medication, index) => (
              <Card key={index}>
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor={`edit-medication-name-${index}`} className="text-xs sm:text-sm">İlaç Adı *</Label>
                      <Input
                        id={`edit-medication-name-${index}`}
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-medication-dosage-${index}`} className="text-xs sm:text-sm">Doz *</Label>
                      <Input
                        id={`edit-medication-dosage-${index}`}
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-medication-frequency-${index}`} className="text-xs sm:text-sm">Sıklık</Label>
                      <Input
                        id={`edit-medication-frequency-${index}`}
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-medication-duration-${index}`} className="text-xs sm:text-sm">Süre</Label>
                      <Input
                        id={`edit-medication-duration-${index}`}
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <Label htmlFor={`edit-medication-instructions-${index}`} className="text-xs sm:text-sm">Kullanım Talimatları</Label>
                    <Textarea
                      id={`edit-medication-instructions-${index}`}
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      className="border border-gray-300 rounded-md py-2 px-3 text-xs sm:text-sm h-16 sm:h-20"
                      maxLength={200}
                      placeholder="Kullanım talimatları (maksimum 200 karakter)"
                    />
                    <div className="text-xs sm:text-sm text-gray-500 mt-1 text-right">
                      {medication.instructions.length}/200
                    </div>
                  </div>
                  {formData.medications.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-2 text-xs sm:text-sm"
                      onClick={() => removeMedication(index)}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Kaldır
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="!border-2 !border-gray-300 !rounded-md text-xs sm:text-sm w-full sm:w-auto"
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges}
            className={`text-xs sm:text-sm w-full sm:w-auto ${!hasChanges ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Güncelle
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <PageHeader
          title="Reçete Yönetimi"
          subtitle="Reçetelerinizi oluşturun ve yönetin"
        />
        <Dialog open={isAddPrescriptionOpen} onOpenChange={setIsAddPrescriptionOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddPrescriptionOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Yeni Reçete</span>
              <span className="sm:hidden">Yeni</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto [&>button[data-slot='dialog-close']]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
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
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
            <div className="relative flex-1 w-full border border-gray-300 rounded-md">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
              <Input
                placeholder="Hasta adı veya tanıya göre ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
              />
            </div>
            <div className="w-full md:w-40">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredPrescriptions.map((prescription) => (
            <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg truncate">{prescription.patientName}</CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Reçete No: {prescription.prescriptionCode}</p>
                  </div>
                  <Badge className={`${getStatusColor(prescription.status)} text-xs whitespace-nowrap`}>
                    {prescription.status === 'active' ? 'Aktif' :
                      prescription.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="min-w-0">
                    <span className="font-medium">Tanı:</span>
                    <p className="text-gray-600 truncate">{prescription.diagnosis}</p>
                  </div>
                  <div>
                    <span className="font-medium">Tarih:</span>
                    <p className="text-gray-600">{prescription.date}</p>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-xs sm:text-sm">İlaçlar:</span>
                  <div className="mt-1 space-y-1">
                    {prescription.medications.map((med, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs sm:text-sm min-w-0">
                        <Pill className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">{med.name}</span>
                        <span className="text-gray-600 truncate">- {med.dosage}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {prescription.nextVisit && (
                  <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">Sonraki kontrol: {prescription.nextVisit}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border border-black hover:border-black text-xs sm:text-sm flex-1 sm:flex-initial"
                    onClick={() => setSelectedPrescription(prescription)}
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Görüntüle</span>
                    <span className="sm:hidden">Gör</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border border-black hover:border-black text-xs sm:text-sm flex-1 sm:flex-initial"
                    onClick={() => printPrescription(prescription)}
                  >
                    <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Yazdır</span>
                    <span className="sm:hidden">Yaz</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border border-black hover:border-black text-xs sm:text-sm flex-1 sm:flex-initial"
                    onClick={() => {
                      setEditingPrescription(prescription);
                      setIsEditPrescriptionOpen(true);
                    }}
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Düzenle</span>
                    <span className="sm:hidden">Düz</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="border-2 border-red-300 hover:border-red-400 text-xs sm:text-sm flex-1 sm:flex-initial"
                    onClick={() => handleDeletePrescription(prescription.id)}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedPrescription && (
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg truncate">Reçete Detayları - {selectedPrescription.patientName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-semibold text-xs sm:text-sm">Hasta</Label>
                  <p className="text-xs sm:text-sm truncate">{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <Label className="font-semibold text-xs sm:text-sm">Doktor</Label>
                  <p className="text-xs sm:text-sm truncate">{currentDoctorName}</p>
                </div>
                <div>
                  <Label className="font-semibold text-xs sm:text-sm">Tarih</Label>
                  <p className="text-xs sm:text-sm">{selectedPrescription.date}</p>
                </div>
              </div>

              <div>
                <Label className="font-semibold text-xs sm:text-sm">Tanı</Label>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg text-xs sm:text-sm break-words">{selectedPrescription.diagnosis}</p>
              </div>

              <div>
                <Label className="font-semibold text-xs sm:text-sm">İlaçlar</Label>
                <div className="mt-2 space-y-2 sm:space-y-3">
                  {selectedPrescription.medications.map((medication, index) => (
                    <Card key={index}>
                      <CardContent className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="min-w-0">
                            <p className="font-medium text-xs sm:text-sm truncate">{medication.name}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{medication.dosage}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm"><span className="font-medium">Sıklık:</span> {medication.frequency || 'Belirtilmemiş'}</p>
                            <p className="text-xs sm:text-sm"><span className="font-medium">Süre:</span> {medication.duration || 'Belirtilmemiş'}</p>
                          </div>
                        </div>
                        {medication.instructions && (
                          <div className="mt-2">
                            <p className="text-xs sm:text-sm break-words"><span className="font-medium">Kullanım:</span> {medication.instructions}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-semibold text-xs sm:text-sm">Genel Talimatlar</Label>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg text-xs sm:text-sm break-words">{selectedPrescription.instructions || 'Belirtilmemiş'}</p>
              </div>

              {selectedPrescription.nextVisit && (
                <div>
                  <Label className="font-semibold text-xs sm:text-sm">Sonraki Kontrol</Label>
                  <p className="mt-2 p-3 bg-gray-50 rounded-lg text-xs sm:text-sm">{selectedPrescription.nextVisit}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingPrescription && (
        <Dialog open={isEditPrescriptionOpen} onOpenChange={setIsEditPrescriptionOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto [&>button[data-slot='dialog-close']]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg truncate">Reçete Düzenle - {editingPrescription.patientName}</DialogTitle>
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