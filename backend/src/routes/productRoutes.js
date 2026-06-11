import { Router } from 'express';
import {
  createProductController,
  deleteProductController,
  getProductController,
  getProductsController,
  updateProductController,
} from '../controllers/productController.js';
import {
  createReviewController,
  deleteReviewController,
  getReviewEligibilityController,
  getProductReviewsController,
  updateReviewController,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireApprovedVendor } from '../middleware/vendorAccessMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createProductValidator,
  reviewCreateValidator,
  reviewIdValidator,
  reviewUpdateValidator,
  productQueryValidator,
  updateProductValidator,
} from '../middleware/validators.js';

const router = Router();

router
  .route('/')
  .get(productQueryValidator, validate, getProductsController)
  .post(protect, requireApprovedVendor, createProductValidator, validate, createProductController);

router
  .route('/:identifier')
  .get(getProductController)
  .put(protect, requireApprovedVendor, updateProductValidator, validate, updateProductController)
  .delete(protect, requireApprovedVendor, updateProductValidator, validate, deleteProductController);

router
  .route('/:identifier/reviews/eligibility')
  .get(protect, getReviewEligibilityController);

router
  .route('/:identifier/reviews')
  .get(getProductReviewsController)
  .post(protect, reviewCreateValidator, validate, createReviewController);

router
  .route('/reviews/:id')
  .patch(protect, reviewUpdateValidator, validate, updateReviewController)
  .delete(protect, reviewIdValidator, validate, deleteReviewController);

export default router;
