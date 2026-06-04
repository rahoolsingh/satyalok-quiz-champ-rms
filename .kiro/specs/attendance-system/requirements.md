# Requirements Document

## Introduction

This document outlines the requirements for an Attendance Management System for Quiz Champ 2026. The system will enable event organizers to mark participant attendance on exam day by scanning QR codes from admit cards. Each participant can only be marked present once per day, and administrators can view real-time attendance statistics filtered by batch type.

## Glossary

- **Attendance System**: The digital system used to record participant presence at the quiz event
- **QR Code Scanner**: Mobile/tablet interface used to scan admit card QR codes
- **Attendance Record**: A timestamped log entry recording when a participant was marked present
- **Batch Type**: Category of participant (JUNIOR for classes 5-10, SENIOR for 10+)
- **Admit Card**: Physical/digital document containing a unique QR code for each participant
- **Roll Number**: Unique identifier assigned to each registered participant
- **Event Date**: The scheduled date of the quiz examination
- **Attendance Dashboard**: Admin interface showing real-time attendance statistics and lists

## Requirements

### Requirement 1

**User Story:** As an event coordinator, I want to scan participant admit card QR codes, so that I can quickly mark their attendance on exam day.

#### Acceptance Criteria

1. WHEN an admin scans a valid admit card QR code THEN the system SHALL decode the participant information and display it for confirmation
2. WHEN a participant's QR code is scanned for the first time on event day THEN the system SHALL record their attendance with current date and time
3. WHEN a QR code is scanned that does not match any registered participant THEN the system SHALL display an error message indicating invalid admit card
4. WHEN a QR code scan fails due to technical issues THEN the system SHALL provide an option to manually enter the roll number
5. WHEN the scanner interface loads THEN the system SHALL request camera permissions and display a live camera feed for QR scanning

### Requirement 2

**User Story:** As an event coordinator, I want to prevent duplicate attendance entries, so that each participant is only counted once per day.

#### Acceptance Criteria

1. WHEN a QR code is scanned for a participant already marked present on the same date THEN the system SHALL display a warning message showing the previous attendance time
2. WHEN attempting to mark duplicate attendance THEN the system SHALL prevent creating a new attendance record
3. WHEN displaying duplicate attendance warning THEN the system SHALL show participant name, roll number, and original check-in time
4. WHEN an admin acknowledges the duplicate warning THEN the system SHALL return to the scanner interface without recording new attendance
5. WHEN the system detects duplicate scan attempt THEN the system SHALL log the attempt with timestamp for audit purposes

### Requirement 3

**User Story:** As an event administrator, I want to view real-time attendance statistics, so that I can monitor participation rates during the event.

#### Acceptance Criteria

1. WHEN an admin accesses the attendance dashboard THEN the system SHALL display total attendance count at the top of the page
2. WHEN viewing attendance statistics THEN the system SHALL show separate counts for JUNIOR batch and SENIOR batch participants
3. WHEN the attendance dashboard loads THEN the system SHALL display percentage of registered participants who have marked attendance
4. WHEN attendance is marked THEN the system SHALL update the dashboard counts in real-time without requiring page refresh
5. WHEN displaying statistics THEN the system SHALL show comparison between total registrations and current attendance for each batch

### Requirement 4

**User Story:** As an event administrator, I want to filter and view the attendance list, so that I can see who has attended and who is absent.

#### Acceptance Criteria

1. WHEN an admin accesses the attendance list THEN the system SHALL display all attendance records sorted by check-in time (most recent first)
2. WHEN filtering by JUNIOR batch THEN the system SHALL show only attendance records for participants in the JUNIOR batch
3. WHEN filtering by SENIOR batch THEN the system SHALL show only attendance records for participants in the SENIOR batch
4. WHEN viewing attendance list THEN the system SHALL display participant roll number, name, batch type, and check-in timestamp for each entry
5. WHEN viewing attendance list THEN the system SHALL provide an option to view all registered participants with their attendance status (present/absent)

### Requirement 5

**User Story:** As an event administrator, I want attendance records timestamped accurately, so that I can verify participant arrival times if needed.

#### Acceptance Criteria

1. WHEN attendance is recorded THEN the system SHALL capture and store the exact date and time in IST (Indian Standard Time)
2. WHEN displaying attendance records THEN the system SHALL show timestamps in format "DD MMM YYYY, HH:MM AM/PM"
3. WHEN storing attendance records THEN the system SHALL use server time to prevent client-side time manipulation
4. WHEN exporting attendance data THEN the system SHALL include accurate timestamps for all entries
5. WHEN viewing attendance details THEN the system SHALL display the time elapsed since check-in (e.g., "2 hours ago")

### Requirement 6

**User Story:** As an event coordinator, I want to manually mark attendance by roll number, so that I can handle situations where QR scanning fails.

#### Acceptance Criteria

1. WHEN QR scanner is unavailable THEN the system SHALL provide a manual entry option with roll number input field
2. WHEN a valid roll number is manually entered THEN the system SHALL retrieve participant details and mark attendance
3. WHEN an invalid roll number is entered THEN the system SHALL display an error message indicating participant not found
4. WHEN marking attendance manually THEN the system SHALL apply the same duplicate prevention rules as QR scanning
5. WHEN manual attendance is recorded THEN the system SHALL flag the entry to indicate it was not scanned via QR code

### Requirement 7

**User Story:** As an event administrator, I want to export attendance data, so that I can maintain records and generate reports.

#### Acceptance Criteria

1. WHEN an admin requests attendance export THEN the system SHALL generate a CSV file with all attendance records
2. WHEN exporting attendance data THEN the system SHALL include roll number, name, class, batch type, mobile number, and check-in timestamp
3. WHEN filtering attendance list THEN the export SHALL respect current filters (batch type, date range)
4. WHEN export is generated THEN the system SHALL include summary statistics at the top (total attendance, batch-wise counts)
5. WHEN export file is downloaded THEN the system SHALL name the file with format "attendance-YYYY-MM-DD.csv"

### Requirement 8

**User Story:** As a system administrator, I want attendance data secured with authentication, so that only authorized personnel can access and modify attendance records.

#### Acceptance Criteria

1. WHEN accessing attendance scanner interface THEN the system SHALL require admin authentication
2. WHEN accessing attendance dashboard THEN the system SHALL verify admin session is valid
3. WHEN admin session expires THEN the system SHALL redirect to login page and prevent attendance operations
4. WHEN marking attendance THEN the system SHALL log which admin user performed the action
5. WHEN viewing audit logs THEN the system SHALL display all attendance-related actions with admin user details

### Requirement 9

**User Story:** As an event coordinator, I want the QR scanner to work on mobile devices, so that I can use smartphones or tablets for attendance at entry points.

#### Acceptance Criteria

1. WHEN accessing scanner on mobile device THEN the system SHALL display a mobile-optimized interface
2. WHEN camera is activated on mobile THEN the system SHALL use device's rear camera by default
3. WHEN scanning QR code on mobile THEN the system SHALL provide haptic feedback or sound upon successful scan
4. WHEN mobile device orientation changes THEN the system SHALL adjust the camera preview accordingly
5. WHEN using mobile browser THEN the system SHALL support both iOS Safari and Android Chrome browsers

### Requirement 10

**User Story:** As an event administrator, I want to view absent participants list, so that I can follow up with registered students who did not attend.

#### Acceptance Criteria

1. WHEN viewing absentees list THEN the system SHALL show all registered participants who have not marked attendance
2. WHEN filtering absentees by batch THEN the system SHALL display only absent participants from selected batch type
3. WHEN displaying absentee information THEN the system SHALL show roll number, name, batch type, mobile number, and class
4. WHEN exporting absentees list THEN the system SHALL generate a CSV file with all absent participant details
5. WHEN viewing absentees THEN the system SHALL display count of absent participants at the top for each batch
