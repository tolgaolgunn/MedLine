import os
import shutil
import glob
from groq import Groq
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    def __init__(self):
        self.vector_store = None
        # PDF işleme için embedding modeli (Aynı kalıyor)
        self.embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        self.persist_directory = "./vector_store"
        
        # Groq Başlatma
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model_name = "llama-3.3-70b-versatile"

    def ingest_documents(self):
        """Knowledge Base klasöründeki PDF'leri okur ve vektör yapar."""
        if not os.path.exists("./knowledge_base"):
            os.makedirs("./knowledge_base")
            return

        pdf_files = glob.glob("./knowledge_base/*.pdf")
        current_file_count = len(pdf_files)
        
        count_file_path = os.path.join(self.persist_directory, "file_count.txt")
        saved_file_count = -1
        
        if os.path.exists(count_file_path):
            with open(count_file_path, "r") as f:
                try: saved_file_count = int(f.read().strip())
                except: pass

        index_file = os.path.join(self.persist_directory, "chroma.sqlite3")
        if os.path.exists(self.persist_directory) and os.path.exists(index_file) and current_file_count == saved_file_count:
            print(f">>> [RAG] Veritabanı güncel ({current_file_count} dosya).")
            self.vector_store = Chroma(persist_directory=self.persist_directory, embedding_function=self.embedding_model)
            return

        print("--- 🔄 PDF'ler Yeniden İndeksleniyor... ---")
        if os.path.exists(self.persist_directory):
            shutil.rmtree(self.persist_directory)

        try:
            loader = PyPDFDirectoryLoader("./knowledge_base")
            docs = loader.load()
            if not docs: return

            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = splitter.split_documents(docs)
            
            self.vector_store = Chroma.from_documents(
                documents=chunks, 
                embedding=self.embedding_model,
                persist_directory=self.persist_directory
            )
            
            with open(count_file_path, "w") as f:
                f.write(str(current_file_count))
            print("--- ✅ İndeksleme Tamamlandı. ---")
        except Exception as e:
            print(f"!!! İndeksleme Hatası: {e}")

    def get_relevant_context(self, query):
        if not self.vector_store:
            if os.path.exists(self.persist_directory):
                self.vector_store = Chroma(persist_directory=self.persist_directory, embedding_function=self.embedding_model)
            else: return ""
        try:
            docs = self.vector_store.similarity_search(query, k=3)
            return "\n\n".join([doc.page_content for doc in docs])
        except: return ""

    def ask_llm(self, context, question):
        """Groq API kullanarak hızlı yanıt üretir."""
        full_prompt = (
            "Sen yardımsever bir tıbbi yapay zeka asistanısın.\n"
            "Görevin, kullanıcının sorularını bağlama (context) dayalı veya genel tıbbi bilginle yanıtlamaktır.\n\n"
            f"Bağlam Bilgisi:\n{context}\n\n"
            f"Kullanıcı Sorusu: {question}\n"
            "Cevap (Doğrudan ve Türkçe):"
        )
        
        try:
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.3,
                max_tokens=1024,
                top_p=1,
                stream=False
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"Hata oluştu: {str(e)}"

    def ask_vision(self, image_data, modality):
        """Groq Llama-3.2 Vision modeli ile resim analizi (Opsiyonel)"""
        # Şimdilik text odaklı devam ediyoruz, isterseniz vision modelini buraya ekleyebiliriz.
        return {"result": "Vision analizi bu versiyonda Groq Llama-3.2-Vision ile yapılabilir."}