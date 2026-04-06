import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSystem } from '../../context/SystemContext';
import api from '../../services/api';
import { School, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';


export default function LoginPage() {
  const navigate = useNavigate()
  const { settings, getFullUrl } = useSystem();
  const { setToken, setRefreshToken, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})
  const [showPassword, setShowPassword] = useState(false)

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!formData.email) {
      errors.email = 'Username or Email is required'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await api.post<{ access_token: string; refresh_token: string; user: any }>('/auth/login', formData)
      console.log('Login successful:', response)

      // Store tokens and user info in global state (which also handles localStorage)
      setToken(response.access_token)
      setRefreshToken(response.refresh_token)
      setUser(response.user)

      // Redirect to change password if required, otherwise dashboard
      if (response.user.mustChangePassword) {
        navigate('/change-password', { state: { email: formData.email } })
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('Full error object:', err)
      console.error('Error response:', err.response)
      console.error('Error data:', err.response?.data)

      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed. Please try again.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex flex-col items-center mb-8">
          {settings.primaryLogo ? (
            <img
              src={getFullUrl(settings.primaryLogo)}
              alt="Logo"
              className="w-16 h-16 object-contain mb-4"
            />
          ) : (
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
              <School className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-center text-gray-900 leading-tight">
            {settings.schoolName || 'School Management System'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Welcome back! Please login to your account.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Username / Email
            </label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                }`}
              placeholder="Enter your email or ID"
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring pr-10 ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                  }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 font-bold disabled:opacity-50 transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

      </div>
    </div>
  )
}
