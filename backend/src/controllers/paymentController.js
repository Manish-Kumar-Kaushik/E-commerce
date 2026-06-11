import asyncHandler from '../utils/asyncHandler.js';
import { createStripePaymentIntent, verifyStripePayment } from '../services/stripeService.js';

// Stripe payment endpoints
export const createStripePaymentIntentHandler = asyncHandler(async (req, res) => {
  const paymentIntent = await createStripePaymentIntent(req.body.orderId, req.user);

  res.status(201).json({
    success: true,
    message: 'Stripe payment intent created successfully',
    paymentIntent,
  });
});

export const verifyStripePaymentHandler = asyncHandler(async (req, res) => {
  const order = await verifyStripePayment(req.body.paymentIntentId, req.user);

  res.status(200).json({
    success: true,
    message: 'Stripe payment verified successfully',
    order,
  });
});
