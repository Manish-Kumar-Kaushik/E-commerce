import { body, param, query } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['customer', 'vendor'])
    .withMessage('Role must be customer or vendor'),
  body('businessName').optional().trim(),
  body('businessPhone').optional().trim(),
  body('businessAddress').optional().trim(),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const syncUserValidator = [
  body('clerkId').trim().notEmpty().withMessage('Clerk user id is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('name').optional().trim(),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim(),
];

export const requestPasswordResetOtpValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
];

export const verifyPasswordResetOtpValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
  body('otp')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('OTP must be 6 digits'),
];

export const resetPasswordWithOtpValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
  body('otp')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('OTP must be 6 digits'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('alternatePhone').optional().trim(),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const addAddressValidator = [
  body('label').optional().trim(),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('line1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('line2').optional().trim(),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
];

export const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Product description is required'),
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('price')
    .if((_, { req }) => req.body.basePrice === undefined || req.body.basePrice === '')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('gstRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST slab must be between 0 and 100'),
  body('discountAmount')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('salePrice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Sale price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('collection').optional().trim(),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('colorImages').optional().isObject().withMessage('colorImages must be an object'),
  body('attributes').optional().isArray().withMessage('Attributes must be an array'),
  body('attributes.*.section').optional().trim(),
  body('attributes.*.key').optional().trim(),
  body('attributes.*.label').optional().trim(),
  body('attributes.*.value').optional().trim(),
  body('sizes').optional().isArray().withMessage('Sizes must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('colors').optional().isArray().withMessage('Colors must be an array'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('isCelebrityCloset').optional().isBoolean().withMessage('isCelebrityCloset must be a boolean'),
  body('isLuxe').optional().isBoolean().withMessage('isLuxe must be a boolean'),
];

export const updateProductValidator = [
  param('identifier').isMongoId().withMessage('Valid product id is required'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('gstRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST slab must be between 0 and 100'),
  body('discountAmount')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('salePrice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Sale price must be a positive number'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('collection').optional().trim(),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('colorImages').optional().isObject().withMessage('colorImages must be an object'),
  body('attributes').optional().isArray().withMessage('Attributes must be an array'),
  body('attributes.*.section').optional().trim(),
  body('attributes.*.key').optional().trim(),
  body('attributes.*.label').optional().trim(),
  body('attributes.*.value').optional().trim(),
  body('sizes').optional().isArray().withMessage('Sizes must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('colors').optional().isArray().withMessage('Colors must be an array'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('isCelebrityCloset').optional().isBoolean().withMessage('isCelebrityCloset must be a boolean'),
  body('isLuxe').optional().isBoolean().withMessage('isLuxe must be a boolean'),
];

export const mongoIdParamValidator = [param('id').isMongoId().withMessage('Valid id is required')];

export const productQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be positive'),
];

export const cartItemValidator = [
  body('productId').isMongoId().withMessage('Valid product id is required'),
  body('size').optional().trim(),
  body('color').optional().trim(),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const cartQuantityValidator = [
  param('productId').isMongoId().withMessage('Valid product id is required'),
  body('size').optional().trim(),
  body('color').optional().trim(),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const cartItemParamValidator = [
  param('productId').isMongoId().withMessage('Valid product id is required'),
  query('size').trim().notEmpty().withMessage('Size is required'),
  query('color').optional().trim(),
];

export const cartSyncValidator = [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.productId').isMongoId().withMessage('Valid product id is required'),
  body('items.*.size').optional().trim(),
  body('items.*.color').optional().trim(),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const createOrderValidator = [
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shippingAddress.phone').trim().notEmpty().withMessage('Phone number is required'),
  body('shippingAddress.line1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
  body('paymentMethod')
    .optional()
    .isIn(['cod', 'stripe'])
    .withMessage('Payment method must be cod or stripe'),
  body('couponCode').optional().trim(),
  body('items').optional().isArray().withMessage('Items must be an array'),
  body('items.*.productId').optional().isMongoId().withMessage('Valid product id is required'),
  body('items.*.size').optional().trim().notEmpty().withMessage('Size is required'),
  body('items.*.color').optional().trim(),
  body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const updateOrderStatusValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  body('status')
    .isIn([
      'created',
      'payment_pending',
      'paid',
      'confirmed',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'return_requested',
      'returned',
      'refunded',
    ])
    .withMessage('Invalid order status'),
];

export const orderStatusValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  body('status')
    .isIn([
      'confirmed',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'return_requested',
      'returned',
      'refunded',
    ])
    .withMessage('Invalid order status'),
  body('deliveryInDays')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('deliveryInDays must be between 1 and 30'),
  body('deliveryMinDays')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('deliveryMinDays must be between 1 and 30'),
  body('deliveryMaxDays')
    .optional()
    .isInt({ min: 1, max: 45 })
    .withMessage('deliveryMaxDays must be between 1 and 45'),
  body('estimatedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('estimatedDeliveryDate must be a valid ISO date'),
  body('deliveryPartner')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('deliveryPartner must be between 2 and 60 characters'),
  body('trackingId')
    .optional()
    .trim()
    .isLength({ min: 3, max: 64 })
    .withMessage('trackingId must be between 3 and 64 characters'),
];

export const cancelOrderValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  body('reason')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage('reason must be between 3 and 300 characters'),
];

export const requestOrderReturnValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage('reason must be between 5 and 300 characters'),
  body('issueType')
    .isIn(['wrong_item', 'defective', 'not_received', 'size_issue', 'other'])
    .withMessage('issueType is invalid'),
  body('itemId').optional().isMongoId().withMessage('Valid item id is required'),
];

export const trackOrderValidator = [
  query('trackingId').trim().notEmpty().withMessage('trackingId is required'),
];

export const orderInvoiceValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
];

export const orderRefundValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  body('itemId').optional().isMongoId().withMessage('Valid item id is required'),
  body('reason').optional({ values: 'falsy' }).trim().isLength({ min: 3, max: 300 }).withMessage('reason must be between 3 and 300 characters'),
];

export const reviewCreateValidator = [
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
  body('title').optional({ values: 'falsy' }).trim().isLength({ max: 120 }).withMessage('title must be 120 characters or less'),
  body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('comment must be 2000 characters or less'),
  body('images').optional().isArray({ max: 5 }).withMessage('images can contain up to 5 items'),
  body('images.*.url').optional().isURL().withMessage('image url must be valid'),
  body('images.*.publicId').optional({ values: 'falsy' }).isString().withMessage('publicId must be a string'),
  body('orderId').optional().isMongoId().withMessage('Valid order id is required'),
  body('itemId').optional().isMongoId().withMessage('Valid item id is required'),
];

export const reviewUpdateValidator = [
  param('id').isMongoId().withMessage('Valid review id is required'),
  body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
  body('title').optional({ values: 'falsy' }).trim().isLength({ max: 120 }).withMessage('title must be 120 characters or less'),
  body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('comment must be 2000 characters or less'),
  body('images').optional().isArray({ max: 5 }).withMessage('images can contain up to 5 items'),
  body('images.*.url').optional().isURL().withMessage('image url must be valid'),
  body('images.*.publicId').optional({ values: 'falsy' }).isString().withMessage('publicId must be a string'),
];

export const reviewIdValidator = [
  param('id').isMongoId().withMessage('Valid review id is required'),
];

export const returnDecisionValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  param('itemId').isMongoId().withMessage('Valid item id is required'),
  body('decision').isIn(['approve', 'reject']).withMessage('decision must be approve or reject'),
  body('note').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('note must be 500 characters or less'),
];

export const returnApprovalRouteValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  param('itemId').isMongoId().withMessage('Valid item id is required'),
  body('note').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('note must be 500 characters or less'),
];

export const paymentOrderValidator = [
  body('orderId')
    .customSanitizer((value) => {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object') {
        return value._id || value.id || '';
      }
      return '';
    })
    .isMongoId()
    .withMessage('Valid order id is required'),
];

export const stripePaymentVerificationValidator = [
  body('paymentIntentId')
    .customSanitizer((value) => {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object') {
        return value.id || value.paymentIntentId || '';
      }
      return '';
    })
    .trim()
    .notEmpty()
    .withMessage('paymentIntentId is required'),
];

export const userRoleValidator = [
  param('id').isMongoId().withMessage('Valid user id is required'),
  body('role').isIn(['customer', 'vendor', 'admin']).withMessage('Role must be customer, vendor or admin'),
];

export const collectionValidator = [
  body('name').trim().notEmpty().withMessage('Collection name is required'),
  body('bannerImage').trim().notEmpty().withMessage('Collection banner image is required'),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const updateCollectionValidator = [
  param('id').isMongoId().withMessage('Valid collection id is required'),
  body('name').optional().trim().notEmpty().withMessage('Collection name cannot be empty'),
  body('bannerImage').optional().trim().notEmpty().withMessage('Collection banner image cannot be empty'),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const newsletterValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const contactValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('message').trim().notEmpty().withMessage('Message is required'),
];

export const couponValidator = [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
  body('minOrderAmount').optional().isFloat({ min: 0 }).withMessage('Min order amount must be a positive number'),
  body('maxDiscountAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Max discount amount must be a positive number'),
  body('usageLimit').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Usage limit must be at least 1'),
  body('startsAt').optional({ values: 'falsy' }).isISO8601().withMessage('Start date must be a valid ISO date'),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('Expiry date must be a valid ISO date'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const updateCouponValidator = [
  param('id').isMongoId().withMessage('Valid coupon id is required'),
  body('code').optional().trim().notEmpty().withMessage('Coupon code cannot be empty'),
  body('discountType').optional().isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  body('discountValue').optional().isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
  body('minOrderAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Min order amount must be a positive number'),
  body('maxDiscountAmount').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Max discount amount must be a positive number'),
  body('usageLimit').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Usage limit must be at least 1'),
  body('startsAt').optional({ values: 'falsy' }).isISO8601().withMessage('Start date must be a valid ISO date'),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('Expiry date must be a valid ISO date'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const requestVendorPhoneOtpValidator = [
  body('businessEmail').isEmail().withMessage('Valid business email is required').normalizeEmail(),
  body('businessPhone')
    .trim()
    .matches(/^\+?[0-9\s()-]{10,20}$/)
    .withMessage('Valid business phone number is required'),
];

export const verifyVendorPhoneOtpValidator = [
  body('businessPhone')
    .trim()
    .matches(/^\+?[0-9\s()-]{10,20}$/)
    .withMessage('Valid business phone number is required'),
  body('otp')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('OTP must be 6 digits'),
];
// Vendor registration profile creation validator with strict field validation
const BANK_OPTIONS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Punjab National Bank', 'Bank of Baroda', 'Union Bank of India',
  'Canara Bank', 'Indian Bank', 'Bank of India', 'IndusInd Bank',
  'Kotak Mahindra Bank', 'IDBI Bank', 'Yes Bank', 'Federal Bank',
];

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

export const createVendorProfileValidator = [
  // Business Details
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
  
  body('businessAddress.line1')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required'),
  
  body('businessAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
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
    .withMessage('State is required')
    .custom((value) => {
      if (!Object.keys(STATE_CITY_OPTIONS).includes(value)) {
        throw new Error('Please select a valid state from the list');
      }
      return true;
    }),
  
  body('businessAddress.postalCode')
    .trim()
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be exactly 6 digits'),
  
  // KYC Documents
  body('kycDocuments.panCard')
    .trim()
    .notEmpty()
    .withMessage('PAN number is required')
    .matches(/^[A-Z]{5}\d{4}[A-Z]$/)
    .withMessage('PAN format must be like ABCDE1234F'),
  
  body('kycDocuments.aadharCard')
    .trim()
    .notEmpty()
    .withMessage('Aadhaar number is required')
    .matches(/^\d{12}$/)
    .withMessage('Aadhaar must be exactly 12 digits only'),
  
  body('kycDocuments.gstNumber')
    .trim()
    .notEmpty()
    .withMessage('GSTIN is required')
    .matches(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
    .withMessage('GSTIN format is invalid (ex: 22ABCDE1234F1Z5)'),
  
  // Bank Details
  body('bankDetails.bankName')
    .trim()
    .notEmpty()
    .withMessage('Bank name is required')
    .custom((value) => {
      if (!BANK_OPTIONS.includes(value)) {
        throw new Error(`Bank must be one of: ${BANK_OPTIONS.join(', ')}`);
      }
      return true;
    }),
  
  body('bankDetails.accountHolderName')
    .trim()
    .notEmpty()
    .withMessage('Account holder name is required')
    .matches(/^[A-Za-z][A-Za-z\s.'-]{0,49}$/)
    .withMessage('Account holder name must be 1-50 valid characters'),
  
  body('bankDetails.accountNumber')
    .trim()
    .notEmpty()
    .withMessage('Account number is required')
    .matches(/^\d{9,18}$/)
    .withMessage('Account number must be 9 to 18 digits'),
  
  body('bankDetails.ifscCode')
    .trim()
    .notEmpty()
    .withMessage('IFSC code is required')
    .matches(/^[A-Z]{4}0\d{6}$/)
    .withMessage('IFSC must be 11 chars: first 4 letters + 0 + 6 digits'),
];
