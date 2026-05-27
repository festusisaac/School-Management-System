import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncData } from '../db/sync';

export function NetworkListener() {
  const [status, setStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const opacity = useRef(new Animated.Value(1)).current;

  // Fade-in/out animation on status change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [status]);

  useEffect(() => {
    let isSyncing = false;

    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = state.isConnected && state.isInternetReachable !== false;

      if (!online) {
        setStatus('offline');
        return;
      }

      if (online && !isSyncing) {
        isSyncing = true;
        setStatus('syncing');
        try {
          await syncData();
          setStatus('online');
        } catch (e) {
          console.error('Sync error', e);
          setStatus('online');
        } finally {
          isSyncing = false;
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const config = {
    online:  { bg: '#14532d', border: '#16a34a', text: '🟢  Online — All data synced', textColor: '#86efac' },
    syncing: { bg: '#1e3a5f', border: '#3b82f6', text: '🔄  Syncing data...', textColor: '#93c5fd' },
    offline: { bg: '#450a0a', border: '#dc2626', text: '🔴  Offline — Changes saved locally', textColor: '#fca5a5' },
  }[status];

  return (
    <Animated.View style={[styles.bar, { backgroundColor: config.bg, borderBottomColor: config.border, opacity }]}>
      <Text style={[styles.text, { color: config.textColor }]}>{config.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
