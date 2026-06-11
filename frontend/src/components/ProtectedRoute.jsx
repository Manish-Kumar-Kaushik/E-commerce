import { useAuth } from '@clerk/clerk-react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { useGetMyVendorStatusQuery } from '../features/api/apiSlice'
import { readStoredJson, readStoredToken } from '../utils/storage'

const LoadingGate = () => (
  <div className="container-shell py-16">
    <div className="flex flex-col items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      <p className="mt-4 text-sm text-stone-600">Setting up your account...</p>
    </div>
  </div>
)

export const ProtectedRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()
  const backendToken = useSelector((state) => state.auth?.token)
  const jwtToken = readStoredToken()
  const isJwtAuth = !!jwtToken
  const hasBackendAuth = Boolean(backendToken || jwtToken)

  if (!isLoaded) {
    return <LoadingGate />
  }

  if (isSignedIn && !hasBackendAuth) {
    return <LoadingGate />
  }

  if (!isSignedIn && !isJwtAuth) {
    return (
      <Navigate
        to={`/account/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  return children
}

export const AdminRoute = ({ children }) => {
  const token = readStoredToken()
  const user = readStoredJson('user', null)

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  if (user?.role !== 'admin') {
    if (user?.role === 'vendor') {
      return <Navigate to="/vendor" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}

export const VendorRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth()
  const backendToken = useSelector((state) => state.auth?.token)
  const token = readStoredToken()
  const user = readStoredJson('user', null)
  const hasVendorRole = user?.role === 'vendor'
  const {
    data: vendorStatus,
    isLoading: vendorStatusLoading,
    isFetching: vendorStatusFetching,
    error: vendorStatusError,
  } = useGetMyVendorStatusQuery(undefined, {
    skip: !token,
  })

  if (!isLoaded) {
    return <LoadingGate />
  }

  if (isSignedIn && !backendToken && !token) {
    return <LoadingGate />
  }

  if (!token) {
    return <Navigate to="/account/login" replace />
  }

  if (vendorStatusLoading || vendorStatusFetching) {
    return <LoadingGate />
  }

  if (vendorStatusError?.status === 401) {
    return <Navigate to="/account/login" replace />
  }

  if (vendorStatusError && hasVendorRole) {
    return children
  }

  const hasVendorProfile = Boolean(vendorStatus?.hasVendorProfile)

  if (!hasVendorProfile && !hasVendorRole) {
    return <Navigate to="/account/dashboard" replace />
  }

  if (!hasVendorProfile) {
    return <Navigate to="/vendor/register" replace />
  }

  if (vendorStatus?.status !== 'approved') {
    return <Navigate to="/vendor/status" replace />
  }

  return children
}
