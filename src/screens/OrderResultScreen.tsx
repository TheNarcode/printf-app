import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, BackHandler } from 'react-native';
import { DotLottie } from '@lottiefiles/dotlottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { scale, moderateScale } from '../utils/responsive';

interface Props {
  navigation: any;
  route: { params: { orderId?: string; success: boolean; reason?: string } };
}

const LOTTIE_SUCCESS =
  'https://lottie.host/59ee1bc4-e837-4541-9a74-11a4f119ddf2/157gf4t4rF.lottie';
const LOTTIE_FAIL =
  'https://lottie.host/d19042ee-3913-401f-82a2-2d6723bbb1c9/c1rsPI1Jhg.lottie';

const ERROR_MESSAGES: Record<string, string> = {
  cancelled: 'Payment was cancelled by the user.',
  timeout:
    'Unable to connect to the server right now. Please check your connection.',
  session: 'Your session has expired. Please sign in again.',
  payment_failed:
    'Your payment failed. Please try again with a different method.',
};
const DEFAULT_ERROR =
  'Something went wrong while processing your order. Please try again.';

export default function OrderResultScreen({ navigation, route }: Props) {
  const { colors, commonStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const { orders } = usePrintJob();
  const { success, orderId, reason } = route.params;

  const order = orderId ? orders.find(o => o.id === orderId) : null;
  const errorMessage = (reason && ERROR_MESSAGES[reason]) || DEFAULT_ERROR;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const handleViewOrder = useCallback(() => {
    if (orderId) {
      navigation.reset({
        index: 1,
        routes: [{ name: 'Home' }, { name: 'OrderDetail', params: { orderId } }],
      });
    }
  }, [navigation, orderId]);

  const handleGoHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [navigation]);

  useEffect(() => {
    const onBackPress = () => {
      handleGoHome();
      return true;
    };
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );
    return () => subscription.remove();
  }, [handleGoHome]);

  const lottieSize = scale(220);

  return (
    <View style={[commonStyles.screenContainer, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Animated.View
          style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          <DotLottie
            source={{ uri: success ? LOTTIE_SUCCESS : LOTTIE_FAIL }}
            autoplay
            loop={false}
            style={{ width: lottieSize, height: lottieSize }}
            segment={success ? [1, 43] : [1, 58]}/>
        </Animated.View>

        <Animated.View style={[styles.textSection, { opacity: fadeAnim }]}>
          <Text weight="bold" style={[styles.title, { color: colors.text }]}>
            {success ? 'Order Placed!' : 'Payment Failed'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {success
              ? 'Your print order has been submitted successfully.'
              : errorMessage}
          </Text>

          {success && order && (
            <View
              style={[
                styles.refCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text weight="medium" style={[styles.refLabel, { color: colors.textMuted }]}>
                Order Reference
              </Text>
              <Text weight="bold" style={[styles.refValue, { color: colors.text }]}>
                {order.orderRef}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.btnSection, { opacity: fadeAnim }]}>
          {success ? (
            <>
              <Button label="View Order" onPress={handleViewOrder} />
              <Button
                label="Back to Home"
                variant="outline"
                onPress={handleGoHome}/>
            </>
          ) : (
            <Button label="Go Home" onPress={handleGoHome} />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(32),
    gap: scale(32),
  },
  iconContainer: { alignItems: 'center' },
  textSection: { alignItems: 'center', gap: scale(10) },
  title: {
    fontSize: moderateScale(26),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  refCard: {
    marginTop: scale(14),
    paddingVertical: scale(14),
    paddingHorizontal: scale(24),
    borderRadius: scale(10),
    borderWidth: 1,
    alignItems: 'center',
    gap: scale(4),
  },
  refLabel: { fontSize: moderateScale(11) },
  refValue: {
    fontSize: moderateScale(20),
    letterSpacing: 0.5,
  },
  btnSection: { gap: scale(10) },
});