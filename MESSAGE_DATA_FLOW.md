# Message Data Flow - Complete Reference

## Quick Reference Table

| Data Field | Source | Current Value | How to Update |
|------------|--------|---------------|---------------|
| **Admit Card URL** | Auto-generated | `{FRONTEND_URL}/api/registration/admit-card/{participantId}` | Set `FRONTEND_URL` in `.env` |
| **Portal URL** | Environment | `http://localhost:3000` | Set `FRONTEND_URL` in `.env` |
| **WhatsApp Group** | Hardcoded | `https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc` | Edit `whatsapp.ts` line ~185 |
| **Event Date** | Database | From `PortalConfig.eventDate` | Admin Panel → Event Configuration |
| **Event Time** | Database | From `PortalConfig.eventTime` | Admin Panel → Event Configuration |
| **Venue** | Database | From `PortalConfig.venue` | Admin Panel → Event Configuration |
| **Contact Phone** | Hardcoded | `+916207782702` | Edit `whatsapp.ts` line ~186 |
| **Contact Email** | Hardcoded | `contact@satyalok.in` | Edit `whatsapp.ts` (multiple places) |
| **Fee Amount** | Database | `PortalConfig.feeJunior` / `feeSenior` | Admin Panel → Fee Configuration |
| **Roll Number** | Auto-generated | `JR26XXXX` or `SR26XXXX` | Automatic (based on batch) |

---

## Message 1: OTP Message

### User Receives:
```
🎓 *Quiz Champ 2026*

Your OTP for registration is: *123456*

⏰ Valid for 5 minutes
🔒 Do not share this code with anyone

Need help? Contact us at 
Subodh: +916207782702

For more info, visit: www.satyalok.in
```

### Data Mapping:
- `123456` → Random 6-digit OTP (generated)
- `+916207782702` → Hardcoded in `otpTemplate()`
- `www.satyalok.in` → Hardcoded in `otpTemplate()`

---

## Message 2: Thank You Message (Payment Success)

### User Receives (Example):
```
🎉 *Registration Successful!*

Dear *Rahul Kumar*,

Thank you for registering for Quiz Champ 2026! 

📋 *Your Details:*
Roll Number: *JR260001*

📅 *Event Details:*
Date: 15 March 2026
Time: 10:00 AM - 12:00 PM
Venue: Satyalok Auditorium, Patna

📥 *Download Admit Card:*
http://localhost:3000/api/registration/admit-card/507f1f77bcf86cd799439011

🌐 *Portal Login:*
http://localhost:3000

📱 *Join WhatsApp Group:*
https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc

📌 *Important Instructions:*
• Bring your admit card on event day
• Arrive 30 minutes before scheduled time
• Carry a valid ID proof
• Join our WhatsApp group for updates

📞 *Need Help?*
Contact: +916207782702
Email: contact@satyalok.in

Best wishes for the competition! 🏆
```

### Data Mapping:

#### From Participant Record (MongoDB):
```javascript
participant.name              → "Rahul Kumar"
participant.rollNumber        → "JR260001"
participant._id               → "507f1f77bcf86cd799439011"
participant.mobileNumber      → "9876543210"
```

#### From Portal Config (MongoDB):
```javascript
portalConfig.eventDate        → "2026-03-15" → Formatted to "15 March 2026"
portalConfig.eventTime        → "10:00 AM - 12:00 PM"
portalConfig.venue            → "Satyalok Auditorium, Patna"
```

#### From Environment Variables:
```javascript
process.env.FRONTEND_URL      → "http://localhost:3000"
```

#### Hardcoded Values:
```javascript
whatsappGroupUrl              → "https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc"
contactNumber                 → "+916207782702"
contactEmail                  → "contact@satyalok.in"
```

#### Generated URLs:
```javascript
admitCardUrl = `${FRONTEND_URL}/api/registration/admit-card/${participant._id}`
// Result: http://localhost:3000/api/registration/admit-card/507f1f77bcf86cd799439011

portalUrl = process.env.FRONTEND_URL
// Result: http://localhost:3000
```

---

## Message 3: Payment Reminder

### User Receives (Example):
```
📢 *Payment Pending*

Dear Priya Singh,

Your Quiz Champ 2026 registration is incomplete.

💰 Amount: ₹100
🔗 Complete Payment: http://localhost:3000/payment-status?participantId=507f1f77bcf86cd799439011

Complete your payment to secure your spot!

Need help? Contact us at contact@satyalok.in
```

### Data Mapping:

#### From Participant Record:
```javascript
participant.name              → "Priya Singh"
participant._id               → "507f1f77bcf86cd799439011"
participant.batchType         → "JUNIOR" or "SENIOR"
```

#### From Portal Config:
```javascript
portalConfig.feeJunior        → 100 (if batchType is JUNIOR)
portalConfig.feeSenior        → 150 (if batchType is SENIOR)
```

#### From Environment Variables:
```javascript
process.env.FRONTEND_URL      → "http://localhost:3000"
```

#### Generated URLs:
```javascript
paymentUrl = `${FRONTEND_URL}/payment-status?participantId=${participant._id}`
// Result: http://localhost:3000/payment-status?participantId=507f1f77bcf86cd799439011
```

#### Hardcoded Values:
```javascript
contactEmail                  → "contact@satyalok.in"
```

---

## Code Locations

### 1. Message Templates
**File:** `backend/src/services/whatsapp.ts`

```typescript
// Line ~165
function otpTemplate(otp: string): string { ... }

// Line ~180
function thankYouTemplate(data: ThankYouMessageData): string { ... }

// Line ~220
function paymentReminderTemplate(data: ReminderData): string { ... }
```

### 2. Thank You Message Trigger
**File:** `backend/src/services/paymentVerification.ts`

```typescript
// Line ~90-120
if (!participant.thankYouMessageSent) {
  // Get event details from portal config
  const portalConfig = await PortalConfig.findOne().lean();
  
  const eventDate = portalConfig?.eventDate 
    ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', ...)
    : 'To be announced';
  
  await sendThankYouMessage(participant.mobileNumber, {
    name: participant.name,
    rollNumber: participant.rollNumber!,
    admitCardUrl,
    portalUrl,
    eventDate,
    eventTime,
    venue,
  });
  
  participant.thankYouMessageSent = true;
  await participant.save();
}
```

### 3. Payment Reminder Trigger
**File:** `backend/src/services/paymentReminder.ts`

```typescript
// Line ~20-60
export async function sendPendingPaymentReminders(): Promise<void> {
  const pendingParticipants = await Participant.find({
    paymentStatus: 'PENDING',
    paymentReminderSent: { $ne: true },
    createdAt: { $lt: cutoffTime }, // 24 hours ago
  });

  for (const participant of pendingParticipants) {
    await sendPaymentReminder(participant.mobileNumber, {
      name: participant.name,
      amount,
      paymentUrl,
    });
    
    participant.paymentReminderSent = true;
    await participant.save();
  }
}
```

---

## How to Update Each Field

### 1. Update Frontend URL (Production)
**File:** `backend/.env`
```env
FRONTEND_URL=https://quizchamp.satyalok.in
```

### 2. Update Event Details
**Method:** Admin Panel
- Login to admin panel
- Go to "Event Configuration"
- Set:
  - Event Date
  - Event Time
  - Venue
  - Venue Map URL (optional)

### 3. Update WhatsApp Group Link
**File:** `backend/src/services/whatsapp.ts`
```typescript
// Line ~185
const whatsappGroupUrl = 'https://chat.whatsapp.com/YOUR_NEW_GROUP_LINK';
```

### 4. Update Contact Information
**File:** `backend/src/services/whatsapp.ts`

```typescript
// Line ~186 (Thank you message)
const contactNumber = '+919876543210';

// Line ~170 (OTP message)
Need help? Contact us at 
Subodh: +919876543210

// Line ~210 (Thank you message)
Email: your-email@satyalok.in

// Line ~235 (Payment reminder)
Need help? Contact us at your-email@satyalok.in
```

### 5. Update Fee Amounts
**Method:** Admin Panel
- Login to admin panel
- Go to "Fee Configuration"
- Set:
  - Junior Fee (e.g., 100)
  - Senior Fee (e.g., 150)

---

## Message Delivery Flow

### Thank You Message Flow:
```
Payment Gateway Callback
    ↓
processPaymentVerification()
    ↓
Check: participant.thankYouMessageSent === false?
    ↓ YES
Fetch PortalConfig (event details)
    ↓
Generate URLs (admit card, portal)
    ↓
sendThankYouMessage()
    ↓
Try WhatsApp → If fails → Try SMS
    ↓
Set thankYouMessageSent = true
    ↓
Save to database
```

### Payment Reminder Flow:
```
Scheduler (runs every hour)
    ↓
Find participants with:
  - paymentStatus = PENDING
  - paymentReminderSent = false
  - createdAt > 24 hours ago
    ↓
For each participant:
    ↓
Fetch fee from PortalConfig
    ↓
Generate payment URL
    ↓
sendPaymentReminder()
    ↓
Try WhatsApp → If fails → Try SMS
    ↓
Set paymentReminderSent = true
    ↓
Save to database
```

---

## Testing Checklist

- [ ] Verify `FRONTEND_URL` is correct
- [ ] Set event details in admin panel
- [ ] Update WhatsApp group URL if needed
- [ ] Update contact phone/email if needed
- [ ] Test OTP message delivery
- [ ] Test thank you message after payment
- [ ] Test payment reminder (create old pending payment)
- [ ] Test SMS fallback (disable WhatsApp temporarily)
- [ ] Verify all URLs in messages are clickable
- [ ] Verify admit card download works
- [ ] Verify portal login works
- [ ] Verify WhatsApp group link works
