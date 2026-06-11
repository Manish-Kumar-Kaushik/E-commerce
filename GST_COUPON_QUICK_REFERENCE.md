# GST & Coupon System - Quick Reference

## What Was Built

### 1. GST Utility (`backend/src/utils/gst.js`)
```javascript
// Calculate GST-inclusive price
const result = buildProductPricingWithGst({
  category: 'clothing',
  price: 1000,
  salePrice: 900,
  gstRate: undefined // auto-resolved by category
});
// Returns:
// {
//   gstRate: 5,
//   basePrice: 1000,
//   price: 1050,
//   baseSalePrice: 900,
//   salePrice: 945
// }
```

### 2. Coupon Model (`backend/src/models/Coupon.js`)
```javascript
{
  code: "WELCOME10",           // Unique, uppercase
  discountType: "percentage",  // or "fixed"
  discountValue: 10,           // Amount or %
  minOrderAmount: 500,         // Minimum to apply
  maxDiscountAmount: 100,      // For percentage coupons
  usageLimit: 100,             // Total times usable
  usedCount: 45,               // Current usage
  startsAt: Date,              // Optional validity start
  expiresAt: Date,             // Optional validity end
  isActive: true               // Admin control
}
```

### 3. Coupon Service (`backend/src/services/couponService.js`)

**Core function:**
```javascript
const result = await validateAndApplyCoupon("WELCOME10", 1000);
// Returns:
// {
//   valid: true,
//   discountAmount: 100,
//   couponCode: "WELCOME10"
// }
// OR
// {
//   valid: false,
//   discountAmount: 0,
//   couponCode: "",
//   reason: "Coupon has expired"
// }
```

**Other functions:**
```javascript
await createCoupon(payload)
await updateCoupon(couponId, payload)
await deleteCoupon(couponId)
await getCoupons()
await getCouponByCode(code)
await incrementCouponUsage(couponId)
```

### 4. Admin Routes (`backend/src/routes/adminRoutes.js`)
```
GET    /admin/coupons       - List coupons
POST   /admin/coupons       - Create coupon
PUT    /admin/coupons/:id   - Update coupon
DELETE /admin/coupons/:id   - Delete coupon
```

### 5. Frontend Hooks (`frontend/src/features/api/apiSlice.js`)
```javascript
import {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from '../features/api/apiSlice'

// Usage in component:
const { data } = useGetCouponsQuery()
const [createCoupon] = useCreateCouponMutation()
const [updateCoupon] = useUpdateCouponMutation()
const [deleteCoupon] = useDeleteCouponMutation()
```

---

## Integration Points

### Checkout Flow (To be implemented)
1. User enters coupon code
2. Call: `validateAndApplyCoupon(code, orderSubtotal)`
3. If valid, show discount and apply to order
4. On payment success, call: `incrementCouponUsage(couponId)`

### Product Creation (To be implemented)
1. Vendor/Admin enters base price
2. Select category (clothing, electronics, other)
3. For electronics, select GST rate (12 or 18)
4. Backend: `buildProductPricingWithGst()` calculates final price
5. Store both base and final prices

### Invoice Display (To be implemented)
- Show GST-inclusive prices (item.price)
- Show applied coupon and discount
- Optionally show GST breakdown

---

## Testing Quick Commands

### Create a Coupon (curl)
```bash
curl -X POST http://localhost:5000/api/admin/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "code": "SAVE10",
    "discountType": "percentage",
    "discountValue": 10,
    "minOrderAmount": 500,
    "maxDiscountAmount": 200,
    "usageLimit": 50,
    "isActive": true
  }'
```

### Validate Coupon (Backend)
```javascript
import { validateAndApplyCoupon } from './services/couponService.js'

const result = await validateAndApplyCoupon("SAVE10", 1500)
console.log(result)
// {
//   valid: true,
//   discountAmount: 150, // min(1500*10%, 200)
//   couponCode: "SAVE10"
// }
```

### Calculate GST (Backend)
```javascript
import { buildProductPricingWithGst } from './utils/gst.js'

const pricing = buildProductPricingWithGst({
  category: 'electronics',
  price: 10000,
  salePrice: 8000,
  gstRate: 18 // 18% for electronics
})
// {
//   gstRate: 18,
//   basePrice: 10000,
//   price: 11800,        // Customer sees this
//   baseSalePrice: 8000,
//   salePrice: 9440      // Customer sees this
// }
```

---

## GST Rules

| Category | GST Rate |
|----------|----------|
| Clothing/Fashion | 5% |
| Electronics (12%) | 12% |
| Electronics (18%) | 18% |
| All Others | 0% (No tax) |

---

## Coupon Rules

✅ **Valid if:**
- Code matches (case-insensitive)
- Currently active (`isActive: true`)
- Not expired (`expiresAt` not reached)
- Not yet started (if `startsAt` set, must have passed)
- Has usage remaining (`usedCount < usageLimit`)
- Order meets minimum amount (`subtotal >= minOrderAmount`)

❌ **Invalid if:**
- Code doesn't exist
- Expired or future-dated
- Usage limit exhausted
- Minimum order not met
- Not active

---

## File Sizes

| File | Size | Type |
|------|------|------|
| `backend/src/utils/gst.js` | ~1.2 KB | New |
| `backend/src/models/Coupon.js` | ~1.5 KB | New |
| `backend/src/services/couponService.js` | ~4.8 KB | New |
| `backend/src/controllers/couponController.js` | ~0.8 KB | New |
| `backend/src/routes/adminRoutes.js` | ~2.0 KB | Updated |
| `backend/src/middleware/validators.js` | +1.2 KB | Updated |
| `backend/src/services/localStoreService.js` | +0.2 KB | Updated |
| `frontend/src/features/api/apiSlice.js` | +1.5 KB | Updated |

Total new code: ~12.2 KB

---

## Local Store Support

Both GST and coupon systems work with:
- ✅ MongoDB (Mongoose)
- ✅ Local JSON store (for dev/testing)

The `couponService.js` checks `shouldUseLocalStore()` and routes to appropriate backend.

---

## Error Handling

All coupon operations wrap in `asyncHandler` for consistent error responses:
```json
{
  "success": false,
  "message": "Coupon not found",
  "statusCode": 404
}
```

Validation errors include field-level details via `express-validator`.

---

## Future Enhancements

1. **GST Compliance**: Add GST invoice format (GSTR-1)
2. **Coupon Codes Generation**: Auto-generate unique codes
3. **Referral Coupons**: System-generated per-user codes
4. **Category-Specific Coupons**: Restrict coupon to certain categories
5. **Stacking**: Allow multiple coupons per order
6. **Analytics**: Track coupon usage patterns and revenue impact
7. **Expiring Soon**: UI notification for coupons ending soon
8. **Bulk Import**: CSV upload for coupon batch creation

---

## Questions?

- **"Will this break existing orders?"** No, old orders without coupon code still work
- **"Do customers see base or final price?"** Final (GST-inclusive)
- **"Can coupons be changed after order?"** Only affects new orders, historical orders unchanged
- **"Is GST field required on products?"** Currently utility-based, becomes required after Product model update
- **"Can admin change expired coupon dates?"** Yes, via `updateCoupon()`
