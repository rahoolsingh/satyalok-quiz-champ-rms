# Design Document

## Overview

The Attendance Management System enables event coordinators to efficiently track participant attendance on exam day by scanning QR codes from admit cards. The system prevents duplicate entries, provides real-time statistics, and offers comprehensive filtering and export capabilities. The design leverages existing infrastructure (admin authentication, participant database) and introduces new components for QR scanning, attendance recording, and real-time dashboard updates.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │ AttendanceScanner│  │ AttendanceDashboard│ │ ListView  │ │
│  │   (QR Camera)    │  │  (Stats & Charts) │ │ (Filters) │ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │ Attendance Routes│  │ QR Code Validator│  │ WebSocket │ │
│  │  (CRUD + Stats)  │  │ (Decode & Verify)│  │  Server   │ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Auth Middleware │  │  Export Service  │                │
│  │  (Admin Check)   │  │  (CSV Generator) │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (MongoDB)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Attendance       │  │ Participant      │                │
│  │ Collection       │  │ Collection       │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Scan Flow**: Scanner → QR Decode → Validate → Check Duplicate → Record → Update Dashboard
2. **Dashboard Flow**: Load Stats → Filter Data → Real-time Updates via WebSocket
3. **Export Flow**: Apply Filters → Fetch Records → Generate CSV → Download

## Components and Interfaces

### Frontend Components

#### 1. AttendanceScanner Component
**Location**: `frontend/src/pages/admin/AttendanceScanner.tsx`

**Responsibilities**:
- Access device camera
- Scan and decode QR codes
- Display participant information for confirmation
- Handle scan success/failure states
- Provide manual roll number entry fallback

**Key Methods**:
```typescript
interface AttendanceScannerProps {}

interface ScanResult {
  participantId: string;
  rollNumber: string;
  name: string;
  batchType: 'JUNIOR' | 'SENIOR';
  class: string;
  photoUrl?: string;
}

// Methods
- handleQRScan(qrData: string): Promise<void>
- handleManualEntry(rollNumber: string): Promise<void>
- confirmAttendance(participantId: string): Promise<void>
- resetScanner(): void
```

**UI States**:
- Idle (camera ready)
- Scanning (processing QR)
- Confirmation (show participant details)
- Success (attendance marked)
- Error (invalid/duplicate)

#### 2. AttendanceDashboard Component
**Location**: `frontend/src/pages/admin/AttendanceDashboard.tsx`

**Responsibilities**:
- Display real-time attendance statistics
- Show batch-wise counts (Junior/Senior)
- Calculate attendance percentage
- Provide navigation to detailed list view
- Auto-refresh statistics

**Key Data**:
```typescript
interface AttendanceStats {
  totalRegistrations: number;
  totalAttendance: number;
  attendancePercentage: number;
  juniorRegistrations: number;
  juniorAttendance: number;
  juniorPercentage: number;
  seniorRegistrations: number;
  seniorAttendance: number;
  seniorPercentage: number;
  lastUpdated: Date;
}
```

#### 3. AttendanceList Component
**Location**: `frontend/src/pages/admin/AttendanceList.tsx`

**Responsibilities**:
- Display paginated list of attendance records
- Filter by batch type (All/Junior/Senior)
- Filter by status (All/Present/Absent)
- Sort by time, roll number, name
- Export filtered data to CSV
- Search by roll number or name

**Filters**:
```typescript
interface AttendanceFilters {
  batchType: 'ALL' | 'JUNIOR' | 'SENIOR';
  status: 'ALL' | 'PRESENT' | 'ABSENT';
  searchQuery: string;
  sortBy: 'time' | 'rollNumber' | 'name';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}
```

### Backend Routes

#### Attendance Routes (`/api/attendance`)

```typescript
// POST /api/attendance/scan
// Mark attendance by scanning QR code
Request: {
  qrData: string; // JSON stringified participant data
  scannedBy: string; // Admin user ID
  method: 'QR' | 'MANUAL';
}
Response: {
  success: true;
  attendance: AttendanceRecord;
  message: string;
}

// POST /api/attendance/manual
// Mark attendance manually by roll number
Request: {
  rollNumber: string;
  scannedBy: string;
}
Response: {
  success: true;
  attendance: AttendanceRecord;
}

// GET /api/attendance/stats
// Get real-time attendance statistics
Response: {
  stats: AttendanceStats;
}

// GET /api/attendance/list
// Get attendance records with filters
Query: {
  batchType?: 'JUNIOR' | 'SENIOR';
  status?: 'PRESENT' | 'ABSENT';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
Response: {
  records: AttendanceRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// GET /api/attendance/export
// Export attendance data as CSV
Query: {
  batchType?: 'JUNIOR' | 'SENIOR';
  status?: 'PRESENT' | 'ABSENT';
}
Response: CSV File Download

// GET /api/attendance/participant/:id
// Get attendance history for a specific participant
Response: {
  participant: ParticipantData;
  attendance: AttendanceRecord[];
}
```

## Data Models

### Attendance Model

**Collection**: `attendances`

```typescript
interface IAttendance extends Document {
  participantId: mongoose.Types.ObjectId; // Reference to Participant
  rollNumber: string; // Denormalized for quick lookup
  name: string; // Denormalized for display
  batchType: 'JUNIOR' | 'SENIOR'; // Denormalized for filtering
  class: string;
  mobileNumber: string;
  checkInTime: Date; // IST timestamp
  checkInDate: string; // YYYY-MM-DD format for duplicate check
  scannedBy: mongoose.Types.ObjectId; // Admin who marked attendance
  scanMethod: 'QR' | 'MANUAL'; // How attendance was marked
  qrData?: string; // Original QR code data (for audit)
  deviceInfo?: string; // Browser/device used for scanning
  duplicateAttempts: number; // Count of duplicate scan attempts
  notes?: string; // Optional notes from admin
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
- { participantId: 1, checkInDate: 1 } (unique) // Prevent duplicates per day
- { checkInTime: -1 } // Sort by recent
- { batchType: 1, checkInDate: 1 } // Batch filtering
- { rollNumber: 1 } // Quick lookup
- { checkInDate: 1 } // Date-based queries
```

### Updated Participant Model

Add attendance-related fields to existing model:

```typescript
// Add to existing IParticipant interface
interface IParticipant {
  // ... existing fields ...
  
  // New attendance fields
  attendanceMarked?: boolean; // Quick flag for filtering
  lastAttendanceDate?: Date; // Most recent attendance
  attendanceCount?: number; // Total attendance across all events
}
```

### Attendance Log Model (Audit Trail)

**Collection**: `attendance_logs`

```typescript
interface IAttendanceLog extends Document {
  participantId: mongoose.Types.ObjectId;
  rollNumber: string;
  action: 'SCAN_SUCCESS' | 'SCAN_DUPLICATE' | 'SCAN_ERROR' | 'MANUAL_ENTRY';
  timestamp: Date;
  scannedBy: mongoose.Types.ObjectId;
  qrData?: string;
  errorMessage?: string;
  deviceInfo?: string;
  ipAddress?: string;
}

// Indexes
- { timestamp: -1 } // Recent first
- { participantId: 1, timestamp: -1 } // Participant history
- { action: 1, timestamp: -1 } // Filter by action type
```

## QR Code Structure

### Current QR Data (from admitCardPdf.ts)

```typescript
// System QR Code contains:
const systemData = JSON.stringify({
  id: participantId,
  roll: rollNumber,
  name: name,
  guardian: guardianName,
  class: class,
  batch: batchType,
  mobile: mobileNumber
});
```

### QR Decode and Validation Process

1. **Scan QR Code**: Extract JSON string
2. **Parse Data**: `JSON.parse(qrData)` → Extract participant info
3. **Validate Structure**: Check required fields (id, roll, batch)
4. **Verify Participant**: Query database to ensure participant exists
5. **Check Payment**: Verify paymentStatus === 'COMPLETED'
6. **Check Duplicate**: Query attendance for same date
7. **Record Attendance**: Create attendance record with timestamp

## Error Handling

### Error Types and Responses

```typescript
enum AttendanceError {
  INVALID_QR = 'INVALID_QR', // Malformed QR data
  PARTICIPANT_NOT_FOUND = 'PARTICIPANT_NOT_FOUND', // ID not in database
  PAYMENT_INCOMPLETE = 'PAYMENT_INCOMPLETE', // Payment not completed
  DUPLICATE_ATTENDANCE = 'DUPLICATE_ATTENDANCE', // Already marked today
  CAMERA_PERMISSION_DENIED = 'CAMERA_PERMISSION_DENIED', // No camera access
  SCAN_FAILED = 'SCAN_FAILED', // Technical scan error
  UNAUTHORIZED = 'UNAUTHORIZED', // Admin auth failed
}

// Error Response Format
interface ErrorResponse {
  error: AttendanceError;
  message: string;
  details?: any;
  previousAttendance?: AttendanceRecord; // For duplicates
}
```

### User-Friendly Error Messages

- **Invalid QR**: "This QR code is not valid. Please ensure you're scanning a Quiz Champ admit card."
- **Not Found**: "Participant not found. Please verify the admit card and try again."
- **Payment Incomplete**: "Registration payment is incomplete. Please complete payment before attending."
- **Duplicate**: "Already marked present at [time]. Attendance can only be marked once per day."
- **Camera Permission**: "Camera access is required. Please enable camera permissions in your browser settings."

## Testing Strategy

### Unit Tests

Test core attendance logic:
- QR code parsing and validation
- Duplicate detection (same day check)
- Attendance statistics calculation
- Date/time formatting (IST timezone)
- Filter and sort logic

### Integration Tests

Test API endpoints:
- POST /api/attendance/scan with valid QR
- POST /api/attendance/scan with duplicate
- GET /api/attendance/stats accuracy
- GET /api/attendance/list with various filters
- CSV export with different filter combinations

### End-to-End Tests

Test complete flows:
- Scan QR → Confirm → View in dashboard
- Manual entry → Confirm → View in list
- Filter attendance → Export CSV
- Real-time dashboard updates (WebSocket)

### Mobile Device Testing

Test on:
- iOS Safari (iPhone)
- Android Chrome
- iPad Safari (tablet)
- Various screen sizes and orientations
- Camera functionality and QR detection speed

## Security Considerations

### Authentication & Authorization

- All attendance routes require admin authentication
- Session validation on every request
- Admin user ID logged with every attendance action
- IP address logging for audit trail

### Data Validation

- Sanitize all QR code input data
- Validate JSON structure before parsing
- Prevent SQL/NoSQL injection in search queries
- Rate limiting on scan endpoint (max 60/min per admin)

### Privacy & Compliance

- Store minimal data in QR codes
- Encrypt sensitive fields in attendance logs
- Implement data retention policy (keep for 2 years)
- Provide audit trail for data access
- Allow participant data export requests

## Performance Optimization

### Database Indexing

- Compound index on `participantId + checkInDate` for fast duplicate checks
- Index on `checkInTime` for recent-first sorting
- Index on `batchType` for filtered queries
- Consider MongoDB aggregation pipeline for stats

### Caching Strategy

- Cache attendance stats in Redis (TTL: 30 seconds)
- Invalidate cache on new attendance
- Cache registration totals (rarely changes)
- Client-side caching with stale-while-revalidate

### Real-time Updates

- Use WebSocket for live dashboard updates
- Broadcast attendance events to connected clients
- Throttle updates to max 1/second per client
- Graceful fallback to polling if WebSocket fails

## Deployment Considerations

### Environment Variables

```bash
# Attendance System Configuration
ATTENDANCE_SCAN_RATE_LIMIT=60 # scans per minute per admin
ATTENDANCE_STATS_CACHE_TTL=30 # seconds
WEBSOCKET_ENABLED=true
WEBSOCKET_PORT=3001
```

### Mobile Optimization

- Responsive design (mobile-first)
- Large tap targets (min 44x44px)
- Optimize camera preview size
- Reduce JavaScript bundle size
- Progressive Web App manifest

### Browser Compatibility

- Chrome/Edge: Full support
- Safari (iOS/macOS): Full support
- Firefox: Full support
- Opera: Full support
- IE11: Not supported (modern browser required for camera API)

## Future Enhancements

1. **Offline Support**: PWA with IndexedDB for offline attendance marking
2. **Multi-Event**: Support attendance for multiple events/sessions
3. **Analytics Dashboard**: Detailed charts and trends over time
4. **Notification System**: Alert admins of attendance milestones
5. **Seating Allocation**: Assign seats based on attendance order
6. **Face Recognition**: Optional photo verification during check-in
7. **Bulk Operations**: Mark multiple participants present/absent
8. **Mobile App**: Native iOS/Android app for better camera performance
