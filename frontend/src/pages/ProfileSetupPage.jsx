import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { useCreateProfileMutation, useGetProfileQuery, useUploadProfileImageMutation } from '../features/api/apiSlice'
import { getClerkDisplayName, getClerkPrimaryEmail } from '../utils/clerk'

const ProfileSetupPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
    const { user: sessionUser } = useUser()
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery()
  const [createProfile, { isLoading: saving }] = useCreateProfileMutation()
  const [uploadProfileImage, { isLoading: uploadingImage }] = useUploadProfileImageMutation()

  const profile = profileData?.user

  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    country: '',
    landmark: '',
    profileImage: '',
  })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: profile?.name || getClerkDisplayName(sessionUser) || '',
      email: profile?.email || getClerkPrimaryEmail(sessionUser) || '',
      address: profile?.address || '',
      city: profile?.city || '',
      country: profile?.country || '',
      landmark: profile?.landmark || '',
      profileImage: profile?.profileImage || '',
    })
  }, [navigate, profile, sessionUser])

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
      if (result.imageUrl) {
        setForm((prev) => ({ ...prev, profileImage: result.imageUrl }))
      }
      toast.success('Profile photo uploaded')
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to upload profile photo')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error('Full name is required')
      return
    }

    if (!form.address.trim()) {
      toast.error('Address is required')
      return
    }

    try {
      await createProfile({
        ...form,
        profileCompleted: true,
      }).unwrap()
      toast.success(profile ? 'Profile updated successfully!' : 'Profile saved successfully!')
      navigate('/account/dashboard', { replace: true })
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to save profile')
    }
  }

  if (profileLoading) {
    return (
      <div className="container-shell py-16">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
          <p className="mt-4 text-sm text-stone-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-shell py-12">
      <Seo title="Complete Your Profile" description="Set up your profile to continue shopping." />

      <div className="mx-auto max-w-lg">
        <div className="rounded-[2.25rem] border border-stone-200 bg-white p-6 sm:p-8">
          <p className="eyebrow">Welcome to Shopzy</p>
          <h1 className="mt-2 font-serif-display text-3xl text-stone-950">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-stone-600">
            Fill in your details to enjoy a seamless shopping experience.
          </p>

          <div className="mt-6 flex items-center gap-4 rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-[#ede8ff]">
              {form.profileImage ? (
                <img src={form.profileImage} alt={form.name || 'Profile'} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-[#6236FF]">{(form.name || 'U').slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Profile photo</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700"
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Photo'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Full Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="field-input"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="field-input"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Address *</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="House no, Street, Area"
                className="field-input min-h-20 resize-none"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">City *</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="field-input"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="field-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Landmark</label>
              <input
                type="text"
                name="landmark"
                value={form.landmark}
                onChange={handleChange}
                placeholder="Nearby landmark (optional)"
                className="field-input"
              />
            </div>

            <button type="submit" className="gold-button w-full justify-center" disabled={saving}>
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfileSetupPage
