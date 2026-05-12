# SMS API Migration

## Overview
Migrated all messaging (OTP, thank you messages, reminders) from WhatsApp API to SMS API since that's the available service.

## Changes Made

### 1. WhatsApp Service (`backend/src/services/whatsapp.ts`)
**Refactored to use SMS API for all messages:**

#### Before:
- Used WhatsApp Business API
- Separate API calls for each message type
- WhatsApp-specific payload format

#### After:
- Centralized `sendSMS()` function
- All messages go through SMS API
- Consistent payload format
- Function names kept same for backward compatibility

### 2. Configuration

#### Environment Variables:
```env
# Primary messaging service
SMS_PROVIDER=api
SMS_API_URL=https://your-sms-api.com/send
SMS_API_KEY=your-sms-api-key

# WhatsApp API (commented out - not in use)
# WHATSAPP_PROVIDER=mock
```

#### Mock Mode:
For development/testing:
```env
SMS_PROVIDER=mock
```

### 3. API Payload Format

**SMS API Request:**
```json
{
  "mobileNumber": "919876543210",
  "message": "Your message content here"
}
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-api-key": "your-api-key"
}
```

## Message Types

### 1. OTP Messages
**Function:** `sendWhatsAppOTP(mobileNumber, otp)`
- Sends 6-digit OTP
- Valid for 5 minutes
- Includes security warning

**Template:**
```
🎓 Quiz Champ 2026

Your OTP for registration is: 123456

⏰ Valid for 5 minutes
🔒 Do not share this code with anyone

Need help? Contact us at contact@satyalok.in
```

### 2. Thank You Messages
**Function:** `sendThankYouMessage(mobileNumber, data)`
- Sent after successful payment
- Includes roll number, admit card link
- Portal login link
- WhatsApp group invitation

**Template:**
```
🎉 Registration Successful!

Dear [Name],

Thank you for registering for Quiz Champ 2026! 

📋 Your Details:
Roll Number: [Roll Number]
Event Date: [Date]

📥 Download Admit Card:
[URL]

🌐 Portal Access:
Login anytime at: [Portal URL]

📱 Join WhatsApp Group:
Stay updated with quiz information:
https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc

📌 Important Instructions:
• Bring your admit card on the event day
• Arrive 30 minutes before the scheduled time
• Carry a valid ID proof
• Join our WhatsApp group for updates

[Contact Info]

Best wishes for the competition! 🏆
```

### 3. Payment Reminders
**Function:** `sendPaymentReminder(mobileNumber, data)`
- Sent for incomplete registrations
- Includes payment amount and link

**Template:**
```
📢 Payment Pending

Dear [Name],

Your Quiz Champ 2026 registration is incomplete.

💰 Amount: ₹[Amount]
🔗 Complete Payment: [URL]

Complete your payment to secure your spot!

Need help? Contact us at contact@satyalok.in
```

## Implementation Details

### Centralized SMS Function
```typescript
async function sendSMS(mobileNumber: string, message: string): Promise<void> {
  const smsProvider = process.env.SMS_PROVIDER || 'mock';

  if (smsProvider === 'mock') {
    console.log(`[MOCK SMS] Message → ${mobileNumber}`);
    console.log(`[MOCK SMS] Content: ${message}`);
    return;
  }

  const smsApiUrl = process.env.SMS_API_URL;
  const smsApiKey = process.env.SMS_API_KEY;

  // Send via SMS API
  await axios.post(smsApiUrl, {
    mobileNumber: `91${mobileNumber}`,
    message: message,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': smsApiKey,
    },
    timeout: 10000,
  });
}
```

### Backward Compatibility
- Function names remain unchanged (`sendWhatsAppOTP`, etc.)
- Same function signatures
- No changes needed in calling code
- Seamless migration

## Testing

### Mock Mode Testing
```bash
# Set in .env
SMS_PROVIDER=mock

# Messages will be logged to console instead of sent
```

### Production Testing
```bash
# Set in .env
SMS_PROVIDER=api
SMS_API_URL=https://your-sms-api.com/send
SMS_API_KEY=your-actual-api-key

# Test with real phone number
```

## Error Handling

### SMS Delivery Failures:
- OTP: Throws error (user must retry)
- Thank you message: Throws error (logged, payment still completes)
- Reminder: Logs error (doesn't throw, non-critical)

### Timeout:
- 10 second timeout on all SMS API calls
- Prevents hanging requests

### Logging:
- All SMS attempts logged
- Success/failure status logged
- Error details logged for debugging

## Message Length Considerations

### SMS Character Limits:
- Standard SMS: 160 characters
- Unicode SMS: 70 characters
- Long messages: Split into multiple parts

### Current Message Lengths:
- OTP: ~150 characters ✅
- Thank you: ~600 characters (4 SMS parts)
- Reminder: ~200 characters (2 SMS parts)

### Optimization Tips:
1. Remove emojis to save characters
2. Shorten URLs using URL shortener
3. Reduce template text
4. Use abbreviations where appropriate

## Cost Considerations

### SMS Pricing (Typical):
- Transactional SMS: ₹0.20 - ₹0.50 per SMS
- OTP SMS: ₹0.15 - ₹0.30 per SMS

### Per Registration Cost:
- 1 OTP SMS: ~₹0.25
- 4 Thank you SMS: ~₹1.00
- Total: ~₹1.25 per registration

### Monthly Estimate (1000 registrations):
- OTP: ₹250
- Thank you: ₹1000
- Reminders: ₹200 (optional)
- **Total: ~₹1450/month**

## Monitoring

### Metrics to Track:
- SMS delivery rate
- Failed delivery count
- Average delivery time
- Cost per message
- User complaints about non-delivery

### Logs to Monitor:
```
[SMS] Sending message to 9876543210
[SMS] Message sent successfully: {...}
[SMS] Failed to send message: {...}
```

## Troubleshooting

### Issue: SMS not received
**Check:**
1. SMS_PROVIDER is set to 'api' (not 'mock')
2. SMS_API_URL is correct
3. SMS_API_KEY is valid
4. Phone number format is correct (919876543210)
5. SMS API has sufficient balance
6. Number is not in DND list

### Issue: SMS delayed
**Possible causes:**
- SMS gateway congestion
- Network issues
- Carrier delays
- Peak time traffic

### Issue: SMS truncated
**Solution:**
- Check message length
- Remove special characters
- Use URL shortener for links

## Future Enhancements

Potential improvements:
1. **URL Shortening**: Reduce message length
2. **Template Optimization**: Shorter, clearer messages
3. **Delivery Reports**: Track SMS delivery status
4. **Retry Logic**: Auto-retry failed messages
5. **Rate Limiting**: Prevent SMS spam
6. **Cost Tracking**: Monitor SMS expenses
7. **A/B Testing**: Test different message templates
8. **Multi-language**: Support regional languages

## Migration Checklist

- [x] Update whatsapp.ts to use SMS API
- [x] Test OTP delivery
- [x] Test thank you messages
- [x] Test payment reminders
- [x] Update .env.example
- [x] Document changes
- [ ] Test in production
- [ ] Monitor delivery rates
- [ ] Optimize message templates
- [ ] Set up cost alerts

## Support

For SMS API issues:
- Check SMS provider dashboard
- Review API documentation
- Contact SMS provider support
- Check balance and credits
