import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

import { Platform } from 'react-native';

let API_BASE = 'http://10.100.142.192:3000/api/v1';

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
 * POST multipart/form-data. Do NOT set Content-Type manually — React Native's
 * fetch sets the correct multipart boundary when the body is a FormData.
 */
export async function apiPostForm(endpoint: string, token: string, formData: FormData) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('UNAUTHORIZED');
    }
    const err = await res.json().catch(() => ({}));
    const message = err.message ?? `API request failed: ${res.status}`;
    throw new Error(Array.isArray(message) ? message[0] : message);
  }

  const parsed = await res.json();
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return parsed.data;
  }
  return parsed;
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
