const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export interface AuthSessionUser {
  id?: string;
  role?: string;
  [key: string]: unknown;
}

export const authSession = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setAccessToken(token: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  setRefreshToken(token: string | null) {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
      return;
    }
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getUser<T extends AuthSessionUser = AuthSessionUser>(): T | null {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser) as T;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser(user: unknown) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.clear();
  },
};

export const navigationSession = {
  isOnRoute(pathname: string) {
    return window.location.pathname.includes(pathname);
  },

  redirect(path: string) {
    if (window.location.pathname !== path) {
      window.location.href = path;
    }
  },

  redirectToLogin(reason?: string) {
    const target = reason ? `/login?reason=${encodeURIComponent(reason)}` : '/login';
    this.redirect(target);
  },

  redirectToSetup() {
    this.redirect('/setup');
  },
};
