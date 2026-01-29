
# Contact Form System Implementation Plan

## Overview
This plan implements a complete contact form system where visitors can submit messages, and admins can view and reply to these messages via email through the admin dashboard.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                      PUBLIC CONTACT PAGE                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Contact Form (Name, Email, Message)                   │   │
│  │   ↓                                                     │   │
│  │   Validate → Save to contact_messages table             │   │
│  │   ↓                                                     │   │
│  │   Show Success Message (Bengali/English)                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN HELP DESK PAGE                         │
│  ┌────────────────────┐  ┌──────────────────────────────────┐  │
│  │ Tab: Tickets       │  │ Tab: Contact Messages (NEW)      │  │
│  │ (existing)         │  │   - Filter: All/New/Replied      │  │
│  │                    │  │   - Message List with badges     │  │
│  └────────────────────┘  │   - Detail View + Reply Form     │  │
│                          │   ↓                              │  │
│                          │   Send Reply via Edge Function   │  │
│                          │   ↓                              │  │
│                          │   Email sent → Save reply →      │  │
│                          │   Update status                  │  │
│                          └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Database Schema

Create two new tables with proper RLS policies:

**Table: `contact_messages`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Sender name |
| email | text | Sender email |
| message | text | Message content |
| status | text | 'new' or 'replied' |
| created_at | timestamp | Submission time |

**Table: `contact_message_replies`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| contact_message_id | uuid | FK to contact_messages |
| admin_id | uuid | Admin who replied |
| reply_message | text | Reply content |
| sent_at | timestamp | When email was sent |

**RLS Policies:**
- `contact_messages`: Public INSERT (for form), Admin-only SELECT/UPDATE
- `contact_message_replies`: Admin-only INSERT/SELECT

---

### Step 2: Contact Page Form Enhancement

Update `src/pages/ContactPage.tsx` to:

1. Add form state management with useState
2. Add Zod validation schema for:
   - Name: required, max 100 chars
   - Email: required, valid email format, max 255 chars
   - Message: required, max 1000 chars
3. Add loading state for submit button
4. On submit:
   - Validate all fields
   - Insert into `contact_messages` with status='new'
   - Show bilingual success toast
   - Reset form

**Success Message:**
- Bengali: "আপনার মেসেজ সফলভাবে পাঠানো হয়েছে। আমরা দ্রুত উত্তর দিবো।"
- English: "Your message has been sent successfully. We will reply soon."

---

### Step 3: Admin Help Desk Page Enhancement

Update `src/pages/admin/AdminHelpDeskPage.tsx` to add a tabbed interface:

**Tab 1: Tickets (existing)**
- Keep all current functionality unchanged

**Tab 2: Contact Messages (new)**
- Filter buttons: All | New | Replied
- Message list showing:
  - Name
  - Email
  - Message preview (truncated)
  - Status badge (New = warning color, Replied = success color)
  - Created date
- Detail view with:
  - Full message
  - Sender info
  - Timestamp
  - Reply history (if any)
  - Reply textarea + Send button

---

### Step 4: Edge Function for Email Reply

Create `supabase/functions/send-contact-reply/index.ts`:

**Input:**
```typescript
{
  contactMessageId: string;
  recipientEmail: string;
  recipientName: string;
  replyMessage: string;
}
```

**Process:**
1. Validate all inputs
2. Send email via Resend API:
   - From: "MessHishab Support <noreply@info.softauro.com>"
   - To: Recipient email
   - Subject: "Reply from Mess Hishab Support"
   - Body: Professional HTML template with reply message
3. Return success/error response

**The existing `RESEND_API_KEY` secret will be used.**

---

### Step 5: Admin Reply Logic in Frontend

When admin clicks "Send Reply":

1. Validate reply message is not empty
2. Call edge function to send email
3. If email succeeds:
   - Insert reply into `contact_message_replies`
   - Update `contact_messages` status to 'replied'
   - Show success toast
4. If email fails:
   - Show error toast
   - Do NOT update status

---

### Step 6: Language Translations

Add new translation keys for:
- Tab labels
- Filter buttons
- Status badges
- Reply form labels
- Success/error messages
- Empty state messages

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/send-contact-reply/index.ts` | Edge function for sending reply emails |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/ContactPage.tsx` | Add form logic, validation, database insert |
| `src/pages/admin/AdminHelpDeskPage.tsx` | Add Contact Messages tab with full UI |
| `src/contexts/LanguageContext.tsx` | Add ~30 new translation keys |
| `supabase/config.toml` | Register new edge function |

### Database Migration
- Create `contact_messages` table
- Create `contact_message_replies` table
- Add RLS policies for admin access and public insert

---

## Security Considerations

1. **Input Validation**: Zod schema validates all form inputs
2. **Input Length Limits**: Prevents oversized submissions
3. **RLS Policies**: Only admins can read/reply to messages
4. **Public Insert Only**: Visitors can only submit, not read
5. **Email Sanitization**: Reply content sanitized before sending
6. **Admin Verification**: Edge function verifies admin role

---

## UI/UX Design

- Matches existing glass-card theme
- Uses primary color for active states
- Status badges: New (warning/yellow), Replied (success/green)
- Mobile responsive layout
- Loading states on all async operations
- Smooth animations with framer-motion
- Bilingual support (Bengali/English)
