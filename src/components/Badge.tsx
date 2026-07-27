import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Text } from './Text';
import { scale } from '../utils/responsive';

export interface BadgeProps {
  label: string;
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  showDot?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  status = 'neutral',
  showDot = false,
  style,
  textStyle,
}) => {
  const { colors, commonStyles } = useTheme();

  const getStatusColors = (): { bg: string; text: string; border: string; dot?: string } => {
    switch (status) {
      case 'success':
        return {
          bg: colors.successBg,
          text: colors.success,
          border: colors.successBorder,
          dot: colors.success,
        };
      case 'warning':
        return {
          bg: colors.warningBg,
          text: colors.warning,
          border: colors.warningBorder,
          dot: colors.warning,
        };
      case 'danger':
        return {
          bg: colors.dangerBg,
          text: colors.danger,
          border: colors.dangerBorder,
          dot: colors.danger,
        };
      case 'info':
        return {
          bg: colors.infoBg,
          text: colors.info,
          border: colors.infoBorder,
          dot: colors.info,
        };
      case 'primary':
        return {
          bg: colors.primaryBg,
          text: colors.primary,
          border: colors.primaryBorder,
          dot: colors.primary,
        };
      case 'neutral':
      default:
        return {
          bg: colors.surface,
          text: colors.textSecondary,
          border: colors.border,
          dot: colors.textMuted,
        };
    }
  };

  const s = getStatusColors();

  return (
    <View
      style={[
        commonStyles.badgePill,
        {
          backgroundColor: s.bg,
          borderColor: s.border,
          borderWidth: s.border ? 1 : 0,
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: s.dot || s.text },
          ]}
        />
      )}
      <Text
        weight="medium"
        style={[
          commonStyles.badgeText,
          { color: s.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginRight: scale(6),
  },
});