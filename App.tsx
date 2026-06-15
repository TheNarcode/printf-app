/**
 * printf — Print anything, anywhere
 * React Native App
 *
 * @format
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider, useTheme} from './src/theme/ThemeContext';
import {AuthProvider} from './src/context/AuthContext';
import {PrintJobProvider} from './src/context/PrintJobContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const {isDark} = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
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

export default App;
