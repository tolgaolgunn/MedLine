import React, { useEffect, useMemo, useState } from "react";
import { PageHeader } from "./ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search } from "lucide-react";

interface MedicalResult {
  result_id: number;
  title: string;
  details: string;
  record_type?: string;
  created_at: string;
  updated_at?: string;
  doctor_name: string;
  files?: {
    file_id: number;
    file_path: string;
    original_name: string;
    mime_type: string;
    created_at: string;
  }[];
}

const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
};

export function MedicalRecords() {
  const [results, setResults] = useState<MedicalResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<MedicalResult | null>(null);
  // Arama, filtreleme ve sıralama state'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type' | 'doctor'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const currentPatientId = useMemo(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return "";
      const userData = JSON.parse(userStr);
      return userData?.user_id || userData?.id || "";
    } catch (error) {
      console.error("Error getting patient ID:", error);
      return "";
    }
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!currentPatientId) {
        setError("Hasta ID bulunamadı");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/patient/results/${currentPatientId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const items: MedicalResult[] = data?.data || data || [];
        setResults(items);
        setError(null);
      } catch (err) {
        console.error("Error fetching medical results:", err);
        setError("Tıbbi sonuçlar yüklenirken bir hata oluştu");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [currentPatientId]);

  // Filtrelenmiş ve sıralanmış sonuçlar
  const filteredAndSortedResults = useMemo(() => {
    if (!results || results.length === 0) return [];

    let filtered = [...results];

    // Arama filtresi
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((r) =>
        r.title?.toLowerCase().includes(searchLower) ||
        r.details?.toLowerCase().includes(searchLower) ||
        r.record_type?.toLowerCase().includes(searchLower) ||
        r.doctor_name?.toLowerCase().includes(searchLower)
      );
    }

    // Tür filtresi
    if (filterType !== 'all') {
      filtered = filtered.filter((r) => r.record_type === filterType);
    }

    // Sıralama
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortBy === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '', 'tr');
      } else if (sortBy === 'type') {
        comparison = (a.record_type || '').localeCompare(b.record_type || '', 'tr');
      } else if (sortBy === 'doctor') {
        comparison = (a.doctor_name || '').localeCompare(b.doctor_name || '', 'tr');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [results, searchTerm, filterType, sortBy, sortOrder]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Sağlık Kayıtları"
        subtitle="Doktorlarınız tarafından eklenen tıbbi sonuçlarınızı görüntüleyin."
      />

      {isLoading && (
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600 text-sm">Yükleniyor...</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && results.length === 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">
              Henüz görüntüleyebileceğiniz bir tıbbi sonuç bulunmamaktadır.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-4">
          {/* Arama, Filtreleme ve Sıralama */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Arama */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Sonuçlarda ara (başlık, detay, tür, doktor)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border border-gray-300"
                />
              </div>

              {/* Filtreleme ve Sıralama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-10 border border-gray-300">
                    <SelectValue placeholder="Tür Filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="Kan Tahlili">Kan Tahlili</SelectItem>
                    <SelectItem value="Radyoloji">Radyoloji</SelectItem>
                    <SelectItem value="Patoloji">Patoloji</SelectItem>
                    <SelectItem value="Biyokimya">Biyokimya</SelectItem>
                    <SelectItem value="Mikrobiyoloji">Mikrobiyoloji</SelectItem>
                    <SelectItem value="Hematoloji">Hematoloji</SelectItem>
                    <SelectItem value="İmmünoloji">İmmünoloji</SelectItem>
                    <SelectItem value="Genetik">Genetik</SelectItem>
                    <SelectItem value="Endokrinoloji">Endokrinoloji</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(val) => setSortBy(val as 'date' | 'title' | 'type' | 'doctor')}>
                    <SelectTrigger className="h-10 flex-1 border border-gray-300">
                      <SelectValue placeholder="Sırala" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Tarih</SelectItem>
                      <SelectItem value="title">Başlık</SelectItem>
                      <SelectItem value="type">Tür</SelectItem>
                      <SelectItem value="doctor">Doktor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 border border-gray-300"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>

              {/* Sonuç sayısı */}
              {filteredAndSortedResults.length !== results.length && (
                <p className="text-sm text-gray-600">
                  {filteredAndSortedResults.length} sonuç bulundu ({results.length} toplam)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sonuçlar Listesi */}
          {filteredAndSortedResults.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  Arama kriterlerinize uygun sonuç bulunamadı.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedResults.map((result) => (
                <Card key={result.result_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5">
                    <div className="space-y-1">
                      <CardTitle className="text-sm sm:text-base font-semibold">
                        {result.title}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {result.record_type && (
                          <span className="font-medium text-blue-600">{result.record_type} • </span>
                        )}
                        Doktor: {result.doctor_name} • Tarih: {formatDate(result.created_at)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => setSelectedResult(result)}
                    >
                      Detayları incele
                    </Button>
                  </CardHeader>
                  {result.files && result.files.length > 0 && (
                    <CardContent className="pt-0 pb-4 px-4 sm:px-5">
                      <div className="pt-1 space-y-2">
                        <span className="text-[10px] sm:text-[11px] text-gray-500 block">
                          Ekli Belgeler:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {result.files.map((file) => {
                            const isImage = file.mime_type?.startsWith('image/');

                            // Eğer file_path zaten http ile başlıyorsa (Cloudinary URL'i), direkt kullan
                            // Değilse (eski lokal dosyalar), API_URL ekle
                            let url = file.file_path;
                            if (!url.startsWith('http')) {
                              const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
                              const normalizedPath = file.file_path.replace(/\\/g, '/').startsWith('/')
                                ? file.file_path.replace(/\\/g, '/')
                                : `/${file.file_path.replace(/\\/g, '/')}`;
                              url = `${apiUrl}${normalizedPath}`;
                            }

                            return (
                              <a
                                key={file.file_id}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="border rounded-md p-1.5 flex flex-col gap-1 hover:bg-gray-50 group transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isImage ? (
                                  <div className="aspect-video w-full overflow-hidden rounded bg-gray-100">
                                    <img
                                      src={url}
                                      alt={file.original_name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <div className="aspect-video w-full flex items-center justify-center bg-gray-50 text-[10px] sm:text-[11px] text-gray-600 rounded border border-dashed border-gray-200">
                                    PDF
                                  </div>
                                )}
                                <span className="text-[10px] sm:text-[11px] text-gray-700 truncate w-full block">
                                  {file.original_name}
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detay Diyaloğu */}
      {selectedResult && (
        <Dialog
          open={!!selectedResult}
          onOpenChange={(open) => !open && setSelectedResult(null)}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {selectedResult.title}
              </DialogTitle>
              <DialogDescription>
                Tıbbi kayıt detaylarını görüntüleyin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4 text-sm">
              {selectedResult.record_type && (
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm text-gray-500">Tıbbi Kayıt Türü</Label>
                  <p className="text-sm font-medium text-blue-600">{selectedResult.record_type}</p>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs sm:text-sm text-gray-500">Doktor</Label>
                <p className="text-sm">{selectedResult.doctor_name}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs sm:text-sm text-gray-500">Tarih</Label>
                <p className="text-sm">{formatDate(selectedResult.created_at)}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs sm:text-sm text-gray-500">Detaylar</Label>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedResult.details}
                </p>
              </div>

              {selectedResult.files && selectedResult.files.length > 0 && (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs sm:text-sm text-gray-500">Ekli Belgeler</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedResult.files.map((file) => {
                      const isImage = file.mime_type.startsWith("image/");
                      let url = file.file_path;
                      if (!url.startsWith('http')) {
                        const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
                        const normalizedPath = file.file_path.replace(/\\/g, '/').startsWith('/')
                          ? file.file_path.replace(/\\/g, '/')
                          : `/${file.file_path.replace(/\\/g, '/')}`;
                        url = `${apiUrl}${normalizedPath}`;
                      }

                      console.log('File URL Debug:', {
                        original: file.file_path,
                        finalUrl: url
                      });

                      return (
                        <a
                          key={file.file_id}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="border rounded-md p-2 flex flex-col gap-1 hover:bg-gray-50"
                        >
                          {isImage ? (
                            <img
                              src={url}
                              alt={file.original_name}
                              className="w-full h-24 object-cover rounded"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-24 bg-gray-50 text-xs text-gray-600 rounded">
                              PDF Belgesi
                            </div>
                          )}
                          <span className="text-[11px] sm:text-xs text-gray-700 truncate">
                            {file.original_name}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs sm:text-sm"
                  onClick={() => setSelectedResult(null)}
                >
                  Kapat
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}