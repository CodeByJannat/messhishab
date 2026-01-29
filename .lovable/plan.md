
# Admin & Manager Dashboard System Design

## Overview
Build a comprehensive Admin Dashboard panel with full control over messes, subscriptions, payments, coupons, and help desk, alongside enhancements to the existing Manager Dashboard.

---

## System Architecture

### Role Hierarchy
```text
Admin (hishabmess@gmail.com)
├── Full system access
├── Manage all messes
├── Approve/reject payments
├── Control pricing & coupons
└── Help desk management

Manager (existing role)
├── Manage own mess
├── View payment history
├── Help desk tickets
└── Notifications

Member (existing role)
└── View own data only
```

---

## Database Schema Changes

### 1. Add Admin Role to Enum
```sql
ALTER TYPE public.user_role ADD VALUE 'admin';
```

### 2. Create Payments Table
Track all payment transactions with approval workflow.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| mess_id | uuid | Reference to mess |
| amount | decimal | Payment amount |
| plan_type | subscription_type | monthly/yearly |
| payment_method | text | bkash/manual-bkash/sslcommerz |
| transaction_id | text | External transaction ID |
| bkash_number | text | For manual bKash |
| status | payment_status | pending/approved/rejected |
| reject_reason | text | Required if rejected |
| reviewed_by | uuid | Admin who reviewed |
| reviewed_at | timestamptz | Review timestamp |
| created_at | timestamptz | Submission time |

### 3. Create Coupons Table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| code | text | Unique coupon code |
| discount_type | text | percentage/fixed |
| discount_value | decimal | Amount or percentage |
| usage_limit | integer | Max uses (null = unlimited) |
| used_count | integer | Current usage |
| status | text | active/inactive |
| expiry_date | timestamptz | Expiration date |
| created_at | timestamptz | Creation time |

### 4. Create Pricing Settings Table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| monthly_price | decimal | Monthly plan price (default 20) |
| yearly_price | decimal | Yearly plan price (default 200) |
| updated_at | timestamptz | Last update |
| updated_by | uuid | Admin who updated |

### 5. Create Help Desk Tables

**help_desk_tickets**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| mess_id | uuid | From mess |
| subject | text | Ticket subject |
| status | text | open/in_progress/resolved/closed |
| created_at | timestamptz | Creation time |

**help_desk_messages**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| ticket_id | uuid | Reference to ticket |
| sender_type | text | admin/manager |
| sender_id | uuid | User who sent |
| message | text | Message content |
| is_read | boolean | Read status |
| created_at | timestamptz | Send time |

### 6. Create Promotions Table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| offer_name_en | text | English name |
| offer_name_bn | text | Bengali name |
| coupon_code | text | Associated coupon |
| cta_text_en | text | Button text EN |
| cta_text_bn | text | Button text BN |
| is_active | boolean | Currently active |
| created_at | timestamptz | Creation time |

### 7. Add Mess Status Field
```sql
ALTER TABLE messes ADD COLUMN status text DEFAULT 'active';
-- Values: 'active', 'inactive', 'suspended'
```

---

## New Files to Create

### Admin Dashboard Pages
```text
src/pages/admin/
├── AdminDashboard.tsx          # Main dashboard with stats
├── AdminSubscriptionPage.tsx   # Payment management + pricing
├── AdminMessPage.tsx           # Mess management
├── AdminCouponPage.tsx         # Coupon management
└── AdminHelpDeskPage.tsx       # Help desk interface
```

### Admin Components
```text
src/components/admin/
├── AdminDashboardLayout.tsx    # Admin sidebar + layout
├── MessStatusCards.tsx         # Total/Active/Inactive/Suspended
├── PaymentStatusCards.tsx      # Approved/Pending/Rejected
├── RevenueChart.tsx            # Revenue bar chart
├── PaymentApprovalTable.tsx    # Payment review table
├── MessManagementTable.tsx     # Mess listing with actions
├── CouponManagementTable.tsx   # Coupon CRUD
├── PricingEditor.tsx           # Price adjustment UI
└── PromotionEditor.tsx         # Promotion modal settings
```

### Manager Dashboard Additions
```text
src/pages/dashboard/
├── ManagerHelpDeskPage.tsx     # Help desk for managers
└── PaymentHistoryPage.tsx      # Manager's payment history

src/components/dashboard/
├── NotificationModal.tsx       # "You have new notification" popup
└── HelpDeskChat.tsx           # Chat interface component
```

### Shared Components
```text
src/components/landing/
└── PromotionModal.tsx          # Homepage promotion popup
```

---

## Edge Functions to Create

### 1. admin-review-payment
Approve or reject pending payments with mandatory reject reason.

### 2. admin-suspend-mess
Suspend/unsuspend mess with required note.

### 3. admin-update-pricing
Update monthly/yearly prices (admin only).

### 4. manage-coupon
Create, update, delete coupons (admin only).

### 5. manage-promotion
Toggle promotion, update content (admin only).

### 6. help-desk-send-message
Send message in help desk ticket.

### 7. help-desk-get-tickets
Fetch tickets (admin sees all, manager sees own).

---

## Files to Modify

### 1. src/App.tsx
Add admin routes with AdminProtectedRoute wrapper.

### 2. src/contexts/AuthContext.tsx
- Extend userRole type to include 'admin'
- Add admin detection logic

### 3. src/components/auth/ProtectedRoute.tsx
- Add 'admin' to requiredRole type
- Add admin-specific route protection

### 4. src/pages/Login.tsx
- Admin login goes to /admin after detection
- No UI change needed (same form)

### 5. src/pages/Index.tsx
- Add PromotionModal component
- Show once per session if active promotion exists

### 6. src/pages/dashboard/SubscriptionPage.tsx
- Fetch dynamic pricing from settings table
- Display payment history section

### 7. src/pages/dashboard/PaymentPage.tsx
- Submit payment as "pending" instead of auto-approve
- Store in payments table for admin review

### 8. src/components/dashboard/DashboardLayout.tsx
- Add Help Desk nav item
- Add Notifications nav item (if not present)

---

## Admin Dashboard Features

### Dashboard Tab
- **Mess Status Cards**: Total, Active, Inactive, Suspended counts
- **Payment Status Cards**: Approved, Pending, Rejected counts
- **Revenue Chart**: Bar chart with All Time/Weekly/Monthly/Yearly filter
- **Quick Stats**: Total revenue, average subscription value

### Subscription Tab
- **Pricing Editor**: Change monthly (৳20) and yearly (৳200) prices
- **Payment History Sections**:
  - Approved Payments (table with details)
  - Pending Payments (with Approve/Reject actions)
  - Rejected Payments (with reject reasons)
- **Reject Action**: Shows modal requiring short note before rejection

### Mess Tab
- **Summary Cards**: Monthly Plan count, Yearly Plan count
- **Search**: By Mess ID
- **Filters**: Active, Inactive, Suspended, Monthly, Yearly
- **Table Columns**: Mess ID, Mess Name, Manager Email, Status, Plan
- **Actions**: Suspend (requires note), Unsuspend
- **Suspended Mess Behavior**: Modal shown to manager "Contact Admin"

### Coupon Tab
- **Coupon Table**: Code, Discount Type, Usage Limit, Status, Expiry
- **CRUD Operations**: Create, Edit, Delete coupons
- **Promotion Editor Card**:
  - Offer name (EN/BN)
  - Coupon code selection
  - CTA button text (EN/BN)
  - Active toggle
  - Preview of homepage modal

### Help Desk Tab
- **Ticket List**: All tickets from managers
- **Chat Interface**: Reply to tickets
- **Status Management**: Open → In Progress → Resolved → Closed

---

## Manager Dashboard Enhancements

### New Sections
1. **Payment History** (under Subscription):
   - Table of past payments
   - Status (Approved/Pending/Rejected)
   - View reject reason if applicable

2. **Help Desk Tab**:
   - Create new ticket
   - View existing tickets
   - Chat with admin

3. **Notification System**:
   - New notification modal popup
   - Notifications page with read/unread state
   - Triggered by admin replies

---

## Business Rules Enforcement

### Payment Flow (STRICT)
```text
1. Manager selects plan + payment method
2. Submits payment → Creates "pending" record
3. Admin reviews in Subscription tab
4. Admin approves → Subscription activated
   OR
   Admin rejects (with reason) → Manager notified
```

### Mess Status Logic
```text
IF mess.status === 'suspended'
  → Show "Contact Admin" modal
  → No dashboard access
ELSE IF subscription.status === 'active' && !expired
  → mess_status = 'active'
ELSE
  → mess_status = 'inactive'
```

### No Auto-Activation Rules
- No trial periods
- No default plan assignment
- Subscription only after admin-approved payment
- Revenue integrity maintained

---

## UI/UX Design Specifications

### Design System
- **Style**: Modern SaaS with glassmorphism
- **Corners**: Rounded (1rem radius)
- **Shadows**: Soft, layered
- **Animations**: Smooth framer-motion transitions
- **Responsive**: Mobile-first, fully responsive

### Color Coding
- **Active/Success**: Green badges
- **Inactive/Warning**: Yellow/Orange badges
- **Suspended/Error**: Red badges
- **Pending**: Blue/Purple badges

### Admin Sidebar
```text
┌─────────────────────┐
│  🏠 Dashboard       │
│  💳 Subscription    │
│  🏢 Mess            │
│  🎟️ Coupon          │
│  💬 Help Desk       │
└─────────────────────┘
```

---

## Technical Implementation Order

### Phase 1: Database Setup
1. Add admin role to enum
2. Create payments table
3. Create coupons table
4. Create pricing_settings table
5. Create help_desk tables
6. Create promotions table
7. Add status column to messes
8. Create RLS policies

### Phase 2: Admin Infrastructure
1. Create AdminDashboardLayout
2. Create admin ProtectedRoute logic
3. Update AuthContext for admin role
4. Add admin routes to App.tsx

### Phase 3: Admin Pages
1. AdminDashboard with stats
2. AdminSubscriptionPage with payments
3. AdminMessPage with management
4. AdminCouponPage with promotions
5. AdminHelpDeskPage with chat

### Phase 4: Edge Functions
1. admin-review-payment
2. admin-suspend-mess
3. admin-update-pricing
4. manage-coupon
5. manage-promotion
6. help-desk functions

### Phase 5: Manager Updates
1. Payment flow → pending status
2. Payment history section
3. Help desk page
4. Notification modal system

### Phase 6: Homepage
1. Promotion modal component
2. Session-based display logic

---

## Security Considerations

### Admin Access Control
- Server-side role verification in all edge functions
- RLS policies check admin role
- No client-side admin status checking

### Payment Security
- All payments require admin approval
- Transaction IDs stored for verification
- Audit trail with timestamps

### Suspended Mess Handling
- Complete dashboard lockout
- Only "Contact Admin" modal shown
- No data access whatsoever
