import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { PageHeader } from './ui/PageHeader';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Upload, 
  FileAudio, 
  FileVideo, 
  X, 
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  Activity
} from 'lucide-react';

interface DiagnosisResult {
  condition: string;
  confidence: number;
  symptoms: string[];
  recommendations: string[];
  urgency: 'Düşük' | 'Orta' | 'Yüksek';
  doctorRecommendation: boolean;
}

export function AIDiagnosis() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [symptoms, setSymptoms] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      return (isAudio || isVideo) && isValidSize;
    });
    setUploadedFiles([...uploadedFiles, ...validFiles]);
  };

  const removeFile = (index: number): void => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleAnalyze = async (): Promise<void> => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setDiagnosisResult({
        condition: 'Üst Solunum Yolu Enfeksiyonu',
        confidence: 78,
        symptoms: ['Öksürük', 'Boğaz ağrısı', 'Hafif ateş'],
        recommendations: [
          'Bol sıvı tüketin',
          'Dinlenin',
          'Doktor kontrolü önerilir'
        ],
        urgency: 'Orta',
        doctorRecommendation: true
      });
      setIsAnalyzing(false);
    }, 3000);
  };

  const resetAnalysis = (): void => {
    setUploadedFiles([]);
    setSymptoms('');
    setDiagnosisResult(null);
  };

  const commonSymptoms = ['Ateş', 'Öksürük', 'Baş ağrısı', 'Mide bulantısı', 'Yorgunluk', 'Nefes darlığı'];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <PageHeader
        title='AI Destekli Ön Tanı'
        subtitle='Semptomlarınızı ve ses/video kayıtlarınızı analiz ederek ön tanı alın.'
        ></PageHeader>
      </div>

      {/* Warning Alert */}
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <strong>Önemli:</strong> Bu bir ön tanıdır. Kesin teşhis için mutlaka bir doktora danışın.
          Acil durumlarda 112'yi arayın.
        </AlertDescription>
      </Alert>

      {!diagnosisResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Dosya Yükleme
            </h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Ses veya Video Dosyası Yükleyin</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Öksürük sesi, cilt görüntüsü gibi dosyalar yükleyebilirsiniz.
                  Maksimum 50MB.
                </p>
                <Input
                  type="file"
                  accept="audio/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full"
                />
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Yüklenen Dosyalar:</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('audio/') ? (
                          <FileAudio className="w-5 h-5 text-blue-500" />
                        ) : (
                          <FileVideo className="w-5 h-5 text-purple-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Symptoms Input */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Semptom Açıklaması
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Yaşadığınız semptomları detaylı olarak açıklayın:
                </label>
                <Textarea
                  placeholder="Örneğin: 3 gündür öksürüğüm var, boğazım ağrıyor, hafif ateşim çıktı..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={6}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Yaygın Semptomlar:</label>
                <div className="flex flex-wrap gap-2">
                  {commonSymptoms.map((symptom) => (
                    <Badge
                      key={symptom}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        if (!symptoms.includes(symptom)) {
                          setSymptoms(symptoms + (symptoms ? ', ' : '') + symptom);
                        }
                      }}
                    >
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Diagnosis Results */
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              AI Ön Tanı Sonucu
            </h2>
            <Button variant="outline" onClick={resetAnalysis}>
              Yeni Analiz
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Olası Tanı</h3>
                <p className="text-blue-800 dark:text-blue-200">{diagnosisResult.condition}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Güven Oranı:</span>
                  <Badge variant="secondary">{diagnosisResult.confidence}%</Badge>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Aciliyet Durumu</h3>
                <Badge variant={diagnosisResult.urgency === 'Yüksek' ? 'destructive' : 'secondary'}>
                  {diagnosisResult.urgency}
                </Badge>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Tespit Edilen Semptomlar</h3>
                <div className="flex flex-wrap gap-1">
                  {diagnosisResult.symptoms.map((symptom, index) => (
                    <Badge key={index} variant="outline" className="text-green-800 dark:text-green-200">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">Öneriler</h3>
                <ul className="space-y-2">
                  {diagnosisResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                      <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {diagnosisResult.doctorRecommendation && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    <strong>Doktor Önerisi:</strong> Bu semptomlar için bir doktor kontrolü önerilir.
                    Hemen randevu alın.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex gap-4">
              <Button className="flex-1">
                Doktor Ara
              </Button>
              <Button variant="outline" className="flex-1">
                Sonucu Kaydet
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Analysis Button */}
      {!diagnosisResult && (uploadedFiles.length > 0 || symptoms.trim()) && (
        <div className="text-center">
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            size="lg"
            className="px-8"
          >
            {isAnalyzing ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Analiz Ediliyor...
              </>
            ) : (
              <>
                <Stethoscope className="w-4 h-4 mr-2" />
                AI Analizi Başlat
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}