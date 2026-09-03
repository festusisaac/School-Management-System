import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

import { Platform } from 'react-native';

// Local dev (Metro/dev-client): hit your dev machine on the LAN, for fast iteration.
// Any real build (release/standalone): hit the live, publicly-hosted production server —
// this is what makes the app work anywhere, not just on the same WiFi as a laptop.
const DEV_API_BASE = 'http://10.100.142.192:3000/api/v1';
const PROD_API_BASE = 'https://sms.festus.com.ng/api/v1';

let API_BASE = __DEV__ ? DEV_API_BASE : PROD_API_BASE;

export async function loginRequest(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Login failed. Check your credentials.');
  }

  const parsed = await res.json();

  // The backend wraps responses in a { statusCode, message, data, timestamp } object via TransformInterceptor
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return parsed.data;
  }

  return parsed;
}

// Access tokens are short-lived (15m) by design; the refresh token (long-lived, see
// JWT_EXPIRE on the backend) is what actually keeps a user signed in across sessions.
// Every authorized request below transparently refreshes-and-retries once on a 401
// instead of logging the user out — matching what the web app's httpClient does.
let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { user, updateTokens, logout } = useAuthStore.getState();
    if (!user?.refreshToken) {
      logout();
      throw new Error('UNAUTHORIZED');
    }
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: user.refreshToken }),
      });
      if (!res.ok) throw new Error('Refresh failed');
      const parsed = await res.json();
      const data = parsed && typeof parsed === 'object' && 'data' in parsed ? parsed.data : parsed;
      updateTokens(data.access_token, data.refresh_token);
      return data.access_token as string;
    } catch (e) {
      logout();
      throw new Error('UNAUTHORIZED');
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/** Shared request core for the JSON verbs below: retries once with a refreshed token on 401. */
async function authorizedRequest(endpoint: string, token: string, init: RequestInit, isRetry = false): Promise<any> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), 'Authorization': `Bearer ${token}` },
  });

  if (res.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    return authorizedRequest(endpoint, newToken, init, true);
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API request failed: ${res.status}`);
  }

  const parsed = await res.json().catch(() => ({}));
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return parsed.data;
  }
  return parsed;
}

export async function apiGet(endpoint: string, token: string) {
  return authorizedRequest(endpoint, token, {});
}

export function getSyncBaseUrl() {
  return API_BASE;
}

/** Host root without the /api/v1 prefix — used to build uploaded-file URLs. */
export function getFileHostUrl() {
  return API_BASE.replace(/\/api\/v\d+\/?$/, '');
}

/** Build a full URL for an uploaded file path (attachments, docs, etc.). */
export function getFileUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Windows multer stores paths with backslashes (e.g. "uploads\students\x.jpg").
  // Browsers tolerate that, but React Native's <Image>/fetch do NOT — normalize.
  const normalized = path.replace(/\\/g, '/');
  return `${getFileHostUrl()}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
}

export async function apiPost(endpoint: string, token: string, body: any) {
  return authorizedRequest(endpoint, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiDelete(endpoint: string, token: string) {
  return authorizedRequest(endpoint, token, { method: 'DELETE' });
}

/**
 * POST multipart/form-data.
 *
 * IMPORTANT: We use XMLHttpRequest here, NOT the global `fetch`. On Expo SDK 56
 * the global fetch is Expo's WinterCG implementation, whose FormData encoder
 * rejects React Native file parts ({ uri, name, type }) with
 * "Unsupported FormDataPart implementation". RN's XHR uses the native
 * networking module, which DOES support uri-based file parts for uploads.
 * Do NOT set Content-Type manually — RN sets the multipart boundary for us.
 */
export function apiPostForm(endpoint: string, token: string, formData: FormData, isRetry = false): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${endpoint}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.onload = () => {
      const status = xhr.status;
      if (status >= 200 && status < 300) {
        let parsed: any;
        try { parsed = JSON.parse(xhr.responseText); } catch { parsed = xhr.responseText; }
        if (parsed && typeof parsed === 'object' && 'data' in parsed) resolve(parsed.data);
        else resolve(parsed);
        return;
      }
      if (status === 401) {
        if (!isRetry) {
          refreshAccessToken()
            .then((newToken) => apiPostForm(endpoint, newToken, formData, true))
            .then(resolve, reject);
          return;
        }
        reject(new Error('UNAUTHORIZED'));
        return;
      }
      let message = `API request failed: ${status}`;
      try {
        const err = JSON.parse(xhr.responseText);
        const m = err.message ?? message;
        message = Array.isArray(m) ? m[0] : m;
      } catch { /* keep default */ }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.send(formData as any);
  });
}

export async function apiPatch(endpoint: string, token: string, body: any) {
  return authorizedRequest(endpoint, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
