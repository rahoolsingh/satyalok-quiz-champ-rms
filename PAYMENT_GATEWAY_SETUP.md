# Payment Gateway Setup Guide

## Issue
The Quiz Champ backend is unable to connect to the Payment Gateway Service (PGS). Error:
```
PGS initiation failed: PGSError: PGS order initiation failed (undefined): connect ECONNREFUSED 127.0.1.1:443
```

## Solution

### 1. Configure the Payment Gateway Service

First, ensure the payment gateway service has the correct environment variables set in `satyalok-payment-gateway-backend/.env`:

```bash
# Add or update these variables:
QCB_API_KEY=your-shared-secret-key-here
QCB_CALLBACK_URL=http://localhost:5006/api/payment/callback
QUIZCHAMP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

**Important:** 
- The `QCB_API_KEY` should be a strong, random string that both services share
- `QCB_CALLBACK_URL` should point to the Quiz Champ Backend callback endpoint (port 5006 by default)
- `QUIZCHAMP_URL` should point to the Quiz Champ Frontend (port 3000 by default)
- If running in Docker, use service names: `QCB_CALLBACK_URL=http://quiz-champ-backend:3001/api/payment/callback`

### 2. Configure Quiz Champ Backend

Update `quiz-champ/backend/.env` with the PGS connection details:

```bash
# Payment Gateway Service (Satyalok PGS)
PAYMENT_PROVIDER=phonepe
PGS_BASE_URL=http://localhost:5002
PGS_API_KEY=your-shared-secret-key-here  # Must match QCB_API_KEY in PGS
SESSION_JWT_SECRET=your-session-jwt-secret-here
```

**Note:** 
- `PGS_BASE_URL` should point to where the payment gateway is running (port 5002 by default)
- `PGS_API_KEY` must match the `QCB_API_KEY` in the payment gateway's .env
- If running in Docker, use the service name instead: `PGS_BASE_URL=http://payment-gateway:5002`

### 3. Start Both Services

#### Option A: Using Docker Compose (Recommended)

If you want to run both services together, create a combined docker-compose.yml:

```yaml
version: '3.9'

services:
  payment-gateway:
    build:
      context: ./satyalok-payment-gateway-backend
      dockerfile: Dockerfile
    container_name: payment-gateway
    restart: unless-stopped
    ports:
      - "5002:5002"
    env_file:
      - ./satyalok-payment-gateway-backend/.env
    networks:
      - quiz-champ-network

  quiz-champ-backend:
    build:
      context: ./quiz-champ/backend
      dockerfile: Dockerfile
    container_name: quiz-champ-backend
    restart: unless-stopped
    ports:
      - "5006:3001"
    env_file:
      - ./quiz-champ/backend/.env
    environment:
      PGS_BASE_URL: http://payment-gateway:5002
    depends_on:
      - payment-gateway
    networks:
      - quiz-champ-network

networks:
  quiz-champ-network:
    driver: bridge
```

Then run:
```bash
docker-compose up -d
```

#### Option B: Running Locally

1. Start the payment gateway:
```bash
cd satyalok-payment-gateway-backend
npm install
npm start
```

2. Start the quiz-champ backend:
```bash
cd quiz-champ/backend
npm install
npm run dev
```

### 4. Verify the Connection

Test the connection by making a test API call:

```bash
curl -X POST http://localhost:5002/quizChampOrderS2S \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-shared-secret-key-here" \
  -d '{
    "name": "Test User",
    "mobileNumber": "9876543210",
    "group": "JUNIOR",
    "amount": 100,
    "merchantTransactionId": "TEST_TXN_001"
  }'
```

Expected response:
```json
{
  "success": true,
  "redirectUrl": "http://localhost:3000/payment-redirects/TEST_TXN_001",
  "merchantTransactionId": "TEST_TXN_001"
}
```

### 5. Common Issues

#### Connection Refused
- Ensure the payment gateway is running on port 5002
- Check firewall settings
- Verify the `PGS_BASE_URL` is correct

#### Invalid API Key
- Ensure `PGS_API_KEY` in quiz-champ backend matches `QCB_API_KEY` in payment gateway
- Check for extra spaces or quotes in the .env files

#### Docker Network Issues
- Ensure both services are on the same Docker network
- Use service names (not localhost) when services communicate within Docker

### 6. Security Notes

- **Never commit the actual API keys to version control**
- Use strong, random strings for `QCB_API_KEY` / `PGS_API_KEY`
- In production, use HTTPS for `PGS_BASE_URL`
- Ensure the callback URL is publicly accessible in production

## Recent Fixes

### Group Enum Validation Error (Fixed)
**Issue:** `SENIOR` is not a valid enum value for path `group`

**Solution:** Updated the QuizChamp model in the payment gateway to accept both old format (A, B) and new format (JUNIOR, SENIOR):

```javascript
group: {
    type: String,
    enum: ["JUNIOR", "SENIOR", "A", "B"],
    required: true,
}
```

This maintains backward compatibility with existing records while supporting the new registration flow.
