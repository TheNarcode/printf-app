import { StyleSheet } from 'react-native';
import { ThemeColors } from './colors';
import { scale, moderateScale, rs, rf, rbr } from '../utils/responsive';

/**
 * Creates common, theme-aware global styles shared across all screens and components.
 * Guarantees 100% visual parity while removing code slop and inline duplication.
 */
export const createCommonStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // ─── Layout Utilities ──────────────────────────────────
    flex1: {
      flex: 1,
    },
    screenContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    centeredContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ─── Cards & Surfaces ──────────────────────────────────
    card: {
      backgroundColor: colors.card,
      borderRadius: rbr.lg,
      padding: rs.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    surfaceCard: {
      backgroundColor: colors.surface,
      borderRadius: rbr.md,
      padding: rs.md,
    },

    // ─── Buttons & Bottom Bars ──────────────────────────────
    primaryBtn: {
      minHeight: scale(44),
      paddingVertical: scale(11),
      backgroundColor: colors.primary,
      borderRadius: scale(8),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    primaryBtnText: {
      color: colors.background,
      fontSize: moderateScale(16),
      fontFamily: 'Geist-Bold',
    },
    secondaryBtn: {
      height: scale(44),
      backgroundColor: colors.surface,
      borderRadius: rbr.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.border,
    },
    bottomBar: {
      paddingHorizontal: rs.xl,
      paddingTop: rs.md,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    // ─── Badges & Tags ─────────────────────────────────────
    badgePill: {
      paddingHorizontal: scale(10),
      paddingVertical: scale(4),
      borderRadius: rbr.pill,
      backgroundColor: colors.surface,
      alignSelf: 'flex-start',
    },
    badgeText: {
      fontSize: rf.xs,
      fontFamily: 'Geist-Medium',
      color: colors.textSecondary,
    },

    // ─── Typography & Section Headers ─────────────────────
    sectionLabel: {
      fontSize: rf.xs,
      fontFamily: 'Geist-Medium',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: rs.sm,
    },
    screenTitle: {
      fontSize: rf.xl,
      fontFamily: 'Geist-Bold',
      color: colors.text,
    },
    bodyText: {
      fontSize: rf.md,
      fontFamily: 'Geist-Regular',
      color: colors.text,
    },
    subtext: {
      fontSize: rf.sm,
      fontFamily: 'Geist-Regular',
      color: colors.textSecondary,
    },
  });

export type CommonStyles = ReturnType<typeof createCommonStyles>;
