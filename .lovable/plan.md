
# Fix Manual bKash Payment Submission Error

## Problem Summary
When users submit a manual bKash payment, they receive "Failed to send a request to the Edge Function" error. The payment details are not being saved for admin review.

## Root Causes Identified

1. **Missing Payment Submission Function**: No edge function exists to insert payment records into the `payments` table. The current code incorrectly calls `activate-subscription` directly, which:
   - Bypasses admin approval workflow
   - Has outdated CORS headers causing the error

2. **CORS Header Mismatch**: The `activate-subscription` and `admin-review-payment` functions have outdated CORS headers missing required Supabase client headers.

3. **Incorrect Payment Flow**: The manual bKash payment should create a pending payment record for admin review, not activate the subscription directly.

---

## Solution Overview

### Step 1: Create New Edge Function - `submit-payment`
Create a new edge function to handle manual bKash payment submissions:

**File:** `supabase/functions/submit-payment/index.ts`

**Functionality:**
- Validate user authentication
- Verify the user is the mess manager
- Insert a new `payments` record with:
  - `status: 'pending'`
  - `mess_id`
  - `amount`
  - `plan_type`
  - `payment_method`
  - `bkash_number`
  - `transaction_id`
- Return success with appropriate message for admin review

### Step 2: Update CORS Headers in Existing Functions
Fix CORS headers in:
- `activate-subscription/index.ts`
- `admin-review-payment/index.ts`

**Updated CORS headers:**
```text
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

### Step 3: Update PaymentPage.tsx Logic
Modify the `handleCompletePayment` function for manual bKash:

**Before (incorrect):**
```text
For manual-bkash → Call activate-subscription (auto-activates)
```

**After (correct):**
```text
For manual-bkash → Call submit-payment (creates pending payment)
→ Show "submitted for review" message
→ Redirect to dashboard
```

### Step 4: Register New Function in Config
Add configuration in `supabase/config.toml`:
```text
[functions.submit-payment]
verify_jwt = false
```

---

## Technical Details

### New Edge Function: submit-payment/index.ts

```text
Request Body:
{
  mess_id: string,
  plan_type: 'monthly' | 'yearly',
  payment_method: 'manual-bkash',
  bkash_number: string,
  transaction_id: string,
  amount: number,
  coupon_code?: string
}

Response (success):
{
  success: true,
  message: "Payment submitted for review",
  payment_id: string
}
```

### Database Flow

```text
1. User submits manual bKash form
2. Edge function creates payment record:
   payments table:
   - status: 'pending'
   - bkash_number: '01XXXXXXXXX'
   - transaction_id: 'ABC123XYZ'
   - amount: calculated total
   - plan_type: 'monthly' | 'yearly'
   - mess_id: user's mess UUID
3. Admin sees pending payment in Admin Dashboard
4. Admin approves → admin-review-payment activates subscription
```

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `supabase/functions/submit-payment/index.ts` |
| Modify | `supabase/functions/activate-subscription/index.ts` (CORS fix) |
| Modify | `supabase/functions/admin-review-payment/index.ts` (CORS fix) |
| Modify | `supabase/config.toml` (register new function) |
| Modify | `src/pages/dashboard/PaymentPage.tsx` (use submit-payment) |

---

## Expected Behavior After Fix

1. User fills in bKash number and TrxID on payment page
2. Clicks "Complete Payment" button
3. Payment record is created with `status: 'pending'`
4. User sees success message: "আপনার পেমেন্ট ভেরিফিকেশনের জন্য পাঠানো হয়েছে"
5. User is redirected to dashboard
6. Admin sees pending payment in Subscription Management page
7. Admin approves → Subscription activates and mess becomes active
