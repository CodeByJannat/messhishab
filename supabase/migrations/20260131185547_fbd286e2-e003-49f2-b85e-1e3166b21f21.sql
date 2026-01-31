-- Drop existing triggers
DROP TRIGGER IF EXISTS validate_meals_date ON meals;
DROP TRIGGER IF EXISTS validate_bazars_date ON bazars;
DROP TRIGGER IF EXISTS validate_deposits_date ON deposits;

-- Drop existing function
DROP FUNCTION IF EXISTS validate_entry_date();

-- Create updated function with Bangladesh timezone (GMT+6)
CREATE OR REPLACE FUNCTION validate_entry_date()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription_start_date DATE;
  v_subscription_start_month TEXT;
  v_entry_month TEXT;
  v_today DATE;
BEGIN
  -- Use Bangladesh timezone (GMT+6) for "today"
  v_today := (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE;
  
  -- Rule 1: No future dates (compared to Bangladesh time)
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

  -- If active subscription exists, validate against subscription start month
  IF v_subscription_start_date IS NOT NULL THEN
    v_entry_month := TO_CHAR(NEW.date, 'YYYY-MM');
    v_subscription_start_month := TO_CHAR(v_subscription_start_date, 'YYYY-MM');
    
    -- Rule 2: No months before subscription start month
    IF v_entry_month < v_subscription_start_month THEN
      RAISE EXCEPTION 'সাবস্ক্রিপশন শুরু হওয়ার আগের মাসে এন্ট্রি করা যাবে না';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate triggers
CREATE TRIGGER validate_meals_date
BEFORE INSERT OR UPDATE ON meals
FOR EACH ROW EXECUTE FUNCTION validate_entry_date();

CREATE TRIGGER validate_bazars_date
BEFORE INSERT OR UPDATE ON bazars
FOR EACH ROW EXECUTE FUNCTION validate_entry_date();

CREATE TRIGGER validate_deposits_date
BEFORE INSERT OR UPDATE ON deposits
FOR EACH ROW EXECUTE FUNCTION validate_entry_date();