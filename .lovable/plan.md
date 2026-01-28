
# Password Reset Feature Implementation

## Overview
Implement a complete password reset flow for managers using Resend email service.

## What You Need to Do First
Before I implement this, please add your Resend API key:
1. Click the **"Add Secret"** button that will appear below
2. Enter your Resend API key (starts with `re_...`)

## Implementation Steps

### 1. Create Forgot Password Page
Create `src/pages/ForgotPassword.tsx`:
- Email input form with validation
- Success/error messaging
- Link back to login
- Bengali/English language support

### 2. Create Password Reset Edge Function
Create `supabase/functions/send-password-reset/index.ts`:
- Accept email address
- Generate secure reset token using Supabase Auth
- Send email via Resend with reset link
- Handle errors gracefully

### 3. Create Reset Password Page
Create `src/pages/ResetPassword.tsx`:
- Token validation from URL
- New password input with confirmation
- Password strength indicator
- Success redirect to login

### 4. Update App Routes
Add routes in `src/App.tsx`:
- `/forgot-password` - Request reset email
- `/reset-password` - Set new password (with token)

## User Flow

```text
Login Page
    |
    v
"Forgot Password?" link
    |
    v
Forgot Password Page
(Enter email)
    |
    v
Edge Function sends email via Resend
    |
    v
User clicks link in email
    |
    v
Reset Password Page
(Enter new password)
    |
    v
Password updated
    |
    v
Redirect to Login
```

## Technical Details

**Edge Function Security:**
- Uses Supabase's built-in `resetPasswordForEmail` method
- Generates secure, time-limited tokens
- Logs all reset attempts

**Email Template:**
- Clean, branded design
- Bengali/English support
- Clear call-to-action button
- Expiration notice (1 hour)

**Password Requirements:**
- Minimum 6 characters
- Confirmation field must match
