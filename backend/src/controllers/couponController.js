import asyncHandler from '../utils/asyncHandler.js';
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
} from '../services/couponService.js';

export const getCouponsController = asyncHandler(async (req, res) => {
  const coupons = await getCoupons(req.query);

  res.status(200).json({
    success: true,
    coupons,
  });
});

export const createCouponController = asyncHandler(async (req, res) => {
  const coupon = await createCoupon(req.body);

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    coupon,
  });
});

export const updateCouponController = asyncHandler(async (req, res) => {
  const coupon = await updateCoupon(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Coupon updated successfully',
    coupon,
  });
});

export const deleteCouponController = asyncHandler(async (req, res) => {
  await deleteCoupon(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully',
  });
});
