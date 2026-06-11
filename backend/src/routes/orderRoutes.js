import { Router } from 'express';
import {
  cancelMyOrderController,
  createOrder,
  downloadOrderInvoiceController,
  getMyOrders,
  getOrderByIdController,
  refundOrderController,
  trackPublicOrderController,
  requestOrderReturnController,
  updateOrderStatusController,
} from '../controllers/orderController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  cancelOrderValidator,
  createOrderValidator,
  orderInvoiceValidator,
  orderRefundValidator,
  mongoIdParamValidator,
  trackOrderValidator,
  requestOrderReturnValidator,
  updateOrderStatusValidator,
} from '../middleware/validators.js';

const router = Router();

router.get('/track', trackOrderValidator, validate, trackPublicOrderController);

router.use(protect);

router.post('/', createOrderValidator, validate, createOrder);
router.get('/', getMyOrders);
router.get('/:id/invoice', orderInvoiceValidator, validate, downloadOrderInvoiceController);
router.get('/:id', mongoIdParamValidator, validate, getOrderByIdController);
router.patch('/:id/cancel', cancelOrderValidator, validate, cancelMyOrderController);
router.patch('/:id/return-request', requestOrderReturnValidator, validate, requestOrderReturnController);
router.post('/:id/refund', authorize('admin'), orderRefundValidator, validate, refundOrderController);
router.put('/:id/status', authorize('admin'), updateOrderStatusValidator, validate, updateOrderStatusController);

export default router;
