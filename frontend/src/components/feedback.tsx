import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { PageHeader } from './ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MoreHorizontal, Edit, Trash2, Send } from 'lucide-react';
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
  DialogTrigger,
} from './ui/dialog';
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

const FeedbackPage: React.FC = () => {
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

  const getStatusColor = (status: string) => {
    return "default"; // Tüm durumlar için siyah
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
                <div className="border rounded p-2">
                  <Select value={type} onValueChange={(value) => setType(value as FeedbackType)}>
                    <SelectTrigger>
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
                <label className="text-sm font-medium text-foreground">
                  Başlık
                </label>
                <div className="border rounded p-2">
                  <Textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Geri bildirim başlığını girin"
                    required
                    maxLength={TITLE_LIMIT}
                    className="min-h-[40px] resize-none break-words"
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
                <label className="text-sm font-medium text-foreground">
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
                    className="min-h-[120px] resize-none break-words"
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

              <Button type="submit" className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Gönder
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
              {feedbacks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz geri bildirim gönderilmedi
                </div>
              ) : (
                feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {feedback.title}
                        </h4>
                        <Badge variant={getStatusColor(feedback.status) as any}>
                          {feedback.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{feedback.type}</span>
                        <span>•</span>
                        <span>{feedback.createdAt}</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(feedback.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(feedback.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Geri Bildirim Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Geri Bildirim Türü
              </label>
              <div className="border rounded p-2">
                <Select value={editType} onValueChange={(value) => setEditType(value as FeedbackType)}>
                  <SelectTrigger>
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
              <label className="text-sm font-medium text-foreground">
                Başlık
              </label>
              <div className="border rounded p-2">
                <Textarea
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Geri bildirim başlığını girin"
                  required
                  maxLength={TITLE_LIMIT}
                  className="min-h-[40px] resize-none break-words"
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
              <label className="text-sm font-medium text-foreground">
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
                  className="min-h-[120px] resize-none break-words"
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

            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                className="w-30 h-10 bg-white text-gray-700 border-2 border-gray-300 rounded-md hover:bg-black hover:text-white hover:border-white transition-colors"
                onClick={() => setIsEditModalOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={!hasChanges()}
                className="w-30 h-10 bg-black text-white border border-black rounded-md hover:bg-white hover:text-black hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit className="w-4 h-4 mr-2" />
                Güncelle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackPage;