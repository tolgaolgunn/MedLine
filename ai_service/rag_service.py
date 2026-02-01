import os
import shutil
import glob
import google.generativeai as genai
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv

# Env yükle
load_dotenv()

# Google Gemini API Konfigürasyonu
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print("❌ HATA: GOOGLE_API_KEY .env dosyasında bulunamadı!")
    
genai.configure(api_key=GOOGLE_API_KEY)

class RAGService:
    def __init__(self):
        self.vector_store = None
        # PDF tarama için Türkçe destekli güçlü bir model
        self.embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        self.persist_directory = "./vector_store"
        
        # Gemini Modeli Başlatma
        try:
            self.model = genai.GenerativeModel("gemini-2.5-flash")
            print(">>> [Gemini] Model başarıyla başlatıldı: gemini-2.5-flash")
        except Exception as e:
            print(f"!!! [Gemini] Model başlatma hatası: {e}")
            self.model = None

    def ingest_documents(self):
        """Knowledge Base klasöründeki PDF'leri okur ve vektör yapar."""
        
        if not os.path.exists("./knowledge_base"):
            os.makedirs("./knowledge_base")
            print(">>> [UYARI] 'knowledge_base' klasörü oluşturuldu. Lütfen içine PDF ekleyin.")
            return

        # Mevcut PDF sayısını kontrol et
        pdf_files = glob.glob("./knowledge_base/*.pdf")
        current_file_count = len(pdf_files)
        
        # Kayıtlı dosya sayısını kontrol et
        count_file_path = os.path.join(self.persist_directory, "file_count.txt")
        saved_file_count = -1
        
        if os.path.exists(count_file_path):
            with open(count_file_path, "r") as f:
                try:
                    saved_file_count = int(f.read().strip())
                except:
                    pass

        # --- HIZLI BAŞLANGIÇ KONTROLÜ ---
        # Eğer dosya sayısı aynıysa ve DB varsa tekrar yükleme
        index_file = os.path.join(self.persist_directory, "chroma.sqlite3")
        if os.path.exists(self.persist_directory) and os.path.exists(index_file) and current_file_count == saved_file_count:
            print(f">>> [RAG] Mevcut veritabanı güncel ({current_file_count} dosya), yükleniyor...")
            self.vector_store = Chroma(
                persist_directory=self.persist_directory, 
                embedding_function=self.embedding_model
            )
            return
        # --------------------------------

        print(f"--- 🔄 Değişiklik Algılandı veya İlk Kurulum (PDF Sayısı: {current_file_count}) ---")
        print("--- ⏳ PDF'ler Yeniden İndeksleniyor (Lütfen bekleyin)... ---")
        
        # Eski veritabanını temizle
        if os.path.exists(self.persist_directory):
            try:
                shutil.rmtree(self.persist_directory)
                print(">>> [RAG] Eski veritabanı temizlendi.")
            except Exception as e:
                print(f"!!! [UYARI] Eski veritabanı silinemedi: {e}")

        try:
            loader = PyPDFDirectoryLoader("./knowledge_base")
            docs = loader.load()
            
            if not docs:
                print(">>> [UYARI] Klasörde PDF bulunamadı.")
                return

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000, 
                chunk_overlap=200,
                separators=["\n\n", "\n", " ", ""]
            )
            chunks = splitter.split_documents(docs)
            
            self.vector_store = Chroma.from_documents(
                documents=chunks, 
                embedding=self.embedding_model,
                persist_directory=self.persist_directory
            )
            
            # Dosya sayısını kaydet
            with open(count_file_path, "w") as f:
                f.write(str(current_file_count))
                
            print(f"--- ✅ {len(chunks)} Parça Veri Başarıyla İndekslendi ve Kaydedildi ---")
        except Exception as e:
            print(f"!!! İndeksleme Hatası: {e}")

    def get_relevant_context(self, query):
        """Soruyu vektöre çevirip veritabanında en alakalı kısımları arar."""
        if not self.vector_store:
            # Eğer bellekte yoksa diskten yüklemeyi dene
            if os.path.exists(self.persist_directory):
                self.vector_store = Chroma(persist_directory=self.persist_directory, embedding_function=self.embedding_model)
            else:
                return ""
            
        try:
            docs = self.vector_store.similarity_search(query, k=3)
            # Eğer belge bulunamazsa boş dön
            if not docs:
                return ""
            context_text = "\n\n".join([doc.page_content for doc in docs])
            return context_text
        except Exception as e:
            print(f"Context alma hatası: {e}")
            return ""

    def ask_kaggle_llm(self, context, question):
        """
        Artık Kaggle yerine doğrudan Google Gemini API (Flash) kullanıyor.
        Fonksiyon ismi geriye uyumluluk için değiştirilmedi.
        """
        if not self.model:
            return "Hata: Gemini modeli başlatılamadı. API Key kontrol edin."

        is_context_empty = False
        if not context or not context.strip():
            print("ℹ️ Bilgi: Context (Bağlam) boş. Model kendi genel bilgisini kullanacak.")
            is_context_empty = True
            context = "Bu soru için veritabanında özel bir döküman bulunamadı."

        print(f"DEBUG: Retrieved Context Snippet:\n{context[:500]}...\n")
        
        full_prompt = (
            "Sen yardımsever bir tıbbi yapay zeka asistanısın.\n"
            "Görevin, kullanıcının tıbbi sorularını yanıtlamaktır.\n\n"
            "YÖNERGELER:\n"
            "1. Aşağıda 'Bağlam Bilgisi' (Context) verilecektir. Öncelikle bu bilgiyi kontrol et.\n"
            "2. Eğer sorunun cevabı bağlam içinde varsa, bu kaynağı kullanarak cevap ver.\n"
            "3. Eğer bağlam boşsa veya sorunun cevabını içermiyorsa, **kendi genel tıbbi bilgini kullanarak** en doğru ve güvenilir cevabı ver.\n"
            "4. **ÖNEMLİ:** Cevaba doğrudan başla. 'Bağlamda bilgi yok, bu yüzden genel bilgimi kullanıyorum' gibi giriş cümleleri **KESİNLİKLE KURMA**.\n"
            "5. Cevabın açıklayıcı, yardımsever ve Türkçe olsun.\n\n"
            f"Bağlam Bilgisi (Context):\n{context}\n\n"
            f"Kullanıcı Sorusu: {question}\n"
        )
        
        print(f"📡 Google Gemini API'ye bağlanılıyor...")
        
        try:
            # Gemini generation config
            config = genai.GenerationConfig(
                temperature=0.3, # Biraz daha esneklik için 0.3
                max_output_tokens=2048, # Yanıtın kesilmemesi için artırıldı
            )
            
            # Safety Settings: Tıbbi soruların engellenmemesi için
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_ONLY_HIGH"
                },
            ]
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=config,
                safety_settings=safety_settings
            )
            
            print("✅ Gemini Cevap Verdi.")
            return response.text
                
        except Exception as e:
            print(f"❌ Gemini API Hatası: {e}")
            return f"Model Hatası: {str(e)}"