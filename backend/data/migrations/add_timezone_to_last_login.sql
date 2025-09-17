-- Tüm timestamp kolonlarını timezone'lu hale getirelim
ALTER TABLE users 
ALTER COLUMN last_login TYPE TIMESTAMP WITH TIME ZONE,
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Mevcut created_at ve updated_at değerlerini Türkiye saatine çevirelim
UPDATE users 
SET created_at = timezone('Europe/Istanbul', created_at),
    updated_at = timezone('Europe/Istanbul', updated_at);

-- Varsayılan değerleri Türkiye saatine göre ayarlayalım
ALTER TABLE users 
ALTER COLUMN created_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP),
ALTER COLUMN updated_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP);

-- Veritabanı zaman dilimini ayarlayalım
ALTER DATABASE medline SET timezone TO 'Europe/Istanbul';