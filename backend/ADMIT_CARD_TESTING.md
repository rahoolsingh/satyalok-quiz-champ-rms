# Admit Card PDF Testing Guide

This guide explains how to test and style the admit card PDF generator.

## Overview

The admit card generator creates professional A4-sized PDF documents with:
- Blue header with event branding
- Participant photo (if available)
- Participant details (roll number, name, class, etc.)
- Event information box
- Important instructions
- Footer with organization details

## Test Routes

### 1. Generate PDF with Sample Data (GET)

**Endpoint:** `GET http://localhost:3001/api/test/admit-card`

This generates a PDF using the sample data from `src/test-data/sample-admit-card.json`.

**Usage:**
```bash
# Using curl
curl http://localhost:3001/api/test/admit-card --output admit-card-test.pdf

# Or simply open in browser
open http://localhost:3001/api/test/admit-card
```

### 2. Generate PDF with Custom Data (POST)

**Endpoint:** `POST http://localhost:3001/api/test/admit-card`

Send custom JSON data to generate a PDF with your own test data.

**Usage:**
```bash
curl -X POST http://localhost:3001/api/test/admit-card \
  -H "Content-Type: application/json" \
  -d '{
    "rollNumber": "QC2026-SR-042",
    "name": "Priya Sharma",
    "class": "Class 10",
    "batchType": "SENIOR",
    "guardianName": "Mrs. Sunita Sharma",
    "mobileNumber": "9876543210",
    "photoUrl": "https://via.placeholder.com/300x350",
    "eventName": "Quiz Champ 2026 Finals",
    "eventDate": "Sunday, 20th April 2026 at 2:00 PM",
    "venue": "Delhi Public School Auditorium"
  }' \
  --output custom-admit-card.pdf
```

### 3. Get Sample Data Template (GET)

**Endpoint:** `GET http://localhost:3001/api/test/admit-card/sample`

Returns the sample JSON data structure.

**Usage:**
```bash
curl http://localhost:3001/api/test/admit-card/sample
```

## Modifying Sample Data

Edit the file `src/test-data/sample-admit-card.json` to change the default test data:

```json
{
  "rollNumber": "QC2026-JR-001",
  "name": "Your Test Name",
  "class": "Class 6",
  "batchType": "JUNIOR",
  "guardianName": "Guardian Name",
  "mobileNumber": "9876543210",
  "photoUrl": "https://your-photo-url.com/photo.jpg",
  "eventName": "Quiz Champ 2026 - State Level Competition",
  "eventDate": "Saturday, 15th March 2026 at 10:00 AM",
  "venue": "Satyalok Foundation Auditorium, New Delhi"
}
```

## Testing Different Scenarios

### Test without Photo
```json
{
  "rollNumber": "QC2026-JR-002",
  "name": "Test Student",
  "class": "Class 5",
  "batchType": "JUNIOR",
  "guardianName": "Test Guardian",
  "mobileNumber": "9876543210"
}
```

### Test with Long Names
```json
{
  "rollNumber": "QC2026-SR-003",
  "name": "Sarvesh Kumar Ramakrishnan Venkataraman",
  "class": "Class 12",
  "batchType": "SENIOR",
  "guardianName": "Dr. Ramakrishnan Venkataraman Subramanian",
  "mobileNumber": "9876543210"
}
```

### Test Senior Batch
```json
{
  "rollNumber": "QC2026-SR-100",
  "name": "Arjun Patel",
  "class": "Class 11",
  "batchType": "SENIOR",
  "guardianName": "Mr. Kiran Patel",
  "mobileNumber": "9876543210"
}
```

## Styling the PDF

To modify the PDF styling, edit `src/services/admitCardPdf.ts`:

### Key Dimensions (A4 Size)
- Page Width: 595.28 points (210mm)
- Page Height: 841.89 points (297mm)
- Margins: 50 points

### Color Scheme
- Primary Blue: `#0071e3`
- Dark Blue: `#005bb5`
- Text Dark: `#1d1d1f`
- Text Gray: `#86868b`
- Border Gray: `#d2d2d7`
- Background: `#f8f9fa`

### Font Sizes
- Main Title: 32pt
- Subtitle: 16pt
- Section Headers: 14pt
- Field Labels: 10pt
- Field Values: 14pt
- Body Text: 11pt
- Instructions: 10pt
- Footer: 9pt

## Quick Testing Workflow

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Generate a test PDF:**
   ```bash
   curl http://localhost:3001/api/test/admit-card --output test.pdf
   ```

3. **Open the PDF:**
   ```bash
   open test.pdf  # macOS
   xdg-open test.pdf  # Linux
   start test.pdf  # Windows
   ```

4. **Make styling changes** in `src/services/admitCardPdf.ts`

5. **Regenerate and view** (repeat steps 2-3)

## Using Postman

1. Create a new GET request to `http://localhost:3001/api/test/admit-card`
2. Click "Send and Download"
3. Save the PDF and open it
4. For custom data, use POST with JSON body

## Notes

- Test routes are only available in development mode (NODE_ENV !== 'production')
- Photo URLs must be publicly accessible
- Invalid photo URLs will show a placeholder
- The PDF is optimized for A4 printing
- All measurements are in points (1 point = 1/72 inch)

## Troubleshooting

**PDF not generating:**
- Check if the backend server is running
- Verify the test route is enabled (check console for "Test routes enabled")
- Check backend logs for errors

**Photo not showing:**
- Verify the photo URL is publicly accessible
- Check if the image format is supported (JPEG, PNG)
- Try with the placeholder URL first

**Styling issues:**
- Remember to restart the server after code changes
- Check the console for PDF generation errors
- Verify all coordinates are within page bounds
