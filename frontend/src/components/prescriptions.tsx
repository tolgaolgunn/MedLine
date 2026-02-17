import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PageHeader } from "./ui/PageHeader";
import { Search, Download, Calendar, User, Stethoscope, MapPin, Loader2, AlertCircle } from "lucide-react";
import axios from 'axios';
import { toast } from 'react-toastify';

interface Medicine {
  item_id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  usage_instructions?: string;
  side_effects?: string;
  quantity: number;
}

interface Prescription {
  prescription_id: number;
  prescription_code?: string;
  diagnosis?: string;
  general_instructions?: string;
  usage_instructions?: string;
  next_visit_date?: string;
  valid_until_date?: string;
  prescription_status: 'active' | 'used' | 'expired' | 'cancelled';
  prescription_date: string;
  doctor_name: string;
  doctor_specialty: string;
  hospital_name?: string;
  city?: string;
  district?: string;
  appointment_date?: string;
  appointment_type?: 'online' | 'face_to_face';
  appointment_status?: string;
  medicines: Medicine[];
}

interface PrescriptionDetail extends Prescription {
  doctor: {
    name: string;
    specialty: string;
    license_number?: string;
    hospital_name?: string;
    city?: string;
    district?: string;
    experience_years?: number;
  };
  patient: {
    name: string;
    birth_date?: string;
    gender?: string;
  };
  appointment: {
    date?: string;
    type?: string;
  };
}

export function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selected, setSelected] = useState<PrescriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState<number | null>(null); // Hangi reçetenin detayı yükleniyor
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL) + '/api',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user data
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Oturum bulunamadı');
      }

      const userData = JSON.parse(userStr);
      if (!userData?.user_id) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      // Create API instance with proper headers
      const api = axios.create({
        baseURL: (import.meta.env.VITE_API_URL) + '/api',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        timeout: 10000 // 10 seconds timeout
      });

      const response = await api.get(`/patient/prescriptions/${userData.user_id}`);

      if (response.data && response.data.success) {
        setPrescriptions(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Reçeteler yüklenemedi');
      }

    } catch (err: any) {
      console.error('Reçete yükleme hatası:', err);

      if (err.response) {
        setError(err.response.data?.message || 'Sunucu hatası oluştu');
      } else if (err.request) {
        // Request made but no response
        setError('Sunucuya ulaşılamıyor');
      } else {
        // Other errors
        setError(err.message || 'Reçeteler yüklenirken bir hata oluştu');
      }

      toast.error(err.response?.data?.message || 'Reçeteler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Reçete detayını yükle
  const fetchPrescriptionDetail = async (prescriptionId: number) => {
    try {
      setDetailLoading(prescriptionId); // Hangi reçetenin yüklendiğini kaydet
      setError(null);

      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const userId = userData?.user_id;

      if (!userId) {
        setError('Kullanıcı bilgisi bulunamadı');
        setDetailLoading(null);
        return;
      }

      const response = await api.get(`/patient/prescriptions/${userId}/${prescriptionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setSelected(response.data.data);
      } else {
        setError('Reçete detayı yüklenirken bir hata oluştu');
      }
    } catch (err: any) {
      console.error('Reçete detay yükleme hatası:', err);
      setError(err.response?.data?.message || 'Reçete detayı yüklenirken bir hata oluştu');
    } finally {
      setDetailLoading(null);
    }
  };

  const markAsUsed = async (prescriptionId: number) => {
    try {
      setLoading(true);

      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const userId = userData?.user_id;

      if (!userId) {
        toast.error('Kullanıcı bilgisi bulunamadı');
        return;
      }

      const response = await api.put(`/patient/prescriptions/${prescriptionId}/status`, {
        status: 'used'
      });

      if (response.data.success) {
        // Update prescriptions list with correct status
        setPrescriptions(prevPrescriptions =>
          prevPrescriptions.map(p =>
            p.prescription_id === prescriptionId
              ? { ...p, prescription_status: 'used' }
              : p
          )
        );

        // Update modal if open
        if (selected && selected.prescription_id === prescriptionId) {
          setSelected(prev =>
            prev ? { ...prev, prescription_status: 'used' } : null
          );
        }

        // Close modal after status update
        setSelected(null);

        toast.success('Reçete kullanıldı olarak işaretlendi');

        await fetchPrescriptions();
      } else {
        throw new Error(response.data.message || 'Reçete durumu güncellenemedi');
      }
    } catch (error: any) {
      console.error('Reçete durumu güncellenirken hata:', error);
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Reçete durumu güncellenirken bir hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleDownload = (prescription: Prescription) => {
    // PDF oluşturma ve indirme işlemi burada implement edilebilir
    console.log("Reçete indiriliyor:", prescription.prescription_code);

    // Basit bir metin dosyası indirme örneği
    const content = `
REÇETE DETAYI
=============
Reçete No: ${prescription.prescription_code || prescription.prescription_id}
Doktor: ${prescription.doctor_name}
Uzmanlık: ${prescription.doctor_specialty}
Hastane: ${prescription.hospital_name || 'Belirtilmemiş'}
Tarih: ${new Date(prescription.prescription_date).toLocaleDateString('tr-TR')}
Teşhis: ${prescription.diagnosis || 'Belirtilmemiş'}

İLAÇLAR:
${prescription.medicines.map(m =>
      `- ${m.medicine_name} ${m.dosage} - ${m.frequency} (${m.duration})`
    ).join('\n')}

GENEL TALİMATLAR:
${prescription.general_instructions || 'Belirtilmemiş'}

KULLANIM TALİMATLARI:
${prescription.usage_instructions || 'Belirtilmemiş'}
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recete-${prescription.prescription_code || prescription.prescription_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSearch = () => {
    // Arama fonksiyonu artık gerekli değil, çünkü filtreleme doğrudan state üzerinden yapılıyor
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch = searchTerm
      ? prescription.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescription_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescription_id.toString().includes(searchTerm)
      : true;

    const matchesFilter = filterStatus === "all" || prescription.prescription_status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'used': return 'Kullanıldı';
      case 'expired': return 'Süresi Doldu';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 hover:bg-green-600';
      case 'used': return 'bg-blue-500 hover:bg-blue-600';
      case 'expired': return 'bg-red-500 hover:bg-red-600';
      case 'cancelled': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Reçete numarası gösterme fonksiyonunu güvenli hale getirin
  const getPrescriptionNumber = (prescription: Prescription) => {
    if (prescription.prescription_code) {
      return prescription.prescription_code;
    }

    return prescription.prescription_id
      ? `RX${prescription.prescription_id.toString().padStart(6, '0')}`
      : 'RX000000';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Reçeteler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Hata</h3>
                <p>{error}</p>
              </div>
            </div>
            <Button
              onClick={fetchPrescriptions}
              className="mt-4"
              variant="outline"
            >
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Reçetelerim"
        subtitle="Tüm reçetelerinizi görüntüleyin ve detaylarını inceleyin"
        showBackButton={true}
      />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full border-2 border-gray-300 rounded-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Doktor adı, teşhis veya reçete numarası ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="w-full md:w-40">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 border-2 border-gray-300 rounded-md">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="used">Kullanıldı</SelectItem>
                  <SelectItem value="expired">Süresi Doldu</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Button - Only show when there are active filters */}
            {(searchTerm || filterStatus !== 'all') && (
              <Button
                variant="outline"
                onClick={clearSearch}
                className="w-full md:w-32 h-10"
              >
                Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results Info */}
      {(searchTerm || filterStatus !== 'all') && (
        <Card className="p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                Arama sonuçları:
                {searchTerm && ` "${searchTerm}"`}
                {filterStatus !== 'all' && ` - ${getStatusText(filterStatus)}`}
                {` (${filteredPrescriptions.length} reçete bulundu)`}
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="px-3 py-1.5 text-gray-600 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 rounded-md text-sm font-medium transition-colors"
            >
              Temizle
            </button>
          </div>
        </Card>
      )}

      {/* Prescriptions Grid */}
      {filteredPrescriptions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all'
                ? 'Arama kriterlerinize uygun reçete bulunamadı'
                : 'Henüz reçete bulunmuyor'
              }
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Farklı arama terimleri deneyebilir veya filtreleri temizleyebilirsiniz.'
                : 'İlk reçeteniz oluşturulduğunda burada görünecek.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrescriptions.map((rx) => (
            <Card key={rx.prescription_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{rx.doctor_name}</CardTitle>
                </div>
                <Badge className={`text-white ${getStatusColor(rx.prescription_status)}`}>
                  {getStatusText(rx.prescription_status)}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Reçete No:</span>
                    <span className="text-blue-600 font-mono">
                      {getPrescriptionNumber(rx)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Tarih:</span>
                    <span>{new Date(rx.prescription_date).toLocaleDateString('tr-TR')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">Kullanım Süresi:</span>
                    {rx.valid_until_date ? (() => {
                      const validUntilDate = new Date(rx.valid_until_date);
                      const prescriptionDate = new Date(rx.prescription_date);
                      const diffTime = validUntilDate.getTime() - prescriptionDate.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const isExpired = validUntilDate < new Date();

                      return (
                        <span className={isExpired ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                          <span className="font-semibold">{diffDays} gün</span>
                          {' '}({validUntilDate.toLocaleDateString('tr-TR')})
                          {isExpired && <span className="ml-1">(Süresi Doldu)</span>}
                        </span>
                      );
                    })() : (
                      <span className="text-gray-500">Belirtilmemiş</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Uzmanlık:</span>
                    <span>{rx.doctor_specialty}</span>
                  </div>

                  {rx.hospital_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Hastane:</span>
                      <span className="text-sm">{rx.hospital_name}</span>
                    </div>
                  )}

                  {rx.diagnosis && (
                    <div>
                      <span className="font-medium">Teşhis:</span>
                      <span className="ml-2">{rx.diagnosis}</span>
                    </div>
                  )}

                  <div>
                    <span className="font-medium">İlaçlar:</span>
                    <span className="ml-2 text-sm text-gray-600">
                      {rx.medicines.length > 0
                        ? rx.medicines.map((m) => m.medicine_name).join(", ")
                        : "Belirtilmemiş"
                      }
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchPrescriptionDetail(rx.prescription_id)}
                      className="flex items-center gap-2 !border !border-black"
                      disabled={detailLoading === rx.prescription_id}
                    >
                      {detailLoading === rx.prescription_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Detayları Gör
                    </Button>

                    {rx.prescription_status === 'active' && (
                      <Button
                        onClick={() => markAsUsed(rx.prescription_id)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        Kullanıldı İşaretle
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detay Modalı */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-2xl max-h-[calc(100vh-3rem)] sm:max-h-[90vh] overflow-y-auto mx-auto my-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Reçete Detayları
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              {/* Genel Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Reçete No:</span>
                  <p className="text-blue-600 font-mono mt-1">
                    {getPrescriptionNumber(selected)}
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Durum:</span>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(selected.prescription_status)} text-white`}>
                      {getStatusText(selected.prescription_status)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Tarih:</span>
                  <p className="mt-1">{new Date(selected.prescription_date).toLocaleDateString('tr-TR')}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Kullanım Süresi:</span>
                  {selected.valid_until_date ? (() => {
                    const validUntilDate = new Date(selected.valid_until_date);
                    const prescriptionDate = new Date(selected.prescription_date);
                    const diffTime = validUntilDate.getTime() - prescriptionDate.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isExpired = validUntilDate < new Date();

                    return (
                      <p className={`mt-1 ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        <span className="font-semibold">{diffDays} gün</span>
                        {' '}(Geçerlilik: {validUntilDate.toLocaleDateString('tr-TR')})
                        {isExpired && <span className="ml-2 text-red-600 font-semibold">(Süresi Doldu)</span>}
                      </p>
                    );
                  })() : (
                    <p className="mt-1 text-gray-500">Belirtilmemiş</p>
                  )}
                </div>

                {selected.next_visit_date && (
                  <div>
                    <span className="font-medium text-gray-700">Sonraki Ziyaret:</span>
                    <p className="mt-1">{new Date(selected.next_visit_date).toLocaleDateString('tr-TR')}</p>
                  </div>
                )}
              </div>

              {/* Doktor Bilgileri */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Doktor Bilgileri
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Doktor:</span>
                    <p className="mt-1">{selected.doctor?.name || selected.doctor_name}</p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">Uzmanlık:</span>
                    <p className="mt-1">{selected.doctor?.specialty || selected.doctor_specialty}</p>
                  </div>

                  {selected.doctor?.license_number && (
                    <div>
                      <span className="font-medium text-gray-700">Lisans No:</span>
                      <p className="mt-1">{selected.doctor.license_number}</p>
                    </div>
                  )}

                  {selected.doctor?.hospital_name && (
                    <div>
                      <span className="font-medium text-gray-700">Hastane:</span>
                      <p className="mt-1">{selected.doctor.hospital_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Teşhis */}
              {selected.diagnosis && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Teşhis</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selected.diagnosis}</p>
                </div>
              )}

              {/* İlaçlar */}
              {selected.medicines && selected.medicines.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">İlaçlar</h4>
                  <div className="space-y-3">
                    {selected.medicines.map((medicine, index) => (
                      <div key={medicine.item_id || index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <span className="font-medium text-gray-700">İlaç:</span>
                            <p className="font-semibold text-blue-900">{medicine.medicine_name}</p>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">Doz:</span>
                            <p>{medicine.dosage}</p>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">Adet:</span>
                            <p>{medicine.quantity} kutu</p>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">Sıklık:</span>
                            <p>{medicine.frequency}</p>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">Süre:</span>
                            <p>{medicine.duration}</p>
                          </div>
                        </div>

                        {medicine.usage_instructions && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="font-medium text-gray-700">Kullanım:</span>
                            <p className="text-sm text-gray-600 mt-1">{medicine.usage_instructions}</p>
                          </div>
                        )}

                        {medicine.side_effects && (
                          <div className="mt-2">
                            <span className="font-medium text-red-600">Yan Etkiler:</span>
                            <p className="text-sm text-red-600 mt-1">{medicine.side_effects}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Talimatlar */}
              {(selected.general_instructions || selected.usage_instructions) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Talimatlar</h4>

                  {selected.general_instructions && (
                    <div className="mb-3">
                      <span className="font-medium text-gray-700">Genel Talimatlar:</span>
                      <p className="text-gray-700 bg-blue-50 p-3 rounded-lg mt-1">
                        {selected.general_instructions}
                      </p>
                    </div>
                  )}

                  {selected.usage_instructions && (
                    <div>
                      <span className="font-medium text-gray-700">Kullanım Talimatları:</span>
                      <p className="text-gray-700 bg-green-50 p-3 rounded-lg mt-1">
                        {selected.usage_instructions}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Aksiyon Butonları */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                <div className="flex gap-2">
                  {selected.prescription_status === 'active' && (
                    <Button
                      onClick={() => markAsUsed(selected.prescription_id)}
                      variant="outline"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Kullanıldı İşaretle
                    </Button>
                  )}
                </div>

                <Button
                  onClick={() => handleDownload(selected)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Reçeteyi İndir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}