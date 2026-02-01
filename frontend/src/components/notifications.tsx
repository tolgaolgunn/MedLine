import React from "react";
import { PageHeader } from "./ui/PageHeader";

export function Notifications() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Bildirimler"
        subtitle="Bildirimlerinizi görüntüleyin, düzenleyin veya güncelleyin."
      />
    </div>
  );
}