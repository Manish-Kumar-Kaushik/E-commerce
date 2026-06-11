import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useSyncCartMutation } from '../features/api/apiSlice'
import { clearGuestCart } from '../features/cart/cartSlice'

export const useSyncGuestCart = () => {
  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth?.token)
  const guestItems = useSelector((state) => state.cart?.guestItems || [])
  const [syncCart] = useSyncCartMutation()
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    const sync = async () => {
      if (!token || !guestItems.length || hasSyncedRef.current) {
        return
      }

      try {
        hasSyncedRef.current = true
        await syncCart(
          guestItems.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
        ).unwrap()
        dispatch(clearGuestCart())
        toast.success('Your cart has been synced')
      } catch (error) {
        hasSyncedRef.current = false
        toast.error(error?.data?.message || 'Unable to sync cart right now')
      }
    }

    sync()
  }, [dispatch, guestItems, syncCart, token])

  useEffect(() => {
    if (!guestItems.length) {
      hasSyncedRef.current = false
    }
  }, [guestItems.length])
}
