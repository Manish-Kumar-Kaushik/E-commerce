import { useState, useEffect } from 'react';
import { useGetVendorBankDetailsQuery, useUpdateVendorBankDetailsMutation, useGetVendorWalletQuery, useWithdrawFromWalletMutation } from '../../features/api/apiSlice';
import toast from 'react-hot-toast';

const BANK_OPTIONS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Punjab National Bank', 'Bank of Baroda', 'Union Bank of India',
  'Canara Bank', 'Indian Bank', 'Bank of India', 'IndusInd Bank',
  'Kotak Mahindra Bank', 'IDBI Bank', 'Yes Bank', 'Federal Bank',
];

const VALIDATION = {
  ACCOUNT_HOLDER_REGEX: /^[A-Za-z][A-Za-z\s.'-]{0,49}$/,
  ACCOUNT_NUMBER_REGEX: /^\d{9,18}$/,
  IFSC_REGEX: /^[A-Z]{4}0\d{6}$/,
  UPI_REGEX: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/,
};

export default function VendorAccountSettings() {
  const { data: bankData, isLoading: isLoadingBank } = useGetVendorBankDetailsQuery();
  const { data: walletData, isLoading: isLoadingWallet } = useGetVendorWalletQuery();
  const [updateBankDetails, { isLoading: isSavingBank }] = useUpdateVendorBankDetailsMutation();
  const [withdrawFromWallet, { isLoading: isWithdrawing }] = useWithdrawFromWalletMutation();

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isWithdrawing2, setIsWithdrawing2] = useState(false);
  const [errors, setErrors] = useState({});
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });

  useEffect(() => {
    if (bankData?.bankDetails) {
      setBankFormData({
        bankName: bankData.bankDetails.bankName || '',
        accountHolderName: bankData.bankDetails.accountHolderName || '',
        accountNumber: bankData.bankDetails.accountNumber || '',
        ifscCode: bankData.bankDetails.ifscCode || '',
        upiId: bankData.bankDetails.upiId || '',
      });
    }
  }, [bankData]);

  const validateBankField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'bankName':
        if (!BANK_OPTIONS.includes(value)) {
          newErrors.bankName = 'Please select a valid bank';
        } else {
          delete newErrors.bankName;
        }
        break;
      case 'accountHolderName':
        if (!VALIDATION.ACCOUNT_HOLDER_REGEX.test(value)) {
          newErrors.accountHolderName = 'Name must be 1-50 characters, starting with letter';
        } else {
          delete newErrors.accountHolderName;
        }
        break;
      case 'accountNumber':
        if (!VALIDATION.ACCOUNT_NUMBER_REGEX.test(value.replace(/\D/g, ''))) {
          newErrors.accountNumber = 'Account number must be 9-18 digits';
        } else {
          delete newErrors.accountNumber;
        }
        break;
      case 'ifscCode':
        if (value && !VALIDATION.IFSC_REGEX.test(value)) {
          newErrors.ifscCode = 'IFSC must be 4 letters + 0 + 6 digits';
        } else {
          delete newErrors.ifscCode;
        }
        break;
      case 'upiId':
        if (value && !VALIDATION.UPI_REGEX.test(value)) {
          newErrors.upiId = 'Invalid UPI format (e.g., user@bank)';
        } else {
          delete newErrors.upiId;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[name];
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'accountNumber') {
      processedValue = value.replace(/\D/g, '');
    }
    if (name === 'ifscCode') {
      processedValue = value.toUpperCase();
    }

    setBankFormData(prev => ({ ...prev, [name]: processedValue }));
    validateBankField(name, processedValue);
  };

  const handleSaveBankDetails = async () => {
    const fieldsToValidate = ['bankName', 'accountHolderName', 'accountNumber', 'ifscCode'];
    let isValid = true;

    for (const field of fieldsToValidate) {
      if (!validateBankField(field, bankFormData[field])) {
        isValid = false;
      }
    }

    if (!isValid) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      await updateBankDetails({
        bankName: bankFormData.bankName,
        accountHolderName: bankFormData.accountHolderName,
        accountNumber: bankFormData.accountNumber,
        ifscCode: bankFormData.ifscCode,
        upiId: bankFormData.upiId,
      }).unwrap();

      toast.success('Bank details updated successfully!');
      setIsEditingBank(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error?.data?.message || 'Failed to update bank details');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const walletBalance = walletData?.wallet?.balance || 0;

    if (!amount || amount <= 0) {
      toast.error('Please enter valid amount');
      return;
    }

    if (amount > walletBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    try {
      await withdrawFromWallet({ amount }).unwrap();
      toast.success(`₹${amount.toFixed(2)} withdrawal initiated! Check your bank account within 2-3 business days.`);
      setWithdrawAmount('');
      setIsWithdrawing2(false);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(error?.data?.message || 'Withdrawal failed');
    }
  };

  if (isLoadingBank || isLoadingWallet) {
    return <div className="p-6 text-center">Loading account settings...</div>;
  }

  const walletBalance = walletData?.wallet?.balance || 0;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg space-y-8">
      {/* Wallet Section */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">💰 Wallet Balance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-gray-600 mb-2">Available Balance</p>
            <p className="text-4xl font-bold text-green-600">₹{walletBalance.toFixed(2)}</p>
          </div>
          
          {walletBalance > 0 && (
            <div>
              {!isWithdrawing2 ? (
                <button
                  onClick={() => setIsWithdrawing2(true)}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Withdraw to Bank Account
                </button>
              ) : (
                <div className="bg-white p-4 rounded-lg space-y-4">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    max={walletBalance}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  />
                  <p className="text-xs text-gray-600">Max: ₹{walletBalance.toFixed(2)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsWithdrawing2(false);
                        setWithdrawAmount('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleWithdraw}
                      disabled={isWithdrawing}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isWithdrawing ? 'Processing...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Bank Account Details</h2>
          {!isEditingBank && (
            <button
              onClick={() => setIsEditingBank(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Details
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
            {isEditingBank ? (
              <>
                <select
                  name="bankName"
                  value={bankFormData.bankName}
                  onChange={handleBankChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.bankName ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                >
                  <option value="">Select Bank</option>
                  {BANK_OPTIONS.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
                {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
              </>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{bankFormData.bankName || 'Not provided'}</p>
            )}
          </div>

          {/* Account Holder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
            {isEditingBank ? (
              <>
                <input
                  type="text"
                  name="accountHolderName"
                  value={bankFormData.accountHolderName}
                  onChange={handleBankChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.accountHolderName ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.accountHolderName && <p className="text-red-500 text-sm mt-1">{errors.accountHolderName}</p>}
              </>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{bankFormData.accountHolderName || 'Not provided'}</p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
            {isEditingBank ? (
              <>
                <input
                  type="text"
                  name="accountNumber"
                  value={bankFormData.accountNumber}
                  onChange={handleBankChange}
                  maxLength="18"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.accountNumber ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
              </>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                {bankFormData.accountNumber ? `****${bankFormData.accountNumber.slice(-4)}` : 'Not provided'}
              </p>
            )}
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
            {isEditingBank ? (
              <>
                <input
                  type="text"
                  name="ifscCode"
                  value={bankFormData.ifscCode}
                  onChange={handleBankChange}
                  maxLength="11"
                  placeholder="SBIN0001234"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.ifscCode ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.ifscCode && <p className="text-red-500 text-sm mt-1">{errors.ifscCode}</p>}
              </>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{bankFormData.ifscCode || 'Not provided'}</p>
            )}
          </div>

          {/* UPI ID */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID (Optional)</label>
            {isEditingBank ? (
              <>
                <input
                  type="text"
                  name="upiId"
                  value={bankFormData.upiId}
                  onChange={handleBankChange}
                  placeholder="yourname@bankname"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                    errors.upiId ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.upiId && <p className="text-red-500 text-sm mt-1">{errors.upiId}</p>}
              </>
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{bankFormData.upiId || 'Not provided'}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditingBank && (
          <div className="flex gap-4 justify-end mt-6">
            <button
              onClick={() => setIsEditingBank(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBankDetails}
              disabled={isSavingBank}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSavingBank ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Note:</strong> When you withdraw money from your wallet, it will be transferred to the bank account details provided above within 2-3 business days.
        </p>
      </div>
    </div>
  );
}
