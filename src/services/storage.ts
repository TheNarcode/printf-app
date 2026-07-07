import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ThemeMode, Order} from '../types';

const KEYS = {
  THEME_MODE: 'printf_theme_mode',
  ORDERS: 'printf_orders',
} as const;

// ── Auth ────────────────────────────────────────────────────────────
// (Auth is now handled natively by @react-native-firebase/auth)

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
