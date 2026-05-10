# Implementation Plan

- [x] 1. Set up project structure and dependencies
  - Initialize Node.js/Express backend with TypeScript
  - Initialize React frontend with TypeScript and Vite
  - Install core dependencies: Express, PostgreSQL client, JWT, bcrypt, Jest, fast-check
  - Set up project folder structure (backend: routes, controllers, models, services; frontend: components, pages, hooks, utils)
  - Configure TypeScript, ESLint, and Prettier
  - _Requirements: All_

- [x] 2. Set up database schema and migrations
  - Create PostgreSQL database and connection configuration
  - Write migration for Participant table with all fields and constraints
  - Write migration for OTPVerification table
  - Write migration for PortalConfiguration table
  - Write migration for SliderImage table
  - Write migration for Result table
  - Write migration for AdminUser table
  - Add indexes on mobileNumber, rollNumber, and foreign keys
  - Seed initial admin user and portal configuration
  - _Requirements: 1.1, 3.3, 3.4, 4.1, 5.2, 6.2, 7.1, 8.1, 9.1, 10.1_

- [x] 3. Implement roll number generation service
  - Create function to generate unique 5-digit roll numbers
  - Implement database check for uniqueness
  - Add retry logic for collision handling
  - _Requirements: 4.6, 5.2_

- [ ]* 3.1 Write property test for roll number uniqueness
  - **Property 15: Roll number uniqueness**
  - **Validates: Requirements 4.6, 5.2**

- [ ]* 3.2 Write property test for roll number format
  - **Property 16: Roll number format**
  - **Validates: Requirements 5.2**

- [x] 4. Implement portal state management service
  - Create function to determine portal state based on current date and configuration
  - Implement logic for AUTO mode (date-based) and manual override modes
  - Add caching mechanism for portal configuration
  - _Requirements: 1.1, 1.4, 7.3, 7.4, 7.5_

- [ ]* 4.1 Write property test for countdown display before opening
  - **Property 1: Countdown display before opening**
  - **Validates: Requirements 1.1**

- [ ]* 4.2 Write property test for countdown prevents registration access
  - **Property 2: Countdown prevents registration access**
  - **Validates: Requirements 1.4**

- [ ]* 4.3 Write property test for portal closure after closing date
  - **Property 7: Portal closure after closing date**
  - **Validates: Requirements 7.3**

- [x] 5. Implement OTP service
  - Integrate SMS gateway (Twilio or MSG91) for OTP delivery
  - Create function to generate 6-digit OTP
  - Implement OTP storage with expiry (5 minutes)
  - Create OTP verification function with attempt limiting (max 3 attempts)
  - Add OTP resend functionality with rate limiting
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 5.1 Write property test for OTP sent for valid registration
  - **Property 11: OTP sent for valid registration**
  - **Validates: Requirements 4.1**

- [ ]* 5.2 Write property test for incorrect OTP handling
  - **Property 13: Incorrect OTP handling**
  - **Validates: Requirements 4.3**

- [x] 6. Implement registration validation and submission
  - Create validation schemas for registration form fields
  - Implement server-side validation for required fields
  - Create API endpoint POST /api/registration
  - Implement registration data storage (pending payment status)
  - Trigger OTP sending on successful validation
  - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [ ]* 6.1 Write property test for incomplete form rejection
  - **Property 9: Incomplete form rejection**
  - **Validates: Requirements 3.5**

- [ ]* 6.2 Write property test for complete form acceptance
  - **Property 10: Complete form acceptance**
  - **Validates: Requirements 3.6**

- [x] 7. Implement payment integration
  - Integrate payment gateway (Razorpay or Stripe)
  - Create API endpoint POST /api/registration/verify-otp to verify OTP and create payment session
  - Create API endpoint POST /api/registration/confirm-payment for payment webhook
  - Implement idempotency for payment confirmation
  - Update participant payment status on successful payment
  - _Requirements: 4.4, 4.5_

- [ ]* 7.1 Write property test for correct OTP progression
  - **Property 14: Correct OTP progression**
  - **Validates: Requirements 4.4**

- [x] 8. Implement admit card generation
  - Create admit card template (HTML/PDF)
  - Implement admit card generation function with participant details and roll number
  - Upload generated admit card to cloud storage (AWS S3 or Cloudinary)
  - Store admit card URL in participant record
  - Create API endpoint GET /api/registration/admit-card/:id
  - _Requirements: 4.5, 5.1, 5.3, 5.4_

- [ ]* 8.1 Write property test for admit card generation after payment
  - **Property 17: Admit card generation after payment**
  - **Validates: Requirements 4.5, 5.1**

- [ ]* 8.2 Write property test for admit card accessibility
  - **Property 18: Admit card accessibility**
  - **Validates: Requirements 5.3**

- [ ]* 8.3 Write property test for participant-roll number association
  - **Property 19: Participant-roll number association**
  - **Validates: Requirements 5.4**

- [x] 9. Implement result management backend
  - Create API endpoint POST /api/admin/results/upload for CSV/Excel upload
  - Implement result data parsing and validation
  - Validate all roll numbers exist in participant database
  - Store result data with publication date
  - Create API endpoint GET /api/results/:rollNumber
  - Implement logic to check publication date before returning results
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 9.1 Write property test for valid roll number result retrieval
  - **Property 20: Valid roll number result retrieval**
  - **Validates: Requirements 6.2**

- [ ]* 9.2 Write property test for invalid roll number error handling
  - **Property 21: Invalid roll number error handling**
  - **Validates: Requirements 6.3**

- [ ]* 9.3 Write property test for result roll number validation
  - **Property 23: Result roll number validation**
  - **Validates: Requirements 9.2**

- [ ]* 9.4 Write property test for invalid result data rejection
  - **Property 24: Invalid result data rejection**
  - **Validates: Requirements 9.3**

- [ ]* 9.5 Write property test for result publication timing
  - **Property 22: Result publication timing**
  - **Validates: Requirements 9.5**

- [x] 10. Implement admin authentication
  - Create API endpoint POST /api/admin/login
  - Implement JWT token generation and validation
  - Create authentication middleware for protected routes
  - Implement password hashing with bcrypt
  - _Requirements: 7.1, 7.2, 7.4, 8.1, 8.2, 8.3, 9.1, 9.4, 10.1_

- [x] 11. Implement admin portal configuration endpoints
  - Create API endpoint PUT /api/admin/portal/dates for setting opening/closing dates
  - Create API endpoint PUT /api/admin/portal/status for manual status override
  - Create API endpoint GET /api/portal/status for public portal state
  - Implement cache invalidation on configuration changes
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [ ]* 11.1 Write property test for admin status changes reflect immediately
  - **Property 8: Admin status changes reflect immediately**
  - **Validates: Requirements 7.5**

- [x] 12. Implement slider image management
  - Create API endpoint POST /api/admin/slider/upload with file validation
  - Implement image upload to cloud storage
  - Create API endpoint DELETE /api/admin/slider/:id
  - Create API endpoint PUT /api/admin/slider/reorder
  - Create API endpoint GET /api/portal/slider-images
  - Validate image formats (JPEG, PNG, WebP)
  - _Requirements: 2.1, 2.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 12.1 Write property test for slider images match configuration
  - **Property 6: Slider images match configuration**
  - **Validates: Requirements 2.4**

- [ ]* 12.2 Write property test for slider image removal
  - **Property 25: Slider image removal**
  - **Validates: Requirements 8.2**

- [ ]* 12.3 Write property test for slider image reordering
  - **Property 26: Slider image reordering**
  - **Validates: Requirements 8.3**

- [ ]* 12.4 Write property test for slider updates synchronization
  - **Property 27: Slider updates synchronization**
  - **Validates: Requirements 8.4**

- [ ]* 12.5 Write property test for image format validation
  - **Property 28: Image format validation**
  - **Validates: Requirements 8.5**

- [x] 13. Implement admin registration management endpoints
  - Create API endpoint GET /api/admin/registrations with pagination
  - Implement filtering by batch type
  - Implement search by name, roll number, and mobile number
  - Calculate and return registration counts by batch
  - Include payment status in response
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 13.1 Write property test for participant list completeness
  - **Property 29: Participant list completeness**
  - **Validates: Requirements 10.1**

- [ ]* 13.2 Write property test for payment status display
  - **Property 30: Payment status display**
  - **Validates: Requirements 10.2**

- [ ]* 13.3 Write property test for batch filter accuracy
  - **Property 31: Batch filter accuracy**
  - **Validates: Requirements 10.3**

- [ ]* 13.4 Write property test for participant search accuracy
  - **Property 32: Participant search accuracy**
  - **Validates: Requirements 10.4**

- [ ]* 13.5 Write property test for registration count accuracy
  - **Property 33: Registration count accuracy**
  - **Validates: Requirements 10.5**

- [x] 14. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement frontend countdown timer component
  - Create CountdownTimer React component
  - Implement time calculation logic (days, hours, minutes, seconds)
  - Add auto-refresh to update countdown every second
  - Display event name "Quiz Champ 2026"
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 15.1 Write property test for event name visibility during countdown
  - **Property 3: Event name visibility during countdown**
  - **Validates: Requirements 1.3**

- [x] 16. Implement frontend image slider component
  - Create ImageSlider React component with navigation controls
  - Implement auto-play functionality
  - Add responsive design for mobile and desktop
  - Fetch slider images from API
  - _Requirements: 2.1, 2.2_

- [ ]* 16.1 Write property test for slider display when open
  - **Property 4: Slider display when open**
  - **Validates: Requirements 2.1**

- [x] 17. Implement frontend batch selection and registration form
  - Create BatchSelector component with Junior and Senior buttons
  - Create RegistrationForm component with all required and optional fields
  - Implement client-side validation
  - Handle form submission and API integration
  - Display validation errors inline
  - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ]* 17.1 Write property test for batch buttons presence
  - **Property 5: Batch buttons presence**
  - **Validates: Requirements 2.3**

- [x] 18. Implement frontend OTP verification flow
  - Create OTPVerification component with 6-digit input
  - Implement OTP submission and error handling
  - Add resend OTP functionality with countdown timer
  - Handle successful verification and redirect to payment
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 18.1 Write property test for OTP interface display
  - **Property 12: OTP interface display**
  - **Validates: Requirements 4.2**

- [x] 19. Implement frontend payment integration
  - Integrate payment gateway SDK (Razorpay or Stripe)
  - Create payment initiation flow
  - Handle payment success and failure callbacks
  - Display loading states during payment processing
  - _Requirements: 4.4, 4.5_

- [x] 20. Implement frontend admit card display
  - Create AdmitCard component to display participant details and roll number
  - Implement download functionality (PDF)
  - Add print-friendly styling
  - Fetch admit card data from API
  - _Requirements: 5.1, 5.3_

- [x] 21. Implement frontend result checker
  - Create ResultChecker component with roll number input
  - Implement result fetching from API
  - Display result data (score, rank, remarks)
  - Handle invalid roll number errors
  - Show "results not available" message when not published
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 22. Implement frontend portal state management
  - Create custom hook usePortalState to fetch and manage portal state
  - Implement conditional rendering based on portal state (countdown, open, closed)
  - Add auto-refresh for portal state
  - Handle state transitions smoothly
  - _Requirements: 1.1, 1.2, 1.4, 7.3, 7.5_

- [x] 23. Implement admin dashboard layout and navigation
  - Create admin login page with authentication
  - Create admin dashboard layout with navigation menu
  - Implement protected routes for admin pages
  - Add logout functionality
  - _Requirements: 7.1, 7.2, 7.4, 8.1, 9.1, 10.1_

- [x] 24. Implement admin date configuration interface
  - Create DateConfiguration component with date pickers
  - Implement API integration for updating dates
  - Add manual portal status toggle
  - Display current configuration
  - Show success/error messages
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 25. Implement admin slider management interface
  - Create SliderManager component with image upload
  - Implement drag-and-drop reordering
  - Add image deletion functionality
  - Display current slider images with preview
  - Show upload progress and validation errors
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 26. Implement admin result upload interface
  - Create ResultUploader component with file upload
  - Support CSV and Excel file formats
  - Display validation results and errors
  - Add publication date picker
  - Show upload progress and success confirmation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 27. Implement admin registration list interface
  - Create RegistrationList component with table display
  - Implement batch type filter dropdown
  - Add search input for name, roll number, mobile number
  - Display payment status with visual indicators
  - Show registration counts for each batch
  - Add pagination for large datasets
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 28. Implement error handling and loading states
  - Add error boundary components for React
  - Implement global error toast notifications
  - Add loading spinners for async operations
  - Handle network errors gracefully
  - Implement retry mechanisms for failed requests
  - _Requirements: All_

- [x] 29. Implement responsive design and accessibility
  - Ensure all components are mobile-responsive
  - Add proper ARIA labels and roles
  - Implement keyboard navigation
  - Test with screen readers
  - Optimize for different screen sizes
  - _Requirements: All_

- [x] 30. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
