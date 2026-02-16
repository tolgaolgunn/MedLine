import React, { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Phone, PhoneOff, Star } from "lucide-react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import getSocket from "../lib/socket";

interface Props {
  userId: string;
}

const PatientVideoCallButton: React.FC<Props> = ({ userId }) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [incoming, setIncoming] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showRatingExitConfirm, setShowRatingExitConfirm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [fromId, setFromId] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Bekleniyor...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Store the incoming offer to accept later
  const pendingOfferRef = useRef<any>(null);

  // Store incoming candidates before remote description is set
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Keep track of the active socket to prevent closure issues
  const socket = getSocket();

  // --- Socket Logic ---

  const handleSignal = useCallback((payload: { from: string, data: any }) => {
    const { from, data } = payload;
    console.log("Patient received signal:", data.type, "from:", from);

    if (data.type === "offer") {
      console.log("Patient: Received offer from doctor:", from);
      pendingOfferRef.current = data.offer;
      setFromId(from);
      if (data.appointmentId) {
        setAppointmentId(data.appointmentId);
      }
      setIncoming(true);
      pendingCandidatesRef.current = []; // Reset candidates for new call
    }

    else if (data.type === "candidate") {
      // Case 1: Active Connection
      if (peerRef.current && peerRef.current.remoteDescription) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch(e => console.error("Patient: Error adding active candidate:", e));
      }
      // Case 2: Pending buffer (waiting to accept call)
      else if (pendingOfferRef.current && from === fromId) {
        console.log("Patient: Buffering candidate from doctor...");
        pendingCandidatesRef.current.push(data.candidate);
      }
    }

    else if (data.type === "end_call" || data.type === 'hangup') {
      console.log("Patient: Call ended by doctor");
      setIncoming(false);
      setOpen(false); // Triggers cleanup via useEffect
      setFromId(null);
      pendingOfferRef.current = null;
      pendingCandidatesRef.current = [];
    }
  }, [fromId]); // Depend on fromId to correctly buffer candidates for the specific caller

  useEffect(() => {
    console.log("PatientVideoCallButton mounted. userId:", userId);

    if (!userId) {
      console.error("PatientVideoCallButton: Missing userId! Socket join aborted.");
      return;
    }

    const roomID = String(userId).trim();

    const emitJoin = () => {
      console.log(`Socket connected (${socket.id}). Emitting join for room: ${roomID}`);
      socket.emit("join", roomID);
    };

    if (socket.connected) {
      emitJoin();
    }

    // Register listeners
    socket.on("connect", emitJoin);
    socket.on("signal", handleSignal);

    return () => {
      socket.off("signal", handleSignal);
      socket.off("connect", emitJoin);
    };
  }, [userId, handleSignal, socket]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);


  const acceptCall = async () => {
    if (!pendingOfferRef.current || !fromId) return;

    setIncoming(false);
    setMicOn(true);
    setCamOn(true);
    setOpen(true);
    setConnectionStatus("Bağlanıyor...");

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.relay.metered.ca:80" },
        {
          urls: "turn:global.relay.metered.ca:80",
          username: "71b0ffcc2ddbdaea66f18a13",
          credential: "nKRUR00WE2jnrzXv",
        },
        {
          urls: "turn:global.relay.metered.ca:80?transport=tcp",
          username: "71b0ffcc2ddbdaea66f18a13",
          credential: "nKRUR00WE2jnrzXv",
        },
        {
          urls: "turn:global.relay.metered.ca:443",
          username: "71b0ffcc2ddbdaea66f18a13",
          credential: "nKRUR00WE2jnrzXv",
        },
        {
          urls: "turns:global.relay.metered.ca:443?transport=tcp",
          username: "71b0ffcc2ddbdaea66f18a13",
          credential: "nKRUR00WE2jnrzXv",
        },
      ],
    });
    peerRef.current = peer;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }

      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      peer.onicecandidate = (event) => {
        if (event.candidate && fromId) {
          socket.emit('signal', {
            to: fromId,
            from: socket.id, // CRITICAL: Identify sender
            data: {
              type: 'candidate',
              candidate: event.candidate
            }
          });
        }
      };

      peer.ontrack = (event) => {
        console.log("Patient: Received remote track");
        setRemoteStream(event.streams[0]);
      };

      peer.oniceconnectionstatechange = () => {
        console.log("Patient ICE Connection State Change:", peer.iceConnectionState);
        setConnectionStatus(peer.iceConnectionState);
      };

      // Set Remote Description (Offer)
      await peer.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));

      // Process buffered candidates immediately after remote description
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`Processing ${pendingCandidatesRef.current.length} buffered candidates...`);
        for (const candidate of pendingCandidatesRef.current) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Patient: Error adding buffered candidate:", e);
          }
        }
        pendingCandidatesRef.current = [];
      }

      // Create Answer
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      // Send Answer
      socket.emit('signal', {
        to: fromId,
        from: socket.id,
        data: {
          type: 'answer',
          answer
        }
      });

    } catch (err) {
      console.error("Patient: Error accepting call:", err);
      setOpen(false);
    }
  };
  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micOn;
      });
      setMicOn(!micOn);
    }
  };
  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !camOn;
      });
      setCamOn(!camOn);
    }
  };
  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    setOpen(false);
    setShowRating(true);
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  const handleRatingExit = () => {
    setShowRatingExitConfirm(true);
  };

  const confirmRatingExit = () => {
    setShowRatingExitConfirm(false);
    setShowRating(false);
    setRating(0);
    setComment("");
  };

  const cancelRatingExit = () => {
    setShowRatingExitConfirm(false);
  };

  const submitRating = async () => {
    console.log("Değerlendirme gönderildi:", { rating, comment, doctorId: fromId, appointmentId });

    if (!fromId || !appointmentId) {
      console.error("Missing doctorId or appointmentId");
    }

    try {
      const token = JSON.parse(localStorage.getItem('user') || '{}').token;
      await fetch(`${import.meta.env.VITE_API_URL}/rate-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: Number(fromId),
          rating,
          comment,
          appointmentId: Number(appointmentId)
        })
      });
      // Success handling
    } catch (error) {
      console.error("Failed to submit rating", error);
    }


    setShowRating(false);
    setRating(0);
    setComment("");
  };


  const declineCall = () => {
    if (fromId) {
      socket.emit('signal', {
        to: fromId,
        from: socket.id,
        data: { type: 'reject' }
      });
    }
    setIncoming(false);
    setFromId(null);
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
  };

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      // Cleanup tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      // Close Peer
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      setRemoteStream(null);
      pendingCandidatesRef.current = [];
    }
  }, [open]);

  return (
    <>
      <Dialog open={incoming} onOpenChange={(val) => {
        if (!val) declineCall();
        else setIncoming(val);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görüşmeye Katıl</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <span>Doktorunuz sizi görüntülü arıyor. Katılmak ister misiniz?</span>
            <div className="flex gap-4">
              <Button onClick={acceptCall} variant="default">
                <Phone className="w-6 h-6 mr-2" /> Görüşmeye Katıl
              </Button>
              <Button onClick={declineCall} variant="destructive">
                <PhoneOff className="w-6 h-6 mr-2" /> Reddet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl w-full p-6 [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold border-b pb-2">Görüntülü Sohbet <span className="text-sm font-normal text-gray-500">({connectionStatus})</span></DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full h-full min-h-[500px]">
            {/* SİZ (Hasta) */}
            <div className="relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden border shadow-inner">
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <span className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-md text-sm font-medium backdrop-blur-sm">
                Siz
              </span>
            </div>

            {/* DOKTOR */}
            <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden border-2 border-green-500 shadow-lg">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white/50 animate-pulse">
                  Doktor bağlanıyor...
                </div>
              )}
              <span className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-md text-sm font-medium backdrop-blur-sm">
                Doktor
              </span>
            </div>
          </div>
          <div className="flex gap-6 justify-center mt-6">
            <Button onClick={toggleMic} variant={micOn ? "secondary" : "destructive"} size="lg" className="rounded-full w-14 h-14 shadow-md">
              {micOn ? <Mic /> : <MicOff />}
            </Button>
            <Button onClick={toggleCam} variant={camOn ? "secondary" : "destructive"} size="lg" className="rounded-full w-14 h-14 shadow-md">
              {camOn ? <Video /> : <VideoOff />}
            </Button>
            <Button onClick={handleExit} variant="destructive" size="lg" className="rounded-full px-8 h-14 flex gap-2 font-bold shadow-md">
              <PhoneOff /> Görüşmeyi Sonlandır
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
      <Dialog open={showRating} onOpenChange={() => { }}>
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
                      className={`w-6 h-6 ${star <= rating
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

export default PatientVideoCallButton;
