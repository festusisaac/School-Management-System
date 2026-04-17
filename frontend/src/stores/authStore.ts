import { create } from 'zustand'
import axios from 'axios'
import { API_BASE_URL } from '../services/apiConfig'
import { authSession } from '../services/session'

interface AuthStore {
  user: any | null
  token: string | null
  childrenList: any[]
  selectedChildId: string | null
  setUser: (user: any) => void
  setToken: (token: string) => void
  setRefreshToken: (token: string | null) => void
  setChildrenList: (children: any[]) => void
  setSelectedChildId: (id: string | null) => void
  refreshUser: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: authSession.getUser(),
  token: authSession.getAccessToken(),
  childrenList: authSession.getChildrenList(),
  selectedChildId: authSession.getSelectedChildId(),
  setChildrenList: (childrenList) => {
    authSession.setChildrenList(childrenList)
    set({ childrenList })
  },
  setSelectedChildId: (selectedChildId) => {
    authSession.setSelectedChildId(selectedChildId)
    set({ selectedChildId })
  },
  setUser: (user) => {
    authSession.setUser(user)
    set({ user })
  },
  setToken: (token) => {
    authSession.setAccessToken(token)
    set({ token })
  },
  setRefreshToken: (token) => {
    authSession.setRefreshToken(token)
  },
  refreshUser: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authSession.getAccessToken()}`
        }
      });
      
      const userData = response.data.data || response.data;
      authSession.setUser(userData);
      set({ user: userData });
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },
  logout: () => {
    const token = authSession.getAccessToken()
    if (token) {
      axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {}) // Ignore errors, just want to trigger audit log
    }
    authSession.clear()
    set({ user: null, token: null, childrenList: [], selectedChildId: null })
  },
}))
