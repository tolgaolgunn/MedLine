
import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Message {
    sender: string;
    message: string;
    time: string;
    isSelf: boolean;
}

interface ChatComponentProps {
    roomId: string;
    senderName: string;
    socket: any;
    className?: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ roomId, senderName, socket, className }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket || !roomId) return;

        console.log(`ChatComponent: Joining room ${roomId}`);
        socket.emit('join-room', roomId);

        const handleReceiveMessage = (data: any) => {
            console.log("ChatComponent received:", data);
            const isSelf = data.sender === senderName;

            setMessages((prev) => [...prev, {
                sender: data.sender,
                message: data.message,
                time: new Date(data.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSelf
            }]);
        };

        socket.on('receive-message', handleReceiveMessage);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
        };
    }, [socket, roomId, senderName]);

    const sendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!currentMessage.trim() || !roomId) return;

        const messageData = {
            sender: senderName,
            roomId: roomId,
            message: currentMessage.trim()
        };

        console.log("ChatComponent sending:", messageData);
        socket.emit('send-message', messageData);
        setCurrentMessage("");
    };

    return (
        <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm border ${className}`}>
            <div className="p-3 border-b bg-gray-50 rounded-t-lg">
                <h3 className="font-semibold text-gray-700">Sohbet</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        Henüz mesaj yok. Sohbeti başlatın!
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${msg.isSelf
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                    }`}
                            >
                                {msg.message}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                {msg.isSelf ? 'Siz' : msg.sender} • {msg.time}
                            </span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t bg-gray-50 rounded-b-lg">
                <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Mesaj yazın..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!currentMessage.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ChatComponent;
