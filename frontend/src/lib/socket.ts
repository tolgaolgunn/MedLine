import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:3005", { transports: ["websocket"] });
  }
  return socket;
};

export default getSocket;
