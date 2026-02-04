-- Rapor ilaçları tablosu
-- Bu tablo, raporlara eklenen ilaçları saklar
-- medical_report tablosu zaten mevcut

CREATE TABLE IF NOT EXISTS report_medications (
    medication_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES medical_report(report_id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100),
    duration VARCHAR(100),
    usage_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_report_medications_report_id ON report_medications(report_id);

-- Yorum: Migration tamamlandı
-- Kullanım: psql -d medline -f add_report_medications_table.sql
