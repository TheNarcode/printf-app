import { useCallback, useRef } from 'react';
import { BackHandler, ToastAndroid, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export function useDoubleBackToExit() {
  const lastBackPressTime = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          BackHandler.exitApp();
          return true; // Event is handled
        }
        
        lastBackPressTime.current = now;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        return true; // Prevent default behavior (exiting app)
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [])
  );
}
