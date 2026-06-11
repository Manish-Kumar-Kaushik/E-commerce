import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from './features/api/apiSlice'
import authReducer from './features/auth/authSlice'
import cartReducer from './features/cart/cartSlice'
import uiReducer from './features/ui/uiSlice'
import { loadState, saveState } from './utils/storage'

const preloadedState = loadState()

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    cart: cartReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  preloadedState,
})

store.subscribe(() => {
  saveState({
    auth: store.getState().auth,
    cart: store.getState().cart,
    ui: store.getState().ui,
  })
})
