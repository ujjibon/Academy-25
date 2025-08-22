# Firebase Setup Guide

This application now uses real Firebase data instead of sample data. Follow these steps to set up Firebase:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Enable Google Analytics if desired
4. Complete project setup

## 2. Enable Authentication

1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable "Email/Password" authentication
3. Enable "Google" authentication
4. Add your authorized domains

## 3. Enable Firestore Database

1. Go to "Firestore Database" in Firebase Console
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location for your database

## 4. Get Firebase Configuration

1. Click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web app icon (</>)
5. Register your app and copy the config

## 5. Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 6. Firestore Security Rules

Update your Firestore security rules to allow authenticated users to read/write their data:

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

## 7. Test the Application

1. Run `npm run dev`
2. Navigate to `/signup` or `/login`
3. Create an account or sign in
4. Your dashboard should now show real data!

## Features Now Available

- ✅ Real user authentication with Firebase
- ✅ User profiles stored in Firestore
- ✅ Course progress tracking
- ✅ XP and leveling system
- ✅ Real-time leaderboard
- ✅ Persistent user data across sessions
- ✅ Google Sign-in support

## Data Structure

The application creates the following collections in Firestore:

- `users/{userId}` - User profiles with progress, XP, badges, etc.
- `courses/{courseId}` - Course information (if you want to store courses in Firestore)

## Troubleshooting

- Make sure all environment variables are set correctly
- Check Firebase Console for any authentication errors
- Verify Firestore rules allow read/write access
- Check browser console for any JavaScript errors

## Next Steps

- Customize the user profile fields as needed
- Add more sophisticated progress tracking
- Implement course completion certificates
- Add social features like friend lists
- Create admin panels for course management
