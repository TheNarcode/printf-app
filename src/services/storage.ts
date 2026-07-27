import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode, Order } from '../types';

const KEYS = {
  THEME_MODE: 'printf_theme_mode',
  ORDERS: 'printf_orders',
} as const;

async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const getStoredThemeMode = (): Promise<ThemeMode | null> =>
  getItem<ThemeMode | null>(KEYS.THEME_MODE, null);

export const setStoredThemeMode = (mode: ThemeMode): Promise<void> =>
  setItem(KEYS.THEME_MODE, mode);

export const getStoredOrders = (): Promise<Order[]> =>
  getItem<Order[]>(KEYS.ORDERS, []);

export const setStoredOrders = (orders: Order[]): Promise<void> =>
  setItem(KEYS.ORDERS, orders);

export async function clearAllStorage(): Promise<void> {
  try {
    await Promise.all(Object.values(KEYS).map(k => AsyncStorage.removeItem(k)));
  } catch {}
}