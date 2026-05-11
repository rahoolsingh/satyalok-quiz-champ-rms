# Requirements Document

## Introduction

This feature enables all users to login via OTP (sent via WhatsApp) and view their admit card if they have completed payment. Users who haven't completed registration can continue with the registration flow. The system includes photo compression and cropping, WhatsApp notifications, payment verification, and a professional user profile view. This removes the previous restriction that prevented users with completed registrations from logging in and enforces one registration per mobile number.

## Glossary

- **System**: The Quiz Champ registration and admit card portal
- **User**: Any person with a mobile number attempting to access the portal
- **Admit Card**: A digital document containing participant details and roll number
- **Completed Registration**: A registration record with payment status "COMPLETED"
- **Pending Registration**: A registration record with payment status "PENDING" or "FAILED"
- **OTP**: One-Time Password sent via WhatsApp for authentication
- **Session**: An authenticated user session after successful OTP verification
- **WhatsApp**: Messaging platform used for OTP delivery and notifications
- **Photo Compression**: Process of reducing image file size while maintaining quality
- **WebP**: Modern image format for web with superior compression
- **Payment Verification**: Background process to check payment status with payment gateway
- **User Profile**: Dashboard showing registration details and payment history

## Requirements

### Requirement 1

**User Story:** As a user with a completed registration, I want to login and view my admit card, so that I can access my registration details anytime.

#### Acceptance Criteria

1. WHEN a user with completed registration requests OTP THEN the System SHALL send the OTP via WhatsApp without restriction
2. WHEN a user with completed registration verifies OTP THEN the System SHALL create a valid session token
3. WHEN a user with completed registration logs in THEN the System SHALL display their user profile with admit card
4. WHEN the admit card is displayed THEN the System SHALL show all participant details including roll number, name, class, batch, guardian name, and mobile number
5. WHEN the admit card is displayed THEN the System SHALL provide download and print functionality

### Requirement 2

**User Story:** As a user with pending registration, I want to login and complete my registration, so that I can finish the payment process.

#### Acceptance Criteria

1. WHEN a user with pending registration requests OTP THEN the System SHALL send the OTP via WhatsApp
2. WHEN a user with pending registration verifies OTP THEN the System SHALL create a valid session token
3. WHEN a user with pending registration logs in THEN the System SHALL display the registration form with any saved draft data
4. WHEN the registration form is displayed THEN the System SHALL allow the user to complete payment
5. WHEN pending payment exists THEN the System SHALL display payment status to prevent duplicate payments

### Requirement 3

**User Story:** As a new user, I want to login and register for the first time, so that I can participate in the quiz competition.

#### Acceptance Criteria

1. WHEN a new user requests OTP THEN the System SHALL send the OTP via WhatsApp
2. WHEN a new user verifies OTP THEN the System SHALL create a valid session token
3. WHEN a new user logs in THEN the System SHALL display the registration form
4. WHEN the registration form is displayed THEN the System SHALL allow the user to enter details and proceed to payment

### Requirement 4

**User Story:** As a logged-in user, I want to logout and login with a different number, so that I can access different accounts.

#### Acceptance Criteria

1. WHEN a logged-in user clicks logout THEN the System SHALL clear the session
2. WHEN the session is cleared THEN the System SHALL redirect to the home screen
3. WHEN the user is on home screen THEN the System SHALL allow login with any mobile number

### Requirement 5

**User Story:** As a user uploading a photo, I want the system to compress and optimize my photo, so that it loads quickly and looks professional on my admit card.

#### Acceptance Criteria

1. WHEN a user uploads a photo THEN the System SHALL display a crop interface
2. WHEN the user adjusts the crop area THEN the System SHALL preview the cropped result in real-time
3. WHEN the user confirms the crop THEN the System SHALL compress the image to optimal size
4. WHEN the image is compressed THEN the System SHALL convert it to WebP format
5. WHEN the WebP image is created THEN the System SHALL ensure file size is under 200 KB while maintaining visual quality

### Requirement 6

**User Story:** As a user, I want to receive OTP via WhatsApp, so that I can authenticate securely using my preferred messaging platform.

#### Acceptance Criteria

1. WHEN a user requests OTP THEN the System SHALL send the 6-digit code via WhatsApp
2. WHEN the OTP is sent THEN the System SHALL include a message indicating it is for Quiz Champ 2026 registration
3. WHEN the user enters the mobile number THEN the System SHALL display a message stating "You will receive OTP on WhatsApp"
4. WHEN OTP delivery fails THEN the System SHALL log the error and notify the user

### Requirement 7

**User Story:** As a user who completed payment, I want to receive a thank you message on WhatsApp, so that I have confirmation of my successful registration.

#### Acceptance Criteria

1. WHEN payment is confirmed as successful THEN the System SHALL send a thank you message via WhatsApp
2. WHEN the thank you message is sent THEN the System SHALL include the participant's roll number
3. WHEN the thank you message is sent THEN the System SHALL include a link to download the admit card
4. WHEN the thank you message is sent THEN the System SHALL include event details and contact information

### Requirement 8

**User Story:** As a system administrator, I want the system to verify payment status automatically, so that admit cards are issued correctly and failed payments are marked.

#### Acceptance Criteria

1. WHEN a payment is initiated THEN the System SHALL store the merchant transaction ID
2. WHEN payment callback is received THEN the System SHALL verify the payment status with the payment gateway
3. WHEN payment is verified as successful THEN the System SHALL update status to COMPLETED and generate admit card
4. WHEN payment is verified as failed THEN the System SHALL update status to FAILED
5. WHEN payment status is ambiguous THEN the System SHALL implement a background job to check status periodically

### Requirement 9

**User Story:** As a user, I want to view my complete registration profile, so that I can see all my details and payment history in one place.

#### Acceptance Criteria

1. WHEN a logged-in user accesses their profile THEN the System SHALL display personal details including name, class, batch, and guardian name
2. WHEN the profile is displayed THEN the System SHALL show the complete address
3. WHEN the profile is displayed THEN the System SHALL show payment status with visual indicators
4. WHEN payment is completed THEN the System SHALL display the admit card prominently
5. WHEN payment is pending THEN the System SHALL show payment amount and option to complete payment
6. WHEN payment has failed THEN the System SHALL show retry option with clear messaging

### Requirement 10

**User Story:** As a system, I want to enforce one registration per mobile number, so that users cannot create duplicate registrations.

#### Acceptance Criteria

1. WHEN a user attempts to register THEN the System SHALL check for existing registrations with the same mobile number
2. WHEN an existing completed registration is found THEN the System SHALL prevent new registration and show the existing admit card
3. WHEN an existing pending registration is found THEN the System SHALL allow the user to complete that registration
4. WHEN an existing failed registration is found THEN the System SHALL allow the user to retry payment or create a new registration
5. WHEN checking for duplicates THEN the System SHALL use mobile number as the unique identifier
