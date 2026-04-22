import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSystem } from '../../context/SystemContext';
import api from '../../services/api';
import { School, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const PHJC_IMAGE_MODULES = import.meta.glob('../../assets/phjcschool/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const PHJC_CAROUSEL_IMAGES = Object.entries(PHJC_IMAGE_MODULES)
  .sort(([a], [b]) => {
    const getImageNumber = (path: string) => {
      const match = path.match(/image(\d+)\./i)
      return match ? Number(match[1]) : 0
    }
    return getImageNumber(a) - getImageNumber(b)
  })
  .map(([, url]) => url)
  .slice(0, 10)

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [activeSlide, setActiveSlide] = useState(0)
  const carouselImages = PHJC_CAROUSEL_IMAGES

  useEffect(() => {
    const query = new URLSearchParams(location.search)
    const reason = query.get('reason')

    if (reason === 'timeout') {
      setError('Your session timed out due to inactivity. Please log in again.')
      return
    }

    if (reason === 'expired') {
      setError('Your session has expired. Please log in again.')
      return
    }
  }, [location.search])

  useEffect(() => {
    if (carouselImages.length <= 1) return

    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % carouselImages.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [carouselImages.length])

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
    <div className="min-h-[100dvh] w-full bg-slate-900 p-0 lg:p-4 xl:p-6">
      <div className="relative min-h-[100dvh] w-full overflow-hidden lg:mx-auto lg:grid lg:min-h-[calc(100dvh-2rem)] lg:max-w-6xl lg:grid-cols-2 lg:rounded-3xl lg:bg-white lg:shadow-2xl lg:shadow-slate-950/40">
        <div className="fixed inset-0 overflow-hidden lg:hidden">
          {carouselImages.length > 0 ? (
            carouselImages.map((img, index) => (
              <img
                key={`mobile-${img}-${index}`}
                src={img}
                alt={`School view ${index + 1}`}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${activeSlide === index ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                  }`}
              />
            ))
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="relative hidden min-h-full overflow-hidden lg:block">
          {carouselImages.length > 0 ? (
            carouselImages.map((img, index) => (
              <img
                key={`desktop-${img}-${index}`}
                src={img}
                alt={`School view ${index + 1}`}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${activeSlide === index ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                  }`}
              />
            ))
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-300">PHJC School</p>
            <h2 className="mt-2 text-xl font-bold leading-tight sm:text-2xl lg:text-3xl">
              Learning. Faith. Character.
            </h2>
            <p className="mt-2 max-w-md text-xs text-slate-200 sm:text-sm">
              Explore our campus life through images while you sign in to continue.
            </p>
            {carouselImages.length > 1 && (
              <div className="mt-4 hidden items-center gap-2 sm:flex">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`h-2 rounded-full transition-all ${activeSlide === index ? 'w-8 bg-white' : 'w-2 bg-white/45'
                      }`}
                    aria-label={`Show image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center px-3 py-4 sm:px-5 sm:py-6 lg:min-h-0 lg:items-center lg:bg-gradient-to-br lg:from-slate-50 lg:to-white lg:px-10">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-none overflow-y-auto rounded-3xl bg-white/95 p-5 shadow-2xl ring-1 ring-white/60 backdrop-blur-md sm:max-h-[calc(100dvh-2.5rem)] sm:w-[min(100%,32rem)] sm:p-8 lg:max-h-none lg:max-w-md lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0 lg:backdrop-blur-0">
            <div className="mb-6 flex flex-col items-center sm:mb-8">
              {settings.primaryLogo ? (
                <img
                  src={getFullUrl(settings.primaryLogo)}
                  alt="Logo"
                  className="mb-4 h-16 w-16 rounded-2xl object-contain shadow-sm"
                />
              ) : (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-500/30">
                  <School className="h-8 w-8 text-white" />
                </div>
              )}
              <h1 className="max-w-[320px] text-center text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {settings.schoolName || 'School Management System'}
              </h1>
              <p className="mt-2 text-center text-sm text-slate-500 sm:text-base">
                Welcome back. Sign in to your account.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Username / Email
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${validationErrors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-primary-200'
                    }`}
                  placeholder="Enter your email or ID"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${validationErrors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-primary-200'
                      }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary-600 py-2.5 font-bold text-white transition hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
