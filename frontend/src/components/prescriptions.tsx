import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PageHeader } from "./ui/PageHeader";
import { Search, Download } from "lucide-react";

interface Prescription {
  id: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medications: { name: string; dosage: string; instructions: string }[];
  instructions: string;
  status: "active" | "completed" | "cancelled";
}

const samplePrescriptions: Prescription[] = [
  {
    id: "RX001",
    doctorName: "Dr. Mehmet Özkan",
    date: "2024-01-15",
    diagnosis: "Hipertansiyon",
    medications: [
      { name: "Lisinopril", dosage: "10mg", instructions: "Sabah aç karnına" },
      { name: "Amlodipine", dosage: "5mg", instructions: "Sabah" },
    ],
    instructions: "Tuz tüketimini azaltın, düzenli egzersiz yapın.",
    status: "active",
  },
  {
    id: "RX002",
    doctorName: "Dr. Ayşe Yıldız",
    date: "2024-01-10",
    diagnosis: "Astım",
    medications: [
      { name: "Salbutamol", dosage: "100mcg", instructions: "Gerektiğinde" },
    ],
    instructions: "Sigara içmeyin, tozlu ortamlardan kaçının.",
    status: "completed",
  },
  {
    id: "RX003",
    doctorName: "Dr. Ali Kaya",
    date: "2024-01-08",
    diagnosis: "Diyabet",
    medications: [
      { name: "Metformin", dosage: "500mg", instructions: "Günde 2 kez" },
    ],
    instructions: "Şeker tüketimini azaltın, düzenli kan şekeri kontrolü yapın.",
    status: "cancelled",
  },
];

export function Prescriptions() {
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [activeFilterStatus, setActiveFilterStatus] = useState("all");

  const handleDownload = (prescription: Prescription) => {
    // Reçete indirme işlemi burada yapılacak
    console.log("Reçete indiriliyor:", prescription.id);
    // PDF oluşturma ve indirme işlemi burada implement edilebilir
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setActiveFilterStatus(filterStatus);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setActiveSearchTerm("");
    setActiveFilterStatus("all");
  };

  const filteredPrescriptions = samplePrescriptions.filter((prescription) => {
    const matchesSearch = activeSearchTerm
      ? prescription.doctorName.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
        prescription.diagnosis.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
        prescription.id.toLowerCase().includes(activeSearchTerm.toLowerCase())
      : true;

    const matchesFilter = activeFilterStatus === "all" || prescription.status === activeFilterStatus;

    return matchesSearch && matchesFilter;
  });

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
                placeholder="Doktor adı,teşhis veya reçete numarası ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="pl-10 h-10"
               />
            </div>
            
            {/* Filter Dropdown */}
            <div className="w-full md:w-40">
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value)}>
                <SelectTrigger className="h-10 border-2 border-gray-300 rounded-md">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                  <SelectItem value="completed">Tamamlanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Search Button */}
            <Button 
              className="w-full md:w-32 h-10 border-2 border-gray-300 shadow-sm rounded-md " 
              onClick={handleSearch}
              disabled={!searchTerm.trim() && filterStatus === 'all'}
            >
              <Search className="w-4 h-4 mr-2" />
              Ara
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results Info */}
      {(activeSearchTerm || activeFilterStatus !== 'all') && (
        <Card className="p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                Arama sonuçları: 
                {activeSearchTerm && ` "${activeSearchTerm}"`}
                {activeFilterStatus !== 'all' && ` - ${activeFilterStatus === 'active' ? 'Aktif' : activeFilterStatus === 'completed' ? 'Tamamlanan' : 'İptal'}`}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPrescriptions.map((rx) => (
          <Card key={rx.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{rx.doctorName}</CardTitle>
              <Badge
                className="bg-black text-white hover:bg-black/90"
              >
                {rx.status === "active"
                  ? "Aktif"
                  : rx.status === "completed"
                  ? "Tamamlandı"
                  : "İptal"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="font-medium">Reçete No: </span>
                  {rx.id}
                </div>
                <div>
                  <span className="font-medium">Tarih: </span>
                  {rx.date}
                </div>
                <div>
                  <span className="font-medium">Teşhis: </span>
                  {rx.diagnosis}
                </div>
                <div>
                  <span className="font-medium">İlaçlar: </span>
                  {rx.medications.map((m) => m.name).join(", ")}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelected(rx)}
                    className="flex items-center gap-2 !border !border-black"
                  >
                    Detayları Gör
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detay Modalı */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reçete Detayları</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <span className="font-medium">Reçete No: </span>
                {selected.id}
              </div>
              <div>
                <span className="font-medium">Doktor: </span>
                {selected.doctorName}
              </div>
              <div>
                <span className="font-medium">Tarih: </span>
                {selected.date}
              </div>
              <div>
                <span className="font-medium">Teşhis: </span>
                {selected.diagnosis}
              </div>
              <div>
                <span className="font-medium">İlaçlar:</span>
                <ul className="list-disc ml-6">
                  {selected.medications.map((m, i) => (
                    <li key={i}>
                      <span className="font-semibold">{m.name}</span> - {m.dosage} ({m.instructions})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-medium">Kullanım Talimatı: </span>
                {selected.instructions}
              </div>
              <div className="flex justify-end pt-4">
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