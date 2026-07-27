import React, { memo, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Animated } from 'react-native';
import { ArrowLeft, Printer } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useNetwork } from '../context/NetworkContext';

import { Text } from './Text';
import { moderateScale, scale } from '../utils/responsive';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  showBrand?: boolean;
}

const Header = memo(
  ({
    title,
    subtitle,
    showBack,
    onBack,
    rightElement,
    showBrand,
  }: HeaderProps) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { status } = useNetwork();
    const bannerVisible = status === 'offline' || status === 'back-online';
    const topPadding = useRef(new Animated.Value(insets.top + scale(6))).current;

    useEffect(() => {
      Animated.timing(topPadding, {
        toValue: bannerVisible ? insets.top + scale(26) : insets.top + scale(6),
        duration: 250,
        useNativeDriver: false,
      }).start();
    }, [bannerVisible, insets.top]);

    return (
      <Animated.View
        style={[
          styles.wrapper,
          {
            paddingTop: topPadding,
            backgroundColor: colors.background,
          },
        ]}>
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
                  strokeWidth={2}/>
              </TouchableOpacity>
            )}
            {showBrand ? (
              <View style={styles.brandRow}>
                <Printer
                  size={moderateScale(18)}
                  color={colors.text}
                  strokeWidth={1.8}
                />
                <Text weight="bold" style={[styles.brandName, { color: colors.text }]}>
                  printf
                </Text>
              </View>
            ) : title ? (
              <Text weight="semibold" style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>
            ) : null}
          </View>
          <View style={styles.right}>
            {subtitle && (
              <Text weight="medium" style={[styles.subtitle, { color: colors.textMuted }]}>
                {subtitle}
              </Text>
            )}
            {rightElement}
          </View>
        </View>
      </Animated.View>
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
  title: { fontSize: moderateScale(19) },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  brandName: {
    fontSize: moderateScale(19),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: moderateScale(11),
    opacity: 0.6,
  },
});

export default Header;