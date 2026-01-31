-- Create function to generate temporary mess ID in T{YY}{M}{SS} format
CREATE OR REPLACE FUNCTION public.generate_temp_mess_id()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_part text;
  month_part text;
  serial_num int;
  new_id text;
BEGIN
  -- Get last 2 digits of current year
  year_part := to_char(now(), 'YY');
  
  -- Get current month (no leading zero)
  month_part := ltrim(to_char(now(), 'MM'), '0');
  
  -- Count existing temp IDs this month to get next serial
  SELECT COALESCE(MAX(
    CASE 
      WHEN mess_id ~ ('^T' || year_part || month_part || '[0-9]+$')
      THEN substring(mess_id from length('T' || year_part || month_part) + 1)::int
      ELSE 0
    END
  ), 0) + 1
  INTO serial_num
  FROM messes
  WHERE mess_id LIKE 'T' || year_part || month_part || '%';
  
  -- Format: T{YY}{M}{SS} with minimum 2 digits for serial
  new_id := 'T' || year_part || month_part || lpad(serial_num::text, 2, '0');
  
  RETURN new_id;
END;
$$;

-- Update the handle_new_user function to use new temp ID format
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_mess_id text;
BEGIN
  -- Generate temporary mess ID
  temp_mess_id := generate_temp_mess_id();
  
  -- Create profile
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Create user role as manager
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  -- Create mess with temporary ID (name will be set later via modal)
  INSERT INTO public.messes (manager_id, mess_id, name, status)
  VALUES (NEW.id, temp_mess_id, NULL, 'inactive');
  
  RETURN NEW;
END;
$$;