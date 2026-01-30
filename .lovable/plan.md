

# Complete Mess Member System Implementation Plan

## Overview
This plan addresses the complete member login system, member dashboard with personal portal, manager controls (PIN records, meal reports), and admin messaging capabilities. All changes follow the existing site theme, UI/UX patterns, and security requirements.

---

## Current State Analysis

### What Exists:
- Member login flow using MessID + MessPassword + PIN verification (3-step process)
- Basic member dashboard showing stats (total meals, deposits, balance)
- Member notification page (reads from `notifications` table)
- PIN Records page for managers (shows masked PINs only)
- Meals page for managers (daily entry, no monthly/yearly reports)
- Admin mess suspension functionality

### What's Missing/Needs Fixing:
1. Member login stores session in localStorage but ProtectedRoute expects Supabase auth
2. Member dashboard needs member list view with search and personal portal access
3. PIN Records needs edit/reset PIN and suspend/unsuspend member functionality
4. Meals page needs monthly summary with dropdown for previous months
5. Admin messaging to messes (global and individual) doesn't exist
6. Members cannot access their detailed personal portal (breakdown of meals, deposits, etc.)

---

## Implementation Details

### Part 1: Fix Member Authentication and Routing

**Problem**: Member login uses localStorage-based session, but `ProtectedRoute` and `MemberDashboard` expect Supabase authentication with `user` from AuthContext.

**Solution**: Create a separate member authentication context that handles localStorage-based member sessions.

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/contexts/MemberAuthContext.tsx` | Dedicated context for member localStorage-based authentication |
| `src/components/auth/MemberProtectedRoute.tsx` | Route guard that checks localStorage member session |

**Files to Modify:**
| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap member routes with `MemberAuthProvider`, use `MemberProtectedRoute` |
| `src/pages/Login.tsx` | Clear any existing member session on load |
| `src/components/dashboard/MemberDashboardLayout.tsx` | Use MemberAuthContext instead of AuthContext |

**Key Logic:**
```text
MemberAuthContext:
- memberSession: { member_id, member_name, mess_id, mess_name, subscription, session_token }
- isAuthenticated: boolean (checks localStorage validity)
- logout: clears localStorage and redirects to /login
- On mount: verify session_token validity via edge function call
```

---

### Part 2: Redesign Member Dashboard

**Current**: Shows stats cards (Total Meals, Deposits, Balance)
**Required**: Show member list with search, click own profile to access portal via PIN

**New Member Dashboard Flow:**
```text
1. Dashboard shows list of all members in the mess (names only)
2. Search box filters member list by name
3. Member clicks their own name -> PIN entry modal
4. Correct PIN -> Navigate to /member/portal
5. Wrong PIN -> Show error (3 attempts, then temporary lock)
6. Cannot access other members' portals (backend validates member_id matches session)
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/pages/member/MemberPortalPage.tsx` | Personal portal with detailed stats |

**Files to Modify:**
| File | Changes |
|------|---------|
| `src/pages/member/MemberDashboard.tsx` | Complete redesign - show member list with search and PIN verification |
| `src/App.tsx` | Add route `/member/portal` |

**Member Portal Page Content:**
- Total meals breakdown (Breakfast, Lunch, Dinner counts)
- Bazar contribution (total from bazars where member_id matches)
- Deposit history (list with dates and amounts)
- Current balance (deposit - meal cost)
- Notifications (global + individual)

**Security Enforcement:**
```text
MemberPortalPage:
1. Get member_id from MemberAuthContext
2. Fetch data only for that member_id
3. Cannot pass different member_id via URL or request
```

---

### Part 3: Manager PIN Records Page Enhancement

**Current**: Shows members with masked PIN (••••), no actions
**Required**: Show members, edit/reset PIN, suspend/unsuspend member

**Files to Modify:**
| File | Changes |
|------|---------|
| `src/pages/dashboard/PinRecordsPage.tsx` | Add edit PIN, reset PIN, suspend/unsuspend actions |

**Files to Create:**
| File | Purpose |
|------|---------|
| `supabase/functions/update-member-pin/index.ts` | Edge function to update member PIN hash |
| `supabase/functions/toggle-member-status/index.ts` | Edge function to suspend/unsuspend member |

**New UI Elements:**
- Table columns: Name, PIN (masked), Status, Added, Actions
- Actions dropdown per row:
  - "Edit PIN" -> Opens modal with new 4-6 digit PIN input
  - "Reset PIN" -> Generates random PIN and shows it once
  - "Suspend" / "Unsuspend" -> Toggle member's is_active status

**Suspend Logic:**
- When suspended: `is_active = false`
- Suspended members don't appear in member selection during login
- Suspended members cannot verify PIN (edge function checks is_active)

---

### Part 4: Manager Meals Page with Monthly Reports

**Current**: Shows daily meal entry with date picker
**Required**: Monthly/yearly view with month dropdown

**Files to Modify:**
| File | Changes |
|------|---------|
| `src/pages/dashboard/MealsPage.tsx` | Add view toggle (Daily/Monthly), month dropdown, summary table |

**New UI Components:**
1. View toggle: "Daily Entry" | "Monthly Report"
2. Monthly Report view:
   - Dropdown with month names (only months with data)
   - Default: current month
   - Summary table: Member | Breakfast | Lunch | Dinner | Total
3. Daily Entry view: (existing functionality)

**Data Logic:**
```text
1. Fetch distinct months from meals table for this mess
2. Group meals by member_id for selected month
3. Calculate totals per member
4. Show "No data" if month has no meals
```

---

### Part 5: Admin Messaging System

**Current**: No admin-to-mess messaging exists
**Required**: Admin can send global messages (all messes) or individual messages (specific mess)

**Database Schema Addition:**
```sql
CREATE TABLE admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('global', 'mess')),
  target_mess_id UUID REFERENCES messes(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
-- Admins can insert/select all
-- Managers can select where target_type='global' OR target_mess_id=their_mess_id
```

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/pages/admin/AdminMessagesPage.tsx` | Admin page to compose and send messages |

**Files to Modify:**
| File | Changes |
|------|---------|
| `src/components/admin/AdminDashboardLayout.tsx` | Add "Messages" nav item |
| `src/App.tsx` | Add route `/admin/messages` |
| `src/pages/dashboard/NotificationsPage.tsx` | Show admin messages alongside member notifications |
| `src/pages/member/MemberNotificationsPage.tsx` | Show admin messages for member's mess |

**Admin Message Page Features:**
- Compose message form
- Target selector: "All Messes" or dropdown to select specific mess
- Message list showing sent messages with target info
- Cannot edit/delete after sending

**Manager/Member Notification Integration:**
- Fetch both `notifications` and `admin_messages` tables
- Display admin messages with "Admin" badge
- Sort by created_at descending

---

### Part 6: Mess Suspension Enforcement for Members

**Current**: Only manager sees suspension modal
**Required**: Members of suspended mess cannot login

**Files to Modify:**
| File | Changes |
|------|---------|
| `supabase/functions/member-login/index.ts` | Check mess status, return error if suspended |

**Logic:**
```text
In member-login edge function:
1. After finding mess, check mess.status
2. If status === 'suspended':
   - Return error: "This mess has been suspended. Contact admin."
   - Include suspend_reason in response
3. Reject login before member selection step
```

---

## File Change Summary

### New Files to Create (8 files)
| File | Purpose |
|------|---------|
| `src/contexts/MemberAuthContext.tsx` | Member localStorage-based auth context |
| `src/components/auth/MemberProtectedRoute.tsx` | Protected route for member pages |
| `src/pages/member/MemberPortalPage.tsx` | Member personal portal with detailed stats |
| `src/pages/admin/AdminMessagesPage.tsx` | Admin messaging interface |
| `supabase/functions/update-member-pin/index.ts` | Update member PIN |
| `supabase/functions/toggle-member-status/index.ts` | Suspend/unsuspend member |
| Database migration for `admin_messages` table | Admin messaging table |

### Existing Files to Modify (10 files)
| File | Changes |
|------|---------|
| `src/App.tsx` | Add MemberAuthProvider, MemberProtectedRoute, new routes |
| `src/pages/Login.tsx` | Clear member session on load |
| `src/pages/member/MemberDashboard.tsx` | Redesign with member list and PIN portal access |
| `src/pages/member/MemberNotificationsPage.tsx` | Include admin messages |
| `src/components/dashboard/MemberDashboardLayout.tsx` | Use MemberAuthContext |
| `src/pages/dashboard/PinRecordsPage.tsx` | Add PIN edit/reset and suspend actions |
| `src/pages/dashboard/MealsPage.tsx` | Add monthly report view with dropdown |
| `src/pages/dashboard/NotificationsPage.tsx` | Include admin messages for managers |
| `src/components/admin/AdminDashboardLayout.tsx` | Add Messages nav item |
| `supabase/functions/member-login/index.ts` | Check mess suspension status |

---

## Implementation Order

1. **Member Auth Context and Protected Route** - Foundation for member access
2. **Member Dashboard Redesign** - Member list with search and PIN access
3. **Member Portal Page** - Personal stats and details
4. **PIN Records Enhancement** - Edit/reset PIN, suspend members
5. **Meals Monthly Report** - Month dropdown and summary table
6. **Admin Messages Database** - Create table and RLS
7. **Admin Messages Page** - Compose and send messages
8. **Notification Integration** - Show admin messages to managers/members
9. **Mess Suspension for Members** - Block suspended mess member login

---

## Security Considerations

1. **Member Session Validation**: Add edge function to verify session_token is still valid
2. **PIN Access Scoping**: Backend validates member can only access their own portal
3. **Admin Message RLS**: Strict policies ensure managers only see their mess's messages
4. **Suspend Cascade**: Suspended mess blocks both manager and member access
5. **No Cross-Role Access**: Member routes only accept member context, not manager auth

---

## Testing Requirements

After implementation, verify:
1. Member login with MessID/Password shows member list
2. Member can only access their own portal via correct PIN
3. Wrong PIN shows error, 3 failures trigger temporary lock
4. Manager can edit/reset member PIN from PIN Records
5. Manager can suspend/unsuspend members
6. Suspended members cannot login
7. Meals page shows monthly summary with working month dropdown
8. Admin can send global and individual messages
9. Managers and members see admin messages in notifications
10. Members of suspended mess cannot login (see suspension message)

