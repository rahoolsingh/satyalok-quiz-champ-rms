# Payment Status Refactor

## Overview
Replaced hardcoded PaymentSuccess and PaymentFailed pages with a unified PaymentStatus page that dynamically fetches and displays the actual payment status from the PhonePe server.

## Problem
- After payment cancellation, users were redirected to payment-success page
- Payment status was determined by URL routing, not actual payment verification
- No real-time status checking from PhonePe gateway

## Solution
Created a unified `PaymentStatus` page that:
1. Fetches actual payment status from backend via `/profile/me` endpoint
2. Shows loading state while verifying with PhonePe
3. Displays appropriate UI based on actual payment status (SUCCESS/FAILED/PENDING)
4. Auto-retries if payment is still pending

## Changes Made

### Frontend

#### 1. New File: `quiz-champ/frontend/src/pages/PaymentStatus.tsx`
- Unified payment status page
- Four states: `checking`, `success`, `failed`, `error`
- Fetches real payment status from backend
- Auto-refreshes if payment is pending
- Shows admit card on success
- Provides retry options on failure

#### 2. Updated: `quiz-champ/frontend/src/App.tsx`
- Replaced separate routes with unified `/payment-status` route
- Legacy routes (`/payment-success`, `/payment-failed`) redirect to new page
- Removed imports for old PaymentSuccess and PaymentFailed components

### Backend

#### 3. Updated: `quiz-champ/backend/src/routes/payment.ts`
- Changed all redirects to use `/payment-status` instead of separate pages
- Passes `participantId` or `txnId` as query parameters
- Maintains same verification logic, only redirect URLs changed

## Flow

### Before
```
PhonePe Callback → Backend → Redirect to /payment-success or /payment-failed
                                ↓
                          Hardcoded UI (no verification)
```

### After
```
PhonePe Callback → Backend → Redirect to /payment-status?participantId=xxx
                                ↓
                          Fetch /profile/me (includes payment status)
                                ↓
                          Show actual status (SUCCESS/FAILED/PENDING)
                                ↓
                          If PENDING → Auto-retry after 3s
```

## Benefits

1. **Accurate Status**: Always shows real payment status from PhonePe
2. **No False Positives**: Can't show success if payment actually failed
3. **Handles Edge Cases**: Properly handles pending/processing states
4. **Better UX**: Loading states and auto-retry for pending payments
5. **Single Source of Truth**: Backend payment status is the authority

## API Integration

The page uses the existing `/profile/me` endpoint which:
- Returns user profile with `paymentStatus` field
- Includes admit card data if payment is completed
- Uses HTTP-only cookie for authentication

## Testing Scenarios

1. **Successful Payment**: Shows admit card and success message
2. **Failed Payment**: Shows failure message with retry option
3. **Cancelled Payment**: Detected as failed, shows appropriate message
4. **Pending Payment**: Shows loading state, auto-retries
5. **Network Error**: Shows error state with manual retry option

## Migration Notes

- Old `/payment-success` and `/payment-failed` routes still work (redirect to new page)
- No breaking changes for existing links or bookmarks
- Old PaymentSuccess.tsx and PaymentFailed.tsx files can be safely deleted
