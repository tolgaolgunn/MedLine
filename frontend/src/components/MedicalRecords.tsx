import React, { useEffect, useMemo, useState } from "react";
import { PageHeader } from "./ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";

interface MedicalResult {
  result_id: number;
  title: string;
  details: string;
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
          `http://localhost:3005/api/patient/results/${currentPatientId}`
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
          {results.map((result) => (
            <Card key={result.result_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5">
                <div className="space-y-1">
                  <CardTitle className="text-sm sm:text-base font-semibold">
                    {result.title}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-500">
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
            </Card>
          ))}
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
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4 text-sm">
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
                      const url = `http://localhost:3005${file.file_path}`;
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