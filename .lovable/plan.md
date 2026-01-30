

# Date Entry Validation Fix - Implementation Plan

## Current State Analysis

After reviewing the codebase, I found that:

1. **The `useDateValidation` hook (`src/hooks/useDateValidation.ts`) already implements the correct formula:**
   - Rule 1: No future dates (`isAfter(entryDate, today)` check)
   - Rule 2: No dates before subscription start date (`isBefore(entryDate, subscriptionStartDate)`)
   - Rule 3: No months before subscription start month (`entryMonth < subscriptionStartMonth`)

2. **Frontend pages are using the hook correctly:**
   - `MealsPage.tsx`, `BazarPage.tsx`, `DepositsPage.tsx` all use `useDateValidation`
   - Date inputs have `max={getMaxDate()}` and `min={getMinDate()}` constraints
   - Error messages are displayed and submit buttons are disabled when invalid

3. **What's missing:**
   - **Backend validation** in edge functions/database triggers to re-enforce the same rules server-side

---

## Implementation Tasks

### 1. Create Backend Validation Edge Function

Create a new shared validation edge function `validate-entry-date` that can be called by other functions or used as a reusable validation utility.

**Validation Logic (Backend):**
```text
Allow entry ONLY if:
1. entry_date <= today
2. entry_date >= subscription_start_date
3. entry_month >= subscription_start_month
```

**Error Messages:**
- Future date: `"ভবিষ্যতের তারিখে এন্ট্রি করা যাবে না"`
- Before subscription: `"সাবস্ক্রিপশন শুরু হওয়ার আগের মাস বা তারিখে এন্ট্রি করা যাবে না"`

---

### 2. Create Database Trigger for Validation

Add PostgreSQL triggers on the following tables to enforce date validation at the database level:
- `meals`
- `bazars`
- `deposits`

The triggers will:
1. Reject `INSERT` or `UPDATE` if the date is in the future
2. Reject if the date is before the mess's active subscription start date
3. Return clear error messages

---

### 3. Verify Frontend Implementation

Confirm the existing frontend validation is complete:

| Module | Future Date Block | Min Date Constraint | Error Display | Submit Disable |
|--------|-------------------|---------------------|---------------|----------------|
| Meals  | Yes | Yes | Yes | Yes |
| Bazar  | Yes | Yes | Yes | Yes |
| Deposits | Yes | Yes | Yes | Yes |

No changes needed to the frontend - it's already correctly implemented.

---

## Technical Details

### Database Trigger Function

```sql
CREATE OR REPLACE FUNCTION validate_entry_date()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription_start_date DATE;
  v_entry_month TEXT;
  v_subscription_start_month TEXT;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Rule 1: No future dates
  IF NEW.date > v_today THEN
    RAISE EXCEPTION 'Cannot enter data for future dates';
  END IF;

  -- Get subscription start date for this mess
  SELECT start_date::DATE INTO v_subscription_start_date
  FROM subscriptions
  WHERE mess_id = NEW.mess_id
    AND status = 'active'
  ORDER BY start_date ASC
  LIMIT 1;

  -- If no active subscription, allow (subscription check handled elsewhere)
  IF v_subscription_start_date IS NOT NULL THEN
    -- Rule 2: No dates before subscription start
    IF NEW.date < v_subscription_start_date THEN
      RAISE EXCEPTION 'Cannot enter data before subscription start date';
    END IF;

    -- Rule 3: No months before subscription start month
    v_entry_month := TO_CHAR(NEW.date, 'YYYY-MM');
    v_subscription_start_month := TO_CHAR(v_subscription_start_date, 'YYYY-MM');
    
    IF v_entry_month < v_subscription_start_month THEN
      RAISE EXCEPTION 'Cannot enter data for months before subscription start';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Triggers to Create

```sql
-- Meals table trigger
CREATE TRIGGER validate_meals_date
BEFORE INSERT OR UPDATE ON meals
FOR EACH ROW EXECUTE FUNCTION validate_entry_date();

-- Bazars table trigger
CREATE TRIGGER validate_bazars_date
BEFORE INSERT OR UPDATE ON bazars
FOR EACH ROW EXECUTE FUNCTION validate_entry_date();

-- Deposits table trigger
CREATE TRIGGER validate_deposits_date
BEFORE INSERT OR UPDATE ON deposits
FOR EACH ROW EXECUTE FUNCTION validate_entry_date();
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add `validate_entry_date()` function and triggers |

---

## Summary

The frontend date validation is already correctly implemented with the right formula. This plan adds the critical **backend enforcement layer** through PostgreSQL triggers that will:

1. Block future date entries at the database level
2. Block entries before subscription start date
3. Block entries for months before subscription start month
4. Return clear error messages when validation fails

This ensures data integrity even if someone bypasses the frontend validation.

