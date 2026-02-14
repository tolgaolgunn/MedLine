-- Add usage_duration_days column to prescriptions table
-- This column stores the number of days the prescription is valid for use
-- This value is set when the prescription is created or updated

ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS usage_duration_days INTEGER DEFAULT 30;

-- Add comment to explain the column
COMMENT ON COLUMN prescriptions.usage_duration_days IS 'Reçetenin kaç gün geçerli olduğu. Varsayılan değer 30 gündür.';

