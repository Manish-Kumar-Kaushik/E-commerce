import { useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { useAdminLoginMutation } from '../features/api/apiSlice'
import { setCredentials } from '../features/auth/authSlice'

const FIXED_ADMIN_EMAIL = 'admin@example.com'
const FIXED_ADMIN_PASSWORD = 'admin123'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [adminLogin, { isLoading }] = useAdminLoginMutation()
  const [form, setForm] = useState({ email: FIXED_ADMIN_EMAIL, password: FIXED_ADMIN_PASSWORD })
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.email || !form.password) {
      setError('Please enter email and password')
      return
    }

    if (form.email !== FIXED_ADMIN_EMAIL || form.password !== FIXED_ADMIN_PASSWORD) {
      setError('Use fixed admin credentials only')
      return
    }

    try {
      const response = await adminLogin(form).unwrap()
      const { token, user } = response

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      dispatch(setCredentials({ token, user }))

      toast.success(`Welcome, ${user.name || 'Admin'}!`)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err?.data?.message || 'Invalid admin credentials')
    }
  }

  return (
    <div className="container-shell py-12">
      <Seo title="Admin Login" description="Sign in to access Shopzy admin dashboard." />

      <div className="mx-auto max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif-display text-3xl text-stone-950">Admin Login</h1>
          <p className="mt-2 text-stone-600">Sign in to access the admin dashboard</p>
        </div>

        <div className="rounded-[2.25rem] bg-white p-6 sm:p-8 border border-stone-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder={FIXED_ADMIN_EMAIL}
                className="field-input"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter admin password"
                className="field-input"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="gold-button w-full justify-center" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Admin Sign In'}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-stone-50 px-4 py-3">
            <p className="text-xs text-stone-500">
              <span className="font-medium">Fixed credentials:</span>
              <br />
              Email: {FIXED_ADMIN_EMAIL}
              <br />
              Password: {FIXED_ADMIN_PASSWORD}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-stone-600">
          Customer login?{' '}
          <Link to="/account/login" className="font-semibold text-[#6236FF] hover:text-[#4f2fe3]">
            Open customer login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default AdminLoginPage
