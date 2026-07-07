import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { CustomAlertAPI } from '../components/CustomAlert';

export type NetworkStatus = 'online' | 'offline' | 'back-online';

interface NetworkContextValue {
  isOnline: boolean;
  isOffline: boolean;
  status: NetworkStatus;
  /** Call before any network action. Shows an alert and returns false if offline. */
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
  const wasOfflineRef = useRef(false);  // true only after we've confirmed an offline state
  const backOnlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected === true;

      if (!initializedRef.current) {
        // First event: just set the real initial state, no banner
        initializedRef.current = true;
        wasOfflineRef.current = !connected;
        setStatus(connected ? 'online' : 'offline');
        return;
      }

      if (connected) {
        if (wasOfflineRef.current) {
          // Only show 'back-online' if we actually recovered from offline
          wasOfflineRef.current = false;
          setStatus('back-online');
          if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
          backOnlineTimerRef.current = setTimeout(() => setStatus('online'), 2500);
        }
        // If wasOfflineRef was already false (spurious online event), ignore it
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
