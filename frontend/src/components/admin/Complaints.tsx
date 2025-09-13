import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { PageHeader } from '../ui/PageHeader';
import { 
  MessageSquare, 
  Search,
  Eye
} from 'lucide-react';

interface Complaint {
  id: number;
  userName: string;
  userEmail: string;
  userRole: 'patient' | 'doctor' | 'admin';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  subject: string;
  message: string;
  submittedAt: string;
  lastUpdated: string;
}

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: 1,
      userName: "Ahmet Yılmaz",
      userEmail: "ahmet@example.com",
      userRole: "patient",
      status: "open",
      subject: "Randevu sistemi çalışmıyor",
      message: "Doktor randevusu almak istiyorum ama sistem sürekli hata veriyor. Acil yardım gerekli.",
      submittedAt: "15.12.2024 14:30",
      lastUpdated: "15.12.2024 14:30"
    },
    {
      id: 2,
      userName: "Dr. Fatma Özkan",
      userEmail: "fatma@example.com",
      userRole: "doctor",
      status: "in-progress",
      subject: "Hasta geçmişi görüntüleme iyileştirmesi",
      message: "Hasta geçmişini görüntülerken daha detaylı filtreleme seçenekleri eklenebilir.",
      submittedAt: "15.12.2024 13:15",
      lastUpdated: "15.12.2024 15:20"
    },
    {
      id: 3,
      userName: "Mehmet Demir",
      userEmail: "mehmet@example.com",
      userRole: "patient",
      status: "open",
      subject: "Reçete yazdırma hatası",
      message: "Reçeteyi yazdırmaya çalıştığımda sayfa donuyor ve hiçbir şey yazdırılamıyor.",
      submittedAt: "15.12.2024 12:45",
      lastUpdated: "15.12.2024 12:45"
    },
    {
      id: 4,
      userName: "Ayşe Kaya",
      userEmail: "ayse@example.com",
      userRole: "patient",
      status: "open",
      subject: "Mobil uygulama önerisi",
      message: "Mobil uygulama geliştirilirse çok daha kullanışlı olur.",
      submittedAt: "15.12.2024 11:20",
      lastUpdated: "15.12.2024 11:20"
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
    const matchesSearch = complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Time filter logic
    let matchesTime = true;
    if (timeFilter !== 'all') {
      const complaintDate = new Date(complaint.submittedAt.split(' ')[0].split('.').reverse().join('-'));
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (timeFilter) {
        case 'today':
          matchesTime = complaintDate.getTime() === today.getTime();
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          matchesTime = complaintDate.getTime() === yesterday.getTime();
          break;
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          matchesTime = complaintDate.getTime() === tomorrow.getTime();
          break;
        case 'thisWeek':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          matchesTime = complaintDate >= startOfWeek;
          break;
        case 'thisMonth':
          matchesTime = complaintDate.getMonth() === today.getMonth() && 
                       complaintDate.getFullYear() === today.getFullYear();
          break;
        case 'thisYear':
          matchesTime = complaintDate.getFullYear() === today.getFullYear();
          break;
      }
    }
    
    return matchesStatus && matchesSearch && matchesTime;
  }).sort((a, b) => {
    const dateA = new Date(a.submittedAt.split(' ')[0].split('.').reverse().join('-'));
    const dateB = new Date(b.submittedAt.split(' ')[0].split('.').reverse().join('-'));
    
    if (sortOrder === 'newest') {
      return dateB.getTime() - dateA.getTime();
    } else {
      return dateA.getTime() - dateB.getTime();
    }
  });



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-black text-white border-black">Açık</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-black text-white border-black">İşlemde</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-black text-white border-black">Çözüldü</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-black text-white border-black">Kapatıldı</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'doctor':
        return <Badge variant="default">Doktor</Badge>;
      case 'patient':
        return <Badge variant="secondary">Hasta</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleStatusChange = (complaintId: number, newStatus: string) => {
    setComplaints(prev => 
      prev.map(complaint => 
        complaint.id === complaintId 
          ? { ...complaint, status: newStatus as any, lastUpdated: new Date().toLocaleString('tr-TR') }
          : complaint
      )
    );
  };



  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Şikayet ve Öneriler" 
        subtitle="Kullanıcı geri bildirimlerini yönetin"
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Şikayet/öneri ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="open">Açık</option>
                <option value="in-progress">İşlemde</option>
                <option value="resolved">Çözüldü</option>
                <option value="closed">Kapatıldı</option>
              </select>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tüm Zamanlar</option>
                <option value="today">Bugün</option>
                <option value="yesterday">Dün</option>
                <option value="tomorrow">Yarın</option>
                <option value="thisWeek">Bu Hafta</option>
                <option value="thisMonth">Bu Ay</option>
                <option value="thisYear">Bu Yıl</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="newest">Tarihe göre (Önce en yeni)</option>
                <option value="oldest">Tarihe göre (Önce en eski)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Şikayet ve Öneriler ({filteredComplaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar>
                      <AvatarFallback>
                        {complaint.userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{complaint.subject}</h3>
                        {getStatusBadge(complaint.status)}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">{complaint.userName}</span>
                        {getRoleBadge(complaint.userRole)}
                        <span className="text-sm text-gray-500">• {complaint.submittedAt}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{complaint.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 border-gray-300 shadow-sm"
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detay
                    </Button>
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="open">Açık</option>
                      <option value="in-progress">İşlemde</option>
                      <option value="resolved">Çözüldü</option>
                      <option value="closed">Kapat</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {filteredComplaints.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Filtrelere uygun şikayet/öneri bulunamadı</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedComplaint && (
        <Dialog open={showDetailModal} onOpenChange={(open) => { if (!open) setShowDetailModal(false); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Geri Bildirim Detayı</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div><b>Kullanıcı:</b> {selectedComplaint.userName}</div>
              <div><b>Rol:</b> {selectedComplaint.userRole === 'patient' ? 'Hasta' : selectedComplaint.userRole === 'doctor' ? 'Doktor' : 'Admin'}</div>
              <div><b>E-posta:</b> {selectedComplaint.userEmail}</div>
              <div><b>Tarih:</b> {selectedComplaint.submittedAt}</div>
              <div><b>Durum:</b> {selectedComplaint.status === 'open' ? 'Açık' : selectedComplaint.status === 'in-progress' ? 'İşlemde' : selectedComplaint.status === 'resolved' ? 'Çözüldü' : 'Kapatıldı'}</div>
              <div><b>Başlık:</b> {selectedComplaint.subject}</div>
              <div><b>Açıklama:</b> {selectedComplaint.message}</div>
              <div><b>Son Güncelleme:</b> {selectedComplaint.lastUpdated}</div>
            </div>
            <Button onClick={() => setShowDetailModal(false)} className="w-full mt-4">Kapat</Button>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default Complaints;
