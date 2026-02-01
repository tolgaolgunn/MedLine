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
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("join", userId);
    socket.on("signal", ({ from, data }) => {
      if (data.type === "offer") {
        setIncoming(true);
        setFromId(from);
      }
    });
    return () => {
      socket.off("signal");
    };
  }, [userId]);

  const acceptCall = async () => {
    setOpen(true);
    setIncoming(false);
    const socket = getSocket();
    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerRef.current = peer;
    // Get local media
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    peer.onicecandidate = (event) => {
      if (event.candidate && fromId) {
        socket.emit('signal', { to: fromId, data: { type: 'candidate', candidate: event.candidate } });
      }
    };
    peer.ontrack = (event) => {
      const [remoteStreamObj] = event.streams;
      setRemoteStream(remoteStreamObj);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamObj;
    };
    // Listen for offer (from doctor)
    socket.on('signal', async ({ from, data }) => {
      if (data.type === 'offer') {
        await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('signal', { to: from, data: { type: 'answer', answer } });
      } else if (data.type === 'candidate') {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) { /* ignore */ }
      }
    });
    // If offer was already received (fromId), set remote and answer immediately
    if (fromId) {
      // Listen for initial offer from doctor (should already be received)
      socket.emit('signal', { to: fromId, data: { type: 'ready' } });
    }
  };

  const declineCall = () => {
    setIncoming(false);
    setFromId(null);
    // Optionally, send decline signal
  };

  return (
    <>
      <Dialog open={incoming} onOpenChange={setIncoming}>
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
        <DialogContent className="max-w-full w-full">
          <DialogHeader>
            <DialogTitle>Görüntülü Sohbet</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-[1200px] h-[400px] rounded-lg object-cover bg-black" />
            {/* Remote video (doctor) */}
            {remoteStream && (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full max-w-[1200px] h-[400px] rounded-lg object-cover bg-black mt-4 border-2 border-blue-400" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientVideoCallButton;
