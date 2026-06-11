import { useState, useEffect } from 'react';
import { useGetVendorProfileQuery, useUpdateVendorProfileMutation } from '../../features/api/apiSlice';
import toast from 'react-hot-toast';

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
};

const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\d{10}$/,
  PINCODE_REGEX: /^\d{6}$/,
  PAN_REGEX: /^[A-Z]{5}\d{4}[A-Z]$/,
  AADHAAR_REGEX: /^\d{12}$/,
  GSTIN_REGEX: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
};

export default function VendorProfileSettings() {
  const { data: vendorData, isLoading } = useGetVendorProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateVendorProfileMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    shopAddress: '',
    state: '',
    city: '',
    pincode: '',
    businessType: '',
    panNumber: '',
    aadhaarNumber: '',
    gstNumber: '',
  });

  useEffect(() => {
    if (vendorData?.vendor) {
      const vendor = vendorData.vendor;
      setFormData({
        businessName: vendor.businessName || '',
        businessEmail: vendor.businessEmail || '',
        businessPhone: vendor.businessPhone || '',
        shopAddress: vendor.businessAddress?.line1 || '',
        state: vendor.businessAddress?.state || '',
        city: vendor.businessAddress?.city || '',
        pincode: vendor.businessAddress?.postalCode || '',
        businessType: vendor.businessType || '',
        panNumber: vendor.kycDocuments?.panCard || '',
        aadhaarNumber: vendor.kycDocuments?.aadharCard || '',
        gstNumber: vendor.kycDocuments?.gstNumber || '',
      });
    }
  }, [vendorData]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'businessEmail':
        if (!VALIDATION.EMAIL_REGEX.test(value)) {
          newErrors.businessEmail = 'Invalid email format';
        } else {
          delete newErrors.businessEmail;
        }
        break;
      case 'businessPhone':
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
          newErrors.businessPhone = 'Phone must be 10 digits';
        } else {
          delete newErrors.businessPhone;
        }
        break;
      case 'pincode':
        if (!VALIDATION.PINCODE_REGEX.test(value)) {
          newErrors.pincode = 'Pincode must be 6 digits';
        } else {
          delete newErrors.pincode;
        }
        break;
      case 'panNumber':
        if (value && !VALIDATION.PAN_REGEX.test(value)) {
          newErrors.panNumber = 'PAN format must be like ABCDE1234F';
        } else {
          delete newErrors.panNumber;
        }
        break;
      case 'gstNumber':
        if (value && !VALIDATION.GSTIN_REGEX.test(value)) {
          newErrors.gstNumber = 'Invalid GSTIN format';
        } else {
          delete newErrors.gstNumber;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return !newErrors[name];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Auto-format inputs
    if (name === 'businessPhone' || name === 'pincode') {
      processedValue = value.replace(/\D/g, '');
    }
    if (name === 'panNumber' || name === 'gstNumber') {
      processedValue = value.toUpperCase();
    }
    if (name === 'state') {
      setFormData(prev => ({ ...prev, [name]: processedValue, city: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (name in VALIDATION) {
      validateField(name, processedValue);
    }
  };

  const handleSaveChanges = async () => {
    // Validate all fields
    const fieldsToValidate = [
      'businessEmail',
      'businessPhone',
      'pincode',
      'panNumber',
      'gstNumber',
    ];

    let isValid = true;
    for (const field of fieldsToValidate) {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    }

    if (!isValid) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      await updateProfile({
        businessName: formData.businessName,
        businessEmail: formData.businessEmail,
        businessPhone: formData.businessPhone,
        businessAddress: {
          line1: formData.shopAddress,
          city: formData.city,
          state: formData.state,
          postalCode: formData.pincode,
        },
        businessType: formData.businessType,
        kycDocuments: {
          panCard: formData.panNumber,
          aadharCard: formData.aadhaarNumber,
          gstNumber: formData.gstNumber,
        },
      }).unwrap();

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error?.data?.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading profile...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Shop Profile Settings</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Business Details Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Business Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
            {isEditing ? (
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{formData.businessName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
            {isEditing ? (
              <input
                type="text"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{formData.businessType || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
            {isEditing ? (
              <>
                <input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.businessEmail ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.businessEmail && <p className="text-red-500 text-sm mt-1">{errors.businessEmail}</p>}
              </>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{formData.businessEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone</label>
            {isEditing ? (
              <>
                <input
                  type="tel"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  maxLength="10"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.businessPhone ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.businessPhone && <p className="text-red-500 text-sm mt-1">{errors.businessPhone}</p>}
              </>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{formData.businessPhone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Shop Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
            {isEditing ? (
              <textarea
                name="shopAddress"
                value={formData.shopAddress}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">{formData.shopAddress}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            {isEditing ? (
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Select State</option>
                {Object.keys(STATE_CITY_OPTIONS).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{formData.state}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            {isEditing ? (
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={!formData.state}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select City</option>
                {formData.state && STATE_CITY_OPTIONS[formData.state]?.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{formData.city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength="6"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.pincode ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
              </>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{formData.pincode}</p>
            )}
          </div>
        </div>
      </div>

      {/* KYC Documents Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">KYC Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  maxLength="10"
                  placeholder="ABCDE1234F"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.panNumber ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.panNumber && <p className="text-red-500 text-sm mt-1">{errors.panNumber}</p>}
              </>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{formData.panNumber || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Number</label>
            {isEditing ? (
              <input
                type="text"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={handleChange}
                maxLength="12"
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{formData.aadhaarNumber || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  maxLength="15"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.gstNumber ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.gstNumber && <p className="text-red-500 text-sm mt-1">{errors.gstNumber}</p>}
              </>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{formData.gstNumber || 'N/A'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex gap-4 justify-end">
          <button
            onClick={() => setIsEditing(false)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
