import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNetwork } from '../context/NetworkContext';
import { Text } from './Text';
import { moderateScale, scale } from '../utils/responsive';

export default function NetworkBanner() {
  const { colors } = useTheme();
  const { status } = useNetwork();
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [displayStatus, setDisplayStatus] = React.useState(status);

  useEffect(() => {
    if (status !== 'online') {
      setDisplayStatus(status);
    }
  }, [status]);

  const visible = status === 'offline' || status === 'back-online';
  const isBackOnline = displayStatus === 'back-online';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: visible ? scale(34) : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [visible, heightAnim, opacityAnim]);

  const bg = isBackOnline ? '#16a34a' : '#3f3f46';
  const borderColor = isBackOnline ? '#15803d' : '#52525b';
  const textColor = isBackOnline ? '#ffffff' : '#e4e4e7';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: heightAnim,
          opacity: opacityAnim,
          backgroundColor: bg,
          borderTopColor: borderColor,
        },
      ]}
    >
      <View style={styles.inner}>
        {isBackOnline ? (
          <Wifi size={moderateScale(13)} color={textColor} strokeWidth={2} />
        ) : (
          <WifiOff size={moderateScale(13)} color={textColor} strokeWidth={2} />
        )}
        <Text style={[styles.text, { color: textColor }]}>
          {isBackOnline
            ? 'Back online'
            : 'No connection — some features may be limited'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    paddingHorizontal: scale(16),
  },
  text: {
    fontSize: moderateScale(11),
    fontFamily: 'Geist-Medium',
  },
});
