-- Add last_login column to users table
ALTER TABLE users
ADD COLUMN last_login TIMESTAMP;

-- Update existing users with NULL last_login
UPDATE users SET last_login = NULL WHERE last_login IS NULL;