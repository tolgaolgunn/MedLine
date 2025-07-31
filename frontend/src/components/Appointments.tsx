import React, { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Calendar, User, Video, Stethoscope } from "lucide-react";

interface Appointment {
  appointment_id: number;
  doctor_id: number;
  doctor_name: string;
  doctor_specialty: string;
  datetime: string;
  type: string;
  status: string;
}

const statusMap: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  cancelled: "İptal Edildi",
  completed: "Tamamlandı",
};

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      setError("");
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) throw new Error("Kullanıcı bulunamadı");
        const user = JSON.parse(userStr);
        const res = await fetch(`http://localhost:3005/api/appointments/${user.user_id}`);
        if (!res.ok) throw new Error("Randevular alınamadı");
        const data = await res.json();
        setAppointments(data);
      } catch (e: any) {
        setError(e.message || "Bilinmeyen hata");
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Randevu Yönetimi</h1>
      <p className="text-muted-foreground mb-6">
        Randevularınızı görüntüleyin, iptal edin veya güncelleyin.
      </p>
      {loading && <Card className="p-8 text-center">Yükleniyor...</Card>}
      {error && <Card className="p-8 text-center text-red-600">{error}</Card>}
      {!loading && !error && appointments.length === 0 && (
        <Card className="p-8 text-center">Hiç randevunuz yok.</Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {appointments
          .filter(appt => new Date(appt.datetime).getTime() >= Date.now())
          .map((appt) => (
          <Card key={appt.appointment_id} className="p-6 flex flex-col gap-3 shadow-lg border border-slate-700/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="flex items-center gap-2 min-h-[32px]">
              <User className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="font-semibold text-lg leading-6">{appt.doctor_name}</span>
            </div>
            <div className="flex items-center gap-2 min-h-[28px] ml-1">
              <Stethoscope className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <span className="text-sm font-medium leading-5">{appt.doctor_specialty}</span>
            </div>
            <div className="flex items-center gap-2 min-h-[28px]">
              <Calendar className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="leading-5">{new Date(appt.datetime).toLocaleString("tr-TR")}</span>
            </div>
            <div className="flex items-center gap-2 min-h-[28px]">
              <Video className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <span className="font-medium leading-5">{appt.type === "online" ? "Online" : "Yüz Yüze"}</span>
            </div>
            <div className="flex items-center gap-2 min-h-[28px]">
              <span className="font-semibold">Durum:</span>
              <span className="px-2 py-1 rounded bg-slate-700/60 text-sm font-medium">
                {statusMap[appt.status] || appt.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
