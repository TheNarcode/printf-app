import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Text } from '../components/Text';
import GoogleLogo from '../components/GoogleLogo';
import { Printer, Moon, Sun } from 'lucide-react-native';
import { scale, moderateScale, verticalScale } from '../utils/responsive';
import { DotLottie } from "@lottiefiles/dotlottie-react-native";


const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '0',
    title: 'Welcome to printf!',
    subtitle: 'One stope print solution.',
    uri:"https://lottie.host/6ec486aa-843b-4566-a632-f62955af5aea/B1bbq9mOd7.lottie",
  },
  {
    id: '1',
    title: 'Print from Anywhere',
    subtitle: 'Upload documents instantly.',
    uri:"https://lottie.host/2443202d-0b4d-4224-bc56-c9d29bf6c186/69Hvfcelft.lottie",
  },
  {
    id: '2',
    title: 'Stay Updated',
    subtitle: 'Push notifications to track your orders',
    uri: 'https://lottie.host/0f682ab2-d02f-49fc-b7c5-0c317bda0528/rYz2KNLnkn.lottie',
  },
  {
    id: '3',
    title: 'Save Time',
    subtitle: 'No more standing in queues for print',
    uri: 'https://lottie.host/e7926353-a492-44ed-8645-7d8f791bff1b/kcbMmVbGF1.lottie',
  },
];

const PaginationDot = ({ isActive, colors }: { isActive: boolean, colors: any }) => {
  const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: false,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [isActive, anim]);

  const dotScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const backgroundColor = anim.interpolate({ inputRange: [0, 1], outputRange: [colors.textMuted as string, colors.primary as string] });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor,
          opacity,
          transform: [{ scale: dotScale }],
        },
      ]}
    />
  );
};

export default function LoginScreen() {
  const { colors, isDark, setMode } = useTheme();
  const toggleMode = () => setMode(isDark ? 'light' : 'dark');
  const insets = useSafeAreaInsets();
  const { signInWithGoogle } = useAuth();

  // Mirror the web: slides array + clone of first slide at end
  const renderSlides = [...SLIDES, { ...SLIDES[0], id: 'clone', origIndex: 0 }];
  const [slides, setSlides] = useState(() => SLIDES.map((s, i) => ({ ...s, origIndex: i })));
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const transX = useRef(new Animated.Value(0)).current;
  // Track the position in the full renderSlides array (0..4)
  const posRef = useRef(0);

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    const nextPos = posRef.current + 1;
    // Advance dot immediately (mirrors web: dot switches on isAnimating=true)
    setActiveIndex(nextPos % SLIDES.length);
    Animated.timing(transX, {
      toValue: -width * nextPos,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIsAnimating(false);
      if (nextPos === SLIDES.length) {
        // Snap back to position 0 (the real first slide) instantly — no visible flash
        transX.setValue(0);
        posRef.current = 0;
      } else {
        posRef.current = nextPos;
      }
    });
  }, [isAnimating, transX]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const orb1Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const orb2Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    const createFloat = (anim: Animated.ValueXY, dx: number, dy: number, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: { x: dx, y: dy },
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: { x: 0, y: 0 },
            duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createFloat(orb1Anim, 50, 80, 8000);
    createFloat(orb2Anim, -60, -90, 10000);
  }, [orb1Anim, orb2Anim]);

  const handleSignIn = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const renderItem = (item: typeof renderSlides[0]) => (
    <View key={`${item.id}`} style={[styles.slideContainer, { width }]}>
      <View style={styles.lottieContainer}>
        <DotLottie
          source={{ uri: item.uri }}
          autoplay
          loop
          style={styles.lottie}
        />
      </View>
      <View style={styles.textContainer}>
        {!!item.title && (
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        )}
        {!!item.subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Background orbs (animated for RN) */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.orb1, { backgroundColor: colors.textSecondary, transform: orb1Anim.getTranslateTransform() }]} />
        <Animated.View style={[styles.orb2, { backgroundColor: colors.text, transform: orb2Anim.getTranslateTransform() }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: scale(24) }]}>
        <View style={styles.brand}>
          <Printer size={moderateScale(18)} color={colors.text} strokeWidth={1.8} />
          <Text style={[styles.brandName, { color: colors.text }]}>printf</Text>
        </View>
        <TouchableOpacity
          onPress={toggleMode}
          activeOpacity={0.7}
          style={styles.themeToggle}
        >
          {isDark ? (
            <Sun size={moderateScale(18)} color={colors.text} />
          ) : (
            <Moon size={moderateScale(18)} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.carouselWrapper}>
        <View style={{ width, overflow: 'hidden' }}>
          <Animated.View style={{ flexDirection: 'row', width: width * renderSlides.length, transform: [{ translateX: transX }] }}>
            {renderSlides.map(renderItem)}
          </Animated.View>
        </View>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, idx) => (
            <PaginationDot key={idx.toString()} isActive={activeIndex === idx} colors={colors} />
          ))}
        </View>
      </View>

      {/* Bottom Sticky Login */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + scale(24) }]}>
        <TouchableOpacity
          onPress={handleSignIn}
          activeOpacity={0.7}
          style={[
            styles.googleBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <GoogleLogo size={moderateScale(20)} />
          <Text style={[styles.googleBtnText, { color: colors.text }]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <View style={styles.footerLinks}>
          <Text style={[styles.footerText, { color: colors.textMuted, textAlign: 'center', lineHeight: moderateScale(16) }]}>
            By signing in, you agree to our{' '}
            <Text style={{ fontFamily: 'Geist-SemiBold', textDecorationLine: 'underline' }}>Terms of Service</Text>{' '}
            and{' '}
            <Text style={{ fontFamily: 'Geist-SemiBold', textDecorationLine: 'underline' }}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb1: {
    position: 'absolute',
    top: '5%',
    left: '-10%',
    width: moderateScale(250),
    height: moderateScale(250),
    borderRadius: 999,
    opacity: 0.05,
  },
  orb2: {
    position: 'absolute',
    top: '40%',
    right: '-10%',
    width: moderateScale(300),
    height: moderateScale(300),
    borderRadius: 999,
    opacity: 0.05,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(16),
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  brandName: {
    fontSize: moderateScale(22),
    fontFamily: 'Geist-Black',
    letterSpacing: -0.5,
  },
  themeToggle: {
    padding: scale(8),
  },
  carouselWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: verticalScale(100), // make space for bottom sticky section
  },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(32),
  },
  lottieContainer: {
    width: '100%',
    maxWidth: scale(320),
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    height: moderateScale(72),
    marginTop: verticalScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: moderateScale(26),
    fontFamily: 'Geist-Black',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Geist-Medium',
    marginTop: verticalScale(6),
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(10),
    marginTop: verticalScale(32),
  },
  dot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: 999,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(40),
    alignItems: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(12),
    width: '100%',
    paddingVertical: moderateScale(16),
    borderRadius: scale(100),
    borderWidth: 1,
    minHeight: moderateScale(56),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  googleBtnText: {
    fontSize: moderateScale(15),
    fontFamily: 'Geist-Bold',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginTop: verticalScale(16),
  },
  footerText: {
    fontSize: moderateScale(11),
    fontFamily: 'Geist-Regular',
    opacity: 0.7,
  },
  footerDot: {
    fontSize: moderateScale(10),
    opacity: 0.2,
  },
});
