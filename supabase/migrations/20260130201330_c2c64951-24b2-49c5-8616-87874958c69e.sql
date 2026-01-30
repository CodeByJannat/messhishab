-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function to use unique PENDING ID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  
  -- Create mess with unique PENDING mess_id (will be replaced after name is set)
  INSERT INTO public.messes (mess_id, manager_id)
  VALUES (pending_id, NEW.id)
  RETURNING id INTO new_mess_uuid;
  
  -- NO SUBSCRIPTION CREATED HERE
  -- Subscription will only be created after successful payment
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();