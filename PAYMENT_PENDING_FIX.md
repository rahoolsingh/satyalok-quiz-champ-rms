# Payment Status Stuck on PENDING - Fix

## Problem
Payment status was stuck on PENDING even after successful payment completion. The frontend would show "Verifying Payment" indefinitely or until max retries.

## Root Cause
The `paymentVerification.ts` service was calling the wrong PGS endpoint:

**Wrong Endpoint** (404 Error):
```
GET http://172.31.0.1:5002/api/payment/status/QC261778487248767X
```

**Error from logs**:
```
[Payment Verification] Error: AxiosError: Request failed with status code 404
Cannot GET /api/payment/status/QC261778487248767X
```

## Solution

### Backend Fix
Updated `backend/src/services/paymentVerification.ts` to use the correct PGS client function:

**Before**:
```typescript
const response = await axios.get(
  `${pgsBaseUrl}/api/payment/status/${merchantTransactionId}`,
  { headers: { 'x-api-key': pgsApiKey } }
);
```

**After**:
```typescript
import { verifyPhonePePayment, PGSError } from './pgsClient';

const response = await verifyPhonePePayment(merchantTransactionId);
// This calls: GET /quizChampStatusS2S?id={merchantTransactionId}
```

### Frontend Fix
Updated `frontend/src/pages/PaymentStatus.tsx` to prevent infinite refresh loops:

**Changes**:
1. Removed `window.location.reload()` that caused infinite loops
2. Added retry limit (max 5 retries = 15 seconds)
3. Used state-based retries instead of page reloads
4. Added proper cleanup on component unmount
5. Shows helpful error message after max retries

## How It Works Now

### Payment Flow:
```
1. User completes payment on PhonePe
2. PhonePe redirects to: /api/payment/callback?id={txnId}
3. Backend calls verifyPhonePePayment(txnId)
   ✅ Correct endpoint: GET /quizChampStatusS2S?id={txnId}
4. PGS returns payment status
5. Backend updates participant.paymentStatus to 'COMPLETED'
6. Backend generates roll number
7. Backend sends WhatsApp & email notifications
8. User redirected to: /payment-status?participantId={id}
9. Frontend fetches /profile/me
10. Shows admit card or success message
```

### Status Verification:
```typescript
// PGS Response Format
{
  success: true,
  data: {
    transactionId: "QC261778487248767X",
    amount: 500,
    state: "COMPLETED" // or "PENDING", "FAILED"
  }
}
```

### Status Mapping:
- `SUCCESS`, `COMPLETED`, `PAYMENT_SUCCESS` → `SUCCESS`
- `FAILED`, `PAYMENT_ERROR`, `PAYMENT_DECLINED` → `FAILED`
- Everything else → `PENDING`

## Files Modified

1. **backend/src/services/paymentVerification.ts**
   - Replaced axios call with `verifyPhonePePayment()` from pgsClient
   - Updated error handling for PGSError
   - Fixed endpoint to use `/quizChampStatusS2S?id={txnId}`

2. **frontend/src/pages/PaymentStatus.tsx**
   - Added retry limit (5 retries max)
   - Removed infinite `window.location.reload()`
   - Added state-based retry mechanism
   - Added cleanup on unmount
   - Better error messages

## Testing

### Test Successful Payment:
1. Complete a payment on PhonePe
2. Get redirected to payment-status page
3. Should see admit card within 3-15 seconds
4. Check backend logs for:
   ```
   [Payment Verification] Checking status for QC...
   [Payment Verification] Status: SUCCESS (gateway state: COMPLETED)
   [Payment Verification] Payment completed for {name}
   ```

### Test Failed Payment:
1. Cancel payment on PhonePe
2. Get redirected to payment-status page
3. Should see failure message
4. Check backend logs for:
   ```
   [Payment Verification] Status: FAILED
   [Payment Verification] Payment failed for {name}
   ```

### Test Pending Payment:
1. If payment is still processing
2. Frontend will retry 5 times (15 seconds)
3. After 5 retries, shows error with manual retry option

## Deployment

1. **Pull latest code**:
   ```bash
   cd ~/satyalok-quiz-champ-rms/backend
   git pull
   ```

2. **Rebuild Docker**:
   ```bash
   docker compose down
   docker compose up --build -d
   ```

3. **Check logs**:
   ```bash
   docker compose logs -f backend
   ```

4. **Verify fix**:
   - Make a test payment
   - Check that status updates correctly
   - Verify admit card is generated

## Related Issues Fixed

1. ✅ Payment status stuck on PENDING
2. ✅ Infinite API calls on payment-status page
3. ✅ 404 errors when verifying payment
4. ✅ Page refresh loops
5. ✅ No error message after failed verification

## Prevention

To prevent similar issues in the future:
1. Always use the PGS client functions (`pgsClient.ts`) instead of direct axios calls
2. Test payment verification with actual PGS endpoints
3. Add retry limits to prevent infinite loops
4. Log all API calls for debugging
5. Handle errors gracefully with user-friendly messages

## Rollback

If issues occur, rollback to previous version:
```bash
cd ~/satyalok-quiz-champ-rms/backend
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>
docker compose up --build -d
```
