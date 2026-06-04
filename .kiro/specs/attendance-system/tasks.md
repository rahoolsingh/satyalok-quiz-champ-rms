# Implementation Plan

- [ ] 1. Set up database schema and models
  - Create Attendance model with indexes for performance
  - Create AttendanceLog model for audit trail
  - Add attendance-related fields to Participant model
  - Create database migrations if needed
  - _Requirements: 1.1, 2.1, 5.1_

- [ ] 2. Implement backend attendance API routes
  - [ ] 2.1 Create attendance routes file and router setup
    - Set up Express router for `/api/attendance`
    - Apply admin authentication middleware to all routes
    - Add request logging middleware
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 2.2 Implement QR code scanning endpoint (POST /api/attendance/scan)
    - Parse and validate QR JSON data
    - Query participant by ID from QR code
    - Verify payment status is COMPLETED
    - Check for duplicate attendance on same date
    - Create attendance record with timestamp (IST)
    - Log scan attempt in audit trail
    - Return participant details and attendance record
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 5.1, 5.2_

  - [ ] 2.3 Implement manual entry endpoint (POST /api/attendance/manual)
    - Accept roll number as input
    - Query participant by roll number
    - Verify payment status is COMPLETED
    - Check for duplicate attendance
    - Create attendance record flagged as manual entry
    - Log manual entry in audit trail
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 2.4 Implement statistics endpoint (GET /api/attendance/stats)
    - Count total registered participants (by batch)
    - Count total attendance records for today (by batch)
    - Calculate attendance percentages
    - Return stats object with batch breakdown
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ] 2.5 Implement attendance list endpoint (GET /api/attendance/list)
    - Accept filter parameters (batch, status, search, sort)
    - Build MongoDB query with filters
    - Implement pagination (default 50 per page)
    - Include participant details in response
    - Return paginated results with total count
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 2.6 Implement export endpoint (GET /api/attendance/export)
    - Accept same filters as list endpoint
    - Query attendance records with filters
    - Generate CSV with headers and data rows
    - Include summary statistics at top
    - Set proper content-type and filename headers
    - Stream CSV response to client
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 3. Create QR code validation service
  - [ ] 3.1 Implement QR data parser
    - Parse JSON from QR code string
    - Validate required fields (id, roll, batch)
    - Handle malformed JSON gracefully
    - Return structured participant data
    - _Requirements: 1.1, 1.3_

  - [ ] 3.2 Implement duplicate checker
    - Query attendance by participantId and today's date
    - Return existing attendance record if found
    - Calculate time since original check-in
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Implement participant validator
    - Query participant from database
    - Verify participant exists
    - Check payment status is COMPLETED
    - Return validation result with participant data
    - _Requirements: 1.2, 1.3_

- [ ] 4. Build attendance scanner frontend page
  - [ ] 4.1 Create AttendanceScanner component structure
    - Set up component with state management
    - Implement admin authentication check
    - Add loading and error states
    - Create responsive mobile-first layout
    - _Requirements: 9.1, 9.2_

  - [ ] 4.2 Integrate QR code scanner library
    - Install and configure `react-qr-scanner` or `html5-qrcode`
    - Request camera permissions on mount
    - Display live camera preview
    - Handle camera access denied error
    - Implement QR code detection callback
    - Add haptic feedback on scan (mobile)
    - _Requirements: 1.1, 1.5, 9.2, 9.3, 9.5_

  - [ ] 4.3 Implement scan result confirmation flow
    - Display participant details after scan
    - Show photo, name, roll number, class, batch
    - Add "Confirm Attendance" button
    - Add "Cancel" button to rescan
    - Call attendance API on confirmation
    - _Requirements: 1.1, 1.2_

  - [ ] 4.4 Implement success and error feedback
    - Show success message with timestamp
    - Display duplicate warning with previous time
    - Show error messages for invalid QR/participant
    - Auto-reset scanner after 3 seconds on success
    - Provide option to retry on error
    - _Requirements: 1.3, 2.2, 2.3, 2.4_

  - [ ] 4.5 Add manual entry fallback
    - Create manual entry form with roll number input
    - Add toggle button to switch between scan/manual modes
    - Validate roll number format
    - Call manual entry API
    - Show same confirmation flow as QR scan
    - _Requirements: 1.4, 6.1, 6.2, 6.3_

- [ ] 5. Build attendance dashboard frontend page
  - [ ] 5.1 Create AttendanceDashboard component
    - Set up component with state management
    - Implement admin authentication check
    - Create grid layout for statistics cards
    - Add navigation to scanner and list pages
    - _Requirements: 3.1, 3.2_

  - [ ] 5.2 Implement statistics display
    - Create stat cards for total, junior, senior counts
    - Display attendance percentage with progress bars
    - Show comparison: attended vs registered
    - Add visual indicators (icons, colors) for each batch
    - Format numbers with thousand separators
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ] 5.3 Add real-time statistics updates
    - Fetch stats on page load
    - Poll stats endpoint every 10 seconds
    - Update UI smoothly without flash
    - Show last updated timestamp
    - Add manual refresh button
    - _Requirements: 3.4_

  - [ ] 5.4 Create attendance overview chart
    - Add pie chart or bar chart showing batch distribution
    - Display attendance trend over time (optional)
    - Make charts responsive for mobile
    - _Requirements: 3.1, 3.2_

- [ ] 6. Build attendance list frontend page
  - [ ] 6.1 Create AttendanceList component structure
    - Set up component with state management
    - Implement admin authentication check
    - Create responsive table layout
    - Add loading skeleton for better UX
    - _Requirements: 4.1_

  - [ ] 6.2 Implement batch filter controls
    - Add filter buttons: All, Junior, Senior
    - Highlight active filter
    - Update list when filter changes
    - Preserve filter state in URL params
    - _Requirements: 4.2, 4.3_

  - [ ] 6.3 Implement status filter (Present/Absent)
    - Add toggle or tabs for Present/Absent/All
    - Fetch registered participants for absent view
    - Cross-reference with attendance records
    - Show appropriate columns for each view
    - _Requirements: 4.5, 10.1, 10.2_

  - [ ] 6.4 Implement search functionality
    - Add search input for roll number or name
    - Debounce search input (300ms)
    - Call API with search query
    - Show "no results" message when empty
    - _Requirements: 4.1, 4.4_

  - [ ] 6.5 Display attendance records in table
    - Show columns: Roll Number, Name, Class, Batch, Check-in Time
    - Format timestamps in readable format
    - Add participant photo thumbnail
    - Make table scrollable on mobile
    - Highlight recent entries (< 5 min ago)
    - _Requirements: 4.4, 5.2, 5.5_

  - [ ] 6.6 Implement sorting functionality
    - Add sort controls for time, roll number, name
    - Toggle ascending/descending order
    - Show sort indicator (arrow) in column headers
    - _Requirements: 4.1_

  - [ ] 6.7 Implement pagination
    - Show pagination controls (prev/next, page numbers)
    - Display current page and total pages
    - Set default page size to 50
    - Add option to change page size (25/50/100)
    - _Requirements: 4.1_

  - [ ] 6.8 Add export functionality
    - Add "Export CSV" button in toolbar
    - Apply current filters to export
    - Trigger download with appropriate filename
    - Show loading indicator during export
    - Display success message after download
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7. Build absentee list view
  - [ ] 7.1 Create AbsenteeList component
    - Fetch all registered participants
    - Filter out participants with attendance today
    - Group by batch type
    - Display count at top for each batch
    - _Requirements: 10.1, 10.2, 10.5_

  - [ ] 7.2 Display absentee information
    - Show roll number, name, class, batch, mobile
    - Add "Mark Present" quick action button
    - Include photo thumbnail
    - Highlight urgent cases (optional)
    - _Requirements: 10.3_

  - [ ] 7.3 Implement absentee export
    - Add export button for absentees
    - Generate CSV with absentee details
    - Include batch filter in export
    - _Requirements: 10.4_

- [ ] 8. Add admin navigation and access control
  - [ ] 8.1 Add attendance menu items to admin dashboard
    - Add "Attendance" section in admin sidebar
    - Link to Scanner, Dashboard, List pages
    - Show active page indicator
    - _Requirements: 8.1_

  - [ ] 8.2 Implement route guards
    - Protect all attendance routes with admin auth
    - Redirect to login if not authenticated
    - Show unauthorized message for non-admin users
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 8.3 Add attendance permissions
    - Check admin session on page load
    - Verify session validity before API calls
    - Handle session expiry gracefully
    - _Requirements: 8.3, 8.4_

- [ ] 9. Optimize for mobile devices
  - [ ] 9.1 Test camera functionality on mobile browsers
    - Test on iOS Safari (iPhone)
    - Test on Android Chrome
    - Test on iPad Safari
    - Verify rear camera is default
    - Test QR detection speed and accuracy
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ] 9.2 Implement responsive layouts
    - Make scanner full-screen on mobile
    - Optimize dashboard cards for small screens
    - Make table horizontal scrollable on mobile
    - Use mobile-friendly buttons (min 44px tap targets)
    - Test portrait and landscape orientations
    - _Requirements: 9.1, 9.4_

  - [ ] 9.3 Add haptic feedback and sounds
    - Vibrate on successful scan (mobile)
    - Play sound on scan success
    - Different feedback for error/duplicate
    - Make feedback optional (user preference)
    - _Requirements: 9.3_

- [ ] 10. Implement audit logging
  - [ ] 10.1 Create attendance log entries
    - Log every scan attempt (success/failure)
    - Log duplicate scan attempts
    - Log manual entries
    - Include timestamp, admin user, device info
    - _Requirements: 2.5, 8.4, 8.5_

  - [ ] 10.2 Create audit log viewer (admin)
    - Add page to view attendance logs
    - Filter by action type
    - Search by participant or admin
    - Export audit logs to CSV
    - _Requirements: 8.5_

- [ ] 11. Add error handling and validation
  - [ ] 11.1 Implement comprehensive error messages
    - User-friendly messages for each error type
    - Technical details in console for debugging
    - Actionable suggestions for resolution
    - _Requirements: 1.3, 2.2, 2.3, 2.4_

  - [ ] 11.2 Add input validation
    - Validate QR JSON structure
    - Validate roll number format
    - Sanitize all user inputs
    - Prevent injection attacks
    - _Requirements: 6.2, 6.3_

  - [ ] 11.3 Implement rate limiting
    - Limit scan endpoint to 60 requests/min per admin
    - Add rate limit headers to responses
    - Show friendly message when limit exceeded
    - _Requirements: 8.4_

- [ ]* 12. Testing and quality assurance
  - [ ]* 12.1 Write unit tests for backend services
    - Test QR parsing and validation
    - Test duplicate detection logic
    - Test statistics calculation
    - Test date/time handling (IST timezone)
    - _Requirements: All_

  - [ ]* 12.2 Write integration tests for API endpoints
    - Test scan endpoint with valid/invalid QR
    - Test manual entry endpoint
    - Test statistics endpoint accuracy
    - Test list endpoint with filters
    - Test export endpoint
    - _Requirements: All_

  - [ ]* 12.3 Perform end-to-end testing
    - Test complete scan-to-dashboard flow
    - Test manual entry flow
    - Test filter and export flow
    - Test on multiple devices and browsers
    - _Requirements: All_

  - [ ]* 12.4 Conduct user acceptance testing
    - Have admin users test on actual devices
    - Collect feedback on UX and performance
    - Test in real-world conditions (lighting, movement)
    - Verify QR scanning speed and accuracy
    - _Requirements: All_

- [ ]* 13. Documentation and deployment
  - [ ]* 13.1 Write admin user documentation
    - Create user guide for attendance scanning
    - Document manual entry process
    - Explain dashboard and reports
    - Add troubleshooting section
    - _Requirements: All_

  - [ ]* 13.2 Update API documentation
    - Document all attendance endpoints
    - Add request/response examples
    - Document error codes
    - Add authentication requirements
    - _Requirements: All_

  - [ ] 13.3 Deploy to production
    - Run database migrations
    - Deploy backend changes
    - Deploy frontend changes
    - Test in production environment
    - Monitor for errors in first 24 hours
    - _Requirements: All_
