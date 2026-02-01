import React, { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Play, Mic, MicOff, Video, VideoOff, PhoneOff, Star } from "lucide-react";
import getSocket from "../../lib/socket";

interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  patientAge: number;
  specialty: string;
  date: string;
  time: string;
  type: "online" | "face_to_face";
  status: "confirmed" | "pending" | "completed" | "cancelled";
}

interface StartAppointmentButtonProps {
  appointments: Appointment[];
  handleStartAppointment: (id: number) => void;
  isCurrentAppointment: (app: Appointment) => boolean;
}

const StartAppointmentButton: React.FC<StartAppointmentButtonProps> = ({
  appointments,
  handleStartAppointment,
  isCurrentAppointment,
}) => {
  const [open, setOpen] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string>("");
  
  // Yeni state'ler
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showRatingExitConfirm, setShowRatingExitConfirm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const socket = getSocket();

  // ✅ Socket bağlantısı ve ID alma
  useEffect(() => {
    const handleConnect = () => {
      setSocketId(socket.id || null);
      console.log("Socket connected:", socket.id);
    };

    socket.on("connect", handleConnect);

    // Eğer socket zaten bağlıysa ID'yi hemen al
    if (socket.connected) {
      setSocketId(socket.id || null);
    }

    return () => {
      socket.off("connect", handleConnect);
    };
  }, []);

  // Çıkış işlemi
  const handleExit = () => {
    setShowExitConfirm(true);
  };

  // Çıkışı onayla
  const confirmExit = () => {
    setShowExitConfirm(false);
    setOpen(false);
    setShowRating(true);
  };

  // Çıkışı iptal et
  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  // Değerlendirme modalından çıkış isteği
  const handleRatingExit = () => {
    setShowRatingExitConfirm(true);
  };

  // Değerlendirme çıkışını onayla
  const confirmRatingExit = () => {
    setShowRatingExitConfirm(false);
    setShowRating(false);
    setRating(0);
    setComment("");
  };

  // Değerlendirme çıkışını iptal et
  const cancelRatingExit = () => {
    setShowRatingExitConfirm(false);
  };

  // Değerlendirmeyi gönder
  const submitRating = () => {
    console.log("Değerlendirme gönderildi:", { rating, comment });
    // Geri bildirim kısmına değerlendirme gönder
    const feedback = {
      type: 'değerlendirme' as const,
      title: `Canlı Görüşme Değerlendirmesi - ${rating} Yıldız`,
      message: comment || `Değerlendirme: ${rating} yıldız`,
      status: 'Gönderildi' as const,
      createdAt: new Date().toISOString()
    };
    
    // LocalStorage'dan mevcut geri bildirimleri al
    const existingFeedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    existingFeedbacks.push(feedback);
    localStorage.setItem('feedbacks', JSON.stringify(existingFeedbacks));
    
    setShowRating(false);
    setRating(0);
    setComment("");
  };

  // ✅ Video görüşmesi başlat
  const startVideoCall = async () => {
    setOpen(true);

    // Find current appointment and set patientId
    const current = appointments.find((app) => isCurrentAppointment(app));
    if (!current) return;
    setPatientId(String(current.patientId));

    try {
      // Kamera ve mikrofon erişimi
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMicOn(true);
      setCamOn(true);

      // WebRTC Peer oluştur
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerRef.current = peer;

      // Local stream ekle
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      // ICE Candidate gönder
      peer.onicecandidate = (event) => {
        if (event.candidate && patientId) {
          socket.emit("signal", {
            to: patientId,
            data: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      // Remote stream al
      peer.ontrack = (event) => {
        const [remoteStreamObj] = event.streams;
        setRemoteStream(remoteStreamObj);
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = remoteStreamObj;
      };

      // Offer oluştur ve gönder
      if (patientId) {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("signal", { to: patientId, data: { type: "offer", offer } });
      }

      // Signaling eventleri dinle
      const handleSignal = async ({ from, data }: any) => {
        if (!peerRef.current) return;

        if (data.type === "answer") {
          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        } else if (data.type === "candidate") {
          try {
            await peerRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } catch (e) {
            console.error("ICE Candidate error:", e);
          }
        }
      };

      socket.on("signal", handleSignal);
    } catch (err) {
      console.error("Camera access error:", err);
      setOpen(false); // Hata durumunda dialog'u kapat
    }
  };

  // ✅ Mikrofon kapat/aç
  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micOn;
      });
      setMicOn(!micOn);
    }
  };

  // ✅ Kamera kapat/aç
  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !camOn;
      });
      setCamOn(!camOn);
    }
  };

  // ✅ Dialog kapanınca video + peer temizle
  useEffect(() => {
    if (!open) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      setRemoteStream(null);
      
      // Signal event listener'ını temizle
      socket.off("signal");
    }
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        className="w-full border-2 border-gray-300 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors"
        onClick={() => {
          const current = appointments.find((app) =>
            isCurrentAppointment(app)
          );
          if (current) {
            handleStartAppointment(current.id);
            startVideoCall();
          }
        }}
      >
        <Play className="w-4 h-4 mr-2" />
        Online Randevuyu Başlat
      </Button>

      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent 
          className="max-w-full w-full [&>button]:hidden" 
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Görüntülü Sohbet</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-[2500px] h-[400px] rounded-lg object-cover bg-black"
            />
            {remoteStream && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full max-w-[2500px] h-[400px] rounded-lg object-cover bg-black mt-4 border-2 border-blue-400"
              />
            )}
            <div className="flex gap-4 justify-center mt-2">
              <Button
                onClick={toggleMic}
                variant={micOn ? "default" : "outline"}
                size="icon"
              >
                {micOn ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6 text-red-500" />
                )}
              </Button>
              <Button
                onClick={toggleCam}
                variant={camOn ? "default" : "outline"}
                size="icon"
              >
                {camOn ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <VideoOff className="w-6 h-6 text-red-500" />
                )}
              </Button>
              <Button
                onClick={handleExit}
                variant="destructive"
                size="icon"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Çıkış Onay Modalı */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Çıkış Onayı</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Görüşmeden çıkış yapacaksınız. Onaylıyor musunuz?
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={cancelExit} className="border-2 border-gray-300 shadow-sm">
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmExit} className="border-2 border-gray-300 shadow-sm">
              Evet, Çıkış Yap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Değerlendirme Modalı */}
      <Dialog open={showRating} onOpenChange={() => {}}>
        <DialogContent 
          className="max-w-md [&>button]:hidden" 
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>MedLine Değerlendirme</DialogTitle>
            <DialogDescription>
              Bizi değerlendirin ve yorumunuzu paylaşın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            
            {/* Yıldız Değerlendirmesi */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Değerlendirme
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                                         <Star
                       className={`w-6 h-6 ${
                         star <= rating
                           ? "text-black fill-current"
                           : "text-gray-300"
                       }`}
                     />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {rating === 0 && "Değerlendirme seçin"}
                {rating === 1 && "Çok Kötü"}
                {rating === 2 && "Kötü"}
                {rating === 3 && "Orta"}
                {rating === 4 && "İyi"}
                {rating === 5 && "Çok İyi"}
              </p>
            </div>

            {/* Yorum Alanı */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Yorum
              </label>
                             <textarea
                 value={comment}
                 onChange={(e) => setComment(e.target.value)}
                 placeholder="MedLine hakkında yorumunuzu yazın..."
                 className="w-full p-3 border border-black rounded-md resize-none focus:outline-none focus:ring-0 focus:border-black"
                 rows={3}
                 maxLength={500}
               />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/500 karakter
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRatingExit} 
              className="border-2 border-gray-300 shadow-sm"
            >
              İptal
            </Button>
            <Button 
              onClick={submitRating}
              disabled={rating === 0}
              className="border-2 border-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Değerlendirmeyi Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Değerlendirme Çıkış Onay Modalı */}
      <Dialog open={showRatingExitConfirm} onOpenChange={setShowRatingExitConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Çıkış Onayı</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Değerlendirme sayfasından çıkış yapacaksınız. Onaylıyor musunuz?
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={cancelRatingExit} className="border-2 border-gray-300 shadow-sm">
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmRatingExit} className="border-2 border-gray-300 shadow-sm">
              Evet, Çıkış Yap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default StartAppointmentButton;
