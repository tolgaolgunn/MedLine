import os
import requests
import re
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# Kaggle URL'si (Kaggle'da her açtığında değişen URL'yi buraya yaz veya .env'e koy)
KAGGLE_API_URL = os.getenv("KAGGLE_API_URL", "https://quyen-unheatable-abatingly.ngrok-free.dev")

class RAGService:
    def __init__(self):
        self.vector_store = None
        # Sadece bu küçük model bilgisayarında kalacak (80MB)
        self.embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self.persist_directory = "./vector_store"
        
    def ingest_documents(self):
        """Knowledge Base klasöründeki PDF'leri okur ve vektör yapar."""
        if not os.path.exists("./knowledge_base"):
            os.makedirs("./knowledge_base")
            print("Uyarı: knowledge_base klasörü boş.")
            return

        print("--- PDF'ler Yükleniyor ---")
        loader = PyPDFDirectoryLoader("./knowledge_base")
        docs = loader.load()
        
        if not docs:
            print("PDF bulunamadı.")
            return

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents(docs)
        
        self.vector_store = Chroma.from_documents(
            documents=chunks, 
            embedding=self.embedding_model,
            persist_directory=self.persist_directory
        )
        print(f"--- {len(chunks)} Parça Veri İndekslendi ---")

    def get_relevant_context(self, query):
        """Soruyu vektöre çevirip veritabanında arar."""
        if not self.vector_store:
            # Eğer yüklenmediyse diskten yüklemeyi dene
            self.vector_store = Chroma(persist_directory=self.persist_directory, embedding_function=self.embedding_model)
            
        docs = self.vector_store.similarity_search(query, k=3)
        context_text = "\n\n".join([doc.page_content for doc in docs])
        return context_text

    def ask_kaggle_llm(self, context, question):
        """Metni hazırlar ve Kaggle'a yollar."""
        full_prompt = f"""Aşağıdaki bilgilere göre cevapla. Sadece cevabı ver, düşünme sürecini (thought) yazma.
        BILGI: {context}
        SORU: {question}
        """
        
        payload = {"question": full_prompt}
        
        try:
            # Kaggle API'sine POST isteği
            resp = requests.post(f"{KAGGLE_API_URL}/api/rag_chat", json=payload, timeout=60)
            if resp.status_code == 200:
                answer = resp.json().get("answer")
                # <unused94>thought ... temizle
                if answer:
                    # Temizlenmiş cevap: <unused94>thought... sil
                    clean_answer = re.sub(r'<unused94>thought[\s\S]*?(?:<unused94>|$)', '', answer).strip()
                    # Bazen model cevabı sadece thought içinde veriyor, o zaman orijinali kalsın ama genelde temiz istiyoruz
                    return clean_answer if clean_answer else answer
                return answer
            else:
                return f"Kaggle Hatası: {resp.text}"
        except Exception as e:
            return f"Bağlantı Hatası: {e}"

    def ask_kaggle_vision(self, image_bytes):
        """Resmi Kaggle'a yollar."""
        files = {"file": ("image.jpg", image_bytes, "image/jpeg")}
        try:
            resp = requests.post(f"{KAGGLE_API_URL}/api/analyze_image", files=files, timeout=60)
            return resp.json()
        except Exception as e:
            return {"error": str(e)}