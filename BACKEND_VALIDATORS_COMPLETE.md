# ✅ Backend Vendor Validators - Implementation Complete

## Summary
Backend-side validators have been successfully implemented with the exact same regex patterns as the frontend. This prevents any potential bypass attacks.

---

## Files Modified

### 1. `/backend/src/middleware/validators.js`
**Added**: `createVendorProfileValidator` export (lines 283-401)
- Includes all 14 validation rules
- Bank list with 15 major Indian banks
- State-city mapping for 28 Indian states × 6 cities each
- Custom validators for state-city dependency
- Custom validators for bank name existence

**Validation Rules Implemented:**

```javascript
export const createVendorProfileValidator = [
  // Business Details (7 validations)
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required'),
    
  body('businessEmail')
    .trim()
    .notEmpty()
    .withMessage('Business email is required')
    .isEmail()
    .withMessage('Valid business email is required'),
    
  body('businessPhone')
    .trim()
    .notEmpty()
    .withMessage('Business phone is required')
    .matches(/^\d{10}$/)
    .withMessage('Phone must be exactly 10 digits'),
    
  body('businessAddress')
    .trim()
    .notEmpty()
    .withMessage('Shop address is required'),
    
  body('businessAddress.city')
    .trim()
    .notEmpty()
    .custom((value, { req }) => {
      const state = req.body.businessAddress?.state;
      if (state && STATE_CITY_OPTIONS[state]) {
        if (!STATE_CITY_OPTIONS[state].includes(value)) {
          throw new Error(`City must be valid for selected state ${state}`);
        }
      }
      return true;
    }),
    
  body('businessAddress.state')
    .trim()
    .notEmpty()
    .custom((value) => {
      if (!Object.keys(STATE_CITY_OPTIONS).includes(value)) {
        throw new Error('Please select a valid state from the list');
      }
      return true;
    }),
    
  body('businessAddress.postalCode')
    .trim()
    .notEmpty()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be exactly 6 digits'),

  // KYC Documents (3 validations)
  body('kycDocuments.panCard')
    .trim()
    .notEmpty()
    .matches(/^[A-Z]{5}\d{4}[A-Z]$/)
    .withMessage('PAN format must be like ABCDE1234F'),
    
  body('kycDocuments.aadharCard')
    .trim()
    .notEmpty()
    .matches(/^\d{12}$/)
    .withMessage('Aadhaar must be exactly 12 digits only'),
    
  body('kycDocuments.gstNumber')
    .trim()
    .notEmpty()
    .matches(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
    .withMessage('GSTIN format is invalid (ex: 22ABCDE1234F1Z5)'),

  // Bank Details (4 validations)
  body('bankDetails.bankName')
    .trim()
    .notEmpty()
    .custom((value) => {
      if (!BANK_OPTIONS.includes(value)) {
        throw new Error(`Bank must be one of: ${BANK_OPTIONS.join(', ')}`);
      }
      return true;
    }),
    
  body('bankDetails.accountHolderName')
    .trim()
    .notEmpty()
    .matches(/^[A-Za-z][A-Za-z\s.'-]{0,49}$/)
    .withMessage('Account holder name must be 1-50 valid characters'),
    
  body('bankDetails.accountNumber')
    .trim()
    .notEmpty()
    .matches(/^\d{9,18}$/)
    .withMessage('Account number must be 9 to 18 digits'),
    
  body('bankDetails.ifscCode')
    .trim()
    .notEmpty()
    .matches(/^[A-Z]{4}0\d{6}$/)
    .withMessage('IFSC must be 11 chars: first 4 letters + 0 + 6 digits'),
]
```

### 2. `/backend/src/routes/vendorRoutes.js`
**Modified**: Lines 19-24 and Line 33

**Change 1**: Added import
```javascript
import {
  mongoIdParamValidator,
  orderStatusValidator,
  requestVendorPhoneOtpValidator,
  verifyVendorPhoneOtpValidator,
  createVendorProfileValidator,  // ← NEW
} from '../middleware/validators.js';
```

**Change 2**: Applied validator to route
```javascript
// BEFORE
router.post('/register', protectWithOptionalAuth, async (req, res, next) => {

// AFTER
router.post('/register', createVendorProfileValidator, validate, protectWithOptionalAuth, async (req, res, next) => {
```

---

## Regex Pattern Alignment

| Field | Frontend Pattern | Backend Pattern | Status |
|-------|---|---|---|
| **businessPhone** | `/^\d{10}$/` | `/^\d{10}$/` | ✅ Identical |
| **panCard** | `/^[A-Z]{5}\d{4}[A-Z]$/` | `/^[A-Z]{5}\d{4}[A-Z]$/` | ✅ Identical |
| **aadharCard** | `/^\d{12}$/` | `/^\d{12}$/` | ✅ Identical |
| **gstNumber** | `/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/` | `/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/` | ✅ Identical |
| **accountNumber** | `/^\d{9,18}$/` | `/^\d{9,18}$/` | ✅ Identical |
| **ifscCode** | `/^[A-Z]{4}0\d{6}$/` | `/^[A-Z]{4}0\d{6}$/` | ✅ Identical |
| **accountHolderName** | `/^[A-Za-z][A-Za-z\s.'-]{0,49}$/` | `/^[A-Za-z][A-Za-z\s.'-]{0,49}$/` | ✅ Identical |
| **postalCode** | `/^\d{6}$/` | `/^\d{6}$/` | ✅ Identical |
| **businessEmail** | Email regex | `isEmail()` helper | ✅ Compatible |
| **state** | 28-state list | 28-state list | ✅ Identical |
| **city** | State-dependent | State-dependent custom | ✅ Identical |
| **bankName** | 15-bank list | 15-bank list | ✅ Identical |

---

## Security Validation Flow

```
User submits vendor registration form
         ↓
Frontend validates all fields with regex
         ↓
If frontend validation fails → Show error, block submission
         ↓
If frontend validation passes → Send API request
         ↓
Backend receives POST /api/vendors/register
         ↓
createVendorProfileValidator middleware executes
         ↓
Validates all 14 fields with identical regex patterns
         ↓
If backend validation fails → Return 400 with error details
         ↓
If backend validation passes → Controller processes request
         ↓
Vendor data saved to MongoDB
```

---

## Example Error Responses

### Invalid Phone (11 digits)
```javascript
POST /api/vendors/register
{
  businessPhone: "98765432101"  // 11 digits instead of 10
}

Response (400):
{
  "success": false,
  "errors": [
    {
      "msg": "Phone must be exactly 10 digits",
      "param": "businessPhone",
      "location": "body"
    }
  ]
}
```

### Invalid PAN Format
```javascript
{
  panCard: "ABCD1234E"  // Wrong format, should be ABCDE1234F
}

Response (400):
{
  "success": false,
  "errors": [
    {
      "msg": "PAN format must be like ABCDE1234F",
      "param": "kycDocuments.panCard",
      "location": "body"
    }
  ]
}
```

### Invalid City for State
```javascript
{
  state: "Maharashtra",
  city: "Bangalore"  // Bangalore is in Karnataka, not Maharashtra
}

Response (400):
{
  "success": false,
  "errors": [
    {
      "msg": "City must be valid for selected state Maharashtra",
      "param": "businessAddress.city",
      "location": "body"
    }
  ]
}
```

### Invalid IFSC Code
```javascript
{
  ifscCode: "HDFC12345678"  // Wrong format, should be 4letters+0+6digits
}

Response (400):
{
  "success": false,
  "errors": [
    {
      "msg": "IFSC must be 11 chars: first 4 letters + 0 + 6 digits",
      "param": "bankDetails.ifscCode",
      "location": "body"
    }
  ]
}
```

---

## Bank Options (15 banks)
```javascript
1. State Bank of India
2. HDFC Bank
3. ICICI Bank
4. Axis Bank
5. Punjab National Bank
6. Bank of Baroda
7. Union Bank of India
8. Canara Bank
9. Indian Bank
10. Bank of India
11. IndusInd Bank
12. Kotak Mahindra Bank
13. IDBI Bank
14. Yes Bank
15. Federal Bank
```

---

## State-City Mapping (28 States × 6 Cities each)
```javascript
Andhra Pradesh: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry']
Arunachal Pradesh: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila']
Assam: ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon', 'Tezpur']
Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia']
Chhattisgarh: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Jagdalpur']
Goa: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim']
Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar']
Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar']
Himachal Pradesh: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Hamirpur']
Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh']
Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Kalaburagi']
Kerala: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur']
Madhya Pradesh: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar']
Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane']
Manipur: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul', 'Kakching']
Meghalaya: ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Baghmara', 'Williamnagar']
Mizoram: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Saiha']
Nagaland: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto']
Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri']
Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali']
Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner']
Sikkim: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Singtam']
Tamil Nadu: ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli']
Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahabubnagar']
Tripura: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa']
Uttar Pradesh: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut']
Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Roorkee', 'Rudrapur', 'Nainital']
West Bengal: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kharagpur']
```

---

## ✅ Verification Checklist

- [x] Validator export created in validators.js
- [x] Validator imported in vendorRoutes.js
- [x] Validator applied to POST /register route
- [x] All 9 regex patterns implemented identically to frontend
- [x] State-city dependency validation implemented
- [x] Bank name validation implemented
- [x] No syntax errors in modified files
- [x] Middleware execution order correct (validator → validate → auth)
- [x] Error messages helpful and specific
- [x] All 28 states with 6 cities each included
- [x] All 15 banks in list included

---

## 🚀 Testing Instructions

### Test 1: Valid Submission
```bash
curl -X POST http://localhost:5000/api/vendors/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "ABC Electronics",
    "businessEmail": "business@example.com",
    "businessPhone": "9876543210",
    "businessAddress": {
      "line1": "123 Business Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001"
    },
    "kycDocuments": {
      "panCard": "ABCDE1234F",
      "aadharCard": "123456789012",
      "gstNumber": "27AABCT1234H1Z0"
    },
    "bankDetails": {
      "bankName": "HDFC Bank",
      "accountHolderName": "John Doe",
      "accountNumber": "123456789012",
      "ifscCode": "HDFC0001234"
    }
  }'

Expected: 201 Created
```

### Test 2: Invalid Phone
```bash
# Phone with 11 digits instead of 10
"businessPhone": "98765432101"

Expected: 400 Bad Request with error "Phone must be exactly 10 digits"
```

### Test 3: Invalid PAN
```bash
# PAN doesn't match pattern
"panCard": "ABCD1234E"

Expected: 400 Bad Request with error "PAN format must be like ABCDE1234F"
```

### Test 4: Mismatched City
```bash
# City doesn't belong to selected state
"state": "Maharashtra",
"city": "Bangalore"  # This is in Karnataka!

Expected: 400 Bad Request with error "City must be valid for selected state Maharashtra"
```

---

## 🎯 Summary

✅ **Backend validators implemented with complete parity to frontend**
✅ **All regex patterns identical between frontend and backend**
✅ **State-city dependency enforced at backend level**
✅ **Bank name validation prevents invalid entries**
✅ **Frontend bypass attacks now blocked at middleware level**
✅ **Clear, specific error messages for all validation failures**

The vendor registration system now has enterprise-grade validation across both frontend and backend, ensuring data integrity and security.
