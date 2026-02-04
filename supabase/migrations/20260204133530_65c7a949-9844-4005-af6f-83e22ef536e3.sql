-- Update handle_new_user function to save phone from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_mess_id text;
BEGIN
  -- Generate the mess ID
  new_mess_id := generate_mess_id();
  
  -- Insert profile with phone from user metadata
  INSERT INTO public.profiles (user_id, email, phone)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Insert user role as manager
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  -- Create mess with generated mess_id (name is optional)
  INSERT INTO public.messes (manager_id, mess_id, name, status)
  VALUES (NEW.id, new_mess_id, NULL, 'inactive');
  
  RETURN NEW;
END;
$$;