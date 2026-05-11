# WhatsApp Docker Network Fix

## Problem
WhatsApp API calls are failing with `ECONNREFUSED 127.0.1.1:443` error inside Docker container.

```
[WhatsApp] Failed to send OTP: AxiosError: connect ECONNREFUSED 127.0.1.1:443
url: 'https://server.veerrajpoot.com/whatsapp-api/send-message'
```

## Root Cause
The Docker container is trying to connect to `https://server.veerrajpoot.com` but DNS inside the container is resolving it to `127.0.1.1` (localhost) instead of the actual server IP.

## Solution

### Option 1: Use Internal Docker Network IP (Recommended)
Update the `.env` file to use the same internal network IP pattern as other services:

```env
# WhatsApp API (Primary OTP delivery method)
WHATSAPP_PROVIDER=api
WHATSAPP_API_URL=http://172.31.0.1:5004/send-message
WHATSAPP_API_KEY=quantum-verify-catalog
WHATSAPP_PHONE_NUMBER=919876543210
```

**Note**: Change port `5004` to the actual port where your WhatsApp API is running if different.

### Option 2: Use Host Network Mode
Modify `docker-compose.yml` to use host network:

```yaml
services:
  backend:
    network_mode: "host"
```

**Drawback**: This removes network isolation and may cause port conflicts.

### Option 3: Add Extra Hosts to Docker
Add the server's public IP to Docker's hosts file in `docker-compose.yml`:

```yaml
services:
  backend:
    extra_hosts:
      - "server.veerrajpoot.com:YOUR_PUBLIC_IP"
```

Replace `YOUR_PUBLIC_IP` with your server's actual public IP address.

## Current Server Configuration

Based on your server logs, your current setup uses:
- **SMS API**: `http://172.31.0.1:5004/send-message` ✅ Working
- **PGS API**: `http://172.31.0.1:5002` ✅ Working
- **WhatsApp API**: `https://server.veerrajpoot.com/whatsapp-api/send-message` ❌ Not working

## Recommended Fix

Update your server's `.env` file at `/root/satyalok-quiz-champ-rms/backend/.env`:

```bash
# Change this:
WHATSAPP_API_URL=https://server.veerrajpoot.com/whatsapp-api/send-message

# To this (assuming WhatsApp API runs on same server as SMS):
WHATSAPP_API_URL=http://172.31.0.1:5004/send-message
```

## Steps to Apply Fix

1. **SSH into your server**:
   ```bash
   ssh root@server.veerrajpoot.com
   ```

2. **Navigate to backend directory**:
   ```bash
   cd ~/satyalok-quiz-champ-rms/backend
   ```

3. **Edit the .env file**:
   ```bash
   nano .env
   ```

4. **Update the WHATSAPP_API_URL**:
   ```env
   WHATSAPP_PROVIDER=api
   WHATSAPP_API_URL=http://172.31.0.1:5004/send-message
   WHATSAPP_API_KEY=quantum-verify-catalog
   ```

5. **Save and exit** (Ctrl+X, then Y, then Enter)

6. **Rebuild and restart Docker**:
   ```bash
   docker compose down
   docker compose up --build -d
   ```

7. **Check logs**:
   ```bash
   docker compose logs -f backend
   ```

## Verification

After applying the fix, you should see:
```
[WhatsApp] Sending OTP to 8210228101
[WhatsApp] OTP sent successfully: { ... }
```

Instead of:
```
[WhatsApp] Failed to send OTP: AxiosError: connect ECONNREFUSED 127.0.1.1:443
[OTP] WhatsApp delivery failed, attempting SMS fallback
```

## Fallback Behavior

Currently, when WhatsApp fails, the system falls back to SMS:
```
[OTP] Sending via SMS fallback to 8210228101
[OTP] SMS fallback response: { success: true, status: 'Message sent successfully' }
```

This is working correctly, but fixing WhatsApp will provide a better user experience.

## Network Architecture

```
┌─────────────────────────────────────┐
│  Docker Container (quiz-champ)      │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Backend App                 │  │
│  │  Port: 3001                  │  │
│  └──────────────────────────────┘  │
│              │                      │
│              │ Internal Network     │
│              │ 172.31.0.x          │
└──────────────┼──────────────────────┘
               │
               ├─→ 172.31.0.1:5002 (PGS)
               ├─→ 172.31.0.1:5004 (SMS/WhatsApp)
               └─→ External MongoDB
```

## Alternative: Check WhatsApp API Port

If your WhatsApp API is running on a different port, find it:

```bash
# Check what's running on the server
netstat -tulpn | grep LISTEN

# Or check Docker containers
docker ps
```

Then update the `WHATSAPP_API_URL` with the correct port.

## Troubleshooting

### If still not working after fix:

1. **Verify WhatsApp API is running**:
   ```bash
   curl http://172.31.0.1:5004/send-message
   ```

2. **Check Docker network**:
   ```bash
   docker network ls
   docker network inspect bridge
   ```

3. **Test from inside container**:
   ```bash
   docker exec -it quiz-champ-backend sh
   wget -O- http://172.31.0.1:5004/send-message
   ```

4. **Check firewall rules**:
   ```bash
   iptables -L -n
   ```

## Summary

The fix is simple: change the WhatsApp API URL from the external domain to the internal Docker network IP, matching the pattern used for other services (SMS and PGS).
