from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_service import RAGService
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="MedLine AI Client (Interface)")

# CORS Ayarları (Frontend bağlantısı için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Geliştirme aşamasında tüm kaynaklara izin verelim
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_service = None

class ChatRequest(BaseModel):
    question: str

@app.on_event("startup")
async def startup_event():
    global rag_service
    print(">>> [CLIENT] MedLine İstemcisi Başlatılıyor...")
    try:
        rag_service = RAGService()
        # Veritabanını kontrol et / oluştur
        rag_service.ingest_documents() 
        print(">>> [CLIENT] RAG Servisi Hazır.")
    except Exception as e:
        print(f"!!! KRİTİK HATA: RAG Servisi başlatılamadı: {e}")
        rag_service = None

@app.post("/api/rag_chat")
async def rag_chat(req: ChatRequest):
    global rag_service
    if not rag_service:
        raise HTTPException(status_code=503, detail="AI Servisi henüz başlatılamadı.")

    try:
        # 1. Yerel veritabanından bağlam (context) bul
        context = rag_service.get_relevant_context(req.question)
        if not context:
            context = "Veritabanında bu konuyla ilgili spesifik bir doküman bulunamadı. Genel tıbbi bilginle cevapla."

        print(f"--> Soru Kaggle'a iletiliyor: {req.question}")
        
        # 2. Bağlam + Soruyu Kaggle LLM'e gönder
        answer = rag_service.ask_kaggle_llm(context, req.question)
        
        return {"answer": answer}

    except Exception as e:
        print(f"HATA: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze_image")
async def analyze_image(
    file: UploadFile = File(...),
    modality: str = Form(...)
):
    global rag_service
    if not rag_service:
        raise HTTPException(status_code=503, detail="AI Servisi hazır değil.")
        
    try:
        image_data = await file.read()
        # Kaggle'a resmi ve modaliteyi gönder
        result = rag_service.ask_kaggle_vision(image_data, modality)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Localhost 8000 portunda çalıştır
    uvicorn.run(app, host="0.0.0.0", port=8000)