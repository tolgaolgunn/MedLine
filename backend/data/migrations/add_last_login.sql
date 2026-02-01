-- Add last_login column to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;