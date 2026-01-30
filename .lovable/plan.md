
# Fix Login Flow and White Screen Issues

## Problem Summary
After successful login, users see a white screen on the dashboard because of a race condition in the authentication flow. The system correctly authenticates but fails to properly load user data before rendering the dashboard.

## Root Cause
There are multiple issues working together:

1. **Race condition in authentication context**: The `onAuthStateChange` listener fires but doesn't properly wait for user data to load before allowing navigation
2. **Incorrect role checking**: When `userRole` is still loading (`null`), the protected route incorrectly redirects users
3. **Database queries using `.single()`**: Some queries throw errors when no data is found instead of returning null gracefully

## Solution

### Part 1: Fix AuthContext Race Condition
Restructure the authentication initialization to follow the proven pattern:
- Set up `onAuthStateChange` listener BEFORE calling `getSession()`  
- Ensure `isLoading` stays `true` until ALL user data is fetched
- Fix the `onAuthStateChange` to properly handle the loading state during subsequent auth events

### Part 2: Fix ProtectedRoute Logic
Update the role checking to handle the case when `userRole` is still `null`:
- Consider loading as incomplete if user exists but role hasn't loaded yet
- Only perform role-based redirects after role data is available

### Part 3: Fix MemberAuthContext Database Queries
Replace `.single()` with `.maybeSingle()` in MemberAuthContext to prevent errors when records don't exist.

### Part 4: Simplify Login Redirect
Use React Router's `navigate()` instead of `window.location.href` to prevent full page reloads that cause the race condition to manifest.

---

## Technical Details

### File 1: `src/contexts/AuthContext.tsx`
- Add a new state variable to track if user data fetch is complete
- Restructure the `useEffect` to set up the auth listener before getting the session
- Ensure `isLoading` only becomes `false` after both session AND user data are ready
- Make `onAuthStateChange` trigger user data refresh properly

### File 2: `src/components/auth/ProtectedRoute.tsx`
- Add check: if user exists but userRole is null, consider it still loading
- This prevents premature role-based redirects

### File 3: `src/contexts/MemberAuthContext.tsx`
- Replace all `.single()` calls with `.maybeSingle()` to prevent errors
- Add proper null checks

### File 4: `src/pages/Login.tsx`
- Consider using `navigate()` with proper state instead of `window.location.href`
- Remove setTimeout workaround as it's no longer needed with proper auth handling

---

## Expected Outcome
After implementing these fixes:
- Login will complete and redirect to the correct dashboard
- The dashboard will render properly instead of showing a white screen
- No more "signal aborted" or loading loop issues
- Proper error handling for missing database records
