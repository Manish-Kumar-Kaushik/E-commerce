import stripe, { isStripeConfigured } from '../config/stripe.js'
import Order from '../models/Order.js'
import { findOrderByPaymentIntentLocal, mutateLocalStore, shouldUseLocalStore } from './localStoreService.js'
import ApiError from '../utils/ApiError.js'
import { getOrderForUser, markOrderAsPaid, markOrderRefunded, updateOrderStatus } from './orderService.js'

const getFrontendUrl = () => {
  const configured = process.env.CLIENT_URL?.split(',')[0]?.trim()
  return configured || 'http://localhost:5173'
}

// Create a Stripe Payment Intent
export const createStripePaymentIntent = async (orderId, user) => {
  if (!isStripeConfigured) {
    throw new ApiError(500, 'Stripe is not configured')
  }

  const order = await getOrderForUser(orderId, user)

  if (order.paymentStatus === 'paid') {
    throw new ApiError(400, 'Order is already paid')
  }

  if (order.reservationExpiresAt && new Date(order.reservationExpiresAt).getTime() < Date.now()) {
    if (order.orderStatus !== 'cancelled') {
      await updateOrderStatus(order._id, 'cancelled')
    }
    throw new ApiError(409, 'Inventory reservation expired. Please place order again.')
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'upi'],
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'inr',
        unit_amount: Math.round(item.price * 100),
        product_data: {
          name: item.name,
          description: item.size ? `Size ${item.size}` : undefined,
        },
      },
    })),
    success_url: `${getFrontendUrl()}/checkout?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getFrontendUrl()}/checkout?payment=cancelled`,
    metadata: {
      orderId: order._id.toString(),
      userId: order.user._id.toString(),
      vendors: order.vendors?.map(v => v.vendor?.toString()).join(','),
    },
  })

  // Update order with Stripe checkout session ID
  if (shouldUseLocalStore()) {
    await mutateLocalStore((store) => {
      const order = store.orders.find((entry) => entry._id === orderId)

      if (order) {
        order.paymentDetails = {
          ...(order.paymentDetails || {}),
          stripeCheckoutSessionId: checkoutSession.id,
          provider: 'stripe',
        }
        if (order.orderStatus === 'created' || order.orderStatus === 'pending') {
          order.orderStatus = 'payment_pending'
        }
        order.updatedAt = new Date().toISOString()
      }
    })
  } else {
    await Order.findByIdAndUpdate(orderId, {
      'paymentDetails.stripeCheckoutSessionId': checkoutSession.id,
      ...(order.orderStatus === 'created' || order.orderStatus === 'pending'
        ? { orderStatus: 'payment_pending' }
        : {}),
    })
  }

  return {
    checkoutSessionId: checkoutSession.id,
    checkoutUrl: checkoutSession.url,
    amount: Math.round(order.totalAmount * 100),
    currency: 'inr',
  }
}

// Verify Stripe payment
export const verifyStripePayment = async (paymentIntentId, user) => {
  if (!isStripeConfigured) {
    throw new ApiError(500, 'Stripe is not configured')
  }

  if (typeof paymentIntentId === 'string' && paymentIntentId.startsWith('cs_')) {
    const session = await stripe.checkout.sessions.retrieve(paymentIntentId)

    if (session.payment_status !== 'paid') {
      throw new ApiError(400, 'Payment not completed')
    }

    const orderId = session.metadata?.orderId
    if (!orderId) {
      throw new ApiError(404, 'Order not found for this payment')
    }

    const order = await getOrderForUser(orderId, user)

    return order
  }

  // Find order by Stripe payment intent ID
  const order = shouldUseLocalStore()
    ? await findOrderByPaymentIntentLocal(paymentIntentId)
    : await Order.findOne({
        'paymentDetails.stripePaymentIntentId': paymentIntentId,
        user: user.id,
      })

  if (!order) {
    throw new ApiError(404, 'Order not found for this payment')
  }

  if (shouldUseLocalStore() && order.user !== user._id && order.user !== user.id) {
    throw new ApiError(403, 'You cannot access this order')
  }

  if (order.paymentStatus === 'paid') {
    throw new ApiError(400, 'Order is already paid')
  }

  // Verify payment intent status
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (paymentIntent.status !== 'succeeded') {
    throw new ApiError(400, 'Payment not completed')
  }

  return getOrderForUser(order._id, user)
}

// Processed events tracking for idempotency
const processedEvents = new Set();

// Handle Stripe webhooks (for asynchronous payment events)
export const handleStripeWebhook = async (event) => {
  // IDEMPOTENCY CHECK - prevent duplicate processing
  const eventId = event.id;
  if (processedEvents.has(eventId)) {
    console.log(`Duplicate webhook event: ${eventId}`);
    return { alreadyProcessed: true };
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.payment_status !== 'paid') {
        break
      }

      const order = shouldUseLocalStore()
        ? await mutateLocalStore((store) =>
            (store.orders || []).find(
              (entry) => entry.paymentDetails?.stripeCheckoutSessionId === session.id,
            ) || null,
          )
        : await Order.findOne({ 'paymentDetails.stripeCheckoutSessionId': session.id })

      if (order && order.paymentStatus !== 'paid') {
        await markOrderAsPaid(order._id, {
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
          provider: 'stripe',
          paidAt: new Date(),
        })
      }

      processedEvents.add(eventId)
      break
    }

    case 'payment_intent.succeeded':
      {
        const paymentIntent = event.data.object
        const order = shouldUseLocalStore()
          ? await findOrderByPaymentIntentLocal(paymentIntent.id)
          : await Order.findOne({ 'paymentDetails.stripePaymentIntentId': paymentIntent.id })

        if (order && order.paymentStatus !== 'paid') {
          await markOrderAsPaid(order._id, {
            stripePaymentIntentId: paymentIntent.id,
            provider: 'stripe',
            paidAt: new Date(),
          })
        }

        processedEvents.add(eventId)
      }
      break

    case 'payment_intent.payment_failed':
      {
        const failedPayment = event.data.object
        const order = shouldUseLocalStore()
          ? await findOrderByPaymentIntentLocal(failedPayment.id)
          : await Order.findOne({ 'paymentDetails.stripePaymentIntentId': failedPayment.id })

        if (order) {
          if (order.orderStatus === 'payment_pending' || order.orderStatus === 'created' || order.orderStatus === 'pending') {
            await updateOrderStatus(order._id, 'cancelled')
          }

          if (shouldUseLocalStore()) {
            await mutateLocalStore((store) => {
              const localOrder = (store.orders || []).find((entry) => entry._id === order._id)
              if (!localOrder) {
                return
              }

              localOrder.paymentStatus = 'failed'
              localOrder.paymentDetails = {
                ...(localOrder.paymentDetails || {}),
                failureReason: failedPayment?.last_payment_error?.message || 'Payment failed',
              }
              localOrder.updatedAt = new Date().toISOString()
            })
          } else {
            await Order.findByIdAndUpdate(order._id, {
              paymentStatus: 'failed',
              'paymentDetails.failureReason': failedPayment?.last_payment_error?.message || 'Payment failed',
            })
          }
        }

        processedEvents.add(eventId)
      }
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

export const processStripeRefund = async ({ orderId, user, itemId = null, reason = '' }) => {
  if (!isStripeConfigured) {
    throw new ApiError(500, 'Stripe is not configured')
  }

  const order = await getOrderForUser(orderId, user)

  if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded') {
    throw new ApiError(400, 'Only paid orders can be refunded')
  }

  const refundItems = itemId
    ? (order.items || []).filter((entry) => entry._id?.toString() === itemId.toString())
    : (order.items || [])

  if (!refundItems.length) {
    throw new ApiError(404, 'Refund item not found')
  }

  const refundAmount = refundItems.reduce(
    (sum, entry) => sum + Number(entry.price || 0) * Number(entry.quantity || 0),
    0,
  )

  if (shouldUseLocalStore()) {
    return markOrderRefunded(order._id, {
      refundAmount,
      reason,
      itemId,
      isPartial: refundAmount < Number(order.totalAmount || 0),
    })
  }

  const paymentIntentId = order.paymentDetails?.stripePaymentIntentId
  if (!paymentIntentId) {
    throw new ApiError(400, 'Stripe payment intent not found for this order')
  }

  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.round(refundAmount * 100),
    reason: 'requested_by_customer',
  })

  return markOrderRefunded(order._id, {
    refundAmount,
    reason,
    itemId,
    isPartial: refundAmount < Number(order.totalAmount || 0),
  })
}
