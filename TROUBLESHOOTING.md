# Firebase Connection Troubleshooting Guide

If you're experiencing the "FirebaseError: Failed to get document because the client is offline" error, follow these steps to resolve it.

## 🚨 **Immediate Error: "Client is Offline"**

This error occurs when your application cannot connect to Firebase services. Here are the most common causes and solutions:

## 🔍 **Step 1: Check Your Environment Variables**

Make sure you have a `.env.local` file in your project root with ALL required variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
```

**⚠️ Common Mistakes:**
- Missing `NEXT_PUBLIC_` prefix
- Copying placeholder text instead of actual values
- Missing quotes around values
- Extra spaces or characters

## 🔍 **Step 2: Verify Firebase Project Setup**

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Check if your project exists and is active**
3. **Verify Firestore Database is created:**
   - Go to "Firestore Database" in the left sidebar
   - If you see "Create database", you need to create it first
   - Choose "Start in test mode" for development

## 🔍 **Step 3: Check Firestore Security Rules**

Your Firestore rules should allow authenticated users to access their data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow reading course data
    match /courses/{courseId} {
      allow read: if request.auth != null;
    }
  }
}
```

**To update rules:**
1. Go to Firestore Database → Rules
2. Replace the default rules with the above
3. Click "Publish"

## 🔍 **Step 4: Check Internet Connection**

1. **Test your internet connection** - try visiting other websites
2. **Check if you're behind a firewall** that blocks Firebase
3. **Try a different network** (mobile hotspot, different WiFi)
4. **Disable VPN** if you're using one

## 🔍 **Step 5: Verify Domain Authorization**

1. **Go to Firebase Console → Authentication → Settings**
2. **Check "Authorized domains"**
3. **Make sure your domain is listed:**
   - `localhost` (for development)
   - Your actual domain (for production)
4. **Add your domain if it's missing**

## 🔍 **Step 6: Check Browser Console**

Open your browser's Developer Tools (F12) and look for:

1. **Network tab** - Check if Firebase requests are failing
2. **Console tab** - Look for specific error messages
3. **Application tab** - Check if cookies/localStorage are working

## 🔍 **Step 7: Test Firebase Connection**

The app now includes a connection test. If you see connection errors:

1. **Click "Retry Connection"** button
2. **Check the troubleshooting tips** displayed
3. **Refresh the page** and try again

## 🛠️ **Advanced Troubleshooting**

### **Firebase Emulator Issues**
If you're using Firebase emulators:

```bash
# Make sure emulators are running
firebase emulators:start

# Check if you're connecting to emulator in your code
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### **CORS Issues**
If you see CORS errors:

1. **Check Firebase Console → Project Settings → General**
2. **Verify your app is registered correctly**
3. **Make sure you're using the right configuration**

### **Authentication Issues**
If authentication works but Firestore doesn't:

1. **Check if user is properly authenticated**
2. **Verify user UID exists**
3. **Check Firestore rules allow the user's UID**

## 📱 **Mobile/Tablet Issues**

- **Clear browser cache and cookies**
- **Try incognito/private browsing mode**
- **Check if mobile data is enabled**
- **Verify mobile browser supports required features**

## 🌐 **Production Deployment Issues**

If it works locally but not in production:

1. **Check environment variables in your hosting platform**
2. **Verify domain is authorized in Firebase**
3. **Check if hosting platform blocks Firebase**
4. **Verify SSL/HTTPS is working**

## 🔧 **Quick Fix Commands**

```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📞 **Still Having Issues?**

If none of the above solutions work:

1. **Check Firebase Status Page**: [status.firebase.google.com](https://status.firebase.google.com/)
2. **Review Firebase Console logs** for any error messages
3. **Check your Firebase project's usage and billing**
4. **Verify your Firebase project hasn't been disabled**

## 🎯 **Prevention Tips**

1. **Always test with a fresh `.env.local` file**
2. **Use Firebase Console to verify project status**
3. **Test authentication before implementing Firestore**
4. **Keep Firebase SDK versions updated**
5. **Monitor Firebase Console for any warnings**

## 📋 **Checklist**

- [ ] Environment variables are set correctly
- [ ] Firebase project exists and is active
- [ ] Firestore database is created
- [ ] Security rules are configured
- [ ] Domain is authorized
- [ ] Internet connection is working
- [ ] Browser console shows no errors
- [ ] Firebase services are online

---

**Remember**: Most Firebase connection issues are configuration-related, not code-related. Double-check your setup and the error should resolve! 🚀
