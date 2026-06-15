import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Baseline: iPhone 8 / SE (375 x 812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Linear scale based on screen width.
 * Use for horizontal padding, margins, widths.
 */
export function scale(size: number): number {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
}

/**
 * Linear scale based on screen height.
 * Use for vertical spacing that must adapt to screen height.
 */
export function verticalScale(size: number): number {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
}

/**
 * Moderate scale — dampened scaling for font sizes and icons.
 * factor = 0 means no scaling, factor = 1 means full linear scaling.
 * Default factor = 0.4 keeps fonts readable without going comically large.
 */
export function moderateScale(size: number, factor: number = 0.4): number {
  return size + (scale(size) - size) * factor;
}

// ─── Pre-computed responsive design tokens ──────────────────────────

export const rs = {
  xxs: scale(2),
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
  xxxxl: scale(48),
} as const;

export const rf = {
  xxs: moderateScale(10),
  xs: moderateScale(11),
  sm: moderateScale(13),
  md: moderateScale(15),
  lg: moderateScale(17),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  display: moderateScale(32),
  hero: moderateScale(40),
} as const;

export const rbr = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  pill: scale(100),
} as const;

export {SCREEN_WIDTH, SCREEN_HEIGHT};
