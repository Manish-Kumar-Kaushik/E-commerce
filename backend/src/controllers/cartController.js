import asyncHandler from '../utils/asyncHandler.js';
import {
  addItemToCart,
  getUserCart,
  removeItemFromCart,
  syncCartItems,
  updateCartItemQuantity,
} from '../services/cartService.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getUserCart(req.user._id);

  res.status(200).json({
    success: true,
    cart,
  });
});

export const addToCart = asyncHandler(async (req, res) => {
  const cart = await addItemToCart(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    cart,
  });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await updateCartItemQuantity(
    req.user._id,
    req.params.productId,
    req.body.quantity,
    req.body.size,
    req.body.color,
  );

  res.status(200).json({
    success: true,
    message: 'Cart updated successfully',
    cart,
  });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await removeItemFromCart(req.user._id, req.params.productId, req.query.size, req.query.color);

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    cart,
  });
});

export const syncCart = asyncHandler(async (req, res) => {
  const cart = await syncCartItems(req.user._id, req.body.items);

  res.status(200).json({
    success: true,
    message: 'Cart synced successfully',
    cart,
  });
});
