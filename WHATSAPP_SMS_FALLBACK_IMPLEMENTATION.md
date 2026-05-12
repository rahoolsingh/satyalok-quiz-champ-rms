# WhatsApp with SMS Fallback Implementation

## Overview
Implemented WhatsApp messaging with automatic SMS fallback for thank you messages and payment reminders. Messages are sent only once per participant to avoid spam.

## Changes Made

### 1. Database Schema Updates
**File:** `backend/src/db/models/participant.model.ts`

Added tracking fields to ensure messages are sent only once:
- `thankYouMessageSent: boolean` - Tracks if thank you message was sent
- `paymentReminderSent: boolean` - Tracks if payment reminder was sent

### 2. WhatsApp Service Enhancement
**File:** `backend/src/services/whatsapp.ts`

**Key Features:**
- **Dual Channel Support:** Tries WhatsApp first, automatically falls back to SMS if WhatsApp fails
- **Three Message Types:**
  - OTP messages (existing)
  - Thank you messages (after successful payment)
  - Payment reminders (for pending payments)

**Implementation:**
```typescript
async function sendMessageWithFallback(mobileNumber: string, message: string): Promise<void> {
  try {
    await sendWhatsApp(mobileNumber, message);
  } catch (whatsappError) {
    await sendSMS(mobileNumber, message); // Automatic fallback
  }
}
```

### 3. Payment Verification Updates
**File:** `backend/src/services/paymentVerification.ts`

**Changes:**
- Added check for `thankYouMessageSent` flag before sending messages
- Marks flag as `true` after successful message delivery
- Prevents duplicate thank you messages even if payment callback is called multiple times

### 4. Payment Reminder Service (NEW)
**File:** `backend/src/services/paymentReminder.ts`

**Features:**
- Automatically checks for pending payments every hour
- Sends reminders to participants with payments pending for 24+ hours
- Sends reminder only once per participant (tracked via `paymentReminderSent` flag)
- Includes payment URL for easy completion

**Scheduler:**
- Runs every 1 hour
- Executes immediately on server startup
- Continues even if individual messages fail

### 5. Backend Integration
**File:** `backend/src/index.ts`

Added payment reminder scheduler to start automatically when server starts:
```typescript
startPaymentReminderScheduler();
```

### 6. Environment Configuration
**File:** `backend/.env.example`

Updated configuration to support both WhatsApp and SMS:
```env
# WhatsApp API (Primary messaging channel)
WHATSAPP_PROVIDER=api
WHATSAPP_API_URL=https://your-whatsapp-api.com/send
WHATSAPP_API_KEY=your-whatsapp-api-key

# SMS API (Fallback if WhatsApp fails)
SMS_PROVIDER=api
SMS_API_URL=https://your-sms-api.com/send
SMS_API_KEY=your-sms-api-key
```

## Message Flow

### Thank You Message Flow
1. Payment gateway calls `/api/payment/callback`
2. `processPaymentVerification()` verifies payment status
3. If payment is COMPLETED and `thankYouMessageSent` is false:
   - Tries to send via WhatsApp
   - Falls back to SMS if WhatsApp fails
   - Marks `thankYouMessageSent = true`
4. Message includes:
   - Roll number
   - Admit card download link
   - Portal login URL
   - WhatsApp group link
   - Event instructions

### Payment Reminder Flow
1. Scheduler runs every hour
2. Finds participants with:
   - `paymentStatus = 'PENDING'`
   - `paymentReminderSent = false`
   - Created more than 24 hours ago
3. For each participant:
   - Tries to send via WhatsApp
   - Falls back to SMS if WhatsApp fails
   - Marks `paymentReminderSent = true`
4. Message includes:
   - Participant name
   - Amount due
   - Payment completion URL

## Message Templates

### Thank You Message
```
🎉 *Registration Successful!*

Dear [Name],

Thank you for registering for Quiz Champ 2026! 

📋 *Your Details:*
Roll Number: *[RollNumber]*
Event Date: [Date]

📥 *Download Admit Card:*
[URL]

🌐 *Portal Access:*
Login anytime at: [Portal URL]

📱 *Join WhatsApp Group:*
[Group Link]

📌 *Important Instructions:*
• Bring your admit card on the event day
• Arrive 30 minutes before the scheduled time
• Carry a valid ID proof
• Join our WhatsApp group for updates

Best wishes for the competition! 🏆
```

### Payment Reminder
```
📢 *Payment Pending*

Dear [Name],

Your Quiz Champ 2026 registration is incomplete.

💰 Amount: ₹[Amount]
🔗 Complete Payment: [URL]

Complete your payment to secure your spot!

Need help? Contact us at contact@satyalok.in
```

## Configuration

### Development Mode
Set providers to 'mock' to skip actual API calls:
```env
WHATSAPP_PROVIDER=mock
SMS_PROVIDER=mock
```

### Production Mode
Configure both APIs for redundancy:
```env
WHATSAPP_PROVIDER=api
WHATSAPP_API_URL=https://your-whatsapp-api.com/send
WHATSAPP_API_KEY=your-key

SMS_PROVIDER=api
SMS_API_URL=https://your-sms-api.com/send
SMS_API_KEY=your-key
```

## Benefits

1. **Reliability:** Automatic SMS fallback ensures messages are delivered even if WhatsApp fails
2. **No Duplicates:** Database flags prevent sending the same message multiple times
3. **Automated Reminders:** Hourly scheduler catches pending payments without manual intervention
4. **User Experience:** Participants receive timely notifications about their registration status
5. **Cost Optimization:** WhatsApp is tried first (usually cheaper), SMS used only as fallback

## Testing

### Test Thank You Message
1. Complete a payment through the payment gateway
2. Check logs for message delivery status
3. Verify `thankYouMessageSent` flag is set in database
4. Attempt to trigger callback again - should skip message sending

### Test Payment Reminder
1. Create a participant with PENDING payment status
2. Set `createdAt` to 25 hours ago (or wait 24 hours)
3. Wait for scheduler to run (or restart server)
4. Check logs for reminder delivery
5. Verify `paymentReminderSent` flag is set

### Test SMS Fallback
1. Set invalid WhatsApp credentials to force failure
2. Ensure SMS credentials are valid
3. Trigger a message
4. Verify it falls back to SMS successfully

## Monitoring

Check logs for:
- `[WhatsApp] Message sent successfully` - WhatsApp delivery
- `[SMS] Message sent successfully` - SMS delivery
- `[Message] Successfully sent via SMS fallback` - Fallback triggered
- `[Payment Reminder] Reminder sent to [Name]` - Reminder delivery
- `[Payment Verification] Thank you message already sent` - Duplicate prevention

## Future Enhancements

1. Add retry logic with exponential backoff
2. Store message delivery status in database
3. Add admin dashboard to view message delivery stats
4. Support for multiple reminder attempts (e.g., 24h, 48h, 72h)
5. Customizable reminder delay via admin panel
6. Message delivery webhooks for real-time status updates
