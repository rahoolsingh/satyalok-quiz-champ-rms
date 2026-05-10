# Requirements Document

## Introduction

Quiz Champ 2026 is a registration, attendance, and result management system for a quiz competition event. The system manages the complete lifecycle from pre-registration countdown through registration, payment processing, admit card generation, and result publication. The system supports two participant categories (junior and senior batches) and provides administrative controls for event management.

## Glossary

- **Portal**: The web-based interface through which users interact with the Quiz Champ 2026 system
- **Participant**: A student registering for the Quiz Champ 2026 competition
- **Guardian**: The parent or legal guardian of a Participant
- **Junior Batch**: Participant category for younger students
- **Senior Batch**: Participant category for older students
- **Roll Number**: A unique 5-digit identifier assigned to each registered Participant
- **Admit Card**: A document generated after successful payment containing Participant details and Roll Number
- **Admin Controller**: The administrative interface for managing Portal settings, dates, content, and results
- **OTP**: One-Time Password sent for verification during registration
- **Registration Form**: The data collection interface for Participant information

## Requirements

### Requirement 1

**User Story:** As a visitor, I want to see a countdown timer before registration opens, so that I know when I can register for the event.

#### Acceptance Criteria

1. WHEN the current date is before the opening date THEN the Portal SHALL display a countdown timer showing days, hours, minutes, and seconds until registration opens
2. WHEN the countdown reaches zero THEN the Portal SHALL automatically transition to display the slider and registration options
3. THE Portal SHALL display the event name "Quiz Champ 2026" prominently during the countdown phase
4. WHILE the countdown is active THEN the Portal SHALL prevent access to the Registration Form

### Requirement 2

**User Story:** As a visitor, I want to see a slider with event information after registration opens, so that I can learn about the quiz competition before registering.

#### Acceptance Criteria

1. WHEN registration is open THEN the Portal SHALL display a slider with multiple images
2. THE Portal SHALL allow navigation between slider images through user interaction
3. WHEN the slider is displayed THEN the Portal SHALL show two registration buttons labeled for Junior Batch and Senior Batch
4. THE Portal SHALL load slider images from the configuration set by the Admin Controller

### Requirement 3

**User Story:** As a participant, I want to select my batch category and fill out a registration form, so that I can provide my information for the quiz competition.

#### Acceptance Criteria

1. WHEN a user clicks the Junior Batch button THEN the Portal SHALL display the Registration Form with batch type set to Junior
2. WHEN a user clicks the Senior Batch button THEN the Portal SHALL display the Registration Form with batch type set to Senior
3. THE Registration Form SHALL collect the following required fields: participant name, class, guardian name, address, and mobile number
4. THE Registration Form SHALL collect the following optional fields: email address and referral source
5. WHEN a user submits the Registration Form with incomplete required fields THEN the Portal SHALL display validation errors and prevent submission
6. WHEN a user submits a complete Registration Form THEN the Portal SHALL proceed to the payment and verification process

### Requirement 4

**User Story:** As a participant, I want to verify my mobile number with an OTP and complete payment, so that I can secure my registration for the quiz.

#### Acceptance Criteria

1. WHEN a user submits a valid Registration Form THEN the Portal SHALL send an OTP to the provided mobile number
2. WHEN the OTP is sent THEN the Portal SHALL display an OTP entry interface
3. WHEN a user enters an incorrect OTP THEN the Portal SHALL display an error message and allow retry
4. WHEN a user enters the correct OTP THEN the Portal SHALL redirect to the payment interface
5. WHEN payment is successfully completed THEN the Portal SHALL generate an Admit Card with a unique 5-digit Roll Number
6. THE Portal SHALL ensure each generated Roll Number is unique across all Participants

### Requirement 5

**User Story:** As a registered participant, I want to receive an admit card with a unique roll number after payment, so that I have proof of registration and can identify myself during the quiz.

#### Acceptance Criteria

1. WHEN payment is confirmed THEN the Portal SHALL generate an Admit Card containing participant name, class, batch type, and Roll Number
2. THE Portal SHALL assign a unique 5-digit Roll Number to each Participant
3. WHEN an Admit Card is generated THEN the Portal SHALL make it available for download or display
4. THE Portal SHALL store the association between Participant information and Roll Number for result publication

### Requirement 6

**User Story:** As a participant, I want to check my quiz results using my roll number, so that I can see my performance in the competition.

#### Acceptance Criteria

1. WHEN results are published THEN the Portal SHALL provide a result checking interface
2. WHEN a user enters a valid Roll Number THEN the Portal SHALL display the corresponding result
3. WHEN a user enters an invalid Roll Number THEN the Portal SHALL display an appropriate error message
4. WHILE results are not yet published THEN the Portal SHALL inform users that results are not available

### Requirement 7

**User Story:** As an administrator, I want to control event dates and portal status, so that I can manage when registration opens and closes.

#### Acceptance Criteria

1. THE Admin Controller SHALL allow setting the registration opening date
2. THE Admin Controller SHALL allow setting the registration closing date
3. WHEN the closing date is reached THEN the Portal SHALL display a "Coming Soon" message and prevent new registrations
4. THE Admin Controller SHALL allow toggling the Portal status between active, countdown, and coming soon states
5. WHEN the Admin Controller changes Portal status THEN the Portal SHALL reflect the change immediately

### Requirement 8

**User Story:** As an administrator, I want to upload and manage slider images, so that I can control the promotional content shown to visitors.

#### Acceptance Criteria

1. THE Admin Controller SHALL allow uploading multiple slider images
2. THE Admin Controller SHALL allow removing existing slider images
3. THE Admin Controller SHALL allow reordering slider images
4. WHEN slider images are updated THEN the Portal SHALL display the updated images on the next page load
5. THE Admin Controller SHALL validate uploaded files to ensure they are valid image formats

### Requirement 9

**User Story:** As an administrator, I want to upload quiz results in bulk, so that I can publish all participant scores efficiently.

#### Acceptance Criteria

1. THE Admin Controller SHALL allow uploading result data containing Roll Numbers and scores
2. WHEN result data is uploaded THEN the Admin Controller SHALL validate that all Roll Numbers exist in the registration database
3. WHEN result data contains invalid Roll Numbers THEN the Admin Controller SHALL display validation errors and prevent publication
4. THE Admin Controller SHALL allow setting a result publication date
5. WHEN the publication date is reached THEN the Portal SHALL make results available for checking

### Requirement 10

**User Story:** As an administrator, I want to view all registrations and their payment status, so that I can track event participation and revenue.

#### Acceptance Criteria

1. THE Admin Controller SHALL display a list of all Participants with their registration details
2. THE Admin Controller SHALL show payment status for each Participant
3. THE Admin Controller SHALL allow filtering Participants by batch type
4. THE Admin Controller SHALL allow searching Participants by name, Roll Number, or mobile number
5. THE Admin Controller SHALL display total registration counts for Junior and Senior batches
