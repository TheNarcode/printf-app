import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {useColorScheme} from 'react-native';
import {darkColors, lightColors, type ThemeColors} from './colors';
import {createCommonStyles, type CommonStyles} from './commonStyles';
import type {ThemeMode} from '../types';
import {getStoredThemeMode, setStoredThemeMode} from '../services/storage';

interface ThemeContextValue {
  colors: ThemeColors;
  commonStyles: CommonStyles;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const defaultCommonStyles = createCommonStyles(darkColors);

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  commonStyles: defaultCommonStyles,
  mode: 'system',
  isDark: true,
  setMode: () => {},
});

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Restore persisted theme on mount
  useEffect(() => {
    (async () => {
      const stored = await getStoredThemeMode();
      if (stored) setModeState(stored);
    })();
  }, []);

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemScheme]);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
  const commonStyles = useMemo(() => createCommonStyles(colors), [colors]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    setStoredThemeMode(newMode); // fire-and-forget persist
  }, []);

  const value = useMemo(
    () => ({colors, commonStyles, mode, isDark, setMode}),
    [colors, commonStyles, mode, isDark, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

