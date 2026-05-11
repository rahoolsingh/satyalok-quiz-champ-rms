# Session Expiry and Payment Verification Fix

## Overview
This document describes the implementation of two critical fixes:
1. **Session expiry error message** - Clear error message when session expires
2. **Automatic pending payment verification** - Check last 3 pending payments on login

## Changes Made

### 1. Backend Changes

#### A. Session Authentication Middleware (`backend/src/middleware/sessionAuth.ts`)
- ✅ Already implemented: Returns clear error message "Session expired or invalid. Please verify your mobile number again."
- No changes needed - working as expected

#### B. OTP Verification Route (`backend/src/routes/otp.ts`)
**Added automatic payment verification on login:**
- When user logs in with OTP, system checks if they have a PENDING payment
- Automatically verifies payment status with PhonePe gateway
- If payment was successful but not captured in DB:
  - Updates payment status to COMPLETED
  - Generates roll number
  - Sends WhatsApp and email notifications
  - Returns updated profile with admit card
- Handles errors gracefully and continues with existing data if verification fails

#### C. Profile Routes (`backend/src/routes/profile.ts`)
**Added new endpoint: `POST /api/profile/check-pending-payments`**
- Checks last 3 pending payments for authenticated user
- Verifies each payment with PhonePe gateway
- Updates status to COMPLETED or FAILED based on gateway response
- Returns updated profile data
- Protected by session authentication middleware

### 2. Frontend Changes

#### A. API Client (`frontend/src/api/client.ts`)
**Added new method:**
```typescript
checkPendingPayments: () => api.post('/profile/check-pending-payments')
```

#### B. User Profile Component (`frontend/src/components/UserProfile.tsx`)
**Added manual payment verification button:**
- New "🔄 Check Payment Status" button for PENDING payments
- Shows loading state while checking
- Displays success/info messages after check
- Updates profile automatically if payment status changes
- Integrated with existing payment status card

#### C. Public Portal (`frontend/src/pages/PublicPortal.tsx`)
**Added profile update handler:**
- Passes `onProfileUpdate` callback to UserProfile component
- Updates local profile state when payment status changes
- Ensures UI reflects latest payment status

### 3. Payment Verification Service (`backend/src/services/paymentVerification.ts`)
- No changes needed - already has all required functions:
  - `verifyPaymentStatus()` - Checks payment with gateway
  - `processPaymentVerification()` - Updates DB and sends notifications

## User Flow

### Scenario 1: Payment Successful but Not Captured
1. User completes payment on PhonePe
2. Payment gateway callback fails or times out
3. User logs in again with OTP
4. **System automatically checks pending payment**
5. Finds successful payment and updates status
6. User sees admit card immediately

### Scenario 2: Manual Payment Check
1. User has PENDING payment status
2. User clicks "🔄 Check Payment Status" button
3. System checks last 3 pending payments with gateway
4. Updates status if payment was successful
5. Shows success message and updated profile

### Scenario 3: Session Expired
1. User's session expires (after 24 hours)
2. User tries to access protected route
3. **Gets clear error: "Session expired or invalid. Please verify your mobile number again."**
4. User logs in again with OTP
5. System automatically checks pending payments (Scenario 1)

## Technical Details

### Payment Verification Logic
- Checks last 3 PENDING payments (configurable)
- Uses existing `verifyPaymentStatus()` from payment gateway client
- Maps gateway status to internal status (SUCCESS/FAILED/PENDING)
- Handles PGS errors gracefully
- Logs all verification attempts

### Error Handling
- Network errors: Returns PENDING status, allows retry
- Gateway errors: Logs error, continues with other payments
- Database errors: Returns 500 with error message
- Session errors: Returns 401 with clear message

### Security
- All endpoints protected by session authentication
- Only checks payments for authenticated user's mobile number
- No sensitive payment data exposed in responses
- HTTP-only cookies prevent XSS attacks

## Testing Checklist

- [ ] Session expiry shows correct error message
- [ ] Login automatically checks pending payments
- [ ] Manual check button works for PENDING status
- [ ] Successful payment updates to COMPLETED
- [ ] Failed payment updates to FAILED
- [ ] WhatsApp notification sent on success
- [ ] Email with admit card sent on success
- [ ] Roll number generated on success
- [ ] UI updates after payment verification
- [ ] Error messages display correctly
- [ ] Loading states work properly

## Environment Variables Required
```env
# PhonePe Payment Gateway
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1
PHONEPE_API_URL=https://api.phonepe.com/apis/hermes

# Frontend URL for callbacks
FRONTEND_URL=http://localhost:3000

# WhatsApp & Email (for notifications)
WHATSAPP_PROVIDER=mock
EMAIL_PROVIDER=mock
```

## API Endpoints

### POST /api/otp/verify
**Request:**
```json
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

**Response (with pending payment check):**
```json
{
  "message": "OTP verified successfully. Payment status updated!",
  "profile": {
    "participantId": "...",
    "paymentStatus": "COMPLETED",
    "rollNumber": "JR260001",
    "admitCard": { ... }
  }
}
```

### POST /api/profile/check-pending-payments
**Headers:**
```
Cookie: sessionToken=...
```

**Response:**
```json
{
  "message": "Checked 3 pending payment(s), updated 1",
  "checkedCount": 3,
  "updatedCount": 1,
  "profile": { ... }
}
```

## Notes
- Payment verification runs automatically on login (no user action needed)
- Manual check button provides additional control for users
- System checks last 3 pending payments to handle edge cases
- All verification attempts are logged for debugging
- Graceful degradation: If verification fails, user can retry manually
