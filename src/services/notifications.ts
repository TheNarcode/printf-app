import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { API_BASE_URL } from './api';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

async function sendTokenToBackend(
  fcmToken: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  try {
    const authToken = await getToken();
    if (!authToken) return;

    await fetch(`${API_BASE_URL}/notification/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xxx-auth-token': authToken,
      },
      body: JSON.stringify({ token: fcmToken }),
    });
  } catch { }
}

export async function registerFCMToken(
  getToken: () => Promise<string | null>,
): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const fcmToken = await messaging().getToken();
    if (!fcmToken) return;

    await sendTokenToBackend(fcmToken, getToken);
  } catch { }
}

export function setupTokenRefreshListener(
  getToken: () => Promise<string | null>,
): () => void {
  return messaging().onTokenRefresh(newFcmToken => {
    sendTokenToBackend(newFcmToken, getToken);
  });
}

export function backgroundMessageHandler(_remoteMessage: any): Promise<void> {
  return Promise.resolve();
}