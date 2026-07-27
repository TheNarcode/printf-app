import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { Text } from './Text';
import { scale, moderateScale } from '../utils/responsive';

export interface SecuredBadgeProps {
  label?: string;
  style?: ViewStyle | ViewStyle[];
}

export const SecuredBadge: React.FC<SecuredBadgeProps> = ({
  label = '256-bit Encrypted & Secured',
  style,
}) => {
  const { colors, commonStyles } = useTheme();

  return (
    <View style={[commonStyles.rowCenter, styles.container, style]}>
      <Lock size={moderateScale(10)} color={colors.textMuted} />
      <Text style={[styles.text, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: scale(12),
    alignSelf: 'center',
  },
  text: {
    fontSize: moderateScale(11),
    fontFamily: 'Geist-Regular',
    marginLeft: scale(4),
  },
});
