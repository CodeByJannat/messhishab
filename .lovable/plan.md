
# Comprehensive Feature Implementation and Bug Fix Plan

## Overview
This plan addresses 7 major items: Manager Payment History tab, subscription expiry date fix, member creation bug, manual bKash validation, admin pending payments display, coupon visibility, and member login fix.

---

## Issue 1: Manager Payment History Tab

### Problem
No dedicated page exists for managers to view their complete payment history.

### Solution
Create a new `PaymentHistoryPage.tsx` in the manager dashboard with full payment records.

### Files to Create/Modify
| Action | File |
|--------|------|
| Create | `src/pages/dashboard/PaymentHistoryPage.tsx` |
| Modify | `src/App.tsx` (add route) |
| Modify | `src/components/dashboard/DashboardLayout.tsx` (add nav item) |

### Implementation Details

**New Page Features:**
- Table showing all payments for the manager's mess
- Columns: Date, Payment Method, bKash Number, Transaction ID, Coupon Code, Amount, Status (with color-coded badges)
- Pagination (10 records per page)
- Sorted by latest first
- Status badges: Approved (green), Pending (yellow), Rejected (red)

**Navigation:**
Add new nav item after "Subscription":
```text
{ href: '/dashboard/payment-history', icon: History, labelBn: 'পেমেন্ট হিস্ট্রি', labelEn: 'Payment History' }
```

**Database Query:**
```text
SELECT * FROM payments 
WHERE mess_id = {user's mess id}
ORDER BY created_at DESC
```

---

## Issue 2: Subscription Expiry Date Extension Bug

### Problem
When a manager with an active subscription purchases a new plan, the new duration overwrites instead of extending the existing expiry date.

### Current Code (in `admin-review-payment/index.ts` lines 71-78):
```typescript
const startDate = new Date();
const endDate = new Date();
if (payment.plan_type === "yearly") {
  endDate.setFullYear(endDate.getFullYear() + 1);
} else {
  endDate.setMonth(endDate.getMonth() + 1);
}
```

### Solution
Modify the subscription activation logic to check for existing active subscription and extend from current end_date if it hasn't expired yet.

### Files to Modify
| File | Changes |
|------|---------|
| `supabase/functions/admin-review-payment/index.ts` | Update subscription date calculation logic |

### New Logic:
```text
1. Fetch existing subscription for the mess
2. If exists AND status is 'active' AND end_date > today:
   - Calculate new_end_date = current_end_date + plan_duration
3. Else:
   - Calculate new_end_date = today + plan_duration
4. Update subscription with new dates
```

---

## Issue 3: Add New Member Error

### Problem
The `manage-member` edge function uses `getClaims()` method which doesn't exist in the Supabase JS library, causing authentication failures.

### Current Code (line 58):
```typescript
const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
```

### Solution
Replace `getClaims()` with proper `getUser()` method from the Supabase Admin client.

### Files to Modify
| File | Changes |
|------|---------|
| `supabase/functions/manage-member/index.ts` | Fix authentication, update CORS headers |
| `supabase/functions/verify-pin/index.ts` | Fix authentication, update CORS headers |

### Key Changes:
1. Replace `getClaims()` with `supabaseAdmin.auth.getUser(token)`
2. Update CORS headers to include all required Supabase client headers
3. Return proper error messages for debugging

---

## Issue 4: Manual bKash Input Validation

### Problem
No strict validation on bKash number (must be 11 digits) and Transaction ID (must be 10 alphanumeric characters).

### Solution
Add real-time validation with error messages and disable submit button until valid.

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/payment/ManualBkashContent.tsx` | Add validation logic, error display |
| `src/pages/dashboard/PaymentPage.tsx` | Add validation state, disable button logic |

### Validation Rules:
- **bKash Number**: Exactly 11 digits, numeric only, starts with "01"
- **Transaction ID**: Exactly 10 characters, alphanumeric only (A-Z, 0-9)

### UI Changes:
1. Show validation error messages below each input field
2. Red border on invalid inputs
3. Export validation state to parent component
4. Disable "Complete Payment" button until both fields are valid

---

## Issue 5: Admin Pending Payments - Missing Details

### Problem
Admin pending payments table doesn't show bKash number, Transaction ID, or coupon information.

### Current Table Columns:
Mess ID, Amount, Plan, Payment Method, Date, Actions

### Solution
Expand the payment table to show all verification details.

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/admin/AdminSubscriptionPage.tsx` | Update PaymentTable component |
| `supabase/functions/submit-payment/index.ts` | Ensure coupon_code is saved |

### New Table Structure:
| Column | Description |
|--------|-------------|
| Mess ID | With mess name below |
| Amount | Final paid amount |
| Plan | Monthly/Yearly badge |
| Payment Method | bKash/manual-bkash/sslcommerz |
| bKash Number | For manual payments |
| Transaction ID | For verification |
| Coupon Code | If applied |
| Discount | Amount saved |
| Date | Submission date |
| Actions | Approve/Reject buttons |

### Database Fix:
The `submit-payment` function currently doesn't save `coupon_code` to the payments table. We need to add this field to the insert.

---

## Issue 6: Coupon Visibility Across Payment History

### Problem
Coupon code is not visible in approved/rejected payment lists, only pending.

### Solution
Update the PaymentTable component to show coupon code for all payment statuses.

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/admin/AdminSubscriptionPage.tsx` | Add coupon column to all tabs |
| Database migration | Add `discount_amount` column to payments table if not exists |
| `supabase/functions/submit-payment/index.ts` | Save discount_amount with payment |

### Changes:
1. Add coupon_code and discount_amount columns to all payment status tabs
2. Save coupon_code and calculated discount in submit-payment function
3. Display coupon info consistently across manager and admin views

---

## Issue 7: Member Login Error

### Problem
The `member-verify-pin` edge function uses incorrect hashing - it doesn't include the service role key salt like `manage-member` does, causing PIN verification to always fail.

### Current Code in `member-verify-pin/index.ts` (lines 8-14):
```typescript
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin); // Missing salt!
  ...
}
```

### Code in `manage-member/index.ts` (lines 10-16):
```typescript
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 16)); // Has salt!
  ...
}
```

### Solution
1. Fix the hashing function to match the one in manage-member
2. Update CORS headers in member-login and member-verify-pin
3. Ensure proper member session handling in frontend

### Files to Modify
| File | Changes |
|------|---------|
| `supabase/functions/member-verify-pin/index.ts` | Fix hash function, update CORS |
| `supabase/functions/member-login/index.ts` | Update CORS headers |
| `src/contexts/AuthContext.tsx` | Add member session support |
| `src/components/auth/ProtectedRoute.tsx` | Handle member auth from localStorage |

### Member Authentication Flow Fix:
1. Update both edge functions with correct CORS headers
2. Fix PIN hashing to include salt
3. Update AuthContext to check localStorage for member_session
4. Update ProtectedRoute to properly handle member role from localStorage

---

## Summary of All File Changes

### New Files
| File | Purpose |
|------|---------|
| `src/pages/dashboard/PaymentHistoryPage.tsx` | Manager payment history page |

### Modified Edge Functions (5 files)
| File | Changes |
|------|---------|
| `supabase/functions/manage-member/index.ts` | Fix auth, update CORS |
| `supabase/functions/verify-pin/index.ts` | Fix auth, update CORS |
| `supabase/functions/member-login/index.ts` | Update CORS headers |
| `supabase/functions/member-verify-pin/index.ts` | Fix hash function, update CORS |
| `supabase/functions/admin-review-payment/index.ts` | Fix subscription extension logic |
| `supabase/functions/submit-payment/index.ts` | Save coupon_code and discount_amount |

### Modified Frontend Files (6 files)
| File | Changes |
|------|---------|
| `src/App.tsx` | Add PaymentHistoryPage route |
| `src/components/dashboard/DashboardLayout.tsx` | Add Payment History nav item |
| `src/components/payment/ManualBkashContent.tsx` | Add validation with error messages |
| `src/pages/dashboard/PaymentPage.tsx` | Add validation state, disable button |
| `src/pages/admin/AdminSubscriptionPage.tsx` | Add bKash/TrxID/coupon columns |
| `src/contexts/AuthContext.tsx` | Add member session support |
| `src/components/auth/ProtectedRoute.tsx` | Handle member localStorage auth |

### Database Migration (optional)
- Add `discount_amount` column to `payments` table if not present

---

## Implementation Order

1. **Fix Member Login** (Critical - blocks member access)
2. **Fix Add Member** (Critical - blocks mess operations)
3. **Fix Subscription Extension** (Critical - billing logic)
4. **Add bKash Validation** (Payment integrity)
5. **Update Admin Pending Payments** (Admin workflow)
6. **Add Manager Payment History** (New feature)
7. **Ensure Coupon Visibility** (Data consistency)

---

## Testing Requirements

After implementation, verify:
1. Manager can add new members successfully
2. Meals, Bazar, Deposits, Balance pages work with members
3. Member can log in with MessID + MessPassword, select name, enter PIN
4. Member lands on /member dashboard (not subscription page)
5. Manual bKash validates 11-digit number and 10-char TrxID
6. Admin sees full payment details in pending tab
7. Subscription extends correctly when purchasing during active period
8. Manager sees full payment history with coupon info
