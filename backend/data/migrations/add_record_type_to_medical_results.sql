-- medical_results tablosuna record_type kolonu ekle
ALTER TABLE medical_results 
ADD COLUMN IF NOT EXISTS record_type VARCHAR(50);

-- Mevcut kayıtlar için varsayılan değer
UPDATE medical_results 
SET record_type = 'Diğer' 
WHERE record_type IS NULL;

