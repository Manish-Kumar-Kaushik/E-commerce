import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Seo from '../components/Seo'
import {
  useRequestPasswordResetOtpMutation,
  useResetPasswordWithOtpMutation,
  useVerifyPasswordResetOtpMutation,
} from '../features/api/apiSlice'

const ForgotPasswordPage = () => {
  const [requestOtp, { isLoading: isRequestingOtp }] = useRequestPasswordResetOtpMutation()
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyPasswordResetOtpMutation()
  const [resetPassword, { isLoading: isResettingPassword }] = useResetPasswordWithOtpMutation()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    identifier: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSuccess, setIsSuccess] = useState(false)

  const handleRequestOtp = async (event) => {
    event.preventDefault()

    if (!formData.identifier.trim()) {
      return toast.error('Please enter email or phone number')
    }

    try {
      await requestOtp({
        identifier: formData.identifier.trim(),
      }).unwrap()

      setFormData((prev) => ({
        ...prev,
        otp: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setStep(2)
      toast.success('OTP sent successfully')
    } catch (error) {
      const detailMessage = error?.data?.details?.[0]?.message
      toast.error(detailMessage || error?.data?.message || 'Failed to send OTP')
    }
  }

  const handleResendOtp = async () => {
    if (!formData.identifier.trim()) {
      return toast.error('Please enter email or phone number')
    }

    try {
      await requestOtp({
        identifier: formData.identifier.trim(),
      }).unwrap()

      setFormData((prev) => ({
        ...prev,
        otp: '',
      }))
      setStep(2)
      toast.success('OTP resent successfully')
    } catch (error) {
      const detailMessage = error?.data?.details?.[0]?.message
      toast.error(detailMessage || error?.data?.message || 'Failed to resend OTP')
    }
  }

  const handleChangeEmail = () => {
    setFormData({
      identifier: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
    })
    setStep(1)
  }

  const handleVerifyOtp = async (event) => {
    event.preventDefault()

    if (!formData.otp.trim()) {
      return toast.error('Please enter OTP')
    }

    if (!/^\d{6}$/.test(formData.otp.trim())) {
      return toast.error('Please enter a valid 6-digit OTP')
    }

    try {
      await verifyOtp({
        identifier: formData.identifier.trim(),
        otp: formData.otp.trim(),
      }).unwrap()

      setFormData((prev) => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }))
      setStep(3)
      toast.success('OTP verified successfully')
    } catch (error) {
      const detailMessage = error?.data?.details?.[0]?.message
      toast.error(detailMessage || error?.data?.message || 'Invalid OTP')
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()

    if (!formData.newPassword) {
      return toast.error('Please enter new password')
    }

    if (formData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long')
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match')
    }

    try {
      await resetPassword({
        identifier: formData.identifier.trim(),
        otp: formData.otp.trim(),
        newPassword: formData.newPassword,
      }).unwrap()

      setIsSuccess(true)
      toast.success('Password reset successful')
    } catch (error) {
      const detailMessage = error?.data?.details?.[0]?.message
      toast.error(detailMessage || error?.data?.message || 'Failed to reset password')
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (isSuccess) {
    return (
      <div className="container-shell py-16">
        <Seo title="Password Reset" description="Password reset completed." />
        <div className="mx-auto max-w-md rounded-[2.25rem] border border-stone-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-serif-display mt-2 text-3xl text-stone-950">Password Updated</h1>
          <p className="mt-4 text-stone-600">
            Your password has been changed successfully.
          </p>
          <p className="mt-3 text-sm text-stone-500">
            You can now login using your new password.
          </p>
          <p className="mt-3 text-sm text-stone-500">
            Need to reset again?{' '}
            <button 
              onClick={() => setIsSuccess(false)} 
              className="text-stone-800 underline hover:text-stone-600"
            >
              try again
            </button>
          </p>
          <Link 
            to="/account/login" 
            className="mt-6 inline-block text-sm text-stone-500 hover:text-stone-800"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-shell py-16">
      <Seo title="Forgot Password" description="Reset your password." />
      <div className="mx-auto max-w-md rounded-[2.25rem] border border-stone-200 bg-white p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Account</p>
        <h1 className="font-serif-display mt-2 text-4xl text-stone-950">Forgot Password?</h1>
        {step === 1 && (
          <p className="mt-3 text-stone-600">
            Enter your email or phone number to receive an OTP.
          </p>
        )}
        {step === 2 && (
          <p className="mt-3 text-stone-600">
            Enter the 6-digit OTP sent to your registered email.
          </p>
        )}
        {step === 3 && (
          <p className="mt-3 text-stone-600">
            OTP verified for <span className="font-medium text-stone-900">{formData.identifier}</span>. Now set your new password.
          </p>
        )}

        <p className="mt-2 text-xs text-stone-500">
          Step {step} of 3
        </p>
        
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
            <input 
              type="text"
              name="identifier"
              placeholder="Email or phone number"
              className="field-input" 
              value={formData.identifier}
              onChange={handleChange}
              required 
            />
            <button 
              type="submit" 
              className="gold-button w-full justify-center"
              disabled={isRequestingOtp}
            >
              {isRequestingOtp ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <input 
              type="text"
              name="identifier"
              placeholder="Email or phone number"
              className="field-input" 
              value={formData.identifier}
              onChange={handleChange}
              required 
              readOnly
            />
            <input 
              type="text"
              name="otp"
              placeholder="Enter 6-digit OTP"
              className="field-input" 
              value={formData.otp}
              onChange={handleChange}
              required 
              inputMode="numeric"
              maxLength={6}
            />
            <button 
              type="submit" 
              className="gold-button w-full justify-center"
              disabled={isVerifyingOtp}
            >
              {isVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP'}
            </button>
            <div className="flex flex-col gap-2 pt-2 text-center">
              <button
                type="button"
                className="text-sm text-stone-600 underline hover:text-stone-800"
                onClick={handleResendOtp}
                disabled={isRequestingOtp}
              >
                {isRequestingOtp ? 'Resending...' : 'Resend OTP'}
              </button>
              <button
                type="button"
                className="text-sm text-stone-600 underline hover:text-stone-800"
                onClick={handleChangeEmail}
              >
                Change email / phone
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            <input 
              type="password"
              name="newPassword"
              placeholder="New password"
              className="field-input" 
              value={formData.newPassword}
              onChange={handleChange}
              required 
            />
            <input 
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              className="field-input" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
            <button 
              type="submit" 
              className="gold-button w-full justify-center"
              disabled={isResettingPassword}
            >
              {isResettingPassword ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step !== 1 && (
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-stone-500 hover:text-stone-800"
              onClick={() => {
                if (step === 2) {
                  handleChangeEmail()
                  return
                }

                setStep(step - 1)
              }}
            >
              ← Back
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link 
            to="/account/login" 
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage