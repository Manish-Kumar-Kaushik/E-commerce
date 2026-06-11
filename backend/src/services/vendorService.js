import Vendor from '../models/Vendor.js';
import VendorWallet from '../models/VendorWallet.js';
import CommissionSettings from '../models/CommissionSettings.js';
import { randomInt } from 'crypto';
import ApiError from '../utils/ApiError.js';
import {
  createLocalId,
  findUserByIdLocal,
  mutateLocalStore,
  readLocalStore,
  shouldUseLocalStore,
} from './localStoreService.js';
import User from '../models/User.js';
import VendorPhoneVerificationOtp from '../models/VendorPhoneVerificationOtp.js';
import { sendVendorPhoneVerificationOtpEmail } from '../utils/email.js';

const VENDOR_PHONE_OTP_TTL_MINUTES = 10;
const VENDOR_PHONE_OTP_MAX_ATTEMPTS = 5;

const normalizeEmail = (email = '') => String(email || '').trim().toLowerCase();
const normalizePhone = (phone = '') => String(phone || '').replace(/\D+/g, '');

const ensureBusinessPhone = (phone = '') => {
  const normalized = normalizePhone(phone);

  if (normalized.length < 10 || normalized.length > 15) {
    throw new ApiError(400, 'Please enter a valid business phone number');
  }

  return normalized;
};

const ensureBusinessEmail = (email = '') => {
  const normalized = normalizeEmail(email);

  if (!normalized || !normalized.includes('@')) {
    throw new ApiError(400, 'Please enter a valid business email');
  }

  return normalized;
};

const ensureOtpValue = (otp = '') => {
  const sanitizedOtp = String(otp || '').trim();

  if (!/^\d{6}$/.test(sanitizedOtp)) {
    throw new ApiError(400, 'Please enter a valid 6-digit OTP');
  }

  return sanitizedOtp;
};

const isVendorPhoneOtpRequired = process.env.REQUIRE_VENDOR_PHONE_OTP === 'true';

const generateOtp = () => String(randomInt(100000, 1000000));

const consumeVerifiedPhoneOtpLocal = (store, userId, businessPhone, businessEmail) => {
  const now = Date.now();
  const records = (store.vendorPhoneOtps || [])
    .filter(
      (entry) =>
        entry.user === userId
        && normalizePhone(entry.businessPhone) === businessPhone
        && normalizeEmail(entry.businessEmail) === businessEmail
        && entry.verifiedAt
        && !entry.usedAt,
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const record = records[0] || null;

  if (!record) {
    throw new ApiError(400, 'Please verify business phone using OTP');
  }

  if (!record.expiresAt || new Date(record.expiresAt).getTime() < now) {
    throw new ApiError(400, 'OTP expired. Please request a new OTP');
  }

  record.usedAt = new Date().toISOString();
  record.updatedAt = new Date().toISOString();

  return {
    verifiedAt: record.verifiedAt,
    verifiedEmail: businessEmail,
  };
};

const consumeVerifiedPhoneOtpMongo = async (userId, businessPhone, businessEmail) => {
  const record = await VendorPhoneVerificationOtp.findOne({
    user: userId,
    businessPhone,
    businessEmail,
    verifiedAt: { $ne: null },
    usedAt: null,
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new ApiError(400, 'Please verify business phone using OTP');
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'OTP expired. Please request a new OTP');
  }

  record.usedAt = new Date();
  await record.save();

  return {
    verifiedAt: record.verifiedAt,
    verifiedEmail: businessEmail,
  };
};

const toStoreSlug = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const buildVendorPayload = (vendorData = {}, user) => {
  const storeName = vendorData?.storeName?.trim() || vendorData?.businessName?.trim() || '';
  const storeSlug = vendorData?.storeSlug?.trim() || toStoreSlug(storeName);

  return {
    fullName: vendorData?.fullName?.trim() || user?.name || '',
    storeName,
    storeSlug,
    businessName: storeName,
    businessType: vendorData?.businessType || '',
    businessLogo: vendorData?.storeLogo || vendorData?.businessLogo || '',
    storeBanner: vendorData?.storeBanner || '',
    businessDescription: vendorData?.storeDescription || vendorData?.businessDescription || '',
    businessEmail: vendorData?.businessEmail || user?.email || '',
    businessPhone: vendorData?.businessPhone || user?.phone || '',
    alternateContact: vendorData?.alternateContact || '',
    pickupAddress: vendorData?.pickupAddress || '',
    pincode: vendorData?.pincode || '',
    panCardNumber: vendorData?.panCardNumber || '',
    aadhaarNumber: vendorData?.aadhaarNumber || '',
    businessAddress: vendorData?.businessAddress || {},
    bankDetails: vendorData?.bankDetails || {},
    kycDocuments: vendorData?.kycDocuments || {},
    documentUploads: vendorData?.documentUploads || {},
    storeCategories: Array.isArray(vendorData?.storeCategories) ? vendorData.storeCategories : [],
    returnPolicy: vendorData?.returnPolicy || '',
  };
};

export const createVendor = async (userId, vendorData) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const user = store.users.find((entry) => entry._id === userId);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const payload = buildVendorPayload(vendorData, user);
      const normalizedBusinessPhone = ensureBusinessPhone(payload.businessPhone || user.phone || '');
      const normalizedBusinessEmail = ensureBusinessEmail(payload.businessEmail || user.email || '');
      const existingVendor = (store.vendors || []).find((entry) => entry.user === userId);
      const conflictingVendor = payload.storeSlug
        ? (store.vendors || []).find((entry) => entry.storeSlug === payload.storeSlug && entry.user !== userId)
        : null;

      if (conflictingVendor) {
        throw new ApiError(400, 'Store name already exists. Please choose a different store name.');
      }

      if (existingVendor) {
        if (existingVendor.status === 'approved') {
          throw new ApiError(400, 'Vendor profile already exists for this user');
        }

        const existingPhone = normalizePhone(existingVendor.businessPhone || '');
        const existingEmail = normalizeEmail(existingVendor.businessEmail || '');
        const isSameVerifiedPhone =
          existingVendor.businessPhoneVerified
          && existingPhone === normalizedBusinessPhone
          && existingEmail === normalizedBusinessEmail;

        const verification = isSameVerifiedPhone
            ? {
                verifiedAt: existingVendor.businessPhoneVerifiedAt || new Date().toISOString(),
                verifiedEmail: normalizedBusinessEmail,
                skipped: false,
              }
            : isVendorPhoneOtpRequired
              ? consumeVerifiedPhoneOtpLocal(store, userId, normalizedBusinessPhone, normalizedBusinessEmail)
              : {
                  verifiedAt: new Date().toISOString(),
                  verifiedEmail: normalizedBusinessEmail,
                  skipped: true,
                };

        existingVendor.fullName = payload.fullName || existingVendor.fullName || '';
        existingVendor.storeName = payload.storeName || existingVendor.storeName || '';
        existingVendor.storeSlug = payload.storeSlug || existingVendor.storeSlug || '';
        existingVendor.businessName = payload.businessName || existingVendor.businessName || '';
        existingVendor.businessType = payload.businessType || existingVendor.businessType || '';
        existingVendor.businessLogo = payload.businessLogo || existingVendor.businessLogo || '';
        existingVendor.storeBanner = payload.storeBanner || existingVendor.storeBanner || '';
        existingVendor.businessDescription = payload.businessDescription || existingVendor.businessDescription || '';
        existingVendor.businessEmail = normalizedBusinessEmail;
        existingVendor.businessPhone = normalizedBusinessPhone;
        existingVendor.businessPhoneVerified = true;
        existingVendor.businessPhoneVerifiedAt = verification.verifiedAt;
        existingVendor.businessPhoneVerifiedEmail = verification.verifiedEmail;
        existingVendor.alternateContact = payload.alternateContact || existingVendor.alternateContact || '';
        existingVendor.pickupAddress = payload.pickupAddress || existingVendor.pickupAddress || '';
        existingVendor.pincode = payload.pincode || existingVendor.pincode || '';
        existingVendor.panCardNumber = payload.panCardNumber || existingVendor.panCardNumber || '';
        existingVendor.aadhaarNumber = payload.aadhaarNumber || existingVendor.aadhaarNumber || '';
        existingVendor.businessAddress = {
          line1: payload.businessAddress?.line1 || existingVendor.businessAddress?.line1 || '',
          line2: payload.businessAddress?.line2 || existingVendor.businessAddress?.line2 || '',
          city: payload.businessAddress?.city || existingVendor.businessAddress?.city || '',
          state: payload.businessAddress?.state || existingVendor.businessAddress?.state || '',
          postalCode: payload.businessAddress?.postalCode || existingVendor.businessAddress?.postalCode || '',
          country: payload.businessAddress?.country || existingVendor.businessAddress?.country || 'India',
        };
        existingVendor.bankDetails = payload.bankDetails || existingVendor.bankDetails || {};
        existingVendor.kycDocuments = payload.kycDocuments || existingVendor.kycDocuments || {};
        existingVendor.documentUploads = payload.documentUploads || existingVendor.documentUploads || {};
        existingVendor.storeCategories = payload.storeCategories || existingVendor.storeCategories || [];
        existingVendor.returnPolicy = payload.returnPolicy || existingVendor.returnPolicy || '';
        existingVendor.status = 'pending';
        existingVendor.rejectedReason = '';
        existingVendor.approvedAt = null;
        existingVendor.approvedBy = null;
        existingVendor.updatedAt = new Date().toISOString();

        return {
          ...existingVendor,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
        };
      }

      const vendor = {
        _id: createLocalId(),
        user: userId,
        ...buildVendorPayload(vendorData, user),
        businessEmail: normalizedBusinessEmail,
        businessPhone: normalizedBusinessPhone,
        businessAddress: {
          line1: vendorData?.businessAddress?.line1 || '',
          line2: vendorData?.businessAddress?.line2 || '',
          city: vendorData?.businessAddress?.city || '',
          state: vendorData?.businessAddress?.state || '',
          postalCode: vendorData?.businessAddress?.postalCode || '',
          country: vendorData?.businessAddress?.country || 'India',
        },
        status: 'pending',
        businessPhoneVerified: true,
        businessPhoneVerifiedAt: null,
        businessPhoneVerifiedEmail: normalizedBusinessEmail,
        rejectedReason: '',
        approvedAt: null,
        approvedBy: null,
        commissionRate: null,
        totalSales: 0,
        totalOrders: 0,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.vendors = store.vendors || [];
      const verification = isVendorPhoneOtpRequired
        ? consumeVerifiedPhoneOtpLocal(store, userId, normalizedBusinessPhone, normalizedBusinessEmail)
        : {
            verifiedAt: new Date().toISOString(),
            verifiedEmail: normalizedBusinessEmail,
            skipped: true,
          };
      vendor.businessPhoneVerifiedAt = verification.verifiedAt;
      store.vendors.push(vendor);
      user.role = 'vendor';
      user.updatedAt = new Date().toISOString();

      return {
        ...vendor,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      };
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const payload = buildVendorPayload(vendorData, user);
  const normalizedBusinessPhone = ensureBusinessPhone(payload.businessPhone || user.phone || '');
  const normalizedBusinessEmail = ensureBusinessEmail(payload.businessEmail || user.email || '');
  const conflictingVendor = payload.storeSlug
    ? await Vendor.findOne({ storeSlug: payload.storeSlug, user: { $ne: userId } })
    : null;

  if (conflictingVendor) {
    throw new ApiError(400, 'Store name already exists. Please choose a different store name.');
  }

  const existingVendor = await Vendor.findOne({ user: userId });
  if (existingVendor) {
    if (existingVendor.status === 'approved') {
      throw new ApiError(400, 'Vendor profile already exists for this user');
    }

    const existingPhone = normalizePhone(existingVendor.businessPhone || '');
    const existingEmail = normalizeEmail(existingVendor.businessEmail || '');
    const isSameVerifiedPhone =
      existingVendor.businessPhoneVerified
      && existingPhone === normalizedBusinessPhone
      && existingEmail === normalizedBusinessEmail;

    const verification = isSameVerifiedPhone
      ? {
          verifiedAt: existingVendor.businessPhoneVerifiedAt || new Date(),
          verifiedEmail: normalizedBusinessEmail,
          skipped: false,
        }
      : isVendorPhoneOtpRequired
        ? await consumeVerifiedPhoneOtpMongo(userId, normalizedBusinessPhone, normalizedBusinessEmail)
        : {
            verifiedAt: new Date(),
            verifiedEmail: normalizedBusinessEmail,
            skipped: true,
          };

    existingVendor.fullName = payload.fullName || existingVendor.fullName || '';
    existingVendor.storeName = payload.storeName || existingVendor.storeName || '';
    existingVendor.storeSlug = payload.storeSlug || existingVendor.storeSlug || '';
    existingVendor.businessName = payload.businessName || existingVendor.businessName || '';
    existingVendor.businessType = payload.businessType || existingVendor.businessType || '';
    existingVendor.businessLogo = payload.businessLogo || existingVendor.businessLogo || '';
    existingVendor.storeBanner = payload.storeBanner || existingVendor.storeBanner || '';
    existingVendor.businessDescription = payload.businessDescription || existingVendor.businessDescription || '';
    existingVendor.businessEmail = normalizedBusinessEmail;
    existingVendor.businessPhone = normalizedBusinessPhone;
    existingVendor.businessPhoneVerified = true;
    existingVendor.businessPhoneVerifiedAt = verification.verifiedAt;
    existingVendor.businessPhoneVerifiedEmail = verification.verifiedEmail;
    existingVendor.alternateContact = payload.alternateContact || existingVendor.alternateContact || '';
    existingVendor.pickupAddress = payload.pickupAddress || existingVendor.pickupAddress || '';
    existingVendor.pincode = payload.pincode || existingVendor.pincode || '';
    existingVendor.panCardNumber = payload.panCardNumber || existingVendor.panCardNumber || '';
    existingVendor.aadhaarNumber = payload.aadhaarNumber || existingVendor.aadhaarNumber || '';
    existingVendor.businessAddress = payload.businessAddress || existingVendor.businessAddress || {};
    existingVendor.bankDetails = payload.bankDetails || existingVendor.bankDetails || {};
    existingVendor.kycDocuments = payload.kycDocuments || existingVendor.kycDocuments || {};
    existingVendor.documentUploads = payload.documentUploads || existingVendor.documentUploads || {};
    existingVendor.storeCategories = payload.storeCategories || existingVendor.storeCategories || [];
    existingVendor.returnPolicy = payload.returnPolicy || existingVendor.returnPolicy || '';
    existingVendor.status = 'pending';
    existingVendor.rejectedReason = '';
    existingVendor.approvedAt = null;
    existingVendor.approvedBy = null;

    await existingVendor.save();

    return existingVendor;
  }

  const verification = isVendorPhoneOtpRequired
    ? await consumeVerifiedPhoneOtpMongo(userId, normalizedBusinessPhone, normalizedBusinessEmail)
    : {
        verifiedAt: new Date(),
        verifiedEmail: normalizedBusinessEmail,
        skipped: true,
      };

  const vendor = await Vendor.create({
    ...payload,
    businessEmail: normalizedBusinessEmail,
    businessPhone: normalizedBusinessPhone,
    businessPhoneVerified: true,
    businessPhoneVerifiedAt: verification.verifiedAt,
    businessPhoneVerifiedEmail: verification.verifiedEmail,
    user: userId,
    status: 'pending',
  });

  await User.findByIdAndUpdate(userId, { role: 'vendor' });

  await VendorWallet.create({ vendor: vendor._id });

  return vendor;
};

export const getVendorByUserId = async (userId) => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const vendor = (store.vendors || []).find((entry) => entry.user === userId);

    if (!vendor) {
      return null;
    }

    const user = await findUserByIdLocal(userId);

    return {
      ...vendor,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          }
        : null,
    };
  }
  return Vendor.findOne({ user: userId }).populate('user', 'name email');
};

export const getVendorById = async (vendorId) => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const vendor = (store.vendors || []).find((entry) => entry._id === vendorId);

    if (!vendor) {
      return null;
    }

    const user = await findUserByIdLocal(vendor.user);

    return {
      ...vendor,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          }
        : null,
    };
  }
  return Vendor.findById(vendorId).populate('user', 'name email');
};

export const getVendorByUserIdOrCreate = async (userId) => {
  let vendor = await getVendorByUserId(userId);
  if (!vendor) {
    vendor = await createVendor(userId, {
      businessName: '',
      businessDescription: '',
    });
  }
  return vendor;
};

export const updateVendor = async (vendorId, updateData) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const vendor = (store.vendors || []).find((entry) => entry._id === vendorId);

      if (!vendor) {
        throw new ApiError(404, 'Vendor not found');
      }

      const nextBusinessPhone = updateData.businessPhone ? ensureBusinessPhone(updateData.businessPhone) : null;
      const nextBusinessEmail = updateData.businessEmail ? ensureBusinessEmail(updateData.businessEmail) : null;
      const currentBusinessPhone = normalizePhone(vendor.businessPhone || '');
      const currentBusinessEmail = normalizeEmail(vendor.businessEmail || '');

      Object.assign(vendor, updateData);
      if (nextBusinessPhone) {
        vendor.businessPhone = nextBusinessPhone;
      }
      if (nextBusinessEmail) {
        vendor.businessEmail = nextBusinessEmail;
      }

      const changed =
        (nextBusinessPhone && nextBusinessPhone !== currentBusinessPhone)
        || (nextBusinessEmail && nextBusinessEmail !== currentBusinessEmail);

      if (changed) {
        vendor.businessPhoneVerified = false;
        vendor.businessPhoneVerifiedAt = null;
        vendor.businessPhoneVerifiedEmail = '';
      }

      vendor.updatedAt = new Date().toISOString();
      return vendor;
    });
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  const nextBusinessPhone = updateData.businessPhone ? ensureBusinessPhone(updateData.businessPhone) : null;
  const nextBusinessEmail = updateData.businessEmail ? ensureBusinessEmail(updateData.businessEmail) : null;
  const currentBusinessPhone = normalizePhone(vendor.businessPhone || '');
  const currentBusinessEmail = normalizeEmail(vendor.businessEmail || '');

  Object.assign(vendor, updateData);
  if (nextBusinessPhone) {
    vendor.businessPhone = nextBusinessPhone;
  }
  if (nextBusinessEmail) {
    vendor.businessEmail = nextBusinessEmail;
  }

  const changed =
    (nextBusinessPhone && nextBusinessPhone !== currentBusinessPhone)
    || (nextBusinessEmail && nextBusinessEmail !== currentBusinessEmail);

  if (changed) {
    vendor.businessPhoneVerified = false;
    vendor.businessPhoneVerifiedAt = null;
    vendor.businessPhoneVerifiedEmail = '';
  }

  await vendor.save();
  return vendor;
};

export const approveVendor = async (vendorId, adminId, reason = '') => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const vendor = (store.vendors || []).find((entry) => entry._id === vendorId);
      if (!vendor) {
        throw new ApiError(404, 'Vendor not found');
      }

      if (vendor.status === 'approved') {
        throw new ApiError(400, 'Vendor is already approved');
      }

      vendor.status = 'approved';
      vendor.approvedAt = new Date().toISOString();
      vendor.approvedBy = adminId;
      vendor.rejectedReason = reason ? '' : vendor.rejectedReason || '';
      vendor.updatedAt = new Date().toISOString();
      return vendor;
    });
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  if (vendor.status === 'approved') {
    throw new ApiError(400, 'Vendor is already approved');
  }

  vendor.status = 'approved';
  vendor.approvedAt = new Date();
  vendor.approvedBy = adminId;
  if (reason) {
    vendor.rejectedReason = '';
  }

  await vendor.save();
  return vendor;
};

export const rejectVendor = async (vendorId, reason) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const vendor = (store.vendors || []).find((entry) => entry._id === vendorId);
      if (!vendor) {
        throw new ApiError(404, 'Vendor not found');
      }

      vendor.status = 'rejected';
      vendor.rejectedReason = reason || 'Your vendor application has been rejected';
      vendor.updatedAt = new Date().toISOString();
      return vendor;
    });
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  vendor.status = 'rejected';
  vendor.rejectedReason = reason || 'Your vendor application has been rejected';

  await vendor.save();
  return vendor;
};

export const suspendVendor = async (vendorId) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const vendor = (store.vendors || []).find((entry) => entry._id === vendorId);
      if (!vendor) {
        throw new ApiError(404, 'Vendor not found');
      }

      vendor.status = 'suspended';
      vendor.updatedAt = new Date().toISOString();
      return vendor;
    });
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  vendor.status = 'suspended';
  await vendor.save();
  return vendor;
};

export const getAllVendors = async (query = {}) => {
  if (shouldUseLocalStore()) {
    const { page = 1, limit = 20, status } = query;
    const store = await readLocalStore();
    const items = (store.vendors || []).filter((vendor) => !status || vendor.status === status);
    const total = items.length;
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.max(Number(limit) || 20, 1);
    const start = (safePage - 1) * safeLimit;
    const paged = items.slice(start, start + safeLimit).map((vendor) => {
      const user = store.users.find((entry) => entry._id === vendor.user);
      return {
        ...vendor,
        user: user
          ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
            }
          : null,
      };
    });

    return {
      vendors: paged,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  const { page = 1, limit = 20, status } = query;
  const filters = {};

  if (status) {
    filters.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [vendors, total] = await Promise.all([
    Vendor.find(filters)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Vendor.countDocuments(filters),
  ]);

  return {
    vendors,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const getVendorOrders = async (vendorId, query = {}) => {
  const { page = 1, limit = 20, status } = query;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const allOrders = (store.orders || [])
      .filter((order) =>
        (order.subOrders || []).some((subOrder) => subOrder.vendor?.toString() === vendorId?.toString())
        || (order.items || []).some((item) => item.vendor?.toString() === vendorId?.toString()),
      )
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const normalized = allOrders
      .map((order) => {
        const subOrder = (order.subOrders || []).find(
          (entry) => entry.vendor?.toString() === vendorId?.toString(),
        ) || null;

        const vendorItems = (order.items || []).filter(
          (item) => item.vendor?.toString() === vendorId?.toString(),
        );

        const derivedStatus = subOrder?.status || order.orderStatus;
        if (status && derivedStatus !== status) {
          return null;
        }

        return {
          ...hydrateLocalOrder(order, store),
          vendorSubOrder: subOrder,
          vendorItems,
          vendorOrderStatus: derivedStatus,
          vendorOrderTotal: subOrder?.totalAmount
            ?? vendorItems.reduce((acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0), 0),
        };
      })
      .filter(Boolean);

    const items = normalized.slice(skip, skip + safeLimit);
    return {
      orders: items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: normalized.length,
        totalPages: Math.ceil(normalized.length / safeLimit) || 1,
      },
    };
  }

  const Order = (await import('../models/Order.js')).default;
  const filters = {
    $or: [{ 'subOrders.vendor': vendorId }, { 'items.vendor': vendorId }],
  };

  if (status) {
    filters.$and = [{ $or: [{ 'subOrders.status': status }, { 'vendors.status': status }, { orderStatus: status }] }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('user', 'name email phone')
      .populate('items.product', 'name slug images'),
    Order.countDocuments(filters),
  ]);

  const normalizedOrders = orders
    .map((order) => {
      const subOrder = (order.subOrders || []).find(
        (entry) => entry.vendor?.toString() === vendorId?.toString(),
      ) || null;
      const vendorItems = (order.items || []).filter(
        (item) => item.vendor?.toString() === vendorId?.toString(),
      );
      const vendorOrderStatus = subOrder?.status || order.orderStatus;

      if (status && vendorOrderStatus !== status) {
        return null;
      }

      return {
        ...order.toObject(),
        vendorSubOrder: subOrder,
        vendorItems,
        vendorOrderStatus,
        vendorOrderTotal: subOrder?.totalAmount
          ?? vendorItems.reduce((acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0), 0),
      };
    })
    .filter(Boolean);

  return {
    orders: normalizedOrders,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

export const getVendorWallet = async (vendorId) => {
  let wallet = await VendorWallet.findOne({ vendor: vendorId });
  if (!wallet) {
    wallet = await VendorWallet.create({ vendor: vendorId });
  }
  return wallet;
};

export const getCommissionRate = async (vendorId, category) => {
  const settings = await CommissionSettings.findOne();
  if (!settings) {
    return 15;
  }

  if (vendorId) {
    const vendorCommission = settings.vendorCommissions.find(
      (v) => v.vendor.toString() === vendorId.toString()
    );
    if (vendorCommission) {
      return vendorCommission.commissionRate;
    }
  }

  if (category) {
    const categoryCommission = settings.categoryCommissions.find(
      (c) => c.category.toLowerCase() === category.toLowerCase()
    );
    if (categoryCommission) {
      return categoryCommission.commissionRate;
    }
  }

  return settings.globalCommissionRate;
};

export const requestVendorPhoneVerificationOtp = async (userId, { businessPhone, businessEmail } = {}) => {
  const normalizedBusinessPhone = ensureBusinessPhone(businessPhone);
  const normalizedBusinessEmail = ensureBusinessEmail(businessEmail);
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + VENDOR_PHONE_OTP_TTL_MINUTES * 60 * 1000);

  if (shouldUseLocalStore()) {
    await mutateLocalStore((store) => {
      store.vendorPhoneOtps = (store.vendorPhoneOtps || []).filter(
        (entry) =>
          !(
            entry.user === userId
            && normalizePhone(entry.businessPhone) === normalizedBusinessPhone
            && normalizeEmail(entry.businessEmail) === normalizedBusinessEmail
            && !entry.usedAt
          ),
      );

      store.vendorPhoneOtps.push({
        _id: createLocalId(),
        user: userId,
        businessPhone: normalizedBusinessPhone,
        businessEmail: normalizedBusinessEmail,
        otp,
        expiresAt: expiresAt.toISOString(),
        verifiedAt: null,
        usedAt: null,
        attempts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  } else {
    await VendorPhoneVerificationOtp.deleteMany({
      user: userId,
      businessPhone: normalizedBusinessPhone,
      businessEmail: normalizedBusinessEmail,
      usedAt: null,
    });

    await VendorPhoneVerificationOtp.create({
      user: userId,
      businessPhone: normalizedBusinessPhone,
      businessEmail: normalizedBusinessEmail,
      otp,
      expiresAt,
    });
  }

  let recipientName = 'Vendor';
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const localUser = (store.users || []).find((entry) => entry._id === userId);
    recipientName = localUser?.name || recipientName;
  } else {
    const user = await User.findById(userId).select('name');
    recipientName = user?.name || recipientName;
  }

  try {
    await sendVendorPhoneVerificationOtpEmail({
      email: normalizedBusinessEmail,
      otp,
      name: recipientName,
      businessPhone: normalizedBusinessPhone,
    });
  } catch (error) {
    throw new ApiError(502, 'Failed to send OTP email. Please try again.');
  }

  return {
    message: 'OTP sent successfully',
  };
};

export const verifyVendorPhoneVerificationOtp = async (userId, { businessPhone, otp } = {}) => {
  const normalizedBusinessPhone = ensureBusinessPhone(businessPhone);
  const sanitizedOtp = ensureOtpValue(otp);

  if (shouldUseLocalStore()) {
    await mutateLocalStore((store) => {
      const records = (store.vendorPhoneOtps || [])
        .filter((entry) => entry.user === userId && normalizePhone(entry.businessPhone) === normalizedBusinessPhone && !entry.usedAt)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const record = records[0] || null;

      if (!record) {
        throw new ApiError(400, 'OTP not requested or already expired');
      }

      if (!record.expiresAt || new Date(record.expiresAt).getTime() < Date.now()) {
        throw new ApiError(400, 'OTP expired. Please request a new OTP');
      }

      if (String(record.otp) !== sanitizedOtp) {
        record.attempts = Number(record.attempts || 0) + 1;
        if (record.attempts >= VENDOR_PHONE_OTP_MAX_ATTEMPTS) {
          record.usedAt = new Date().toISOString();
        }
        record.updatedAt = new Date().toISOString();
        throw new ApiError(400, 'Invalid OTP');
      }

      record.verifiedAt = new Date().toISOString();
      record.attempts = 0;
      record.updatedAt = new Date().toISOString();
    });
  } else {
    const record = await VendorPhoneVerificationOtp.findOne({
      user: userId,
      businessPhone: normalizedBusinessPhone,
      usedAt: null,
    }).sort({ createdAt: -1 });

    if (!record) {
      throw new ApiError(400, 'OTP not requested or already expired');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new ApiError(400, 'OTP expired. Please request a new OTP');
    }

    if (record.otp !== sanitizedOtp) {
      record.attempts += 1;
      if (record.attempts >= VENDOR_PHONE_OTP_MAX_ATTEMPTS) {
        record.usedAt = new Date();
      }
      await record.save();
      throw new ApiError(400, 'Invalid OTP');
    }

    record.verifiedAt = new Date();
    record.attempts = 0;
    await record.save();
  }

  return {
    message: 'Phone verified successfully',
  };
};

export const getCommissionSettings = async () => {
  let settings = await CommissionSettings.findOne();
  if (!settings) {
    settings = await CommissionSettings.create({});
  }
  return settings;
};

export const updateCommissionSettings = async (updateData) => {
  let settings = await CommissionSettings.findOne();
  if (!settings) {
    settings = await CommissionSettings.create({});
  }

  Object.assign(settings, updateData);
  await settings.save();
  return settings;
};

export const updateVendorStats = async (vendorId, orderIncrement = 0, salesAmount = 0) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    return;
  }

  vendor.totalOrders += orderIncrement;
  vendor.totalSales += salesAmount;
  await vendor.save();
};

export const addTransactionToWallet = async (
  vendorId,
  orderId,
  amount,
  commission,
  type,
  description = ''
) => {
  const wallet = await getVendorWallet(vendorId);
  if (!wallet) {
    throw new ApiError(404, 'Wallet not found');
  }

  const netAmount = amount - commission;
  const transaction = {
    orderId,
    amount,
    commission,
    netAmount,
    type,
    status: 'pending',
    description,
  };

  wallet.transactions.push(transaction);
  wallet.pendingBalance += netAmount;
  await wallet.save();

  return wallet;
};

export const updateWalletStatus = async (vendorId, orderId, status) => {
  const wallet = await VendorWallet.findOne({ vendor: vendorId });
  if (!wallet) {
    return;
  }

  const transaction = wallet.transactions.find(
    (t) => t.orderId.toString() === orderId.toString()
  );

  if (transaction) {
    if (status === 'completed') {
      wallet.balance += transaction.netAmount;
      wallet.pendingBalance -= transaction.netAmount;
      wallet.lifetimeEarnings += transaction.netAmount;
      transaction.status = 'completed';
      transaction.processedAt = new Date();
    } else if (status === 'cancelled') {
      wallet.pendingBalance -= transaction.netAmount;
      transaction.status = 'cancelled';
    }

    await wallet.save();
  }

  return wallet;
};