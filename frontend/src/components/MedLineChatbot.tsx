import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Paperclip } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
    role: "user" | "bot";
    content: string;
    image?: string;
}

const MedLineChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", content: "Merhaba! Ben MedLine Asistanı. Size nasıl yardımcı olabilirim?" },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, selectedImage]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
        }
    };

    const cancelImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const sendMessage = async () => {
        if (!input.trim() && !selectedImage) return;

        const imageUrl = selectedImage ? URL.createObjectURL(selectedImage) : undefined;
        const userMessage: Message = {
            role: "user",
            content: input,
            image: imageUrl
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsLoading(true);

        try {
            let response;
            let data;

            if (selectedImage) {
                const formData = new FormData();
                if (input.trim()) {
                    // If there's text with the image, you might want to send it too, 
                    // but the prompt spec says "if image exists => /api/analyze_image"
                    // and doesn't explicitly mention sending text with it, 
                    // but usually 'prompt' is needed. 
                    // The prompt spec description says: Body: "multipart/form-data" formatında "file" anahtarı ile resim gönderilmeli.
                    // It doesn't mention the text field for /api/analyze_image. 
                    // I will just send the file as requested.
                }
                formData.append("file", selectedImage);
                // Backend requires 'modality'. Defaulting to 'mri' for now as there is no UI selector.
                formData.append("modality", "mri");

                response = await fetch("http://127.0.0.1:8000/api/analyze_image", {
                    method: "POST",
                    body: formData, // Content-Type header is set automatically for FormData
                });

                if (!response.ok) throw new Error("Görüntü analiz hatası");
                data = await response.json();
                // API spec: { "data": "Analiz sonucu..." }
                const botMessage: Message = { role: "bot", content: data.data };
                setMessages((prev) => [...prev, botMessage]);

            } else {
                // Text only (RAG Chat)
                response = await fetch("http://127.0.0.1:8000/api/rag_chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ question: userMessage.content }),
                });

                if (!response.ok) throw new Error("API hatası");
                data = await response.json();
                const botMessage: Message = { role: "bot", content: data.answer };
                setMessages((prev) => [...prev, botMessage]);
            }

        } catch (error) {
            console.error("Chatbot API Error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "bot", content: "Üzgünüm, şu anda işleminizi gerçekleştiremiyorum. Lütfen daha sonra tekrar deneyin." },
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
                                    {message.image && (
                                        <div className="mb-2">
                                            <img src={message.image} alt="Uploaded content" className="max-w-full rounded-lg" />
                                        </div>
                                    )}
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
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2 text-sm shadow-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>MedLine düşünüyor...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        {selectedImage && (
                            <div className="mb-2 relative inline-block">
                                <img
                                    src={URL.createObjectURL(selectedImage)}
                                    alt="Preview"
                                    className="h-20 w-auto rounded border border-gray-300"
                                />
                                <button
                                    onClick={cancelImage}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={selectedImage ? "Resim hakkında bir şey yazın... (Opsiyonel)" : "Bir soru sorun..."}
                                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700"
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || (!input.trim() && !selectedImage)}
                                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <Send className="w-5 h-5" />
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
