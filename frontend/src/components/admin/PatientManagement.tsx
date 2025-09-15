import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
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
    setFormData({
      full_name: patient.full_name,
      email: patient.email,
      phone_number: patient.phone_number || '',
      health_history: patient.health_history || '',
      birth_date: patient.birth_date || '',
      gender: patient.gender || undefined,
      address: patient.address || '',
      blood_type: patient.blood_type || undefined,
      national_id: patient.national_id || '',
    });
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

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();

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
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone_number">Telefon</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
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
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Doğum Tarihi</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gender">Cinsiyet</Label>
                <select
                  id="gender"
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="health_history">Sağlık Geçmişi</Label>
              <textarea
                id="health_history"
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                value={formData.health_history}
                onChange={(e) => setFormData({ ...formData, health_history: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                resetFormData();
              }}>
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
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Hasta
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date().toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(patient.member_since || '').toLocaleDateString('tr-TR')}
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
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
                />
              </div>
              <div>
                <Label htmlFor="edit-birth-date">Doğum Tarihi</Label>
                <Input
                  id="edit-birth-date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Cinsiyet</Label>
                <select
                  id="edit-gender"
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-health-history">Sağlık Geçmişi</Label>
              <textarea
                id="edit-health-history"
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                value={formData.health_history}
                onChange={(e) => setFormData({ ...formData, health_history: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                resetFormData();
              }}>
                İptal
              </Button>
              <Button type="submit">
                Güncelle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientManagement;