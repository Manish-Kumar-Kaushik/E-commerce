import { Navigate, useSearchParams } from 'react-router-dom'
import { SignUp, useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import Seo from '../components/Seo'

const RegisterPage = () => {
  const { isLoaded, isSignedIn } = useUser()
  const [searchParams] = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(false)
  const redirectUrl = searchParams.get('redirect') || '/account/profile-setup'
  const signInUrl = `/account/login?redirect=${encodeURIComponent(redirectUrl)}`

  // Check if coming from email verification link
  useEffect(() => {
    if (window.location.search.includes('verify_email')) {
      setIsVerifying(true)
    }
  }, [])

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectUrl} replace />
  }

  if (isVerifying && !isLoaded) {
    return (
      <div className="min-h-screen bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
            <div className="h-8 w-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Email</h2>
          <p className="text-gray-600">Please wait while we verify your email address...</p>
        </div>
      </div>
    )
  }

  const clerkAppearance = {
    baseTheme: 'light',
    elements: {
      rootBox: 'w-full max-w-md',
      card: 'shadow-lg border border-gray-200 rounded-2xl bg-white',
      headerTitle: 'text-3xl font-bold text-gray-900',
      headerSubtitle: 'text-gray-600 text-base mt-3',
      socialButtonsBlockButton: 'border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-800 h-12 rounded-lg font-semibold text-base transition',
      socialButtonsBlockButtonText: 'text-base font-semibold',
      dividerLine: 'bg-gray-200',
      dividerText: 'text-gray-500 text-sm font-medium',
      formFieldLabel: 'text-gray-800 font-semibold text-base',
      formFieldInput: 'border-2 border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition bg-white',
      formButtonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold h-12 rounded-lg text-base transition',
      footerActionLink: 'text-purple-600 hover:text-purple-700 font-semibold',
      footerActionText: 'text-gray-600 text-base',
      formResendCodeLink: 'text-purple-600 hover:text-purple-700 font-semibold',
      otpCodeFieldInput: 'border-2 border-gray-200 rounded-lg text-base',
      alertText: 'text-gray-700 text-sm',
    },
    variables: {
      colorPrimary: '#7c3aed',
      colorSuccess: '#10b981',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorNeutral: '#6b7280',
      colorInputBackground: '#ffffff',
      colorInputBorder: '#e5e7eb',
      colorInputText: '#111827',
      colorText: '#1f2937',
      colorTextSecondary: '#6b7280',
      borderRadius: '0.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '1rem',
    },
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center p-8">
      <Seo title="Create Account" description="Create your Shopzy account." />

      <div className="w-full max-w-md">
        <SignUp
          routing="path"
          path="/account/register"
          signInUrl={signInUrl}
          forceRedirectUrl={redirectUrl}
          fallbackRedirectUrl={redirectUrl}
          appearance={clerkAppearance}
        />
      </div>
    </div>
  )
}

export default RegisterPage