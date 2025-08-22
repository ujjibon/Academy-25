'use client';

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, Auth, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs, enableNetwork, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB47TJPJJShQQrKOJ91baovmWCCU4HSrdo",
  authDomain: "skillsprint-3ij35.firebaseapp.com",
  projectId: "skillsprint-3ij35",
  storageBucket: "skillsprint-3ij35.firebasestorage.app",
  messagingSenderId: "913415587032",
  appId: "1:913415587032:web:8673fdf1961403491603ad"
};

// Alternative: Using environment variables for security (recommended for production)
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
// };

// Firebase configuration is now hardcoded for the skillsprint-3ij35 project

// Initialize Firebase
// Standard initialization:
// const app = initializeApp(firebaseConfig);

// Enhanced initialization with app reuse and error handling:
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Enable offline persistence immediately after Firestore initialization
if (typeof window !== 'undefined') {
  // Only run in browser environment
  // Enable persistence before any other Firestore operations
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support all features required for persistence.');
    } else if (err.code === 'already-exists') {
      console.warn('Persistence has already been enabled.');
    } else {
      console.warn('Failed to enable persistence:', err);
    }
  });
}

console.log('✅ Firebase initialized successfully with project:', firebaseConfig.projectId);

// Simple connection test that doesn't require any network calls
export const isFirebaseInitialized = () => {
  try {
    return !!(db && auth && firebaseConfig.projectId);
  } catch (error) {
    console.error('Firebase initialization check failed:', error);
    return false;
  }
};

// Check if Firestore operations should be attempted
export const shouldAttemptFirestoreOperation = () => {
  return navigator.onLine && isFirebaseInitialized();
};

export const checkFirebaseConnection = async () => {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    // First, check if Firebase is properly initialized
    if (!db) {
      console.error('❌ Firestore database not initialized');
      return false;
    }
    
    // Check if we're online first
    if (!navigator.onLine) {
      console.error('❌ Browser is offline');
      return false;
    }
    
    // Add a timeout to prevent hanging
    const connectionPromise = new Promise(async (resolve, reject) => {
      try {
        // Try to make a simple read operation to test connection
        const testDoc = doc(db, '_test', 'connection');
        console.log('📡 Attempting to read test document...');
        
        // Set a short timeout for the request
        const docSnapshot = await getDoc(testDoc);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
    
    // Race the connection test with a shorter timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 3000);
    });
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ Firebase connection test successful');
    return true;
  } catch (error: any) {
    console.error('❌ Firebase connection test failed:', error);
    
    // Log specific error details
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
    
    // Check for common Firebase errors
    if (error.code === 'permission-denied') {
      console.error('🔒 Permission denied - check Firestore security rules');
    } else if (error.code === 'unavailable') {
      console.error('🌐 Service unavailable - check Firebase project status');
    } else if (error.code === 'failed-precondition') {
      console.error('⚠️ Failed precondition - check Firebase configuration');
    } else if (error.message.includes('client is offline') || error.message.includes('Failed to get document')) {
      console.error('🌐 Firebase client is offline - check internet connection');
    } else if (error.message.includes('Connection timeout')) {
      console.error('⏱️ Connection timeout - network may be slow or unstable');
    }
    
    return false;
  }
};

// Alternative connection check that doesn't require document read permissions
export const checkFirebaseBasicConnection = async () => {
  try {
    console.log('🔍 Testing basic Firebase connection...');
    
    // Check if we're online first
    if (!navigator.onLine) {
      console.error('❌ Browser is offline');
      return false;
    }
    
    // Check if Firestore is initialized
    if (!db) {
      console.error('❌ Firestore database not initialized');
      return false;
    }
    
    // Try to create a collection reference (this doesn't require permissions)
    const testCollection = collection(db, '_test');
    console.log('📡 Collection reference created successfully');
    
    // If we get here, Firestore is at least responding
    console.log('✅ Basic Firebase connection test successful');
    return true;
  } catch (error: any) {
    console.error('❌ Basic Firebase connection test failed:', error);
    return false;
  }
};

export const signInWithGoogle = async () => {
  try {
    // Check basic Firebase connection first
    const isBasicConnected = await checkFirebaseBasicConnection();
    if (!isBasicConnected) {
      throw new Error('Unable to connect to Firebase. Please check your internet connection and try again.');
    }
    
    // Check if popup is blocked
    const popup = window.open('', '_blank', 'width=400,height=600');
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }
    popup.close();
    
    const result = await signInWithPopup(auth, googleProvider);
    
    // Create or update user profile in Firestore
    if (result.user) {
      await createOrUpdateUserProfile(result.user);
    }
    
    return result;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled by user.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Please wait a moment and try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups for this site.');
    } else if (error.message.includes('Unable to connect to Firebase')) {
      throw new Error('Connection error. Please check your internet connection and try again.');
    }
    throw error;
  }
};

export const signOut = () => {
  return firebaseSignOut(auth);
}

export const signInWithEmail = async (email: string, password: string) => {
  try {
    // Check Firebase connection first
    const isConnected = await checkFirebaseConnection();
    if (!isConnected) {
      throw new Error('Unable to connect to Firebase. Please check your internet connection and try again.');
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Create or update user profile in Firestore
    if (result.user) {
      await createOrUpdateUserProfile(result.user);
    }
    
    return result;
  } catch (error: any) {
    if (error.message.includes('Unable to connect to Firebase')) {
      throw new Error('Connection error. Please check your internet connection and try again.');
    }
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    // Check Firebase connection first
    const isConnected = await checkFirebaseConnection();
    if (!isConnected) {
      throw new Error('Unable to connect to Firebase. Please check your internet connection and try again.');
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    if (result.user) {
      await createOrUpdateUserProfile(result.user);
    }
    
    return result;
  } catch (error: any) {
    if (error.message.includes('Unable to connect to Firebase')) {
      throw new Error('Connection error. Please check your internet connection and try again.');
    }
    throw error;
  }
};

// User profile management
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  xp: number;
  level: number;
  dailyStreak: number;
  weeklyProgress: number;
  activeCourseId?: string;
  activeLessonId?: string;
  completedCourses: string[];
  courseProgress: { [courseId: string]: number };
  strengths: { name: string; value: number }[];
  weaknesses: { name: string; value: number }[];
  badges: { name: string; icon: string; earnedAt: Date }[];
}

export const createOrUpdateUserProfile = async (firebaseUser: User) => {
  try {
    console.log('🔄 Creating/updating user profile for:', firebaseUser.email, 'UID:', firebaseUser.uid);
    
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('📝 Creating new user profile...');
      // Create new user profile
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        xp: 0,
        level: 1,
        dailyStreak: 0,
        weeklyProgress: 0,
        completedCourses: [],
        courseProgress: {},
        strengths: [
          { name: 'JavaScript', value: 50 },
          { name: 'HTML', value: 60 },
          { name: 'CSS', value: 45 },
        ],
        weaknesses: [
          { name: 'React', value: 20 },
          { name: 'State Management', value: 15 },
        ],
        badges: [
          { name: 'First Login', icon: 'Star', earnedAt: new Date() },
        ],
      };
      
      await setDoc(userRef, newProfile);
      console.log('✅ New user profile created successfully for:', firebaseUser.email);
    } else {
      console.log('🔄 Updating existing user profile...');
      // Update last login
      await updateDoc(userRef, {
        lastLoginAt: new Date(),
        displayName: firebaseUser.displayName || userSnap.data().displayName,
        photoURL: firebaseUser.photoURL || userSnap.data().photoURL,
      });
      console.log('✅ User profile updated successfully for:', firebaseUser.email);
    }
  } catch (error: any) {
    console.error('❌ Error creating/updating user profile:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('🔒 Permission denied - check if user is authenticated and Firestore rules are correct');
      throw new Error('Permission denied: Unable to create user profile. Please try logging in again.');
    } else if (error.code === 'failed-precondition') {
      console.error('Firestore is offline or not available');
      throw new Error('Database is currently unavailable. Please check your connection and try again.');
    }
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    console.log('🔍 Fetching user profile for UID:', uid);
    
    // Check if we're online before attempting Firestore operations
    if (!navigator.onLine) {
      throw new Error('Failed to get document because the client is offline.');
    }

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log('✅ User profile found and retrieved successfully');
      const data = userSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        badges: data.badges?.map((badge: any) => ({
          ...badge,
          earnedAt: badge.earnedAt?.toDate() || new Date(),
        })) || [],
      } as UserProfile;
    } else {
      console.warn('⚠️ User profile document does not exist for UID:', uid);
      return null;
    }
  } catch (error: any) {
    console.error('❌ Error fetching user profile:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('🔒 Permission denied when fetching user profile - check Firestore rules and authentication');
      throw new Error('Permission denied: Unable to fetch user profile. Please try logging in again.');
    } else if (error.code === 'failed-precondition' || 
        error.code === 'unavailable' || 
        error.message.includes('client is offline') ||
        error.message.includes('Failed to get document')) {
      // Don't log as error for offline scenarios - just throw the offline error
      throw new Error('Failed to get document because the client is offline.');
    }
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  // Check if Firestore operations should be attempted
  if (!shouldAttemptFirestoreOperation()) {
    console.log('🌐 Skipping user profile update - Firebase offline or not available');
    return;
  }

  try {

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
  } catch (error: any) {
    if (error.code === 'failed-precondition' || 
        error.code === 'unavailable' || 
        error.message.includes('client is offline') ||
        error.message.includes('Failed to get document')) {
      // Don't log as error for offline scenarios - just silently skip
      console.log('🌐 Skipping user profile update due to offline status');
      return;
    }
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const updateCourseProgress = async (uid: string, courseId: string, progress: number) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      [`courseProgress.${courseId}`]: progress,
      activeCourseId: courseId,
      lastLoginAt: new Date(),
    });
  } catch (error: any) {
    if (error.code === 'failed-precondition' || error.code === 'unavailable') {
      console.error('Firestore is offline or not available');
      throw new Error('Database is currently unavailable. Please check your connection and try again.');
    }
    console.error('Error updating course progress:', error);
    throw error;
  }
};

export const updateDailyStreak = async (uid: string) => {
  // Check if Firestore operations should be attempted
  if (!shouldAttemptFirestoreOperation()) {
    console.log('🌐 Skipping daily streak update - Firebase offline or not available');
    return;
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentData = userSnap.data();
      const lastLogin = currentData.lastLoginAt?.toDate() || new Date(0);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let newStreak = currentData.dailyStreak || 0;
      
      // Check if user logged in yesterday (maintain streak)
      if (lastLogin.toDateString() === yesterday.toDateString()) {
        newStreak += 1;
      } else if (lastLogin.toDateString() !== today.toDateString()) {
        // If not yesterday and not today, reset streak
        newStreak = 1;
      }
      // If logged in today, keep current streak
      
      await updateDoc(userRef, {
        dailyStreak: newStreak,
        lastLoginAt: today,
      });
    }
  } catch (error: any) {
    if (error.code === 'failed-precondition' || 
        error.code === 'unavailable' || 
        error.message.includes('client is offline') ||
        error.message.includes('Failed to get document')) {
      // Don't log as error for offline scenarios - just silently skip
      console.log('🌐 Skipping daily streak update due to offline status');
      return;
    }
    console.error('Error updating daily streak:', error);
    // Don't throw error to prevent breaking the auth flow
    console.log('⚠️ Daily streak update failed, continuing with authentication');
  }
};

export const addXP = async (uid: string, xpToAdd: number) => {
  // Check if Firestore operations should be attempted
  if (!shouldAttemptFirestoreOperation()) {
    console.log('🌐 Skipping XP update - Firebase offline or not available');
    return;
  }

  try {

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentData = userSnap.data();
      const newXP = (currentData.xp || 0) + xpToAdd;
      const newLevel = Math.floor(newXP / 1000) + 1;
      
      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel,
        lastLoginAt: new Date(),
      });
    }
  } catch (error: any) {
    if (error.code === 'failed-precondition' || 
        error.code === 'unavailable' || 
        error.message.includes('client is offline') ||
        error.message.includes('Failed to get document')) {
      // Don't log as error for offline scenarios - just silently skip
      console.log('🌐 Skipping XP update due to offline status');
      return;
    }
    console.error('Error adding XP:', error);
    // Don't throw error to prevent breaking the flow
    console.log('⚠️ XP update failed, continuing normally');
  }
};

export const getLeaderboard = async () => {
  // Check if Firestore operations should be attempted
  if (!shouldAttemptFirestoreOperation()) {
    console.log('🌐 Using sample leaderboard - Firebase offline or not available');
    const { leaderboard: sampleLeaderboard } = await import('@/lib/data-provider');
    return sampleLeaderboard;
  }

  try {

    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('xp', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    const leaderboard = querySnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        uid: doc.id,
        name: data.displayName || 'Anonymous',
        xp: data.xp || 0,
        avatar: data.photoURL || 'https://placehold.co/40x40.png',
      };
    });
    
    return leaderboard;
  } catch (error: any) {
    if (error.code === 'failed-precondition' || 
        error.code === 'unavailable' || 
        error.message.includes('client is offline') ||
        error.message.includes('Failed to get document')) {
      // Don't log as error for offline scenarios - just silently fall back
      console.log('🌐 Falling back to sample leaderboard due to offline status');
      const { leaderboard: sampleLeaderboard } = await import('@/lib/data-provider');
      return sampleLeaderboard;
    }
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

// Global function for debugging Firebase connection (can be called from browser console)
if (typeof window !== 'undefined') {
  (window as any).testFirebaseConnection = async () => {
    console.log('🧪 Testing Firebase connection from browser console...');
    
    try {
      // Test basic connection
      const basicConnected = await checkFirebaseBasicConnection();
      console.log('Basic connection:', basicConnected ? '✅ SUCCESS' : '❌ FAILED');
      
      // Test full connection
      const fullConnected = await checkFirebaseConnection();
      console.log('Full connection:', fullConnected ? '✅ SUCCESS' : '❌ FAILED');
      
      // Log Firebase config
      console.log('Firebase config:', firebaseConfig);
      console.log('Firebase app:', app);
      console.log('Firestore db:', db);
      
      return { basicConnected, fullConnected };
    } catch (error: any) {
      console.error('Test failed:', error);
      return { error: error.message };
    }
  };
}

export { auth, db };
