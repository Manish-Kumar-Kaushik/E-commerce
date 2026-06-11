import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  guestItems: [],
  couponCode: '',
  checkoutDraft: null,
}

const getItemKey = (productId, size, color = '') => `${productId}:${size}:${String(color || '').trim().toLowerCase()}`

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addGuestItem: (state, action) => {
      const { product, size, color = '', quantity } = action.payload
      const normalizedColor = String(color || '').trim().toLowerCase()
      const colorVariantImages = normalizedColor
        ? product?.colorImages?.[normalizedColor] || product?.colorImages?.get?.(normalizedColor) || []
        : []
      const nextItem = {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        image: colorVariantImages?.[0]?.url || product.images?.[0]?.url || product.images?.[0] || '',
        price: product.salePrice ?? product.price,
        size,
        color: normalizedColor,
        quantity,
        stock: product.stock,
        category: product.category,
        collection: product.collection,
      }
      const existingItem = state.guestItems.find(
        (item) => getItemKey(item.productId, item.size, item.color) === getItemKey(product._id, size, color),
      )

      if (existingItem) {
        existingItem.quantity = Math.min(existingItem.quantity + quantity, existingItem.stock)
        return
      }

      state.guestItems.push(nextItem)
    },
    updateGuestItemQuantity: (state, action) => {
      const { productId, size, color = '', quantity } = action.payload
      const item = state.guestItems.find(
        (entry) => getItemKey(entry.productId, entry.size, entry.color) === getItemKey(productId, size, color),
      )

      if (!item) {
        return
      }

      item.quantity = Math.max(1, Math.min(quantity, item.stock))
    },
    removeGuestItem: (state, action) => {
      const { productId, size, color = '' } = action.payload
      state.guestItems = state.guestItems.filter(
        (item) => getItemKey(item.productId, item.size, item.color) !== getItemKey(productId, size, color),
      )
    },
    clearGuestCart: (state) => {
      state.guestItems = []
    },
    setCouponCode: (state, action) => {
      state.couponCode = action.payload.toUpperCase()
    },
    setCheckoutDraft: (state, action) => {
      state.checkoutDraft = action.payload?.userKey && action.payload?.data
        ? {
            userKey: action.payload.userKey,
            data: action.payload.data,
          }
        : null
    },
    clearCheckoutDraft: (state) => {
      state.checkoutDraft = null
    },
  },
})

export const {
  addGuestItem,
  clearCheckoutDraft,
  clearGuestCart,
  removeGuestItem,
  setCheckoutDraft,
  setCouponCode,
  updateGuestItemQuantity,
} = cartSlice.actions

export default cartSlice.reducer
