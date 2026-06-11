import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Seo from '../components/Seo'
import { setCredentials } from '../features/auth/authSlice'
import { useCreateVendorProfileMutation, useSyncUserMutation } from '../features/api/apiSlice'
import { buildClerkSyncPayload, getClerkDisplayName, getClerkPrimaryEmail, getClerkPrimaryPhone } from '../utils/clerk'

const STEPS = [
  { id: 'business', title: 'Business' },
  { id: 'kyc', title: 'KYC' },
  { id: 'bank', title: 'Bank' },
  { id: 'review', title: 'Review' },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\d{10}$/
const PINCODE_REGEX = /^\d{6}$/
const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/
const AADHAAR_REGEX = /^\d{12}$/
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/
const IFSC_REGEX = /^[A-Z]{4}0\d{6}$/
const ACCOUNT_HOLDER_REGEX = /^[A-Za-z][A-Za-z\s.'-]{0,49}$/

const BANK_OPTIONS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Union Bank of India',
  'Canara Bank',
  'Indian Bank',
  'Bank of India',
  'IndusInd Bank',
  'Kotak Mahindra Bank',
  'IDBI Bank',
  'Yes Bank',
  'Federal Bank',
]

const STATE_CITY_OPTIONS = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila'],
  Assam: ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon', 'Tezpur'],
  Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia'],
  Chhattisgarh: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Jagdalpur'],
  Goa: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar'],
  Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Hamirpur'],
  Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Kalaburagi'],
  Kerala: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane'],
  Manipur: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul', 'Kakching'],
  Meghalaya: ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Baghmara', 'Williamnagar'],
  Mizoram: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Saiha'],
  Nagaland: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto'],
  Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  Sikkim: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Singtam'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli'],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahabubnagar'],
  Tripura: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Roorkee', 'Rudrapur', 'Nainital'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kharagpur'],
}

const VendorRegistrationPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [createVendorProfile] = useCreateVendorProfileMutation()
  const [syncUser] = useSyncUserMutation()
  const { user: clerkUser, isLoaded } = useUser()
  const backendToken = useSelector((state) => state.auth?.token)
  const [syncError, setSyncError] = useState('')
  const [syncInProgress, setSyncInProgress] = useState(false)
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const hasBackendAuth = Boolean(backendToken || storedToken)
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Individual',
    businessEmail: '',
    businessPhone: '',
    shopAddress: '',
    city: '',
    state: '',
    pincode: '',
    panNumber: '',
    aadhaarNumber: '',
    gstNumber: '',
    bankAccountHolder: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (!clerkUser) return

    setFormData((prev) => ({
      ...prev,
      businessEmail: getClerkPrimaryEmail(clerkUser),
      businessPhone: getClerkPrimaryPhone(clerkUser),
      businessName: getClerkDisplayName(clerkUser),
    }))
  }, [clerkUser, isLoaded])

  useEffect(() => {
    if (!isLoaded || !clerkUser || hasBackendAuth) {
      return
    }

    let cancelled = false
    let timeoutId

    const ensureBackendAuth = async () => {
      setSyncInProgress(true)

      try {
        timeoutId = window.setTimeout(() => {
          if (!cancelled) {
            setSyncError('Seller account sync is taking longer than expected. You can continue and retry later.')
            setSyncInProgress(false)
          }
        }, 8000)

        const response = await syncUser(buildClerkSyncPayload(clerkUser)).unwrap()

        if (cancelled || !response?.token || !response?.user) {
          return
        }

        window.clearTimeout(timeoutId)
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        dispatch(setCredentials({ token: response.token, user: response.user }))
        setSyncError('')
        setSyncInProgress(false)
      } catch (error) {
        if (!cancelled) {
          window.clearTimeout(timeoutId)
          console.error('Vendor setup auth sync failed:', error)
          setSyncError(error?.data?.message || 'Account sync failed. Please refresh once.')
          setSyncInProgress(false)
        }
      }
    }

    ensureBackendAuth()

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [clerkUser, dispatch, hasBackendAuth, isLoaded, syncUser])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50 py-8 px-4">
        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
          <p className="text-center text-gray-600">Loading seller setup...</p>
        </div>
      </div>
    )
  }

  if (!clerkUser) {
    return <Navigate to="/account/register?redirect=%2Fvendor%2Fregister" replace />
  }

  if (!hasBackendAuth && syncInProgress) {
    return (
      <div className="min-h-screen bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50 py-8 px-4">
        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#6236FF]" />
            <p className="mt-4 text-gray-600">Setting up your seller account...</p>
            {syncError && (
              <>
                <p className="mt-3 text-sm text-red-500">{syncError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-lg bg-[#6236FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f2fe3]"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    let nextValue = value

    if (['businessPhone', 'aadhaarNumber', 'bankAccountNumber', 'pincode'].includes(name)) {
      nextValue = value.replace(/\D/g, '')
    }

    if (name === 'businessPhone') nextValue = nextValue.slice(0, 10)
    if (name === 'aadhaarNumber') nextValue = nextValue.slice(0, 12)
    if (name === 'pincode') nextValue = nextValue.slice(0, 6)
    if (name === 'bankAccountNumber') nextValue = nextValue.slice(0, 18)

    if (['panNumber', 'gstNumber', 'bankIfsc'].includes(name)) {
      nextValue = value.toUpperCase().replace(/\s/g, '')
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: nextValue }

      if (name === 'state') {
        updated.city = ''
      }

      return updated
    })
    setErrors((prev) => ({ ...prev, [name]: '', ...(name === 'state' ? { city: '' } : {}) }))
  }

  const validateStep = (stepNum) => {
    const newErrors = {}

    if (stepNum === 1) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required'
      if (!formData.businessEmail.trim()) newErrors.businessEmail = 'Business email is required'
      else if (!EMAIL_REGEX.test(formData.businessEmail.trim())) newErrors.businessEmail = 'Enter a valid business email'

      if (!formData.businessPhone.trim()) newErrors.businessPhone = 'Phone number is required'
      else if (!PHONE_REGEX.test(formData.businessPhone)) newErrors.businessPhone = 'Phone number must be exactly 10 digits'

      if (!formData.shopAddress.trim()) newErrors.shopAddress = 'Shop address is required'

      if (!formData.state) newErrors.state = 'Please select state'
      else if (!Object.keys(STATE_CITY_OPTIONS).includes(formData.state)) newErrors.state = 'Please select a valid state'

      const availableCities = STATE_CITY_OPTIONS[formData.state] || []
      if (!formData.city) newErrors.city = 'Please select city'
      else if (!availableCities.includes(formData.city)) newErrors.city = 'Please select a valid city for selected state'

      if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required'
      else if (!PINCODE_REGEX.test(formData.pincode)) newErrors.pincode = 'Pincode must be 6 digits'
    }

    if (stepNum === 2) {
      if (!formData.panNumber.trim()) newErrors.panNumber = 'PAN number is required'
      else if (!PAN_REGEX.test(formData.panNumber)) newErrors.panNumber = 'PAN format must be like ABCDE1234F'

      if (!formData.aadhaarNumber.trim()) newErrors.aadhaarNumber = 'Aadhaar number is required'
      else if (!AADHAAR_REGEX.test(formData.aadhaarNumber)) newErrors.aadhaarNumber = 'Aadhaar must be 12 digits only'

      if (!formData.gstNumber.trim()) {
        newErrors.gstNumber = 'GSTIN is required'
      } else if (!GSTIN_REGEX.test(formData.gstNumber)) {
        newErrors.gstNumber = 'GSTIN format is invalid (ex: 22ABCDE1234F1Z5)'
      }
    }

    if (stepNum === 3) {
      if (!formData.bankName) newErrors.bankName = 'Please choose bank name'
      else if (!BANK_OPTIONS.includes(formData.bankName)) newErrors.bankName = 'Please choose a valid bank name'

      if (!formData.bankAccountHolder.trim()) {
        newErrors.bankAccountHolder = 'Account holder name is required'
      } else if (!ACCOUNT_HOLDER_REGEX.test(formData.bankAccountHolder.trim())) {
        newErrors.bankAccountHolder = 'Account holder name must be 1-50 valid characters'
      }

      if (!formData.bankAccountNumber.trim()) {
        newErrors.bankAccountNumber = 'Account number is required'
      } else if (!ACCOUNT_NUMBER_REGEX.test(formData.bankAccountNumber)) {
        newErrors.bankAccountNumber = 'Account number must be 9 to 18 digits'
      }

      if (!formData.bankIfsc.trim()) {
        newErrors.bankIfsc = 'IFSC code is required'
      } else if (!IFSC_REGEX.test(formData.bankIfsc)) {
        newErrors.bankIfsc = 'IFSC must be 11 chars: first 4 letters + 0 + 6 digits'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    for (const stepNum of [1, 2, 3]) {
      if (!validateStep(stepNum)) {
        setStep(stepNum)
        return
      }
    }
    
    setSubmitting(true)
    
    try {
      const response = await createVendorProfile({
        businessName: formData.businessName,
        businessEmail: formData.businessEmail,
        businessPhone: formData.businessPhone,
        businessAddress: {
          line1: formData.shopAddress,
          city: formData.city,
          state: formData.state,
          postalCode: formData.pincode,
        },
        kycDocuments: {
          panCard: formData.panNumber,
          aadharCard: formData.aadhaarNumber,
          gstNumber: formData.gstNumber,
        },
        bankDetails: {
          accountHolderName: formData.bankAccountHolder,
          accountNumber: formData.bankAccountNumber,
          ifscCode: formData.bankIfsc,
          bankName: formData.bankName,
        },
      }).unwrap()
      
      console.log('Vendor profile created:', response)
      toast.success('Registration submitted! Awaiting admin approval.')
      navigate('/vendor/status')
    } catch (error) {
      console.error('Submit error:', error)
      const errorMessage = error?.data?.message || error?.message || ''

      if (errorMessage.toLowerCase().includes('vendor profile already exists')) {
        navigate('/vendor/status')
      } else {
        toast.error(errorMessage || 'Failed to submit registration')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#6236FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6236FF]/20"
  const labelClass = "mb-2 block text-sm font-medium text-gray-700"
  const cityOptions = STATE_CITY_OPTIONS[formData.state] || []

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
            <div>
              <label className={labelClass}>Business Name *</label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className={inputClass} placeholder="Your Shop Name" />
              {errors.businessName && <p className="mt-1 text-sm text-red-500">{errors.businessName}</p>}
            </div>
            <div>
              <label className={labelClass}>Business Type</label>
              <select name="businessType" value={formData.businessType} onChange={handleChange} className={inputClass}>
                <option value="Individual">Individual</option>
                <option value="Company">Company</option>
                <option value="Partnership">Partnership</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Business Email *</label>
              <input type="email" name="businessEmail" value={formData.businessEmail} onChange={handleChange} className={inputClass} placeholder="name@company.com" />
              {errors.businessEmail && <p className="mt-1 text-sm text-red-500">{errors.businessEmail}</p>}
            </div>
            <div>
              <label className={labelClass}>Business Phone *</label>
              <input type="tel" name="businessPhone" value={formData.businessPhone} onChange={handleChange} className={inputClass} placeholder="9876543210" maxLength={10} />
              {errors.businessPhone && <p className="mt-1 text-sm text-red-500">{errors.businessPhone}</p>}
            </div>
            <div>
              <label className={labelClass}>Shop Address *</label>
              <textarea name="shopAddress" value={formData.shopAddress} onChange={handleChange} className={`${inputClass} min-h-20`} placeholder="Full shop address" />
              {errors.shopAddress && <p className="mt-1 text-sm text-red-500">{errors.shopAddress}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>State *</label>
                <select name="state" value={formData.state} onChange={handleChange} className={inputClass}>
                  <option value="">Select State</option>
                  {Object.keys(STATE_CITY_OPTIONS).map((stateName) => (
                    <option key={stateName} value={stateName}>{stateName}</option>
                  ))}
                </select>
                {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
              </div>
              <div>
                <label className={labelClass}>City *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={!formData.state}
                >
                  <option value="">Select City</option>
                  {cityOptions.map((cityName) => (
                    <option key={cityName} value={cityName}>{cityName}</option>
                  ))}
                </select>
                {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
              </div>
            </div>
            <div>
              <label className={labelClass}>Pincode *</label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={inputClass} placeholder="123456" maxLength={6} />
              {errors.pincode && <p className="mt-1 text-sm text-red-500">{errors.pincode}</p>}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">KYC Verification</h3>
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Upload authentic documents. Fake documents will result in rejection.
            </div>
            <div>
              <label className={labelClass}>PAN Number *</label>
              <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className={inputClass} placeholder="ABCDE1234F" maxLength={10} />
              {errors.panNumber && <p className="mt-1 text-sm text-red-500">{errors.panNumber}</p>}
            </div>
            <div>
              <label className={labelClass}>Aadhaar Number *</label>
              <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} className={inputClass} placeholder="12 digit Aadhaar number" maxLength={12} />
              {errors.aadhaarNumber && <p className="mt-1 text-sm text-red-500">{errors.aadhaarNumber}</p>}
            </div>
            <div>
              <label className={labelClass}>GSTIN *</label>
              <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className={inputClass} placeholder="22ABCDE1234F1Z5" maxLength={15} />
              {errors.gstNumber && <p className="mt-1 text-sm text-red-500">{errors.gstNumber}</p>}
              <p className="mt-1 text-xs text-gray-500">Format: 2 digits state code + 10 PAN chars + entity + Z + checksum</p>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              Your bank details are secure and encrypted for receiving payments.
            </div>
            <div>
              <label className={labelClass}>Account Holder Name *</label>
              <input type="text" name="bankAccountHolder" value={formData.bankAccountHolder} onChange={handleChange} className={inputClass} placeholder="As per bank records" maxLength={50} />
              {errors.bankAccountHolder && <p className="mt-1 text-sm text-red-500">{errors.bankAccountHolder}</p>}
            </div>
            <div>
              <label className={labelClass}>Account Number *</label>
              <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className={inputClass} placeholder="9 to 18 digit account number" maxLength={18} />
              {errors.bankAccountNumber && <p className="mt-1 text-sm text-red-500">{errors.bankAccountNumber}</p>}
            </div>
            <div>
              <label className={labelClass}>IFSC Code *</label>
              <input type="text" name="bankIfsc" value={formData.bankIfsc} onChange={handleChange} className={inputClass} placeholder="SBIN0123456" maxLength={11} />
              {errors.bankIfsc && <p className="mt-1 text-sm text-red-500">{errors.bankIfsc}</p>}
            </div>
            <div>
              <label className={labelClass}>Bank Name *</label>
              <select name="bankName" value={formData.bankName} onChange={handleChange} className={inputClass}>
                <option value="">Select Bank</option>
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
              {errors.bankName && <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>}
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-2">Business Details</h4>
              <p className="text-sm text-gray-600">Name: {formData.businessName}</p>
              <p className="text-sm text-gray-600">Type: {formData.businessType}</p>
              <p className="text-sm text-gray-600">Email: {formData.businessEmail}</p>
              <p className="text-sm text-gray-600">Phone: {formData.businessPhone}</p>
              <p className="text-sm text-gray-600">Address: {formData.shopAddress}</p>
              <p className="text-sm text-gray-600">State/City: {formData.state} / {formData.city}</p>
              <p className="text-sm text-gray-600">Pincode: {formData.pincode}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-2">KYC</h4>
              <p className="text-sm text-gray-600">PAN: {formData.panNumber}</p>
              <p className="text-sm text-gray-600">Aadhaar: {formData.aadhaarNumber}</p>
              <p className="text-sm text-gray-600">GSTIN: {formData.gstNumber}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-2">Bank</h4>
              <p className="text-sm text-gray-600">Bank: {formData.bankName}</p>
              <p className="text-sm text-gray-600">Holder: {formData.bankAccountHolder}</p>
              <p className="text-sm text-gray-600">Account: ****{formData.bankAccountNumber?.slice(-4)}</p>
              <p className="text-sm text-gray-600">IFSC: {formData.bankIfsc}</p>
            </div>
            <p className="text-xs text-gray-500">By submitting, you confirm all information is accurate.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50 py-8 px-4">
      <Seo title="Become a Seller" description="Start selling on Shopzy" />
      
      <div className="mx-auto max-w-2xl">
        {!hasBackendAuth && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Seller sync is still connecting in the background. If the button below does not work, refresh once after a few seconds.
            {syncError ? <span className="ml-1 font-medium">{syncError}</span> : null}
          </div>
        )}

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Become a Seller</h1>
          <p className="mt-2 text-gray-600">Complete your seller registration</p>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                i < step - 1
                  ? 'bg-[#6236FF] text-white'
                  : i === step - 1
                    ? 'bg-[#6236FF] text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${i < step - 1 ? 'bg-[#6236FF]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
          {renderStepContent()}

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className={`rounded-xl border border-gray-300 px-6 py-3 font-medium ${step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-[#6236FF] px-8 py-3 font-semibold text-white hover:bg-[#4f2fe3]"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-[#6236FF] px-8 py-3 font-semibold text-white hover:bg-[#4f2fe3] disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VendorRegistrationPage