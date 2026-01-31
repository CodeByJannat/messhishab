-- Remove mess_password column as members now login with their own email/password
-- Update the handle_new_user function to not set mess_password

-- First drop the default on mess_password column and make it nullable
ALTER TABLE public.messes ALTER COLUMN mess_password DROP DEFAULT;
ALTER TABLE public.messes ALTER COLUMN mess_password DROP NOT NULL;

-- Update existing messes to set mess_password to NULL (optional cleanup)
UPDATE public.messes SET mess_password = NULL;

-- Update the handle_new_user function to not include mess_password
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_mess_uuid UUID;
  pending_id TEXT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Create manager role (all new users are managers by default)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  -- Generate a unique pending ID (using timestamp + random to avoid conflicts)
  pending_id := 'PENDING_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || SUBSTR(gen_random_uuid()::TEXT, 1, 8);
  
  -- Create mess with unique PENDING mess_id (no mess_password since members login with own email/password)
  INSERT INTO public.messes (mess_id, manager_id, mess_password)
  VALUES (pending_id, NEW.id, NULL)
  RETURNING id INTO new_mess_uuid;
  
  RETURN NEW;
END;
$$;