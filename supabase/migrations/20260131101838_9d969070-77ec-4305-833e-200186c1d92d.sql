-- Create a function to generate mess ID in format {YY}{M}{SS}
CREATE OR REPLACE FUNCTION public.generate_mess_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year text;
  current_month text;
  year_month_prefix text;
  last_serial int;
  new_serial text;
BEGIN
  -- Get current year (last 2 digits) and month (no leading zero)
  current_year := to_char(now(), 'YY');
  current_month := ltrim(to_char(now(), 'MM'), '0');
  year_month_prefix := current_year || current_month;
  
  -- Find the highest serial number for any mess (global counter)
  SELECT COALESCE(MAX(
    CASE 
      WHEN mess_id ~ '^\d+$' AND length(mess_id) >= 3 
      THEN substring(mess_id from length(mess_id) - 1)::int
      ELSE 0
    END
  ), 0) INTO last_serial
  FROM messes
  WHERE mess_id IS NOT NULL AND mess_id NOT LIKE 'PENDING%';
  
  -- Increment serial
  new_serial := lpad((last_serial + 1)::text, 2, '0');
  
  RETURN year_month_prefix || new_serial;
END;
$$;

-- Update handle_new_user to generate mess_id immediately
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_mess_id text;
BEGIN
  -- Generate the mess ID
  new_mess_id := generate_mess_id();
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Insert user role as manager
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  -- Create mess with generated mess_id (name is optional)
  INSERT INTO public.messes (manager_id, mess_id, name, status)
  VALUES (NEW.id, new_mess_id, NULL, 'inactive');
  
  RETURN NEW;
END;
$$;

-- Drop the finalize_mess_setup function as it's no longer needed
DROP FUNCTION IF EXISTS public.finalize_mess_setup(text, uuid);