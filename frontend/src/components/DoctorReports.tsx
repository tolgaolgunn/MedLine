import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PageHeader } from './ui/PageHeader';
import { BarChart3 } from 'lucide-react';

const DoctorReports: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Raporlar"
        subtitle="Hasta ve randevu istatistiklerinizi görüntüleyin."
      />

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Raporlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Raporlar Yakında</p>
            <p className="text-sm">Bu bölüm yakında aktif olacaktır.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorReports; 