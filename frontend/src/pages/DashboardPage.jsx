import { useEffect, useRef, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import {
  useGetProfileQuery,
  useGetOrdersQuery,
  useUpdateProfileMutation,
  useUploadProfileImageMutation,
  useCreateProfileMutation,
  useGetMyVendorStatusQuery,
} from '../features/api/apiSlice'
import { formatDate } from '../utils/formatters'
import { getClerkDisplayName, getClerkPrimaryEmail } from '../utils/clerk'
import OrderTrackingStepper from '../components/OrderTrackingStepper'

const ORDER_STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const normalizeCustomerOrderStatus = (order = {}) => {
  const status = String(order.orderStatus || order.status || '').toLowerCase()
  if (['delivered', 'returned', 'refunded'].includes(status)) return 'delivered'
  if (status === 'shipped') return 'shipped'
  if (['processing', 'packed'].includes(status)) return 'processing'
  if (status === 'confirmed') return 'confirmed'
  if (status === 'cancelled') return 'cancelled'
  if (['created', 'payment_pending', 'paid', 'pending'].includes(status)) return 'pending'
  return 'pending'
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const hasSyncedRef = useRef(false)
  const { isLoaded } = useAuth()
  const { user: clerkUser } = useUser()
  const jwtToken = localStorage.getItem('token')
  const isAuthenticated = Boolean(clerkUser) || Boolean(jwtToken)
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery()
  const { data: ordersData } = useGetOrdersQuery()
  const { data: vendorStatus } = useGetMyVendorStatusQuery()
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation()
  const [uploadProfileImage, { isLoading: uploadingImage }] = useUploadProfileImageMutation()
  const [createProfile] = useCreateProfileMutation()
  const [activeTab, setActiveTab] = useState('orders')
  const [isEditing, setIsEditing] = useState(false)
  const profile = profileData?.user

  useEffect(() => {
    if (vendorStatus?.hasVendorProfile && vendorStatus?.status === 'approved') {
      navigate('/vendor', { replace: true })
    }
  }, [navigate, vendorStatus?.hasVendorProfile, vendorStatus?.status])

  useEffect(() => {
    if (clerkUser && !profileLoading && !profile?.profileCompleted && !hasSyncedRef.current) {
      hasSyncedRef.current = true
      const name = getClerkDisplayName(clerkUser)
      const email = getClerkPrimaryEmail(clerkUser)
      
      if (name || email) {
        createProfile({
          name,
          email,
          profileCompleted: false,
        })
      }
    }
  }, [clerkUser, profileLoading, profile?.profileCompleted, createProfile])

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    landmark: '',
  })

  const syncForm = () => {
    setForm({
      name: profile?.name || getClerkDisplayName(clerkUser) || '',
      email: profile?.email || getClerkPrimaryEmail(clerkUser) || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      city: profile?.city || '',
      country: profile?.country || '',
      landmark: profile?.landmark || '',
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      const result = await uploadProfileImage(formData).unwrap()
      toast.success('Profile image updated')
      if (result.imageUrl) {
        await updateProfile({ profileImage: result.imageUrl }).unwrap()
      }
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to upload image')
    }
  }

  const handleSave = async () => {
    try {
      await updateProfile(form).unwrap()
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update profile')
    }
  }

  if (!isLoaded || profileLoading) {
    return (
      <div className="container-shell py-12">
        <Seo title="My Account" description="Manage your account, orders, and profile." />
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
          <p className="mt-4 text-sm text-stone-600">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container-shell py-12">
        <Seo title="My Account" description="Manage your account, orders, and profile." />
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-serif-display text-3xl text-stone-950">Please Sign In</h1>
          <p className="mt-4 text-stone-600">You need to be signed in to view your dashboard.</p>
          <Link to="/account/login" className="gold-button mt-6 inline-block">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const userName = profile?.name || getClerkDisplayName(clerkUser) || 'Customer'
  const userEmail = profile?.email || getClerkPrimaryEmail(clerkUser) || ''
  const userImage = profile?.profileImage || ''

  return (
    <div className="container-shell py-12">
      <Seo title="My Account" description="Manage your account, orders, and profile." />

      <div className="mx-auto max-w-4xl">
        <div className="surface-panel mb-8 flex flex-col gap-6 rounded-[2.4rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div 
              className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-[#ede8ff] cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {userImage ? (
                <img src={userImage} alt={userName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-[#6236FF]">
                  {userName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-xs text-white">Edit</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </div>
            <div>
              <p className="eyebrow">My Account</p>
              <h1 className="mt-2 font-serif-display text-3xl text-stone-950">{userName}</h1>
              <p className="mt-1 text-sm text-stone-600">{userEmail}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => navigate('/products')} className="ghost-button">
              Continue Shopping
            </button>
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-stone-200">
          {['orders', 'profile'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-3 text-sm uppercase tracking-[0.25em] transition ${
                activeTab === tab
                  ? 'border-b-2 border-stone-900 text-stone-900'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'orders' && (
          <div className="rounded-[2.25rem] border border-stone-200 bg-white p-6 sm:p-8">
            <h2 className="font-serif-display text-2xl text-stone-950">Your Orders</h2>
            {ordersData?.orders?.length > 0 ? (
              <div className="mt-6 space-y-4">
                {ordersData.orders.map((order) => (
                  <div key={order._id} className="rounded-[1.75rem] border border-stone-200 p-5">
                    {(() => {
                      const orderStatus = normalizeCustomerOrderStatus(order)

                      return (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          Order #{order._id.slice(-6).toUpperCase()}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-stone-700">
                          {order.orderStatus}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.25em] ${
                            order.paymentStatus === 'paid'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-amber-300 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                    )
                    })()}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {ORDER_STATUS_STEPS.map((step) => {
                        const currentStatus = normalizeCustomerOrderStatus(order)
                        const isActive = currentStatus === step

                        return (
                          <span
                            key={step}
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                              isActive
                                ? 'border-stone-900 bg-stone-900 text-white'
                                : 'border-stone-200 bg-white text-stone-500'
                            }`}
                          >
                            {step}
                          </span>
                        )
                      })}
                    </div>
                    <div className="mt-4 text-sm text-stone-600">
                      {order.items?.map((item) => (
                        <p key={`${item.product}-${item.size}`} className="mt-1">
                          {item.name} / {item.size} / Qty {item.quantity}
                        </p>
                      ))}
                    </div>
                    <p className="mt-4 text-sm font-semibold text-stone-900">
                      Total Rs. {order.totalAmount}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 py-8 text-center">
                <p className="text-stone-600">No orders yet.</p>
                <Link to="/products" className="gold-button mt-4 inline-block">
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="rounded-[2.25rem] border border-stone-200 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-display text-2xl text-stone-950">Profile Information</h2>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    syncForm()
                    setIsEditing(true)
                  }}
                  className="text-sm text-[#6236FF] hover:text-[#4f2fe3]"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} className="field-input" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className="field-input" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="field-input"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Address</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="field-input min-h-20 resize-none"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">City</label>
                    <input name="city" value={form.city} onChange={handleChange} className="field-input" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Country</label>
                    <input
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className="field-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Landmark</label>
                  <input
                    name="landmark"
                    value={form.landmark}
                    onChange={handleChange}
                    className="field-input"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={handleSave} className="gold-button" disabled={updating}>
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="ghost-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4 text-sm text-stone-700">
                {[
                  ['Name', profile?.name || '-'],
                  ['Email', userEmail || '-'],
                  ['Phone Number', profile?.phone || '-'],
                  ['Address', profile?.address || '-'],
                  ['City', profile?.city || '-'],
                  ['Country', profile?.country || '-'],
                  ['Landmark', profile?.landmark || '-'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-stone-100 py-3">
                    <span className="text-stone-500">{label}</span>
                    <span className="font-medium text-stone-900">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
