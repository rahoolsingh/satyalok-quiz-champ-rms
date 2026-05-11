# Design Document

## Overview

This design implements a comprehensive user authentication and profile management system that allows all users to login via WhatsApp OTP and access their registration status. The system includes photo processing with compression and cropping, WhatsApp notifications, payment verification, and a professional mobile-first user profile interface. The design enforces one registration per mobile number and provides different views based on payment status.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/TS)     │
│                 │
│  - PublicPortal │
│  - UserProfile  │
│  - PhotoCropper │
└────────┬────────┘
         │
         │ HTTPS/REST
         │
┌────────▼────────┐
│   Backend       │
│  (Node/Express) │
│                 │
│  - OTP Routes   │
│  - Registration │
│  - Profile API  │
└────┬───┬───┬────┘
     │   │   │
     │   │   └──────────┐
     │   │              │
     ▼   ▼              ▼
┌─────────┐  ┌──────────────┐  ┌──────────────┐
│WhatsApp │  │   MongoDB    │  │  Payment     │
│   API   │  │              │  │  Gateway     │
│         │  │ Participants │  │  (PhonePe)   │
└─────────┘  └──────────────┘  └──────────────┘
     │
     │
┌────▼─────┐
│  S3/CDN  │
│  Photos  │
└──────────┘
```

### Component Flow

1. **Login Flow**: User enters mobile → OTP sent via WhatsApp → User verifies → Session created → Profile loaded
2. **Photo Upload Flow**: User selects photo → Crop interface shown → User adjusts → Compress to WebP → Upload to S3
3. **Payment Flow**: User submits form → Payment initiated → Redirect to gateway → Callback received → Verify status → Send WhatsApp confirmation
4. **Profile View**: User logs in → Check payment status → Show appropriate view (admit card / registration form / pending payment)

## Components and Interfaces

### Frontend Components

#### 1. UserProfile Component
```typescript
interface UserProfileProps {
  sessionToken: string;
  mobileNumber: string;
  onLogout: () => void;
}

interface ProfileData {
  participantId: string;
  name: string;
  class: string;
  batchType: 'JUNIOR' | 'SENIOR';
  guardianName: string;
  address: string;
  mobileNumber: string;
  email?: string;
  photoUrl?: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  rollNumber?: string;
  merchantTransactionId?: string;
  paymentAmount?: number;
  registeredAt: Date;
  admitCard?: AdmitCardData;
}
```

#### 2. PhotoCropper Component
```typescript
interface PhotoCropperProps {
  imageFile: File;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // default 1:1 for square
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

#### 3. PaymentStatusCard Component
```typescript
interface PaymentStatusCardProps {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount?: number;
  merchantTransactionId?: string;
  onRetry?: () => void;
  onComplete?: () => void;
}
```

### Backend Services

#### 1. WhatsApp Service
```typescript
interface WhatsAppService {
  sendOTP(mobile: string, otp: string): Promise<void>;
  sendThankYouMessage(mobile: string, data: ThankYouData): Promise<void>;
  sendPaymentReminder(mobile: string, data: ReminderData): Promise<void>;
}

interface ThankYouData {
  name: string;
  rollNumber: string;
  admitCardUrl: string;
  eventDate: string;
  contactInfo: string;
}
```

#### 2. Image Processing Service
```typescript
interface ImageProcessingService {
  compressAndConvert(
    imageBuffer: Buffer,
    options: CompressionOptions
  ): Promise<ProcessedImage>;
}

interface CompressionOptions {
  maxSizeKB: number; // 200
  format: 'webp';
  quality: number; // 80-90
  maxWidth?: number;
  maxHeight?: number;
}

interface ProcessedImage {
  buffer: Buffer;
  mimeType: string;
  sizeKB: number;
  width: number;
  height: number;
}
```

#### 3. Payment Verification Service
```typescript
interface PaymentVerificationService {
  verifyPaymentStatus(merchantTransactionId: string): Promise<PaymentStatus>;
  scheduleVerificationJob(merchantTransactionId: string, retryCount: number): Promise<void>;
}

interface PaymentStatus {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId: string;
  amount: number;
  timestamp: Date;
}
```

#### 4. Profile Service
```typescript
interface ProfileService {
  getProfile(mobileNumber: string): Promise<ProfileData>;
  checkDuplicateRegistration(mobileNumber: string): Promise<DuplicateCheckResult>;
}

interface DuplicateCheckResult {
  exists: boolean;
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
  participantId?: string;
}
```

### API Endpoints

#### New/Modified Endpoints

```
POST   /api/otp/send
  - Modified to use WhatsApp delivery
  - Body: { mobileNumber: string }
  - Response: { message: string, maskedMobile: string }

POST   /api/otp/verify
  - Returns profile data with payment status
  - Body: { mobileNumber: string, otp: string }
  - Response: { sessionToken: string, profile: ProfileData }

GET    /api/profile
  - Requires authentication
  - Returns complete user profile
  - Response: { profile: ProfileData }

POST   /api/registration/photo
  - Accepts cropped image
  - Compresses and converts to WebP
  - Body: FormData with 'photo' field
  - Response: { photoUrl: string, sizeKB: number }

POST   /api/payment/verify/:merchantTransactionId
  - Manually trigger payment verification
  - Requires authentication
  - Response: { status: PaymentStatus }

GET    /api/registration/check-duplicate
  - Check for existing registration
  - Query: mobile=1234567890
  - Response: DuplicateCheckResult
```

## Data Models

### Participant Model (Updated)

```typescript
interface ParticipantDocument {
  _id: ObjectId;
  name: string;
  class: string;
  batchType: 'JUNIOR' | 'SENIOR';
  guardianName: string;
  address: string;
  mobileNumber: string; // Unique index
  email?: string;
  referralSource?: string;
  photoUrl?: string;
  photoSizeKB?: number; // Track compressed size
  photoFormat?: string; // 'webp'
  rollNumber?: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  merchantTransactionId?: string;
  paymentAmount?: number;
  paymentVerifiedAt?: Date;
  paymentVerificationAttempts?: number;
  otpVerifiedAt?: Date;
  whatsappNotificationSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
// - mobileNumber: unique
// - paymentStatus: for queries
// - merchantTransactionId: for payment callbacks
```

### Payment Verification Job Model

```typescript
interface PaymentVerificationJob {
  _id: ObjectId;
  merchantTransactionId: string;
  participantId: ObjectId;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  maxRetries: number; // 5
  nextRetryAt: Date;
  lastCheckedAt?: Date;
  createdAt: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: WhatsApp OTP Delivery
*For any* valid mobile number, when OTP is requested, the system should send a 6-digit code via WhatsApp with Quiz Champ 2026 branding.
**Validates: Requirements 1.1, 2.1, 3.1, 6.1, 6.2**

### Property 2: Session Token Creation
*For any* user who successfully verifies OTP, the system should create a valid JWT session token that can be decoded to retrieve the mobile number.
**Validates: Requirements 1.2, 2.2, 3.2**

### Property 3: Profile Data Completeness
*For any* logged-in user, the profile view should contain all required fields: name, class, batch, guardian name, address, mobile number, and payment status.
**Validates: Requirements 1.4, 9.1, 9.2, 9.3**

### Property 4: Image Compression
*For any* uploaded image, after compression and conversion, the resulting WebP file should be under 200 KB while maintaining the original aspect ratio.
**Validates: Requirements 5.3, 5.4, 5.5**

### Property 5: Payment Status Display
*For any* user profile, the displayed payment status should match the database record and show appropriate actions (complete payment, retry, or view admit card).
**Validates: Requirements 2.5, 9.4, 9.5, 9.6**

### Property 6: Thank You Message Content
*For any* successful payment, the WhatsApp thank you message should include roll number, admit card download link, event details, and contact information.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 7: Payment Verification
*For any* payment callback, the system should verify the status with the payment gateway before updating the participant record.
**Validates: Requirements 8.2, 8.3, 8.4**

### Property 8: Merchant Transaction ID Storage
*For any* payment initiation, the merchant transaction ID should be stored in the participant record before redirecting to the payment gateway.
**Validates: Requirements 8.1**

### Property 9: Duplicate Registration Prevention
*For any* mobile number with a completed registration, attempting to register again should be blocked and the existing admit card should be shown.
**Validates: Requirements 10.1, 10.2**

### Property 10: Pending Registration Continuation
*For any* mobile number with a pending registration, logging in should display the registration form with pre-filled draft data.
**Validates: Requirements 2.3, 10.3**

### Property 11: Logout Session Clearing
*For any* logged-in user, clicking logout should clear all session data including cookies and local storage.
**Validates: Requirements 4.1**

### Property 12: Mobile Number Uniqueness
*For any* registration check, the system should use mobile number as the sole unique identifier for duplicate detection.
**Validates: Requirements 10.5**

## Error Handling

### WhatsApp Delivery Failures
- Log error with mobile number and timestamp
- Display user-friendly message: "Unable to send OTP via WhatsApp. Please try again."
- Implement retry mechanism with exponential backoff
- Fallback to SMS if WhatsApp fails after 3 attempts

### Image Processing Failures
- Validate file type before processing
- Handle corrupt images gracefully
- Show error: "Unable to process image. Please try a different photo."
- Limit file size to 10 MB before processing

### Payment Verification Failures
- Schedule background job for retry
- Maximum 5 retry attempts over 24 hours
- If still ambiguous, flag for manual review
- Notify user: "Payment verification in progress. You'll receive confirmation via WhatsApp."

### Duplicate Registration Handling
- Check on OTP verification
- Show clear message with existing registration details
- Provide option to view admit card or contact support
- Log duplicate attempts for monitoring

## Testing Strategy

### Unit Tests
- WhatsApp message formatting
- Image compression quality and size
- JWT token generation and validation
- Duplicate detection logic
- Payment status mapping

### Property-Based Tests
- Property 1: Test OTP delivery with random mobile numbers
- Property 2: Test session token creation with various user states
- Property 3: Test profile completeness with random participant data
- Property 4: Test image compression with various image sizes and formats
- Property 5: Test payment status display logic with all status combinations
- Property 6: Test thank you message content with random participant data
- Property 7: Test payment verification with mock gateway responses
- Property 8: Test merchant ID storage before payment redirect
- Property 9: Test duplicate prevention with existing completed registrations
- Property 10: Test pending registration flow with draft data
- Property 11: Test logout clears all session artifacts
- Property 12: Test mobile number is used for all duplicate checks

### Integration Tests
- End-to-end login flow with WhatsApp OTP
- Photo upload, crop, compress, and store flow
- Payment initiation, callback, and verification flow
- Profile view for different payment statuses
- Duplicate registration prevention flow

### Libraries
- **Property Testing**: fast-check (JavaScript/TypeScript)
- **Image Processing**: sharp (for WebP conversion and compression)
- **WhatsApp API**: whatsapp-web.js or official WhatsApp Business API
- **Image Cropping**: react-easy-crop (frontend)
- **Background Jobs**: bull or agenda (for payment verification)

## Security Considerations

### Session Management
- JWT tokens expire after 24 hours
- Tokens include mobile number claim
- Validate token on every authenticated request
- Implement token refresh mechanism

### Photo Upload Security
- Validate file type and size before processing
- Scan for malicious content
- Store in isolated S3 bucket with restricted access
- Generate unique filenames to prevent overwrites

### Payment Verification
- Verify callback signature from payment gateway
- Use HTTPS for all payment-related communication
- Store sensitive payment data encrypted
- Implement idempotency for payment callbacks

### WhatsApp Integration
- Use official API or verified library
- Implement rate limiting for message sending
- Store API credentials securely in environment variables
- Log all message delivery attempts for audit

## Performance Considerations

### Image Processing
- Process images asynchronously
- Use worker threads for CPU-intensive compression
- Cache processed images in CDN
- Implement progressive image loading

### Database Queries
- Index on mobileNumber for fast lookups
- Index on paymentStatus for filtering
- Use lean() for read-only queries
- Implement query result caching for profiles

### WhatsApp Messaging
- Queue messages for batch processing
- Implement retry queue for failed deliveries
- Rate limit to comply with WhatsApp API limits
- Monitor delivery success rates

### Background Jobs
- Use Redis for job queue
- Implement exponential backoff for retries
- Set reasonable timeouts for payment verification
- Monitor job completion rates and failures

## Deployment Considerations

### Environment Variables
```
WHATSAPP_API_KEY=xxx
WHATSAPP_API_URL=xxx
WHATSAPP_PHONE_NUMBER=xxx
IMAGE_MAX_SIZE_KB=200
IMAGE_QUALITY=85
PAYMENT_VERIFICATION_MAX_RETRIES=5
PAYMENT_VERIFICATION_INTERVAL_MINUTES=60
```

### Dependencies
```json
{
  "sharp": "^0.32.0",
  "whatsapp-web.js": "^1.23.0",
  "bull": "^4.11.0",
  "react-easy-crop": "^5.0.0",
  "fast-check": "^3.15.0"
}
```

### Migration Steps
1. Add new fields to Participant model
2. Create PaymentVerificationJob collection
3. Deploy WhatsApp service
4. Update OTP routes to use WhatsApp
5. Deploy image processing service
6. Update frontend with new components
7. Test end-to-end flow in staging
8. Deploy to production with feature flag
9. Monitor WhatsApp delivery rates
10. Gradually enable for all users
