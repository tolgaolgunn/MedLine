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
import { Plus, Search, FileText, Calendar, User, Pill, Printer, Edit, Trash2, Eye, Users, Clock } from 'lucide-react';
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

interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

interface Report {
  id: string;
  patientId: string;
  patientName: string;
  patientGender: string;
  patientAge: number;
  reportCode: string;
  doctorId: string;
  doctorName: string;
  startDate: string;
  endDate: string;
  diagnosis: string;
  diagnosisDetails: string;
  medications: Medication[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL) + '/api/doctor';

const DoctorReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [isEditReportOpen, setIsEditReportOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
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

  // Yaş hesaplama fonksiyonu
  const calculateAge = (birthDate: string): number => {
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

  // Cinsiyet dönüştürme fonksiyonu
  const formatGender = (gender: string): string => {
    if (!gender) return 'Belirtilmemiş';
    const genderLower = gender.toLowerCase();
    switch (genderLower) {
      case 'male':
      case 'erkek':
        return 'Erkek';
      case 'female':
      case 'kadın':
      case 'kadin':
        return 'Kadın';
      case 'other':
      case 'diğer':
      case 'diger':
        return 'Diğer';
      default:
        return gender;
    }
  };

  // Raporları yükle
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/reports`, {
          params: { doctorId: currentDoctorId },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        let fetchedReports: Report[] = [];
        if (response.data && Array.isArray(response.data.data)) {
          fetchedReports = response.data.data;
        } else if (Array.isArray(response.data)) {
          fetchedReports = response.data;
        } else {
          console.warn('Unexpected API response format:', response.data);
          setReports([]);
          return;
        }

        const fixedReports = fetchedReports.map(report => ({
          ...report,
          doctorName: report.doctorName && report.doctorName.trim() !== '' ? report.doctorName : currentDoctorName
        }));

        setReports(fixedReports);
      } catch (err) {
        const error = err as any;
        console.error('Error loading reports:', error);
        // Eğer API endpoint yoksa boş liste göster
        if (error.response?.status === 404) {
          setReports([]);
        } else {
          setError('Raporlar yüklenirken hata oluştu');
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentDoctorId) {
      fetchReports();
    }
  }, [currentDoctorId, currentDoctorName]);

  const handleCloseAddModal = () => {
    setIsAddReportOpen(false);
    setFormKey(prev => prev + 1);
  };

  const handleCloseEditModal = () => {
    setIsEditReportOpen(false);
    setEditingReport(null);
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
      toast.error(`Hastalar yüklenirken hata: ${error.message}`);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    if ((isAddReportOpen || isEditReportOpen) && patients.length === 0 && currentDoctorId) {
      fetchPatients();
    }
  }, [isAddReportOpen, isEditReportOpen, currentDoctorId]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, filterStatus]);

  const handleAddReport = async (newReport: Omit<Report, 'id'>) => {
    try {
      if (!newReport.patientId || !newReport.patientName.trim()) {
        toast.error('Lütfen geçerli bir hasta seçin');
        return;
      }

      const timestamp = new Date().getTime().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
      const reportCode = `RPT-${timestamp}-${randomStr}`;

      const reportData = {
        ...newReport,
        patientId: String(newReport.patientId),
        patientName: String(newReport.patientName),
        doctorId: currentDoctorId,
        doctorName: currentDoctorName,
        reportCode: reportCode,
        createdAt: new Date().toISOString(),
        status: 'active' as const,
        medications: newReport.medications.map(med => ({
          name: med.name.trim(),
          dosage: med.dosage?.trim() || '',
          frequency: med.frequency?.trim() || '',
          duration: med.duration?.trim() || '',
          instructions: med.instructions?.trim() || ''
        }))
      };

      const token = localStorage.getItem('token');

      try {
        const response = await axios.post(`${API_BASE_URL}/reports`, reportData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data) {
          setReports(prev => [response.data, ...prev]);
        }
      } catch (apiError) {
        // API endpoint yoksa local olarak ekle
        const localReport: Report = {
          ...reportData,
          id: `local-${Date.now()}`,
          patientGender: formatGender(reportData.patientGender),
        };
        setReports(prev => [localReport, ...prev]);
      }

      setIsAddReportOpen(false);
      toast.success('Rapor başarıyla oluşturuldu');
    } catch (err) {
      const error = err as any;
      console.error('Error creating report:', error);
      toast.error(`Rapor oluşturulurken hata: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateReport = async (updatedReport: Report) => {
    try {
      const token = localStorage.getItem('token');

      const selectedPatient = patients.find(p => String(p.patient_id) === String(updatedReport.patientId));
      if (!selectedPatient) {
        toast.error('Geçerli hasta bulunamadı');
        return;
      }

      const reportData = {
        ...updatedReport,
        patientId: String(updatedReport.patientId),
        patientName: selectedPatient.patient_name,
        patientGender: selectedPatient.gender,
        patientAge: calculateAge(selectedPatient.birth_date),
        doctorId: currentDoctorId,
        doctorName: currentDoctorName,
        medications: updatedReport.medications.map(med => ({
          name: med.name.trim(),
          dosage: med.dosage?.trim() || '',
          frequency: med.frequency?.trim() || '',
          duration: med.duration?.trim() || '',
          instructions: med.instructions?.trim() || ''
        }))
      };

      try {
        const response = await axios.put(
          `${API_BASE_URL}/reports/${updatedReport.id}`,
          reportData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data) {
          setReports((prevReports: Report[]) =>
            prevReports.map((r: Report) =>
              r.id === updatedReport.id ? { ...response.data, ...reportData } : r
            )
          );
        }
      } catch (apiError) {
        // API endpoint yoksa local olarak güncelle
        setReports(prevReports =>
          prevReports.map(r =>
            r.id === updatedReport.id ? { ...reportData, id: updatedReport.id, reportCode: updatedReport.reportCode, createdAt: updatedReport.createdAt } : r
          )
        );
      }

      setIsEditReportOpen(false);
      setEditingReport(null);
      toast.success('Rapor başarıyla güncellendi');
    } catch (err) {
      const error = err as any;
      console.error('Error updating report:', error);
      toast.error(`Rapor güncellenirken hata: ${error.response?.data?.message || error.message}`);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      try {
        await axios.delete(`${API_BASE_URL}/reports/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (apiError) {
        // API endpoint yoksa sadece local olarak sil
      }

      setReports(reports.filter(r => r.id !== id));
      toast.success('Rapor başarıyla silindi');
    } catch (err) {
      const error = err as any;
      console.error('Error deleting report:', error);
      toast.error('Rapor silinirken hata');
    }
  };

  const printReport = (report: Report) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up engelleyiciyi kapatıp tekrar deneyin.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapor - ${report.patientName}</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 14px; }
          .report-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          .info-group { padding: 10px; }
          .info-group strong { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
          .info-group span { font-size: 16px; font-weight: 500; }
          .diagnosis-section { margin-bottom: 30px; }
          .section-title { font-size: 18px; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-weight: 600; }
          .medications-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .medications-table th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-weight: 600; font-size: 14px; }
          .medications-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .details-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin-bottom: 30px; font-size: 14px; white-space: pre-wrap; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 30px; border-top: 1px solid #e2e8f0; }
          .doc-signature { text-align: center; }
          .doc-signature .line { width: 200px; border-bottom: 1px solid #000; margin-bottom: 10px; }
          .footer-note { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; }
          .date-range { background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .date-range-title { font-weight: 600; color: #92400e; margin-bottom: 10px; }
          .date-range-content { display: flex; gap: 30px; }
          .date-item { display: flex; align-items: center; gap: 8px; }
          .date-item strong { color: #78350f; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MEDLINE SAĞLIK MERKEZİ</h1>
          <p>Tıbbi Rapor</p>
          <p>Tel: (0212) 555 00 00 | Web: med-line-dmze.vercel.app</p>
        </div>

        <div class="report-info">
          <div class="info-group">
            <strong>HASTA ADI SOYADI</strong>
            <span>${report.patientName}</span>
          </div>
          <div class="info-group">
            <strong>CİNSİYET</strong>
            <span>${report.patientGender}</span>
          </div>
          <div class="info-group">
            <strong>YAŞ</strong>
            <span>${report.patientAge} yaş</span>
          </div>
          <div class="info-group">
            <strong>RAPOR NO</strong>
            <span>${report.reportCode}</span>
          </div>
        </div>

        <div class="date-range">
          <div class="date-range-title">📅 Rapor Geçerlilik Tarihleri</div>
          <div class="date-range-content">
            <div class="date-item">
              <strong>Başlangıç:</strong>
              <span>${new Date(report.startDate).toLocaleDateString('tr-TR')}</span>
            </div>
            <div class="date-item">
              <strong>Bitiş:</strong>
              <span>${new Date(report.endDate).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
        </div>

        <div class="diagnosis-section">
          <div class="section-title">TANI</div>
          <p>${report.diagnosis}</p>
        </div>

        <div class="diagnosis-section">
          <div class="section-title">TANI DETAYLARI</div>
          <div class="details-box">${report.diagnosisDetails || 'Belirtilmemiş'}</div>
        </div>

        ${report.medications && report.medications.length > 0 ? `
        <div class="medications-section">
          <div class="section-title">VERİLEN İLAÇLAR</div>
          <table class="medications-table">
            <thead>
              <tr>
                <th>İlaç Adı</th>
                <th>Doz</th>
                <th>Sıklık</th>
                <th>Süre</th>
                <th>Kullanım Talimatı</th>
              </tr>
            </thead>
            <tbody>
              ${report.medications.map(med => `
                <tr>
                  <td style="font-weight: 500;">${med.name}</td>
                  <td>${med.dosage}</td>
                  <td>${med.frequency || '-'}</td>
                  <td>${med.duration || '-'}</td>
                  <td>${med.instructions || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <div>
            <div style="font-size: 12px; color: #666;">
              Bu belge elektronik ortamda oluşturulmuştur.<br>
              Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}
            </div>
          </div>
          <div class="doc-signature">
            <div class="line"></div>
            <strong>${report.doctorName || 'Doktor'}</strong>
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

  // Rapor Ekleme Formu
  const AddReportForm = ({ onSubmit, onClose }: {
    onSubmit: (report: Omit<Report, 'id'>) => void;
    onClose: () => void;
  }) => {
    const formRef = useRef<HTMLFormElement>(null);
    const [formData, setFormData] = useState({
      patientId: '',
      patientName: '',
      patientGender: '',
      patientAge: 0,
      startDate: '',
      endDate: '',
      diagnosis: '',
      diagnosisDetails: '',
      medications: [{ name: '' }]
    });

    const hasChanges = useMemo(() => {
      return (
        formData.patientId !== '' ||
        formData.diagnosis !== '' ||
        formData.diagnosisDetails !== '' ||
        formData.startDate !== '' ||
        formData.endDate !== '' ||
        formData.medications.some(med => med.name !== '')
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
        medications: [...formData.medications, { name: '' }]
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
        patientName: selectedPatient.patient_name,
        patientGender: formatGender(selectedPatient.gender),
        patientAge: calculateAge(selectedPatient.birth_date)
      });
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.patientId) {
        toast.error('Lütfen bir hasta seçin');
        return;
      }

      if (!formData.diagnosis.trim()) {
        toast.error('Lütfen teşhis girin');
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        toast.error('Lütfen rapor tarihlerini girin');
        return;
      }

      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        toast.error('Bitiş tarihi başlangıç tarihinden önce olamaz');
        return;
      }

      const validMedications = formData.medications.filter(med => med.name.trim());

      onSubmit({
        patientId: formData.patientId,
        patientName: formData.patientName,
        patientGender: formData.patientGender,
        patientAge: formData.patientAge,
        startDate: formData.startDate,
        endDate: formData.endDate,
        diagnosis: formData.diagnosis,
        diagnosisDetails: formData.diagnosisDetails,
        medications: validMedications,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        reportCode: `RPT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        doctorId: currentDoctorId,
        doctorName: currentDoctorName
      });
    };

    return (
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Hasta Seçimi */}
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
                      <span className="text-xs text-gray-500">({formatGender(patient.gender)}, {calculateAge(patient.birth_date)} yaş)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Hasta Bilgileri (seçildiğinde göster) */}
        {formData.patientId && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs text-gray-500">Hasta Adı</Label>
              <p className="text-sm font-medium truncate">{formData.patientName}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Cinsiyet</Label>
              <p className="text-sm font-medium">{formData.patientGender}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Yaş</Label>
              <p className="text-sm font-medium">{formData.patientAge} yaş</p>
            </div>
          </div>
        )}

        {/* Rapor Tarihleri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="startDate" className="text-xs sm:text-sm">Rapor Başlangıç Tarihi *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="text-xs sm:text-sm">Rapor Bitiş Tarihi *</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>

        {/* Teşhis */}
        <div>
          <Label htmlFor="diagnosis" className="text-xs sm:text-sm">Teşhis *</Label>
          <Input
            id="diagnosis"
            value={formData.diagnosis}
            className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            placeholder="Teşhis girin..."
            required
          />
        </div>

        {/* Teşhis Detayları */}
        <div>
          <Label htmlFor="diagnosisDetails" className="text-xs sm:text-sm">Teşhis Detayları</Label>
          <Textarea
            id="diagnosisDetails"
            value={formData.diagnosisDetails}
            onChange={(e) => setFormData({ ...formData, diagnosisDetails: e.target.value })}
            placeholder="Teşhis hakkında detaylı bilgi girin..."
            className="border border-gray-300 rounded-md py-2 px-3 text-xs sm:text-sm h-24 sm:h-28"
            maxLength={500}
          />
          <div className="text-xs sm:text-sm text-gray-500 mt-1 text-right">
            {formData.diagnosisDetails.length}/500
          </div>
        </div>

        {/* İlaçlar */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
            <Label className="font-semibold text-xs sm:text-sm">Verilen İlaçlar</Label>
            <Button type="button" variant="outline" size="sm" onClick={addMedication} className="text-xs sm:text-sm w-full sm:w-auto">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> İlaç Ekle
            </Button>
          </div>

          <div className="space-y-2">
            {formData.medications.map((medication, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  id={`medication-name-${index}`}
                  value={medication.name}
                  onChange={(e) => updateMedication(index, 'name', e.target.value)}
                  placeholder="İlaç adı girin..."
                  className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm flex-1"
                />
                {formData.medications.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="text-xs sm:text-sm h-9 sm:h-10 px-2"
                    onClick={() => removeMedication(index)}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                )}
              </div>
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
            Rapor Oluştur
          </Button>
        </div>
      </form>
    );
  };

  // Rapor Düzenleme Formu
  const EditReportForm = ({ report, onSubmit, onClose }: {
    report: Report;
    onSubmit: (report: Report) => void;
    onClose: () => void;
  }) => {
    const [formData, setFormData] = useState({
      patientId: report.patientId,
      patientName: report.patientName,
      patientGender: report.patientGender,
      patientAge: report.patientAge,
      startDate: report.startDate,
      endDate: report.endDate,
      diagnosis: report.diagnosis,
      diagnosisDetails: report.diagnosisDetails,
      medications: report.medications.length > 0 ? report.medications : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      status: report.status
    });

    const hasChanges = useMemo(() => {
      return (
        formData.patientId !== report.patientId ||
        formData.startDate !== report.startDate ||
        formData.endDate !== report.endDate ||
        formData.diagnosis !== report.diagnosis ||
        formData.diagnosisDetails !== report.diagnosisDetails ||
        formData.status !== report.status ||
        JSON.stringify(formData.medications) !== JSON.stringify(report.medications)
      );
    }, [formData, report]);

    const addMedication = () => {
      setFormData({
        ...formData,
        medications: [...formData.medications, { name: '' }]
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
        patientName: selectedPatient.patient_name,
        patientGender: formatGender(selectedPatient.gender),
        patientAge: calculateAge(selectedPatient.birth_date)
      });
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.patientId) {
        toast.error('Lütfen bir hasta seçin');
        return;
      }

      if (!formData.diagnosis.trim()) {
        toast.error('Lütfen teşhis girin');
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        toast.error('Lütfen rapor tarihlerini girin');
        return;
      }

      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        toast.error('Bitiş tarihi başlangıç tarihinden önce olamaz');
        return;
      }

      const validMedications = formData.medications.filter(med => med.name.trim());

      onSubmit({
        ...report,
        patientId: formData.patientId,
        patientName: formData.patientName,
        patientGender: formData.patientGender,
        patientAge: formData.patientAge,
        startDate: formData.startDate,
        endDate: formData.endDate,
        diagnosis: formData.diagnosis,
        diagnosisDetails: formData.diagnosisDetails,
        medications: validMedications,
        status: formData.status
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Hasta Seçimi */}
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
            <Select value={formData.patientId} onValueChange={handlePatientSelect}>
              <SelectTrigger className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Hasta seçin...">
                  {formData.patientId ? (
                    <div className="flex items-center">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="truncate">{patients.find(p => String(p.patient_id) === formData.patientId)?.patient_name || formData.patientName}</span>
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
                      <span className="text-xs text-gray-500">({formatGender(patient.gender)}, {calculateAge(patient.birth_date)} yaş)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Hasta Bilgileri */}
        {formData.patientId && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs text-gray-500">Hasta Adı</Label>
              <p className="text-sm font-medium truncate">{formData.patientName}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Cinsiyet</Label>
              <p className="text-sm font-medium">{formData.patientGender}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Yaş</Label>
              <p className="text-sm font-medium">{formData.patientAge} yaş</p>
            </div>
          </div>
        )}

        {/* Rapor Tarihleri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="edit-startDate" className="text-xs sm:text-sm">Rapor Başlangıç Tarihi *</Label>
            <Input
              id="edit-startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-endDate" className="text-xs sm:text-sm">Rapor Bitiş Tarihi *</Label>
            <Input
              id="edit-endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>

        {/* Durum */}
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

        {/* Teşhis */}
        <div>
          <Label htmlFor="edit-diagnosis" className="text-xs sm:text-sm">Teşhis *</Label>
          <Input
            id="edit-diagnosis"
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm"
            required
          />
        </div>

        {/* Teşhis Detayları */}
        <div>
          <Label htmlFor="edit-diagnosisDetails" className="text-xs sm:text-sm">Teşhis Detayları</Label>
          <Textarea
            id="edit-diagnosisDetails"
            value={formData.diagnosisDetails}
            onChange={(e) => setFormData({ ...formData, diagnosisDetails: e.target.value })}
            className="border border-gray-300 rounded-md py-2 px-3 text-xs sm:text-sm h-24 sm:h-28"
            maxLength={500}
          />
          <div className="text-xs sm:text-sm text-gray-500 mt-1 text-right">
            {formData.diagnosisDetails.length}/500
          </div>
        </div>

        {/* İlaçlar */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
            <Label className="font-semibold text-xs sm:text-sm">Verilen İlaçlar</Label>
            <Button type="button" variant="outline" size="sm" onClick={addMedication} className="text-xs sm:text-sm w-full sm:w-auto">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> İlaç Ekle
            </Button>
          </div>

          <div className="space-y-2">
            {formData.medications.map((medication, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  id={`edit-medication-name-${index}`}
                  value={medication.name}
                  onChange={(e) => updateMedication(index, 'name', e.target.value)}
                  placeholder="İlaç adı girin..."
                  className="border border-gray-300 rounded-md h-9 sm:h-10 text-xs sm:text-sm flex-1"
                />
                {formData.medications.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="text-xs sm:text-sm h-9 sm:h-10 px-2"
                    onClick={() => removeMedication(index)}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                )}
              </div>
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
          title="Raporlar"
          subtitle="Hasta raporlarını oluşturun ve yönetin"
        />
        <Dialog open={isAddReportOpen} onOpenChange={setIsAddReportOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddReportOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Yeni Rapor</span>
              <span className="sm:hidden">Yeni</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto [&>button[data-slot='dialog-close']]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Yeni Rapor Oluştur</DialogTitle>
            </DialogHeader>
            <AddReportForm
              key={formKey}
              onSubmit={handleAddReport}
              onClose={handleCloseAddModal}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Arama ve Filtreleme */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
            <div className="relative flex-1 w-full border border-gray-300 rounded-md">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
              <Input
                placeholder="Hasta adı, teşhis veya rapor koduna göre ara..."
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

      {/* Raporlar Listesi */}
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
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <FileText className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Rapor bulunamadı</h3>
                {reports.length === 0 ? (
                  <p className="text-gray-600 mt-2">
                    Henüz hiç rapor oluşturulmadı. "Yeni Rapor" butonuna tıklayarak oluşturabilirsiniz.
                  </p>
                ) : (
                  <p className="text-gray-600 mt-2">
                    Arama kriterlerinize uygun rapor bulunamadı. Farklı arama terimleri deneyin.
                  </p>
                )}
              </div>
              <Button
                onClick={() => setIsAddReportOpen(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" /> İlk Raporunuzu Oluşturun
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg truncate">{report.patientName}</CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {report.patientGender} • {report.patientAge} yaş
                    </p>
                    <p className="text-xs text-gray-500 truncate">Rapor No: {report.reportCode}</p>
                  </div>
                  <Badge className={`${getStatusColor(report.status)} text-xs whitespace-nowrap`}>
                    {getStatusText(report.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                {/* Tarih Aralığı */}
                <div className="flex items-center space-x-2 text-xs sm:text-sm bg-amber-50 p-2 rounded-lg">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-amber-800">
                    {new Date(report.startDate).toLocaleDateString('tr-TR')} - {new Date(report.endDate).toLocaleDateString('tr-TR')}
                  </span>
                </div>

                {/* Teşhis */}
                <div className="min-w-0">
                  <span className="font-medium text-xs sm:text-sm">Teşhis:</span>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">{report.diagnosis}</p>
                </div>

                {/* Teşhis Detayları */}
                {report.diagnosisDetails && (
                  <div className="min-w-0">
                    <span className="font-medium text-xs sm:text-sm">Detaylar:</span>
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{report.diagnosisDetails}</p>
                  </div>
                )}

                {/* İlaçlar */}
                {report.medications && report.medications.length > 0 && (
                  <div>
                    <span className="font-medium text-xs sm:text-sm">İlaçlar:</span>
                    <div className="mt-1 space-y-1">
                      {report.medications.slice(0, 2).map((med, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs sm:text-sm min-w-0">
                          <Pill className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium truncate">{med.name}</span>
                          <span className="text-gray-600 truncate">- {med.dosage}</span>
                        </div>
                      ))}
                      {report.medications.length > 2 && (
                        <p className="text-xs text-gray-500 ml-5">+{report.medications.length - 2} daha fazla ilaç</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Aksiyon Butonları */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border border-black hover:border-black text-xs sm:text-sm flex-1 sm:flex-initial"
                    onClick={() => setSelectedReport(report)}
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Görüntüle</span>
                    <span className="sm:hidden">Gör</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border border-black hover:border-black text-xs sm:text-sm flex-1 sm:flex-initial"
                    onClick={() => printReport(report)}
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
                      setEditingReport(report);
                      setIsEditReportOpen(true);
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
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rapor Detay Modal */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg truncate">Rapor Detayları - {selectedReport.patientName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6">
              {/* Hasta Bilgileri */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-semibold text-xs sm:text-sm">Hasta</Label>
                  <p className="text-xs sm:text-sm truncate">{selectedReport.patientName}</p>
                </div>
                <div>
                  <Label className="font-semibold text-xs sm:text-sm">Cinsiyet</Label>
                  <p className="text-xs sm:text-sm">{selectedReport.patientGender}</p>
                </div>
                <div>
                  <Label className="font-semibold text-xs sm:text-sm">Yaş</Label>
                  <p className="text-xs sm:text-sm">{selectedReport.patientAge} yaş</p>
                </div>
                <div>
                  <Label className="font-semibold text-xs sm:text-sm">Doktor</Label>
                  <p className="text-xs sm:text-sm truncate">{selectedReport.doctorName || currentDoctorName}</p>
                </div>
              </div>

              {/* Tarih Aralığı */}
              <div className="p-3 sm:p-4 bg-amber-50 rounded-lg">
                <Label className="font-semibold text-xs sm:text-sm text-amber-800">Rapor Geçerlilik Tarihleri</Label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span className="text-sm"><strong>Başlangıç:</strong> {new Date(selectedReport.startDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span className="text-sm"><strong>Bitiş:</strong> {new Date(selectedReport.endDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              {/* Teşhis */}
              <div>
                <Label className="font-semibold text-xs sm:text-sm">Teşhis</Label>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg text-xs sm:text-sm break-words">{selectedReport.diagnosis}</p>
              </div>

              {/* Teşhis Detayları */}
              <div>
                <Label className="font-semibold text-xs sm:text-sm">Teşhis Detayları</Label>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg text-xs sm:text-sm break-words whitespace-pre-wrap">{selectedReport.diagnosisDetails || 'Belirtilmemiş'}</p>
              </div>

              {/* İlaçlar */}
              {selectedReport.medications && selectedReport.medications.length > 0 && (
                <div>
                  <Label className="font-semibold text-xs sm:text-sm">Verilen İlaçlar</Label>
                  <div className="mt-2 space-y-2 sm:space-y-3">
                    {selectedReport.medications.map((medication, index) => (
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
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rapor Düzenleme Modal */}
      {editingReport && (
        <Dialog open={isEditReportOpen} onOpenChange={setIsEditReportOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto [&>button[data-slot='dialog-close']]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg truncate">Rapor Düzenle - {editingReport.patientName}</DialogTitle>
            </DialogHeader>
            <EditReportForm
              key={editFormKey}
              report={editingReport}
              onSubmit={handleUpdateReport}
              onClose={handleCloseEditModal}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DoctorReports;
