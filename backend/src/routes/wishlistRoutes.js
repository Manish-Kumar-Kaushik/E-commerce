import { Router } from 'express';
import {
  clearUserWishlist,
  deleteWishlistItem,
  getWishlist,
  toggleWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/items/:productId', deleteWishlistItem);
router.delete('/', clearUserWishlist);

export default router;
