# Implementation Plan — PhonePe Payment Integration

- [x] 1. Add merchantTransactionId to Participant model and update types
  - Add optional `merchantTransactionId` field to `IParticipant` interface in `src/db/models.ts`
  - Add the field to `ParticipantSchema` with a sparse unique index
  - Add `merchantTransactionId?: string` to the `Participant` type in `src/types/index.ts`
  - _Requirements: 3.2_

- [x] 2. Implement the fee lookup and transaction ID utilities in `payment.ts`
  - [x] 2.1 Replace mock payment service with real utilities
    - Implement `getRegistrationFee(batchType: BatchType): number` returning 100 for JUNIOR and 150 for SENIOR, throwing for unknown types
    - Implement `generateMerchantTransactionId(): string` returning `QC26{Date.now()}{randomUpperChar}`
    - Remove the old mock `createPaymentSession` and `verifyPayment` exports
    - _Requirements: 1.1, 1.2, 1.3, 2.1_
  - [ ]* 2.2 Write property test for fee lookup (Property 1)
    - **Feature: phonepe-payment-integration, Property 1: Fee lookup is total and canonical**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [ ]* 2.3 Write property test for transaction ID format and uniqueness (Property 2)
    - **Feature: phonepe-payment-integration, Property 2: Merchant Transaction ID format and uniqueness**
    - **Validates: Requirements 2.1**

- [x] 3. Implement the PGS HTTP client (`src/services/pgsClient.ts`)
  - [x] 3.1 Create `pgsClient.ts` with axios-based `initiatePhonePePayment` and `verifyPhonePePayment` functions
    - Read `PGS_BASE_URL` and `PGS_API_KEY` from environment variables
    - `initiatePhonePePayment(participant, merchantTransactionId, amount)` calls `POST /quizChampOrder` with `x-api-key` header
    - `verifyPhonePePayment(merchantTransactionId)` calls `GET /status?id={id}` with `x-api-key` header
    - Both functions throw on non-2xx responses
    - _Requirements: 2.2, 5.1, 5.3_
  - [ ]* 3.2 Write property test for PGS outbound request shape (Property 3)
    - **Feature: phonepe-payment-integration, Property 3: PGS outbound request is well-formed**
    - **Validates: Requirements 2.2, 5.1**
  - [ ]* 3.3 Write property test for redirect URL pass-through (Property 4)
    - **Feature: phonepe-payment-integration, Property 4: Redirect URL pass-through**
    - **Validates: Requirements 2.3**
  - [ ]* 3.4 Write property test for PGS error propagation (Property 5)
    - **Feature: phonepe-payment-integration, Property 5: PGS error propagates as 502**
    - **Validates: Requirements 2.4, 5.2**

- [x] 4. Update `POST /api/registration/verify-otp` to use the real PGS client
  - Replace `createPaymentSession` call with `getRegistrationFee` + `generateMerchantTransactionId` + `initiatePhonePePayment`
  - Store `merchantTransactionId` on the participant document before calling PGS
  - Return `{ redirectUrl, merchantTransactionId, amount, participantId }` in the response
  - Wrap PGS call in try/catch; return HTTP 502 on failure
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 5. Implement `GET /api/payment/callback` route
  - [x] 5.1 Create the callback route handler in `src/routes/payment.ts`
    - Accept `id` query param (merchantTransactionId)
    - Call `verifyPhonePePayment(id)` to get status from PGS
    - On success: update participant `paymentStatus` to COMPLETED, assign roll number, set `paymentId`
    - On failure: update participant `paymentStatus` to FAILED
    - Skip re-processing if participant is already COMPLETED (idempotency)
    - Redirect browser to `FRONTEND_URL/payment-success?participantId=...` or `FRONTEND_URL/payment-failed`
    - _Requirements: 3.2, 3.3, 3.4, 4.1, 4.2_
  - [ ]* 5.2 Write property test for callback status driving participant state (Property 6)
    - **Feature: phonepe-payment-integration, Property 6: Callback status drives participant state**
    - **Validates: Requirements 3.2, 3.3, 3.4**
  - [ ]* 5.3 Write property test for callback redirect URL (Property 7)
    - **Feature: phonepe-payment-integration, Property 7: Callback redirect targets correct frontend page**
    - **Validates: Requirements 4.1, 4.2**

- [x] 6. Register the payment callback route in `src/index.ts`
  - Import `paymentRouter` from `./routes/payment`
  - Mount at `/api/payment`
  - Add `PGS_BASE_URL` and `PGS_API_KEY` to `.env.example`
  - _Requirements: 3.1_

- [x] 7. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update frontend `PaymentGateway.tsx` to redirect instead of mock-confirm
  - Replace the `handlePay` mock call with `window.location.href = session.redirectUrl`
  - Update `PaymentSession` type to include `redirectUrl: string`
  - _Requirements: 2.3_

- [x] 9. Add `/payment-success` and `/payment-failed` frontend pages
  - [x] 9.1 Create `src/pages/PaymentSuccess.tsx`
    - Read `participantId` from query string
    - Fetch admit card data via `registrationApi.getAdmitCard(participantId)`
    - Render `<AdmitCard>` component on success
    - Show loading spinner while fetching
    - _Requirements: 4.1_
  - [x] 9.2 Create `src/pages/PaymentFailed.tsx`
    - Show failure message and a "Try again" link back to registration
    - _Requirements: 4.2_
  - [x] 9.3 Register both pages in the router (`src/App.tsx`)
    - Add routes `/payment-success` and `/payment-failed`
    - _Requirements: 4.1, 4.2_

- [x] 10. Final Checkpoint — Ensure all tests pass, ask the user if questions arise.
