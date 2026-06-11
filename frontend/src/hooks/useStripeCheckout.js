import { useState } from 'react'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../utils/api'

export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(false)

  const createPaymentIntent = async (orderId) => {
    const token = localStorage.getItem('token')
    
    const response = await fetch(`${API_BASE_URL}/payments/stripe/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create payment intent')
    }

    return response.json()
  }

  const initializeStripeCheckout = async (orderId) => {
    setIsLoading(true)

    try {
      const { paymentIntent } = await createPaymentIntent(orderId)

      if (!paymentIntent?.checkoutUrl) {
        throw new Error('Stripe checkout URL missing')
      }

      window.location.href = paymentIntent.checkoutUrl
      return { success: true, orderId }
    } catch (error) {
      console.error('Stripe checkout error:', error)
      toast.error(error.message || 'Payment failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    initializeStripeCheckout,
    isLoading,
    isStripeReady: true,
  }
}
