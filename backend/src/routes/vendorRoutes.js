import { Router } from 'express';
import {
  createVendorProfile,
  getMyVendorProfile,
  getVendorProfile,
  updateVendorProfile,
  getVendorBankDetails,
  updateVendorBankDetails,
  withdrawFromWallet,
  getVendorOrders,
  getVendorWallet,
  getVendorAnalytics,
  updateVendorOrderStatus,
  approveVendorReturnRequest,
  rejectVendorReturnRequest,
  getVendorStatus,
  requestVendorPhoneOtp,
  verifyVendorPhoneOtp,
} from '../controllers/vendorController.js';
import { createVendor } from '../services/vendorService.js';
import { protect, protectWithOptionalAuth, getUserFromEmail } from '../middleware/authMiddleware.js';
import { requireApprovedVendor, requireVendorRole } from '../middleware/vendorAccessMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  mongoIdParamValidator,
  orderStatusValidator,
  returnApprovalRouteValidator,
  requestVendorPhoneOtpValidator,
  verifyVendorPhoneOtpValidator,
  createVendorProfileValidator,
} from '../middleware/validators.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Vendor routes working' });
});

router.post('/register', createVendorProfileValidator, validate, protectWithOptionalAuth, async (req, res, next) => {
  try {
    const { businessEmail } = req.body;

    let userId = req.user?._id;
    let userEmail = businessEmail;

    if (!userId && userEmail) {
      const user = await getUserFromEmail(userEmail);
      if (user) {
        userId = user._id;
      }
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please login or provide email to associate with your account',
      });
    }

    const vendor = await createVendor(userId, {
      ...req.body,
      businessEmail: userEmail || req.body.businessEmail,
    });
    
    res.status(201).json({
      success: true,
      message: 'Vendor profile created. Awaiting admin approval.',
      vendor,
    });
  } catch (error) {
    next(error);
  }
});

// These require authentication
router.use(protect);

router.post('/phone-otp/request', requestVendorPhoneOtpValidator, validate, requestVendorPhoneOtp);
router.post('/phone-otp/verify', verifyVendorPhoneOtpValidator, validate, verifyVendorPhoneOtp);

router.get('/me/status', getVendorStatus);
router.post('/', createVendorProfile);
router.get('/me', getMyVendorProfile);
router.patch('/me', requireVendorRole, updateVendorProfile);
router.get('/bank-details', requireVendorRole, getVendorBankDetails);
router.put('/bank-details', requireVendorRole, updateVendorBankDetails);
router.post('/wallet/withdraw', requireVendorRole, withdrawFromWallet);

router.get('/orders', requireApprovedVendor, getVendorOrders);
router.patch('/orders/:id/status', requireApprovedVendor, orderStatusValidator, validate, updateVendorOrderStatus);
router.patch('/orders/:id/return/:itemId/approve', requireApprovedVendor, returnApprovalRouteValidator, validate, approveVendorReturnRequest);
router.patch('/orders/:id/return/:itemId/reject', requireApprovedVendor, returnApprovalRouteValidator, validate, rejectVendorReturnRequest);
router.get('/wallet', requireApprovedVendor, getVendorWallet);
router.get('/analytics', requireApprovedVendor, getVendorAnalytics);

router.get('/:id', requireApprovedVendor, mongoIdParamValidator, validate, getVendorProfile);

export default router;
