const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const chatWithAI = async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ message: "Question is required" });
        }

        console.log(`[AI Controller] Soru Python'a iletiliyor: ${question}`);

        const response = await axios.post(`${AI_SERVICE_URL}/api/rag_chat`, {
            question: question
        });

        return res.status(200).json({
            success: true,
            answer: response.data.answer
        });

    } catch (error) {
        console.error("[AI Chat Error]:", error.message);
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ success: false, message: "AI Servisi şu an çevrimdışı." });
        }
        return res.status(500).json({ success: false, message: "AI yanıtı alınamadı." });
    }
};

const analyzeImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Lütfen bir görüntü dosyası yükleyin." });
        }

        console.log(`[AI Controller] Görüntü işleniyor: ${req.file.filename}`);

        const filePath = req.file.path;

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        const response = await axios.post(`${AI_SERVICE_URL}/api/analyze_image`, form, {
            headers: {
                ...form.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        console.log("[AI Controller] Analiz tamamlandı, sonuç dönülüyor.");

        fs.unlink(filePath, (err) => {
            if (err) console.error("Geçici dosya silinirken hata:", err);
        });

        return res.status(200).json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error("[Vision Error]:", error.message);
        
        if (req.file && req.file.path) {
             fs.unlink(req.file.path, () => {}); 
        }

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ success: false, message: "AI Servisi (Vision) çevrimdışı." });
        }
        return res.status(500).json({ success: false, message: "Görüntü analizi başarısız oldu." });
    }
};

module.exports = { chatWithAI, analyzeImage };