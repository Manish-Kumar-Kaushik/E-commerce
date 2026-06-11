import { useState } from 'react'
import toast from 'react-hot-toast'
import { useUpdateAdminEmailMutation, useUpdateAdminPasswordMutation } from '../../features/api/apiSlice'

const ChangePasswordSection = () => {
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [updatePassword, { isLoading: isUpdatingPassword }] = useUpdateAdminPasswordMutation()

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All fields are required')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      }).unwrap()

      toast.success('Password updated successfully')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowPasswordForm(false)
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update password')
    }
  }

  return (
    <div className="border-b border-slate-100 pb-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Password</h3>
          <p className="text-sm text-slate-500 mt-1">Change your password to keep your account secure</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {showPasswordForm ? 'Cancel' : 'Change Password'}
        </button>
      </div>

      {showPasswordForm && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const ChangeEmailSection = ({ currentEmail }) => {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: '',
  })
  const [updateEmail, { isLoading: isUpdatingEmail }] = useUpdateAdminEmailMutation()

  const handleEmailChange = (e) => {
    const { name, value } = e.target
    setEmailForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()

    if (!emailForm.newEmail || !emailForm.password) {
      toast.error('Email and password are required')
      return
    }

    if (emailForm.newEmail === currentEmail) {
      toast.error('New email must be different from current email')
      return
    }

    try {
      await updateEmail({
        newEmail: emailForm.newEmail,
        password: emailForm.password,
      }).unwrap()

      toast.success('Email updated successfully')
      setEmailForm({
        newEmail: '',
        password: '',
      })
      setShowEmailForm(false)
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update email')
    }
  }

  return (
    <div className="border-b border-slate-100 pb-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Email Address</h3>
          <p className="text-sm text-slate-500 mt-1">Current email: {currentEmail}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowEmailForm(!showEmailForm)}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {showEmailForm ? 'Cancel' : 'Change Email'}
        </button>
      </div>

      {showEmailForm && (
        <form onSubmit={handleEmailSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Email Address</label>
            <input
              type="email"
              name="newEmail"
              value={emailForm.newEmail}
              onChange={handleEmailChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter new email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              value={emailForm.password}
              onChange={handleEmailChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your password to confirm"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isUpdatingEmail}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
            >
              {isUpdatingEmail ? 'Updating...' : 'Update Email'}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export const AdminAccountSettings = ({ admin }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Account Security</h2>
        <p className="text-slate-500 mt-1">Manage your email address and password</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <ChangeEmailSection currentEmail={admin?.email} />
        <ChangePasswordSection />
      </div>
    </div>
  )
}
