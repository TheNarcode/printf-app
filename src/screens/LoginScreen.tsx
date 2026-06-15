import React, {useCallback, useRef, useEffect} from 'react';
import {ActivityIndicator, Animated, Easing, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Printer} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {Text} from '../components/Text';
import GoogleLogo from '../components/GoogleLogo';
import {scale, moderateScale, verticalScale} from '../utils/responsive';

export default function LoginScreen() {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {signInWithGoogle, isLoading} = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSignIn = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top}]}>
      {/* Subtle abstract background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.bgCircle, styles.bgCircle1, {backgroundColor: colors.primaryBg}]} />
        <View style={[styles.bgCircle, styles.bgCircle2, {backgroundColor: colors.primaryBg}]} />
      </View>

      <View style={styles.content}>
        {/* Logo area */}
        <Animated.View style={[styles.logoSection, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>
          <View style={[styles.logoMark, {backgroundColor: colors.surface}]}>
            <Printer size={moderateScale(32)} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.appName, {color: colors.text}]}>printf</Text>
          <Text style={[styles.tagline, {color: colors.textMuted}]}>
            Print anything, anywhere.
          </Text>
        </Animated.View>

        {/* Sign in button */}
        <Animated.View style={[styles.btnSection, {opacity: fadeAnim}]}>
          <TouchableOpacity
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.7}
            style={[styles.googleBtn, {backgroundColor: colors.card, borderColor: colors.border}]}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <GoogleLogo size={moderateScale(18)} />
                <Text style={[styles.googleBtnText, {color: colors.text}]}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {flex: 1, justifyContent: 'center', paddingHorizontal: scale(32), gap: verticalScale(60)},
  bgCircle: {position: 'absolute', borderRadius: 999},
  bgCircle1: {width: scale(400), height: scale(400), top: -scale(100), right: -scale(150), opacity: 0.5},
  bgCircle2: {width: scale(300), height: scale(300), bottom: -scale(50), left: -scale(150), opacity: 0.3},
  logoSection: {alignItems: 'center', gap: scale(14)},
  logoMark: {
    width: scale(72), height: scale(72), borderRadius: scale(20),
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  appName: {fontSize: moderateScale(40), fontFamily: 'Geist-Black', letterSpacing: -1.5},
  tagline: {fontSize: moderateScale(14), marginTop: -scale(6)},
  btnSection: {alignItems: 'center'},
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(12),
    width: '100%', paddingVertical: scale(14), borderRadius: scale(100), borderWidth: 1,
    minHeight: scale(52),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  googleBtnText: {fontSize: moderateScale(14), fontFamily: 'Geist-SemiBold'},
});
