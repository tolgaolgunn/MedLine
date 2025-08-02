import React, { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Play, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
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
  const [patientId, setPatientId] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const socket = getSocket();

  // ✅ Socket bağlantısı ve ID alma
  useEffect(() => {
    socket.on("connect", () => {
      setSocketId(socket.id);
      console.log("Socket connected:", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, [socket]);

  // ✅ Video görüşmesi başlat
  const startVideoCall = async () => {
    setOpen(true);

    // Find current appointment and set patientId
    const current = appointments.find((app) => isCurrentAppointment(app));
    if (!current) return;
    setPatientId(current.patientId.toString());

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

      // ✅ Signaling eventleri dinle
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

      // Cleanup on close
      return () => {
        socket.off("signal", handleSignal);
      };
    } catch (err) {
      console.error("Camera access error:", err);
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
    }
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        className="w-full bg-white hover:bg-gray-50"
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-full w-full">
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
                onClick={() => setOpen(false)}
                variant="destructive"
                size="icon"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StartAppointmentButton;
