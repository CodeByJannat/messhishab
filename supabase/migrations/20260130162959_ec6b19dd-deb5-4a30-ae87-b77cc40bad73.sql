-- Create validation function for entry dates
CREATE OR REPLACE FUNCTION public.validate_entry_date()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription_start_date DATE;
  v_entry_month TEXT;
  v_subscription_start_month TEXT;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Rule 1: No future dates
  IF NEW.date > v_today THEN
    RAISE EXCEPTION 'ভবিষ্যতের তারিখে এন্ট্রি করা যাবে না';
  END IF;

  -- Get subscription start date for this mess
  SELECT start_date::DATE INTO v_subscription_start_date
  FROM subscriptions
  WHERE mess_id = NEW.mess_id
    AND status = 'active'
  ORDER BY start_date ASC
  LIMIT 1;

  -- If active subscription exists, validate against it
  IF v_subscription_start_date IS NOT NULL THEN
    -- Rule 2: No dates before subscription start
    IF NEW.date < v_subscription_start_date THEN
      RAISE EXCEPTION 'সাবস্ক্রিপশন শুরু হওয়ার আগের তারিখে এন্ট্রি করা যাবে না';
    END IF;

    -- Rule 3: No months before subscription start month
    v_entry_month := TO_CHAR(NEW.date, 'YYYY-MM');
    v_subscription_start_month := TO_CHAR(v_subscription_start_date, 'YYYY-MM');
    
    IF v_entry_month < v_subscription_start_month THEN
      RAISE EXCEPTION 'সাবস্ক্রিপশন শুরু হওয়ার আগের মাসে এন্ট্রি করা যাবে না';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for meals table
CREATE TRIGGER validate_meals_date
BEFORE INSERT OR UPDATE ON meals
FOR EACH ROW EXECUTE FUNCTION validate_entry_date();

-- Create trigger for bazars table
CREATE TRIGGER validate_bazars_date
BEFORE INSERT OR UPDATE ON bazars
FOR EACH ROW EXECUTE FUNCTION validate_entry_date();

-- Create trigger for deposits table
CREATE TRIGGER validate_deposits_date
BEFORE INSERT OR UPDATE ON deposits
FOR EACH ROW EXECUTE FUNCTION validate_entry_date();