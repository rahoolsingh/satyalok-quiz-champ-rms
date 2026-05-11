# Event Details and Venue Implementation

## Overview
This document describes the implementation of event date/time, venue details with map URL, and QR code generation for admit cards.

## Features Implemented

### 1. Database Schema Updates
**File:** `backend/src/db/models/portalConfig.model.ts`

Added new fields to PortalConfig:
- `eventDate` (Date) - Date of the quiz competition
- `eventTime` (String) - Time range (e.g., "10:00 AM - 12:00 PM")
- `venue` (String) - Full venue address
- `venueMapUrl` (String) - Google Maps URL for the venue

### 2. Admin API Endpoints
**File:** `backend/src/routes/admin.ts`

#### GET /api/admin/portal/event-details
Returns current event configuration:
```json
{
  "eventDate": "2026-03-15T00:00:00.000Z",
  "eventTime": "10:00 AM - 12:00 PM",
  "venue": "Satyalok Auditorium, Main Campus",
  "venueMapUrl": "https://maps.google.com/..."
}
```

#### PUT /api/admin/portal/event-details
Updates event configuration:
```json
{
  "eventDate": "2026-03-15",
  "eventTime": "10:00 AM - 12:00 PM",
  "venue": "Satyalok Auditorium, Main Campus, City",
  "venueMapUrl": "https://maps.google.com/..."
}
```

### 3. Admit Card PDF Enhancements
**File:** `backend/src/services/admitCardPdf.ts`

#### New Features:
1. **Event Date & Time Display**
   - Shows formatted date (e.g., "15 March 2026")
   - Shows time range (e.g., "10:00 AM - 12:00 PM")
   - Combined display: "15 March 2026 at 10:00 AM - 12:00 PM"

2. **Venue with Hyperlink**
   - Venue text is clickable (hyperlinked to map URL)
   - Blue color (#0066cc) with underline for clickable links
   - Opens in browser when clicked in PDF viewer

3. **QR Code for Map**
   - Generates QR code from venue map URL
   - 60x60 pixel QR code placed below venue text
   - "Scan for map" label below QR code
   - Users can scan with phone to open map directly

4. **Dynamic Box Height**
   - Event details box adjusts height based on content
   - 75px when no map URL
   - 110px when map URL is present (to accommodate QR code)

### 4. Static Assets in Production
**File:** `backend/src/index.ts`

- Assets folder (`/assets`) now served in all environments (dev & production)
- Logo and branding images accessible at `/assets/logo.png` and `/assets/satyalok.png`
- Other static files (like test HTML) only served in development

### 5. Frontend Admin Panel
**File:** `frontend/src/pages/admin/EventConfiguration.tsx`

New admin page for managing event details:
- Date picker for event date
- Text input for event time
- Textarea for venue address
- URL input for Google Maps link
- Live preview of how details will appear
- Validation and error handling

**File:** `frontend/src/pages/admin/AdminDashboard.tsx`
- Added "Event Details" tab with 📍 icon
- Accessible from admin dashboard

### 6. API Client Updates
**File:** `frontend/src/api/client.ts`

Added new methods:
```typescript
adminApi.getEventDetails()
adminApi.updateEventDetails(data)
```

## Updated Files

### Backend
1. `backend/src/db/models/portalConfig.model.ts` - Schema updates
2. `backend/src/routes/admin.ts` - New endpoints
3. `backend/src/services/admitCardPdf.ts` - PDF enhancements
4. `backend/src/services/paymentVerification.ts` - Pass event details
5. `backend/src/routes/profile.ts` - Pass event details
6. `backend/src/routes/registration.ts` - Pass event details
7. `backend/src/index.ts` - Serve assets in production

### Frontend
1. `frontend/src/api/client.ts` - New API methods
2. `frontend/src/pages/admin/EventConfiguration.tsx` - New page
3. `frontend/src/pages/admin/AdminDashboard.tsx` - Add event tab

## Usage Guide

### For Admins

1. **Login to Admin Panel**
   - Navigate to `/admin`
   - Login with admin credentials

2. **Configure Event Details**
   - Click on "Event Details" tab (📍 icon)
   - Fill in the form:
     - **Event Date**: Select date from calendar
     - **Event Time**: Enter time range (e.g., "10:00 AM - 12:00 PM")
     - **Venue**: Enter full venue address
     - **Venue Map URL**: Paste Google Maps link
   - Click "Update Event Details"

3. **Get Google Maps URL**
   - Go to Google Maps
   - Search for your venue
   - Click "Share" button
   - Copy the link
   - Paste in "Venue Map URL" field

### For Students

1. **View Admit Card**
   - Login with mobile number
   - Complete payment
   - View/download admit card

2. **Access Venue Map**
   - **Option 1**: Click on venue text in PDF (opens in browser)
   - **Option 2**: Scan QR code with phone camera
   - **Option 3**: Use QR code scanner app

## Technical Details

### QR Code Generation
- Library: `qrcode` (already installed)
- Error correction level: M (Medium)
- Size: 60x60 pixels
- Format: PNG embedded in PDF
- Content: Google Maps URL

### PDF Hyperlinks
- PDFKit supports clickable links
- Venue text becomes clickable when `venueMapUrl` is provided
- Links open in default browser when clicked

### Date Formatting
- Backend stores as Date object
- Frontend displays in Indian format: "15 March 2026"
- Uses `toLocaleDateString('en-IN')` for formatting

### Backward Compatibility
- All fields are optional
- If not set, shows "To be announced"
- Existing admit cards continue to work
- No migration needed

## Testing Checklist

### Backend
- [ ] Event details endpoints return correct data
- [ ] Event details can be updated
- [ ] Admit card PDF includes event details
- [ ] QR code is generated correctly
- [ ] Venue link is clickable in PDF
- [ ] Assets are served in production
- [ ] Date formatting is correct

### Frontend
- [ ] Event Configuration page loads
- [ ] Form validation works
- [ ] Date picker works correctly
- [ ] Preview updates in real-time
- [ ] Success/error messages display
- [ ] Event details persist after refresh

### Admit Card
- [ ] Event date displays correctly
- [ ] Event time displays correctly
- [ ] Venue text is visible
- [ ] Venue link is clickable (when URL provided)
- [ ] QR code is scannable
- [ ] QR code opens correct map URL
- [ ] Layout adjusts for QR code presence
- [ ] "To be announced" shows when not configured

## Environment Variables

No new environment variables required. Uses existing configuration.

## API Examples

### Get Event Details
```bash
GET /api/admin/portal/event-details
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "eventDate": "2026-03-15T00:00:00.000Z",
  "eventTime": "10:00 AM - 12:00 PM",
  "venue": "Satyalok Auditorium, Main Campus, City",
  "venueMapUrl": "https://maps.google.com/?q=12.9716,77.5946"
}
```

### Update Event Details
```bash
PUT /api/admin/portal/event-details
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "eventDate": "2026-03-15",
  "eventTime": "10:00 AM - 12:00 PM",
  "venue": "Satyalok Auditorium, Main Campus, City",
  "venueMapUrl": "https://maps.google.com/?q=12.9716,77.5946"
}
```

Response:
```json
{
  "message": "Event details updated successfully",
  "eventDate": "2026-03-15T00:00:00.000Z",
  "eventTime": "10:00 AM - 12:00 PM",
  "venue": "Satyalok Auditorium, Main Campus, City",
  "venueMapUrl": "https://maps.google.com/?q=12.9716,77.5946"
}
```

## Notes

- QR codes are generated on-the-fly during PDF creation
- No QR code images are stored on disk
- Map URLs should be Google Maps links for best compatibility
- Venue text can be multi-line (up to 3 lines recommended)
- Event time is free-form text (no validation)
- All fields are optional and can be updated independently

## Future Enhancements

Potential improvements:
- Multiple venue support for different batches
- Event calendar integration
- Automatic reminder emails with map link
- Venue capacity tracking
- Seating arrangement integration
