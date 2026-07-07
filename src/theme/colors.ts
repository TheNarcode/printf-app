export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 100,
} as const;

export const fontSize = {
  xxs: 10,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 32,
  hero: 40,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '800' as const,
};

// ─── ZINC-ONLY PALETTE ───────────────────────────────────────
// No blue anywhere. Accent = zinc-900 (light) / zinc-100 (dark).
// Status colors (green/red/amber) kept for semantic badges only.

export const lightColors = {
  background: '#FAFAFA',       // zinc-50
  backgroundSecondary: '#FFFFFF',
  surface: '#F4F4F5',          // zinc-100
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  text: '#18181B',             // zinc-900
  textSecondary: '#52525B',    // zinc-600
  textMuted: '#A1A1AA',        // zinc-400
  primary: '#18181B',          // zinc-900 — the accent
  primaryBg: 'rgba(24,24,27,0.05)',
  primaryBorder: 'rgba(24,24,27,0.15)',
  border: '#E4E4E7',          // zinc-200
  borderLight: '#F4F4F5',     // zinc-100
  borderDashed: '#D4D4D8',    // zinc-300
  success: '#16A34A',
  successBg: 'rgba(22,163,74,0.08)',
  successBorder: 'rgba(22,163,74,0.20)',
  danger: '#DC2626',
  dangerBg: 'rgba(220,38,38,0.06)',
  dangerBorder: 'rgba(220,38,38,0.18)',
  warning: '#D97706',
  warningBg: 'rgba(217,119,6,0.07)',
  warningBorder: 'rgba(217,119,6,0.18)',
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.08)',
  infoBorder: 'rgba(59,130,246,0.20)',
  shimmer: 'rgba(24,24,27,0.02)',
  shadow: '#A1A1AA',
  collected: '#9333EA',
  collectedBg: 'rgba(147,51,234,0.08)',
  collectedBorder: 'rgba(147,51,234,0.20)',
};

export type ThemeColors = typeof lightColors;

export const darkColors: ThemeColors = {
  background: '#09090B',       // zinc-950
  backgroundSecondary: '#0F0F12',
  surface: '#18181B',          // zinc-900
  card: '#131316',
  cardElevated: '#1C1C20',
  text: '#FAFAFA',             // zinc-50
  textSecondary: '#A1A1AA',    // zinc-400
  textMuted: '#71717A',        // zinc-500
  primary: '#F4F4F5',          // zinc-100 — the accent
  primaryBg: 'rgba(244,244,245,0.06)',
  primaryBorder: 'rgba(244,244,245,0.15)',
  border: '#27272A',          // zinc-800
  borderLight: '#1C1C20',
  borderDashed: '#3F3F46',    // zinc-700
  success: '#22C55E',
  successBg: 'rgba(34,197,94,0.10)',
  successBorder: 'rgba(34,197,94,0.25)',
  danger: '#EF4444',
  dangerBg: 'rgba(239,68,68,0.10)',
  dangerBorder: 'rgba(239,68,68,0.25)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.10)',
  warningBorder: 'rgba(245,158,11,0.25)',
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.15)',
  infoBorder: 'rgba(59,130,246,0.30)',
  shimmer: 'rgba(244,244,245,0.03)',
  shadow: '#000000',
  collected: '#A855F7',
  collectedBg: 'rgba(168,85,247,0.10)',
  collectedBorder: 'rgba(168,85,247,0.25)',
};
