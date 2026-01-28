
# Fix Critical Billing Logic Bug - No Free Subscription

## Summary
This plan addresses a **P0 critical billing bug** where the system automatically creates an active subscription with a 30-day trial upon user registration, allowing free access without any payment.

---

## Root Cause Identified

The issue is in the **`handle_new_user` database trigger** (line 24-26):

```sql
-- Create initial subscription (30 days trial)
INSERT INTO public.subscriptions (mess_id, type, status, end_date)
VALUES (new_mess_uuid, 'monthly', 'active', now() + INTERVAL '30 days');
```

This automatically creates an **active monthly subscription** with a 30-day end date every time a user registers - **without requiring any payment**.

---

## Implementation Plan

### Step 1: Remove Auto-Subscription from Registration Trigger

**What**: Modify the `handle_new_user` function to NOT create any subscription on registration.

**Database Change**:
```sql
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
  
  -- Create manager role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  -- Create mess with PENDING mess_id (will be generated after name is set)
  INSERT INTO public.messes (mess_id, manager_id)
  VALUES ('PENDING', NEW.id)
  RETURNING id INTO new_mess_uuid;
  
  -- NO SUBSCRIPTION CREATED HERE
  -- Subscription will only be created after successful payment
  
  RETURN NEW;
END;
$$;
```

### Step 2: Update AuthContext to Handle No Subscription

**What**: Update the `fetchUserData` function to handle cases where no subscription exists.

**Changes**:
- Set `subscription` to `null` if none exists (already handled)
- Ensure UI components correctly interpret `null` subscription as "inactive"

### Step 3: Update Mess Status Badge Logic

**What**: Update `ManagerDashboard.tsx` to correctly show "Inactive" when:
- No subscription exists (`subscription === null`)
- Subscription status is not 'active'
- Subscription end date has passed

**Current Logic**:
```typescript
const isSubscriptionActive = subscription?.status === 'active';
```

**Updated Logic**:
```typescript
const isSubscriptionActive = subscription?.status === 'active' && 
  new Date(subscription.end_date) > new Date();
```

### Step 4: Add "Subscribe Now" CTA for Inactive Messes

**What**: When mess is inactive, show a prominent CTA button directing to subscription page.

**UI Addition**:
- Add a prominent banner/button when `!isSubscriptionActive`
- Label: "Subscribe Now" / "সাবস্ক্রাইব করুন"
- Links to `/dashboard/subscription`

### Step 5: Update ProtectedRoute Logic

**What**: Update the subscription check to handle `null` subscription and improve the inactive mess experience.

**Current Issue**: The current logic only redirects if subscription exists AND is expired. It doesn't handle `subscription === null`.

**Changes**:
- Allow access to dashboard even without subscription
- Always allow access to `/subscription` and `/dashboard/payment` for inactive messes
- Limit access to other features (meals, bazar, deposits, members) for inactive messes

### Step 6: Create Subscription Activation Edge Function

**What**: Create a secure edge function to activate subscriptions ONLY after verified payment.

**Function**: `activate-subscription`

**Logic**:
1. Verify payment was successful (payment_verified === true)
2. Create or update subscription with:
   - `status: 'active'`
   - `type: plan_type (monthly/yearly)`
   - `start_date: now()`
   - `end_date: calculated based on plan`
3. Return success/failure

**Important**: This function should ONLY be called after payment verification - NOT from client-side directly.

### Step 7: Update Payment Flow to Activate Subscription

**What**: Update payment page to call the activation function after payment success.

**Flow**:
```text
User selects plan
    ↓
Goes to Payment Page
    ↓
Completes payment (bKash/SSL)
    ↓
Payment gateway confirms success
    ↓
Call activate-subscription function
    ↓
Subscription created/renewed
    ↓
Mess status becomes "Active"
```

---

## Technical Details

### Database Migration

```sql
-- Remove auto-subscription from handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_mess_uuid UUID;
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  INSERT INTO public.messes (mess_id, manager_id)
  VALUES ('PENDING', NEW.id)
  RETURNING id INTO new_mess_uuid;
  
  -- No subscription created here - requires payment
  
  RETURN NEW;
END;
$$;
```

### Edge Function: activate-subscription

```typescript
// Validates payment and creates subscription
// Called only after payment verification
// Returns { success: boolean, subscription: object }
```

### Files to Modify

1. **Database**: Migration to update `handle_new_user` function
2. **`src/pages/dashboard/ManagerDashboard.tsx`**:
   - Update status badge logic to check end_date
   - Add "Subscribe Now" CTA for inactive messes
3. **`src/components/auth/ProtectedRoute.tsx`**:
   - Update to handle `subscription === null`
   - Allow subscription/payment pages for inactive messes
   - Restrict other dashboard features
4. **`supabase/functions/activate-subscription/index.ts`** (new):
   - Create subscription activation function
5. **`src/pages/dashboard/PaymentPage.tsx`**:
   - Integrate subscription activation after payment

---

## Validation Checklist

After implementation:

| Test Case | Expected Result |
|-----------|-----------------|
| New user registers | `subscription = null`, mess inactive |
| User sets mess name | Still `subscription = null`, mess inactive |
| User navigates dashboard | Shows "Inactive" badge + "Subscribe Now" CTA |
| User tries to access meals/bazar | Access restricted or warning shown |
| User completes payment | Subscription created, mess becomes active |
| Subscription expires | Mess becomes inactive, shows "Subscribe" CTA |

---

## Security Safeguards

1. **Database Level**: No subscription auto-creation
2. **Edge Function Level**: Payment verification required before activation
3. **UI Level**: Clear status indicators and restricted access for unpaid messes

---

## Expected Final State

- **No free access**: Users must pay to get active status
- **Clear UX**: Inactive messes see their status and subscription CTA
- **Secure billing**: Subscriptions only created via verified payment
- **Business logic enforced**: Payment is the only path to activation
