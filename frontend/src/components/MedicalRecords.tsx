import React from "react";
import { PageHeader } from './ui/PageHeader';


export function MedicalRecords() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Sağlık Kayıtları"
        subtitle="Sağlık kayıtlarınızı görüntüleyin, düzenleyin veya güncelleyin."
      />
    </div>
  );
}