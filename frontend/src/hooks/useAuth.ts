import { useCallback } from 'react'
import { useAuthStore } from '@stores/authStore'
import apiService from '@services/api'

export const useAuth = () => {
  const { user, token, setUser, setToken, setRefreshToken, logout } = useAuthStore()

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response: any = await apiService.post('/auth/login', {
          email,
          password,
        })
        // apiService.post already returns response.data from axios
        const { access_token, refresh_token, user } = response

        // Persist tokens and user
        setToken(access_token)
        setRefreshToken(refresh_token)
        setUser(user)

        return response
      } catch (error) {
        throw error
      }
    },
    [setToken, setRefreshToken, setUser],
  )

  const register = useCallback(
    async (data: any) => {
      try {
        const response: any = await apiService.post('/auth/register', data)
        return response.data
      } catch (error) {
        throw error
      }
    },
    [],
  )

  return {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  }
}
