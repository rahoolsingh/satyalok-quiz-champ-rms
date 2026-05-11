# Implementation Plan

- [x] 1. Set up WhatsApp integration and messaging service
  - Install whatsapp-web.js or configure WhatsApp Business API
  - Create WhatsApp service module with sendOTP and sendThankYouMessage methods
  - Add environment variables for WhatsApp API credentials
  - Implement message templates for OTP and thank you messages
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4_

- [ ]* 1.1 Write property test for WhatsApp OTP delivery
  - **Property 1: WhatsApp OTP Delivery**
  - **Validates: Requirements 1.1, 2.1, 3.1, 6.1, 6.2**

- [ ]* 1.2 Write property test for thank you message content
  - **Property 6: Thank You Message Content**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 2. Update OTP routes to use WhatsApp delivery
  - Modify /api/otp/send to call WhatsApp service instead of SMS
  - Update OTP verification to return complete profile data
  - Add "You will receive OTP on WhatsApp" message to frontend
  - Handle WhatsApp delivery failures with user-friendly errors
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 6.2, 6.3, 6.4_

- [ ]* 2.1 Write property test for session token creation
  - **Property 2: Session Token Creation**
  - **Validates: Requirements 1.2, 2.2, 3.2**

- [ ] 3. Implement image processing service with WebP compression
  - Install sharp library for image processing
  - Create image processing service with compression and conversion
  - Implement quality optimization to keep files under 200 KB
  - Add validation for image formats and file sizes
  - _Requirements: 5.3, 5.4, 5.5_

- [ ]* 3.1 Write property test for image compression
  - **Property 4: Image Compression**
  - **Validates: Requirements 5.3, 5.4, 5.5**

- [ ] 4. Create photo cropper component in frontend
  - Install react-easy-crop library
  - Create PhotoCropper component with crop interface
  - Implement real-time preview of cropped area
  - Add confirm and cancel actions
  - Integrate with registration form photo upload
  - _Requirements: 5.1, 5.2_

- [ ] 5. Update photo upload endpoint to use image processing
  - Create POST /api/registration/photo endpoint
  - Accept cropped image from frontend
  - Process with image service (compress and convert to WebP)
  - Upload to S3 with unique filename
  - Return photo URL and size
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 6. Update Participant model with new fields
  - Add photoSizeKB field to track compressed size
  - Add photoFormat field to store format (webp)
  - Add paymentVerifiedAt timestamp
  - Add paymentVerificationAttempts counter
  - Add whatsappNotificationSent boolean flag
  - Create unique index on mobileNumber
  - _Requirements: 10.1, 10.5_

- [ ]* 6.1 Write property test for mobile number uniqueness
  - **Property 12: Mobile Number Uniqueness**
  - **Validates: Requirements 10.5**

- [ ] 7. Implement duplicate registration check service
  - Create ProfileService with checkDuplicateRegistration method
  - Query by mobile number to find existing registrations
  - Return status (COMPLETED, PENDING, FAILED) if exists
  - Integrate check into OTP verification flow
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 7.1 Write property test for duplicate prevention
  - **Property 9: Duplicate Registration Prevention**
  - **Validates: Requirements 10.1, 10.2**

- [ ] 8. Create user profile API endpoint
  - Create GET /api/profile endpoint with authentication
  - Fetch complete participant data by mobile number
  - Include payment status and admit card if completed
  - Return pending payment details if applicable
  - Handle failed payment status with retry information
  - _Requirements: 1.3, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ]* 8.1 Write property test for profile data completeness
  - **Property 3: Profile Data Completeness**
  - **Validates: Requirements 1.4, 9.1, 9.2, 9.3**

- [ ]* 8.2 Write property test for payment status display
  - **Property 5: Payment Status Display**
  - **Validates: Requirements 2.5, 9.4, 9.5, 9.6**

- [x] 9. Create UserProfile component in frontend
  - Create UserProfile component with mobile-first design
  - Display personal details section (name, class, batch, guardian, address)
  - Create PaymentStatusCard sub-component for status display
  - Show admit card prominently when payment is completed
  - Show payment amount and complete button when pending
  - Show retry option with clear messaging when failed
  - Add logout button in header
  - _Requirements: 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 10. Update PublicPortal to route based on payment status
  - Modify OTP verification success handler to check payment status
  - Route to UserProfile component if payment is completed
  - Route to RegistrationForm if payment is pending or new user
  - Show pending payment warning to prevent duplicate payments
  - Handle duplicate registration by showing existing profile
  - _Requirements: 1.3, 2.3, 2.5, 3.3, 10.2, 10.3_

- [ ]* 10.1 Write property test for pending registration continuation
  - **Property 10: Pending Registration Continuation**
  - **Validates: Requirements 2.3, 10.3**

- [x] 11. Implement payment verification service
  - Create PaymentVerificationService with verifyPaymentStatus method
  - Call payment gateway API to check transaction status
  - Map gateway response to internal status (SUCCESS, FAILED, PENDING)
  - Update participant record based on verified status
  - Generate admit card and send WhatsApp message on success
  - _Requirements: 8.2, 8.3, 8.4_

- [ ]* 11.1 Write property test for payment verification
  - **Property 7: Payment Verification**
  - **Validates: Requirements 8.2, 8.3, 8.4**

- [ ] 12. Create payment verification background job system
  - Install bull library for job queue management
  - Create PaymentVerificationJob model
  - Implement job scheduler for ambiguous payment statuses
  - Set up retry logic with exponential backoff (max 5 retries over 24 hours)
  - Create job processor to call verification service
  - Add monitoring for job completion and failures
  - _Requirements: 8.5_

- [x] 13. Update payment callback handler to verify status
  - Modify payment callback endpoint to call verification service
  - Store merchant transaction ID before verification
  - Update payment status only after successful verification
  - Schedule background job if status is ambiguous
  - Send WhatsApp thank you message on successful verification
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 7.1, 7.2, 7.3, 7.4_

- [ ]* 13.1 Write property test for merchant transaction ID storage
  - **Property 8: Merchant Transaction ID Storage**
  - **Validates: Requirements 8.1**

- [ ] 14. Implement WhatsApp thank you message after payment
  - Create thank you message template with roll number
  - Include admit card download link
  - Add event details (date, time, venue)
  - Include contact information for support
  - Send message after payment verification succeeds
  - Set whatsappNotificationSent flag in database
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 15. Update logout functionality to clear all session data
  - Clear JWT token from cookies
  - Clear session data from local storage
  - Reset all state in PublicPortal component
  - Redirect to home screen
  - Allow login with any mobile number after logout
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 15.1 Write property test for logout session clearing
  - **Property 11: Logout Session Clearing**
  - **Validates: Requirements 4.1**

- [ ] 16. Add pending payment display to prevent duplicates
  - Show pending payment card in UserProfile
  - Display payment amount and merchant transaction ID
  - Add "Complete Payment" button that resumes payment flow
  - Show warning message about not making duplicate payments
  - Disable new registration if pending payment exists
  - _Requirements: 2.5_

- [ ] 17. Update MobileEntry component with WhatsApp messaging
  - Add informational text: "You will receive OTP on WhatsApp"
  - Update UI to show WhatsApp icon
  - Handle WhatsApp delivery errors gracefully
  - Show retry option if OTP delivery fails
  - _Requirements: 6.3, 6.4_

- [ ] 18. Create manual payment verification endpoint
  - Create POST /api/payment/verify/:merchantTransactionId endpoint
  - Require authentication
  - Call payment verification service
  - Return updated payment status
  - Allow users to manually trigger verification if needed
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 19. Add error handling for WhatsApp delivery failures
  - Implement retry mechanism with exponential backoff
  - Log all delivery failures with mobile number and timestamp
  - Show user-friendly error messages
  - Implement SMS fallback after 3 failed WhatsApp attempts
  - Monitor delivery success rates
  - _Requirements: 6.4_

- [ ] 20. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Update frontend routing and navigation
  - Update PublicPortal step management for new profile view
  - Add navigation between profile and home
  - Handle browser back button correctly
  - Persist session across page refreshes
  - Test all navigation flows
  - _Requirements: 1.3, 2.3, 3.3, 4.2, 4.3_

- [ ] 22. Add environment variables and configuration
  - Add WHATSAPP_API_KEY, WHATSAPP_API_URL, WHATSAPP_PHONE_NUMBER
  - Add IMAGE_MAX_SIZE_KB=200, IMAGE_QUALITY=85
  - Add PAYMENT_VERIFICATION_MAX_RETRIES=5
  - Add PAYMENT_VERIFICATION_INTERVAL_MINUTES=60
  - Update .env.example with new variables
  - Document configuration in README
  - _Requirements: All_

- [ ] 23. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
