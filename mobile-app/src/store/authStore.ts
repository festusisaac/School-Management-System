import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type UserRole = 'admin' | 'principal' | 'teacher' | 'student' | 'parent' | 'accountant';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  displayRole?: string;
  tenantId: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => {
    set({ user });
    if (user) {
      AsyncStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      AsyncStorage.removeItem('auth_user');
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_user');
    set({ user: null });
  },

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem('auth_user');
      if (stored) {
        set({ user: JSON.parse(stored), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
