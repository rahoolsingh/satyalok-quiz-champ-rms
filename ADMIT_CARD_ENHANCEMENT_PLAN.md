# Admit Card Enhancement Plan

## Overview
Comprehensive enhancement of the admit card system with professional design, email delivery, and mobile-first UI.

## Requirements

### 1. Professional Admit Card Design
- [ ] Include participant photo
- [ ] Display all registration details (name, roll number, class, batch, etc.)
- [ ] Add Quiz Champ 2026 branding
- [ ] Include QR code for verification
- [ ] Professional layout with proper spacing and typography

### 2. Download Functionality
- [ ] Generate PDF admit card on backend
- [ ] Provide download endpoint
- [ ] Add download button on frontend
- [ ] Support both web view and PDF download

### 3. Email Delivery
- [ ] Set up email service in Quiz Champ Backend
- [ ] Send admit card email after successful payment
- [ ] Include PDF attachment
- [ ] Professional email template

### 4. Mobile-First UI
- [ ] Center content in mobile-app-style container (max-width: 448px)
- [ ] Apply to all public pages (exclude /admin)
- [ ] Maintain responsive design
- [ ] Professional mobile app feel

### 5. Smart Flow Based on Status
- [ ] If user already has COMPLETED payment → Show admit card
- [ ] If user has PENDING draft → Pre-fill form
- [ ] If user is new → Start fresh registration
- [ ] One registration per mobile number (already implemented)

## Implementation Steps

### Phase 1: Backend - Email Service
1. Install email dependencies (`nodemailer`)
2. Create email service (`src/services/email.ts`)
3. Add SMTP configuration to `.env`
4. Create admit card email template

### Phase 2: Backend - PDF Generation
1. Install PDF generation library (`pdfkit` or `puppeteer`)
2. Create admit card PDF service (`src/services/admitCardPdf.ts`)
3. Design professional admit card layout
4. Include participant photo in PDF

### Phase 3: Backend - Integration
1. Update payment callback to send email
2. Add admit card download endpoint
3. Test email delivery

### Phase 4: Frontend - Mobile-First UI
1. Update PublicPortal layout
2. Update all component layouts
3. Add mobile app styling
4. Test on various screen sizes

### Phase 5: Frontend - Admit Card Display
1. Enhance AdmitCard component
2. Add download button
3. Add print functionality
4. Improve visual design

### Phase 6: Frontend - Smart Flow
1. Check user status on OTP verification
2. Route to appropriate step based on status
3. Show admit card if already paid
4. Pre-fill form if draft exists

## Technical Decisions

### Email Service
**Choice**: Nodemailer with SMTP
- Flexible and widely supported
- Works with any SMTP provider (Gmail, SendGrid, AWS SES, etc.)
- Easy to configure

### PDF Generation
**Choice**: PDFKit
- Lightweight and fast
- Good for programmatic PDF generation
- Supports images and custom layouts
- Alternative: Puppeteer (heavier but more flexible)

### Mobile-First Container
**Max Width**: 448px (28rem)
- Standard mobile app width
- Comfortable on tablets
- Professional on desktop

## Environment Variables Needed

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=Quiz Champ 2026 <noreply@satyalok.in>
```

## Files to Create/Modify

### Backend
- `src/services/email.ts` (new)
- `src/services/admitCardPdf.ts` (new)
- `src/templates/admitCardEmail.html` (new)
- `src/routes/payment.ts` (modify)
- `src/routes/registration.ts` (modify - add download endpoint)
- `.env.example` (modify)

### Frontend
- `src/pages/PublicPortal.tsx` (modify - mobile-first)
- `src/components/AdmitCard.tsx` (enhance)
- `src/pages/PaymentSuccess.tsx` (enhance)
- All component files (adjust for mobile-first)

## Priority Order

1. **High Priority** (Core functionality)
   - Email service setup
   - PDF generation
   - Email delivery on payment success
   - Download functionality

2. **Medium Priority** (UX improvements)
   - Mobile-first UI
   - Enhanced admit card design
   - Smart flow based on status

3. **Low Priority** (Nice to have)
   - Print functionality
   - Share functionality
   - Advanced email templates

## Estimated Effort

- Phase 1-3 (Backend): ~4-6 hours
- Phase 4-6 (Frontend): ~3-4 hours
- Testing & Polish: ~2 hours
- **Total**: ~9-12 hours

## Next Steps

Would you like me to:
1. Start with backend email and PDF generation?
2. Focus on mobile-first UI first?
3. Implement everything step by step?

Please confirm which approach you'd prefer, and I'll begin implementation.
