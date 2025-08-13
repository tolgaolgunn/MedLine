import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  Filter,
  Search,
  Reply,
  Archive,
  Flag,
  Star,
  Download,
  Eye
} from 'lucide-react';

interface Complaint {
  id: number;
  userName: string;
  userEmail: string;
  userRole: 'patient' | 'doctor' | 'admin';
  type: 'complaint' | 'suggestion' | 'bug' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  subject: string;
  message: string;
  submittedAt: string;
  lastUpdated: string;
  assignedTo?: string;
  tags: string[];
}

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: 1,
      userName: "Ahmet Yılmaz",
      userEmail: "ahmet@example.com",
      userRole: "patient",
      type: "complaint",
      priority: "high",
      status: "open",
      subject: "Randevu sistemi çalışmıyor",
      message: "Doktor randevusu almak istiyorum ama sistem sürekli hata veriyor. Acil yardım gerekli.",
      submittedAt: "15.12.2024 14:30",
      lastUpdated: "15.12.2024 14:30",
      tags: ["randevu", "sistem hatası", "acil"]
    },
    {
      id: 2,
      userName: "Dr. Fatma Özkan",
      userEmail: "fatma@example.com",
      userRole: "doctor",
      type: "suggestion",
      priority: "medium",
      status: "in-progress",
      subject: "Hasta geçmişi görüntüleme iyileştirmesi",
      message: "Hasta geçmişini görüntülerken daha detaylı filtreleme seçenekleri eklenebilir.",
      submittedAt: "15.12.2024 13:15",
      lastUpdated: "15.12.2024 15:20",
      assignedTo: "Admin User",
      tags: ["hasta yönetimi", "kullanıcı deneyimi"]
    },
    {
      id: 3,
      userName: "Mehmet Demir",
      userEmail: "mehmet@example.com",
      userRole: "patient",
      type: "bug",
      priority: "critical",
      status: "open",
      subject: "Reçete yazdırma hatası",
      message: "Reçeteyi yazdırmaya çalıştığımda sayfa donuyor ve hiçbir şey yazdırılamıyor.",
      submittedAt: "15.12.2024 12:45",
      lastUpdated: "15.12.2024 12:45",
      tags: ["reçete", "yazdırma", "kritik hata"]
    },
    {
      id: 4,
      userName: "Ayşe Kaya",
      userEmail: "ayse@example.com",
      userRole: "patient",
      type: "feature",
      priority: "low",
      status: "open",
      subject: "Mobil uygulama önerisi",
      message: "Mobil uygulama geliştirilirse çok daha kullanışlı olur.",
      submittedAt: "15.12.2024 11:20",
      lastUpdated: "15.12.2024 11:20",
      tags: ["mobil", "yeni özellik"]
    }
  ]);

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredComplaints = complaints.filter(complaint => {
    const matchesType = filterType === 'all' || complaint.type === filterType;
    const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || complaint.priority === filterPriority;
    const matchesSearch = complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesPriority && matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'complaint':
        return <Badge variant="destructive">Şikayet</Badge>;
      case 'suggestion':
        return <Badge variant="default">Öneri</Badge>;
      case 'bug':
        return <Badge variant="destructive">Hata</Badge>;
      case 'feature':
        return <Badge variant="secondary">Özellik</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Kritik</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-red-600">Yüksek</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-orange-600">Orta</Badge>;
      case 'low':
        return <Badge variant="secondary">Düşük</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary">Açık</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-600">İşlemde</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-600">Çözüldü</Badge>;
      case 'closed':
        return <Badge variant="outline">Kapatıldı</Badge>;
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

  const handleAssign = (complaintId: number) => {
    const assignedTo = prompt('Kime atanacak?');
    if (assignedTo) {
      setComplaints(prev => 
        prev.map(complaint => 
          complaint.id === complaintId 
            ? { ...complaint, assignedTo, lastUpdated: new Date().toLocaleString('tr-TR') }
            : complaint
        )
      );
    }
  };

  const openComplaints = complaints.filter(c => c.status === 'open').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'in-progress').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Şikayet ve Öneriler</h1>
          <p className="text-muted-foreground">Kullanıcı geri bildirimlerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Archive className="w-4 h-4" />
            Arşivle
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openComplaints}</p>
                <p className="text-sm text-muted-foreground">Açık</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressComplaints}</p>
                <p className="text-sm text-muted-foreground">İşlemde</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resolvedComplaints}</p>
                <p className="text-sm text-muted-foreground">Çözüldü</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{complaints.length}</p>
                <p className="text-sm text-muted-foreground">Toplam</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Türler</option>
                <option value="complaint">Şikayet</option>
                <option value="suggestion">Öneri</option>
                <option value="bug">Hata</option>
                <option value="feature">Özellik</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="open">Açık</option>
                <option value="in-progress">İşlemde</option>
                <option value="resolved">Çözüldü</option>
                <option value="closed">Kapatıldı</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Öncelikler</option>
                <option value="critical">Kritik</option>
                <option value="high">Yüksek</option>
                <option value="medium">Orta</option>
                <option value="low">Düşük</option>
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
                        {getTypeBadge(complaint.type)}
                        {getPriorityBadge(complaint.priority)}
                        {getStatusBadge(complaint.status)}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">{complaint.userName}</span>
                        {getRoleBadge(complaint.userRole)}
                        <span className="text-sm text-gray-500">• {complaint.submittedAt}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{complaint.message}</p>
                      <div className="flex items-center gap-2">
                        {complaint.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {complaint.assignedTo && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Atanan:</span> {complaint.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detay
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssign(complaint.id)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Ata
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Şikayet/Öneri Detayı</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Kullanıcı Bilgileri</h3>
                  <p className="text-gray-600">{selectedComplaint.userName}</p>
                  <p className="text-gray-600">{selectedComplaint.userEmail}</p>
                  <div className="mt-2">{getRoleBadge(selectedComplaint.userRole)}</div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Detaylar</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Tür:</span>
                      {getTypeBadge(selectedComplaint.type)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Öncelik:</span>
                      {getPriorityBadge(selectedComplaint.priority)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Durum:</span>
                      {getStatusBadge(selectedComplaint.status)}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Konu</h3>
                <p className="text-gray-600">{selectedComplaint.subject}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Mesaj</h3>
                <p className="text-gray-600">{selectedComplaint.message}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Etiketler</h3>
                <div className="flex items-center gap-2 mt-2">
                  {selectedComplaint.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Gönderim Tarihi</h3>
                  <p className="text-gray-600">{selectedComplaint.submittedAt}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Son Güncelleme</h3>
                  <p className="text-gray-600">{selectedComplaint.lastUpdated}</p>
                </div>
              </div>
              {selectedComplaint.assignedTo && (
                <div>
                  <h3 className="font-medium text-gray-900">Atanan Kişi</h3>
                  <p className="text-gray-600">{selectedComplaint.assignedTo}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handleAssign(selectedComplaint.id)}
              >
                <User className="w-4 h-4 mr-2" />
                Ata
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleStatusChange(selectedComplaint.id, 'resolved');
                  setShowDetailModal(false);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Çözüldü Olarak İşaretle
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
              >
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
