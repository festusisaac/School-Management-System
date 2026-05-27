import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.apiUrl ?? 'http://192.168.1.100:3000/api/v1';

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

  return res.json();
}

export function getSyncBaseUrl() {
  return API_BASE;
}
