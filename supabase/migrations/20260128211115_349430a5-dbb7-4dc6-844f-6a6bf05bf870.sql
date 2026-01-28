-- 1. Update handle_new_user to NOT generate mess_id immediately (use 'PENDING' placeholder)
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
  
  -- Create initial subscription (30 days trial)
  INSERT INTO public.subscriptions (mess_id, type, status, end_date)
  VALUES (new_mess_uuid, 'monthly', 'active', now() + INTERVAL '30 days');
  
  RETURN NEW;
END;
$$;

-- 2. Create function to finalize mess setup (generate ID + set name)
CREATE OR REPLACE FUNCTION public.finalize_mess_setup(
  p_mess_uuid UUID,
  p_mess_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_mess_id TEXT;
  v_current_mess_id TEXT;
BEGIN
  -- Check if mess exists and get current mess_id
  SELECT mess_id INTO v_current_mess_id
  FROM public.messes
  WHERE id = p_mess_uuid;
  
  IF v_current_mess_id IS NULL THEN
    RAISE EXCEPTION 'Mess not found';
  END IF;
  
  -- Only generate new ID if still pending
  IF v_current_mess_id = 'PENDING' THEN
    v_new_mess_id := public.generate_mess_id();
  ELSE
    v_new_mess_id := v_current_mess_id;
  END IF;
  
  -- Update mess with name and ID
  UPDATE public.messes
  SET 
    name = p_mess_name,
    mess_id = v_new_mess_id,
    updated_at = now()
  WHERE id = p_mess_uuid;
  
  RETURN v_new_mess_id;
END;
$$;