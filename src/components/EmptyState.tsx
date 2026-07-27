import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Text } from './Text';
import { Button } from './Button';
import { scale, moderateScale } from '../utils/responsive';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle | ViewStyle[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors, commonStyles } = useTheme();

  return (
    <View style={[commonStyles.centeredContent, styles.container, style]}>
      {icon && (
        <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
          {icon}
        </View>
      )}
      <Text weight="medium" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={styles.actionBtn}/>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: scale(24),
  },
  iconBox: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
  },
  title: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: scale(6),
  },
  description: {
    fontSize: moderateScale(13),
    textAlign: 'center',
    lineHeight: moderateScale(18),
    marginBottom: scale(20),
  },
  actionBtn: {
    paddingHorizontal: scale(20),
  },
});
