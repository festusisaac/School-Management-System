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

/**
 * Hook that automatically triggers a sync when:
 * 1. The app comes online after being offline
 * 2. The user first logs in
 * 
 * Only activates for staff roles (admin, principal, teacher, accountant).
 */
export function useAutoSync() {
  const user = useAuthStore((s) => s.user);
  const wasOffline = useRef(false);
  const { setSyncing, setSynced, setError } = useSyncStore();

  const staffRoles = ['admin', 'principal', 'teacher', 'accountant'];
  const isStaff = user && staffRoles.includes(user.role);

  const performSync = useCallback(async () => {
    if (!isStaff) return;

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
  }, [isStaff]);

  useEffect(() => {
    if (!isStaff) return;

    // Initial sync on mount
    performSync();

    // Listen for connectivity changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && wasOffline.current) {
        // Back online — trigger sync
        performSync();
      }
      wasOffline.current = !state.isConnected;
    });

    return () => unsubscribe();
  }, [isStaff, performSync]);

  return { performSync };
}
