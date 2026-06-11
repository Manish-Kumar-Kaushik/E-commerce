import { Router } from 'express';
import { createStripePaymentIntentHandler, verifyStripePaymentHandler } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { paymentOrderValidator, stripePaymentVerificationValidator } from '../middleware/validators.js';

const router = Router();

router.use(protect);

router.post('/stripe/create-payment-intent', paymentOrderValidator, validate, createStripePaymentIntentHandler);
router.post('/stripe/verify-payment', stripePaymentVerificationValidator, validate, verifyStripePaymentHandler);

export default router;
