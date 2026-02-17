import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Play, Mic, MicOff, Video, VideoOff, PhoneOff, Star } from "lucide-react";
import getSocket from "../../lib/socket";
import ChatComponent from "../ChatComponent";

interface Appointment {
  appointmentId?: number;
  id: number;
  appointment_id: number;
  doctorId?: number;
  doctor_id: number;
  patientId?: number;
  patient_id: number;
  patientName?: string;
  patientname: string;
  patientAge: string;
  specialty: string;
  date: string;
  time: string;
  datetime: string;
  type: "online" | "face_to_face";
  status: "confirmed" | "pending" | "completed" | "cancelled";
}

interface StartAppointmentButtonProps {
  appointments: Appointment[];
  handleStartAppointment: (id: number) => void;
  isCurrentAppointment: (app: Appointment) => boolean;
  currentDoctorId?: number;
}

const StartAppointmentButton: React.FC<StartAppointmentButtonProps> = ({
  appointments,
  handleStartAppointment,
  isCurrentAppointment,
  currentDoctorId
}) => {
  const [open, setOpen] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Hazırlanıyor...");

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
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  // Keep track of the patient ID we are currently calling
  const currentPatientIdRef = useRef<string | null>(null);

  const socket = getSocket();

  // --- Socket Event Handling ---

  const handleSignal = useCallback(async ({ from, data }: { from: string, data: any }) => {
    console.log("Doctor received signal:", data.type, "from:", from);

    // Filter out signals that aren't for the current call
    if (!open || !peerRef.current) return;

    try {
      if (data.type === "answer") {
        console.log("Doctor: Received answer, setting remote description");
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));

        // Process queued candidates now that remote description is set
        if (iceCandidatesQueue.current.length > 0) {
          console.log(`Doctor: Processing ${iceCandidatesQueue.current.length} queued candidates`);
          for (const candidate of iceCandidatesQueue.current) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Doctor: Error adding queued candidate:", e);
            }
          }
          iceCandidatesQueue.current = [];
        }
      }

      else if (data.type === "candidate") {
        if (peerRef.current.remoteDescription) {
          try {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error("Doctor: Error adding candidate:", e);
          }
        } else {
          console.log("Doctor: Queueing candidate (remote description not set)");
          iceCandidatesQueue.current.push(data.candidate);
        }
      }

      else if (data.type === "reject" || data.type === "end_call") {
        console.log("Doctor: Call rejected or ended by patient");
        alert("Hasta görüşmeyi sonlandırdı veya reddetti.");
        handleExit(); // Close the call cleanly
      }
    } catch (err) {
      console.error("Doctor: Signal handling error:", err);
    }
  }, [open]); // Depend on 'open' to filter signals when closed

  useEffect(() => {
    // Single registration of signal listener
    socket.on("signal", handleSignal);

    return () => {
      socket.off("signal", handleSignal);
    };
  }, [handleSignal]);


  // Remote stream geldiğinde video elementine bağla
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);


  // --- Call Logic ---

  const startVideoCall = async () => {
    const current = appointments.find((app) => isCurrentAppointment(app));
    if (!current) return;

    // @ts-ignore
    const pId = String(current.patient_id || current.patientId).trim();
    currentPatientIdRef.current = pId;

    setOpen(true);
    setConnectionStatus("Bağlanıyor...");

    try {
      // 1. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // IMPORTANT: Mute local video
      }
      setMicOn(true);
      setCamOn(true);

      // 2. Create Peer Connection
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

      // 3. Add Tracks
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      // 4. Handle ICE Candidates
      peer.onicecandidate = (event) => {
        if (event.candidate && pId) {
          socket.emit("signal", {
            to: pId,
            from: socket.id, // CRITICAL: Identify sender
            data: {
              type: "candidate",
              candidate: event.candidate
            }
          });
        }
      };

      // 5. Handle Remote Tracks
      peer.ontrack = (event) => {
        console.log("Doctor: Received remote track");
        setRemoteStream(event.streams[0]);
      };

      // 6. Connection State Monitoring
      peer.oniceconnectionstatechange = () => {
        console.log("Doctor ICE State:", peer.iceConnectionState);
        setConnectionStatus(peer.iceConnectionState);
      };

      // 7. Create and Send Offer
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      console.log("Doctor: Sending offer to", pId);

      const docIdToSend = currentDoctorId || (() => {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        return u.user_id || u.id;
      })();

      socket.emit("signal", {
        to: pId,
        from: socket.id, // CRITICAL: Identify sender
        data: {
          type: "offer",
          offer: offer,
          appointmentId: current.appointment_id || current.id,
          doctorId: docIdToSend
        }
      });

    } catch (err) {
      console.error("Doctor: Error starting call:", err);
      setOpen(false);
      setConnectionStatus("Hata oluştu");
    }
  };

  // --- Cleanup Logic ---

  const stopCall = useCallback(() => {
    // 1. Send end call signal if connected
    if (currentPatientIdRef.current && peerRef.current) {
      // Only send if we actually had a peer connection attempt
      socket.emit("signal", {
        to: currentPatientIdRef.current,
        from: socket.id,
        data: { type: "end_call" }
      });
    }

    // 2. Stop Tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // 3. Close Peer Connection
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    // 4. Reset State
    setRemoteStream(null);
    currentPatientIdRef.current = null;
    iceCandidatesQueue.current = [];
    setConnectionStatus("Hazırlanıyor...");
  }, [socket]);

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      stopCall();
    }
  }, [open, stopCall]);


  // --- UI Handlers ---

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

  const submitRating = () => {
    console.log("Değerlendirme gönderildi:", { rating, comment });
    const feedback = {
      type: 'değerlendirme' as const,
      title: `Canlı Görüşme Değerlendirmesi - ${rating} Yıldız`,
      message: comment || `Değerlendirme: ${rating} yıldız`,
      status: 'Gönderildi' as const,
      createdAt: new Date().toISOString()
    };

    const existingFeedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    existingFeedbacks.push(feedback);
    localStorage.setItem('feedbacks', JSON.stringify(existingFeedbacks));

    setShowRating(false);
    setRating(0);
    setComment("");
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
            // @ts-ignore
            handleStartAppointment(current.appointment_id || current.id);
            startVideoCall();
          }
        }}
      >
        <Play className="w-4 h-4 mr-2" />
        Online Randevuyu Başlat
      </Button>

      <Dialog open={open} onOpenChange={() => { /* Prevent closing on click outside */ }}>
        <DialogContent className="max-w-[95vw] md:max-w-6xl w-full p-6 [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold border-b pb-2">Görüntülü Sohbet <span className="text-sm font-normal text-gray-500">({connectionStatus})</span></DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-4 h-[600px]">
            {/* Sol Taraf: Video Alanı */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* SİZ (Doktor) */}
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

                {/* HASTA */}
                <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden border-2 border-blue-500 shadow-lg">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/50 animate-pulse">
                      Bağlantı bekleniyor...
                    </div>
                  )}
                  <span className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-md text-sm font-medium backdrop-blur-sm">
                    Hasta
                  </span>
                </div>
              </div>

              <div className="flex gap-6 justify-center mt-auto pb-2">
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
            </div>

            {/* Sağ Taraf: Chat Alanı */}
            <div className="w-full md:w-1/3 border-l pl-4 hidden md:block">
              {/* appointmentId is available in the 'current' appointment logic, but let's confirm scope. 
                    We need to access the appointment ID being used for the call.
                    In startVideoCall, we find 'current'. We need to store that ID in state or use a ref if we want to pass it here.
                    Looking at the existing code, 'startVideoCall' finds the appointment but doesn't seem to set a persistent 'currentAppointmentId' state that is easily accessible in render 
                    EXCEPT: The component props has 'appointments' and 'isCurrentAppointment'.
                    We can find the active appointment again here.
                */}
              {(() => {
                const currentApp = appointments.find(isCurrentAppointment);
                const appId = currentApp ? (currentApp.appointment_id || currentApp.id) : null;

                if (appId) {
                  return (
                    <ChatComponent
                      roomId={String(appId)}
                      senderName="Doktor"
                      socket={socket}
                      className="h-full border-none shadow-none"
                    />
                  );
                }
                return null;
              })()}
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
