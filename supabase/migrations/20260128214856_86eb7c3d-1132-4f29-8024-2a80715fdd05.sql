-- Remove auto-subscription from handle_new_user function
-- Subscription will only be created after successful payment

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_mess_uuid UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Create manager role (all new users are managers by default)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  -- Create mess with PENDING mess_id (will be generated after name is set)
  INSERT INTO public.messes (mess_id, manager_id)
  VALUES ('PENDING', NEW.id)
  RETURNING id INTO new_mess_uuid;
  
  -- NO SUBSCRIPTION CREATED HERE
  -- Subscription will only be created after successful payment
  -- This ensures no free access without payment
  
  RETURN NEW;
END;
$$;