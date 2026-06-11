import Coupon from '../models/Coupon.js';
import {
  createLocalId,
  mutateLocalStore,
  readLocalStore,
  shouldUseLocalStore,
} from './localStoreService.js';
import ApiError from '../utils/ApiError.js';

const isValidCouponForDate = (coupon) => {
  if (!coupon.isActive) return false;

  if (coupon.startsAt && new Date() < coupon.startsAt) {
    return false;
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return false;
  }

  return true;
};

const isValidCouponForUsage = (coupon) => {
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return false;
  }

  return true;
};

const calculateDiscountFromCoupon = (coupon, subtotal) => {
  if (!coupon) {
    return 0;
  }

  if (!isValidCouponForDate(coupon) || !isValidCouponForUsage(coupon)) {
    return 0;
  }

  let discountAmount = 0;

  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
  } else if (coupon.discountType === 'fixed') {
    discountAmount = coupon.discountValue;
  }

  if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
    discountAmount = coupon.maxDiscountAmount;
  }

  return Math.max(0, Math.min(discountAmount, subtotal));
};

export const getCouponByCode = async (code) => {
  const normalizedCode = code.toString().trim().toUpperCase();

  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const coupon = (store.coupons || []).find(
      (entry) => entry.code?.toUpperCase() === normalizedCode
    );

    return coupon || null;
  }

  return Coupon.findOne({ code: normalizedCode });
};

export const validateAndApplyCoupon = async (code, subtotal) => {
  const coupon = await getCouponByCode(code);

  if (!coupon) {
    return {
      valid: false,
      discountAmount: 0,
      couponCode: '',
      reason: 'Coupon not found',
    };
  }

  if (!isValidCouponForDate(coupon)) {
    return {
      valid: false,
      discountAmount: 0,
      couponCode: '',
      reason: coupon.expiresAt && new Date() > coupon.expiresAt
        ? 'Coupon has expired'
        : 'Coupon is not yet active',
    };
  }

  if (!isValidCouponForUsage(coupon)) {
    return {
      valid: false,
      discountAmount: 0,
      couponCode: '',
      reason: 'Coupon usage limit has been reached',
    };
  }

  const numericSubtotal = Number(subtotal || 0);

  if (coupon.minOrderAmount && numericSubtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      couponCode: '',
      reason: `Minimum order amount of Rs. ${coupon.minOrderAmount} required`,
    };
  }

  const discountAmount = calculateDiscountFromCoupon(coupon, numericSubtotal);

  return {
    valid: true,
    discountAmount,
    couponCode: coupon.code,
    coupon,
  };
};

export const createCoupon = async (payload) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const normalizedCode = payload.code.toString().trim().toUpperCase();

      const duplicate = (store.coupons || []).find(
        (entry) => entry.code?.toUpperCase() === normalizedCode
      );

      if (duplicate) {
        throw new ApiError(409, 'Coupon code already exists');
      }

      const coupon = {
        _id: createLocalId(),
        code: normalizedCode,
        description: payload.description || '',
        discountType: payload.discountType || 'percentage',
        discountValue: Number(payload.discountValue || 0),
        minOrderAmount: Number(payload.minOrderAmount || 0),
        maxDiscountAmount: payload.maxDiscountAmount ? Number(payload.maxDiscountAmount) : null,
        usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
        usedCount: 0,
        startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
        isActive: payload.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.coupons = store.coupons || [];
      store.coupons.push(coupon);

      return coupon;
    });
  }

  return Coupon.create({
    code: payload.code.toString().trim().toUpperCase(),
    description: payload.description || '',
    discountType: payload.discountType || 'percentage',
    discountValue: Number(payload.discountValue || 0),
    minOrderAmount: Number(payload.minOrderAmount || 0),
    maxDiscountAmount: payload.maxDiscountAmount ? Number(payload.maxDiscountAmount) : null,
    usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
    startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
    expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
    isActive: payload.isActive !== false,
  });
};

export const updateCoupon = async (couponId, payload) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const coupon = (store.coupons || []).find((entry) => entry._id === couponId);

      if (!coupon) {
        throw new ApiError(404, 'Coupon not found');
      }

      if (payload.code) {
        const normalizedCode = payload.code.toString().trim().toUpperCase();
        const duplicate = (store.coupons || []).find(
          (entry) => entry._id !== couponId && entry.code?.toUpperCase() === normalizedCode
        );

        if (duplicate) {
          throw new ApiError(409, 'Coupon code already exists');
        }

        coupon.code = normalizedCode;
      }

      if (payload.description !== undefined) coupon.description = payload.description;
      if (payload.discountType !== undefined) coupon.discountType = payload.discountType;
      if (payload.discountValue !== undefined) coupon.discountValue = Number(payload.discountValue);
      if (payload.minOrderAmount !== undefined) coupon.minOrderAmount = Number(payload.minOrderAmount);
      if (payload.maxDiscountAmount !== undefined) {
        coupon.maxDiscountAmount = payload.maxDiscountAmount ? Number(payload.maxDiscountAmount) : null;
      }
      if (payload.usageLimit !== undefined) {
        coupon.usageLimit = payload.usageLimit ? Number(payload.usageLimit) : null;
      }
      if (payload.startsAt !== undefined) coupon.startsAt = payload.startsAt ? new Date(payload.startsAt) : null;
      if (payload.expiresAt !== undefined) coupon.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
      if (payload.isActive !== undefined) coupon.isActive = payload.isActive;

      coupon.updatedAt = new Date().toISOString();

      return coupon;
    });
  }

  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  if (payload.code) {
    const normalizedCode = payload.code.toString().trim().toUpperCase();
    const duplicate = await Coupon.findOne({
      code: normalizedCode,
      _id: { $ne: couponId },
    });

    if (duplicate) {
      throw new ApiError(409, 'Coupon code already exists');
    }

    coupon.code = normalizedCode;
  }

  if (payload.description !== undefined) coupon.description = payload.description;
  if (payload.discountType !== undefined) coupon.discountType = payload.discountType;
  if (payload.discountValue !== undefined) coupon.discountValue = Number(payload.discountValue);
  if (payload.minOrderAmount !== undefined) coupon.minOrderAmount = Number(payload.minOrderAmount);
  if (payload.maxDiscountAmount !== undefined) {
    coupon.maxDiscountAmount = payload.maxDiscountAmount ? Number(payload.maxDiscountAmount) : null;
  }
  if (payload.usageLimit !== undefined) {
    coupon.usageLimit = payload.usageLimit ? Number(payload.usageLimit) : null;
  }
  if (payload.startsAt !== undefined) coupon.startsAt = payload.startsAt ? new Date(payload.startsAt) : null;
  if (payload.expiresAt !== undefined) coupon.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  if (payload.isActive !== undefined) coupon.isActive = payload.isActive;

  await coupon.save();

  return coupon;
};

export const deleteCoupon = async (couponId) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      store.coupons = (store.coupons || []).filter((entry) => entry._id !== couponId);
    });
  }

  const result = await Coupon.findByIdAndDelete(couponId);

  if (!result) {
    throw new ApiError(404, 'Coupon not found');
  }
};

export const getCoupons = async (query = {}) => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    return (store.coupons || []).sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
    );
  }

  return Coupon.find().sort({ createdAt: -1 });
};

export const incrementCouponUsage = async (couponId) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const coupon = (store.coupons || []).find((entry) => entry._id === couponId);

      if (coupon) {
        coupon.usedCount += 1;
        coupon.updatedAt = new Date().toISOString();
      }
    });
  }

  await Coupon.findByIdAndUpdate(
    couponId,
    { $inc: { usedCount: 1 } },
    { new: true }
  );
};
