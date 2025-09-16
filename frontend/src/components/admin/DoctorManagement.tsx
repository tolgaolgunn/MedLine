import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'react-toastify';

interface Doctor {
  user_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  specialty?: string;
  license_number?: string;
  experience_years?: number;
  biography?: string;
  city?: string;
  district?: string;
  hospital_name?: string;
  member_since?: string;
  is_approved?: boolean;
  approved_by_admin?: boolean;
}

interface DoctorFormData {
  name: string;
  email: string;
  password: string;
  specialization: string;
  phoneNumber: string;
  city: string;
  district: string;
  hospital_name: string;
  experience_years: string;
  license_number: string;
  biography: string;
}

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<DoctorFormData>({
    name: '',
    email: '',
    password: '',
    specialization: '',
    phoneNumber: '',
    city: '',
    district: '',
    hospital_name: '',
    experience_years: '',
    license_number: '',
    biography: '',
  });
  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    email: '',
    password: '',
    specialization: '',
    phoneNumber: '',
    city: '',
    district: '',
    hospital_name: '',
    experience_years: '',
    license_number: '',
    biography: '',
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/admin/doctors/all');
      if (response.data && response.data.data) {
        setDoctors(response.data.data);
      } else {
        setDoctors([]);
        toast.error('Doktor verisi bulunamadı');
      }
    } catch (error) {
      setDoctors([]);
      toast.error('Doktorları getirirken bir hata oluştu');
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Tüm alanların doldurulup doldurulmadığını kontrol et
    if (!formData.name.trim()) {
      toast.error('Ad Soyad alanı boş bırakılamaz');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('E-posta alanı boş bırakılamaz');
      return;
    }

    if (!formData.password.trim()) {
      toast.error('Şifre alanı boş bırakılamaz');
      return;
    }

    if (!formData.specialization.trim()) {
      toast.error('Uzmanlık alanı boş bırakılamaz');
      return;
    }

    if (!formData.license_number.trim()) {
      toast.error('Lisans numarası alanı boş bırakılamaz');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast.error('Telefon alanı boş bırakılamaz');
      return;
    }

    if (!formData.city.trim()) {
      toast.error('Şehir alanı boş bırakılamaz');
      return;
    }

    if (!formData.district.trim()) {
      toast.error('İlçe alanı boş bırakılamaz');
      return;
    }

    if (!formData.hospital_name.trim()) {
      toast.error('Hastane adı alanı boş bırakılamaz');
      return;
    }

    if (!formData.biography.trim()) {
      toast.error('Biyografi alanı boş bırakılamaz');
      return;
    }

    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Geçerli bir e-posta adresi giriniz');
      return;
    }

    // Şifre validasyonu
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

    // Telefon numarası validasyonu
    if (formData.phoneNumber.length !== 10) {
      toast.error('Telefon numarası 10 haneli olmalıdır');
      return;
    }
    if (!/^\d+$/.test(formData.phoneNumber)) {
      toast.error('Telefon numarası sadece rakamlardan oluşmalıdır');
      return;
    }

    // Lisans numarası format kontrolü
    const licenseNumberRegex = /^[A-Z]{3}\d{7}$/;
    if (!licenseNumberRegex.test(formData.license_number)) {
      toast.error('Lisans numarası geçerli formatta değil. Örnek format: ABC1234567');
      return;
    }

    try {
      const requestData = {
      name: formData.name.trim(), // Backend name alanını bekliyor
      email: formData.email.trim(),
      password: formData.password,
      phoneNumber: formData.phoneNumber?.trim(), // Backend phoneNumber alanını bekliyor
      specialization: formData.specialization?.trim(), // Backend specialization alanını bekliyor
      license_number: formData.license_number.trim(),
      experience_years: parseInt(formData.experience_years) || 0,
      biography: formData.biography?.trim(),
      city: formData.city?.trim(),
      district: formData.district?.trim(),
      hospital_name: formData.hospital_name?.trim()
    };

      await axios.post('/api/admin/doctors/add', requestData);
      toast.success('Doktor başarıyla eklendi');
      setIsAddDialogOpen(false);
      resetFormData();
      fetchDoctors();
    } catch (error: any) {
      console.error('Error details:', error.response?.data);
      if (error.response?.data?.code === '23505' && error.response?.data?.constraint === 'doctor_profiles_license_number_key') {
        toast.error('Bu lisans numarası zaten kullanımda. Lütfen benzersiz bir lisans numarası girin.');
      } else {
        toast.error(error.response?.data?.message || 'Doktor eklerken bir hata oluştu');
      }
    }
  };

 const handleUpdateDoctor = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedDoctor) return;

  // Form validasyonu
  if (!formData.name.trim()) {
    toast.error('İsim alanı boş bırakılamaz');
    return;
  }

  if (!formData.email.trim()) {
    toast.error('E-posta alanı boş bırakılamaz');
    return;
  }

  // E-posta format kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    toast.error('Geçerli bir e-posta adresi giriniz');
    return;
  }

  // Lisans numarası format kontrolü
  if (formData.license_number) {
    const licenseNumberRegex = /^[A-Z]{3}\d{7}$/;
    if (!licenseNumberRegex.test(formData.license_number)) {
      toast.error('Lisans numarası geçerli formatta değil. Örnek format: ABC1234567');
      return;
    }
  }

  try {
    // Backend'in beklediği formata uygun veri yapısı
    const requestData = {
      name: formData.name.trim(), // Backend name alanını bekliyor
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber?.trim(), // Backend phoneNumber alanını bekliyor
      specialization: formData.specialization?.trim(), // Backend specialization alanını bekliyor
      license_number: formData.license_number?.trim(),
      experience_years: parseInt(formData.experience_years) || 0,
      biography: formData.biography?.trim(),
      city: formData.city?.trim(),
      district: formData.district?.trim(),
      hospital_name: formData.hospital_name?.trim()
    };

    await axios.put(`/api/admin/doctors/${selectedDoctor.user_id}`, requestData);
    toast.success('Doktor bilgileri güncellendi');
    setIsEditDialogOpen(false);
    resetFormData();
    fetchDoctors();
  } catch (error: any) {
    console.error('Error details:', error.response?.data);
    toast.error(error.response?.data?.message || 'Doktor güncellenirken bir hata oluştu');
  }
};

  const handleDeleteDoctor = async (id: string) => {
    if (!window.confirm('Bu doktoru silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`/api/admin/doctors/${id}`);
      toast.success('Doktor başarıyla silindi');
      fetchDoctors();
    } catch (error) {
      toast.error('Doktor silinirken bir hata oluştu');
    }
  };

  const openEditDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    const initialData = {
      name: doctor.full_name || '',
      email: doctor.email || '',
      password: '',
      specialization: doctor.specialty || '',
      phoneNumber: doctor.phone_number || '',
      city: doctor.city || '',
      district: doctor.district || '',
      hospital_name: doctor.hospital_name || '',
      experience_years: doctor.experience_years?.toString() || '',
      license_number: doctor.license_number || '',
      biography: doctor.biography || '',
    };
    setFormData(initialData);
    setOriginalFormData(initialData);
    setIsEditDialogOpen(true);
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      specialization: '',
      phoneNumber: '',
      city: '',
      district: '',
      hospital_name: '',
      experience_years: '',
      license_number: '',
      biography: '',
    });
    setSelectedDoctor(null);
  };

  // Check if any form field has been filled
  const isFormDirty = () => {
    return formData.name.trim() !== '' ||
           formData.email.trim() !== '' ||
           formData.password.trim() !== '' ||
           formData.specialization.trim() !== '' ||
           formData.phoneNumber.trim() !== '' ||
           formData.city.trim() !== '' ||
           formData.district.trim() !== '' ||
           formData.hospital_name.trim() !== '' ||
           formData.experience_years.trim() !== '' ||
           formData.license_number.trim() !== '' ||
           formData.biography.trim() !== '';
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
    return formData.name !== originalFormData.name ||
           formData.email !== originalFormData.email ||
           formData.specialization !== originalFormData.specialization ||
           formData.phoneNumber !== originalFormData.phoneNumber ||
           formData.city !== originalFormData.city ||
           formData.district !== originalFormData.district ||
           formData.hospital_name !== originalFormData.hospital_name ||
           formData.experience_years !== originalFormData.experience_years ||
           formData.license_number !== originalFormData.license_number ||
           formData.biography !== originalFormData.biography;
  };

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Doktor Yönetimi</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Yeni Doktor Ekle
        </Button>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Doktor ara..."
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
                Hastane Bilgileri
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
            {filteredDoctors.map((doctor) => (
              <tr key={doctor.user_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {doctor.full_name}
                      </div>
                      {doctor.specialty && (
                        <div className="text-sm text-gray-500">
                          {doctor.specialty}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{doctor.email}</div>
                  {doctor.phone_number && (
                    <div className="text-sm text-gray-500">{doctor.phone_number}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {doctor.hospital_name || 'Belirtilmemiş'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {doctor.city && doctor.district ? `${doctor.city}/${doctor.district}` : 'Konum belirtilmemiş'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date().toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(doctor.member_since || '').toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(doctor)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteDoctor(doctor.user_id)}
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

      {/* Add Doctor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Doktor Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDoctor} className="space-y-4">
            <div>
              <Label htmlFor="name">Ad Soyad</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <Label htmlFor="specialization">Uzmanlık</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <Label htmlFor="license_number">Lisans Numarası</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="ABC1234567"
                required
              />
            </div>
            <div>
              <Label htmlFor="experience_years">Deneyim (Yıl)</Label>
              <Input
                id="experience_years"
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Telefon</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setFormData({ ...formData, phoneNumber: value });
                }}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                maxLength={10}
                placeholder="Telefon numarası (10 haneli)"
                required
              />
            </div>
            <div>
              <Label htmlFor="city">Şehir</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <Label htmlFor="district">İlçe</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <Label htmlFor="hospital_name">Hastane Adı</Label>
              <Input
                id="hospital_name"
                value={formData.hospital_name}
                onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <Label htmlFor="biography">Biyografi</Label>
              <Textarea
                id="biography"
                value={formData.biography}
                onChange={(e) => setFormData({ ...formData, biography: e.target.value.slice(0, 500) })}
                placeholder="Doktorun özgeçmişi, uzmanlık alanları ve diğer önemli bilgiler..."
                className="h-32 border-2 border-gray-300 focus:border-gray-400 focus:outline-none"
                maxLength={500}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.biography.length}/500 karakter
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                İptal
              </Button>
              <Button type="submit">
                Ekle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Doktor Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateDoctor} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Ad Soyad</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <Label htmlFor="edit-specialization">Uzmanlık</Label>
              <Input
                id="edit-specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-license_number">Lisans Numarası</Label>
              <Input
                id="edit-license_number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="ABC1234567"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-experience_years">Deneyim (Yıl)</Label>
              <Input
                id="edit-experience_years"
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-phoneNumber">Telefon</Label>
              <Input
                id="edit-phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-city">Şehir</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-district">İlçe</Label>
              <Input
                id="edit-district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-hospital_name">Hastane Adı</Label>
              <Input
                id="edit-hospital_name"
                value={formData.hospital_name}
                onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-biography">Biyografi</Label>
              <Textarea
                id="edit-biography"
                value={formData.biography}
                onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                placeholder="Doktorun özgeçmişi, uzmanlık alanları ve diğer önemli bilgiler..."
                className="h-32"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!isEditFormDirty()}>
              Güncelle
            </Button>
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
    </div>
  );
};

export default DoctorManagement;