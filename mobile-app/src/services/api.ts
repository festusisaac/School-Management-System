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

export async function apiGet(endpoint: string, token: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('UNAUTHORIZED');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API request failed: ${res.status}`);
  }

  const parsed = await res.json();
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return parsed.data;
  }
  return parsed;
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
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('UNAUTHORIZED');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API request failed: ${res.status}`);
  }

  const parsed = await res.json();
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return parsed.data;
  }
  return parsed;
}

export async function apiDelete(endpoint: string, token: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('UNAUTHORIZED');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API request failed: ${res.status}`);
  }

  const parsed = await res.json().catch(() => ({}));
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return parsed.data;
  }
  return parsed;
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
export function apiPostForm(endpoint: string, token: string, formData: FormData): Promise<any> {
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
        useAuthStore.getState().logout();
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
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('UNAUTHORIZED');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API request failed: ${res.status}`);
  }

  const parsed = await res.json();
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return parsed.data;
  }
  return parsed;
}
