import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3005";
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { withCredentials: true });
  }
  return socket;
}

export default getSocket;
