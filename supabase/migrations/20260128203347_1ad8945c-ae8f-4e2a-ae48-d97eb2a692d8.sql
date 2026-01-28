-- Update the generate_mess_id function to use new format: {YY}{M}{SS}
-- YY = last 2 digits of year
-- M = month number (no leading zero)  
-- SS = serial number (2+ digits)

CREATE OR REPLACE FUNCTION public.generate_mess_id()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_year TEXT;
  current_month TEXT;
  year_month_prefix TEXT;
  last_serial INTEGER;
  new_serial INTEGER;
  new_id TEXT;
BEGIN
  -- Get current year last 2 digits
  current_year := to_char(now(), 'YY');
  
  -- Get current month without leading zero
  current_month := ltrim(to_char(now(), 'MM'), '0');
  
  -- Combine year and month prefix
  year_month_prefix := current_year || current_month;
  
  -- Find the highest serial number for the current year-month prefix
  SELECT MAX(
    CASE 
      WHEN mess_id ~ ('^' || year_month_prefix || '[0-9]+$') 
      THEN CAST(substring(mess_id from length(year_month_prefix) + 1) AS INTEGER)
      ELSE 0
    END
  ) INTO last_serial
  FROM public.messes
  WHERE mess_id ~ ('^' || year_month_prefix || '[0-9]+$');
  
  -- Set new serial (start from 1 if no previous, otherwise increment)
  new_serial := COALESCE(last_serial, 0) + 1;
  
  -- Generate new mess ID with zero-padded serial (minimum 2 digits)
  new_id := year_month_prefix || lpad(new_serial::text, 2, '0');
  
  RETURN new_id;
END;
$function$;