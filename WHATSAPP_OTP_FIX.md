# WhatsApp OTP Fix

## Problem
OTP sending was only working in mock mode and not sending real WhatsApp messages to users.

## Root Cause
1. Missing `WHATSAPP_PROVIDER` environment variable in `.env` file
2. WhatsApp service was using incorrect API format (WhatsApp Business API format instead of custom API format)
3. The service defaulted to `mock` mode when `WHATSAPP_PROVIDER` was not set

## Solution

### 1. Updated `.env` Configuration
Added WhatsApp configuration to enable real OTP sending:

```env
# WhatsApp API (Primary OTP delivery method)
WHATSAPP_PROVIDER=api
WHATSAPP_API_URL=https://server.veerrajpoot.com/whatsapp-api/send-message
WHATSAPP_API_KEY=quantum-verify-catalog
WHATSAPP_PHONE_NUMBER=919876543210
```

### 2. Updated WhatsApp Service API Format
Changed from WhatsApp Business API format to custom API format:

**Before:**
```javascript
{
  messaging_product: 'whatsapp',
  to: `91${mobileNumber}`,
  type: 'text',
  text: {
    body: message,
  },
}
// Headers
Authorization: `Bearer ${whatsappApiKey}`
```

**After:**
```javascript
{
  phone: `91${mobileNumber}`,
  message: message,
}
// Headers
'x-api-key': whatsappApiKey
```

### 3. Updated All WhatsApp Functions
Applied the same API format changes to:
- `sendWhatsAppOTP()` - For OTP delivery
- `sendThankYouMessage()` - For post-payment notifications
- `sendPaymentReminder()` - For payment reminders

## Files Modified

1. **quiz-champ/backend/.env**
   - Added `WHATSAPP_PROVIDER=api`
   - Added `WHATSAPP_API_URL`
   - Added `WHATSAPP_API_KEY`
   - Added `WHATSAPP_PHONE_NUMBER`

2. **quiz-champ/backend/src/services/whatsapp.ts**
   - Updated `sendWhatsAppOTP()` to use correct API format
   - Updated `sendThankYouMessage()` to use correct API format
   - Updated `sendPaymentReminder()` to use correct API format
   - Changed request body structure
   - Changed authentication header from `Authorization: Bearer` to `x-api-key`

## How It Works Now

1. User requests OTP on mobile entry
2. Backend generates 6-digit OTP
3. Backend calls `sendOTP()` which calls `sendWhatsAppOTP()`
4. WhatsApp service checks `WHATSAPP_PROVIDER` env variable
5. If set to `'api'`, sends real WhatsApp message via configured API
6. If set to `'mock'`, logs to console (development mode)
7. If WhatsApp fails, falls back to SMS (if configured)

## Testing

To test OTP sending:

1. Ensure backend is running with updated `.env`
2. Enter mobile number on registration page
3. Click "Send OTP"
4. Check WhatsApp for OTP message
5. Check backend logs for confirmation:
   ```
   [WhatsApp] Sending OTP to 9876543210
   [WhatsApp] OTP sent successfully: { ... }
   ```

## Fallback Mechanism

The system has a fallback chain:
1. **Primary**: WhatsApp API
2. **Fallback**: SMS API (if WhatsApp fails)
3. **Development**: Mock mode (logs to console)

## Environment Variables Reference

```env
# Set to 'api' for real WhatsApp, 'mock' for development
WHATSAPP_PROVIDER=api

# WhatsApp API endpoint
WHATSAPP_API_URL=https://server.veerrajpoot.com/whatsapp-api/send-message

# API authentication key
WHATSAPP_API_KEY=quantum-verify-catalog

# Business phone number (optional, for reference)
WHATSAPP_PHONE_NUMBER=919876543210
```

## Troubleshooting

If OTP is still not sending:

1. **Check environment variables**:
   ```bash
   echo $WHATSAPP_PROVIDER  # Should be 'api'
   echo $WHATSAPP_API_URL   # Should be set
   echo $WHATSAPP_API_KEY   # Should be set
   ```

2. **Check backend logs**:
   - Look for `[WhatsApp] Sending OTP to...`
   - Check for any error messages

3. **Verify API endpoint**:
   - Test the WhatsApp API endpoint manually
   - Ensure API key is valid
   - Check network connectivity

4. **Test in mock mode first**:
   - Set `WHATSAPP_PROVIDER=mock`
   - Verify OTP generation works
   - Check console logs for OTP

5. **Check rate limiting**:
   - OTP rate limit: 1 per 60 seconds per number
   - Verification attempts: Max 3 per OTP
   - OTP expiry: 5 minutes
