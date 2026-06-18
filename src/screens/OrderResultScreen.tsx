import React, {useCallback, useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, TouchableOpacity, View} from 'react-native';
import {CircleCheck, XCircle} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {usePrintJob} from '../context/PrintJobContext';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';

interface Props {
  navigation: any;
  route: {params: {orderId?: string; success: boolean}};
}

export default function OrderResultScreen({navigation, route}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {orders} = usePrintJob();
  const {success, orderId} = route.params;

  const order = orderId ? orders.find(o => o.id === orderId) : null;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1, duration: 400,
        easing: Easing.out(Easing.back(1.5)), useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const handleViewOrder = useCallback(() => {
    if (orderId) {
      navigation.reset({
        index: 1,
        routes: [{name: 'Home'}, {name: 'OrderDetail', params: {orderId}}],
      });
    }
  }, [orderId, navigation]);

  const handleGoHome = useCallback(() => {
    navigation.reset({index: 0, routes: [{name: 'Home'}]});
  }, [navigation]);

  const handleRetry = useCallback(() => {
    // Navigate back to home since the flow state was cleared
    navigation.reset({index: 0, routes: [{name: 'Home'}]});
  }, [navigation]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top}]}>
      <View style={styles.content}>
        {/* Icon */}
        <Animated.View style={[styles.iconContainer, {transform: [{scale: scaleAnim}]}]}>
          <View style={[styles.iconCircle, {backgroundColor: success ? colors.successBg : colors.dangerBg}]}>
            {success ? (
              <CircleCheck size={moderateScale(48)} color={colors.success} strokeWidth={1.5} />
            ) : (
              <XCircle size={moderateScale(48)} color={colors.danger} strokeWidth={1.5} />
            )}
          </View>
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textSection, {opacity: fadeAnim}]}>
          <Text style={[styles.title, {color: colors.text}]}>
            {success ? 'Order Placed!' : 'Payment Failed'}
          </Text>
          <Text style={[styles.subtitle, {color: colors.textMuted}]}>
            {success
              ? 'Your print order has been submitted successfully.'
              : 'Something went wrong with your payment. Please try again.'}
          </Text>

          {success && order && (
            <View style={[styles.refCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
              <Text style={[styles.refLabel, {color: colors.textMuted}]}>Order Reference</Text>
              <Text style={[styles.refValue, {color: colors.text}]}>{order.orderRef}</Text>
            </View>
          )}
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.btnSection, {opacity: fadeAnim}]}>
          {success ? (
            <>
              <TouchableOpacity onPress={handleViewOrder} activeOpacity={0.8} style={[styles.primaryBtn, {backgroundColor: colors.primary}]}>
                <Text style={[styles.primaryBtnText, {color: colors.background}]}>View Order</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGoHome} activeOpacity={0.7} style={[styles.secondaryBtn, {borderColor: colors.border}]}>
                <Text style={[styles.secondaryBtnText, {color: colors.text}]}>Back to Home</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={handleRetry} activeOpacity={0.8} style={[styles.primaryBtn, {backgroundColor: colors.primary}]}>
                <Text style={[styles.primaryBtnText, {color: colors.background}]}>Go Home</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {flex: 1, justifyContent: 'center', paddingHorizontal: scale(32), gap: scale(32)},
  iconContainer: {alignItems: 'center'},
  iconCircle: {
    width: scale(100), height: scale(100), borderRadius: scale(50),
    justifyContent: 'center', alignItems: 'center',
  },
  textSection: {alignItems: 'center', gap: scale(10)},
  title: {fontSize: moderateScale(26), fontFamily: 'Geist-Bold', textAlign: 'center'},
  subtitle: {fontSize: moderateScale(14), textAlign: 'center', lineHeight: moderateScale(20)},
  refCard: {
    marginTop: scale(14), paddingVertical: scale(14), paddingHorizontal: scale(24),
    borderRadius: scale(10), borderWidth: 1, alignItems: 'center', gap: scale(4),
  },
  refLabel: {fontSize: moderateScale(11), fontFamily: 'Geist-Medium'},
  refValue: {fontSize: moderateScale(20), fontFamily: 'Geist-Bold', letterSpacing: 0.5},
  btnSection: {gap: scale(10)},
  primaryBtn: {
    paddingVertical: scale(14), borderRadius: scale(8), alignItems: 'center',
  },
  primaryBtnText: {fontSize: moderateScale(16), fontFamily: 'Geist-SemiBold'},
  secondaryBtn: {
    paddingVertical: scale(14), borderRadius: scale(8), alignItems: 'center', borderWidth: 1,
  },
  secondaryBtnText: {fontSize: moderateScale(16), fontFamily: 'Geist-Medium'},
});
