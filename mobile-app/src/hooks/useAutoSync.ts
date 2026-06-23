import { useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '../store/authStore';
import { syncData } from '../database/sync';
import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  error: string | null;
  setSyncing: (syncing: boolean) => void;
  setSynced: () => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
  setSyncing: (syncing) => set({ isSyncing: syncing, error: null }),
  setSynced: () => set({ isSyncing: false, lastSyncedAt: Date.now(), error: null }),
  setError: (error) => set({ isSyncing: false, error }),
}));

export const performGlobalSync = async () => {
  const user = useAuthStore.getState().user;
  const staffRoles = ['admin', 'principal', 'teacher', 'accountant'];
  if (!user || !staffRoles.includes(user.role)) return;

  const { isSyncing, setSyncing, setSynced, setError } = useSyncStore.getState();
  if (isSyncing) return; // Prevent concurrent calls

  try {
    setSyncing(true);
    await syncData();
    setSynced();
  } catch (err: any) {
    if (err.message !== 'UNAUTHORIZED') {
      console.error('Auto-sync failed:', err.message);
    }
    setError(err.message);
  }
};

// Ensure variables survive Fast Refresh
const globalState = globalThis as any;
if (globalState.mountedInstances === undefined) {
  globalState.mountedInstances = 0;
  globalState.unsubscribeNetInfo = null;
  globalState.globalWasOffline = false;
}

/**
 * Hook that automatically triggers a sync when:
 * 1. The app comes online after being offline
 * 2. The user first logs in
 * 
 * Only activates for staff roles.
 */
export function useAutoSync() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    globalState.mountedInstances++;
    const staffRoles = ['admin', 'principal', 'teacher', 'accountant'];
    const isStaff = user && staffRoles.includes(user.role);

    if (globalState.mountedInstances === 1 && isStaff) {
      performGlobalSync();
      globalState.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
        if (state.isConnected && globalState.globalWasOffline) {
          performGlobalSync();
        }
        globalState.globalWasOffline = !state.isConnected;
      });
    }

    return () => {
      globalState.mountedInstances--;
      if (globalState.mountedInstances <= 0 && globalState.unsubscribeNetInfo) {
        globalState.unsubscribeNetInfo();
        globalState.unsubscribeNetInfo = null;
        globalState.mountedInstances = 0;
      }
    };
  }, [user]);

  return { performSync: performGlobalSync };
}
