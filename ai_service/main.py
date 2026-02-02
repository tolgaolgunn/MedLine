from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_service import RAGService
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="MedLine AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_service = RAGService()

class ChatRequest(BaseModel):
    question: str

@app.on_event("startup")
async def startup_event():
    print(">>> [SERVER] MedLine Başlatılıyor...")
    rag_service.ingest_documents()
    print(">>> [SERVER] RAG ve Groq Sistemi Hazır.")

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)