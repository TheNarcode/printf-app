import AsyncStorage from '@react-native-async-storage/async-storage';
import type {UserProfile, ThemeMode, Order} from '../types';

const KEYS = {
  AUTH_USER: 'printf_auth_user',
  AUTH_ID_TOKEN: 'printf_auth_id_token',
  THEME_MODE: 'printf_theme_mode',
  ORDERS: 'printf_orders',
} as const;

// ── Auth ────────────────────────────────────────────────────────────

export async function getStoredUser(): Promise<UserProfile | null> {
  try {
    const json = await AsyncStorage.getItem(KEYS.AUTH_USER);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: UserProfile | null): Promise<void> {
  try {
    if (user) {
      await AsyncStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(KEYS.AUTH_USER);
    }
  } catch {}
}

export async function getStoredIdToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.AUTH_ID_TOKEN);
  } catch {
    return null;
  }
}

export async function setStoredIdToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(KEYS.AUTH_ID_TOKEN, token);
    } else {
      await AsyncStorage.removeItem(KEYS.AUTH_ID_TOKEN);
    }
  } catch {}
}

// ── Theme ───────────────────────────────────────────────────────────

export async function getStoredThemeMode(): Promise<ThemeMode | null> {
  try {
    const val = await AsyncStorage.getItem(KEYS.THEME_MODE);
    return val as ThemeMode | null;
  } catch {
    return null;
  }
}

export async function setStoredThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
  } catch {}
}

// ── Orders ──────────────────────────────────────────────────────────

export async function getStoredOrders(): Promise<Order[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.ORDERS);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function setStoredOrders(orders: Order[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  } catch {}
}

// ── Clear All ───────────────────────────────────────────────────────

export async function clearAllStorage(): Promise<void> {
  try {
    await Promise.all(Object.values(KEYS).map(k => AsyncStorage.removeItem(k)));
  } catch {}
}
