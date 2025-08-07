import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { PageHeader } from '../ui/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Pill, 
  Printer, 
  Download,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
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

const DoctorPrescription: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: 'RX001',
      patientId: 'P001',
      patientName: 'Ahmet Yılmaz',
      doctorName: 'Dr. Mehmet Özkan',
      date: '2024-01-15',
      diagnosis: 'Hipertansiyon',
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Günde 1 kez',
          duration: '30 gün',
          instructions: 'Sabah aç karnına alın'
        },
        {
          name: 'Amlodipine',
          dosage: '5mg',
          frequency: 'Günde 1 kez',
          duration: '30 gün',
          instructions: 'Sabah alın'
        }
      ],
      instructions: 'Tuz tüketimini azaltın, düzenli egzersiz yapın',
      status: 'active',
      nextVisit: '2024-02-15'
    },
    {
      id: 'RX002',
      patientId: 'P002',
      patientName: 'Fatma Demir',
      doctorName: 'Dr. Mehmet Özkan',
      date: '2024-01-10',
      diagnosis: 'Astım',
      medications: [
        {
          name: 'Salbutamol',
          dosage: '100mcg',
          frequency: 'Gerektiğinde',
          duration: '30 gün',
          instructions: 'Nefes darlığında kullanın'
        }
      ],
      instructions: 'Sigara içmeyin, tozlu ortamlardan kaçının',
      status: 'active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [activeFilterStatus, setActiveFilterStatus] = useState('all');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [formHasChanges, setFormHasChanges] = useState(false);
  const [isEditPrescriptionOpen, setIsEditPrescriptionOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [editFormHasChanges, setEditFormHasChanges] = useState(false);
  const [showEditExitConfirm, setShowEditExitConfirm] = useState(false);
  const [showPrescriptionCreated, setShowPrescriptionCreated] = useState(false);
  const [createdPrescriptionId, setCreatedPrescriptionId] = useState<string>('');


  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.patientName.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
                         prescription.diagnosis.toLowerCase().includes(activeSearchTerm.toLowerCase());
    const matchesStatus = activeFilterStatus === 'all' || prescription.status === activeFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setActiveFilterStatus(filterStatus);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setActiveSearchTerm('');
    setActiveFilterStatus('all');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddPrescription = (newPrescription: Omit<Prescription, 'id'>) => {
    const prescription: Prescription = {
      ...newPrescription,
      id: `RX${String(prescriptions.length + 1).padStart(3, '0')}`
    };
    setPrescriptions([...prescriptions, prescription]);
    setIsAddPrescriptionOpen(false);
    setCreatedPrescriptionId(prescription.id);
    setShowPrescriptionCreated(true);
  };



  const confirmExit = () => {
    setIsAddPrescriptionOpen(false);
    setShowExitConfirm(false);
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setIsEditPrescriptionOpen(true);
    setEditFormHasChanges(false);
  };

  const handleUpdatePrescription = (updatedPrescription: Prescription) => {
    setPrescriptions(prescriptions.map(p => 
      p.id === updatedPrescription.id ? updatedPrescription : p
    ));
    setIsEditPrescriptionOpen(false);
    setEditingPrescription(null);
  };

  const confirmEditExit = () => {
    setIsEditPrescriptionOpen(false);
    setEditingPrescription(null);
    setShowEditExitConfirm(false);
  };

  const cancelEditExit = () => {
    setShowEditExitConfirm(false);
  };

  const printPrescription = (prescription: Prescription) => {
    // Print functionality would be implemented here
    console.log('Printing prescription:', prescription.id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Reçete Yönetimi"
          subtitle="Reçetelerinizi oluşturun ve yönetin"
          showBackButton={true}
        />
                 <Dialog open={isAddPrescriptionOpen} onOpenChange={(open) => {
           if (!open) {
             if (formHasChanges) {
               setShowExitConfirm(true);
             } else {
               setIsAddPrescriptionOpen(false);
             }
           } else {
             setIsAddPrescriptionOpen(true);
             setFormHasChanges(false); // Reset when opening
           }
         }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Reçete
            </Button>
          </DialogTrigger>
                     <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>Yeni Reçete Oluştur</DialogTitle>
             </DialogHeader>
             <AddPrescriptionForm 
               onSubmit={handleAddPrescription} 
               onFormChange={setFormHasChanges}
             />
           </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full border-2 border-gray-300 rounded-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Hasta adı veya teşhis ara..."
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

      {/* Prescriptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPrescriptions.map((prescription) => (
                     <Card key={prescription.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader>
                             <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="text-lg">{prescription.patientName}</CardTitle>
                   <p className="text-sm text-gray-600">Reçete No: {prescription.id}</p>
                 </div>
                <Badge className={getStatusColor(prescription.status)}>
                  {prescription.status === 'active' ? 'Aktif' :
                   prescription.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                </Badge>
              </div>
            </CardHeader>
                         <CardContent className="flex flex-col h-full">
               <div className="flex-1 space-y-3">
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="font-medium">Teşhis:</span>
                     <p className="text-gray-600">{prescription.diagnosis}</p>
                   </div>
                   <div>
                     <span className="font-medium">Tarih:</span>
                     <p className="text-gray-600">{prescription.date}</p>
                   </div>
                 </div>

                 <div>
                   <span className="font-medium text-sm">İlaçlar:</span>
                   <div className="mt-1 space-y-1">
                     {prescription.medications.map((med, index) => (
                       <div key={index} className="flex items-center space-x-2 text-sm">
                         <Pill className="w-4 h-4 text-gray-400" />
                         <span className="font-medium">{med.name}</span>
                         <span className="text-gray-600">- {med.dosage}</span>
                       </div>
                     ))}
                   </div>
                 </div>

                 {prescription.nextVisit && (
                   <div className="flex items-center space-x-2 text-sm">
                     <Calendar className="w-4 h-4 text-gray-400" />
                     <span>Sonraki ziyaret: {prescription.nextVisit}</span>
                   </div>
                 )}
               </div>

               <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
                 <Button
                   size="sm"
                   variant="outline"
                   className="text-black hover:text-black border border-black hover:border-black flex-1"
                   onClick={() => setSelectedPrescription(prescription)}
                 >
                   <Eye className="w-4 h-4 mr-1" />
                   Görüntüle
                 </Button>
                 <Button
                   size="sm"
                   variant="outline"
                   className="text-black hover:text-black border border-black hover:border-black flex-1"
                   onClick={() => printPrescription(prescription)}
                 >
                   <Printer className="w-4 h-4 mr-1" />
                   Yazdır
                 </Button>
                 <Button 
                   size="sm" 
                   variant="outline"
                   className="text-black hover:text-black border border-black hover:border-black flex-1"
                 >
                   <Download className="w-4 h-4 mr-1" />
                   İndir
                 </Button>
                 <Button 
                   size="sm" 
                   variant="outline"
                   className="text-black hover:text-black border border-black hover:border-black flex-1"
                   onClick={() => handleEditPrescription(prescription)}
                 >
                   <Edit className="w-4 h-4 mr-1" />
                   Düzenle
                 </Button>
               </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Prescription Detail Dialog */}
      {selectedPrescription && (
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reçete Detayları - {selectedPrescription.patientName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg shadow-sm">
                <div>
                  <Label className="font-semibold">Hasta</Label>
                  <p className="text-sm">{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Doktor</Label>
                  <p className="text-sm">{selectedPrescription.doctorName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Tarih</Label>
                  <p className="text-sm">{selectedPrescription.date}</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div >
                <Label className="font-semibold">Teşhis</Label>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg shadow-sm">{selectedPrescription.diagnosis}</p>
              </div>

              {/* Medications */}
              <div>
                <Label className="font-semibold">İlaçlar</Label>
                <div className="mt-2 space-y-3">
                  {selectedPrescription.medications.map((medication, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 bg-gray-50 rounded-lg shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                          <div>
                            <p className="font-medium">{medication.name}</p>
                            <p className="text-sm text-gray-600">{medication.dosage}</p>
                          </div>
                          <div>
                            <p className="text-sm"><span className="font-medium">Sıklık:</span> {medication.frequency}</p>
                            <p className="text-sm"><span className="font-medium">Süre:</span> {medication.duration}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm"><span className="font-medium">Kullanım:</span> {medication.instructions}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <Label className="font-semibold">Genel Talimatlar</Label>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg shadow-sm">{selectedPrescription.instructions}</p>
              </div>

              {selectedPrescription.nextVisit && (
                <div>
                  <Label className="font-semibold">Sonraki Ziyaret</Label>
                  <p className="mt-2 p-3 bg-gray-50 rounded-lg shadow-sm">{selectedPrescription.nextVisit}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Çıkış Onay Modalı */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kaydetmeden Çıkış</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Kaydetmeden çıkmak istediğinizden emin misiniz? <br />
              Girilen bilgiler kaybolacaktır.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={cancelExit}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              Çık
            </Button>
          </div>
        </DialogContent>
      </Dialog>

             {/* Reçete Düzenleme Modalı */}
       {editingPrescription && (
                   <Dialog open={isEditPrescriptionOpen} onOpenChange={(open) => {
            if (!open) {
              if (editFormHasChanges) {
                setShowEditExitConfirm(true);
              } else {
                setIsEditPrescriptionOpen(false);
                setEditingPrescription(null);
              }
            } else {
              setIsEditPrescriptionOpen(true);
              setEditFormHasChanges(false);
            }
          }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reçete Düzenle - {editingPrescription.patientName}</DialogTitle>
            </DialogHeader>
                         <EditPrescriptionForm 
               prescription={editingPrescription}
               onSubmit={handleUpdatePrescription} 
               onFormChange={setEditFormHasChanges}
             />
          </DialogContent>
        </Dialog>
      )}

             {/* Düzenleme Çıkış Onay Modalı */}
       <Dialog open={showEditExitConfirm} onOpenChange={setShowEditExitConfirm}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Kaydetmeden Çıkış</DialogTitle>
           </DialogHeader>
           <div className="py-4">
             <p className="text-gray-600">
               Kaydetmeden çıkmak istediğinizden emin misiniz? <br />
               Yapılan değişiklikler kaybolacaktır.
             </p>
           </div>
           <div className="flex justify-end space-x-2">
             <Button variant="outline" onClick={cancelEditExit}>
               İptal
             </Button>
             <Button variant="destructive" onClick={confirmEditExit}>
               Çık
             </Button>
           </div>
         </DialogContent>
       </Dialog>

       {/* Reçete Oluşturuldu Bildirimi */}
       <Dialog open={showPrescriptionCreated} onOpenChange={setShowPrescriptionCreated}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle className="text-black-600">✅ Reçete Başarıyla Oluşturuldu!</DialogTitle>
           </DialogHeader>
           <div className="py-4">
             <div className="text-center">
               <p className="text-gray-700 text-lg font-medium mb-2">
                 Yeni reçete oluşturuldu!
               </p>
               <p className="text-gray-600">
                 Reçete numaranız: <span className="font-bold text-green-600">{createdPrescriptionId}</span>
               </p>
             </div>
           </div>
           <div className="flex justify-center">
             <Button 
               onClick={() => setShowPrescriptionCreated(false)}
             >
               Tamam
             </Button>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  );
};

// Add Prescription Form Component
const AddPrescriptionForm: React.FC<{ 
  onSubmit: (prescription: Omit<Prescription, 'id'>) => void;
  onFormChange: (hasChanges: boolean) => void;
}> = ({ onSubmit, onFormChange }) => {
  const initialFormData = {
    patientName: '',
    diagnosis: '',
    instructions: '',
    nextVisit: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [showRemoveMedicationConfirm, setShowRemoveMedicationConfirm] = useState(false);
  const [medicationToRemove, setMedicationToRemove] = useState<number | null>(null);

  // Check if form has any changes
  const hasChanges = () => {
    if (formData.patientName !== initialFormData.patientName ||
        formData.diagnosis !== initialFormData.diagnosis ||
        formData.instructions !== initialFormData.instructions ||
        formData.nextVisit !== initialFormData.nextVisit) {
      return true;
    }
    
    // Check medications
    if (formData.medications.length !== initialFormData.medications.length) {
      return true;
    }
    
    for (let i = 0; i < formData.medications.length; i++) {
      const current = formData.medications[i];
      const initial = initialFormData.medications[0]; // All initial medications are the same
      if (current.name !== initial.name ||
          current.dosage !== initial.dosage ||
          current.frequency !== initial.frequency ||
          current.duration !== initial.duration ||
          current.instructions !== initial.instructions) {
        return true;
      }
    }
    
    return false;
  };

  // Notify parent component about form changes
  React.useEffect(() => {
    onFormChange(hasChanges());
  }, [formData, onFormChange]);

  // Form validation function
  const isFormValid = () => {
    // Check if required fields are filled
    if (!formData.patientName.trim() || !formData.diagnosis.trim()) {
      return false;
    }
    
    // Check if at least one medication has name and dosage
    const hasValidMedication = formData.medications.some(med => 
      med.name.trim() && med.dosage.trim()
    );
    
    return hasValidMedication;
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedication = (index: number) => {
    setMedicationToRemove(index);
    setShowRemoveMedicationConfirm(true);
  };

  const confirmRemoveMedication = () => {
    if (medicationToRemove !== null) {
      setFormData({
        ...formData,
        medications: formData.medications.filter((_, i) => i !== medicationToRemove)
      });
      setShowRemoveMedicationConfirm(false);
      setMedicationToRemove(null);
    }
  };

  const cancelRemoveMedication = () => {
    setShowRemoveMedicationConfirm(false);
    setMedicationToRemove(null);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = { ...updatedMedications[index], [field]: value };
    setFormData({ ...formData, medications: updatedMedications });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientId: 'P001', // This would come from patient selection
      patientName: formData.patientName,
      doctorName: 'Dr. Mehmet Özkan', // This would come from logged in doctor
      date: new Date().toISOString().split('T')[0],
      diagnosis: formData.diagnosis,
      medications: formData.medications.filter(med => med.name && med.dosage),
      instructions: formData.instructions,
      status: 'active' as const,
      nextVisit: formData.nextVisit || undefined
    });
  };
  
 return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patientName">Hasta Adı</Label>
                     <Input
             id="patientName"
             className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
             value={formData.patientName}
             onChange={(e) => setFormData({...formData, patientName: e.target.value})}
             maxLength={50}
             showCharCount={false}
             required
           />
        </div>
        <div>
          <Label htmlFor="diagnosis">Teşhis</Label>
                     <Input
             id="diagnosis"
             className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
             value={formData.diagnosis}
             onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
             maxLength={50}
             showCharCount={false}
             required
           />
        </div>
      </div>

      <div>
        <Label htmlFor="instructions">Genel Talimatlar</Label>
                 <Textarea
           id="instructions"
           className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
           value={formData.instructions}
           onChange={(e) => setFormData({...formData, instructions: e.target.value})}
           placeholder="Hasta için genel talimatlar..."
           maxLength={200}
           showCharCount={true}
           charCountType="general"
         />
      </div>

      <div>
        <Label htmlFor="nextVisit">Sonraki Ziyaret (Opsiyonel)</Label>
        <Input
          id="nextVisit"
          className="w-45 border-2 border-gray-300 shadow-sm rounded-md mt-2" 
          type="date"
          value={formData.nextVisit}
          onChange={(e) => setFormData({...formData, nextVisit: e.target.value})}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <Label className="font-semibold">İlaçlar</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addMedication}
            className="border-2 border-gray-300 hover:border-gray-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            İlaç Ekle
          </Button>
        </div>
        
        <div className="space-y-4">
          {formData.medications.map((medication, index) => (
            <Card key={index} className="border-2 border-gray-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>İlaç Adı</Label>
                                         <Input
                       className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
                       value={medication.name}
                       onChange={(e) => updateMedication(index, 'name', e.target.value)}
                       placeholder="İlaç adı"
                       maxLength={50}
                       showCharCount={false}
                     />
                  </div>
                  <div>
                    <Label>Doz</Label>
                                         <Input
                      className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
                       value={medication.dosage}
                       onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                       placeholder="10mg"
                       maxLength={50}
                       showCharCount={false}
                     />
                  </div>
                  <div>
                    <Label>Sıklık</Label>
                                         <Input
                       className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
                       value={medication.frequency}
                       onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                       placeholder="Günde 2 kez"
                       maxLength={50}
                       showCharCount={false}
                     />
                  </div>
                  <div>
                    <Label>Süre</Label>
                                         <Input
                       className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
                       value={medication.duration}
                       onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                       placeholder="7 gün"
                       maxLength={50}
                       showCharCount={false}
                     />
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Kullanım Talimatları</Label>
                                     <Textarea
                     className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
                     value={medication.instructions}
                     onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                     placeholder="Kullanım talimatları..."
                     maxLength={200}
                     showCharCount={true}
                     charCountType="usage"
                   />
                </div>
                {formData.medications.length > 1 && (
                  <Button
                    type="button"
                    className="mt-2 w-32 border-2 border-gray-300 hover:border-gray-400 "
                    onClick={() => removeMedication(index)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    İlacı Kaldır
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="submit" 
          disabled={!isFormValid()}
          className={!isFormValid() ? "opacity-50 cursor-not-allowed" : ""}
        >
          Reçete Oluştur
        </Button>
      </div>

      {/* İlacı Kaldır Onay Modalı */}
      <Dialog open={showRemoveMedicationConfirm} onOpenChange={setShowRemoveMedicationConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>İlacı Kaldır</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Bu ilacı kaldırmak istediğinizden emin misiniz? <br />
              Bu işlem geri alınamaz.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={cancelRemoveMedication}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmRemoveMedication}>
              Kaldır
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

// Edit Prescription Form Component
const EditPrescriptionForm: React.FC<{ 
  prescription: Prescription;
  onSubmit: (prescription: Prescription) => void;
  onFormChange: (hasChanges: boolean) => void;
}> = ({ prescription, onSubmit, onFormChange }) => {
     const initialFormData = {
     patientName: prescription.patientName,
     diagnosis: prescription.diagnosis,
     instructions: prescription.instructions,
     nextVisit: prescription.nextVisit || '',
     medications: prescription.medications,
     status: prescription.status
   };
  
  const [formData, setFormData] = useState(initialFormData);
  const [showRemoveMedicationConfirm, setShowRemoveMedicationConfirm] = useState(false);
  const [medicationToRemove, setMedicationToRemove] = useState<number | null>(null);

     // Check if form has any changes
   const hasChanges = () => {
     if (formData.patientName !== initialFormData.patientName ||
         formData.diagnosis !== initialFormData.diagnosis ||
         formData.instructions !== initialFormData.instructions ||
         formData.nextVisit !== initialFormData.nextVisit ||
         formData.status !== initialFormData.status) {
       return true;
     }
     
     // Check medications
     if (formData.medications.length !== initialFormData.medications.length) {
       return true;
     }
     
     for (let i = 0; i < formData.medications.length; i++) {
       const current = formData.medications[i];
       const initial = initialFormData.medications[i];
       if (current.name !== initial.name ||
           current.dosage !== initial.dosage ||
           current.frequency !== initial.frequency ||
           current.duration !== initial.duration ||
           current.instructions !== initial.instructions) {
         return true;
       }
     }
     
     return false;
   };



  // Notify parent component about form changes
  React.useEffect(() => {
    onFormChange(hasChanges());
  }, [formData, onFormChange]);

  // Form validation function
  const isFormValid = () => {
    // Check if required fields are filled
    if (!formData.patientName.trim() || !formData.diagnosis.trim()) {
      return false;
    }
    
    // Check if at least one medication has name and dosage
    const hasValidMedication = formData.medications.some(med => 
      med.name.trim() && med.dosage.trim()
    );
    
    return hasValidMedication;
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedication = (index: number) => {
    setMedicationToRemove(index);
    setShowRemoveMedicationConfirm(true);
  };

  const confirmRemoveMedication = () => {
    if (medicationToRemove !== null) {
      setFormData({
        ...formData,
        medications: formData.medications.filter((_, i) => i !== medicationToRemove)
      });
      setShowRemoveMedicationConfirm(false);
      setMedicationToRemove(null);
    }
  };

  const cancelRemoveMedication = () => {
    setShowRemoveMedicationConfirm(false);
    setMedicationToRemove(null);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = { ...updatedMedications[index], [field]: value };
    setFormData({ ...formData, medications: updatedMedications });
  };

     const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     onSubmit({
       ...prescription,
       patientName: formData.patientName,
       diagnosis: formData.diagnosis,
       medications: formData.medications.filter(med => med.name && med.dosage),
       instructions: formData.instructions,
       nextVisit: formData.nextVisit || undefined,
       status: formData.status
     });
   };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patientName">Hasta Adı</Label>
          <Input
            id="patientName"
            className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
            value={formData.patientName}
            onChange={(e) => setFormData({...formData, patientName: e.target.value})}
            maxLength={50}
            showCharCount={false}
            required
          />
        </div>
        <div>
          <Label htmlFor="diagnosis">Teşhis</Label>
          <Input
            id="diagnosis"
            className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
            value={formData.diagnosis}
            onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
            maxLength={50}
            showCharCount={false}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="instructions">Genel Talimatlar</Label>
        <Textarea
          id="instructions"
          className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
          value={formData.instructions}
          onChange={(e) => setFormData({...formData, instructions: e.target.value})}
          placeholder="Hasta için genel talimatlar..."
          maxLength={200}
          showCharCount={true}
          charCountType="general"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nextVisit">Sonraki Ziyaret (Opsiyonel) </Label>
          <Input
            id="nextVisit"
            className="w-full border-2 border-gray-300 shadow-sm rounded-md mt-2" 
            type="date"
            value={formData.nextVisit}
            onChange={(e) => setFormData({...formData, nextVisit: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="status">Reçete Durumu</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData({...formData, status: value as 'active' | 'completed' | 'cancelled'})}
          >
            <SelectTrigger className="border-2 border-gray-300 shadow-sm rounded-md mt-2">
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
        <div className="flex justify-between items-center mb-4">
          <Label className="font-semibold">İlaçlar</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addMedication}
            className="border-2 border-gray-300 hover:border-gray-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            İlaç Ekle
          </Button>
        </div>
        
        <div className="space-y-4">
          {formData.medications.map((medication, index) => (
            <Card key={index} className="border-2 border-gray-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>İlaç Adı</Label>
                    <Input
                      className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
                      value={medication.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      placeholder="İlaç adı"
                      maxLength={50}
                      showCharCount={false}
                    />
                  </div>
                  <div>
                    <Label>Doz</Label>
                    <Input
                      className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      placeholder="10mg"
                      maxLength={50}
                      showCharCount={false}
                    />
                  </div>
                  <div>
                    <Label>Sıklık</Label>
                    <Input
                      className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      placeholder="Günde 2 kez"
                      maxLength={50}
                      showCharCount={false}
                    />
                  </div>
                  <div>
                    <Label>Süre</Label>
                    <Input
                      className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      placeholder="7 gün"
                      maxLength={50}
                      showCharCount={false}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Kullanım Talimatları</Label>
                  <Textarea
                    className="border-2 border-gray-300 shadow-sm rounded-md mt-2" 
                    value={medication.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    placeholder="Kullanım talimatları..."
                    maxLength={200}
                    showCharCount={true}
                    charCountType="usage"
                  />
                </div>
                {formData.medications.length > 1 && (
                  <div className="flex justify-end mt-5">
                    <Button
                      type="button"
                      className="w-32 border-2 border-gray-300 hover:border-gray-400"
                      onClick={() => removeMedication(index)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      İlacı Kaldır
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

         <div className="flex justify-end space-x-2">
         <Button 
           type="submit" 
           disabled={!isFormValid() || !hasChanges()}
           className={!isFormValid() || !hasChanges() ? "opacity-50 cursor-not-allowed" : ""}
         >
           Reçeteyi Güncelle
         </Button>
       </div>

      {/* İlacı Kaldır Onay Modalı */}
      <Dialog open={showRemoveMedicationConfirm} onOpenChange={setShowRemoveMedicationConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>İlacı Kaldır</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Bu ilacı kaldırmak istediğinizden emin misiniz? <br />
              Bu işlem geri alınamaz.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={cancelRemoveMedication}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmRemoveMedication}>
              Kaldır
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};
export default DoctorPrescription; 