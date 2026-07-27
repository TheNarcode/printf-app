import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Text } from './Text';
import { CustomSpinner } from './CustomSpinner';
import { scale, moderateScale } from '../utils/responsive';

export interface ButtonProps {
  label?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  children,
}) => {
  const { colors, commonStyles } = useTheme();

  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          button: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: {
            color: colors.text,
          },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: {
            color: colors.text,
          },
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
          },
          text: {
            color: colors.text,
          },
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: colors.primary,
          },
          text: {
            color: colors.background,
          },
        };
    }
  };

  const vStyles = getVariantStyles();

  const spinnerColor =
    variant === 'primary' ? colors.background : colors.textSecondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={[
        commonStyles.primaryBtn,
        vStyles.button,
        (disabled || isLoading) && { opacity: 0.7 },
        style,
      ]}
    >
      {isLoading ? (
        <View style={styles.contentRow}>
          <CustomSpinner size="small" color={spinnerColor} style={{ marginRight: scale(8) }} />
          {label ? (
            <Text
              weight="bold"
              style={[
                commonStyles.primaryBtnText,
                vStyles.text,
                textStyle,
              ]}
            >
              {label}
            </Text>
          ) : null}
        </View>
      ) : children ? (
        children
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' ? (
            <View style={styles.iconLeft}>{icon}</View>
          ) : null}
          {label ? (
            <Text
              weight="bold"
              style={[
                commonStyles.primaryBtnText,
                vStyles.text,
                textStyle,
              ]}
            >
              {label}
            </Text>
          ) : null}
          {icon && iconPosition === 'right' ? (
            <View style={styles.iconRight}>{icon}</View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: scale(8),
  },
  iconRight: {
    marginLeft: scale(8),
  },
});
