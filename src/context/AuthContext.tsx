import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {UserProfile} from '../types';
import {
  getStoredUser,
  setStoredUser,
  getStoredIdToken,
  setStoredIdToken,
  clearAllStorage,
} from '../services/storage';

const GOOGLE_WEB_CLIENT_ID = '5347000708-huid8jinh9am79lkn3fvuf8ddisdconv.apps.googleusercontent.com';

interface AuthContextValue {
  user: UserProfile | null;
  idToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  idToken: null,
  isAuthenticated: false,
  isLoading: true, // Start true — we're checking storage
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getValidToken: async () => null,
});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session from storage on mount ───────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          getStoredUser(),
          getStoredIdToken(),
        ]);
        if (storedUser && storedToken) {
          setUser(storedUser);
          setIdToken(storedToken);
        }
      } catch (e) {
        console.warn('Failed to restore auth session:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Sign in with Google ─────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const {GoogleSignin} = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const signInData = response?.data;

      if (signInData?.user) {
        const profile: UserProfile = {
          id: signInData.user.id,
          name: signInData.user.name || 'User',
          email: signInData.user.email,
          photo: signInData.user.photo || null,
        };

        const token = signInData.idToken || null;

        setUser(profile);
        setIdToken(token);

        // Persist
        await Promise.all([
          setStoredUser(profile),
          setStoredIdToken(token),
        ]);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      // Don't throw — let the UI stay on login screen
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Get Valid Token (Refreshes if expired) ──────────────────────
  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const {GoogleSignin} = require('@react-native-google-signin/google-signin');
      const tokens = await GoogleSignin.getTokens();
      const newToken = tokens.idToken;
      
      // Update state and storage if token has changed
      if (newToken && newToken !== idToken) {
        setIdToken(newToken);
        await setStoredIdToken(newToken);
      }
      return newToken || idToken;
    } catch (e) {
      console.warn('Failed to refresh token:', e);
      return idToken; // Fallback to current token, let the API reject it if invalid
    }
  }, [user, idToken]);

  // ── Sign out ────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      try {
        const {GoogleSignin} = require('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch (_e) {
        // Google SDK may not be configured
      }
      setUser(null);
      setIdToken(null);
      await clearAllStorage();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      idToken,
      isAuthenticated: user !== null,
      isLoading,
      signInWithGoogle,
      signOut,
      getValidToken,
    }),
    [user, idToken, isLoading, signInWithGoogle, signOut, getValidToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
