-- Fix finalize_mess_setup to check for PENDING prefix instead of exact match
CREATE OR REPLACE FUNCTION public.finalize_mess_setup(p_mess_uuid uuid, p_mess_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Only generate new ID if still pending (check for PENDING prefix, not exact match)
  IF v_current_mess_id LIKE 'PENDING%' THEN
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
$function$;