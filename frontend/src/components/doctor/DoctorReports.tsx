import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PageHeader } from '../ui/PageHeader';
import { BarChart3 } from 'lucide-react';

const DoctorReports: React.FC = () => {
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-full mx-auto overflow-x-hidden">
      <PageHeader 
        title="Raporlar"
        subtitle="Hasta ve randevu istatistiklerinizi görüntüleyin."
      />

      <Card className="p-4 sm:p-6">
        <CardHeader className="p-0 pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            Raporlar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-base sm:text-lg font-medium">Raporlar Yakında</p>
            <p className="text-xs sm:text-sm mt-1">Bu bölüm yakında aktif olacaktır.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorReports; 