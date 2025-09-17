-- Hasta profilleri tablosu için timestamp düzeltmeleri
ALTER TABLE patient_profiles 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

UPDATE patient_profiles 
SET created_at = timezone('Europe/Istanbul', created_at),
    updated_at = timezone('Europe/Istanbul', updated_at);

ALTER TABLE patient_profiles 
ALTER COLUMN created_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP),
ALTER COLUMN updated_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP);

-- Doktor profilleri tablosu için timestamp düzeltmeleri
ALTER TABLE doctor_profiles 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

UPDATE doctor_profiles 
SET created_at = timezone('Europe/Istanbul', created_at),
    updated_at = timezone('Europe/Istanbul', updated_at);

ALTER TABLE doctor_profiles 
ALTER COLUMN created_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP),
ALTER COLUMN updated_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP);

-- Randevular tablosu için timestamp düzeltmeleri
ALTER TABLE appointments 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE,
ALTER COLUMN datetime TYPE TIMESTAMP WITH TIME ZONE;

UPDATE appointments 
SET created_at = timezone('Europe/Istanbul', created_at),
    updated_at = timezone('Europe/Istanbul', updated_at),
    datetime = timezone('Europe/Istanbul', datetime);

ALTER TABLE appointments 
ALTER COLUMN created_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP),
ALTER COLUMN updated_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP);

-- Reçeteler tablosu için timestamp düzeltmeleri
ALTER TABLE prescriptions 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

UPDATE prescriptions 
SET created_at = timezone('Europe/Istanbul', created_at),
    updated_at = timezone('Europe/Istanbul', updated_at);

ALTER TABLE prescriptions 
ALTER COLUMN created_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP),
ALTER COLUMN updated_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP);

-- Geri bildirimler tablosu için timestamp düzeltmeleri
ALTER TABLE feedback 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

UPDATE feedback 
SET created_at = timezone('Europe/Istanbul', created_at),
    updated_at = timezone('Europe/Istanbul', updated_at);

ALTER TABLE feedback 
ALTER COLUMN created_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP),
ALTER COLUMN updated_at SET DEFAULT timezone('Europe/Istanbul', CURRENT_TIMESTAMP);