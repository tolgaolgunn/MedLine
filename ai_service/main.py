from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_service import RAGService
from dotenv import load_dotenv
import uvicorn
import os
import shutil
from contextlib import asynccontextmanager

load_dotenv()

rag_service = RAGService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(">>> [SERVER] MedLine Başlatılıyor...")
    rag_service.ingest_documents()
    print(">>> [SERVER] RAG ve Groq Sistemi Hazır.")
    yield

app = FastAPI(title="MedLine AI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str

@app.post("/api/rag_chat")
async def rag_chat(req: ChatRequest):
    try:
        # 1. Bağlamı getir
        context = rag_service.get_relevant_context(req.question)
        
        # 2. Groq ile yanıtla
        answer = rag_service.ask_llm(context, req.question)
        
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/speech_to_text")
async def stt_endpoint(file: UploadFile = File(...)):
    try:
        # 1. Gelen sesi geçici bir dosyaya kaydet
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. RAGService kullanarak sese çevir
        text_result = rag_service.speech_to_text(temp_filename)
        
        # 3. Geçici dosyayı sil
        os.remove(temp_filename)
        
        return {"text": text_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)