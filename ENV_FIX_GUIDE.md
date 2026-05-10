# .env File Fix Guide

## Error
```
failed to read /root/satyalok-quiz-champ-rms/backend/.env: line 42: unterminated quoted value
```

## Cause
The `.env` file on the server has a value with an opening quote but no closing quote, likely on line 42.

## Solution

### Option 1: Fix the Server .env File Directly

SSH into the server and edit the file:

```bash
cd /root/satyalok-quiz-champ-rms/backend
nano .env
```

Look for line 42 (or nearby lines) and find any value that starts with a quote but doesn't end with one. It likely looks like:

```bash
SOME_KEY="value without closing quote
```

**Fix it by either:**
1. Removing the quotes entirely:
   ```bash
   AWS_SECRET_ACCESS_KEY=yQI47w08KM53p438zhR3Wzk6DW5Q5Qplk
   ```

2. Or properly closing the quote:
   ```bash
   AWS_SECRET_ACCESS_KEY="yQI47w08KM53p438zhR3Wzk6DW5Q5Qplk"
   ```

### Option 2: Replace the Entire .env File

Copy the working `.env` from your local to the server:

```bash
# From your local machine
scp quiz-champ/backend/.env root@your-server:/root/satyalok-quiz-champ-rms/backend/.env
```

### Option 3: Recreate from .env.example

On the server:

```bash
cd /root/satyalok-quiz-champ-rms/backend
cp .env.example .env
nano .env
```

Then fill in the values:

```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017/quiz_champ
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=24h
SESSION_JWT_SECRET=your-session-jwt-secret-here
FRONTEND_URL=http://localhost:3000

# 2Factor SMS API
SMS_PROVIDER=2factor
TWOFACTOR_API_KEY=your-2factor-api-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=Quiz Champ 2026 <noreply@quizchamp.com>

# AWS S3
AWS_REGION=us-east-1
AWS_STORAGE_ENDPOINT=https://x7.veerrajpoot.com
AWS_ACCESS_KEY_ID=khiladi_veer
AWS_SECRET_ACCESS_KEY=yQI47w08KM53p438zhR3Wzk6DW5Q5Qplk
AWS_S3_BUCKET=quizchamp-files

# Payment Gateway Service (Satyalok PGS)
PAYMENT_PROVIDER=phonepe
PGS_BASE_URL=http://localhost:5002
PGS_API_KEY=your-shared-api-key-here

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@quizchamp.com
```

## Important Notes

### Values with Special Characters

If a value contains special characters (like `+`, `/`, `=`), you have two options:

**Option A: No Quotes (Recommended)**
```bash
AWS_SECRET_ACCESS_KEY=yQI47w08KM53p438zhR3Wzk6DW5Q5Qplk
```

**Option B: Properly Quoted**
```bash
AWS_SECRET_ACCESS_KEY="yQI47w08KM53p438zhR3Wzk6DW5Q5Qplk"
```

### Common Mistakes to Avoid

❌ **Wrong:**
```bash
AWS_SECRET_ACCESS_KEY="value
AWS_SECRET_ACCESS_KEY='value
AWS_SECRET_ACCESS_KEY=value"
```

✅ **Correct:**
```bash
AWS_SECRET_ACCESS_KEY=value
AWS_SECRET_ACCESS_KEY="value"
AWS_SECRET_ACCESS_KEY='value'
```

## Verification

After fixing, verify the file:

```bash
# Check for syntax errors
cat .env | grep -n '"'

# Try to load it
docker compose config
```

If no errors, rebuild:

```bash
docker compose up --build
```

## Quick Fix Command

Run this on the server to remove all quotes from values (if they're causing issues):

```bash
cd /root/satyalok-quiz-champ-rms/backend
sed -i 's/="\(.*\)"$/=\1/' .env
```

This removes quotes from all values. Then rebuild:

```bash
docker compose up --build
```

## Prevention

For future updates, always ensure:
1. No unmatched quotes
2. No line breaks within values
3. No special characters that need escaping
4. Test locally before deploying

## Still Having Issues?

If the problem persists:

1. **Check line endings:**
   ```bash
   dos2unix .env
   ```

2. **Check for hidden characters:**
   ```bash
   cat -A .env | head -50
   ```

3. **Start fresh:**
   ```bash
   rm .env
   cp .env.example .env
   # Edit with your values
   ```

4. **Check Docker Compose version:**
   ```bash
   docker compose version
   ```

## Contact

If you need help, the error is on line 42 of the server's `.env` file. Check that line and the lines around it for any unclosed quotes.
