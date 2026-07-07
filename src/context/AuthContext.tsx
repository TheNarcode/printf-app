import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { UserProfile } from '../types';
import { clearAllStorage } from '../services/storage';
import { GOOGLE_CLIENT_ID } from '@env';
import { CustomAlertAPI } from '../components/CustomAlert';



interface AuthContextValue {
  user: UserProfile | null;
  idToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  idToken: null,
  isAuthenticated: false,
  isLoading: true,
  isAuthenticating: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getValidToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Initialize GoogleSignin only once
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          photo: firebaseUser.photoURL || null,
        };
        setUser(profile);
        
        try {
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
        } catch (e) {
          console.warn('Failed to get initial token:', e);
        }
      } else {
        setUser(null);
        setIdToken(null);
      }
      setIsLoading(false);
    });
    
    return subscriber; // unsubscribe on unmount
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In returned no ID token');
      }

      // Yield to the JS event loop and Native UI thread to let the CustomSpinner 
      // animation resume smoothly after the Google popup modal closes, before 
      // the heavy Firebase auth blocks the bridge.
      await new Promise(resolve => setTimeout(() => resolve(true), 150));

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      await auth().signInWithCredential(googleCredential);
      
    } catch (error: any) {
      console.error('[Auth] Sign in error:', error);
      
      let message = 'An error occurred during Google Sign-In. Please try again.';
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.message?.includes('CANCELLED')) {
        message = 'Sign in was cancelled.';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        message = 'Sign in is already in progress.';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        message = 'Play Services not available or outdated.';
      }
      
      CustomAlertAPI.alert('Login Failed', message);
      // Don't throw — let the UI stay on login screen
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      // Sign out from Google (revokes permissions locally)
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in via Google
      }
      // Sign out from Firebase
      await auth().signOut();
      await clearAllStorage();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get Valid Token (Refreshes silently if expired)
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const currentUser = auth().currentUser;
    if (!currentUser) return null;
    
    try {
      // forceRefresh is false by default, it will only refresh if expired
      const token = await currentUser.getIdToken();
      if (token !== idToken) {
        setIdToken(token);
      }
      return token;
    } catch (error) {
      console.warn('Failed to get valid token:', error);
      return idToken; // Fallback to current token if offline
    }
  }, [idToken]);

  // Keep a ref to getValidToken so the FCM effect never needs to re-run
  // just because the token rotated — it always calls the latest version.
  const getValidTokenRef = useRef(getValidToken);
  useEffect(() => {
    getValidTokenRef.current = getValidToken;
  });

  // Register FCM token only when a user session starts (user.id changes)
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) return;

    const { registerFCMToken, setupTokenRefreshListener } =
      require('../services/notifications') as typeof import('../services/notifications');

    const stableGetter = () => getValidTokenRef.current();
    registerFCMToken(stableGetter);
    const unsubscribe = setupTokenRefreshListener(stableGetter);
    return unsubscribe;
  }, [userId]); // only fires on sign-in / sign-out

  const value = useMemo(
    () => ({
      user,
      idToken,
      isAuthenticated: user !== null,
      isLoading,
      isAuthenticating,
      signInWithGoogle,
      signOut,
      getValidToken,
    }),
    [user, idToken, isLoading, isAuthenticating, signInWithGoogle, signOut, getValidToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
