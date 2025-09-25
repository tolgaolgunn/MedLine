import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { PageHeader } from './ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MoreHorizontal, Edit, Trash2, Send, Loader2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { toast } from 'react-toastify';

type FeedbackType = 'ui_interface' | 'appointment_issue' | 'technical_support' | 'other';

interface Feedback {
  feedback_id: number;
  feedback_type: FeedbackType;
  title: string;
  message: string;
  status: 'submitted' | 'reviewing' | 'responded' | 'resolved';
  created_at: string;
  updated_at: string;
  admin_response?: string;
}

const FeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<FeedbackType>('ui_interface');
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [editType, setEditType] = useState<FeedbackType>('ui_interface');
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Add states for detail dialog
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  // API instance
  const api = axios.create({
  baseURL: 'http://localhost:3005/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000 // 10 seconds
});

  // Add request interceptor to include token
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const TITLE_LIMIT = 100;
  const MESSAGE_LIMIT = 500;

  // Fetch feedbacks
const fetchFeedbacks = async () => {
  try {
    setLoading(true);
    setError(null);

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    }

    const userData = JSON.parse(userStr);
    if (!userData?.user_id) {
      throw new Error('Kullanıcı bilgisi bulunamadı.');
    }

    // Updated endpoint to match backend route structure
    const response = await api.get(`/feedback/${userData.user_id}`);
    
    // Better response handling
    if (response.data) {
      setFeedbacks(Array.isArray(response.data) ? response.data : []);
    } else {
      throw new Error('Veri formatı geçersiz');
    }

  } catch (err: any) {
    console.error('Feedback loading error:', err);
    const errorMessage = err.response?.data?.message || err.message || 'Geri bildirimler yüklenemedi';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Submit new feedback
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    setSubmitting(true);
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('Kullanıcı bilgisi bulunamadı');
    }

    const userData = JSON.parse(userStr);
    
    // Log the request payload for debugging
    console.log('Sending feedback:', {
      user_id: userData.user_id,
      feedback_type: type,
      title,
      message
    });

    const response = await api.post('/feedback', {
      user_id: userData.user_id,
      feedback_type: type,
      title: title.trim(),
      message: message.trim()
    });

    // Log the response for debugging
    console.log('Server response:', response.data);

    if (response.data && response.data.success) {
      toast.success('Geri bildirim başarıyla gönderildi.');
      // Reset form
      setTitle('');
      setMessage('');
      setType('ui_interface');
      // Refresh feedback list
      await fetchFeedbacks();
    } else {
      throw new Error(response.data?.message || 'Geri bildirim gönderilemedi.');
    }
  } catch (err: any) {
    console.error('Error submitting feedback:', err);
    const errorMessage = err.response?.data?.message || err.message || 'Geri bildirim gönderilemedi.';
    toast.error(errorMessage);
  } finally {
    setSubmitting(false);
  }
};


  // Delete feedback
  const handleDelete = async (id: number) => {
    try {
      const response = await api.delete(`/feedback/${id}`);
      if (response.data.success) {
        await fetchFeedbacks();
        toast.success('Geri bildiriminiz başarıyla silindi.');
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      toast.error('Geri bildirim silinemedi.');
    }
  };
  
  const handleError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
  } else {
    toast.error('Bir hata oluştu.');
  }
};


  // View feedback detail
  const handleViewDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsDetailModalOpen(true);
  };

  // Update feedback
  const handleEdit = (id: number) => {
    const feedback = feedbacks.find(fb => fb.feedback_id === id);
    if (feedback) {
      setEditingFeedback(feedback);
      setEditType(feedback.feedback_type);
      setEditTitle(feedback.title);
      setEditMessage(feedback.message);
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedback || !editTitle || !editMessage) return;

    try {
      const response = await api.put(`/feedback/${editingFeedback.feedback_id}`, {
        feedback_type: editType,
        title: editTitle,
        message: editMessage
      });

      if (response.data.success) {
        await fetchFeedbacks();
        setIsEditModalOpen(false);
        setEditingFeedback(null);
        toast.success('Geri bildiriminiz başarıyla güncellendi');
      }
    } catch (err) {
      console.error('Error updating feedback:', err);
      toast.error('Geri bildirim güncellenemedi');
    }
  };

  const hasChanges = () => {
    if (!editingFeedback) return false;
    return (
      editType !== editingFeedback.feedback_type ||
      editTitle !== editingFeedback.title ||
      editMessage !== editingFeedback.message
    );
  };

  // Helper function to map backend types to display names
  const getFeedbackTypeDisplay = (backendType: FeedbackType): string => {
    const displayMap: Record<FeedbackType, string> = {
      'ui_interface': 'Arayüz Önerisi',
      'appointment_issue': 'Randevu Şikayeti',
      'technical_support': 'Teknik Destek',
      'other': 'Diğer'
    };
    return displayMap[backendType] || 'Diğer';
  };

  // Helper function to map backend status to display names
  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'submitted': 'Gönderildi',
      'reviewing': 'Değerlendiriliyor',
      'responded': 'Cevaplandı',
      'resolved': 'Çözüldü'
    };
    return statusMap[status] || status;
  };

  // Update status color function
  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const colorMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'submitted': 'default',
      'reviewing': 'secondary',
      'responded': 'default',
      'resolved': 'default'
    };
    return colorMap[status] || 'default';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader 
        title="Geri Bildirim"
        subtitle="Deneyimlerinizi paylaşın ve önerilerinizi iletin."
      />
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sol: Geri Bildirim Formu */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Yeni Geri Bildirim</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Geri Bildirim Türü
                </label>
                <Select value={type} onValueChange={(value) => setType(value as FeedbackType)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Tür seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ui_interface">Öneri</SelectItem>
                    <SelectItem value="appointment_issue">Şikayet</SelectItem>
                    <SelectItem value="technical_support">Teknik Destek</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Başlık
                </label>
                <Textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Geri bildirim başlığını girin"
                  required
                  maxLength={TITLE_LIMIT}
                  className="min-h-[40px] resize-none border-2 border-gray-300 focus:border-gray-400 focus:outline-none"
                />
                <div className="flex justify-end text-xs mt-1">
                  <span className="text-muted-foreground">
                    {title.length}/{TITLE_LIMIT}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Bildiriminiz
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= MESSAGE_LIMIT) {
                      setMessage(e.target.value);
                    }
                  }}
                  placeholder="Geri bildiriminizi detaylı olarak yazın..."
                  className="min-h-[120px] resize-none border-2 border-gray-300 focus:border-gray-400 focus:outline-none"
                  required
                  maxLength={MESSAGE_LIMIT}
                />
                <div className="flex justify-end text-xs mt-1">
                  <span className="text-muted-foreground">
                    {message.length}/{MESSAGE_LIMIT}
                  </span>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={submitting || !title.trim() || !message.trim()}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gönder
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sağ: Gönderilen Geri Bildirimler */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Gönderilen Geri Bildirimler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button 
                    onClick={() => fetchFeedbacks()} 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                  >
                    Tekrar Dene
                  </Button>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz geri bildirim gönderilmedi
                </div>
              ) : (
                feedbacks.map((feedback) => (
                  <div
                    key={feedback.feedback_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {feedback.title}
                        </h4>
                        <Badge variant={getStatusColor(feedback.status)}>
                          {mapStatus(feedback.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{getFeedbackTypeDisplay(feedback.feedback_type)}</span>
                        <span>•</span>
                        <span>{new Date(feedback.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetail(feedback)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detay
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(feedback.feedback_id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(feedback.feedback_id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Düzenleme Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Geri Bildirim Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Geri Bildirim Türü
              </label>
              <Select value={editType} onValueChange={(value) => setEditType(value as FeedbackType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tür seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ui_interface">Öneri</SelectItem>
                  <SelectItem value="appointment_issue">Şikayet</SelectItem>
                  <SelectItem value="technical_support">Teknik Destek</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Başlık
              </label>
              <Textarea
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Geri bildirim başlığını girin"
                required
                maxLength={TITLE_LIMIT}
                className="min-h-[40px] resize-none border-2 border-gray-300 focus:border-gray-400 focus:outline-none"
              />
              <div className="flex justify-end text-xs mt-1">
                <span className="text-muted-foreground">
                  {editTitle.length}/{TITLE_LIMIT}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Bildiriminiz
              </label>
              <Textarea
                value={editMessage}
                onChange={(e) => {
                  if (e.target.value.length <= MESSAGE_LIMIT) {
                    setEditMessage(e.target.value);
                  }
                }}
                placeholder="Geri bildiriminizi detaylı olarak yazın..."
                className="min-h-[120px] resize-none border-2 border-gray-300 focus:border-gray-400 focus:outline-none"
                required
                maxLength={MESSAGE_LIMIT}
              />
              <div className="flex justify-end text-xs mt-1">
                <span className="text-muted-foreground">
                  {editMessage.length}/{MESSAGE_LIMIT}
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={!hasChanges()}
              >
                <Edit className="w-4 h-4 mr-2" />
                Güncelle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Geri Bildirim Detayı</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Tür:</span>{' '}
                  {getFeedbackTypeDisplay(selectedFeedback.feedback_type)}
                </div>
                <div>
                  <span className="font-semibold">Durum:</span>{' '}
                  <Badge variant={getStatusColor(selectedFeedback.status)}>
                    {mapStatus(selectedFeedback.status)}
                  </Badge>
                </div>
                <div>
                  <span className="font-semibold">Tarih:</span>{' '}
                  {new Date(selectedFeedback.created_at).toLocaleString('tr-TR')}
                </div>
              </div>
              
              <div>
                <span className="font-semibold">Başlık:</span>
                <div className="mt-1 p-3 bg-gray-100 rounded-md">
                  {selectedFeedback.title}
                </div>
              </div>

              <div>
                <span className="font-semibold">Mesaj:</span>
                <div className="mt-1 p-3 bg-gray-100 rounded-md">
                  {selectedFeedback.message}
                </div>
              </div>

              {selectedFeedback.admin_response && (
                <div>
                  <span className="font-semibold">Yanıt:</span>
                  <div className="mt-1 p-3 bg-gray-100 rounded-md">
                    {selectedFeedback.admin_response}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackPage;