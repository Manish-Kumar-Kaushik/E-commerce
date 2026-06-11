import Vendor from '../models/Vendor.js';
import { readLocalStore, shouldUseLocalStore } from '../services/localStoreService.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const requireVendorRole = (req, res, next) => {
  if (!req.user || req.user.role !== 'vendor') {
    next(new ApiError(403, 'Vendor access required'));
    return;
  }

  next();
};

export const requireApprovedVendor = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== 'vendor') {
    throw new ApiError(403, 'Vendor access required');
  }

  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const vendorProfile = (store.vendors || []).find((vendor) => vendor.user === req.user._id);

    if (!vendorProfile) {
      throw new ApiError(403, 'Please complete your vendor profile first');
    }

    if (vendorProfile.status !== 'approved') {
      throw new ApiError(403, 'Vendor account is pending admin approval');
    }

    req.vendorProfile = vendorProfile;
    next();
    return;
  }

  const vendorProfile = await Vendor.findOne({ user: req.user._id });

  if (!vendorProfile) {
    throw new ApiError(403, 'Please complete your vendor profile first');
  }

  if (vendorProfile.status !== 'approved') {
    throw new ApiError(403, 'Vendor account is pending admin approval');
  }

  req.vendorProfile = vendorProfile;
  next();
});

export const requireTrustedVendor = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== 'vendor') {
    throw new ApiError(403, 'Vendor access required');
  }

  const vendorProfile = await Vendor.findOne({ user: req.user._id });

  if (!vendorProfile || vendorProfile.status !== 'approved') {
    throw new ApiError(403, 'Approved vendor required');
  }

  if (!['trusted', 'premium'].includes(vendorProfile.trustLevel)) {
    throw new ApiError(403, 'Trusted vendor status required for this action');
  }

  req.vendorProfile = vendorProfile;
  next();
});

export const requireNotSuspended = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (req.user.role === 'vendor') {
    const vendorProfile = await Vendor.findOne({ user: req.user._id });
    
    if (vendorProfile && vendorProfile.status === 'suspended') {
      throw new ApiError(403, 'Vendor account is suspended. Contact support.');
    }
  }

  next();
});
