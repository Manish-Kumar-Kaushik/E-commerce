import asyncHandler from '../utils/asyncHandler.js';
import {
  createReview,
  deleteReview,
  getReviewEligibility,
  getProductReviews,
  updateReview,
} from '../services/reviewService.js';

export const getProductReviewsController = asyncHandler(async (req, res) => {
  const result = await getProductReviews(req.params.identifier, req.query);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getReviewEligibilityController = asyncHandler(async (req, res) => {
  const eligibility = await getReviewEligibility({
    identifier: req.params.identifier,
    userId: req.user._id,
  });

  res.status(200).json({
    success: true,
    eligibility,
  });
});

export const createReviewController = asyncHandler(async (req, res) => {
  const review = await createReview({
    productId: req.params.identifier,
    userId: req.user._id,
    payload: req.body,
  });

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    review,
  });
});

export const updateReviewController = asyncHandler(async (req, res) => {
  const review = await updateReview(req.params.id, req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    review,
  });
});

export const deleteReviewController = asyncHandler(async (req, res) => {
  await deleteReview(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
});
