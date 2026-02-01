import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { PageHeader } from '../ui/PageHeader';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface ApprovalRequest {
  id: number;
  patientName: string;
  patientEmail: string;
  requestType: 'registration' | 'document' | 'verification';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  documents: string[];
  notes?: string;
}

const PatientApprovals: React.FC = () => {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([
    {
      id: 1,
      patientName: "Fatma Özkan",
      patientEmail: "fatma@example.com",
      requestType: "registration",
      status: "pending",
      submittedAt: "15.12.2024 14:30",
      documents: ["Kimlik Belgesi", "Sağlık Raporu"],
      notes: "Yeni hasta kaydı"
    },
    {
      id: 2,
      patientName: "Mehmet Demir",
      patientEmail: "mehmet@example.com",
      requestType: "document",
      status: "pending",
      submittedAt: "15.12.2024 13:15",
      documents: ["Reçete Güncelleme", "Doktor Raporu"],
      notes: "Reçete güncelleme talebi"
    },
    {
      id: 3,
      patientName: "Ayşe Kaya",
      patientEmail: "ayse@example.com",
      requestType: "verification",
      status: "pending",
      submittedAt: "15.12.2024 12:45",
      documents: ["Doğrulama Belgesi"],
      notes: "Hesap doğrulama talebi"
    },
    {
      id: 4,
      patientName: "Ali Yıldız",
      patientEmail: "ali@example.com",
      requestType: "registration",
      status: "pending",
      submittedAt: "15.12.2024 11:20",
      documents: ["Kimlik Belgesi", "Adres Belgesi"],
      notes: "Yeni hasta kaydı"
    }
  ]);

  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleApprove = (requestId: number) => {
    setApprovalRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: 'approved' as const } : req
      )
    );
  };

  const handleReject = (requestId: number) => {
    setApprovalRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' as const } : req
      )
    );
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'registration':
        return 'Kayıt';
      case 'document':
        return 'Belge';
      case 'verification':
        return 'Doğrulama';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-black text-white border-black">Beklemede</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-black text-white border-black">Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-black text-white border-black">Reddedildi</Badge>;
      default:
        return <Badge variant="outline" className="bg-black text-white border-black">{status}</Badge>;
    }
  };

  const pendingRequests = approvalRequests.filter(req => req.status === 'pending');

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Hasta Onayları" 
        subtitle="Bekleyen hasta onay taleplerini yönetin"
      />

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Bekleyen Onay Talepleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {request.patientName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{request.patientName}</h3>
                      <p className="text-sm text-gray-600">{request.patientEmail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{request.submittedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 border-gray-300 shadow-sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detay
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      className="bg-green-600 hover:bg-gray-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Onayla
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(request.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reddet
                    </Button>
                  </div>
                </div>
                {request.notes && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-700">{request.notes}</p>
                  </div>
                )}
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Bekleyen onay talebi bulunmuyor</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Onay Talepleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Hasta</th>
                  <th className="text-left p-3 font-medium">Durum</th>
                  <th className="text-left p-3 font-medium">Tarih</th>
                  <th className="text-left p-3 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {approvalRequests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {request.patientName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{request.patientName}</div>
                          <div className="text-sm text-gray-500">{request.patientEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {request.submittedAt}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          className="p-2"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              className="p-2 text-gray-600 hover:text-gray-800"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <Dialog open={showDetailModal} onOpenChange={(open) => { if (!open) setShowDetailModal(false); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Onay Talebi Detayı</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div><b>Hasta:</b> {selectedRequest.patientName}</div>
              <div><b>E-posta:</b> {selectedRequest.patientEmail}</div>
              <div><b>Durum:</b> {selectedRequest.status === 'pending' ? 'Beklemede' : selectedRequest.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}</div>
              <div><b>Tarih:</b> {selectedRequest.submittedAt}</div>
              {selectedRequest.notes && (
                <div><b>Notlar:</b> {selectedRequest.notes}</div>
              )}
            </div>
            <Button onClick={() => setShowDetailModal(false)} className="w-full mt-4">Kapat</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PatientApprovals;
