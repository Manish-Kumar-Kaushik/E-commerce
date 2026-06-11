import { Router } from 'express';
import { getAnalytics, getAdminProfile, updateAdminProfile, updateAdminPassword, updateAdminEmail } from '../controllers/adminController.js';
import {
  createCollectionController,
  deleteCollectionController,
  updateCollectionController,
} from '../controllers/collectionController.js';
import {
  createCouponController,
  deleteCouponController,
  getCouponsController,
  updateCouponController,
} from '../controllers/couponController.js';
import { getOrders } from '../controllers/orderController.js';
import { changeUserRole, deleteUser, getUsers } from '../controllers/userController.js';
import {
  getAdminVendors,
  approveVendorController,
  rejectVendorController,
  suspendVendorController,
  getCommissionSettings,
  updateCommissionSettings,
} from '../controllers/vendorController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  collectionValidator,
  couponValidator,
  mongoIdParamValidator,
  updateCollectionValidator,
  updateCouponValidator,
  userRoleValidator,
} from '../middleware/validators.js';

const router = Router();

router.use(requireAdmin);

// Admin profile endpoints
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.patch('/password', updateAdminPassword);
router.patch('/email', updateAdminEmail);

router.get('/analytics', getAnalytics);
router.get('/orders', getOrders);
router.get('/users', getUsers);
router.patch('/users/:id/role', userRoleValidator, validate, changeUserRole);
router.delete('/users/:id', mongoIdParamValidator, validate, deleteUser);
router.post('/collections', collectionValidator, validate, createCollectionController);
router.put('/collections/:id', updateCollectionValidator, validate, updateCollectionController);
router.delete('/collections/:id', mongoIdParamValidator, validate, deleteCollectionController);

router.get('/coupons', getCouponsController);
router.post('/coupons', couponValidator, validate, createCouponController);
router.put('/coupons/:id', updateCouponValidator, validate, updateCouponController);
router.delete('/coupons/:id', mongoIdParamValidator, validate, deleteCouponController);

router.get('/vendors', getAdminVendors);
router.patch('/vendors/:id/approve', approveVendorController);
router.patch('/vendors/:id/reject', rejectVendorController);
router.patch('/vendors/:id/suspend', suspendVendorController);

router.get('/commission', getCommissionSettings);
router.patch('/commission', updateCommissionSettings);

export default router;
