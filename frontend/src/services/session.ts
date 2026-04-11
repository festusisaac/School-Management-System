const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';
const SELECTED_CHILD_ID_KEY = 'selected_child_id';
const CHILDREN_LIST_KEY = 'children_list';

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
    localStorage.removeItem(SELECTED_CHILD_ID_KEY);
    localStorage.removeItem(CHILDREN_LIST_KEY);
    sessionStorage.clear();
  },

  getSelectedChildId(): string | null {
    return localStorage.getItem(SELECTED_CHILD_ID_KEY);
  },

  setSelectedChildId(id: string | null) {
    if (id) {
      localStorage.setItem(SELECTED_CHILD_ID_KEY, id);
    } else {
      localStorage.removeItem(SELECTED_CHILD_ID_KEY);
    }
  },

  getChildrenList(): any[] {
    const rawList = localStorage.getItem(CHILDREN_LIST_KEY);
    if (!rawList) return [];
    try {
      return JSON.parse(rawList);
    } catch {
      return [];
    }
  },

  setChildrenList(list: any[]) {
    localStorage.setItem(CHILDREN_LIST_KEY, JSON.stringify(list));
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
