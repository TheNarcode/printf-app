import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useNetwork } from '../context/NetworkContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { moderateScale, scale } from '../utils/responsive';

export default function NetworkBanner() {
  const { status } = useNetwork();
  const insets = useSafeAreaInsets();
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
        toValue: visible ? scale(20) + insets.top : 0,
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
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={[styles.inner, { paddingTop: insets.top }]}>
        <Text weight="medium" style={[styles.text, { color: textColor }]}>
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
    borderBottomWidth: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
  },
  text: {
    fontSize: moderateScale(10),
  },
});