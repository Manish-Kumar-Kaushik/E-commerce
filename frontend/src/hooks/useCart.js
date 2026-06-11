import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import {
  useAddCartItemMutation,
  useGetCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '../features/api/apiSlice'
import {
  addGuestItem,
  removeGuestItem,
  setCouponCode,
  updateGuestItemQuantity,
} from '../features/cart/cartSlice'
import { calculateCouponDiscount } from '../utils/coupons'

export const useCartData = () => {
  const dispatch = useDispatch()
  const { guestItems, couponCode } = useSelector((state) => state.cart || { guestItems: [], couponCode: '' })
  const token = useSelector((state) => state.auth?.token)
  const { data, isLoading, isFetching, refetch } = useGetCartQuery(token ? undefined : skipToken)
  const items = token ? data?.cart?.items || [] : guestItems
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const { discountAmount, discountRate } = calculateCouponDiscount(items, couponCode)
  const shippingAmount = 0
  const totalAmount = subtotal + shippingAmount - discountAmount

  useEffect(() => {
    if (couponCode && !totalItems) {
      dispatch(setCouponCode(''))
    }
  }, [couponCode, dispatch, totalItems])

  return {
    couponCode,
    discountAmount,
    discountRate,
    isAuthenticated: Boolean(token),
    isLoading: token ? isLoading || isFetching : false,
    items,
    refetch,
    shippingAmount,
    subtotal,
    totalAmount,
    totalItems,
  }
}

export const useCartActions = () => {
  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth?.token)
  const [addCartItem, addCartState] = useAddCartItemMutation()
  const [updateCartItem, updateCartState] = useUpdateCartItemMutation()
  const [removeCartItem, removeCartState] = useRemoveCartItemMutation()

  const addItem = async ({ product, productId, size, color = '', quantity = 1 }) => {
    try {
      if (token) {
        await addCartItem({ productId, quantity, size, color }).unwrap()
        toast.success('Added to cart')
        return true
      }

      dispatch(addGuestItem({ product, quantity, size, color }))
      toast.success('Added to cart')
      return true
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to add this item right now')
      return false
    }
  }

  const updateItem = async ({ productId, size, color = '', quantity }) => {
    try {
      if (token) {
        await updateCartItem({ productId, quantity, size, color }).unwrap()
        return
      }

      dispatch(updateGuestItemQuantity({ productId, quantity, size, color }))
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to update the cart')
    }
  }

  const removeItem = async ({ productId, size, color = '' }) => {
    try {
      if (token) {
        await removeCartItem({ productId, size, color }).unwrap()
        toast.success('Removed from cart')
        return
      }

      dispatch(removeGuestItem({ productId, size, color }))
      toast.success('Removed from cart')
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to remove this item')
    }
  }

  return {
    addItem,
    isMutating: addCartState.isLoading || updateCartState.isLoading || removeCartState.isLoading,
    removeItem,
    updateItem,
  }
}
