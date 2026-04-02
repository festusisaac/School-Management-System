import { create } from 'zustand'
import axios from 'axios'

interface AuthStore {
  user: any | null
  token: string | null
  setUser: (user: any) => void
  setToken: (token: string) => void
  setRefreshToken: (token: string | null) => void
  refreshUser: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('access_token'),
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
  setToken: (token) => {
    localStorage.setItem('access_token', token)
    set({ token })
  },
  setRefreshToken: (token) => {
    if (token) {
      localStorage.setItem('refresh_token', token)
    } else {
      localStorage.removeItem('refresh_token')
    }
  },
  refreshUser: async () => {
    try {
      const response = await axios.get(`${(import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/auth/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      const userData = response.data.data || response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData });
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.clear()
    set({ user: null, token: null })
  },
}))
