import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as DialogTitleComponent,
} from '../ui/dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { feedbackService, Feedback } from '../../services/feedbackService';
import { toast } from 'react-toastify';
import { Search, MessageSquare, Eye, Send } from 'lucide-react';

const Complaints = () => {
  // State declarations
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'responded'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load feedbacks
  const loadFeedbacks = async () => {
    try {
      const data = await feedbackService.getAllFeedbacks();
      console.log('Received feedback data:', data);
      // Ensure we're setting an array
      const feedbackArray = Array.isArray(data) ? data : [];
      console.log('Setting feedbacks:', feedbackArray);
      setFeedbacks(feedbackArray);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error("Geri bildirimleri yüklerken bir hata oluştu.");
      setFeedbacks([]); // Set empty array on error
    }
  };

  // Lifecycle hooks
  useEffect(() => {
    loadFeedbacks();
  }, []);

  // Process feedbacks with filtering and sorting
  const processedFeedbacks = useMemo(() => {
    if (!Array.isArray(feedbacks)) {
      return [];
    }

    const filtered = feedbacks.filter((feedback: Feedback) => {
      if (!feedback) return false;
      
      const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
      
      const matchesSearch = feedback.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          feedback.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          feedback.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });

    const sorted = [...filtered];
    sorted.sort((a: Feedback, b: Feedback) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [feedbacks, filterStatus, searchTerm, sortOrder]);

  const handleResponseSubmit = async () => {
    if (!selectedFeedback || !response.trim()) return;

    setIsSubmitting(true);
    try {
      await feedbackService.respondToFeedback(selectedFeedback.id, response);
      await loadFeedbacks();
      setShowDetailModal(false);
      setResponse('');
      toast.success("Geri bildirim yanıtı gönderildi.");
    } catch (error) {
      toast.error("Yanıt gönderilirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-black text-white border-black">Yeni</Badge>;
      case 'responded':
        return <Badge variant="outline" className="bg-black text-white border-black">Yanıtlandı</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 p-8">
      {/* Custom header to replace PageHeader */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Geri Bildirimler</h1>
        <p className="text-muted-foreground">Kullanıcı geri bildirimlerini yönetin</p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4 flex-col md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ara..."
                  className="w-full pl-8 pr-4 py-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="submitted">Yeni</option>
                <option value="responded">Yanıtlandı</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="newest">Tarihe göre (Önce en yeni)</option>
                <option value="oldest">Tarihe göre (Önce en eski)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedbacks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Geri Bildirimler ({processedFeedbacks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processedFeedbacks.map((feedback) => (
              <div key={feedback.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar>
                      <AvatarFallback>
                        {feedback.userName?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{feedback.userName}</h3>
                        {getStatusBadge(feedback.status)}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">{feedback.userName}</span>
                        <span className="text-sm text-gray-500">• {feedback.userEmail}</span>
                        <span className="text-sm text-gray-500">• {new Date(feedback.createdAt).toLocaleString('tr-TR')}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{feedback.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 border-gray-300 shadow-sm"
                      onClick={() => {
                        setSelectedFeedback(feedback);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detay
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {processedFeedbacks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Filtrelere uygun geri bildirim bulunamadı</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedFeedback && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitleComponent>Geri Bildirim Detayı</DialogTitleComponent>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><b>Kullanıcı:</b> {selectedFeedback.userName}</div>
                <div><b>E-posta:</b> {selectedFeedback.userEmail}</div>
                <div><b>Tarih:</b> {new Date(selectedFeedback.createdAt).toLocaleString('tr-TR')}</div>
                <div><b>Durum:</b> {
                  selectedFeedback.status === 'submitted' ? 'Yeni' :
                  selectedFeedback.status === 'responded' ? 'Yanıtlandı' :
                  selectedFeedback.status
                }</div>
              </div>
              
              <div>
                <b>Mesaj:</b> 
                <div className="mt-2 p-3 bg-gray-100 rounded-md">
                  {selectedFeedback.message}
                </div>
              </div>
              
              {selectedFeedback.response && (
                <div>
                  <b>Yanıt:</b>
                  <div className="mt-2 p-3 bg-gray-100 rounded-md">
                    {selectedFeedback.response}
                  </div>
                </div>
              )}
              
              {selectedFeedback.status === 'submitted' && (
                <div className="space-y-2">
                  <b>Yanıt Yaz:</b>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Geri bildirime yanıtınızı yazın..."
                    rows={4}
                    className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <Button 
                    onClick={handleResponseSubmit} 
                    disabled={isSubmitting || !response.trim()}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Yanıtı Gönder
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Complaints;