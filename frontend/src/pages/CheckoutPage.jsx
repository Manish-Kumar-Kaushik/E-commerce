import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import Seo from '../components/Seo'
import {
  useCreateOrderMutation,
  useCreateStripePaymentIntentMutation,
  useGetProfileQuery,
  useVerifyStripePaymentMutation,
} from '../features/api/apiSlice'
import { clearCheckoutDraft, setCheckoutDraft, setCouponCode } from '../features/cart/cartSlice'
import { useCartData } from '../hooks/useCart'
import { getApiErrorMessage } from '../utils/api'
import { getClerkDisplayName, getClerkPrimaryEmail, getClerkPrimaryPhone } from '../utils/clerk'

const shippingFieldKeys = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country']

const areShippingDetailsEqual = (left = {}, right = {}) =>
  shippingFieldKeys.every((field) => (left[field] || '') === (right[field] || ''))

const getPrefilledShippingDetails = ({ profile, sessionUser }) => {
  const profileAddress = profile?.addresses?.find((address) => address.isDefault) || profile?.addresses?.[0]
  const sessionName = getClerkDisplayName(sessionUser)
  const sessionPhone = getClerkPrimaryPhone(sessionUser)

  if (profileAddress) {
    return {
      fullName: sessionName || profileAddress.fullName || profile?.name || '',
      phone: sessionPhone || profileAddress.phone || profile?.phone || '',
      line1: profileAddress.line1 || profile?.address || '',
      line2: profileAddress.line2 || profileAddress.landmark || profile?.landmark || '',
      city: profileAddress.city || profile?.city || '',
      state: profileAddress.state || '',
      postalCode: profileAddress.postalCode || '',
      country: profileAddress.country || profile?.country || 'India',
    }
  }

  return {
    fullName: sessionName || profile?.name || '',
    phone: sessionPhone || profile?.phone || '',
    line1: profile?.address || '',
    line2: profile?.landmark || '',
    city: profile?.city || '',
    state: '',
    postalCode: '',
    country: profile?.country || 'India',
  }
}

const getValidationMessage = (error) => {
  const details = error?.data?.details

  if (Array.isArray(details) && details.length) {
    const first = details[0]
    if (typeof first === 'string') {
      return first
    }
    if (first?.message) {
      return first.message
    }
  }

  return ''
}

const CheckoutPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user: sessionUser } = useUser()
  const [searchParams] = useSearchParams()
  const checkoutDraft = useSelector((state) => state.cart?.checkoutDraft)
  const { data: profileData } = useGetProfileQuery()
  const { items, subtotal, discountAmount, totalAmount, shippingAmount, couponCode } = useCartData()
  const [createOrder, createOrderState] = useCreateOrderMutation()
  const [createStripePaymentIntent, createStripePaymentIntentState] = useCreateStripePaymentIntentMutation()
  const [verifyStripePayment, verifyStripePaymentState] = useVerifyStripePaymentMutation()
  const sessionUserEmail = getClerkPrimaryEmail(sessionUser) || ''
  const currentUserKey = sessionUserEmail || profileData?.user?.email || ''
  const prefilledDetails = useMemo(
    () => getPrefilledShippingDetails({ profile: profileData?.user, sessionUser }),
    [profileData?.user, sessionUser],
  )
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  })
  const [paymentMethod, setPaymentMethod] = useState('cod')

  useEffect(() => {
    const draftMatchesCurrentUser = checkoutDraft?.userKey && checkoutDraft.userKey === currentUserKey
    const draftData = draftMatchesCurrentUser ? checkoutDraft.data : null
    const nextForm = {
      fullName: draftData?.fullName || prefilledDetails.fullName || '',
      phone: draftData?.phone || prefilledDetails.phone || '',
      line1: draftData?.line1 || prefilledDetails.line1 || '',
      line2: draftData?.line2 || prefilledDetails.line2 || '',
      city: draftData?.city || prefilledDetails.city || '',
      state: draftData?.state || prefilledDetails.state || '',
      postalCode: draftData?.postalCode || prefilledDetails.postalCode || '',
      country: draftData?.country || prefilledDetails.country || 'India',
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((current) => (areShippingDetailsEqual(current, nextForm) ? current : nextForm))
  }, [checkoutDraft?.data, checkoutDraft?.userKey, currentUserKey, prefilledDetails])

  useEffect(() => {
    if (!shippingFieldKeys.some((field) => form[field])) {
      return
    }

    if (!currentUserKey) {
      return
    }

    dispatch(setCheckoutDraft({ userKey: currentUserKey, data: { ...form, paymentMethod } }))
  }, [currentUserKey, dispatch, form, paymentMethod])

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (paymentStatus !== 'success' || !sessionId) {
      return
    }

    const verifyCompletedSession = async () => {
      try {
        const verifiedOrder = await verifyStripePayment(sessionId).unwrap()
        toast.success('Payment successful!')
        dispatch(clearCheckoutDraft())
        dispatch(setCouponCode(''))
        navigate('/account/dashboard', { replace: true })
        return verifiedOrder
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Unable to verify Stripe payment'))
      }
    }

    verifyCompletedSession()
  }, [dispatch, navigate, searchParams, verifyStripePayment])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const finalizeOrder = async () => {
    dispatch(clearCheckoutDraft())
    dispatch(setCouponCode(''))
    navigate('/account/dashboard')
  }

  const handleCodOrder = async (event) => {
    event.preventDefault()

    // Validate shipping address before submitting
    const requiredFields = ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !form[field] || !form[field].trim());
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      await createOrder({
        couponCode,
        paymentMethod: 'cod',
        shippingAddress: form,
      }).unwrap()
      toast.success('Order placed successfully')
      await finalizeOrder()
    } catch (error) {
      const validationMessage = getValidationMessage(error)
      toast.error(validationMessage || getApiErrorMessage(error, 'Unable to place the order'))
    }
  }

  const handleStripeOrder = async (event) => {
    event.preventDefault()

    // Validate shipping address before submitting
    const requiredFields = ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !form[field] || !form[field].trim());
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const orderResponse = await createOrder({
        couponCode,
        paymentMethod: 'stripe',
        shippingAddress: form,
      }).unwrap()
      const orderId = orderResponse.order._id

      if (!orderId) {
        throw new Error('Order id missing for Stripe payment')
      }

      const stripePaymentIntentResponse = await createStripePaymentIntent(orderId).unwrap()
      if (stripePaymentIntentResponse.paymentIntent?.checkoutUrl) {
        window.location.href = stripePaymentIntentResponse.paymentIntent.checkoutUrl
        return
      }

      throw new Error('Stripe checkout URL missing')
    } catch (error) {
      const validationMessage = getValidationMessage(error)
      toast.error(validationMessage || getApiErrorMessage(error, 'Unable to process Stripe payment'))
    }
  }

  if (!items.length) {
    return (
      <div className="container-shell py-16">
        <Seo title="Checkout" description="Finalize your order details and payment." />
        <EmptyState
          title="Nothing to check out yet"
          description="Add a few styles to your cart first, then come back here to complete your order."
          action={
            <Link to="/products" className="gold-button">
              Shop Now
            </Link>
          }
        />
      </div>
    )
  }

  const isSubmitting =
    createOrderState.isLoading ||
    createStripePaymentIntentState.isLoading ||
    verifyStripePaymentState.isLoading

  const handleSubmit = (event) => {
    switch (paymentMethod) {
      case 'cod':
        return handleCodOrder(event)
      case 'stripe':
        return handleStripeOrder(event)
      default:
        return handleStripeOrder(event)
    }
  }

  return (
    <>
      <Seo title="Checkout" description="Enter your shipping details and choose your payment method." />
      <div className="container-shell py-6 sm:py-10">
        <Breadcrumbs items={[{ label: 'Checkout' }]} />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="surface-panel rounded-[2.25rem] p-6 sm:p-8"
          >
            <p className="eyebrow">Checkout</p>
            <h1 className="font-serif-display mt-2 text-3xl text-stone-950 sm:text-4xl">Shipping Details</h1>
            <div className="mt-4 flex flex-wrap gap-3">
              {['Secure checkout', 'COD available', 'Stripe'].map((item) => (
                <span key={item} className="info-chip">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <input name="fullName" value={form.fullName || ''} onChange={handleChange} placeholder="Full Name" className="field-input sm:col-span-2" required />
              <input name="phone" value={form.phone || ''} onChange={handleChange} placeholder="Phone Number" className="field-input" required />
              <input name="country" value={form.country || ''} onChange={handleChange} placeholder="Country" className="field-input" required />
              <input name="line1" value={form.line1 || ''} onChange={handleChange} placeholder="Address Line 1" className="field-input sm:col-span-2" required />
              <input name="line2" value={form.line2 || ''} onChange={handleChange} placeholder="Address Line 2" className="field-input sm:col-span-2" />
              <input name="city" value={form.city || ''} onChange={handleChange} placeholder="City" className="field-input" required />
              <input name="state" value={form.state || ''} onChange={handleChange} placeholder="State" className="field-input" required />
              <input name="postalCode" value={form.postalCode || ''} onChange={handleChange} placeholder="Postal Code" className="field-input" required />
            </div>

            <div className="selection-card mt-8 rounded-[1.75rem] p-4">
              <p className="eyebrow">Payment Method</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className={`selection-card rounded-3xl p-4 ${paymentMethod === 'stripe' ? 'selection-card-active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="sr-only"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <span className="text-sm font-medium text-stone-900">Stripe</span>
                  <p className="mt-2 text-xs text-stone-600">Pay with card</p>
                </label>
                <label className={`selection-card rounded-3xl p-4 ${paymentMethod === 'cod' ? 'selection-card-active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="sr-only"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <span className="text-sm font-medium text-stone-900">COD</span>
                  <p className="mt-2 text-xs text-stone-600">Cash on delivery</p>
                </label>
              </div>
            </div>

            <button type="submit" className="gold-button mt-8 w-full justify-center" disabled={isSubmitting}>
              {isSubmitting
                ? 'Processing...'
                : paymentMethod === 'cod'
                  ? 'Place COD Order'
                  : 'Pay with Stripe'}
            </button>
          </form>

          <aside className="surface-panel h-fit rounded-[2.25rem] p-6 sm:p-8 lg:sticky lg:top-32">
            <p className="eyebrow">Your Order</p>
            <div className="mt-4 rounded-[1.7rem] bg-[#17120d] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-[#dcc598]">Before you pay</p>
              <p className="mt-2 text-sm leading-7 text-white/70">
                Double-check your shipping details and preferred payment method. Your order confirmation will arrive by email.
              </p>
            </div>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={`${item.product?._id || item.productId}-${item.size}-${item.color || 'na'}`} className="selection-card flex flex-col gap-3 rounded-3xl p-3 sm:flex-row sm:items-center sm:gap-4">
                  <img src={item.image || item.product?.images?.[0]?.url} alt={item.name} className="h-20 w-16 rounded-2xl object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-900">{item.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">
                      {item.size}{item.color ? ` · ${item.color}` : ''} / Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-stone-900 sm:text-right">Rs. {item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3 border-t border-stone-200 pt-6 text-sm text-stone-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>Rs. {subtotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>{shippingAmount === 0 ? 'Free' : `Rs. ${shippingAmount}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Coupon</span>
                <span className="text-emerald-700">- Rs. {discountAmount}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-6">
              <span className="text-xs uppercase tracking-[0.35em] text-stone-500">Total</span>
              <span className="font-serif-display text-2xl text-stone-950 sm:text-3xl">Rs. {totalAmount}</span>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

export default CheckoutPage
