import { synchronize } from '@nozbe/watermelondb/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from './index';
import { getSyncBaseUrl, refreshAccessToken } from '../services/api';
import { useAuthStore } from '../store/authStore';

/** Re-fetch with a freshly refreshed token when the access token has expired mid-sync. */
async function fetchWithRefresh(input: string, init: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  const newToken = await refreshAccessToken(); // throws (and logs out) if the refresh token is also invalid
  return fetch(input, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${newToken}` },
  });
}

/**
 * Convert camelCase field names (from backend) to snake_case (for database schema)
 */
function convertKeysToSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToSnakeCase(item));
  }

  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeCase = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      let value = obj[key];
      
      // WatermelonDB expects numbers for amount and will silently coerce strings to 0.
      if (['amount', 'total_score', 'average_score'].includes(snakeCase) && typeof value === 'string') {
        value = Number(value) || 0;
      }
      
      // The backend sends `meta` as a JSON object, but WatermelonDB schema expects a string.
      // Stringify it to avoid it saving as `"[object Object]"` which breaks JSON.parse locally.
      if (snakeCase === 'meta' && value !== null && typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      // Convert ISO date strings from backend to Unix timestamps for WatermelonDB
      const dateFields = [
        'dob', 'admission_date', 'as_on_date', 'deactivated_at',
        'scheduled_at', 'delivered_at', 'opened_at',
        'created_at', 'updated_at', 'deleted_at'
      ];
      if (dateFields.includes(snakeCase) && typeof value === 'string') {
        const parsedDate = Date.parse(value);
        if (!isNaN(parsedDate)) {
          value = parsedDate;
        }
      }
      
      result[snakeCase] = typeof value === 'object' && value !== null ? convertKeysToSnakeCase(value) : value;
    }
  }
  return result;
}


function convertKeysToCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item));
  }

  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelCase = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      let value = obj[key];
      
      // Convert Unix timestamps to ISO strings for TypeORM
      const camelCaseDateFields = [
        'createdAt', 'updatedAt', 'deletedAt',
        'dob', 'admissionDate', 'asOnDate', 'deactivatedAt',
        'scheduledAt', 'deliveredAt', 'openedAt'
      ];
      if (camelCaseDateFields.includes(camelCase) && typeof value === 'number') {
        if (value === 0) {
          value = null;
        } else {
          value = new Date(value).toISOString();
        }
      }
      
      result[camelCase] = convertKeysToCamelCase(value);
    }
  }
  return result;
}

let isSyncing = false;

/**
 * Performs a full WatermelonDB sync with the backend.
 * Only meant for staff roles (admin, teacher, principal, accountant).
 */
export async function syncData(): Promise<void> {
  if (isSyncing) {
    console.log('[Sync] Synchronization already in progress. Skipping.');
    return;
  }

  isSyncing = true;
  try {
    const user = useAuthStore.getState().user;
    if (!user || !user.token) {
      throw new Error('Cannot sync: No authenticated user');
    }

    // Only staff roles get offline sync
    const staffRoles = ['admin', 'principal', 'teacher', 'accountant'];
    if (!staffRoles.includes(user.role)) {
      return; // silently skip for students and parents
    }

    // Check if this is the first successful sync for this tenant
    const syncKey = `first_sync_complete_${user.tenantId}`;
    let hasCompletedFirstSync = Boolean(await AsyncStorage.getItem(syncKey));

    // Failsafe: if schema was upgraded, WatermelonDB wipes the local DB.
    // We must ignore the AsyncStorage flag and force a full sync if the DB is empty.
    if (hasCompletedFirstSync) {
      const studentCount = await database.get('students').query().fetchCount();
      if (studentCount === 0) {
        hasCompletedFirstSync = false;
      }
    }

    const API_BASE = getSyncBaseUrl();

    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        // Use pull-all if first sync hasn't completed, otherwise use incremental
        const useFullPull = !hasCompletedFirstSync;
        const endpoint = useFullPull ? '/sync/pull-all' : `/sync/pull?lastPulledAt=${lastPulledAt || 0}`;
        
        const response = await fetchWithRefresh(`${API_BASE}${endpoint}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error('UNAUTHORIZED');
          throw new Error(`Sync pull failed: ${response.status}`);
        }

        const parsed = await response.json();
        // Backend wraps in TransformInterceptor: { data: { changes, timestamp } }
        const body = parsed.data || parsed;

        // === DIAGNOSTIC LOGGING ===
        const rawFeeRecords = body.changes?.fee_records;
        const allRaw = [
          ...(rawFeeRecords?.created || []),
          ...(rawFeeRecords?.updated || []),
        ];
        console.log('[Sync] fee_records from backend:', JSON.stringify(allRaw.map((r: any) => ({
          id: r.id, type: r.type, amount: r.amount, studentId: r.studentId,
        }))));
        // === END DIAGNOSTIC ===
        
        // Convert all field names from camelCase (backend) to snake_case (database schema)
        const convertedChanges = convertKeysToSnakeCase(body.changes);
        
        return { changes: convertedChanges, timestamp: body.timestamp };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        const convertedChangesForPush: any = {};
        for (const tableName in changes) {
          if (changes.hasOwnProperty(tableName)) {
            const tableChanges = (changes as any)[tableName];
            convertedChangesForPush[tableName] = {
              created: convertKeysToCamelCase(tableChanges.created),
              updated: convertKeysToCamelCase(tableChanges.updated),
              deleted: tableChanges.deleted,
            };
          }
        }

        const response = await fetchWithRefresh(`${API_BASE}/sync/push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ changes: convertedChangesForPush, lastPulledAt }),
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error('UNAUTHORIZED');
          throw new Error(`Sync push failed: ${response.status}`);
        }
      },
    });

    // Mark first sync as complete after successful sync
    if (!hasCompletedFirstSync) {
      await AsyncStorage.setItem(syncKey, 'true');
    }
  } finally {
    isSyncing = false;
  }
}
