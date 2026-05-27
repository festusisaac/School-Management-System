import { synchronize } from '@nozbe/watermelondb/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { database } from './index';

const API_BASE = Constants.expoConfig?.extra?.apiUrl ?? 'http://192.168.1.100:3000/api/v1';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const stored = await AsyncStorage.getItem('auth_user');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (stored) {
    const user = JSON.parse(stored);
    headers['Authorization'] = `Bearer ${user.token}`;
    headers['x-tenant-id'] = user.tenantId;
  }
  return headers;
}

export async function syncData() {
  const headers = await getAuthHeaders();

  // Only admin/accountant roles sync the heavy offline database
  const stored = await AsyncStorage.getItem('auth_user');
  if (!stored) return;
  const user = JSON.parse(stored);

  const offlineRoles = ['admin', 'principal', 'accountant'];
  if (!offlineRoles.includes(user.role)) {
    console.log(`Sync skipped for role: ${user.role}`);
    return;
  }

  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const params = new URLSearchParams();
      if (lastPulledAt) params.append('lastPulledAt', String(lastPulledAt));
      params.append('tenantId', user.tenantId);

      const response = await fetch(`${API_BASE}/sync/pull?${params.toString()}`, { headers });
      if (!response.ok) throw new Error(await response.text());
      const { changes, timestamp } = await response.json();
      return { changes, timestamp };
    },
    pushChanges: async ({ changes }) => {
      const response = await fetch(`${API_BASE}/sync/push?tenantId=${user.tenantId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error(await response.text());
    },
    migrationsEnabledAtVersion: 1,
  });
}
