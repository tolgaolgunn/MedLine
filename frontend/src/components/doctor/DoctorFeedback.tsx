import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { PageHeader } from '../ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MoreHorizontal, Edit, Trash2, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'react-toastify';

type FeedbackType = "Öneri" | "Şikayet" | "Diğer";

interface Feedback {
  id: number;
  type: FeedbackType;
  title: string;
  message: string;
  status: "Gönderildi" | "Değerlendiriliyor" | "Cevaplandı";
  createdAt: string;
}

const initialFeedbacks: Feedback[] = [
  {
    id: 1,
    type: "Öneri",
    title: "Uygulama arayüzü",
    message: "Arayüz daha sade olabilir.",
    status: "Gönderildi",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    type: "Şikayet",
    title: "Randevu sorunu",
    message: "Randevu alamıyorum.",
    status: "Değerlendiriliyor",
    createdAt: "2024-01-14",
  },
  {
    id: 3,
    type: "Diğer",
    title: "Teknik destek",
    message: "Video görüşme özelliği çalışmıyor.",
    status: "Cevaplandı",
    createdAt: "2024-01-13",
  },
];

const DoctorFeedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);
  const [type, setType] = useState<FeedbackType>("Öneri");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [editType, setEditType] = useState<FeedbackType>("Öneri");
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const TITLE_LIMIT = 100;
  const MESSAGE_LIMIT = 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    const newFeedback: Feedback = {
      id: Date.now(),
      type,
      title,
      message,
      status: "Gönderildi",
      createdAt: new Date().toISOString().split('T')[0],
    };
    setFeedbacks([newFeedback, ...feedbacks]);
    setTitle("");
    setMessage("");
    toast.success("Geri bildiriminiz başarıyla gönderildi");
  };

  const handleDelete = (id: number) => {
    setFeedbacks(feedbacks.filter(fb => fb.id !== id));
    toast.success("Geri bildiriminiz başarıyla silindi");
  };

  const handleEdit = (id: number) => {
    const feedback = feedbacks.find(fb => fb.id === id);
    if (feedback) {
      setEditingFeedback(feedback);
      setEditType(feedback.type);
      setEditTitle(feedback.title);
      setEditMessage(feedback.message);
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedback || !editTitle || !editMessage) return;
    
    const updatedFeedbacks = feedbacks.map(fb => 
      fb.id === editingFeedback.id 
        ? { ...fb, type: editType, title: editTitle, message: editMessage }
        : fb
    );
    
    setFeedbacks(updatedFeedbacks);
    setIsEditModalOpen(false);
    setEditingFeedback(null);
    setEditType("Öneri");
    setEditTitle("");
    setEditMessage("");
    toast.success("Geri bildiriminiz başarıyla güncellendi");
  };

  const hasChanges = () => {
    if (!editingFeedback) return false;
    return (
      editType !== editingFeedback.type ||
      editTitle !== editingFeedback.title ||
      editMessage !== editingFeedback.message
    );
  };

  const getStatusColor = (_status: string) => {
    return "default"; // Tüm durumlar için siyah
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      <PageHeader 
        title="Geri Bildirim"
        subtitle="Deneyimlerinizi paylaşın ve önerilerinizi iletin."
      />
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Sol: Geri Bildirim Formu */}
        <Card className="flex-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">Yeni Geri Bildirim</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Geri Bildirim Türü
                </label>
                <div className="border rounded p-2">
                  <Select value={type} onValueChange={(value) => setType(value as FeedbackType)}>
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Tür seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Öneri">Öneri</SelectItem>
                      <SelectItem value="Şikayet">Şikayet</SelectItem>
                      <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Başlık
                </label>
                <div className="border rounded p-2">
                  <Textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Geri bildirim başlığını girin"
                    required
                    maxLength={TITLE_LIMIT}
                    className="min-h-[40px] resize-none break-words text-xs sm:text-sm"
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  />
                  <div className="flex justify-end text-xs mt-1">
                    <span className="text-muted-foreground">
                      {title.length}/{TITLE_LIMIT}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Bildiriminiz
                </label>
                <div className="border rounded p-2">
                  <Textarea
                    value={message}
                    onChange={(e) => {
                      if (e.target.value.length <= MESSAGE_LIMIT) {
                        setMessage(e.target.value);
                      }
                    }}
                    placeholder="Geri bildiriminizi detaylı olarak yazın..."
                    className="min-h-[100px] sm:min-h-[120px] resize-none break-words text-xs sm:text-sm"
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    required
                    maxLength={MESSAGE_LIMIT}
                  />
                  <div className="flex justify-end text-xs mt-1">
                    <span className="text-muted-foreground">
                      {message.length}/{MESSAGE_LIMIT}
                    </span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full text-xs sm:text-sm h-9 sm:h-10">
                <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Gönder
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sağ: Gönderilen Geri Bildirimler */}
        <Card className="flex-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">Gönderilen Geri Bildirimler</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2 sm:space-y-3">
              {feedbacks.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
                  Henüz geri bildirim gönderilmedi
                </div>
              ) : (
                feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 mb-1">
                        <h4 className="font-medium text-xs sm:text-sm truncate flex-1">
                          {feedback.title}
                        </h4>
                        <Badge variant={getStatusColor(feedback.status) as any} className="text-xs whitespace-nowrap">
                          {feedback.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="capitalize">{feedback.type}</span>
                        <span>•</span>
                        <span>{feedback.createdAt}</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs sm:text-sm">
                        <DropdownMenuItem onClick={() => handleEdit(feedback.id)} className="text-xs sm:text-sm">
                          <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(feedback.id)}
                          className="text-destructive text-xs sm:text-sm"
                        >
                          <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Geri Bildirim Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Geri Bildirim Türü
              </label>
              <div className="border rounded p-2">
                <Select value={editType} onValueChange={(value) => setEditType(value as FeedbackType)}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Tür seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Öneri">Öneri</SelectItem>
                    <SelectItem value="Şikayet">Şikayet</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Başlık
              </label>
              <div className="border rounded p-2">
                <Textarea
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Geri bildirim başlığını girin"
                  required
                  maxLength={TITLE_LIMIT}
                  className="min-h-[40px] resize-none break-words text-xs sm:text-sm"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                />
                <div className="flex justify-end text-xs mt-1">
                  <span className="text-muted-foreground">
                    {editTitle.length}/{TITLE_LIMIT}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Bildiriminiz
              </label>
              <div className="border rounded p-2">
                <Textarea
                  value={editMessage}
                  onChange={(e) => {
                    if (e.target.value.length <= MESSAGE_LIMIT) {
                      setEditMessage(e.target.value);
                    }
                  }}
                  placeholder="Geri bildiriminizi detaylı olarak yazın..."
                  className="min-h-[100px] sm:min-h-[120px] resize-none break-words text-xs sm:text-sm"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  required
                  maxLength={MESSAGE_LIMIT}
                />
                <div className="flex justify-end text-xs mt-1">
                  <span className="text-muted-foreground">
                    {editMessage.length}/{MESSAGE_LIMIT}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button 
                type="button" 
                className="w-full sm:w-auto h-9 sm:h-10 bg-white text-gray-700 border-2 border-gray-300 rounded-md hover:bg-black hover:text-white hover:border-white transition-colors text-xs sm:text-sm"
                onClick={() => setIsEditModalOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={!hasChanges()}
                className="w-full sm:w-auto h-9 sm:h-10 bg-black text-white border border-black rounded-md hover:bg-white hover:text-black hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Güncelle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorFeedback;
