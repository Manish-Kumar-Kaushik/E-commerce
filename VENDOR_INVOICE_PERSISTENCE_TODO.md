# Vendor Invoice Persistence - Backend Implementation

## Overview
Frontend is ready to sync vendor invoice edits. Backend needs to:
1. Accept `invoiceDraft` data via PATCH /orders/:id/invoice
2. Store it persistently on the order document
3. Return it when customer fetches orders

## What Frontend Does
1. **Vendor edits invoice**: changes price, qty, discount, gst
2. **Vendor clicks Save**: calls `updateOrderInvoice` mutation
3. **Frontend sends**: 
   ```javascript
   PATCH /api/orders/:id/invoice
   {
     invoiceDraft: {
       items: [
         {
           id: "item-1",
           price: 998,
           quantity: 1,
           taxRate: 18,
           discount: 179.64,
           discountType: "amount",
           gstAmount: 147.30,
           // ... other fields
         }
       ],
       couponDiscount: 0,
       platformDiscount: 0,
       shippingCharges: 0,
       handlingCharges: 0,
       totalAmount: 0
     }
   }
   ```

## Backend Implementation Required

### 1. Update Order Model
Add to schema:
```javascript
vendorInvoiceDraft: {
  items: [
    {
      id: String,
      price: Number,
      quantity: Number,
      taxRate: Number,
      discount: Number,
      discountType: String, // "amount" or "percent"
      gstAmount: Number,
      // ... preserve other fields
    }
  ],
  couponDiscount: Number,
  platformDiscount: Number,
  shippingCharges: Number,
  handlingCharges: Number,
  totalAmount: Number,
  updatedAt: Date
}
```

### 2. Create/Update Endpoint: PATCH /api/orders/:id/invoice

```javascript
router.patch('/orders/:id/invoice', authMiddleware, async (req, res) => {
  const { invoiceDraft } = req.body
  
  // Validate vendor is owner of order
  const order = await Order.findById(req.params.id)
  // ... permission check ...
  
  // Save vendor's invoice draft
  order.vendorInvoiceDraft = invoiceDraft
  order.updatedAt = new Date()
  await order.save()
  
  return res.json({ success: true, order })
})
```

### 3. Ensure Order GET Returns vendorInvoiceDraft

When customer fetches orders via GET /api/orders, include:
```javascript
{
  _id: "order-123",
  items: [...],
  vendorInvoiceDraft: { // ← Include this
    items: [...]
    // ...
  },
  // ... other fields
}
```

## Frontend Flow (Already Implemented)

1. **Vendor Dashboard**: Shows `InvoicePreview_clean` component with edit mode
2. **Vendor edits** price/qty/gst/discount → triggers `updateDraftField` → updates draft state
3. **Vendor clicks Save** → calls `handleSaveInvoiceDraft(draft)`
   - Saves to localStorage (immediate fallback)
   - Calls `updateOrderInvoice` mutation (attempts server persist)
4. **Customer Views Bill** → `buildCustomerInvoiceDraft` checks `order.vendorInvoiceDraft?.items`
   - If vendor's edits exist → uses them
   - Else → uses original items
5. **Product Displays** → Show GST-inclusive price using `getProductPricing()`

## Testing Checklist

- [ ] Vendor edits invoice, clicks Save
- [ ] Check server logs: PATCH /orders/:id/invoice received and stored
- [ ] Customer refreshes their orders page
- [ ] Bill shows vendor's edited prices/qty/gst/discount
- [ ] Product catalog shows GST-inclusive prices
- [ ] Totals match: item totals = price summary totals

## Notes

- Frontend sends `invoiceDraft` with full item array including all edited fields
- Backend should store as-is (no need to recompute, trust vendor's math)
- Customer invoice builder (`buildCustomerInvoiceDraft`) already handles merging vendor overrides
- GST-inclusive pricing is already wired in frontend products display
