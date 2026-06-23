/**
 * printf — Print anything, anywhere
 * React Native App
 *
 * @format
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNavigationContainerRef } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { PrintJobProvider } from './src/context/PrintJobContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Text } from './src/components/Text';
import type { RootStackParamList } from './src/navigation/AppNavigator';
import { Bell } from 'lucide-react-native';
import { moderateScale } from './src/utils/responsive';

// Navigation ref — allows navigating from outside React components
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function navigateToOrder(orderId: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('OrderDetail', { orderId });
  }
}

// Helper to remove emojis from string
function stripEmojis(str: string) {
  return str
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      '',
    )
    .trim();
}

// ── In-app toast for foreground notifications ──────────────────────
function NotificationToast() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [slideAnim]);

  const show = useCallback(
    (t: string, b: string, oid: string | null) => {
      setTitle(stripEmojis(t));
      setBody(stripEmojis(b));
      setOrderId(oid);
      setVisible(true);

      Animated.spring(slideAnim, {
        toValue: 50,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();

      // Auto-hide after 5 seconds
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(hide, 5000);
    },
    [slideAnim, hide],
  );

  const handlePress = useCallback(() => {
    hide();
    if (orderId) navigateToOrder(orderId);
  }, [orderId, hide]);

  // Listen for foreground FCM messages
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const t = remoteMessage.notification?.title || 'Notification';
      const b = remoteMessage.notification?.body || '';
      const oid = remoteMessage.data?.orderId as string | undefined;
      show(t, b, oid || null);
    });
    return unsubscribe;
  }, [show]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.toastContent}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: colors.primaryBg }]}
        >
          <Bell
            size={moderateScale(18)}
            color={colors.primary}
            strokeWidth={2}
          />
        </View>
        <View style={styles.toastTextContainer}>
          <Text
            style={[styles.toastTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {body ? (
            <Text
              style={[styles.toastBody, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {body}
            </Text>
          ) : null}
        </View>
        {orderId ? (
          <View
            style={[styles.toastActionBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.toastAction, { color: colors.background }]}>
              View
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

import { CustomAlert } from './src/components/CustomAlert';

function AppContent() {
  const { isDark } = useTheme();

  // Handle notification tap when app is in background (not killed)
  useEffect(() => {
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      const orderId = remoteMessage.data?.orderId as string | undefined;
      if (orderId) {
        setTimeout(() => navigateToOrder(orderId), 500);
      }
    });
    return unsubscribe;
  }, []);

  // Handle notification tap when app was killed (cold start from notification)
  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage?.data?.orderId) {
          setTimeout(
            () => navigateToOrder(remoteMessage.data!.orderId as string),
            1500,
          );
        }
      });
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator navigationRef={navigationRef} />
      <NotificationToast />
      <CustomAlert />
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <PrintJobProvider>
            <AppContent />
          </PrintJobProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  toastTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  toastTitle: {
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
  },
  toastBody: {
    fontSize: 12,
    marginTop: 2,
  },
  toastAction: {
    fontSize: 12,
    fontFamily: 'Geist-SemiBold',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toastActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
});

export default App;
