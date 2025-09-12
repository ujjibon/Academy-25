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
