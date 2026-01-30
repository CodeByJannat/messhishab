-- Update the validate_entry_date function to allow full month access
-- Users who subscribe mid-month can enter data for the entire subscription month

CREATE OR REPLACE FUNCTION public.validate_entry_date()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription_start_date DATE;
  v_subscription_start_month TEXT;
  v_entry_month TEXT;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Rule 1: No future dates
  IF NEW.date > v_today THEN
    RAISE EXCEPTION 'ভবিষ্যতের তারিখে এন্ট্রি করা যাবে না';
  END IF;

  -- Get subscription start date for this mess
  SELECT start_date::DATE INTO v_subscription_start_date
  FROM public.subscriptions
  WHERE mess_id = NEW.mess_id
    AND status = 'active'
  ORDER BY start_date ASC
  LIMIT 1;

  -- If subscription exists, validate against subscription month (not exact date)
  IF v_subscription_start_date IS NOT NULL THEN
    -- Get months for comparison
    v_entry_month := TO_CHAR(NEW.date, 'YYYY-MM');
    v_subscription_start_month := TO_CHAR(v_subscription_start_date, 'YYYY-MM');
    
    -- Rule 2: No months before subscription start month (allow full month access)
    IF v_entry_month < v_subscription_start_month THEN
      RAISE EXCEPTION 'সাবস্ক্রিপশন শুরুর মাসের আগে কোনো মাসে এন্ট্রি করা যাবে না';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;