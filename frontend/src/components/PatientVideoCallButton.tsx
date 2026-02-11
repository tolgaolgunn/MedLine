import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Phone, PhoneOff } from "lucide-react";
import getSocket from "../lib/socket";

interface Props {
  userId: string;
}

const PatientVideoCallButton: React.FC<Props> = ({ userId }) => {
  const [incoming, setIncoming] = useState(false);
  const [fromId, setFromId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Bekleniyor...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  /* 
     Store the incoming offer in a ref so we can accept it 
     later (when user clicks "Accept Call") 
  */
  const pendingOfferRef = useRef<any>(null);

  /* 
     Store incoming candidates in a ref to add after remote description is set
  */
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Remote stream geldiğinde video elementine bağla
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Keep track of active socket handlers to clean them up properly
  const activeSocketRef = useRef<any>(null);

  useEffect(() => {
    const socket = getSocket();
    activeSocketRef.current = socket;

    console.log("PatientVideoCallButton mounted. userId:", userId);

    if (!userId) {
      console.error("PatientVideoCallButton: Missing userId! Socket join aborted.");
      return;
    }

    // Ensure we join with string ID, Trim to remove any accidental whitespace
    const roomID = String(userId).trim();
    console.log("PatientVideoCallButton: Intended Room ID:", roomID);

    const emitJoin = () => {
      console.log(`Socket connected (${socket.id}). Emitting join for room: ${roomID}`);
      socket.emit("join", roomID);
    };

    if (socket.connected) {
      emitJoin();
    }

    // Always listen for connect/reconnect to join again
    // Always listen for connect/reconnect to join again
    socket.on("connect", emitJoin);

    const handleSignal = ({ from, data }: any) => {
      console.log("Patient received signal:", data.type, "from:", from, "data:", data);

      if (data.type === "offer") {
        console.log("Handling offer from doctor:", from);
        pendingOfferRef.current = data.offer; // Buffer the offer
        setFromId(from);
        setIncoming(true);
        // Clear previous candidates on new offer
        pendingCandidatesRef.current = [];
      }

      else if (data.type === "candidate") {
        // Case 1: Active Call - Add immediately
        if (peerRef.current && peerRef.current.remoteDescription) {
          peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
            .catch(e => console.error("Error adding active candidate:", e));
        }
        // Case 2: Setting up - Queue
        else if (pendingOfferRef.current && from === fromId) {
          console.log("Buffering candidate from doctor...");
          pendingCandidatesRef.current.push(data.candidate);
        }
      }

      else if (data.type === "end_call" || data.type === 'hangup') {
        console.log("Call ended/rejected");
        setIncoming(false);
        setFromId(null);
        pendingOfferRef.current = null;
        pendingCandidatesRef.current = [];
        setOpen(false);
      }
    };

    socket.on("signal", handleSignal);

    return () => {
      socket.off("signal", handleSignal);
      socket.off("connect", emitJoin);
    };
  }, [userId]);

  // Clean up media and peer when dialog closes
  useEffect(() => {
    if (!open) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      setRemoteStream(null);
      pendingCandidatesRef.current = [];
    }
  }, [open]);

  const acceptCall = async () => {
    if (!pendingOfferRef.current) return;
    setIncoming(false);
    setOpen(true);

    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerRef.current = peer;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      peer.onicecandidate = (event) => {
        if (event.candidate && fromId) {
          getSocket().emit('signal', { to: fromId, data: { type: 'candidate', candidate: event.candidate } });
        }
      };

      peer.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      peer.oniceconnectionstatechange = () => {
        console.log("Patient ICE Connection State Change:", peer.iceConnectionState);
        setConnectionStatus(peer.iceConnectionState);
      };

      await peer.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));

      // Process buffered candidates
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`Processing ${pendingCandidatesRef.current.length} buffered candidates...`);
        for (const candidate of pendingCandidatesRef.current) {
          await peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding buffered candidate:", e));
        }
        pendingCandidatesRef.current = [];
      }

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      getSocket().emit('signal', { to: fromId, data: { type: 'answer', answer } });

    } catch (err) {
      console.error(err);
      setOpen(false);
    }
  };


  const declineCall = () => {
    if (fromId) {
      const socket = getSocket();
      socket.emit('signal', { to: fromId, data: { type: 'reject' } });
    }
    setIncoming(false);
    setFromId(null);
    pendingOfferRef.current = null;
  };

  return (
    <>
      <Dialog open={incoming} onOpenChange={(val) => {
        // If dialog is closed by user clicking outside/escape without answering
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

          <div className="flex justify-center mt-6">
            <Button onClick={() => setOpen(false)} variant="destructive" size="lg" className="rounded-full px-8 h-14 flex gap-2 font-bold shadow-md">
              <PhoneOff /> Görüşmeyi Sonlandır
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientVideoCallButton;
