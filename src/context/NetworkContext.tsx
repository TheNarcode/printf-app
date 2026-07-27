import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { CustomAlertAPI } from '../components/CustomAlert';

export type NetworkStatus = 'online' | 'offline' | 'back-online';

interface NetworkContextValue {
  isOnline: boolean;
  isOffline: boolean;
  status: NetworkStatus;
  assertOnline: (message?: string) => boolean;
}

const NetworkContext = createContext<NetworkContextValue>({
  isOnline: true,
  isOffline: false,
  status: 'online',
  assertOnline: () => true,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const initializedRef = useRef(false);
  const wasOfflineRef = useRef(false);  
  const backOnlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected === true;

      if (!initializedRef.current) {
        initializedRef.current = true;
        wasOfflineRef.current = !connected;
        setStatus(connected ? 'online' : 'offline');
        return;
      }

      if (connected) {
        if (wasOfflineRef.current) {
          wasOfflineRef.current = false;
          setStatus('back-online');
          if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
          backOnlineTimerRef.current = setTimeout(() => setStatus('online'), 2500);
        }
      } else {
        wasOfflineRef.current = true;
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

  const isOffline = status === 'offline';
  const isOnline = !isOffline;

  const assertOnline = (message = "You're offline. Please connect to the internet to continue.") => {
    if (isOffline) {
      CustomAlertAPI.alert('No Connection', message);
      return false;
    }
    return true;
  };

  return (
    <NetworkContext.Provider value={{ isOnline, isOffline, status, assertOnline }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}