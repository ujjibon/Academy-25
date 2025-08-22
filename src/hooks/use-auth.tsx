'use client';
import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { auth, getUserProfile, UserProfile, updateDailyStreak, checkFirebaseBasicConnection, isFirebaseInitialized, shouldAttemptFirestoreOperation } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  connectionError: string | null;
  refreshProfile: () => Promise<void>;
  retryConnection: () => Promise<void>;
  isFirebaseMode: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userProfile: null, 
  loading: true,
  connectionError: null,
  refreshProfile: async () => {},
  retryConnection: async () => {},
  isFirebaseMode: false
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isFirebaseMode, setIsFirebaseMode] = useState(false);



  const fetchUserProfile = async (uid: string) => {
    try {
      setConnectionError(null);
      
      // Add a timeout wrapper to prevent hanging
      const profilePromise = getUserProfile(uid);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });
      
      const profile = await Promise.race([profilePromise, timeoutPromise]) as UserProfile | null;
      setUserProfile(profile);
      
      // Check if we're in Firebase mode
      if (profile && profile.uid !== 'sample-user') {
        setIsFirebaseMode(true);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      // For any error, set connection error and clear profile
      setConnectionError('Failed to load user profile. Please check your connection.');
      console.log('❌ Failed to load user profile:', error.message);
      setUserProfile(null);
      setIsFirebaseMode(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.uid) {
      await fetchUserProfile(user.uid);
    }
  };

  const retryConnection = async () => {
    try {
      setConnectionError(null);
      setLoading(true);
      const isConnected = await checkFirebaseBasicConnection();
      if (isConnected && user?.uid) {
        await fetchUserProfile(user.uid);
      }
    } catch (error) {
      setConnectionError('Connection failed. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Check if we should attempt Firestore operations
          if (!shouldAttemptFirestoreOperation()) {
            setConnectionError('Firebase is offline or not available. Please check your connection.');
            console.log('⚠️ Firebase unavailable - user needs to be online for authentication');
            setLoading(false);
            return;
          }

          // Update daily streak on login (handles offline gracefully)
          await updateDailyStreak(firebaseUser.uid);
          
          await fetchUserProfile(firebaseUser.uid);
        } catch (error: any) {
          console.error('Error during authentication:', error);
          if (error.message.includes('Database is currently unavailable') || 
              error.message.includes('client is offline') ||
              error.message.includes('Failed to get document')) {
            setConnectionError('Unable to connect to database. Please check your connection and try again.');
          } else if (error.message.includes('Firebase not configured')) {
            setConnectionError('Firebase is not properly configured. Please contact support.');
          } else {
            setConnectionError('Authentication failed. Please try again.');
          }
          setUserProfile(null);
          setIsFirebaseMode(false);
        }
      } else {
        setUserProfile(null);
        setConnectionError(null);
        setIsFirebaseMode(false);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Clear profile when no user is logged in
  useEffect(() => {
    if (!user && !loading) {
      setUserProfile(null);
      setIsFirebaseMode(false);
    }
  }, [user, loading]);

  // Listen for network status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network is back online');
      setConnectionError(null);
      // Try to reconnect to Firebase if user is authenticated
      if (user?.uid) {
        retryConnection();
      }
    };

    const handleOffline = () => {
      console.log('🌐 Network is offline');
      setConnectionError('You are currently offline. Please reconnect to access your data.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.uid]);

  const value = { 
    user, 
    userProfile, 
    loading, 
    connectionError,
    refreshProfile,
    retryConnection,
    isFirebaseMode
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
