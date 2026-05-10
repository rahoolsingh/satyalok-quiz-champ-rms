# Requirements Document

## Introduction

Redesign the Quiz Champ registration flow so that mobile OTP verification happens first, before the form is shown. Add draft saving, photo upload for the admit card, payment history/tracking, rate limiting on OTP, a cooldown period, and enforce one registration per mobile number.

## Glossary

- **Draft**: A participant record with `paymentStatus: PENDING` that has been OTP-verified but not yet paid.
- **OTP Cooldown**: A mandatory wait period before a new OTP can be requested for the same mobile number.
- **Rate Limiter**: A server-side control that rejects requests exceeding a defined frequency threshold.
- **Photo**: A participant-uploaded image stored in S3, displayed on the admit card.
- **Payment Tracking Page**: A page accessible by mobile number that shows registration status, payment status, and admit card if available.
- **QCB**: Quiz Champ Backend.
- **Verified Session**: A short-lived token issued after OTP verification that authorises form submission and draft editing for that mobile number.

## Requirements

### Requirement 1 — OTP-first flow

**User Story:** As a participant, I want to verify my mobile number before filling the form, so that only real phone owners can register.

#### Acceptance Criteria

1. WHEN a user selects a batch on the home page, THE system SHALL display a mobile number entry screen before showing the registration form.
2. WHEN a user submits a mobile number, THE QCB SHALL send an OTP to that number and return a masked confirmation.
3. WHEN a user successfully verifies the OTP, THE QCB SHALL issue a short-lived verified session token (JWT, 30-minute expiry) tied to that mobile number.
4. WHEN a user presents a valid verified session token, THE QCB SHALL allow form submission for that mobile number only.
5. IF a user attempts to submit the registration form without a valid verified session token, THEN THE QCB SHALL return HTTP 401.

---

### Requirement 2 — One registration per mobile number

**User Story:** As a system operator, I want each mobile number to register only once, so that duplicate entries are prevented.

#### Acceptance Criteria

1. WHEN a mobile number already has a `COMPLETED` payment, THE QCB SHALL reject a new OTP request for that number with HTTP 409 and a clear message.
2. WHEN a mobile number has an existing `PENDING` draft, THE QCB SHALL return the existing draft data along with the verified session token after OTP verification, instead of creating a new record.
3. WHEN a mobile number has a `FAILED` payment, THE QCB SHALL allow re-registration by reusing the existing participant record.

---

### Requirement 3 — OTP rate limiting and cooldown

**User Story:** As a system operator, I want OTP requests to be rate-limited, so that the SMS API is not abused.

#### Acceptance Criteria

1. THE QCB SHALL enforce a cooldown of 60 seconds between OTP requests for the same mobile number.
2. IF a mobile number requests more than 5 OTPs within a 10-minute window, THEN THE QCB SHALL block further OTP requests for that number for 10 minutes and return HTTP 429.
3. THE QCB SHALL enforce a global IP-based rate limit of 10 OTP requests per minute per IP address.
4. WHEN a cooldown or block is active, THE QCB SHALL return the remaining wait time in seconds in the error response.

---

### Requirement 4 — Draft saving and editing

**User Story:** As a participant, I want my form data saved as a draft so that I can return and complete payment later.

#### Acceptance Criteria

1. WHEN a verified user submits the registration form, THE QCB SHALL save the data as a `PENDING` participant record (draft) and return the participant ID.
2. WHEN a verified user submits the form for a mobile number that already has a `PENDING` draft, THE QCB SHALL update the existing draft with the new data.
3. WHEN a participant has a `PENDING` draft, THE QCB SHALL allow the participant to retrieve and edit the draft using their verified session token.
4. IF a participant's `paymentStatus` is `COMPLETED`, THEN THE QCB SHALL reject any edit requests for that participant with HTTP 403.

---

### Requirement 5 — Photo upload for admit card

**User Story:** As a participant, I want to upload a photo during registration so that it appears on my admit card.

#### Acceptance Criteria

1. WHEN a participant submits the registration form, THE QCB SHALL accept an optional photo file upload (JPEG, PNG, WebP, max 2 MB).
2. WHEN a valid photo is uploaded, THE QCB SHALL store the photo in S3 and save the URL on the participant record.
3. WHEN an admit card is generated, THE QCB SHALL include the participant's photo URL if one is present.
4. IF an uploaded file exceeds 2 MB or is not an accepted format, THEN THE QCB SHALL return HTTP 400 with a descriptive error.

---

### Requirement 6 — Payment tracking page

**User Story:** As a participant, I want to check my registration and payment status using my mobile number, so that I can track my application.

#### Acceptance Criteria

1. WHEN a participant enters their mobile number on the tracking page, THE QCB SHALL return the participant's name, batch, payment status, registration date, and roll number (if assigned).
2. WHEN `paymentStatus` is `COMPLETED`, THE QCB SHALL also return the admit card data including photo URL.
3. WHEN `paymentStatus` is `PENDING`, THE QCB SHALL return a redirect URL to resume payment.
4. WHEN `paymentStatus` is `FAILED`, THE QCB SHALL return a message indicating failure and a link to retry.
5. IF no registration exists for the mobile number, THEN THE QCB SHALL return HTTP 404.
