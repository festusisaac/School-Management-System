import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSystem } from '../../context/SystemContext';
import api from '../../services/api';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { settings, getFullUrl } = useSystem();
  const { user, setUser } = useAuthStore();
  
  const [formData, setFormData] = useState<FormData>({
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      let userId = user?.id;
      
      if (!userId) {
        throw new Error("User context lost. Please log in again.");
      }

      await api.patch(`/users/${userId}`, {
        password: formData.newPassword,
        mustChangePassword: false
      })

      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Security Updated!</h1>
            <p className="text-gray-500 mt-2">Your new password is now active. Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    )
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
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-center text-gray-900 leading-tight">
            Set Secure Password
          </h1>
          <p className="text-gray-500 mt-2 text-sm text-center">
            Hello {user?.firstName || 'User'}, please update your credentials to continue.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData((prev: FormData) => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary-500 pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData((prev: FormData) => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.newPassword || !formData.confirmPassword}
            className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 font-bold disabled:opacity-50 transition"
          >
            {loading ? 'Saving...' : 'Secure My Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
