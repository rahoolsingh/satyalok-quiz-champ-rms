# Message Examples - What Users Will Receive

## Data Sources

### 1. **Admit Card URL**
- **Source:** Generated dynamically
- **Format:** `{FRONTEND_URL}/api/registration/admit-card/{participantId}`
- **Example:** `http://localhost:3000/api/registration/admit-card/507f1f77bcf86cd799439011`
- **From:** `process.env.FRONTEND_URL` + participant's MongoDB `_id`

### 2. **Portal URL**
- **Source:** Environment variable
- **Variable:** `FRONTEND_URL`
- **Current Value:** `http://localhost:3000`
- **Production:** Should be `https://quizchamp.satyalok.in` or similar
- **Used For:** Login link in messages

### 3. **WhatsApp Group URL**
- **Source:** Hardcoded in `whatsapp.ts`
- **Current Value:** `https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc`
- **Purpose:** Community group for quiz updates
- **To Update:** Change in `thankYouTemplate()` function

### 4. **Event Details**
- **Source:** `PortalConfig` collection in MongoDB
- **Fields Used:**
  - `eventDate` → Formatted as "15 March 2026"
  - `eventTime` → e.g., "10:00 AM - 12:00 PM"
  - `venue` → e.g., "Satyalok Auditorium, Patna"
- **Fallback:** "To be announced" if not set in admin panel

### 5. **Contact Information**
- **Phone:** `+916207782702` (Hardcoded - Subodh's number)
- **Email:** `contact@satyalok.in` (Hardcoded)
- **To Update:** Change in template functions in `whatsapp.ts`

### 6. **Payment Amount**
- **Source:** `PortalConfig` collection
- **Fields:**
  - `feeJunior` → Default: ₹100
  - `feeSenior` → Default: ₹150
- **Configurable:** Via admin panel at `/admin/fee-configuration`

---

## Message 1: OTP Verification

### When Sent
- User enters mobile number and requests OTP
- Sent via WhatsApp, falls back to SMS if WhatsApp fails

### Message Content
```
🎓 *Quiz Champ 2026*

Your OTP for registration is: *123456*

⏰ Valid for 5 minutes
🔒 Do not share this code with anyone

Need help? Contact us at 
Subodh: +916207782702

For more info, visit: www.satyalok.in
```

### Data Sources
- **OTP:** Generated randomly (6 digits)
- **Contact Number:** Hardcoded `+916207782702`
- **Website:** Hardcoded `www.satyalok.in`

---

## Message 2: Thank You Message (After Payment Success)

### When Sent
- Payment is successfully completed
- Sent only once (tracked by `thankYouMessageSent` flag)
- Sent via WhatsApp, falls back to SMS if WhatsApp fails

### Example Message (With Event Details Configured)
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

### Example Message (Without Event Details)
```
🎉 *Registration Successful!*

Dear *Rahul Kumar*,

Thank you for registering for Quiz Champ 2026! 

📋 *Your Details:*
Roll Number: *JR260001*

📅 *Event Details:*
Date: To be announced
Time: To be announced
Venue: To be announced

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

### Data Sources
| Field | Source | Example |
|-------|--------|---------|
| Name | `participant.name` | Rahul Kumar |
| Roll Number | `participant.rollNumber` | JR260001 |
| Event Date | `portalConfig.eventDate` | 15 March 2026 |
| Event Time | `portalConfig.eventTime` | 10:00 AM - 12:00 PM |
| Venue | `portalConfig.venue` | Satyalok Auditorium, Patna |
| Admit Card URL | `FRONTEND_URL + /api/registration/admit-card/ + participant._id` | http://localhost:3000/api/registration/admit-card/507f... |
| Portal URL | `process.env.FRONTEND_URL` | http://localhost:3000 |
| WhatsApp Group | Hardcoded | https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc |
| Contact Phone | Hardcoded | +916207782702 |
| Contact Email | Hardcoded | contact@satyalok.in |

---

## Message 3: Payment Reminder

### When Sent
- Payment is pending for 24+ hours
- Sent only once (tracked by `paymentReminderSent` flag)
- Checked every hour by automated scheduler
- Sent via WhatsApp, falls back to SMS if WhatsApp fails

### Message Content
```
📢 *Payment Pending*

Dear Priya Singh,

Your Quiz Champ 2026 registration is incomplete.

💰 Amount: ₹100
🔗 Complete Payment: http://localhost:3000/payment-status?participantId=507f1f77bcf86cd799439011

Complete your payment to secure your spot!

Need help? Contact us at contact@satyalok.in
```

### Data Sources
| Field | Source | Example |
|-------|--------|---------|
| Name | `participant.name` | Priya Singh |
| Amount | `portalConfig.feeJunior` or `portalConfig.feeSenior` | ₹100 or ₹150 |
| Payment URL | `FRONTEND_URL + /payment-status?participantId= + participant._id` | http://localhost:3000/payment-status?participantId=507f... |
| Contact Email | Hardcoded | contact@satyalok.in |

---

## Configuration Checklist

### Required Environment Variables
```env
# Frontend URL (used for all links)
FRONTEND_URL=http://localhost:3000

# WhatsApp API (Primary)
WHATSAPP_PROVIDER=api
WHATSAPP_API_URL=https://server.veerrajpoot.com/whatsapp-api/send-message
WHATSAPP_API_KEY=quantum-verify-catalog

# SMS API (Fallback)
SMS_PROVIDER=whatsapp
SMS_API_URL=https://server.veerrajpoot.com/whatsapp-api/send-message
SMS_API_KEY=quantum-verify-catalog
```

### Required Database Configuration (Portal Config)
Set these via Admin Panel → Event Configuration:

1. **Event Date** → e.g., "2026-03-15"
2. **Event Time** → e.g., "10:00 AM - 12:00 PM"
3. **Venue** → e.g., "Satyalok Auditorium, Patna"
4. **Fee Junior** → e.g., 100
5. **Fee Senior** → e.g., 150

### Hardcoded Values to Update (if needed)

**File:** `backend/src/services/whatsapp.ts`

1. **WhatsApp Group URL** (Line ~185)
   ```typescript
   const whatsappGroupUrl = 'https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc';
   ```

2. **Contact Phone Number** (Line ~186)
   ```typescript
   const contactNumber = '+916207782702';
   ```

3. **Contact Email** (Multiple places)
   ```typescript
   Email: contact@satyalok.in
   ```

4. **Website URL** (OTP template, Line ~170)
   ```typescript
   For more info, visit: www.satyalok.in
   ```

---

## Testing Messages

### Test OTP Message
```bash
# Send OTP via API
curl -X POST http://localhost:3001/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "9876543210"}'
```

### Test Thank You Message
1. Complete a payment successfully
2. Check backend logs for: `[Payment Verification] Thank you message sent to...`
3. Check participant record: `thankYouMessageSent: true`

### Test Payment Reminder
1. Create participant with pending payment
2. Set `createdAt` to 25 hours ago in MongoDB
3. Wait for scheduler (runs every hour) or restart server
4. Check logs for: `[Payment Reminder] Reminder sent to...`

### Test SMS Fallback
1. Set invalid WhatsApp credentials temporarily
2. Trigger any message
3. Check logs for: `[Message] Successfully sent via SMS fallback`

---

## Production Deployment Checklist

- [ ] Update `FRONTEND_URL` to production domain
- [ ] Configure event details in admin panel
- [ ] Update WhatsApp group URL if different
- [ ] Verify contact phone number is correct
- [ ] Verify contact email is correct
- [ ] Test WhatsApp API credentials
- [ ] Test SMS API credentials (fallback)
- [ ] Test message delivery end-to-end
- [ ] Monitor logs for delivery failures
