import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlistItem: (state, action) => {
      const product = action.payload
      const existingIndex = state.items.findIndex((item) => item._id === product._id)

      if (existingIndex >= 0) {
        state.items.splice(existingIndex, 1)
        return
      }

      state.items.unshift({
        _id: product._id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        images: product.images || [],
        price: product.price,
        salePrice: product.salePrice,
        stock: product.stock,
        category: product.category,
        collection: product.collection,
      })
    },
    removeWishlistItem: (state, action) => {
      state.items = state.items.filter((item) => item._id !== action.payload)
    },
    clearWishlist: (state) => {
      state.items = []
    },
  },
})

export const { clearWishlist, removeWishlistItem, toggleWishlistItem } = wishlistSlice.actions
export default wishlistSlice.reducer
