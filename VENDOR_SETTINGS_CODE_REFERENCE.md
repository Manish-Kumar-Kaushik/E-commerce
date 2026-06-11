# 📖 Vendor Settings - Code Reference

## How to Use in Frontend

### 1. Access Settings Page
```jsx
// In VendorDashboardCleanPage.jsx, click Settings tab
// Routes to either:
// - VendorProfileSettings component
// - VendorAccountSettings component
```

### 2. Get Vendor Profile Data
```jsx
import { useGetVendorProfileQuery } from '../../features/api/apiSlice'

const MyComponent = () => {
  const { data: vendorData, isLoading } = useGetVendorProfileQuery()
  
  // Access vendor data
  const businessName = vendorData?.vendor?.businessName
  const businessEmail = vendorData?.vendor?.businessEmail
  const bankDetails = vendorData?.vendor?.bankDetails
}
```

### 3. Update Profile
```jsx
import { useUpdateVendorProfileMutation } from '../../features/api/apiSlice'

const MyComponent = () => {
  const [updateProfile, { isLoading }] = useUpdateVendorProfileMutation()
  
  const handleSave = async () => {
    try {
      await updateProfile({
        businessName: 'New Name',
        businessEmail: 'email@example.com',
        businessPhone: '9876543210',
        businessAddress: {
          line1: '123 Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
        },
        kycDocuments: {
          panCard: 'ABCDE1234F',
          aadharCard: '123456789012',
          gstNumber: '27AABCT1234H1Z0',
        },
      }).unwrap()
      
      toast.success('Profile updated!')
    } catch (error) {
      toast.error('Update failed')
    }
  }
}
```

### 4. Get Bank Details
```jsx
import { useGetVendorBankDetailsQuery } from '../../features/api/apiSlice'

const MyComponent = () => {
  const { data: bankData } = useGetVendorBankDetailsQuery()
  
  const bankName = bankData?.bankDetails?.bankName
  const accountNumber = bankData?.bankDetails?.accountNumber
  const ifscCode = bankData?.bankDetails?.ifscCode
}
```

### 5. Update Bank Details
```jsx
import { useUpdateVendorBankDetailsMutation } from '../../features/api/apiSlice'

const MyComponent = () => {
  const [updateBankDetails, { isLoading }] = useUpdateVendorBankDetailsMutation()
  
  const handleSaveBankDetails = async () => {
    try {
      await updateBankDetails({
        bankName: 'HDFC Bank',
        accountHolderName: 'John Doe',
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        upiId: 'john@hdfc',
      }).unwrap()
      
      toast.success('Bank details saved!')
    } catch (error) {
      toast.error('Failed to save bank details')
    }
  }
}
```

### 6. Withdraw from Wallet
```jsx
import { useWithdrawFromWalletMutation } from '../../features/api/apiSlice'

const MyComponent = () => {
  const [withdrawFromWallet, { isLoading }] = useWithdrawFromWalletMutation()
  
  const handleWithdraw = async (amount) => {
    if (amount <= 0) {
      toast.error('Invalid amount')
      return
    }
    
    try {
      const result = await withdrawFromWallet({ amount }).unwrap()
      
      toast.success(result.message)
      // Message: "Withdrawal of ₹X initiated. Amount will be transferred in 2-3 business days."
    } catch (error) {
      if (error?.data?.message) {
        toast.error(error.data.message)
      } else {
        toast.error('Withdrawal failed')
      }
    }
  }
}
```

---

## Backend API Reference

### GET /api/vendors/bank-details

**Request:**
```bash
curl -X GET http://localhost:5000/api/vendors/bank-details \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "success": true,
  "bankDetails": {
    "bankName": "HDFC Bank",
    "accountHolderName": "John Doe",
    "accountNumber": "123456789012",
    "ifscCode": "HDFC0001234",
    "upiId": "john@hdfc"
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Vendor profile not found"
}
```

---

### PUT /api/vendors/bank-details

**Request:**
```bash
curl -X PUT http://localhost:5000/api/vendors/bank-details \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "bankName": "HDFC Bank",
    "accountHolderName": "John Doe",
    "accountNumber": "123456789012",
    "ifscCode": "HDFC0001234",
    "upiId": "john@hdfc"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bank details updated successfully",
  "bankDetails": {
    "bankName": "HDFC Bank",
    "accountHolderName": "John Doe",
    "accountNumber": "123456789012",
    "ifscCode": "HDFC0001234",
    "upiId": "john@hdfc"
  }
}
```

**Error Responses:**
```json
// 404 - Vendor not found
{
  "success": false,
  "message": "Vendor profile not found"
}

// 400 - Validation error
{
  "success": false,
  "message": "Invalid request",
  "errors": [{
    "param": "ifscCode",
    "msg": "IFSC must be 4 letters + 0 + 6 digits"
  }]
}
```

---

### POST /api/vendors/wallet/withdraw

**Request:**
```bash
curl -X POST http://localhost:5000/api/vendors/wallet/withdraw \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000.00}'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Withdrawal of ₹5000.00 initiated. Amount will be transferred to your bank account within 2-3 business days.",
  "wallet": {
    "balance": 15000.00,
    "lastWithdrawal": "2024-04-16T10:30:00.000Z"
  }
}
```

**Error Responses:**
```json
// 400 - Invalid amount
{
  "success": false,
  "message": "Invalid withdrawal amount"
}

// 404 - Vendor not found
{
  "success": false,
  "message": "Vendor profile not found"
}

// 400 - Incomplete bank details
{
  "success": false,
  "message": "Complete bank details required for withdrawal"
}

// 400 - Insufficient balance
{
  "success": false,
  "message": "Insufficient wallet balance"
}
```

---

## Validation Patterns

```javascript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
console.log(emailRegex.test('user@example.com')) // true

// Phone validation (10 digits)
const phoneRegex = /^\d{10}$/
console.log(phoneRegex.test('9876543210')) // true
console.log(phoneRegex.test('98765432101')) // false (11 digits)

// Pincode validation (6 digits)
const pincodeRegex = /^\d{6}$/
console.log(pincodeRegex.test('400001')) // true

// PAN validation
const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/
console.log(panRegex.test('ABCDE1234F')) // true

// Aadhaar validation (12 digits)
const aadhaarRegex = /^\d{12}$/
console.log(aadhaarRegex.test('123456789012')) // true

// GSTIN validation (Indian format)
const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
console.log(gstinRegex.test('27AABCT1234H1Z0')) // true

// Account number (9-18 digits)
const accountRegex = /^\d{9,18}$/
console.log(accountRegex.test('123456789')) // true
console.log(accountRegex.test('12345')) // false

// IFSC code (4 letters + 0 + 6 digits)
const ifscRegex = /^[A-Z]{4}0\d{6}$/
console.log(ifscRegex.test('HDFC0001234')) // true

// Account holder name (1-50 chars, starts with letter)
const nameRegex = /^[A-Za-z][A-Za-z\s.'-]{0,49}$/
console.log(nameRegex.test('John Doe')) // true
console.log(nameRegex.test('123John')) // false (starts with digit)

// UPI format
const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/
console.log(upiRegex.test('john@hdfc')) // true
console.log(upiRegex.test('user.name@bank')) // true
```

---

## State-City Mapping

```javascript
const STATE_CITY_OPTIONS = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry'],
  Assam: ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon', 'Tezpur'],
  Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Kalaburagi'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut'],
  // ... 20 more states
}

// Usage: Get cities for a state
const citiesInMaharashtra = STATE_CITY_OPTIONS['Maharashtra']
// → ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane']
```

---

## Bank Options

```javascript
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

// Usage: Validate bank selection
const isValidBank = BANK_OPTIONS.includes('HDFC Bank') // true
```

---

## Common Errors & Solutions

### Error: "Complete bank details required for withdrawal"
**Cause**: Missing required bank fields (bankName, accountHolderName, accountNumber, ifscCode)
**Solution**: Edit bank details and fill all required fields, then try withdrawal again

### Error: "Insufficient wallet balance"
**Cause**: Withdrawal amount exceeds available balance
**Solution**: Reduce withdrawal amount to available balance

### Error: "Invalid IFSC code"
**Cause**: IFSC format incorrect (should be 4 letters + 0 + 6 digits)
**Solution**: Check IFSC format - example: HDFC0001234

### Error: "Vendor profile not found"
**Cause**: User has no vendor profile created yet
**Solution**: Complete vendor registration first

### Error: "Authorization failed"
**Cause**: Invalid or expired token
**Solution**: Login again and refresh page

---

## Testing Examples

### Test Profile Update
```javascript
// Complete profile update with all fields
const updateData = {
  businessName: "ABC Electronics",
  businessEmail: "abc@example.com",
  businessPhone: "9876543210",
  businessAddress: {
    line1: "123 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001"
  },
  businessType: "Electronics Retailer",
  kycDocuments: {
    panCard: "ABCDE1234F",
    aadharCard: "123456789012",
    gstNumber: "27AABCT1234H1Z0"
  }
}
```

### Test Bank Update
```javascript
// Valid bank details
const bankData = {
  bankName: "HDFC Bank",
  accountHolderName: "John Doe",
  accountNumber: "123456789012345",
  ifscCode: "HDFC0001234",
  upiId: "john@hdfc"
}

// Invalid examples (should fail)
const invalid1 = {
  // Missing required fields
  bankName: "HDFC Bank",
  // accountHolderName missing
  accountNumber: "123456789012345",
  ifscCode: "HDFC0001234"
}

const invalid2 = {
  bankName: "HDFC Bank",
  accountHolderName: "123John", // starts with number (invalid)
  accountNumber: "123456789012345",
  ifscCode: "HDFC0001234"
}
```

### Test Withdrawal
```javascript
// Valid withdrawal
const withdrawal1 = { amount: 5000.00 } // ✅ Valid

// Invalid withdrawals
const withdrawal2 = { amount: -1000 } // ❌ Negative amount
const withdrawal3 = { amount: 100000 } // ❌ Exceeds balance
const withdrawal4 = { amount: 0 } // ❌ Zero amount
```

---

## Integration with Other Components

### Profile Form Component
```jsx
// How other components can integrate
import VendorProfileSettings from '../components/vendor/VendorProfileSettings'

export const MyPage = () => {
  return (
    <div>
      <h1>Manage Your Shop</h1>
      <VendorProfileSettings />
    </div>
  )
}
```

### Bank Details Component
```jsx
// How other components can integrate
import VendorAccountSettings from '../components/vendor/VendorAccountSettings'

export const MyPage = () => {
  return (
    <div>
      <h1>Banking & Wallet</h1>
      <VendorAccountSettings />
    </div>
  )
}
```

---

## Performance Notes

✅ **Query Caching**: RTK Query caches results automatically
✅ **Lazy Loading**: Components load settings only when needed
✅ **Optimized Rendering**: Only re-render on state changes
✅ **API Calls**: Minimal API calls (one per operation)
✅ **Validation**: Client-side validation reduces unnecessary API calls

---

## Security Checklist

✅ Backend validates all inputs (regex patterns)
✅ Account number masked in display (****1234)
✅ Bank details required before withdrawal
✅ Withdrawal amount validated against balance
✅ Authorization required for all endpoints
✅ No sensitive data logged
✅ Confirmation required for withdrawals
✅ Frontend bypass impossible (backend enforces rules)
