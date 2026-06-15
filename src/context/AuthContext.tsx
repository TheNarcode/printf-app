import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import type {UserProfile} from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try real Google Sign-In first
      try {
        const {GoogleSignin} = require('@react-native-google-signin/google-signin');
        GoogleSignin.configure({
          webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with your actual web client ID
          offlineAccess: true,
        });
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        const signInData = response?.data;
        if (signInData?.user) {
          setUser({
            id: signInData.user.id,
            name: signInData.user.name || 'User',
            email: signInData.user.email,
            photo: signInData.user.photo || null,
          });
          return;
        }
      } catch (_e) {
        // Google Sign-In not configured, fall through to mock
        console.log('Google Sign-In not configured, using mock auth');
      }

      // Mock sign-in fallback
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      setUser({
        id: 'mock-user-001',
        name: 'Parth',
        email: 'parth@example.com',
        photo: null,
      });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      try {
        const {GoogleSignin} = require('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch (_e) {
        // Mock sign-out
      }
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      signInWithGoogle,
      signOut,
    }),
    [user, isLoading, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
