# Admit Card Access After Registration Closes

## Overview
This document describes the implementation that allows registered users with completed payment status to login and download their admit cards even after the registration portal closes.

## Changes Made

### Frontend (PublicPortal.tsx)

#### 1. Enhanced CLOSED State Handling
When `status.state === "CLOSED"`, the portal now has three different views:

**a) Authenticated User with Completed Payment**
- Shows UserProfile component with full admit card access
- Displays logout button in header
- User can download admit card, view details, and access all features

**b) Login Flow (mobile-entry or OTP steps)**
- Allows users to login even when registration is closed
- Shows mobile entry and OTP verification screens
- After successful OTP verification:
  - If payment is COMPLETED: redirects to profile page with admit card
  - If payment is PENDING/FAILED: shows error message and logs user out

**c) Public View (default)**
- Shows "Registration Closed" message
- Displays "Login to Access Admit Card" button
- Shows important dates, help section, and FAQs
- No new registrations allowed

#### 2. Login Flow Logic
```typescript
// When portal is closed and user logs in:
if (profileData?.paymentStatus === "COMPLETED") {
  // Allow access - show profile with admit card
  setStep("profile");
} else {
  // Block access - show error message
  alert("Your registration is not complete...");
  handleLogout();
}
```

#### 3. Button Action
```typescript
<Button
  onClick={() => setStep("mobile-entry")}
  variant="default"
>
  Login to Access Admit Card
</Button>
```

### Backend (No Changes Required)

#### OTP Routes (`otp.ts`)
- Already allows OTP send/verify for all users
- No portal state restrictions
- Returns complete profile data including payment status

#### Registration Routes (`registration.ts`)
- No portal state checks in admit card endpoints
- `/admit-card/:id/download` works regardless of portal state
- Only checks if participant exists and payment is COMPLETED

#### Portal State Service (`portalState.ts`)
- Returns current portal state (COUNTDOWN, OPEN, CLOSED)
- Backend doesn't enforce registration restrictions

## User Flow

### Scenario 1: User Visits After Registration Closes
1. Portal shows "Registration Closed" message
2. User clicks "Login to Access Admit Card"
3. Enters mobile number
4. Verifies OTP
5. If payment completed → sees admit card and can download
6. If payment not completed → sees error and is logged out

### Scenario 2: Already Logged In User
1. User's session is restored on page load
2. If payment status is COMPLETED:
   - Directly shows profile page with admit card
   - Even when portal state is CLOSED
3. Can download PDF, view roll number, etc.

### Scenario 3: User Without Registration
1. Clicks "Login to Access Admit Card"
2. Enters mobile number not in system
3. OTP verification succeeds but no profile found
4. Shows appropriate error message

## Features Maintained

### When Portal is CLOSED but User is Authenticated:
✅ Download admit card PDF
✅ View roll number
✅ View personal details
✅ Join WhatsApp group (if configured)
✅ View event details and venue
✅ Access help section
✅ Logout functionality

### Blocked When Portal is CLOSED:
❌ New user registration
❌ Editing existing registration
❌ New payment initiation
❌ Batch selection for registration

## Security Considerations

1. **Authentication Required**: Users must verify OTP to access admit card
2. **Payment Verification**: Only COMPLETED payment status gets admit card access
3. **Session Token**: Secure session management with HTTP-only cookies
4. **Data Isolation**: Users can only access their own admit card data

## Testing Checklist

- [ ] User with completed payment can login when portal is closed
- [ ] Admit card PDF downloads successfully
- [ ] User without completed payment is denied access
- [ ] Login button appears on closed portal view
- [ ] Mobile entry and OTP screens work during closed state
- [ ] Logout functionality works properly
- [ ] Session restoration works after page refresh
- [ ] Error messages display correctly for incomplete registrations
- [ ] Help section shows on all closed portal views
- [ ] Important dates section displays correctly

## Related Files

### Modified:
- `quiz-champ/frontend/src/pages/PublicPortal.tsx` - Added closed state login flow
- `quiz-champ/frontend/src/components/WhatsAppHelp.tsx` - Added HelpSection component

### Referenced (No Changes):
- `quiz-champ/backend/src/routes/otp.ts` - OTP verification
- `quiz-champ/backend/src/routes/registration.ts` - Admit card download
- `quiz-champ/backend/src/db/models/participant.model.ts` - Data structure
- `quiz-champ/frontend/src/components/UserProfile.tsx` - Profile display
- `quiz-champ/frontend/src/components/AdmitCard.tsx` - Admit card component

## Notes

- Backend doesn't enforce portal state restrictions for admit card access
- Frontend controls the UX flow based on portal state
- Session tokens expire after 24 hours
- OTP rate limiting still applies even when portal is closed
- Payment status verification happens on every login
