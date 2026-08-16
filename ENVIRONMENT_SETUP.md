# Environment Setup Guide

This guide explains how to set up your environment variables for the Academy 2025 platform.

## 🔑 Required Environment Variables

Create a `.env.local` file in your `Academy-25` directory with the following variables:

```env
# Hugging Face Configuration
HUGGINGFACE_API_TOKEN=hf_your_key_here

# DeepSeek AI Service Configuration
NEXT_PUBLIC_DEEPSEEK_SERVICE_URL=http://localhost:5000

# Firebase Configuration (replace with your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Other environment variables
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Gmail SMTP (bulk admin notifications — use an App Password, not your login password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-account@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM=Peer Academy <your-account@gmail.com>
# SMTP_REPLY_TO=support@yourdomain.com
# BULK_MAIL_MAX_RECIPIENTS=200
# BULK_MAIL_DELAY_MS=300
```

## 🚀 Quick Setup

### 1. Create Environment File

```bash
# Navigate to your project directory
cd Academy-25

# Create the environment file
touch .env.local  # Linux/Mac
# or
type nul > .env.local  # Windows
```

### 2. Add Your Variables

Copy the template above and replace the placeholder values with your actual configuration.

### 3. Restart Your Development Server

```bash
npm run dev
```

## 🔧 Configuration Details

### Hugging Face API Token

To get your Hugging Face token:
- **Visit**: [Hugging Face Settings](https://huggingface.co/settings/tokens)
- **Create**: A new access token with 'Read' permissions
- **Purpose**: Access to Hugging Face models for enhanced AI features
- **Services**: Sentiment analysis, text classification, Q&A, content generation

### DeepSeek Service

- **URL**: `http://localhost:5000` (default)
- **Purpose**: High-quality AI responses using DeepSeek-R1 model
- **Fallback**: System works without this service

### Admin (default dev account)

After Firebase is configured, create the built-in admin user once:

```bash
npm run seed:admin
```

Then add to `.env.local` (the seed uses `admin@peeracademy.com` by default; it is auto-included in the server allowlist via `getAdminLoginEmail()` when `ADMIN_EMAILS` is empty, but you can set it explicitly):

```env
ADMIN_EMAILS=admin@peeracademy.com
```

Sign in at **`/admin/login`**:

| Field | Value |
|--------|--------|
| **Username** | `admin` (maps to `admin@peeracademy.com`) |
| **Password** | `Peer@2026` |

Override seed values (optional):

```env
SEED_ADMIN_EMAIL=you@example.com
SEED_ADMIN_PASSWORD=YourSecurePassword
SEED_ADMIN_DISPLAY_NAME=Admin
```

**Production:** change the password in [Firebase Console → Authentication](https://console.firebase.google.com/) or delete the default account and use a strong password.

### Gmail SMTP (bulk notifications)

Admin bulk email uses Nodemailer against Gmail SMTP. You need **2-Step Verification** on the Google account and an **App Password** ([Google Account → Security → App passwords](https://myaccount.google.com/apppasswords)).

| Variable | Purpose |
|----------|---------|
| `SMTP_USER` | Gmail address |
| `SMTP_PASS` | 16-character App Password (no spaces) |
| `SMTP_FROM` | Optional display name, e.g. `Peer Academy <you@gmail.com>` |
| `SMTP_PORT` | `587` (STARTTLS) or `465` (SSL) |
| `BULK_MAIL_MAX_RECIPIENTS` | Cap per send (default `200`) |
| `BULK_MAIL_DELAY_MS` | Pause between sends in ms (default `300`) |

Send mail from **Admin portal → Notifications** (`/admin-portal/notifications`). Only admins (same `ADMIN_EMAILS` allowlist as other admin APIs) can call the API.

### PayPal subscriptions (Account & billing)

Learners manage plans at **`/account`** (Profile tab + Subscription tab). Paid tiers use [PayPal Subscriptions](https://developer.paypal.com/docs/subscriptions/).

1. Create a [PayPal Developer](https://developer.paypal.com/) app (Sandbox for testing).
2. In PayPal Dashboard → **Subscriptions** → create a **Product**, then **Billing plans** for Pro ($9.99/mo) and Premium ($19.99/mo). Copy each plan ID.
3. Add to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Sandbox (default) or live
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret

# Billing plan IDs from PayPal Dashboard
PAYPAL_PLAN_ID_PRO=P-xxxxxxxx
PAYPAL_PLAN_ID_PREMIUM=P-xxxxxxxx
```

| Variable | Purpose |
|----------|---------|
| `PAYPAL_MODE` | `sandbox` (default) or `live` |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | REST API credentials |
| `PAYPAL_PLAN_ID_PRO` | PayPal billing plan ID for Pro |
| `PAYPAL_PLAN_ID_PREMIUM` | PayPal billing plan ID for Premium |
| `NEXT_PUBLIC_APP_URL` | Return URL after PayPal approval (e.g. `http://localhost:3000`) |

### Admin payments & coupons

Admins manage billing at **`/admin-portal/billing`**:

- Generate coupon codes (percent off, fixed amount, or plan grant)
- View payment ledger (PayPal, coupon grants, manual records)
- Grant subscriptions and record offline payments
- View active paid subscribers

Learners redeem **100% off** or **plan-grant** codes on **Account → Subscription**. Deploy updated `firestore.rules` so `coupons`, `payments`, and `couponRedemptions` collections work.

Profile photos upload to `public/avatars/` via `/api/account/avatar` (max 5 MB).

### Firebase Configuration

Replace the placeholder values with your actual Firebase project configuration:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Copy the configuration values

## 🛠️ Development vs Production

### Development
- Use `.env.local` for local development
- All variables are loaded automatically
- No need to restart after changes

### Production
- Set environment variables in your hosting platform
- Use secure methods for sensitive tokens
- Ensure all required variables are set

## 🔒 Security Best Practices

### Token Security
- Never commit `.env.local` to version control
- Use different tokens for development and production
- Rotate tokens regularly
- Use environment-specific configurations

### API Keys
- Store sensitive keys securely
- Use environment variables, not hardcoded values
- Implement proper access controls
- Monitor API usage

## 🚨 Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure file is named `.env.local` (not `.env`)
   - Check file location (should be in project root)
   - Restart development server

2. **API calls failing**
   - Verify token is correct and active
   - Check network connectivity
   - Review API rate limits

3. **Firebase connection issues**
   - Verify all Firebase config values
   - Check Firebase project status
   - Ensure proper permissions

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// In your code, add:
console.log('Environment check:', {
  hasHuggingFaceToken: !!process.env.HUGGINGFACE_API_TOKEN,
  hasFirebaseConfig: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  deepSeekUrl: process.env.NEXT_PUBLIC_DEEPSEEK_SERVICE_URL
});
```

## 📊 Environment Validation

Create a simple validation script to check your environment:

```typescript
// src/utils/env-validation.ts
export function validateEnvironment() {
  const required = [
    'HUGGINGFACE_API_TOKEN',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
}
```

## 🔄 Environment Updates

When updating environment variables:

1. **Update `.env.local`** with new values
2. **Restart development server** (`npm run dev`)
3. **Test functionality** to ensure everything works
4. **Update production** environment if needed

## 📝 Environment Checklist

- [ ] `.env.local` file created in project root
- [ ] Hugging Face token added
- [ ] Firebase configuration added
- [ ] DeepSeek service URL configured
- [ ] Development server restarted
- [ ] All features tested and working
- [ ] No sensitive data committed to version control

## 🆘 Support

If you encounter issues:

1. Check this guide for common solutions
2. Verify all environment variables are set correctly
3. Review the console for error messages
4. Check network connectivity and API status
5. Contact support if problems persist

---

**Your environment is now configured for enhanced AI-powered learning! 🚀**
