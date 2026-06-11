import asyncHandler from '../utils/asyncHandler.js';
import {
  clearWishlist,
  getWishlistForUser,
  removeWishlistItem,
  toggleWishlistItem,
} from '../services/wishlistService.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getWishlistForUser(req.user._id);

  res.status(200).json({
    success: true,
    wishlist,
  });
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const productId = req.body.productId || req.body.product;
  const wishlist = await toggleWishlistItem(req.user._id, productId);

  res.status(200).json({
    success: true,
    message: 'Wishlist updated successfully',
    wishlist,
  });
});

export const deleteWishlistItem = asyncHandler(async (req, res) => {
  const wishlist = await removeWishlistItem(req.user._id, req.params.productId);

  res.status(200).json({
    success: true,
    message: 'Wishlist item removed successfully',
    wishlist,
  });
});

export const clearUserWishlist = asyncHandler(async (req, res) => {
  const wishlist = await clearWishlist(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Wishlist cleared successfully',
    wishlist,
  });
});
