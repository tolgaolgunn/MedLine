import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { PageHeader } from '../ui/PageHeader';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Search, Plus, Phone, Mail, Calendar } from 'lucide-react';

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
  blood_type: string;
  doctor_id: string;
  total_appointments: number;
  last_appointment_date: string;
  first_appointment_date: string;
}

// Hasta kartı içeriğini güncelle
const PatientCard = ({
  patient,
  onOpenResults,
}: {
  patient: Patient;
  onOpenResults: (patient: Patient) => void;
}) => {
  return (
    <Card key={patient.patient_id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg truncate">{patient.patient_name}</CardTitle>
            <p className="text-xs sm:text-sm text-gray-600 truncate">ID: {patient.patient_id}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-full p-4 sm:p-6 pt-0">
        <div className="flex-1 space-y-2 sm:space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{calculateAge(patient.birth_date)} yaş</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              <span className="text-gray-400 text-xs sm:text-sm">Cinsiyet:</span>
              <span className="truncate">{patient.gender}</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 col-span-2">
              <span className="text-gray-400 text-xs sm:text-sm">Kan Grubu:</span>
              <span className="truncate">{patient.blood_type || 'Belirtilmemiş'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm min-w-0">
            <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{patient.phone_number}</span>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm min-w-0">
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{patient.email}</span>
          </div>

          <div className="pt-2">
            <p className="text-xs text-gray-500 truncate">
              Son randevu: {formatDate(patient.last_appointment_date)}
            </p>
            <p className="text-xs text-gray-500">
              Toplam randevu: {patient.total_appointments}
            </p>
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <Button
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => onOpenResults(patient)}
          >
            Sonuçlar
          </Button>
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


const PatientManagement: React.FC = () => {
  // 1. All hooks at the top
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [resultsPatient, setResultsPatient] = useState<Patient | null>(null);
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsListError, setResultsListError] = useState<string | null>(null);
  const [isAddingResult, setIsAddingResult] = useState(false);
  const [expandedResultId, setExpandedResultId] = useState<number | null>(null);
  const [resultTitle, setResultTitle] = useState('');
  const [resultDetails, setResultDetails] = useState('');
  const [resultFiles, setResultFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ url: string; type: 'image' | 'pdf'; name: string }[]>([]);
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);
  const [resultSuccess, setResultSuccess] = useState<string | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [formHasChanges, setFormHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Dosya önizlemeleri (image için thumbnail, pdf için etiket)
  useEffect(() => {
    // Eski URL'leri temizle
    return () => {
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Önceki URL'leri temizle
    filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));

    const previews = resultFiles.map((file) => {
      const url = URL.createObjectURL(file);
      const isImage = file.type.startsWith('image/');
      return {
        url,
        type: isImage ? 'image' as const : 'pdf' as const,
        name: file.name,
      };
    });

    setFilePreviews(previews);
  }, [resultFiles]);

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
  const handleAddPatient = (newPatient: {
    patient_name: string;
    email: string;
    phone_number: string;
    birth_date: string;
    gender: string;
    address: string;
    blood_type: string;
    medical_history: string;
  }) => {
    const patient: Patient = {
      patient_id: `P${String(patients.length + 1).padStart(3, '0')}`,
      patient_name: newPatient.patient_name,
      email: newPatient.email,
      phone_number: newPatient.phone_number,
      birth_date: newPatient.birth_date,
      gender: newPatient.gender,
      address: newPatient.address,
      medical_history: newPatient.medical_history,
      blood_type: newPatient.blood_type,
      doctor_id: currentDoctorId,
      total_appointments: 0,
      last_appointment_date: '',
      first_appointment_date: new Date().toISOString().split('T')[0]
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

  const handleOpenResults = async (patient: Patient) => {
    setResultsPatient(patient);
    setPatientResults([]);
    setIsLoadingResults(true);
    setResultsListError(null);
    setIsAddingResult(false);
    setResultTitle('');
    setResultDetails('');
    setResultFiles([]);
    setResultError(null);
    setResultSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3005/api/doctor/results/${patient.patient_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Sonuçlar alınırken hata oluştu (status: ${response.status})`);
      }

      const data = await response.json();
      const list = data?.data || data || [];
      setPatientResults(list);
    } catch (err: any) {
      console.error('Error fetching patient results:', err);
      setResultsListError(err.message || 'Sonuçlar alınırken bir hata oluştu');
      setPatientResults([]);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultsPatient || !currentDoctorId) return;

    if (!resultTitle.trim() || !resultDetails.trim()) {
      setResultError('Sonuç başlığı ve detayları zorunludur.');
      return;
    }

    try {
      setIsSavingResult(true);
      setResultError(null);
      setResultSuccess(null);

      const token = localStorage.getItem('token');

      const hasFiles = resultFiles && resultFiles.length > 0;
      let response: Response;

      if (hasFiles) {
        const formData = new FormData();
        formData.append('patientId', resultsPatient.patient_id);
        formData.append('title', resultTitle);
        formData.append('details', resultDetails);
        resultFiles.forEach((file) => {
          formData.append('files', file);
        });

        response = await fetch('http://localhost:3005/api/doctor/results-with-files', {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });
      } else {
        response = await fetch('http://localhost:3005/api/doctor/results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            patientId: resultsPatient.patient_id,
            title: resultTitle,
            details: resultDetails,
          }),
        });
      }

      const json = await response.json().catch(() => ({}));

      if (!response.ok || json?.success === false) {
        throw new Error(json.message || 'Sonuç kaydedilirken bir hata oluştu');
      }

      const created = json?.data || json;

      setResultSuccess('Sonuç başarıyla kaydedildi.');
      setResultTitle('');
      setResultDetails('');
      setResultFiles([]);
      // Yeni eklenen sonucu liste başına ekle
      setPatientResults(prev => (created ? [created, ...prev] : prev));
    } catch (err: any) {
      setResultError(err.message || 'Sonuç kaydedilirken bir hata oluştu');
    } finally {
      setIsSavingResult(false);
    }
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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
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
            <Button className="w-full sm:w-auto text-xs sm:text-sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Yeni Hasta Ekle</span>
              <span className="sm:hidden">Yeni Hasta</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full border-2 border-gray-300 rounded-md">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
              <Input
                placeholder="Hasta ara (isim, email, telefon)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
              />
            </div>
            
            {/* Remove Filter Dropdown */}
            
          </div>
        </CardContent>
      </Card>

      {/* Update Search Results Info */}
      {searchTerm && (
        <Card className="p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700 truncate">
                Arama sonuçları: "{searchTerm}"
                {` (${filteredPatients.length} hasta bulundu)`}
              </span>
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-gray-600 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto"
            >
              Temizle
            </button>
          </div>
        </Card>
      )}

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredPatients.map((patient) => (
          <PatientCard
            key={patient.patient_id}
            patient={patient}
            onOpenResults={handleOpenResults}
          />
        ))}
      </div>

      {/* Patient Detail Dialog */}
      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg truncate">Hasta Detayları - {selectedPatient.patient_name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label className="font-semibold text-sm sm:text-base">Kişisel Bilgiler</Label>
                  <div className="mt-2 space-y-2 text-xs sm:text-sm">
                    <p className="break-words"><span className="font-medium">Yaş:</span> {calculateAge(selectedPatient.birth_date)}</p>
                    <p className="break-words"><span className="font-medium">Cinsiyet:</span> {selectedPatient.gender}</p>
                    <p className="break-words"><span className="font-medium">Kan Grubu:</span> {selectedPatient.blood_type || 'Belirtilmemiş'}</p>
                    <p className="break-words"><span className="font-medium">Telefon:</span> {selectedPatient.phone_number}</p>
                    <p className="break-words"><span className="font-medium">Email:</span> {selectedPatient.email}</p>
                    <p className="break-words"><span className="font-medium">Adres:</span> {selectedPatient.address || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold text-sm sm:text-base">Tıbbi Geçmiş</Label>
                  <div className="mt-2">
                    {selectedPatient.medical_history ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.medical_history.split(',').map((condition: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {condition.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-500">Tıbbi geçmiş bilgisi yok</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label className="font-semibold text-sm sm:text-base">Randevu Bilgileri</Label>
                  <div className="mt-2 space-y-2 text-xs sm:text-sm">
                    <p><span className="font-medium">Toplam Randevu:</span> {selectedPatient.total_appointments}</p>
                    <p className="break-words"><span className="font-medium">Son Randevu:</span> {formatDate(selectedPatient.last_appointment_date)}</p>
                    <p className="break-words"><span className="font-medium">İlk Randevu:</span> {formatDate(selectedPatient.first_appointment_date)}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Çıkış Onay Modalı */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-[95vw] sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Kaydetmeden Çıkış</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Kaydetmeden çıkmak istediğinizden emin misiniz? <br />
              Yapılan değişiklikler kaybolacaktır.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" 
            className="!border-2 !border-gray-300 !rounded-md text-xs sm:text-sm w-full sm:w-auto"
            onClick={cancelExit}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmExit} className="text-xs sm:text-sm w-full sm:w-auto">
              Çıkış Yap
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sonuçlar Dialogu (liste + Sonuç ekle formu) */}
      {resultsPatient && (
        <Dialog open={!!resultsPatient} onOpenChange={(open) => !open && setResultsPatient(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Sonuçlar - {resultsPatient.patient_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Mevcut sonuçlar listesi */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-semibold">Önceki Sonuçlar</Label>

                {isLoadingResults && (
                  <p className="text-xs sm:text-sm text-gray-500">Sonuçlar yükleniyor...</p>
                )}

                {!isLoadingResults && resultsListError && (
                  <p className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {resultsListError}
                  </p>
                )}

                {!isLoadingResults && !resultsListError && patientResults.length === 0 && (
                  <p className="text-xs sm:text-sm text-gray-500">
                    Bu hasta için henüz kayıtlı bir sonuç bulunmamaktadır.
                  </p>
                )}

                {!isLoadingResults && !resultsListError && patientResults.length > 0 && (
                  <ul className="space-y-2 text-xs sm:text-sm">
                    {patientResults.map((r: any) => (
                      <li
                        key={r.result_id}
                        className="border rounded-md px-3 py-2 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="font-medium">{r.title}</span>
              <span className="text-[11px] sm:text-xs text-gray-500">
                              {r.created_at
                                ? new Date(r.created_at).toLocaleString('tr-TR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Europe/Istanbul',
                                  })
                                : ''}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="!border !border-gray-300 text-[11px] sm:text-xs px-2 py-1"
                            onClick={() =>
                              setExpandedResultId(
                                expandedResultId === r.result_id ? null : r.result_id
                              )
                            }
                          >
                            {expandedResultId === r.result_id
                              ? 'Detayı gizle'
                              : 'Detayı gör'}
                          </Button>
                        </div>

                        {expandedResultId === r.result_id && r.details && (
                          <div className="mt-1 space-y-1">
                            <p className="text-[11px] sm:text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {r.details}
                            </p>

                            {r.files && r.files.length > 0 && (
                              <div className="pt-1 space-y-1">
                                <span className="text-[10px] sm:text-[11px] text-gray-500">
                                  Ekli Belgeler:
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                  {r.files.map((file: any) => {
                                    const isImage = file.mime_type?.startsWith('image/');
                                    const url = `http://localhost:3005${file.file_path}`;
                                    return (
                                      <a
                                        key={file.file_id}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="border rounded-md p-1 flex flex-col gap-1 hover:bg-gray-50"
                                      >
                                        {isImage ? (
                                          <img
                                            src={url}
                                            alt={file.original_name}
                                            className="w-full h-16 object-cover rounded"
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center h-16 bg-gray-50 text-[10px] sm:text-[11px] text-gray-600 rounded">
                                            PDF Belgesi
                                          </div>
                                        )}
                                        <span className="text-[9px] sm:text-[10px] text-gray-700 truncate">
                                          {file.original_name}
                                        </span>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Sonuç ekleme alanı */}
              <div className="border-t pt-3 space-y-3">
                {!isAddingResult && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => setIsAddingResult(true)}
                    >
                      Sonuç ekle
                    </Button>
                  </div>
                )}

                {isAddingResult && (
                  <form onSubmit={handleSaveResult} className="space-y-4">
                    {resultError && (
                      <p className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                        {resultError}
                      </p>
                    )}
                    {resultSuccess && (
                      <p className="text-xs sm:text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                        {resultSuccess}
                      </p>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="resultTitle" className="text-xs sm:text-sm">
                        Sonuç Başlığı
                      </Label>
                      <Input
                        id="resultTitle"
                        value={resultTitle}
                        onChange={(e) => setResultTitle(e.target.value)}
                        placeholder="Örn: Kan Tahlili Sonucu"
                        className="!border !border-gray-300 text-xs sm:text-sm h-9 sm:h-10"
                        maxLength={255}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resultDetails" className="text-xs sm:text-sm">
                        Sonuç Detayları
                      </Label>
                      <Textarea
                        id="resultDetails"
                        value={resultDetails}
                        onChange={(e) => setResultDetails(e.target.value)}
                        placeholder="Hastaya ait detaylı sonuç ve yorumlarınızı yazın..."
                        className="!border !border-gray-300 min-h-[140px] text-xs sm:text-sm"
                        required
                      />
                    </div>

                    {/* Dosya yükleme alanı */}
                    <div className="space-y-2">
                      <Label htmlFor="resultFiles" className="text-xs sm:text-sm">
                        Belgeler (PDF / Görsel)
                      </Label>

                      {/* Gizli native input, butonla tetikleniyor */}
                      <input
                        id="resultFiles"
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          setResultFiles(files);
                        }}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="!border !border-gray-300 text-[11px] sm:text-xs px-2 py-1"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        Belge seç
                      </Button>

                      {filePreviews.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[11px] sm:text-xs text-gray-500">Seçilen belgeler:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {filePreviews.map((preview, index) => (
                              <a
                                key={index}
                                href={preview.url}
                                target="_blank"
                                rel="noreferrer"
                                className="border rounded-md p-1 flex flex-col gap-1 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                title="Açmak için tıklayın"
                              >
                                {preview.type === 'image' ? (
                                  <img
                                    src={preview.url}
                                    alt={preview.name}
                                    className="w-full h-20 object-cover rounded"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-20 bg-gray-50 text-[11px] sm:text-xs text-gray-600 rounded">
                                    PDF
                                  </div>
                                )}
                                <span className="text-[10px] sm:text-[11px] text-gray-700 truncate">
                                  {preview.name}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-xs sm:text-sm"
                        onClick={() => {
                          setIsAddingResult(false);
                          setResultError(null);
                          setResultSuccess(null);
                        }}
                      >
                        İptal
                      </Button>
                      <Button
                        type="submit"
                        className="text-xs sm:text-sm"
                        disabled={isSavingResult}
                      >
                        {isSavingResult ? 'Kaydediliyor...' : 'Sonucu Kaydet'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Add Patient Form Component
const AddPatientForm: React.FC<{ 
  onSubmit: (patient: {
    patient_name: string;
    email: string;
    phone_number: string;
    birth_date: string;
    gender: string;
    address: string;
    blood_type: string;
    medical_history: string;
  }) => void;
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
    
    onSubmit({
      patient_name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone_number: `${formData.phoneCountry} ${formData.phone}`,
      birth_date: formData.birthDate,
      gender: formData.gender,
      address: formData.address,
      blood_type: formData.bloodType,
      medical_history: [
        formData.medicalHistory && formData.medicalHistory.trim() ? `Geçmiş: ${formData.medicalHistory}` : '',
        formData.allergies && formData.allergies.trim() ? `Alerjiler: ${formData.allergies}` : '',
        formData.medications && formData.medications.trim() ? `İlaçlar: ${formData.medications}` : ''
      ].filter(Boolean).join(', ')
    });
    
    // Formu temizle
    setFormData(initialFormData);
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {/* Ad Soyad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" >
        <div>
          <Label htmlFor="firstName" className="mb-2 block text-xs sm:text-sm">Ad</Label>
          <Input
            id="firstName"
            className="border border-gray-300 rounded-md text-xs sm:text-sm h-9 sm:h-10"
            type="text"
            placeholder="Adınız"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: filterNameInput(e.target.value)})}
            required
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.firstName}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName" className="mb-2 block text-xs sm:text-sm">Soyad</Label>
          <Input
            id="lastName"
            className={`border ${errors.lastName ? 'border-red-500' : 'border-border'} text-xs sm:text-sm h-9 sm:h-10`}
            type="text" 
            placeholder="Soyadınız"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: filterNameInput(e.target.value)})}
            required
          />
          {errors.lastName && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email" className="mb-2 block text-xs sm:text-sm">E-posta Adresi</Label>
        <Input
          id="email"
          className={`border ${errors.email ? 'border-red-500' : 'border-border'} text-xs sm:text-sm h-9 sm:h-10`}
          type="email"
          placeholder="ornek@email.com"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        {errors.email && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email}</p>
        )}
      </div>

      {/* Telefon ve Kan Grubu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="phone" className="mb-2 block text-xs sm:text-sm">Telefon</Label>
          <div className="flex gap-2">
            <div className="relative">
              <select
                id="phoneCountry"
                value={formData.phoneCountry}
                onChange={(e) => setFormData({...formData, phoneCountry: e.target.value})}
                className="appearance-none outline-none h-9 sm:h-10 border border-border focus:border-slate-800 bg-white rounded-md px-2 pr-6 min-w-[70px] sm:min-w-[80px] font-medium text-xs sm:text-base text-gray-900"
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
              className={`flex-1 border ${errors.phone ? 'border-red-500' : 'border-border'} text-xs sm:text-sm h-9 sm:h-10`}
              maxLength={11}
              required
            />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone}</p>
          )}
        </div>
        <div>
          <Label htmlFor="bloodType" className="mb-2 block text-xs sm:text-sm">Kan Grubu</Label>
          <Select value={formData.bloodType} onValueChange={(value) => setFormData({...formData, bloodType: value})}>
            <SelectTrigger className={`border ${errors.bloodType ? 'border-red-500' : 'border-border'} h-9 sm:h-10 text-xs sm:text-sm`}>
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
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.bloodType}</p>
          )}
        </div>
      </div>

      {/* Doğum Tarihi ve Cinsiyet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="birthDate" className="mb-2 block text-xs sm:text-sm">Doğum Tarihi</Label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
            className={`border ${errors.birthDate ? 'border-red-500' : 'border-border'} text-xs sm:text-sm h-9 sm:h-10`}
            required
          />
          {errors.birthDate && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.birthDate}</p>
          )}
        </div>
        <div>
          <Label htmlFor="gender" className="mb-2 block text-xs sm:text-sm">Cinsiyet</Label>
          <div className="relative">
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              className={`appearance-none outline-none h-9 sm:h-10 border focus:border-slate-800 bg-white rounded-md px-2 sm:px-3 pr-6 sm:pr-8 w-full text-xs sm:text-base text-gray-900 ${errors.gender ? 'border-red-500' : 'border-border'}`}
              required
            >
              <option value="">Seçiniz</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
              <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.gender && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.gender}</p>
          )}
        </div>
      </div>

      {/* Adres */}
      <div>
        <Label htmlFor="address" className="mb-2 block text-xs sm:text-sm">Adres</Label>
        <Textarea
          id="address"
          placeholder="Adresiniz"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          maxLength={200}
          className={`border break-words overflow-wrap-anywhere h-24 sm:h-32 text-xs sm:text-sm ${errors.address ? 'border-red-500' : 'border-border'}`}
          style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
          required
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {formData.address.length}/200 karakter
        </div>
        {errors.address && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.address}</p>
        )}
      </div>

            {/* Tıbbi Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="medicalHistory" className="mb-2 block text-xs sm:text-sm">Tıbbi Geçmiş</Label>
          <Textarea
            id="medicalHistory"
            maxLength={100}
            value={formData.medicalHistory}
            onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
            placeholder="Hipertansiyon, Diyabet"
            className="border border-border break-words overflow-wrap-anywhere h-24 sm:h-32 text-xs sm:text-sm"
            style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
           {formData.medicalHistory.length}/100 karakter
         </div>
        </div>
        <div>
          <Label htmlFor="allergies" className="mb-2 block text-xs sm:text-sm">Alerjiler</Label>
          <Textarea
            id="allergies"
            maxLength={100}
            value={formData.allergies}
            onChange={(e) => setFormData({...formData, allergies: e.target.value})}
            placeholder="Penisilin, Lateks"
            className="border border-border break-words overflow-wrap-anywhere h-24 sm:h-32 text-xs sm:text-sm"
            style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
           {formData.allergies.length}/100 karakter
         </div>
        </div>
        <div>
          <Label htmlFor="medications" className="mb-2 block text-xs sm:text-sm">Mevcut İlaçlar </Label>
          <Textarea
            id="medications"
            maxLength={100}
            value={formData.medications}
            onChange={(e) => setFormData({...formData, medications: e.target.value})}
            placeholder="Metformin, Aspirin"
            className="border border-border break-words overflow-wrap-anywhere h-24 sm:h-32 text-xs sm:text-sm"
            style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
           {formData.medications.length}/100 karakter
         </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="submit" className="text-xs sm:text-sm w-full sm:w-auto">Hasta Ekle</Button>
      </div>
    </form>
  );
};

export default PatientManagement;