import { Router } from 'express';
import {
 	adminLogin,
 	login,
  requestResetOtp,
  resetPassword,
 	register,
 	syncUser,
	verifyResetOtp,
 	vendorLogin,
 } from '../controllers/authController.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  loginValidator,
  registerValidator,
  requestPasswordResetOtpValidator,
  resetPasswordWithOtpValidator,
  syncUserValidator,
  verifyPasswordResetOtpValidator,
} from '../middleware/validators.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Simple in-memory rate limiter (production me Redis use karein)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: { success: false, message: 'Too many accounts created. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerRateLimiter, registerValidator, validate, register);
router.post('/login', authRateLimiter, loginValidator, validate, login);
router.post('/admin/login', authRateLimiter, loginValidator, validate, adminLogin);
router.post('/admin-login', authRateLimiter, loginValidator, validate, adminLogin);
router.post('/vendor/login', authRateLimiter, loginValidator, validate, vendorLogin);
router.post('/sync-user', syncUserValidator, validate, syncUser);
router.post('/forgot-password/request-otp', authRateLimiter, requestPasswordResetOtpValidator, validate, requestResetOtp);
router.post('/forgot-password/verify-otp', authRateLimiter, verifyPasswordResetOtpValidator, validate, verifyResetOtp);
router.post('/forgot-password/reset', authRateLimiter, resetPasswordWithOtpValidator, validate, resetPassword);

export default router;
