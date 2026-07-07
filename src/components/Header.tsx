import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, X, Printer } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

import { Text } from '../components/Text';
import { moderateScale, scale } from '../utils/responsive';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showClose?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  rightElement?: React.ReactNode;
  large?: boolean;
  showBrand?: boolean;
}

const Header = memo(
  ({
    title,
    subtitle,
    showBack,
    showClose,
    onBack,
    onClose,
    rightElement,
    large,
    showBrand,
  }: HeaderProps) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    return (
      <View
        style={[
          styles.wrapper,
          {
            paddingTop: insets.top + scale(6),
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={[styles.inner, { borderBottomColor: colors.border }]}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.iconBtn}
            >
              <ArrowLeft
                size={moderateScale(20)}
                color={colors.text}
                strokeWidth={2}
              />
            </TouchableOpacity>
          )}
          {showBrand ? (
            <View style={styles.brandRow}>
              <Printer
                size={moderateScale(18)}
                color={colors.text}
                strokeWidth={1.8}
              />
              <Text style={[styles.brandName, { color: colors.text }]}>
                printf
              </Text>
            </View>
          ) : title ? (
            <Text
              style={[
                large ? styles.titleLarge : styles.title,
                { color: colors.text },
              ]}
            >
              {title}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          )}
          {rightElement}
          {showClose && (
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.iconBtn}
            >
              <X
                size={moderateScale(20)}
                color={colors.textMuted}
                strokeWidth={2}
              />
            </TouchableOpacity>
          )}
        </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: scale(20),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: scale(10),
    borderBottomWidth: 1,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: scale(10), flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  iconBtn: { padding: scale(4) },
  title: { fontSize: moderateScale(19), fontFamily: 'Geist-SemiBold' },
  titleLarge: {
    fontSize: moderateScale(22),
    fontFamily: 'Geist-Black',
    letterSpacing: -0.3,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  brandName: {
    fontSize: moderateScale(19),
    fontFamily: 'Geist-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: moderateScale(11),
    fontFamily: 'Geist-Medium',
    opacity: 0.6,
  },
});

export default Header;
