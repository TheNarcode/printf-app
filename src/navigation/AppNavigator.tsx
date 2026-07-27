import React, { useState, useRef } from 'react';
import { View, StyleSheet, InteractionManager } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { CustomSpinner } from '../components/CustomSpinner';
import NetworkBanner from '../components/NetworkBanner';
import { NetworkProvider } from '../context/NetworkContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import UploadScreen from '../screens/UploadScreen';
import PrintSettingsScreen from '../screens/PrintSettingsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import OrderResultScreen from '../screens/OrderResultScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import AllOrdersScreen from '../screens/AllOrdersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import TermsScreen from '../screens/TermsScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Upload: undefined;
  PrintSettings: undefined;
  Payment: undefined;
  OrderResult: { orderId?: string; success: boolean };
  OrderDetail: { orderId: string };
  AllOrders: { filter?: string } | undefined;
  Settings: undefined;
  Privacy: undefined;
  Terms: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface Props {
  navigationRef?: any;
}

export default function AppNavigator({ navigationRef }: Props) {
  const { isAuthenticated, isLoading, isAuthenticating } = useAuth();
  const { isDark, colors } = useTheme();
  const [isNavigating, setIsNavigating] = useState(false);


  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.primary,
    },
  };

  if (isLoading || isAuthenticating) {
    // Return a spinner view while checking auth to prevent blank screen flash
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', zIndex: 9999 }]}>
        <CustomSpinner size={32} label={isAuthenticating ? 'Authenticating...' : 'Loading...'} />
      </View>
    );
  }

  return (
    <NetworkProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <NavigationContainer 
          ref={navigationRef} 
          theme={navTheme}
          onStateChange={() => {
            setIsNavigating(true);
            const start = Date.now();
            InteractionManager.runAfterInteractions(() => {
              const timeToWait = Math.max(0, 250 - (Date.now() - start));
              setTimeout(() => setIsNavigating(false), timeToWait);
            });
          }}
        >
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'none',
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            {!isAuthenticated ? (
              <>
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ animation: 'none' }}
                />
                <Stack.Screen name="Privacy" component={PrivacyScreen} />
                <Stack.Screen name="Terms" component={TermsScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Upload" component={UploadScreen} />
                <Stack.Screen name="PrintSettings" component={PrintSettingsScreen} />
                <Stack.Screen name="Payment" component={PaymentScreen} />
                <Stack.Screen
                  name="OrderResult"
                  component={OrderResultScreen}
                  options={{ animation: 'none', gestureEnabled: false }}
                />
                <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                <Stack.Screen name="AllOrders" component={AllOrdersScreen} />
                <Stack.Screen
                  name="Settings"
                  component={SettingsScreen}
                  options={{ animation: 'none' }}
                />
                <Stack.Screen name="Privacy" component={PrivacyScreen} />
                <Stack.Screen name="Terms" component={TermsScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>

      {isNavigating && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', zIndex: 9999 }]}>
          <CustomSpinner size={32} label="Loading..." />
        </View>
      )}

      <NetworkBanner />

      </View>
    </NetworkProvider>
  );
}
