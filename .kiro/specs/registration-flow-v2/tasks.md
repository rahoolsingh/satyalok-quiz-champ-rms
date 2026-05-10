# Implementation Plan — Registration Flow V2

- [x] 1. Add photoUrl and otpVerifiedAt fields to Participant model
  - Add `photoUrl?: string` and `otpVerifiedAt?: Date` to `IParticipant` interface and `ParticipantSchema`
  - _Requirements: 5.2_

- [x] 2. Implement JWT session token service (`src/services/sessionToken.ts`)
  - [x] 2.1 Create `signSessionToken(mobileNumber)` and `verifySessionToken(token)` functions
    - Use `jsonwebtoken`, 30-minute expiry, secret from `SESSION_JWT_SECRET` env var
    - _Requirements: 1.3_
  - [ ]* 2.2 Write property test for JWT session token correctness (Property 2)
    - **Feature: registration-flow-v2, Property 2: JWT session token correctness**
    - **Validates: Requirements 1.3, 1.4**

- [x] 3. Implement session auth middleware (`src/middleware/sessionAuth.ts`)
  - Extract Bearer token from `Authorization` header, verify with `verifySessionToken`
  - Attach `req.verifiedMobile` to request; return 401 if missing or invalid
  - _Requirements: 1.4, 1.5_

- [x] 4. Implement OTP rate limiting (`src/middleware/otpRateLimit.ts`)
  - [x] 4.1 IP-based limiter using `express-rate-limit`: 10 req/min per IP, returns 429
    - _Requirements: 3.3_
  - [x] 4.2 Per-mobile cooldown and burst limiter stored in MongoDB (`OtpRateLimit` model)
    - 60s cooldown between requests; block after 5 requests in 10 minutes for 10 minutes
    - Return `retryAfterSeconds` in 429 response
    - _Requirements: 3.1, 3.2, 3.4_
  - [ ]* 4.3 Write property test for OTP cooldown enforcement (Property 6)
    - **Feature: registration-flow-v2, Property 6: OTP cooldown enforcement**
    - **Validates: Requirements 3.1, 3.4**
  - [ ]* 4.4 Write property test for OTP burst limit (Property 7)
    - **Feature: registration-flow-v2, Property 7: OTP burst limit**
    - **Validates: Requirements 3.2, 3.4**

- [ ] 5. Create new OTP routes (`src/routes/otp.ts`) and wire into `src/index.ts`
  - [x] 5.1 `POST /api/otp/send` — check completed/pending status, apply rate limits, send OTP, return masked number
    - Reject with 409 if mobile has COMPLETED registration
    - _Requirements: 1.2, 2.1, 3.1, 3.2, 3.3_
  - [x] 5.2 `POST /api/otp/verify` — verify OTP, return JWT session token + existing draft if any
    - _Requirements: 1.3, 2.2, 2.3_
  - [x] 5.3 Mount `otpRouter` at `/api/otp` in `src/index.ts`
  - [ ]* 5.4 Write property test for mobile masking (Property 1)
    - **Feature: registration-flow-v2, Property 1: Mobile masking**
    - **Validates: Requirements 1.2**
  - [ ]* 5.5 Write property test for completed registration blocks OTP (Property 4)
    - **Feature: registration-flow-v2, Property 4: Completed registration blocks OTP**
    - **Validates: Requirements 2.1**
  - [ ]* 5.6 Write property test for pending draft returned on re-verify (Property 5)
    - **Feature: registration-flow-v2, Property 5: Pending draft is returned on re-verify**
    - **Validates: Requirements 2.2**

- [x] 6. Update registration routes for draft save, photo upload, and tracking
  - [x] 6.1 `POST /api/registration/draft` — authenticated, multipart, upserts participant record
    - Require valid session token; validate mobile matches token
    - Accept optional photo (JPEG/PNG/WebP, max 2MB); upload to S3 if provided
    - Upsert participant: create if none exists, update if PENDING, reject if COMPLETED
    - _Requirements: 4.1, 4.2, 4.4, 5.1, 5.2_
  - [x] 6.2 `GET /api/registration/draft` — authenticated, returns current draft for mobile
    - _Requirements: 4.3_
  - [x] 6.3 `POST /api/registration/initiate-payment` — authenticated, calls PGS, returns redirectUrl
    - Replaces the payment initiation currently in `verify-otp`
    - _Requirements: 1.4_
  - [x] 6.4 `GET /api/registration/track?mobile=...` — public, returns status + admit card or retry info
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]* 6.5 Write property test for draft upsert idempotency (Property 9)
    - **Feature: registration-flow-v2, Property 9: Draft upsert idempotency and round-trip**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  - [ ]* 6.6 Write property test for photo file validation (Property 10)
    - **Feature: registration-flow-v2, Property 10: Photo file validation**
    - **Validates: Requirements 5.1, 5.4**
  - [ ]* 6.7 Write property test for tracking response completeness (Property 12)
    - **Feature: registration-flow-v2, Property 12: Tracking response completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 7. Update admit card service to include photo URL
  - Add `photoUrl?: string` to `AdmitCardData` interface
  - Include `photoUrl` in `generateAdmitCardData` output when present on participant
  - _Requirements: 5.3_
  - [ ]* 7.1 Write property test for photo URL round-trip (Property 11)
    - **Feature: registration-flow-v2, Property 11: Photo URL round-trip**
    - **Validates: Requirements 5.2, 5.3, 6.2**

- [x] 8. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update frontend — new MobileEntry step
  - [x] 9.1 Create `src/components/MobileEntry.tsx`
    - Input for mobile number + batch selector
    - Calls `POST /api/otp/send`; on success moves to OTP verification step
    - Shows 409 error if already registered with link to tracking page
    - _Requirements: 1.1, 2.1_
  - [x] 9.2 Update `OTPVerification.tsx` to call new `POST /api/otp/verify`
    - Store returned `sessionToken` in component state (pass up to parent)
    - If draft returned, pass it down to RegistrationForm
    - _Requirements: 1.3, 2.2_
  - [x] 9.3 Update `PublicPortal.tsx` flow: home → mobile-entry → otp → form → payment
    - Pass `sessionToken` and `draft` through the flow
    - _Requirements: 1.1_

- [x] 10. Update frontend — RegistrationForm with photo upload and draft pre-fill
  - Accept optional `draft` prop to pre-fill fields
  - Add photo upload input (file picker, preview, max 2MB client-side check)
  - Submit as `multipart/form-data` with `Authorization: Bearer {sessionToken}`
  - On success, call `POST /api/registration/initiate-payment` to get redirectUrl
  - _Requirements: 4.1, 4.2, 5.1_

- [x] 11. Add frontend API client methods
  - `otpApi.send(mobileNumber)`, `otpApi.verify(mobileNumber, otp)`
  - `registrationApi.saveDraft(formData, token)`, `registrationApi.getDraft(token)`
  - `registrationApi.initiatePayment(token)`, `registrationApi.track(mobile)`
  - _Requirements: all_

- [ ] 12. Create `src/pages/TrackingPage.tsx`
  - Mobile number input → calls `GET /api/registration/track?mobile=...`
  - Shows: name, batch, status badge, registration date
  - COMPLETED: renders `<AdmitCard>` with photo
  - PENDING: shows "Resume Payment" button with redirectUrl
  - FAILED: shows "Try Again" link back to registration
  - Add route `/track` in `App.tsx`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13. Add `SESSION_JWT_SECRET` to `.env.example`
  - _Requirements: 1.3_

- [ ] 14. Final Checkpoint — Ensure all tests pass, ask the user if questions arise.
