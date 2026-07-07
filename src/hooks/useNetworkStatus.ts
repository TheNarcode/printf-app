import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export type NetworkStatus = 'online' | 'offline' | 'back-online';

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const initializedRef = useRef(false);
  const backOnlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected === true;

      if (!initializedRef.current) {
        // First event — set real initial state without "back-online" flash
        initializedRef.current = true;
        setStatus(connected ? 'online' : 'offline');
        return;
      }

      if (connected) {
        setStatus('back-online');
        if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
        backOnlineTimerRef.current = setTimeout(() => setStatus('online'), 2500);
      } else {
        if (backOnlineTimerRef.current) {
          clearTimeout(backOnlineTimerRef.current);
          backOnlineTimerRef.current = null;
        }
        setStatus('offline');
      }
    });

    return () => {
      unsubscribe();
      if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
    };
  }, []);

  return {
    isOnline: status !== 'offline',
    isOffline: status === 'offline',
    status,
  };
}
