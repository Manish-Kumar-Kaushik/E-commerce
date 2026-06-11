import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetMyVendorStatusQuery, useGetProfileQuery } from '../features/api/apiSlice'
import Seo from '../components/Seo'
import { Link } from 'react-router-dom'

const VendorStatusPage = () => {
  const navigate = useNavigate()
  const { data: vendorStatus, isLoading: statusLoading, refetch } = useGetMyVendorStatusQuery(undefined, { pollingInterval: 5000 })
  const { data: profileData } = useGetProfileQuery()

  useEffect(() => {
    if (vendorStatus?.hasVendorProfile && vendorStatus?.status === 'approved') {
      navigate('/vendor')
    }
  }, [vendorStatus, navigate])

  if (statusLoading) {
    return (
      <div className="container-shell py-12">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
          <p className="mt-4 text-sm text-stone-600">Loading your status...</p>
        </div>
      </div>
    )
  }

  if (!vendorStatus?.hasVendorProfile) {
    return (
      <div className="container-shell py-12">
        <Seo title="Become a Seller" description="Start selling on Shopzy" />
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-serif-display text-3xl text-stone-950">No Vendor Account</h1>
          <p className="mt-4 text-stone-600">You haven't started your seller application yet.</p>
          <Link to="/vendor/onboarding" className="gold-button mt-6 inline-block">
            Start Selling
          </Link>
        </div>
      </div>
    )
  }

  const status = vendorStatus?.status || 'pending'
  const businessName = vendorStatus?.businessName || 'Your Shop'
  const userName = profileData?.user?.name || 'Seller'

  return (
    <div className="container-shell py-12">
      <Seo title="Seller Account Status" description="Check your seller application status" />

      <div className="mx-auto max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-serif-display text-3xl text-stone-950">Seller Account</h1>
          <p className="mt-2 text-stone-600">{userName}</p>
        </div>

        {status === 'pending' && (
          <div className="rounded-[2.25rem] border border-amber-200 bg-amber-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-amber-900">Under Review</h2>
            <p className="mt-3 text-amber-800">
              Your seller application is being reviewed. This typically takes 24-48 hours.
            </p>
            <div className="mx-auto mt-5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-amber-100">
              <div className="h-full w-2/3 rounded-full bg-amber-500" />
            </div>
            <div className="mt-6 rounded-xl bg-white/60 p-4">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Business:</span> {businessName}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => refetch()}
                className="rounded-full border border-amber-300 px-6 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                Check Again
              </button>
              <Link
                to="/contact"
                className="rounded-full bg-white px-6 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
              >
                Contact Support
              </Link>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="rounded-[2.25rem] border border-red-200 bg-red-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900">Application Rejected</h2>
            <p className="mt-3 text-red-800">
              Your seller application was not approved.
            </p>
            {vendorStatus?.rejectedReason && (
              <div className="mt-4 rounded-xl bg-white/60 p-4">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Reason:</span> {vendorStatus.rejectedReason}
                </p>
              </div>
            )}
            <Link
              to="/vendor/onboarding"
              className="mt-6 inline-block rounded-full bg-red-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Update & Resubmit
            </Link>
            <div className="mt-4">
              <Link to="/contact" className="text-sm font-medium text-red-700 hover:text-red-800">
                Need help? Contact support
              </Link>
            </div>
          </div>
        )}

        {status === 'suspended' && (
          <div className="rounded-[2.25rem] border border-red-200 bg-red-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900">Account Suspended</h2>
            <p className="mt-3 text-red-800">
              Your seller account has been suspended. Please contact support.
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/account/dashboard" className="text-sm text-[#6236FF] hover:text-[#4f2fe3]">
            Back to My Account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default VendorStatusPage
