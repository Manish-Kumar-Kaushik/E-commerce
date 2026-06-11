import asyncHandler from '../utils/asyncHandler.js';
import {
  createVendor,
  getVendorById,
  updateVendor,
  requestVendorPhoneVerificationOtp,
  verifyVendorPhoneVerificationOtp,
  getAllVendors,
  approveVendor,
  rejectVendor,
  suspendVendor,
  getVendorOrders as getVendorOrdersService,
  getVendorWallet as getVendorWalletService,
  getCommissionSettings as getCommissionSettingsService,
  updateCommissionSettings as updateCommissionSettingsService,
  getVendorByUserId,
} from '../services/vendorService.js';
import { updateOrderStatus as updateOrderStatusService, approveOrRejectReturnRequest } from '../services/orderService.js';
import { shouldUseLocalStore, readLocalStore } from '../services/localStoreService.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import Order from '../models/Order.js';

export const getVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await getVendorByUserId(req.user._id);

  if (!vendor) {
    return res.status(200).json({
      success: true,
      hasVendorProfile: false,
      status: null,
    });
  }

  return res.status(200).json({
    success: true,
    hasVendorProfile: true,
    status: vendor.status,
    businessName: vendor.businessName,
    rejectedReason: vendor.rejectedReason,
    approvedAt: vendor.approvedAt,
  });
});

export const createVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await createVendor(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: 'Vendor profile created successfully. Awaiting admin approval.',
    vendor,
  });
});

export const getMyVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await getVendorByUserId(req.user._id);

  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  res.status(200).json({
    success: true,
    vendor,
  });
});

export const getVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await getVendorById(req.params.id);

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  res.status(200).json({
    success: true,
    vendor,
  });
});

export const updateVendorProfile = asyncHandler(async (req, res) => {
  const existingVendor = await getVendorByUserId(req.user._id);

  if (!existingVendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const vendor = await updateVendor(existingVendor._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Vendor profile updated successfully',
    vendor,
  });
});

export const getVendorOrders = asyncHandler(async (req, res) => {
  const existingVendor = await getVendorByUserId(req.user._id);

  if (!existingVendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const result = await getVendorOrdersService(existingVendor._id, req.query);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getVendorWallet = asyncHandler(async (req, res) => {
  const existingVendor = await getVendorByUserId(req.user._id);

  if (!existingVendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const wallet = await getVendorWalletService(existingVendor._id);

  res.status(200).json({
    success: true,
    wallet,
  });
});

export const getVendorAnalytics = asyncHandler(async (req, res) => {
  const existingVendor = await getVendorByUserId(req.user._id);

  if (!existingVendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const wallet = await getVendorWalletService(existingVendor._id);
  const orders = await getVendorOrdersService(existingVendor._id, { limit: 10 });
  const unreadNotifications = shouldUseLocalStore()
    ? ((await readLocalStore()).notifications || []).filter(
        (notification) => notification.user === req.user._id && !notification.isRead,
      ).length
    : await Notification.countDocuments({ user: req.user._id, isRead: false });

  const completedOrders = orders.orders.filter((o) => o.orderStatus === 'delivered');
  const pendingOrders = orders.orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'confirmed');
  // Build time series: last 7 days, month-wise (last 12 months), year-wise (last 5 years)
  let last7Days = [];
  let monthly = [];
  let yearly = [];

  if (shouldUseLocalStore()) {
    // Local store: no time-series available — return empty arrays
    last7Days = [];
    monthly = [];
    yearly = [];
  } else {
    const vendorId = existingVendor._id;

    // Last 7 days: group by date string YYYY-MM-DD
    const sevenDaysAgg = await Order.aggregate([
      { $unwind: '$subOrders' },
      { $match: { 'subOrders.vendor': vendorId, 'subOrders.status': 'delivered' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$subOrders.vendorEarnings' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Monthly: last 12 months
    const monthlyAgg = await Order.aggregate([
      { $unwind: '$subOrders' },
      { $match: { 'subOrders.vendor': vendorId, 'subOrders.status': 'delivered' } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$subOrders.vendorEarnings' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Yearly: last 5 years
    const yearlyAgg = await Order.aggregate([
      { $unwind: '$subOrders' },
      { $match: { 'subOrders.vendor': vendorId, 'subOrders.status': 'delivered' } },
      { $group: { _id: { year: { $year: '$createdAt' } }, total: { $sum: '$subOrders.vendorEarnings' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1 } },
    ]);

    // Build last7Days array with last 7 calendar days (labels and totals)
    const today = new Date();
    const dayMap = new Map(sevenDaysAgg.map((d) => [d._id, d]));
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      date.setUTCDate(date.getUTCDate() - i);
      const key = date.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      last7Days.push({ date: key, total: entry ? entry.total : 0, count: entry ? entry.count : 0 });
    }

    // Monthly: last 12 months labels like YYYY-MM
    const monthMap = new Map(monthlyAgg.map((m) => [`${m._id.year}-${String(m._id.month).padStart(2, '0')}`, m]));
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthMap.get(key);
      monthly.push({ month: key, total: entry ? entry.total : 0, count: entry ? entry.count : 0 });
    }

    // Yearly: last 5 years
    const yearMap = new Map(yearlyAgg.map((y) => [String(y._id.year), y]));
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 4; y <= currentYear; y += 1) {
      const entry = yearMap.get(String(y));
      yearly.push({ year: String(y), total: entry ? entry.total : 0, count: entry ? entry.count : 0 });
    }
  }

  res.status(200).json({
    success: true,
    analytics: {
      totalOrders: existingVendor.totalOrders,
      totalSales: existingVendor.totalSales,
      rating: existingVendor.rating,
      totalReviews: existingVendor.totalReviews,
      walletBalance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      lifetimeEarnings: wallet.lifetimeEarnings,
      unreadNotifications,
      recentOrdersCount: orders.orders.length,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount: pendingOrders.length,
      timeSeries: {
        last7Days,
        monthly,
        yearly,
      },
    },
  });
});

export const getAdminVendors = asyncHandler(async (req, res) => {
  const result = await getAllVendors(req.query);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const approveVendorController = asyncHandler(async (req, res) => {
  const vendor = await approveVendor(req.params.id, req.user._id, req.body.reason);

  res.status(200).json({
    success: true,
    message: 'Vendor approved successfully',
    vendor,
  });
});

export const rejectVendorController = asyncHandler(async (req, res) => {
  const vendor = await rejectVendor(req.params.id, req.body.reason);

  res.status(200).json({
    success: true,
    message: 'Vendor rejected',
    vendor,
  });
});

export const suspendVendorController = asyncHandler(async (req, res) => {
  const vendor = await suspendVendor(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Vendor suspended',
    vendor,
  });
});

export const getCommissionSettings = asyncHandler(async (req, res) => {
  const settings = await getCommissionSettingsService();

  res.status(200).json({
    success: true,
    settings,
  });
});

export const updateCommissionSettings = asyncHandler(async (req, res) => {
  const settings = await updateCommissionSettingsService(req.body);

  res.status(200).json({
    success: true,
    message: 'Commission settings updated',
    settings,
  });
});

export const updateVendorOrderStatus = asyncHandler(async (req, res) => {
  const existingVendor = await getVendorByUserId(req.user._id);

  if (!existingVendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const {
    status,
    deliveryInDays,
    deliveryMinDays,
    deliveryMaxDays,
    estimatedDeliveryDate,
    deliveryPartner,
    trackingId,
  } = req.body;

  const order = await updateOrderStatusService(req.params.id, status, existingVendor._id, {
    deliveryInDays,
    deliveryMinDays,
    deliveryMaxDays,
    estimatedDeliveryDate,
    deliveryPartner,
    trackingId,
  });

  res.status(200).json({
    success: true,
    message: 'Order status updated',
    order,
  });
});

export const approveVendorReturnRequest = asyncHandler(async (req, res) => {
  const existingVendor = await getVendorByUserId(req.user._id);

  if (!existingVendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const order = await approveOrRejectReturnRequest({
    orderId: req.params.id,
    itemId: req.params.itemId,
    vendorId: existingVendor._id,
    decision: 'approve',
    note: req.body.note,
  });

  res.status(200).json({
    success: true,
    message: 'Return request approved',
    order,
  });
});

export const rejectVendorReturnRequest = asyncHandler(async (req, res) => {
  const existingVendor = await getVendorByUserId(req.user._id);

  if (!existingVendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const order = await approveOrRejectReturnRequest({
    orderId: req.params.id,
    itemId: req.params.itemId,
    vendorId: existingVendor._id,
    decision: 'reject',
    note: req.body.note,
  });

  res.status(200).json({
    success: true,
    message: 'Return request rejected',
    order,
  });
});

export const requestVendorPhoneOtp = asyncHandler(async (req, res) => {
  const result = await requestVendorPhoneVerificationOtp(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    ...result,
  });
});
export const getVendorBankDetails = asyncHandler(async (req, res) => {
  const vendor = await getVendorByUserId(req.user._id);

  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  res.status(200).json({
    success: true,
    bankDetails: vendor.bankDetails || {},
  });
});

export const updateVendorBankDetails = asyncHandler(async (req, res) => {
  const vendor = await getVendorByUserId(req.user._id);

  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  const { bankName, accountHolderName, accountNumber, ifscCode, upiId } = req.body;

  vendor.bankDetails = {
    bankName: bankName || vendor.bankDetails?.bankName || '',
    accountHolderName: accountHolderName || vendor.bankDetails?.accountHolderName || '',
    accountNumber: accountNumber || vendor.bankDetails?.accountNumber || '',
    ifscCode: ifscCode || vendor.bankDetails?.ifscCode || '',
    upiId: upiId || vendor.bankDetails?.upiId || '',
  };

  await vendor.save();

  res.status(200).json({
    success: true,
    message: 'Bank details updated successfully',
    bankDetails: vendor.bankDetails,
  });
});

export const withdrawFromWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Invalid withdrawal amount');
  }

  const vendor = await getVendorByUserId(req.user._id);

  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  // Check if bank details are complete
  const bankDetails = vendor.bankDetails;
  if (!bankDetails?.bankName || !bankDetails?.accountHolderName || !bankDetails?.accountNumber || !bankDetails?.ifscCode) {
    throw new ApiError(400, 'Complete bank details required for withdrawal');
  }

  // Get or create wallet
  let wallet = vendor.wallet || {};
  const currentBalance = wallet.balance || 0;

  if (amount > currentBalance) {
    throw new ApiError(400, 'Insufficient wallet balance');
  }

  // Process withdrawal
  wallet.balance = (currentBalance - amount).toFixed(2);
  wallet.lastWithdrawal = new Date();
  vendor.wallet = wallet;

  await vendor.save();

  res.status(200).json({
    success: true,
    message: `Withdrawal of ₹${amount.toFixed(2)} initiated. Amount will be transferred to your bank account within 2-3 business days.`,
    wallet: vendor.wallet,
  });
});
export const verifyVendorPhoneOtp = asyncHandler(async (req, res) => {
  const result = await verifyVendorPhoneVerificationOtp(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Phone verified successfully',
    ...result,
  });
});