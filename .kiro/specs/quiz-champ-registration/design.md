# Design Document

## Overview

The Quiz Champ 2026 system is a full-stack web application that manages the complete lifecycle of a quiz competition event. The system consists of three main user-facing interfaces: a public portal with dynamic states (countdown, registration, results), a registration workflow with OTP verification and payment integration, and an administrative dashboard for event management. The architecture follows a client-server model with a React-based frontend and a Node.js/Express backend, using PostgreSQL for data persistence.

## Architecture

### System Architecture

The system follows a three-tier architecture:

1. **Presentation Layer**: React-based single-page application (SPA) with responsive design
2. **Application Layer**: Node.js/Express REST API handling business logic, authentication, and integrations
3. **Data Layer**: PostgreSQL database with proper indexing and constraints

### Key Architectural Decisions

- **Stateful Portal Management**: The portal state (countdown, open, closed) is determined by comparing current time against configured dates, ensuring automatic transitions
- **OTP Service**: Integration with a third-party SMS gateway (e.g., Twilio, MSG91) for OTP delivery
- **Payment Gateway**: Integration with a payment provider (e.g., Razorpay, Stripe) for secure payment processing
- **File Storage**: Cloud storage (e.g., AWS S3, Cloudinary) for slider images and admit cards
- **Session Management**: JWT-based authentication for admin users, session-based OTP verification for registration flow

## Components and Interfaces

### Frontend Components

#### Public Portal Components

1. **CountdownTimer**: Displays time remaining until registration opens
2. **ImageSlider**: Carousel component for promotional images
3. **BatchSelector**: Two-button interface for Junior/Senior batch selection
4. **RegistrationForm**: Multi-field form with validation
5. **OTPVerification**: OTP input interface with resend functionality
6. **PaymentGateway**: Embedded payment interface
7. **AdmitCard**: Downloadable admit card display
8. **ResultChecker**: Roll number input and result display

#### Admin Dashboard Components

1. **DateConfiguration**: Date pickers for opening/closing dates
2. **SliderManager**: Image upload, reorder, and delete interface
3. **ResultUploader**: CSV/Excel file upload with validation
4. **RegistrationList**: Searchable, filterable table of participants
5. **PortalStatusToggle**: Manual override for portal state

### Backend API Endpoints

#### Public Endpoints

- `GET /api/portal/status` - Returns current portal state and configuration
- `GET /api/portal/slider-images` - Returns list of slider images
- `POST /api/registration` - Submits registration form, triggers OTP
- `POST /api/registration/verify-otp` - Verifies OTP, returns payment session
- `POST /api/registration/confirm-payment` - Confirms payment, generates admit card
- `GET /api/registration/admit-card/:id` - Retrieves admit card
- `GET /api/results/:rollNumber` - Retrieves result for a roll number

#### Admin Endpoints (Authenticated)

- `POST /api/admin/login` - Admin authentication
- `PUT /api/admin/portal/dates` - Updates opening/closing dates
- `PUT /api/admin/portal/status` - Manually sets portal status
- `POST /api/admin/slider/upload` - Uploads slider image
- `DELETE /api/admin/slider/:id` - Removes slider image
- `PUT /api/admin/slider/reorder` - Reorders slider images
- `POST /api/admin/results/upload` - Uploads result data
- `PUT /api/admin/results/publish` - Sets result publication date
- `GET /api/admin/registrations` - Lists all registrations with filters

## Data Models

### Participant

```typescript
{
  id: UUID (primary key)
  rollNumber: string (unique, 5 digits)
  name: string (required)
  class: string (required)
  batchType: enum ['JUNIOR', 'SENIOR'] (required)
  guardianName: string (required)
  address: string (required)
  mobileNumber: string (required, indexed)
  email: string (optional)
  referralSource: string (optional)
  paymentStatus: enum ['PENDING', 'COMPLETED', 'FAILED']
  paymentId: string (optional)
  admitCardUrl: string (optional)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### OTPVerification

```typescript
{
  id: UUID (primary key)
  mobileNumber: string (indexed)
  otp: string (hashed)
  expiresAt: timestamp
  verified: boolean
  attempts: integer
  createdAt: timestamp
}
```

### PortalConfiguration

```typescript
{
  id: UUID (primary key)
  openingDate: timestamp (required)
  closingDate: timestamp (required)
  manualStatus: enum ['AUTO', 'COUNTDOWN', 'OPEN', 'CLOSED'] (default: 'AUTO')
  resultPublicationDate: timestamp (optional)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### SliderImage

```typescript
{
  id: UUID (primary key)
  imageUrl: string (required)
  displayOrder: integer (required)
  createdAt: timestamp
}
```

### Result

```typescript
{
  id: UUID (primary key)
  participantId: UUID (foreign key, unique)
  rollNumber: string (indexed)
  score: integer (required)
  rank: integer (optional)
  remarks: string (optional)
  publishedAt: timestamp (optional)
  createdAt: timestamp
}
```

### AdminUser

```typescript
{
  id: UUID (primary key)
  username: string (unique, required)
  passwordHash: string (required)
  email: string (required)
  createdAt: timestamp
  lastLoginAt: timestamp
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 4.6 and 5.2 both test roll number uniqueness - these will be combined
- Properties related to form field presence (3.3, 3.4) are structural checks that can be verified together
- Properties about portal state synchronization (7.5, 8.4) follow the same pattern

### Portal State Properties

**Property 1: Countdown display before opening**
*For any* current date that is before the configured opening date, the portal should display a countdown timer showing the time remaining until registration opens.
**Validates: Requirements 1.1**

**Property 2: Countdown prevents registration access**
*For any* date before the opening date, the portal should prevent access to the registration form.
**Validates: Requirements 1.4**

**Property 3: Event name visibility during countdown**
*For any* portal state during countdown phase, the event name "Quiz Champ 2026" should be displayed.
**Validates: Requirements 1.3**

**Property 4: Slider display when open**
*For any* portal state when registration is open, the slider component with images should be displayed.
**Validates: Requirements 2.1**

**Property 5: Batch buttons presence**
*For any* portal state when the slider is displayed, both Junior and Senior batch selection buttons should be present.
**Validates: Requirements 2.3**

**Property 6: Slider images match configuration**
*For any* set of slider images configured by admin, the portal should display exactly those images in the specified order.
**Validates: Requirements 2.4**

**Property 7: Portal closure after closing date**
*For any* date after the configured closing date, the portal should display "Coming Soon" and prevent new registrations.
**Validates: Requirements 7.3**

**Property 8: Admin status changes reflect immediately**
*For any* portal status change made by admin, the portal should reflect the new status on the next status check.
**Validates: Requirements 7.5**

### Registration and Validation Properties

**Property 9: Incomplete form rejection**
*For any* registration form submission with one or more required fields missing, the system should display validation errors and prevent submission.
**Validates: Requirements 3.5**

**Property 10: Complete form acceptance**
*For any* registration form with all required fields properly filled, the system should proceed to OTP verification.
**Validates: Requirements 3.6**

**Property 11: OTP sent for valid registration**
*For any* valid registration form submission, an OTP should be sent to the provided mobile number.
**Validates: Requirements 4.1**

**Property 12: OTP interface display**
*For any* OTP sent successfully, the portal should display the OTP entry interface.
**Validates: Requirements 4.2**

**Property 13: Incorrect OTP handling**
*For any* incorrect OTP entered, the system should display an error message and allow retry without losing registration data.
**Validates: Requirements 4.3**

**Property 14: Correct OTP progression**
*For any* correct OTP entered, the system should redirect to the payment interface.
**Validates: Requirements 4.4**

### Roll Number and Admit Card Properties

**Property 15: Roll number uniqueness**
*For any* set of participants in the system, all assigned roll numbers should be unique (no duplicates).
**Validates: Requirements 4.6, 5.2**

**Property 16: Roll number format**
*For any* generated roll number, it should be exactly 5 digits in length.
**Validates: Requirements 5.2**

**Property 17: Admit card generation after payment**
*For any* successful payment completion, an admit card should be generated containing participant name, class, batch type, and roll number.
**Validates: Requirements 4.5, 5.1**

**Property 18: Admit card accessibility**
*For any* generated admit card, it should be retrievable using the participant's identifier.
**Validates: Requirements 5.3**

**Property 19: Participant-roll number association**
*For any* participant with an assigned roll number, querying by that roll number should return the correct participant information.
**Validates: Requirements 5.4**

### Result Management Properties

**Property 20: Valid roll number result retrieval**
*For any* valid roll number with published results, querying that roll number should return the corresponding result data.
**Validates: Requirements 6.2**

**Property 21: Invalid roll number error handling**
*For any* roll number that doesn't exist in the system, the result checker should display an appropriate error message.
**Validates: Requirements 6.3**

**Property 22: Result publication timing**
*For any* date after the configured result publication date, results should be available for checking.
**Validates: Requirements 9.5**

**Property 23: Result roll number validation**
*For any* result data uploaded, all roll numbers in the data should exist in the registration database, otherwise validation should fail.
**Validates: Requirements 9.2**

**Property 24: Invalid result data rejection**
*For any* result upload containing roll numbers that don't exist, the system should display validation errors and prevent publication.
**Validates: Requirements 9.3**

### Admin Management Properties

**Property 25: Slider image removal**
*For any* existing slider image, an admin should be able to remove it, and it should no longer appear in the portal.
**Validates: Requirements 8.2**

**Property 26: Slider image reordering**
*For any* reordering of slider images by admin, the portal should display images in the new order.
**Validates: Requirements 8.3**

**Property 27: Slider updates synchronization**
*For any* slider image addition, removal, or reordering, the portal should display the updated slider on the next page load.
**Validates: Requirements 8.4**

**Property 28: Image format validation**
*For any* file uploaded as a slider image, non-image formats should be rejected with a validation error.
**Validates: Requirements 8.5**

**Property 29: Participant list completeness**
*For any* request to view registrations, all registered participants should appear in the list.
**Validates: Requirements 10.1**

**Property 30: Payment status display**
*For any* participant in the registration list, their payment status should be accurately displayed.
**Validates: Requirements 10.2**

**Property 31: Batch filter accuracy**
*For any* batch type filter applied, only participants of that batch type should be returned.
**Validates: Requirements 10.3**

**Property 32: Participant search accuracy**
*For any* search term entered, all participants whose name, roll number, or mobile number contains that term should be returned.
**Validates: Requirements 10.4**

**Property 33: Registration count accuracy**
*For any* set of registrations, the displayed counts for Junior and Senior batches should equal the actual number of participants in each batch.
**Validates: Requirements 10.5**

## Error Handling

### Client-Side Error Handling

1. **Form Validation Errors**: Display inline validation messages for each field with specific error descriptions
2. **Network Errors**: Show user-friendly messages when API calls fail, with retry options
3. **Payment Failures**: Provide clear error messages and allow users to retry payment without re-entering registration data
4. **OTP Expiry**: Notify users when OTP expires and provide resend functionality
5. **File Upload Errors**: Validate file size and format before upload, show specific error messages

### Server-Side Error Handling

1. **Database Errors**: Log errors, return generic error messages to clients, implement retry logic for transient failures
2. **External Service Failures**: 
   - SMS Gateway: Queue OTP requests, implement fallback mechanisms
   - Payment Gateway: Handle webhook failures, implement idempotent payment confirmation
   - File Storage: Implement retry logic, maintain local cache
3. **Validation Errors**: Return structured error responses with field-level error details
4. **Authentication Errors**: Return 401 for invalid credentials, 403 for insufficient permissions
5. **Rate Limiting**: Implement rate limiting on OTP generation and result checking to prevent abuse

### Data Integrity

1. **Transaction Management**: Use database transactions for multi-step operations (registration + OTP, payment + admit card generation)
2. **Idempotency**: Implement idempotency keys for payment confirmations to prevent duplicate charges
3. **Concurrent Access**: Use database locks or optimistic locking for roll number generation to ensure uniqueness
4. **Data Validation**: Validate all inputs on both client and server side
5. **Audit Logging**: Log all admin actions and critical user actions for accountability

## Testing Strategy

### Unit Testing

The system will use **Jest** as the testing framework for both frontend and backend unit tests.

**Backend Unit Tests:**
- API endpoint handlers with mocked dependencies
- Business logic functions (roll number generation, date comparisons, validation)
- Database query functions with mocked database connections
- Integration with external services (mocked SMS and payment gateways)

**Frontend Unit Tests:**
- React component rendering with various props
- Form validation logic
- State management functions
- API client functions with mocked responses

**Key Unit Test Examples:**
- Test that roll number generation creates 5-digit numbers
- Test that form validation catches missing required fields
- Test that countdown timer calculates time differences correctly
- Test that admin authentication rejects invalid credentials
- Test that result upload validation catches non-existent roll numbers

### Property-Based Testing

The system will use **fast-check** for property-based testing in JavaScript/TypeScript.

**Configuration:**
- Each property-based test should run a minimum of 100 iterations
- Each test must include a comment tag in the format: `**Feature: quiz-champ-registration, Property {number}: {property_text}**`
- Each correctness property from the design document must be implemented by exactly one property-based test

**Property Test Categories:**

1. **Portal State Properties**: Generate random dates and portal configurations, verify correct state display
2. **Validation Properties**: Generate random form data (valid and invalid), verify validation behavior
3. **Uniqueness Properties**: Generate multiple participants, verify roll number uniqueness
4. **Data Integrity Properties**: Generate random operations, verify data consistency
5. **Search and Filter Properties**: Generate random participant data and search terms, verify result accuracy

**Example Property Tests:**
- Generate random dates before opening date, verify countdown is displayed
- Generate random incomplete forms, verify all are rejected
- Generate N participants, verify all N roll numbers are unique
- Generate random slider image orders, verify portal displays in correct order
- Generate random batch filters, verify only matching participants returned

### Integration Testing

- End-to-end registration flow: form submission → OTP → payment → admit card
- Admin workflow: login → upload slider → configure dates → upload results
- Result checking flow: enter roll number → display result
- Portal state transitions: countdown → open → closed

### Test Execution Strategy

1. **Implementation-First Development**: Implement features before writing corresponding tests
2. **Complementary Testing**: Use both unit tests (specific examples) and property tests (universal properties) for comprehensive coverage
3. **Test Organization**: Co-locate tests with source files using `.test.ts` or `.spec.ts` suffix
4. **Continuous Testing**: Run tests on every commit, block merges if tests fail
5. **Coverage Goals**: Aim for >80% code coverage, 100% coverage for critical paths (payment, roll number generation)

## Security Considerations

1. **Authentication**: Admin endpoints protected with JWT authentication, secure password hashing with bcrypt
2. **Authorization**: Role-based access control for admin functions
3. **Input Validation**: Sanitize all user inputs to prevent SQL injection and XSS attacks
4. **Rate Limiting**: Prevent brute force attacks on OTP verification and admin login
5. **HTTPS**: All communication over encrypted connections
6. **Payment Security**: PCI compliance through payment gateway, never store card details
7. **Data Privacy**: Hash/encrypt sensitive data, comply with data protection regulations
8. **Session Management**: Secure session tokens, implement timeout and logout functionality

## Deployment Considerations

1. **Environment Configuration**: Separate configurations for development, staging, and production
2. **Database Migration**: Use migration tools (e.g., Knex.js migrations) for schema changes
3. **Monitoring**: Implement logging and monitoring for system health and errors
4. **Backup**: Regular database backups with point-in-time recovery
5. **Scalability**: Design for horizontal scaling of application servers, use connection pooling for database
6. **CDN**: Serve static assets (images, admit cards) through CDN for performance
