import React, { useState, useRef, useEffect } from "react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { MessageCircle, X, Send, Bot, User, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
    role: "user" | "bot";
    content: string;
}

const MedLineChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", content: "Merhaba! Ben MedLine Asistanı. Size nasıl yardımcı olabilirim?" },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isListening, setIsListening] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };



    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const AI_API_URL = import.meta.env.VITE_AI_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://medline.onrender.com');
            const response = await fetch(`${AI_API_URL}//api/ai/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question: userMessage.content }),
            });

            if (!response.ok) {
                throw new Error("API hatası");
            }

            const data = await response.json();
            const botMessage: Message = { role: "bot", content: data.answer };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Chatbot API Error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "bot", content: "Üzgünüm, şu anda bağlantı kuramıyorum. Lütfen daha sonra tekrar deneyin." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendAudioToBackend(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsListening(true);
        } catch (error) {
            console.error("Mikrofon hatası:", error);
            alert("Mikrofona erişilemedi.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
        }
    };

    const sendAudioToBackend = async (audioBlob: Blob) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        try {
            const AI_API_URL = import.meta.env.VITE_AI_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://medline.onrender.com');
            const response = await fetch(`${AI_API_URL}//api/speech_to_text`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("STT servisi hatası");

            const data = await response.json();
            if (data.text) {
                setInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
            }
        } catch (error) {
            console.error("STT Hatası:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMicClick = () => {
        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 flex flex-col transition-all duration-300 ease-in-out transform origin-bottom-right" style={{ maxHeight: '600px', height: '500px' }}>
                    {/* Header */}
                    <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <Bot className="w-6 h-6" />
                            <h3 className="font-semibold text-lg">MedLine Asistan 🩺</h3>
                        </div>
                        <button
                            onClick={toggleChat}
                            className="text-white hover:bg-blue-700 p-1 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === "user" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        <User className="w-5 h-5" />
                                    ) : (
                                        <Bot className="w-5 h-5" />
                                    )}
                                </div>
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${message.role === "user"
                                        ? "bg-blue-600 text-white rounded-tr-none"
                                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                                        }`}
                                >
                                    {message.role === "bot" ? (
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        message.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 items-center">
                                <div className="w-8 h-8 rounded-xl bg-white border flex items-center justify-center shadow-sm">
                                    <Bot size={18} className="text-blue-600" />
                                </div>
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm flex flex-col items-center">
                                    <div style={{ width: '120px', height: '80px' }}>
                                        <DotLottieReact
                                            src="https://lottie.host/4b967155-20bf-4938-8141-3a4a4de207fb/Z81SC1ROX6.lottie"
                                            loop
                                            autoplay
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={isListening ? "Dinleniyor..." : "Bir soru sorun..."}
                                className={`flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 ${isListening ? "bg-red-50 border-red-200" : ""}`}
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !input.trim()}
                                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleMicClick}
                                disabled={isLoading}
                                className={`p-2 rounded-full transition-colors ${isListening
                                    ? "bg-red-500 text-white animate-pulse"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                title="Sesle Yaz"
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>


                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={toggleChat}
                className={`${isOpen ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
                    } text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center`}
                aria-label="MedLine Asistan ile sohbet edin"
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageCircle className="w-6 h-6" />
                )}
            </button>
        </div>
    );
};

export default MedLineChatbot;
