# GST-Inclusive Pricing & Admin Coupon System Implementation

## Overview
This document outlines the implementation of GST (Goods and Services Tax) inclusive pricing and an admin-controlled coupon management system for the ecommerce platform.

---

## 1. GST-Inclusive Pricing System

### 1.1 GST Rates by Category

- **Clothing/Fashion**: 5% GST
- **Electronics**: 12% or 18% GST (vendor/admin selectable)
- **All Other Categories**: 0% GST (No tax)

### 1.2 Backend Implementation

#### File: `backend/src/utils/gst.js`
Created new utility module with key functions:

```javascript
// Main function to build pricing with GST
buildProductPricingWithGst({ category, price, salePrice, gstRate })
  - Resolves GST rate based on category
  - Calculates final GST-inclusive prices
  - Validates sale price is less than or equal to price
  - Returns: { gstRate, basePrice, price, baseSalePrice, salePrice }

// Helper: Resolve GST rate
resolveGstRateForCategory(category, requestedRate)
  - For clothing: returns 5%
  - For electronics: validates rate is 12 or 18, defaults to 18
  - For others: returns 0%

// Helper: Apply GST to single price
applyGstToPrice(basePrice, gstRate)
  - Returns: { basePrice, gstRate, gstAmount, finalPrice }
```

#### Product Model Updates (Future)
The `Product.js` model should be extended to store:
- `gstRate`: Applied GST percentage
- `basePrice`: Price before GST
- `price`: GST-inclusive final price (displayed to customers)
- `baseSalePrice`: Sale price before GST
- `salePrice`: GST-inclusive sale price

#### Product Create/Update Flow (Future)
When vendors/admins create/update products:
1. Submit: `category`, `basePrice` (excluding GST), `baseSalePrice`, `gstRate` (for electronics only)
2. Backend calls `buildProductPricingWithGst()`
3. Stores both base and final prices in database
4. Customer-facing APIs return `price` (GST-inclusive)

#### Cart & Order Totals (Future)
- Cart displays `item.price * item.quantity` (already GST-inclusive)
- Order subtotal is sum of GST-inclusive item prices
- Invoice shows GST breakdown if needed

---

## 2. Admin-Controlled Coupon System

### 2.1 Coupon Model

#### File: `backend/src/models/Coupon.js`
```javascript
{
  code: String (uppercase, unique),
  description: String,
  discountType: 'percentage' | 'fixed',
  discountValue: Number (positive),
  minOrderAmount: Number (optional),
  maxDiscountAmount: Number (optional, for percentage coupons),
  usageLimit: Number (optional),
  usedCount: Number (current usage),
  startsAt: Date (optional),
  expiresAt: Date (optional),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 Backend Implementation

#### File: `backend/src/services/couponService.js`
Core functions:

```javascript
validateAndApplyCoupon(code, subtotal)
  - Validates code exists
  - Checks date validity (startsAt, expiresAt)
  - Checks usage limit
  - Checks minimum order amount
  - Calculates discount (percentage or fixed)
  - Returns: { valid, discountAmount, couponCode, reason }

getCouponByCode(code)
  - Retrieves coupon by code
  - Supports both Mongo and local store

createCoupon(payload)
  - Admin creates new coupon
  - Validates unique code
  - Stores in database/local store

updateCoupon(couponId, payload)
  - Admin updates coupon details
  - Can modify discount, dates, limits, etc.

deleteCoupon(couponId)
  - Admin deletes coupon
  - Prevents further use

incrementCouponUsage(couponId)
  - Called when order is placed with coupon
  - Increments usedCount
  - Fails silently if already at usage limit

getCoupons(query)
  - Admin lists all coupons
  - Returns sorted by createdAt (newest first)
```

### 2.3 Admin Routes & Controllers

#### File: `backend/src/routes/adminRoutes.js`
New endpoints:
```
GET  /admin/coupons              - List all coupons
POST /admin/coupons              - Create coupon
PUT  /admin/coupons/:id          - Update coupon
DELETE /admin/coupons/:id        - Delete coupon
```

#### File: `backend/src/controllers/couponController.js`
Handlers for CRUD operations with error handling and validation.

### 2.4 Coupon Validators

#### File: `backend/src/middleware/validators.js`
Added validators:
```javascript
couponValidator              - Validates create payload
updateCouponValidator        - Validates update payload
```

Validations include:
- Code: required, non-empty
- Discount type: must be 'percentage' or 'fixed'
- Discount value: positive number
- Dates: valid ISO 8601 format
- Amounts: positive numbers

### 2.5 Local Store Support

#### File: `backend/src/services/localStoreService.js`
Updated:
- `createDefaultStore()`: Added `coupons: []`
- `readLocalStore()`: Handles coupons array
- `couponService.js`: Dual Mongo/local store support

---

## 3. Frontend Implementation

### 3.1 RTK Query Endpoints

#### File: `frontend/src/features/api/apiSlice.js`

Added endpoints:
```javascript
getCoupons              - Query to fetch all coupons
createCoupon           - Mutation to create coupon
updateCoupon           - Mutation to update coupon
deleteCoupon           - Mutation to delete coupon
```

Exported hooks:
```javascript
useGetCouponsQuery()
useCreateCouponMutation()
useUpdateCouponMutation()
useDeleteCouponMutation()
```

Tag type: `'Coupon'` with IDs and `'LIST'`

---

## 4. Order & Checkout Integration (Future)

### 4.1 Coupon Validation During Checkout

The existing checkout flow should be updated to:
1. User enters coupon code in checkout
2. Before creating order, call `validateAndApplyCoupon(code, subtotal)`
3. If valid, apply discount and create order with coupon code
4. If invalid, show error message with reason
5. After successful payment, call `incrementCouponUsage(couponId)`

### 4.2 Order Structure

Orders will store:
- `couponCode`: Applied coupon code (if any)
- `discountAmount`: Final discount applied
- This is already in place from prior implementation

---

## 5. Invoice & Billing (Future)

### 5.1 Invoice Pricing Calculation

Invoices should display:
- Item prices (GST-inclusive)
- Subtotal (sum of item prices)
- Applied coupon and discount amount
- Final total
- Optionally: GST breakdown per item

### 5.2 Vendor Earnings Calculation

Vendor earnings in `Order.vendors[].vendorEarnings` should be calculated as:
```
vendorEarnings = vendorSubtotal - commissionRate - (couponDiscountShare)
```

Where `couponDiscountShare` is proportional to vendor's items in order.

---

## 6. Admin UI for Coupon Management (Future)

Create an admin dashboard page with:

### 6.1 Coupon List
- Table with columns: Code, Discount, Type, Valid From, Valid To, Usage, Status
- Buttons: Edit, Delete, View Details
- Search/filter by code or status
- Sort by date, usage, discount type

### 6.2 Create/Edit Coupon Form
Fields:
- Code (required, uppercase)
- Description (optional)
- Discount Type (percentage | fixed)
- Discount Value (required, positive)
- Minimum Order Amount (optional)
- Maximum Discount (for percentage coupons)
- Usage Limit (optional)
- Active From (optional date)
- Expires On (optional date)
- Is Active (toggle)

### 6.3 Bulk Actions (Future)
- Activate/Deactivate multiple coupons
- Export coupon report
- Import coupons from CSV

---

## 7. Testing Scenarios

### 7.1 GST Scenarios
- [ ] Create clothing product with base price 1000, verify GST-inclusive price = 1050
- [ ] Create electronics product with 12% GST, verify 1120
- [ ] Create electronics with 18% GST, verify 1180
- [ ] Create uncategorized product, verify no GST added
- [ ] Update product price, recalculate GST

### 7.2 Coupon Scenarios
- [ ] Create percentage coupon (10% off, max Rs. 500)
- [ ] Create fixed coupon (Rs. 100 off, min order 1000)
- [ ] Expired coupon cannot be applied
- [ ] Future-dated coupon cannot be applied
- [ ] Usage limit enforced
- [ ] Min order amount enforced
- [ ] Invalid code rejected gracefully

### 7.3 Order Scenarios
- [ ] Order with coupon shows discount in invoice
- [ ] Coupon usage count incremented after payment
- [ ] Vendor earnings calculated correctly with discount
- [ ] Multiple vendors in order share discount proportionally

---

## 8. Migration Notes

### 8.1 Existing Products
When deploying GST system:
1. Decide on default GST rates for existing products by category
2. Run migration script to update Product model
3. Alternatively, mark as "legacy" and require re-entry with GST

### 8.2 Hardcoded Coupon
Replace hardcoded `RIBELLEDEAL` coupon in:
- `backend/src/utils/coupon.js`: Remove `getTieredDiscountRate()`, use `validateAndApplyCoupon()` instead
- `frontend/src/utils/coupons.js`: Remove hardcoded logic, use backend validation
- `orderService.js`: Use new coupon service instead of old logic

### 8.3 Backward Compatibility
- Orders without coupon code: continue to work (empty `couponCode` field)
- Products without GST data: query returns `price` (assume already inclusive or legacy)
- Existing carts: recalculate with new pricing if needed

---

## 9. Configuration & Environment

### 9.1 Feature Flags (Optional)
Add environment variables to control:
```
ENABLE_GST_PRICING=true
ENABLE_COUPON_SYSTEM=true
DEFAULT_ELECTRONICS_GST_RATE=18
```

### 9.2 Admin Permissions
Ensure admin role check in:
- `/admin/coupons/*` endpoints via `requireAdmin` middleware

---

## 10. API Response Examples

### 10.1 Get Coupons
```json
{
  "success": true,
  "coupons": [
    {
      "_id": "648f1a2b3c4d5e6f7g8h9i",
      "code": "WELCOME10",
      "discountType": "percentage",
      "discountValue": 10,
      "minOrderAmount": 500,
      "maxDiscountAmount": 500,
      "usageLimit": 100,
      "usedCount": 45,
      "startsAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z",
      "isActive": true
    }
  ]
}
```

### 10.2 Validate Coupon
```json
{
  "valid": true,
  "couponCode": "WELCOME10",
  "discountAmount": 100,
  "reason": null
}
```

---

## 11. File Checklist

Created/Updated Files:
- ✅ `backend/src/utils/gst.js` (new)
- ✅ `backend/src/models/Coupon.js` (new)
- ✅ `backend/src/services/couponService.js` (new)
- ✅ `backend/src/controllers/couponController.js` (new)
- ✅ `backend/src/routes/adminRoutes.js` (updated)
- ✅ `backend/src/middleware/validators.js` (updated)
- ✅ `backend/src/services/localStoreService.js` (updated)
- ✅ `frontend/src/features/api/apiSlice.js` (updated)

To Update (Future):
- `backend/src/models/Product.js` - Add GST fields
- `backend/src/services/productService.js` - Use GST utility
- `backend/src/services/orderService.js` - Replace hardcoded coupon logic
- `backend/src/utils/coupon.js` - Remove hardcoded logic or deprecate
- `frontend/src/utils/coupons.js` - Remove hardcoded logic
- Frontend admin dashboard - Coupon management UI
- Frontend product create/edit - GST rate selection
- Frontend checkout - Dynamic coupon validation

---

## 12. Summary

**GST System:**
- Utility functions to calculate GST-inclusive prices
- Category-based rules (5% clothing, 12/18% electronics, 0% others)
- Ready for integration with Product model

**Coupon System:**
- Full admin CRUD for coupons
- Date-based validity
- Usage limit enforcement
- Minimum order amount requirement
- Flexible discount types (percentage/fixed)
- Backend validation service
- Frontend RTK Query integration
- Local store & Mongo DB support

**Next Steps:**
1. Update Product model with GST fields
2. Create admin coupon management UI
3. Integrate coupon validation in checkout
4. Replace hardcoded coupon logic
5. Add tests for GST and coupon calculations
