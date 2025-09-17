import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'react-toastify';

interface Patient {
  user_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  health_history?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | '0+' | '0-';
  national_id?: string;
  member_since?: string;
  last_login?: string;
}

interface PatientFormData {
  full_name: string;
  email: string;
  password?: string;
  phone_number: string;
  health_history: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | '0+' | '0-';
  national_id?: string;
}

const PatientManagement = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showEditExitConfirmModal, setShowEditExitConfirmModal] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<PatientFormData>({
    full_name: '',
    email: '',
    phone_number: '',
    health_history: '',
    password: '',
    birth_date: '',
    gender: undefined,
    address: '',
    blood_type: undefined,
    national_id: ''
  });
  const [formData, setFormData] = useState<PatientFormData>({
    full_name: '',
    email: '',
    phone_number: '',
    health_history: '',
    password: '',
    birth_date: '',
    gender: undefined,
    address: '',
    blood_type: undefined,
    national_id: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/admin/patients/all');
      if (response.data && response.data.data) {
        setPatients(response.data.data);
      } else {
        setPatients([]);
        toast.error('Hasta verisi bulunamadı');
      }
    } catch (error) {
      setPatients([]);
      toast.error('Hastaları getirirken bir hata oluştu');
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Geçerli bir e-posta adresi giriniz');
      return;
    }

    // TC Kimlik numarası validasyonu
    if (formData.national_id) {
      if (formData.national_id.length !== 11) {
        toast.error('TC Kimlik numarası 11 haneli olmalıdır');
        return;
      }
      if (!/^\d+$/.test(formData.national_id)) {
        toast.error('TC Kimlik numarası sadece rakamlardan oluşmalıdır');
        return;
      }
    }

    // Telefon numarası validasyonu
    if (formData.phone_number) {
      if (formData.phone_number.length !== 10) {
        toast.error('Telefon numarası 10 haneli olmalıdır');
        return;
      }
      if (!/^\d+$/.test(formData.phone_number)) {
        toast.error('Telefon numarası sadece rakamlardan oluşmalıdır');
        return;
      }
    }

    // Duplicate kontrolü - TC Kimlik No (excluding current patient)
    if (formData.national_id) {
      const existingPatientByTC = patients.find(patient => 
        patient.national_id === formData.national_id && patient.user_id !== selectedPatient.user_id
      );
      if (existingPatientByTC) {
        toast.error('Bu TC Kimlik numarası ile zaten kayıtlı bir hasta bulunmaktadır');
        return;
      }
    }

    // Duplicate kontrolü - Telefon numarası (excluding current patient)
    if (formData.phone_number) {
      const existingPatientByPhone = patients.find(patient => 
        patient.phone_number === formData.phone_number && patient.user_id !== selectedPatient.user_id
      );
      if (existingPatientByPhone) {
        toast.error('Bu telefon numarası ile zaten kayıtlı bir hasta bulunmaktadır');
        return;
      }
    }

    // Duplicate kontrolü - E-posta (excluding current patient)
    const existingPatientByEmail = patients.find(patient => 
      patient.email.toLowerCase() === formData.email.toLowerCase() && patient.user_id !== selectedPatient.user_id
    );
    if (existingPatientByEmail) {
      toast.error('Bu e-posta adresi ile zaten kayıtlı bir hasta bulunmaktadır');
      return;
    }

    try {
      await axios.put(`/api/admin/patients/${selectedPatient.user_id}`, formData);
      toast.success('Hasta bilgileri güncellendi');
      setIsEditDialogOpen(false);
      resetFormData();
      fetchPatients();
    } catch (error) {
      toast.error('Hasta güncellenirken bir hata oluştu');
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm('Bu hastayı silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`/api/admin/patients/${id}`);
      toast.success('Hasta başarıyla silindi');
      fetchPatients();
    } catch (error) {
      toast.error('Hasta silinirken bir hata oluştu');
    }
  };

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    const initialData = {
      full_name: patient.full_name,
      email: patient.email,
      phone_number: patient.phone_number || '',
      health_history: patient.health_history || '',
      birth_date: patient.birth_date || '',
      gender: patient.gender || undefined,
      address: patient.address || '',
      blood_type: patient.blood_type || undefined,
      national_id: patient.national_id || '',
    };
    setFormData(initialData);
    setOriginalFormData(initialData);
    setIsEditDialogOpen(true);
  };

  const resetFormData = () => {
    setFormData({
      full_name: '',
      email: '',
      phone_number: '',
      health_history: '',
      password: '',
      birth_date: '',
      gender: undefined,
      address: '',
      blood_type: undefined,
      national_id: ''
    });
    setSelectedPatient(null);
  };

  // Check if any form field has been filled
  const isFormDirty = () => {
    return formData.full_name.trim() !== '' ||
           formData.email.trim() !== '' ||
           formData.phone_number.trim() !== '' ||
           formData.health_history.trim() !== '' ||
           (formData.password && formData.password.trim() !== '') ||
           formData.birth_date !== '' ||
           formData.gender !== undefined ||
           (formData.address && formData.address.trim() !== '') ||
           formData.blood_type !== undefined ||
           (formData.national_id && formData.national_id.trim() !== '');
  };

  // Handle dialog close with confirmation
  const handleDialogClose = () => {
    if (isFormDirty()) {
      setShowExitConfirmModal(true);
    } else {
      setIsAddDialogOpen(false);
      resetFormData();
    }
  };

  // Confirm exit and close dialog
  const confirmExit = () => {
    setIsAddDialogOpen(false);
    setShowExitConfirmModal(false);
    resetFormData();
  };

  // Cancel exit and return to form
  const cancelExit = () => {
    setShowExitConfirmModal(false);
  };

  // Check if edit form has been modified
  const isEditFormDirty = () => {
    return formData.full_name !== originalFormData.full_name ||
           formData.email !== originalFormData.email ||
           formData.phone_number !== originalFormData.phone_number ||
           formData.health_history !== originalFormData.health_history ||
           formData.birth_date !== originalFormData.birth_date ||
           formData.gender !== originalFormData.gender ||
           formData.address !== originalFormData.address ||
           formData.blood_type !== originalFormData.blood_type ||
           formData.national_id !== originalFormData.national_id;
  };

  // Handle edit dialog close with confirmation
  const handleEditDialogClose = () => {
    if (isEditFormDirty()) {
      setShowEditExitConfirmModal(true);
    } else {
      setIsEditDialogOpen(false);
      resetFormData();
    }
  };

  // Confirm edit exit and close dialog
  const confirmEditExit = () => {
    setIsEditDialogOpen(false);
    setShowEditExitConfirmModal(false);
    resetFormData();
  };

  // Cancel edit exit and return to form
  const cancelEditExit = () => {
    setShowEditExitConfirmModal(false);
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Geçerli bir e-posta adresi giriniz');
      return;
    }

    // Şifre validasyonu
    if (formData.password) {
      if (formData.password.length < 8) {
        toast.error('Şifre en az 8 karakter uzunluğunda olmalıdır');
        return;
      }
      if (!/[A-Z]/.test(formData.password)) {
        toast.error('Şifre en az 1 büyük harf içermelidir');
        return;
      }
      if (!/[a-z]/.test(formData.password)) {
        toast.error('Şifre en az 1 küçük harf içermelidir');
        return;
      }
      if (!/\d/.test(formData.password)) {
        toast.error('Şifre en az 1 sayı içermelidir');
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        toast.error('Şifre en az 1 noktalama işareti içermelidir');
        return;
      }
    }

    // TC Kimlik numarası validasyonu
    if (formData.national_id) {
      if (formData.national_id.length !== 11) {
        toast.error('TC Kimlik numarası 11 haneli olmalıdır');
        return;
      }
      if (!/^\d+$/.test(formData.national_id)) {
        toast.error('TC Kimlik numarası sadece rakamlardan oluşmalıdır');
        return;
      }
    }

    // Telefon numarası validasyonu
    if (formData.phone_number) {
      if (formData.phone_number.length !== 10) {
        toast.error('Telefon numarası 10 haneli olmalıdır');
        return;
      }
      if (!/^\d+$/.test(formData.phone_number)) {
        toast.error('Telefon numarası sadece rakamlardan oluşmalıdır');
        return;
      }
    }

    // Duplicate kontrolü - TC Kimlik No
    if (formData.national_id) {
      const existingPatientByTC = patients.find(patient => 
        patient.national_id === formData.national_id
      );
      if (existingPatientByTC) {
        toast.error('Bu TC Kimlik numarası ile zaten kayıtlı bir hasta bulunmaktadır');
        return;
      }
    }

    // Duplicate kontrolü - Telefon numarası
    if (formData.phone_number) {
      const existingPatientByPhone = patients.find(patient => 
        patient.phone_number === formData.phone_number
      );
      if (existingPatientByPhone) {
        toast.error('Bu telefon numarası ile zaten kayıtlı bir hasta bulunmaktadır');
        return;
      }
    }

    // Duplicate kontrolü - E-posta
    const existingPatientByEmail = patients.find(patient => 
      patient.email.toLowerCase() === formData.email.toLowerCase()
    );
    if (existingPatientByEmail) {
      toast.error('Bu e-posta adresi ile zaten kayıtlı bir hasta bulunmaktadır');
      return;
    }
    
    try {
      await axios.post('/api/admin/patients', formData);
      toast.success('Yeni hasta başarıyla eklendi');
      setIsAddDialogOpen(false);
      resetFormData();
      fetchPatients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Hasta eklenirken bir hata oluştu');
    }
  };

  const filteredPatients = patients.filter((patient: Patient) =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hasta Yönetimi</h1>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#0F1729] hover:bg-[#1a2542]">
          Yeni Hasta Ekle
        </Button>
      </div>

      {/* Yeni Hasta Ekleme Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Hasta Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Ad Soyad</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone_number">Telefon</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormData({ ...formData, phone_number: value });
                  }}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  maxLength={10}
                  placeholder="Telefon numarası (10 haneli)"
                />
              </div>
              <div>
                <Label htmlFor="national_id">TC Kimlik No</Label>
                <Input
                  id="national_id"
                  value={formData.national_id}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                    setFormData({ ...formData, national_id: value });
                  }}
                  maxLength={11}
                  placeholder="11 haneli TC Kimlik No"
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Doğum Tarihi</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <Label htmlFor="gender">Cinsiyet</Label>
                <select
                  id="gender"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-gray-400 focus:outline-none"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                >
                  <option value="">Seçiniz</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              <div>
                <Label htmlFor="blood_type">Kan Grubu</Label>
                <select
                  id="blood_type"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-gray-400 focus:outline-none"
                  value={formData.blood_type}
                  onChange={(e) => setFormData({ ...formData, blood_type: e.target.value as PatientFormData['blood_type'] })}
                >
                  <option value="">Seçiniz</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="0+">0+</option>
                  <option value="0-">0-</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value.slice(0, 200) })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                maxLength={200}
                placeholder="Adres bilgisi (maksimum 200 karakter)"
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.address?.length || 0}/200 karakter
              </div>
            </div>
            <div>
              <Label htmlFor="health_history">Sağlık Geçmişi</Label>
              <textarea
                id="health_history"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-gray-400 focus:outline-none"
                rows={3}
                value={formData.health_history}
                onChange={(e) => setFormData({ ...formData, health_history: e.target.value.slice(0, 500) })}
                maxLength={500}
                placeholder="Sağlık geçmişi bilgileri (maksimum 500 karakter)"
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.health_history?.length || 0}/500 karakter
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                İptal
              </Button>
              <Button type="submit">
                Kaydet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Hasta ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kullanıcı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                E-posta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Son Giriş
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kayıt Tarihi
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <tr key={patient.user_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {patient.full_name}
                      </div>
                      {patient.birth_date && (
                        <div className="text-sm text-gray-500">
                          Doğum Tarihi: {new Date(patient.birth_date).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{patient.email}</div>
                  {patient.phone_number && (
                    <div className="text-sm text-gray-500">{patient.phone_number}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-black text-white">
                    Hasta
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.last_login ? new Date(patient.last_login).toLocaleDateString('tr-TR') : 'Bilgi yok'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.member_since ? new Date(patient.member_since).toLocaleDateString('tr-TR') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(patient)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeletePatient(patient.user_id)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hasta Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Ad Soyad</Label>
                <Input
                  id="edit-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">E-posta</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone_number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormData({ ...formData, phone_number: value });
                  }}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  maxLength={10}
                  placeholder="Telefon numarası (10 haneli)"
                />
              </div>
              <div>
                <Label htmlFor="edit-national-id">TC Kimlik No</Label>
                <Input
                  id="edit-national-id"
                  value={formData.national_id}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                    setFormData({ ...formData, national_id: value });
                  }}
                  maxLength={11}
                  placeholder="11 haneli TC Kimlik No"
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <Label htmlFor="edit-birth-date">Doğum Tarihi</Label>
                <Input
                  id="edit-birth-date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Cinsiyet</Label>
                <select
                  id="edit-gender"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-gray-400 focus:outline-none"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                >
                  <option value="">Seçiniz</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-blood-type">Kan Grubu</Label>
                <select
                  id="edit-blood-type"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-gray-400 focus:outline-none"
                  value={formData.blood_type}
                  onChange={(e) => setFormData({ ...formData, blood_type: e.target.value as PatientFormData['blood_type'] })}
                >
                  <option value="">Seçiniz</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="0+">0+</option>
                  <option value="0-">0-</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address">Adres</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value.slice(0, 200) })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                maxLength={200}
                placeholder="Adres bilgisi (maksimum 200 karakter)"
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.address?.length || 0}/200 karakter
              </div>
            </div>
            <div>
              <Label htmlFor="edit-health-history">Sağlık Geçmişi</Label>
              <textarea
                id="edit-health-history"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-gray-400 focus:outline-none"
                rows={3}
                value={formData.health_history}
                onChange={(e) => setFormData({ ...formData, health_history: e.target.value.slice(0, 500) })}
                maxLength={500}
                placeholder="Sağlık geçmişi bilgileri (maksimum 500 karakter)"
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.health_history?.length || 0}/500 karakter
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={handleEditDialogClose}>
                İptal
              </Button>
              <Button type="submit" disabled={!isEditFormDirty()}>
                Güncelle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Modal */}
      <Dialog open={showExitConfirmModal} onOpenChange={setShowExitConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Çıkış Onayı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Formda doldurulmuş alanlar var. Çıkmak istediğinizden emin misiniz? 
              Girilen bilgiler kaybolacaktır.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={cancelExit}
                className="border-2 border-gray-300"
              >
                İptal
              </Button>
              <Button 
                onClick={confirmExit}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Çık
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Exit Confirmation Modal */}
      <Dialog open={showEditExitConfirmModal} onOpenChange={setShowEditExitConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Çıkış Onayı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Hasta bilgilerinde değişiklik yapıldı. Çıkmak istediğinizden emin misiniz? 
              Yapılan değişiklikler kaybolacaktır.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={cancelEditExit}
                className="border-2 border-gray-300"
              >
                İptal
              </Button>
              <Button 
                onClick={confirmEditExit}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Çık
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientManagement;