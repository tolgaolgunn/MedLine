import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
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
        return <Badge variant="secondary">Beklemede</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = approvalRequests.filter(req => req.status === 'pending');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hasta Onayları</h1>
          <p className="text-muted-foreground">Bekleyen hasta onay taleplerini yönetin</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
            <div className="text-sm text-gray-600">Bekleyen Onay</div>
          </div>
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
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Bekleyen</p>
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
                <p className="text-2xl font-bold">
                  {approvalRequests.filter(req => req.status === 'approved').length}
                </p>
                <p className="text-sm text-muted-foreground">Onaylandı</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {approvalRequests.filter(req => req.status === 'rejected').length}
                </p>
                <p className="text-sm text-muted-foreground">Reddedildi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvalRequests.length}</p>
                <p className="text-sm text-muted-foreground">Toplam</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                        <Badge variant="outline">{getRequestTypeLabel(request.requestType)}</Badge>
                        <span className="text-sm text-gray-500">{request.submittedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
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
                      className="bg-green-600 hover:bg-green-700"
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
                  <th className="text-left p-3 font-medium">Talep Türü</th>
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
                      <Badge variant="outline">{getRequestTypeLabel(request.requestType)}</Badge>
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
                              className="p-2 text-green-600 hover:text-green-800"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Onay Talebi Detayı</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Hasta Bilgileri</h3>
                <p className="text-gray-600">{selectedRequest.patientName}</p>
                <p className="text-gray-600">{selectedRequest.patientEmail}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Talep Türü</h3>
                <Badge variant="outline">{getRequestTypeLabel(selectedRequest.requestType)}</Badge>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Durum</h3>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Tarih</h3>
                <p className="text-gray-600">{selectedRequest.submittedAt}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Belgeler</h3>
                <div className="space-y-2">
                  {selectedRequest.documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedRequest.notes && (
                <div>
                  <h3 className="font-medium text-gray-900">Notlar</h3>
                  <p className="text-gray-600">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
            {selectedRequest.status === 'pending' && (
              <div className="flex gap-2 mt-6">
                <Button
                  variant="default"
                  onClick={() => {
                    handleApprove(selectedRequest.id);
                    setShowDetailModal(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Onayla
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleReject(selectedRequest.id);
                    setShowDetailModal(false);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reddet
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientApprovals;
