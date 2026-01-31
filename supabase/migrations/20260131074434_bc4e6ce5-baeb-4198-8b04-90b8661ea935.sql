-- Drop existing columns with encrypted data and add plain text columns
ALTER TABLE public.members 
  DROP COLUMN IF EXISTS email_encrypted,
  DROP COLUMN IF EXISTS phone_encrypted,
  DROP COLUMN IF EXISTS room_number_encrypted,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS room_number text;

-- Rename pin_hash to password
ALTER TABLE public.members 
  RENAME COLUMN pin_hash TO password;