from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import io
from PIL import Image
# Dikkat: Ağır model loader'ları SİLDİK
from rag_service import RAGService
from dotenv import load_dotenv

# .env yükle (KAGGLE_API_URL burada olmalı)
load_dotenv()

app = FastAPI(title="MedLine AI Client (Lightweight)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RAG Servisi (Sadece PDF işler ve Kaggle'a sorar)
rag_service = RAGService()

# İstek Modeli
class ChatRequest(BaseModel):
    question: str

@app.on_event("startup")
async def startup_event():
    print(">>> [CLIENT] MedLine İstemcisi Başladı.")
    print(">>> PDF'ler taranıyor...")
    rag_service.ingest_documents() # PDF'leri vektöre çevir (Hızlıdır)

@app.post("/api/rag_chat")
async def rag_chat(req: ChatRequest):
    """
    1. PDF'ten bilgi bul.
    2. Kaggle'daki MedGemma'ya sor.
    """
    try:
        # 1. Yerel veritabanından bağlamı bul (Bilgisayarında çalışır - CPU)
        context = rag_service.get_relevant_context(req.question)
        if not context:
            context = "Veritabanında spesifik bilgi yok."

        # 2. Kaggle'a git ve cevabı al
        print(f"--> Kaggle'a Soruluyor: {req.question}")
        answer = rag_service.ask_kaggle_llm(context, req.question)
        
        return {"answer": answer}

    except Exception as e:
        print(f"HATA: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze_image")
async def analyze_image(file: UploadFile = File(...)):
    """
    Görüntüyü alır, Kaggle'a yollar.
    """
    try:
        image_data = await file.read()
        # Kaggle'a dosyayı forward et (ilet)
        result = rag_service.ask_kaggle_vision(image_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Bilgisayarında 8000 portunda çalışır
    uvicorn.run(app, host="0.0.0.0", port=8000)