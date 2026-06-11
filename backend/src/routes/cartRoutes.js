import { Router } from 'express';
import {
  addToCart,
  getCart,
  removeCartItem,
  syncCart,
  updateCartItem,
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  cartItemParamValidator,
  cartItemValidator,
  cartQuantityValidator,
  cartSyncValidator,
} from '../middleware/validators.js';

const router = Router();

router.use(protect);

router.get('/', getCart);
router.post('/sync', cartSyncValidator, validate, syncCart);
router.post('/items', cartItemValidator, validate, addToCart);
router.put('/items/:productId', cartQuantityValidator, validate, updateCartItem);
router.delete('/items/:productId', cartItemParamValidator, validate, removeCartItem);

export default router;
