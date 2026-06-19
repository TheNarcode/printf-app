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
        const storedUser = await getStoredUser();
        if (storedUser) {
          // Try silent sign-in to get a fresh token instead of using stale stored one
          const {GoogleSignin} = require('@react-native-google-signin/google-signin');
          GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            offlineAccess: true,
          });
          try {
            const response = await GoogleSignin.signInSilently();
            const freshToken = response?.data?.idToken;
            if (freshToken) {
              setUser(storedUser);
              setIdToken(freshToken);
              await setStoredIdToken(freshToken);
            } else {
              // Silent sign-in returned no token — fall back to stored token
              const storedToken = await getStoredIdToken();
              if (storedToken) {
                setUser(storedUser);
                setIdToken(storedToken);
              }
            }
          } catch (silentErr) {
            // Silent sign-in failed — try stored token as last resort
            console.warn('Silent sign-in on restore failed:', silentErr);
            const storedToken = await getStoredIdToken();
            if (storedToken) {
              setUser(storedUser);
              setIdToken(storedToken);
            }
          }
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

  // ── Get Valid Token (Refreshes silently if expired) ─────────────
  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    const {GoogleSignin} = require('@react-native-google-signin/google-signin');

    // Step 1: Try getting current tokens (fast path — works if session is alive)
    try {
      const tokens = await GoogleSignin.getTokens();
      if (tokens.idToken) {
        if (tokens.idToken !== idToken) {
          setIdToken(tokens.idToken);
          await setStoredIdToken(tokens.idToken);
        }
        return tokens.idToken;
      }
    } catch (e) {
      console.warn('getTokens failed, trying silent sign-in:', e);
    }

    // Step 2: Silent re-auth — re-establishes the session without any UI prompt
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });
      const response = await GoogleSignin.signInSilently();
      const newToken = response?.data?.idToken;
      if (newToken) {
        setIdToken(newToken);
        await setStoredIdToken(newToken);
        return newToken;
      }
    } catch (e) {
      console.warn('Silent sign-in failed:', e);
    }

    // Step 3: All refresh attempts failed — sign out cleanly
    console.warn('All token refresh attempts failed, signing out');
    await signOut();
    return null;
  }, [user, idToken, signOut]);

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
