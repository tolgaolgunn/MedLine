-- Add valid_until_date column to prescriptions table
-- This column stores the date until which the prescription is valid for use

ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS valid_until_date DATE;

-- Add comment to explain the column
COMMENT ON COLUMN prescriptions.valid_until_date IS 'Reçetenin geçerli olduğu son tarih. Bu tarihten sonra reçete kullanılamaz.';

