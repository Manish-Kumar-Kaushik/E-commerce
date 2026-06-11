import express from 'express';
import { chatCustomerSupport, generateProductContent } from '../controllers/aiController.js';
import { protect, protectWithOptionalAuth } from '../middleware/authMiddleware.js';
import { requireApprovedVendor } from '../middleware/vendorAccessMiddleware.js';

console.log('AI routes loaded');

const router = express.Router();

// lightweight health check for AI routes
router.get('/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'AI routes reachable' });
});

// Development/testing endpoint - unprotected, for quick testing
router.post('/generate-product-content/debug', async (req, res, next) => {
  try {
    return await generateProductContent(req, res, next);
  } catch (err) {
    return next(err);
  }
});

// Production endpoint - requires auth
router.route('/generate-product-content').post(protect, requireApprovedVendor, generateProductContent);

router.post('/customer-support/chat', protectWithOptionalAuth, chatCustomerSupport);

export default router;