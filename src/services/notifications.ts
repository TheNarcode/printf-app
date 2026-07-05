import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';

import { API_BASE_URL } from './api';

// ── Request notification permission (Android 13+) ───────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  // Android 13+ (API 33) requires POST_NOTIFICATIONS permission
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  // For older Android or iOS, use Firebase's own permission request
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

// ── Get FCM token and register it with the backend ──────────────────
export async function registerFCMToken(
  getToken: () => Promise<string | null>,
): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.warn('Notification permission not granted');
      return;
    }

    const fcmToken = await messaging().getToken();
    if (!fcmToken) {
      console.warn('Failed to get FCM token');
      return;
    }

    const authToken = await getToken();
    if (!authToken) {
      console.warn('No auth token available for FCM registration');
      return;
    }

    // Send the FCM token to our backend
    await fetch(`${API_BASE_URL}/notification/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xxx-auth-token': authToken,
      },
      body: JSON.stringify({ token: fcmToken }),
    });
  } catch (err) {
    console.error('FCM registration failed:', err);
  }
}

// ── Listen for token refreshes and re-register ─────────────────────
export function setupTokenRefreshListener(
  getToken: () => Promise<string | null>,
): () => void {
  return messaging().onTokenRefresh(async newFcmToken => {
    try {
      const authToken = await getToken();
      if (!authToken) return;

      await fetch(`${API_BASE_URL}/notification/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xxx-auth-token': authToken,
        },
        body: JSON.stringify({ token: newFcmToken }),
      });
    } catch (err) {
      console.error('FCM token refresh registration failed:', err);
    }
  });
}

// ── Background message handler (must be registered in index.js) ─────
// This runs when the app is in the background or killed.
// The OS automatically shows the notification from the `notification` payload.
// We just need to return a promise so Firebase knows we handled it.
export function backgroundMessageHandler(remoteMessage: any): Promise<void> {
  return Promise.resolve();
}
