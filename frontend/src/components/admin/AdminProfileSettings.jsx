import { useState } from 'react'
import toast from 'react-hot-toast'
import { useUpdateAdminProfileMutation, useUploadProductImagesMutation } from '../../features/api/apiSlice'

export const AdminProfileSettings = ({ admin, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: admin?.name || '',
    phone: admin?.phone || '',
  })
  const [profileImage, setProfileImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(admin?.profileImageUrl || null)
  
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateAdminProfileMutation()
  const [uploadImages] = useUploadProductImagesMutation()

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()

    if (!profileForm.name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      let uploadedImageUrl = admin?.profileImageUrl
      let uploadedImageId = admin?.profileImage

      // Upload image if new one was selected
      if (profileImage) {
        const formData = new FormData()
        formData.append('file', profileImage)
        formData.append('folder', 'admin-profiles')

        try {
          const response = await uploadImages(formData).unwrap()
          if (response?.images?.[0]) {
            uploadedImageUrl = response.images[0].url
            uploadedImageId = response.images[0].publicId
          }
        } catch (uploadError) {
          toast.error('Failed to upload profile photo')
          return
        }
      }

      // Update profile
      await updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        profileImage: uploadedImageId,
        profileImageUrl: uploadedImageUrl,
      }).unwrap()

      toast.success('Profile updated successfully')
      setIsEditing(false)
      setProfileImage(null)
      onProfileUpdate?.()
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update profile')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setProfileForm({
      name: admin?.name || '',
      phone: admin?.phone || '',
    })
    setProfileImage(null)
    setImagePreview(admin?.profileImageUrl || null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Profile Information</h2>
        <p className="text-slate-500 mt-1">Update your personal details and profile photo</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-6">
        {!isEditing ? (
          <div className="space-y-6">
            {/* Profile Photo Display */}
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover bg-slate-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                    {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Profile Photo</p>
                  <p className="text-slate-900 font-medium">{admin?.name}</p>
                  <p className="text-sm text-slate-500">{admin?.email}</p>
                </div>
              </div>
            </div>

            {/* Info Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div>
                <label className="text-sm font-medium text-slate-500">Full Name</label>
                <p className="mt-1 text-slate-900">{admin?.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Phone Number</label>
                <p className="mt-1 text-slate-900">{admin?.phone || 'Not set'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Profile Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Profile Photo</label>
              <div className="flex items-end gap-6">
                <div className="shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile Preview"
                      className="w-24 h-24 rounded-full object-cover bg-slate-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-2xl">
                      {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
