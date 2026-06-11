import Cart from '../models/Cart.js';
import Admin from '../models/Admin.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import VendorWallet from '../models/VendorWallet.js';
import CommissionSettings from '../models/CommissionSettings.js';
import Notification from '../models/Notification.js';
import {
  createLocalId,
  hydrateLocalOrder,
  mutateLocalStore,
  paginateCollection,
  readLocalStore,
  shouldUseLocalStore,
} from './localStoreService.js';
import ApiError from '../utils/ApiError.js';
import { calculateCouponDiscount, normalizeCouponCode } from '../utils/coupon.js';
import { parsePagination } from '../utils/queryBuilder.js';
import { createNotification } from './notificationService.js';
import { sendOrderConfirmationEmail, sendOrderShippingEmail, sendRefundProcessedEmail } from '../utils/email.js';

const ORDER_STATUS = {
  CREATED: 'created',
  PAYMENT_PENDING: 'payment_pending',
  PAID: 'paid',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
};

const ORDER_STATE_TRANSITIONS = {
  created: ['payment_pending', 'paid', 'confirmed', 'cancelled'],
  payment_pending: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned'],
  returned: ['refunded'],
  cancelled: [],
  refunded: [],

  // Legacy compatibility (existing orders in DB/local store)
  pending: ['payment_pending', 'paid', 'confirmed', 'cancelled'],
  processing: ['packed', 'shipped', 'cancelled'],
};

const ORDER_RESERVATION_MINUTES = Math.max(Number(process.env.ORDER_RESERVATION_MINUTES) || 15, 1);
const ORDER_RESERVABLE_STATUSES = new Set([
  ORDER_STATUS.CREATED,
  ORDER_STATUS.PAYMENT_PENDING,
  'pending',
]);

const ORDER_DELIVERED_LIKE_STATUSES = new Set([
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.REFUNDED,
]);
const REFUND_TIMELINE_LABEL = '1-7 working days';

const assertValidOrderTransition = (currentStatus, nextStatus) => {
  if (!currentStatus || currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions = ORDER_STATE_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(nextStatus)) {
    throw new ApiError(400, `Invalid order status transition: ${currentStatus} -> ${nextStatus}`);
  }
};

const deriveOrderStatusFromVendorSplits = (vendorSplits = [], currentStatus = ORDER_STATUS.CREATED) => {
  const statuses = (Array.isArray(vendorSplits) ? vendorSplits : [])
    .map((split) => split?.status)
    .filter(Boolean);

  if (!statuses.length) {
    return currentStatus;
  }

  if (statuses.every((status) => status === ORDER_STATUS.CANCELLED)) {
    return ORDER_STATUS.CANCELLED;
  }

  if (statuses.every((status) => status === ORDER_STATUS.REFUNDED)) {
    return ORDER_STATUS.REFUNDED;
  }

  if (statuses.every((status) => status === ORDER_STATUS.RETURNED)) {
    return ORDER_STATUS.RETURNED;
  }

  if (statuses.every((status) => status === ORDER_STATUS.DELIVERED)) {
    return ORDER_STATUS.DELIVERED;
  }

  const orderOfProgress = [
    ORDER_STATUS.CREATED,
    ORDER_STATUS.PAYMENT_PENDING,
    ORDER_STATUS.PAID,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PACKED,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.DELIVERED,
  ];

  const activeStatuses = statuses.filter((status) => status !== ORDER_STATUS.CANCELLED);
  const mapped = activeStatuses
    .map((status) => (status === 'pending' ? ORDER_STATUS.CREATED : status))
    .map((status) => (status === 'processing' ? ORDER_STATUS.PACKED : status));

  const minIndex = mapped.reduce((min, status) => {
    const index = orderOfProgress.indexOf(status);
    if (index === -1) {
      return min;
    }
    if (min === -1 || index < min) {
      return index;
    }
    return min;
  }, -1);

  return minIndex === -1 ? currentStatus : orderOfProgress[minIndex];
};

const isPaymentSettledForInvoice = (order) =>
  String(order?.paymentStatus || '').toLowerCase() === 'paid';

const shouldGenerateInvoiceOnTransition = (order, status) =>
  status === ORDER_STATUS.DELIVERED && isPaymentSettledForInvoice(order);

const shouldMarkCodPaidOnDelivery = (order, status) =>
  status === ORDER_STATUS.DELIVERED
  && String(order?.paymentMethod || '').toLowerCase() === 'cod'
  && String(order?.paymentStatus || '').toLowerCase() !== 'paid';

const resolveTrackingId = (orderId, vendorId, options = {}, currentTrackingId = '') => {
  const providedTrackingId = options?.trackingId?.toString?.().trim?.();
  return providedTrackingId || currentTrackingId || buildTrackingId(orderId, vendorId);
};

const VENDOR_ALLOWED_TARGET_STATUSES = new Set([
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.RETURN_REQUESTED,
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.REFUNDED,
]);

const resolveVendorCurrentStatus = (order, vendorId) => {
  const vendorKey = vendorId?.toString?.();

  if (!vendorKey) {
    return String(order?.orderStatus || '').toLowerCase();
  }

  const subOrderStatus = (order?.subOrders || []).find(
    (entry) => entry?.vendor?.toString?.() === vendorKey,
  )?.status;

  if (subOrderStatus) {
    return String(subOrderStatus).toLowerCase();
  }

  const splitStatus = (order?.vendors || []).find(
    (entry) => entry?.vendor?.toString?.() === vendorKey,
  )?.status;

  if (splitStatus) {
    return String(splitStatus).toLowerCase();
  }

  return String(order?.orderStatus || '').toLowerCase();
};

const assertValidVendorStatusTransition = (order, vendorId, nextStatus) => {
  if (!VENDOR_ALLOWED_TARGET_STATUSES.has(nextStatus)) {
    throw new ApiError(400, 'Vendor is not allowed to set this order status');
  }

  const currentVendorStatus = resolveVendorCurrentStatus(order, vendorId);
  assertValidOrderTransition(currentVendorStatus, nextStatus);

  if (nextStatus === ORDER_STATUS.CONFIRMED) {
    const paymentMethod = String(order?.paymentMethod || '').toLowerCase();
    const paymentStatus = String(order?.paymentStatus || '').toLowerCase();
    const canConfirm = paymentStatus === 'paid' || paymentMethod === 'cod';

    if (!canConfirm) {
      throw new ApiError(400, 'Order cannot be accepted before payment is completed');
    }
  }
};

const hasGeneratedInvoice = (order) =>
  Boolean(
    (order?.subOrders || []).some((entry) => entry?.invoiceNumber)
    || (order?.vendors || []).some((entry) => entry?.invoiceNumber),
  );

const getVendorNotificationRecipientsForOrder = async (order) => {
  const vendorIds = [...new Set((order?.items || []).map((item) => item.vendor?.toString?.() || item.vendor).filter(Boolean))];

  if (!vendorIds.length) {
    return [];
  }

  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    return (store.vendors || [])
      .filter((vendor) => vendorIds.includes(vendor._id?.toString()))
      .map((vendor) => ({
        userId: vendor.user,
        vendorId: vendor._id,
        vendorName: vendor.businessName || 'Vendor',
      }))
      .filter((entry) => entry.userId);
  }

  const vendors = await Vendor.find({ _id: { $in: vendorIds } }).select('user businessName');
  return vendors
    .map((vendor) => ({
      userId: vendor.user?.toString?.() || vendor.user,
      vendorId: vendor._id?.toString?.() || vendor._id,
      vendorName: vendor.businessName || 'Vendor',
    }))
    .filter((entry) => entry.userId);
};

const getAdminNotificationRecipientIds = async () => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    return (store.admins || []).map((admin) => admin._id).filter(Boolean);
  }

  const admins = await Admin.find({ role: 'admin' }).select('_id');
  return admins.map((admin) => admin._id?.toString?.() || admin._id).filter(Boolean);
};

const notifyOrderCancellationStakeholders = async ({ order, customer, reason = '' }) => {
  const orderLabel = order?.orderNumber || order?._id?.toString?.().slice(-6)?.toUpperCase?.() || 'Order';
  const customerName = customer?.name || order?.shippingAddress?.fullName || 'Customer';
  const customerPhone = customer?.phone || order?.shippingAddress?.phone || '';
  const cleanReason = reason?.trim() || order?.cancelReason || '';
  const baseData = {
    orderId: order?._id,
    customerName,
    customerPhone,
    reason: cleanReason,
    refundTimeline: REFUND_TIMELINE_LABEL,
    refundRequired: String(order?.paymentStatus || '').toLowerCase() === 'paid',
  };

  const vendorRecipients = await getVendorNotificationRecipientsForOrder(order);
  const adminRecipientIds = await getAdminNotificationRecipientIds();

  await Promise.all([
    ...vendorRecipients.map((recipient) =>
      createNotification(
        recipient.userId,
        'order',
        'Customer cancelled order',
        `Order #${orderLabel} was cancelled by the customer. If payment was captured, refund should be processed within ${REFUND_TIMELINE_LABEL}.`,
        {
          ...baseData,
          vendorId: recipient.vendorId,
          vendorName: recipient.vendorName,
        },
      )),
    ...adminRecipientIds.map((adminId) =>
      createNotification(
        adminId,
        'payment',
        'Refund action required',
        `Customer cancelled order #${orderLabel}. Review and process any applicable refund within ${REFUND_TIMELINE_LABEL}.`,
        baseData,
      )),
  ]);
};

export const canGenerateInvoiceForOrder = (order) => {
  const paymentSettled = isPaymentSettledForInvoice(order);
  const orderStatus = String(order?.orderStatus || '').toLowerCase();
  const deliveredByOrder = ORDER_DELIVERED_LIKE_STATUSES.has(orderStatus);

  const deliveredBySplit = (order?.subOrders || []).some((entry) =>
    ORDER_DELIVERED_LIKE_STATUSES.has(String(entry?.status || '').toLowerCase()),
  ) || (order?.vendors || []).some((entry) =>
    ORDER_DELIVERED_LIKE_STATUSES.has(String(entry?.status || '').toLowerCase()),
  );

  return paymentSettled && (deliveredByOrder || deliveredBySplit) && hasGeneratedInvoice(order);
};

const notifyVendorsForPaidOrder = async (order) => {
  const itemList = Array.isArray(order?.items) ? order.items : [];

  if (!itemList.length) {
    return;
  }

  if (shouldUseLocalStore()) {
    await mutateLocalStore((store) => {
      const vendorIds = [...new Set(itemList.map((item) => item.vendor).filter(Boolean))];

      vendorIds.forEach((vendorId) => {
        const vendor = (store.vendors || []).find((entry) => entry._id?.toString() === vendorId?.toString());
        if (!vendor?.user) {
          return;
        }

        store.notifications = store.notifications || [];
        store.notifications.push({
          _id: createLocalId(),
          user: vendor.user,
          type: 'order',
          title: 'New paid order received',
          message: `Payment received for order #${order._id?.toString().slice(-6).toUpperCase()}`,
          data: {
            orderId: order._id,
            paymentStatus: order.paymentStatus,
          },
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    });
    return;
  }

  const vendorIds = [...new Set(itemList.map((item) => item.vendor?.toString()).filter(Boolean))];

  if (!vendorIds.length) {
    return;
  }

  const vendors = await Vendor.find({ _id: { $in: vendorIds } }).select('_id user businessName');
  const notifications = vendors
    .filter((vendor) => Boolean(vendor.user))
    .map((vendor) => ({
      user: vendor.user,
      type: 'order',
      title: 'New paid order received',
      message: `Payment received for order #${order._id.toString().slice(-6).toUpperCase()}`,
      data: {
        orderId: order._id,
        vendorId: vendor._id,
        vendorName: vendor.businessName || 'Shopzy Seller',
        paymentStatus: order.paymentStatus,
      },
      isRead: false,
    }));

  if (notifications.length) {
    await Notification.insertMany(notifications);
  }
};

const notifyVendorsForNewOrder = async (order, localStore = null) => {
  const itemList = Array.isArray(order?.items) ? order.items : [];

  if (!itemList.length) {
    return;
  }

  const groupedByVendor = itemList.reduce((acc, item) => {
    const vendorId = item?.vendor?.toString?.() || item?.vendor;
    if (!vendorId) {
      return acc;
    }

    if (!acc[vendorId]) {
      acc[vendorId] = {
        quantity: 0,
        amount: 0,
      };
    }

    acc[vendorId].quantity += Number(item.quantity || 0);
    acc[vendorId].amount += Number(item.price || 0) * Number(item.quantity || 0);
    return acc;
  }, {});

  const resolveCustomerInfo = (sourceOrder, store = null) => {
    const populatedCustomer = sourceOrder?.user || null;

    if (populatedCustomer && typeof populatedCustomer === 'object') {
      return {
        customerName: populatedCustomer.name || populatedCustomer.fullName || 'Customer',
        customerPhone: populatedCustomer.phone || '',
      };
    }

    if (store && sourceOrder?.user) {
      const user = (store.users || []).find((entry) => entry._id === sourceOrder.user);
      return {
        customerName: user?.name || user?.fullName || 'Customer',
        customerPhone: user?.phone || '',
      };
    }

    return {
      customerName: 'Customer',
      customerPhone: '',
    };
  };

  const productIds = [...new Set(itemList.map((item) => item.product?.toString?.() || item.product).filter(Boolean))];
  const customerInfo = resolveCustomerInfo(order, localStore);

  const vendorIds = Object.keys(groupedByVendor);

  if (!vendorIds.length) {
    return;
  }

  if (shouldUseLocalStore()) {
    const writeNotifications = (store) => {
      vendorIds.forEach((vendorId) => {
        const vendor = (store.vendors || []).find((entry) => entry._id?.toString() === vendorId?.toString());
        if (!vendor?.user) {
          return;
        }

        const vendorOrderMeta = groupedByVendor[vendorId] || { quantity: 0, amount: 0 };

        store.notifications = store.notifications || [];
        store.notifications.push({
          _id: createLocalId(),
          user: vendor.user,
          type: 'order',
          title: 'New order received',
          message: `${customerInfo.customerName}${customerInfo.customerPhone ? ` • ${customerInfo.customerPhone}` : ''} • ${vendorOrderMeta.quantity} item(s)` ,
          data: {
            orderId: order._id,
            vendorId,
            orderedQuantity: vendorOrderMeta.quantity,
            amount: vendorOrderMeta.amount,
            customerName: customerInfo.customerName,
            customerPhone: customerInfo.customerPhone,
            productIds,
            paymentStatus: order.paymentStatus,
          },
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    };

    if (localStore) {
      writeNotifications(localStore);
    } else {
      await mutateLocalStore((store) => {
        writeNotifications(store);
      });
    }

    return;
  }

  const vendors = await Vendor.find({ _id: { $in: vendorIds } }).select('_id user businessName');
  const notifications = vendors
    .filter((vendor) => Boolean(vendor.user))
    .map((vendor) => {
      const vendorOrderMeta = groupedByVendor[vendor._id.toString()] || { quantity: 0, amount: 0 };
      return {
        user: vendor.user,
        type: 'order',
        title: 'New order received',
        message: `${customerInfo.customerName}${customerInfo.customerPhone ? ` • ${customerInfo.customerPhone}` : ''} • ${vendorOrderMeta.quantity} item(s)`,
        data: {
          orderId: order._id,
          vendorId: vendor._id,
          vendorName: vendor.businessName || 'Shopzy Seller',
          orderedQuantity: vendorOrderMeta.quantity,
          amount: vendorOrderMeta.amount,
          customerName: customerInfo.customerName,
          customerPhone: customerInfo.customerPhone,
          productIds,
          paymentStatus: order.paymentStatus,
        },
        isRead: false,
      };
    });

  if (notifications.length) {
    await Notification.insertMany(notifications);
  }
};

const getCommissionRateForItem = async (vendorId, category) => {
  if (shouldUseLocalStore()) {
    return 15;
  }

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

const splitOrderByVendor = async (items) => {
  const vendorGroups = {};
  const itemsByVendor = {}; // Track items by vendor for commission calculation

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    const vendorId = product.vendor?.toString() || 'default';
    const vendor = await Vendor.findById(vendorId);

    if (!vendorGroups[vendorId]) {
      vendorGroups[vendorId] = {
        vendor: vendorId,
        vendorName: vendor?.businessName || 'Unknown Seller',
          vendorBusinessName: vendor?.businessName || 'Unknown Seller',
          vendorBusinessAddress: vendor?.businessAddress || {},
        items: [], // Will be populated after order.save() when items have _id
        itemIds: [], // Will be populated after order.save() when items have _id
        itemCount: 0,
        subtotal: 0,
        commission: 0,
        vendorEarnings: 0,
        status: ORDER_STATUS.CREATED,
        invoiceNumber: '',
        trackingId: '',
        deliveryPartner: '',
      };
      itemsByVendor[vendorId] = [];
    }

    const itemTotal = item.price * item.quantity;
    itemsByVendor[vendorId].push(item); // Track for commission calculation only
    vendorGroups[vendorId].itemCount += item.quantity;
    vendorGroups[vendorId].subtotal += itemTotal;
  }

  const vendorSplits = Object.values(vendorGroups);

  for (const split of vendorSplits) {
    const vendorItems = itemsByVendor[split.vendor];
    if (vendorItems && vendorItems[0]) {
      const product = await Product.findById(vendorItems[0].product);
      const commissionRate = await getCommissionRateForItem(split.vendor, product?.category);
      split.commission = Math.round(split.subtotal * (commissionRate / 100));
      split.vendorEarnings = split.subtotal - split.commission;
    }
  }

  return vendorSplits;
};

const buildSubOrderNumber = (orderId, vendorId, index = 0) => {
  const orderSegment = orderId?.toString().slice(-6).toUpperCase();
  const vendorSegment = vendorId?.toString().slice(-4).toUpperCase();
  const sequence = String(index + 1).padStart(2, '0');
  return `SO-${orderSegment}-${vendorSegment}-${sequence}`;
};

const buildSubOrdersFromVendorSplits = (vendorSplits = [], totals = {}, orderId = null) => {
  const subtotalAmount = Number(totals.subtotalAmount || 0);
  const shippingAmount = Number(totals.shippingAmount || 0);
  const discountAmount = Number(totals.discountAmount || 0);

  const splits = Array.isArray(vendorSplits) ? vendorSplits : [];

  return splits.map((split, index) => {
    const splitSubtotal = Number(split.subtotal || 0);
    const share = subtotalAmount > 0 ? splitSubtotal / subtotalAmount : 0;
    const splitDiscount = Math.round(discountAmount * share);
    const splitShipping = Math.round(shippingAmount * share);
    const totalAmount = Math.max(0, splitSubtotal + splitShipping - splitDiscount);

    return {
      subOrderNumber: orderId ? buildSubOrderNumber(orderId, split.vendor, index) : '',
      vendor: split.vendor,
      vendorName: split.vendorName || 'Shopzy Seller',
      itemIds: Array.isArray(split.itemIds) ? split.itemIds : [],
      itemCount: Number(split.itemCount || 0),
      subtotalAmount: splitSubtotal,
      discountAmount: splitDiscount,
      shippingAmount: splitShipping,
      totalAmount,
      commission: Number(split.commission || 0),
      vendorEarnings: Number(split.vendorEarnings || 0),
      status: split.status || ORDER_STATUS.CREATED,
      invoiceNumber: split.invoiceNumber || '',
      invoiceGeneratedAt: split.invoiceGeneratedAt,
      trackingId: split.trackingId || '',
      deliveryPartner: split.deliveryPartner || '',
      estimatedDeliveryDate: split.estimatedDeliveryDate,
      estimatedDeliveryMinDays: split.estimatedDeliveryMinDays,
      estimatedDeliveryMaxDays: split.estimatedDeliveryMaxDays,
      shipmentCreatedAt: split.shipmentCreatedAt,
    };
  });
};

const buildInvoiceNumber = (orderId, vendorId) => {
  const dateSegment = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const orderSegment = orderId?.toString().slice(-6).toUpperCase();
  const vendorSegment = vendorId?.toString().slice(-4).toUpperCase();
  const randomSegment = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${dateSegment}-${orderSegment}-${vendorSegment}-${randomSegment}`;
};

const buildTrackingId = (orderId, vendorId) => {
  const orderSegment = orderId?.toString().slice(-8).toUpperCase();
  const vendorSegment = vendorId?.toString().slice(-4).toUpperCase();
  const randomSegment = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TRK-${orderSegment}-${vendorSegment}-${randomSegment}`;
};

const getDeliveryWindow = (options = {}) => {
  const toSafeInt = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }
    return Math.min(Math.round(parsed), 45);
  };

  const defaultMin = 3;
  const defaultMax = 7;

  const requestedMin = options.deliveryMinDays ?? options.deliveryInDays;
  const requestedMax = options.deliveryMaxDays ?? options.deliveryInDays;

  let minDays = toSafeInt(requestedMin, defaultMin);
  let maxDays = toSafeInt(requestedMax, defaultMax);

  if (maxDays < minDays) {
    maxDays = minDays;
  }

  const explicitDate = options.estimatedDeliveryDate ? new Date(options.estimatedDeliveryDate) : null;
  const hasExplicitDate = explicitDate && !Number.isNaN(explicitDate.getTime());
  const estimatedDeliveryDate = hasExplicitDate
    ? explicitDate
    : new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);

  return {
    minDays,
    maxDays,
    estimatedDeliveryDate,
  };
};

const updateVendorWalletForOrder = async (order, action) => {
  if (shouldUseLocalStore()) {
    return;
  }

  const subOrders = Array.isArray(order.subOrders) ? order.subOrders : [];

  const vendorEntries = subOrders.length
    ? subOrders
        .filter((subOrder) => Boolean(subOrder.vendor))
        .map((subOrder) => ({
          vendorId: subOrder.vendor?.toString(),
          subOrderId: subOrder._id,
          subOrderNumber: subOrder.subOrderNumber || '',
          total: Number(subOrder.subtotalAmount ?? subOrder.totalAmount ?? 0),
          commission: Number(subOrder.commission || 0),
          vendorEarnings: Number(subOrder.vendorEarnings || 0),
          status: subOrder.status,
        }))
    : Object.entries(
        (order.items || []).reduce((acc, item) => {
          const vendorId = item.vendor?.toString();
          if (!vendorId) {
            return acc;
          }

          if (!acc[vendorId]) {
            acc[vendorId] = {
              vendorId,
              subOrderId: null,
              subOrderNumber: '',
              total: 0,
              commission: 0,
              vendorEarnings: 0,
              status: order.orderStatus,
            };
          }

          acc[vendorId].total += Number(item.price || 0) * Number(item.quantity || 0);
          return acc;
        }, {}),
      ).map(([, value]) => value);

  for (const entry of vendorEntries) {
    const vendorId = entry.vendorId;
    if (!vendorId) {
      continue;
    }

    let wallet = await VendorWallet.findOne({ vendor: vendorId });
    if (!wallet) {
      wallet = await VendorWallet.create({ vendor: vendorId });
    }

    const existingTransaction = wallet.transactions.find((t) => {
      const sameOrder = t.orderId?.toString() === order._id.toString();
      if (!sameOrder) {
        return false;
      }

      if (entry.subOrderId && t.subOrderId) {
        return t.subOrderId.toString() === entry.subOrderId.toString();
      }

      if (entry.subOrderNumber && t.subOrderNumber) {
        return t.subOrderNumber === entry.subOrderNumber;
      }

      return true;
    });

    if (action === 'add') {
      if (existingTransaction) {
        continue;
      }

      let commission = Number(entry.commission || 0);
      if (!commission && Number(entry.total || 0) > 0) {
        const commissionRate = await getCommissionRateForItem(vendorId, null);
        commission = Math.round(Number(entry.total || 0) * (commissionRate / 100));
      }

      const netAmount = Math.max(0, Number(entry.vendorEarnings || Number(entry.total || 0) - commission));

      wallet.transactions.push({
        orderId: order._id,
        subOrderId: entry.subOrderId || undefined,
        subOrderNumber: entry.subOrderNumber || '',
        amount: Number(entry.total || 0),
        commission,
        netAmount,
        type: 'sale',
        status: 'pending',
        description: entry.subOrderNumber ? `Sub-order ${entry.subOrderNumber}` : `Order ${order._id}`,
      });

      wallet.pendingBalance = Math.max(0, Number(wallet.pendingBalance || 0) + netAmount);
      await wallet.save();

      await Vendor.findByIdAndUpdate(vendorId, {
        $inc: { totalOrders: 1, totalSales: netAmount },
      });
      continue;
    }

    if (!existingTransaction) {
      continue;
    }

    if (action === 'complete') {
      const isDeliverable = subOrders.length
        ? entry.status === ORDER_STATUS.DELIVERED
        : order.orderStatus === ORDER_STATUS.DELIVERED;

      if (!isDeliverable || existingTransaction.status !== 'pending') {
        continue;
      }

      existingTransaction.status = 'completed';
      existingTransaction.processedAt = new Date();
      wallet.balance = Math.max(0, Number(wallet.balance || 0) + Number(existingTransaction.netAmount || 0));
      wallet.pendingBalance = Math.max(0, Number(wallet.pendingBalance || 0) - Number(existingTransaction.netAmount || 0));
      wallet.lifetimeEarnings = Math.max(0, Number(wallet.lifetimeEarnings || 0) + Number(existingTransaction.netAmount || 0));
      await wallet.save();
      continue;
    }

    if (action === 'cancel') {
      if (existingTransaction.status === 'cancelled') {
        continue;
      }

      if (existingTransaction.status === 'pending') {
        wallet.pendingBalance = Math.max(0, Number(wallet.pendingBalance || 0) - Number(existingTransaction.netAmount || 0));
      }

      if (existingTransaction.status === 'completed') {
        wallet.balance = Math.max(0, Number(wallet.balance || 0) - Number(existingTransaction.netAmount || 0));
      }

      existingTransaction.status = 'cancelled';
      existingTransaction.processedAt = new Date();

      wallet.transactions.push({
        orderId: order._id,
        subOrderId: entry.subOrderId || undefined,
        subOrderNumber: entry.subOrderNumber || '',
        amount: Number(existingTransaction.amount || 0),
        commission: Number(existingTransaction.commission || 0),
        netAmount: Number(existingTransaction.netAmount || 0),
        type: 'refund',
        status: 'completed',
        description: entry.subOrderNumber
          ? `Refund reversal for ${entry.subOrderNumber}`
          : `Refund reversal for order ${order._id}`,
        processedAt: new Date(),
      });

      await wallet.save();
    }
  }
};

const getPopulatedOrder = (orderId) =>
  Order.findById(orderId)
    .populate('user', 'name email phone role')
    .populate('items.product', 'name slug category images stock');

const ensureInventoryAvailable = async (items) => {
  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new ApiError(404, `Product not found for item ${item.name}`);
    }

    if (product.stock < item.quantity) {
      throw new ApiError(409, `Insufficient stock for ${product.name}`);
    }
  }
};

const updateInventory = async (items, direction) => {
  for (const item of items) {
    if (direction === 'decrease') {
      const result = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      
      if (!result) {
        throw new ApiError(409, `Insufficient stock for product`);
      }
    }

    if (direction === 'increase') {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }
  }
};

const getReservationExpiryDate = () =>
  new Date(Date.now() + ORDER_RESERVATION_MINUTES * 60 * 1000);

const releaseExpiredInventoryReservations = async () => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const now = Date.now();

      (store.orders || []).forEach((order) => {
        const expiry = order.reservationExpiresAt ? new Date(order.reservationExpiresAt).getTime() : null;
        const isExpired = expiry && expiry < now;
        const isPendingStripe = order.paymentMethod === 'stripe' && order.paymentStatus === 'pending';
        const isReservable = ORDER_RESERVABLE_STATUSES.has(order.orderStatus);

        if (!isExpired || !isPendingStripe || !isReservable || !order.inventoryProcessed) {
          return;
        }

        (order.items || []).forEach((item) => {
          const product = (store.products || []).find((entry) => entry._id === item.product);
          if (product) {
            product.stock += Number(item.quantity || 0);
            product.updatedAt = new Date().toISOString();
          }
        });

        order.inventoryProcessed = false;
        order.inventoryReleasedAt = new Date().toISOString();
        order.paymentStatus = 'failed';
        order.orderStatus = ORDER_STATUS.CANCELLED;
        order.cancelReason = order.cancelReason || 'Inventory reservation expired';
        order.cancelledAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
      });
    });
  }

  const now = new Date();
  const expiredOrders = await Order.find({
    paymentMethod: 'stripe',
    paymentStatus: 'pending',
    inventoryProcessed: true,
    reservationExpiresAt: { $lt: now },
    orderStatus: { $in: [...ORDER_RESERVABLE_STATUSES] },
  });

  for (const order of expiredOrders) {
    await updateInventory(order.items, 'increase');
    order.inventoryProcessed = false;
    order.inventoryReleasedAt = new Date();
    order.paymentStatus = 'failed';
    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.cancelReason = order.cancelReason || 'Inventory reservation expired';
    order.cancelledAt = new Date();
    await order.save();
  }
};

const reserveOrderInventory = async (order) => {
  if (!order || order.inventoryProcessed) {
    return order;
  }

  await ensureInventoryAvailable(order.items);
  await updateInventory(order.items, 'decrease');

  order.inventoryProcessed = true;
  order.inventoryReservedAt = new Date();
  order.reservationExpiresAt = order.paymentMethod === 'stripe' ? getReservationExpiryDate() : null;
  return order;
};

const resolveOrderColor = (product, color) => {
  const availableColors = Array.isArray(product?.colors)
    ? product.colors
        .map((entry) => entry?.toString().trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (!availableColors.length) {
    return '';
  }

  const normalizedColor = color?.toString().trim().toLowerCase();

  if (!normalizedColor) {
    throw new ApiError(400, `Color is required for ${product.name}`);
  }

  if (!availableColors.includes(normalizedColor)) {
    throw new ApiError(400, `Color ${normalizedColor} is not available for ${product.name}`);
  }

  return normalizedColor;
};

const getColorVariantImages = (product, color) => {
  if (!color) {
    return [];
  }

  if (product?.colorImages?.get && typeof product.colorImages.get === 'function') {
    const mapEntry = product.colorImages.get(color);
    return Array.isArray(mapEntry) ? mapEntry : [];
  }

  if (product?.colorImages && typeof product.colorImages === 'object') {
    const mapEntry = product.colorImages[color];
    return Array.isArray(mapEntry) ? mapEntry : [];
  }

  return [];
};

const buildOrderItemSku = (product, size, color) => {
  const productSegment = (product?._id?.toString?.() || 'product').slice(-6).toUpperCase();
  const sizeSegment = (size || 'NA').toString().trim().replace(/\s+/g, '').toUpperCase();
  const colorSegment = (color || 'NA').toString().trim().replace(/\s+/g, '').toUpperCase();
  return `SKU-${productSegment}-${sizeSegment}-${colorSegment}`;
};

const normalizeOrderItems = async (items = []) => {
  const normalizedItems = [];

  const normalizeSizeToken = (value = '') =>
    String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[-_\s]+/g, '');

  const isOneSizeToken = (value = '') => {
    const normalized = normalizeSizeToken(value);
    return normalized === 'ONESIZE' || normalized === 'FREESIZE';
  };

  for (const item of items) {
    const product = await Product.findById(item.productId || item.product);

    if (!product) {
      throw new ApiError(404, 'One or more products no longer exist');
    }

    const size = item.size?.toString().trim().toUpperCase();

    const availableSizes = Array.isArray(product.sizes)
      ? product.sizes.map((entry) => entry?.toString().trim()).filter(Boolean)
      : [];

    const matchedSize = availableSizes.find(
      (entry) => normalizeSizeToken(entry) === normalizeSizeToken(size),
    );

    const fallbackOneSize = !size && availableSizes.find((entry) => isOneSizeToken(entry));

    if (!matchedSize && !fallbackOneSize) {
      throw new ApiError(400, `Size ${size || '(missing)'} is not available for ${product.name}`);
    }

    const quantity = Number(item.quantity);

    if (!quantity || quantity < 1 || quantity > product.stock) {
      throw new ApiError(400, `Requested quantity is unavailable for ${product.name}`);
    }

    const selectedColor = resolveOrderColor(product, item.color);
    const selectedImage = getColorVariantImages(product, selectedColor)[0]?.url || product.images[0]?.url || '';
    const resolvedSize = matchedSize || fallbackOneSize || size;

    normalizedItems.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: selectedImage,
      size: resolvedSize,
      color: selectedColor,
      sku: buildOrderItemSku(product, resolvedSize, selectedColor),
      price: product.salePrice ?? product.price,
      quantity,
    });
  }

  return normalizedItems;
};

export const getOrderForUser = async (orderId, user) => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const order = store.orders.find((entry) => entry._id === orderId);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const isOwner = order.user === user._id?.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'You cannot access this order');
    }

    return hydrateLocalOrder(order, store);
  }

  const order = await getPopulatedOrder(orderId);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const isOwner = order.user._id.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You cannot access this order');
  }

  return order;
};

export const getUserOrders = async (userId) =>
  shouldUseLocalStore()
    ? (() => readLocalStore().then((store) =>
        [...store.orders]
          .filter((order) => order.user === userId)
          .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
          .map((order) => hydrateLocalOrder(order, store)),
      ))()
    : Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('items.product', 'name slug category images');

export const getAllOrders = async (query) => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const filteredOrders = store.orders.filter((order) => {
      if (query.status && order.orderStatus !== query.status) {
        return false;
      }

      if (query.paymentStatus && order.paymentStatus !== query.paymentStatus) {
        return false;
      }

      return true;
    });
    const sortedOrders = [...filteredOrders].sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
    );
    const { page, limit } = parsePagination(query);
    const { items, pagination } = paginateCollection(sortedOrders, page, limit);

    return {
      orders: items.map((order) => hydrateLocalOrder(order, store)),
      pagination,
    };
  }

  const { page, limit, skip } = parsePagination(query);
  const filters = {};

  if (query.status) {
    filters.orderStatus = query.status;
  }

  if (query.paymentStatus) {
    filters.paymentStatus = query.paymentStatus;
  }

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('items.product', 'name images'),
    Order.countDocuments(filters),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const updateOrderStatus = async (orderId, status, vendorId = null, options = {}) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const order = store.orders.find((entry) => entry._id === orderId);

      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      if (vendorId) {
        assertValidVendorStatusTransition(order, vendorId, status);
      } else {
        assertValidOrderTransition(order.orderStatus, status);
      }

      if (status === ORDER_STATUS.CANCELLED && order.inventoryProcessed) {
        order.items.forEach((item) => {
          const product = store.products.find((entry) => entry._id === item.product);

          if (product) {
            product.stock += item.quantity;
            product.updatedAt = new Date().toISOString();
          }
        });
        order.inventoryProcessed = false;
        order.inventoryReleasedAt = new Date().toISOString();
        order.reservationExpiresAt = null;
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'failed';
        }
      }

      if (status === ORDER_STATUS.REFUNDED) {
        order.paymentStatus = 'refunded';
      }

      if (shouldMarkCodPaidOnDelivery(order, status)) {
        order.paymentStatus = 'paid';
      }

      if (vendorId) {
        const vendorItems = (order.items || []).filter(
          (item) => item.vendor?.toString() === vendorId.toString(),
        );

        vendorItems.forEach((item) => {
          item.itemStatus = status;
          if (status === ORDER_STATUS.SHIPPED) {
            item.shippedAt = new Date().toISOString();
          }
          if (status === ORDER_STATUS.DELIVERED) {
            item.deliveredAt = new Date().toISOString();
          }
        });

        const vendorSplit = (order.vendors || []).find(
          (split) => split.vendor?.toString() === vendorId.toString(),
        );

        if (vendorSplit) {
          vendorSplit.status = status;

          if (status === ORDER_STATUS.SHIPPED) {
            const { minDays, maxDays, estimatedDeliveryDate } = getDeliveryWindow(options);
            vendorSplit.trackingId = resolveTrackingId(order._id, vendorId, options, vendorSplit.trackingId);
            vendorSplit.deliveryPartner = options.deliveryPartner || vendorSplit.deliveryPartner || 'Vendor Delivery';
            vendorSplit.estimatedDeliveryMinDays = minDays;
            vendorSplit.estimatedDeliveryMaxDays = maxDays;
            vendorSplit.estimatedDeliveryDate = estimatedDeliveryDate.toISOString();
            vendorSplit.shipmentCreatedAt = new Date().toISOString();
          }

          if (shouldGenerateInvoiceOnTransition(order, status)) {
            vendorSplit.invoiceNumber = vendorSplit.invoiceNumber || buildInvoiceNumber(order._id, vendorId);
            vendorSplit.invoiceGeneratedAt = vendorSplit.invoiceGeneratedAt || new Date().toISOString();
          }
        }

        const subOrder = (order.subOrders || []).find(
          (entry) => entry.vendor?.toString() === vendorId.toString(),
        );

        if (subOrder) {
          subOrder.status = status;

          if (status === ORDER_STATUS.SHIPPED) {
            const { minDays, maxDays, estimatedDeliveryDate } = getDeliveryWindow(options);
            subOrder.trackingId = resolveTrackingId(order._id, vendorId, options, subOrder.trackingId);
            subOrder.deliveryPartner = options.deliveryPartner || subOrder.deliveryPartner || 'Vendor Delivery';
            subOrder.estimatedDeliveryMinDays = minDays;
            subOrder.estimatedDeliveryMaxDays = maxDays;
            subOrder.estimatedDeliveryDate = estimatedDeliveryDate.toISOString();
            subOrder.shipmentCreatedAt = new Date().toISOString();
          }

          if (shouldGenerateInvoiceOnTransition(order, status)) {
            subOrder.invoiceNumber = subOrder.invoiceNumber || buildInvoiceNumber(order._id, vendorId);
            subOrder.invoiceGeneratedAt = subOrder.invoiceGeneratedAt || new Date().toISOString();
          }
        }

        if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REFUNDED) {
          updateVendorWalletForOrder(order, 'cancel').catch(() => undefined);
        }
        if (status === ORDER_STATUS.DELIVERED) {
          updateVendorWalletForOrder(order, 'complete').catch(() => undefined);
        }
      } else {
        (order.vendors || []).forEach((split) => {
          split.status = status;

          if (status === ORDER_STATUS.SHIPPED) {
            const vendorRef = split.vendor || '';
            const { minDays, maxDays, estimatedDeliveryDate } = getDeliveryWindow(options);
            split.trackingId = resolveTrackingId(order._id, vendorRef, options, split.trackingId);
            split.deliveryPartner = options.deliveryPartner || split.deliveryPartner || 'Vendor Delivery';
            split.estimatedDeliveryMinDays = minDays;
            split.estimatedDeliveryMaxDays = maxDays;
            split.estimatedDeliveryDate = estimatedDeliveryDate.toISOString();
            split.shipmentCreatedAt = split.shipmentCreatedAt || new Date().toISOString();
          }

          if (shouldGenerateInvoiceOnTransition(order, status)) {
            const vendorRef = split.vendor || '';
            split.invoiceNumber = split.invoiceNumber || buildInvoiceNumber(order._id, vendorRef);
            split.invoiceGeneratedAt = split.invoiceGeneratedAt || new Date().toISOString();
          }
        });
        (order.subOrders || []).forEach((subOrder) => {
          subOrder.status = status;

          if (status === ORDER_STATUS.SHIPPED) {
            const vendorRef = subOrder.vendor || '';
            const { minDays, maxDays, estimatedDeliveryDate } = getDeliveryWindow(options);
            subOrder.trackingId = resolveTrackingId(order._id, vendorRef, options, subOrder.trackingId);
            subOrder.deliveryPartner = options.deliveryPartner || subOrder.deliveryPartner || 'Vendor Delivery';
            subOrder.estimatedDeliveryMinDays = minDays;
            subOrder.estimatedDeliveryMaxDays = maxDays;
            subOrder.estimatedDeliveryDate = estimatedDeliveryDate.toISOString();
            subOrder.shipmentCreatedAt = subOrder.shipmentCreatedAt || new Date().toISOString();
          }

          if (shouldGenerateInvoiceOnTransition(order, status)) {
            const vendorRef = subOrder.vendor || '';
            subOrder.invoiceNumber = subOrder.invoiceNumber || buildInvoiceNumber(order._id, vendorRef);
            subOrder.invoiceGeneratedAt = subOrder.invoiceGeneratedAt || new Date().toISOString();
          }
        });
      }

      if (status === ORDER_STATUS.DELIVERED) {
        order.deliveredAt = new Date().toISOString();
      }

      if (vendorId) {
        const parentSplits = order.subOrders?.length ? order.subOrders : order.vendors;
        order.orderStatus = deriveOrderStatusFromVendorSplits(parentSplits, order.orderStatus);
      } else {
        order.orderStatus = status;
      }
      order.updatedAt = new Date().toISOString();
      return hydrateLocalOrder(order, store);
    });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (vendorId) {
    assertValidVendorStatusTransition(order, vendorId, status);
  } else {
    assertValidOrderTransition(order.orderStatus, status);
  }

  if (status === ORDER_STATUS.CANCELLED && order.inventoryProcessed) {
    await updateInventory(order.items, 'increase');
    order.inventoryProcessed = false;
    order.inventoryReleasedAt = new Date();
    order.reservationExpiresAt = null;
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'failed';
    }
    await updateVendorWalletForOrder(order, 'cancel');
  }

  if (status === ORDER_STATUS.REFUNDED) {
    order.paymentStatus = 'refunded';
  }

  if (shouldMarkCodPaidOnDelivery(order, status)) {
    order.paymentStatus = 'paid';
  }

  if (status === ORDER_STATUS.DELIVERED) {
    order.deliveredAt = new Date();
    await updateVendorWalletForOrder(order, 'complete');
  }

  if (vendorId) {
    const vendorItems = order.items.filter(
      (item) => item.vendor?.toString() === vendorId.toString()
    );
    vendorItems.forEach((item) => {
      item.itemStatus = status;
      if (status === ORDER_STATUS.SHIPPED) {
        item.shippedAt = new Date();
      }
      if (status === ORDER_STATUS.DELIVERED) {
        item.deliveredAt = new Date();
      }
    });

    const vendorSplit = order.vendors?.find(
      (v) => v.vendor?.toString() === vendorId.toString()
    );
    if (vendorSplit) {
      vendorSplit.status = status;

      if (status === ORDER_STATUS.SHIPPED) {
        const { minDays, maxDays, estimatedDeliveryDate } = getDeliveryWindow(options);
        vendorSplit.trackingId = resolveTrackingId(order._id, vendorId, options, vendorSplit.trackingId);
        vendorSplit.deliveryPartner = options.deliveryPartner || vendorSplit.deliveryPartner || 'Vendor Delivery';
        vendorSplit.estimatedDeliveryMinDays = minDays;
        vendorSplit.estimatedDeliveryMaxDays = maxDays;
        vendorSplit.estimatedDeliveryDate = estimatedDeliveryDate;
        vendorSplit.shipmentCreatedAt = new Date();
      }

      if (shouldGenerateInvoiceOnTransition(order, status)) {
        vendorSplit.invoiceNumber = vendorSplit.invoiceNumber || buildInvoiceNumber(order._id, vendorId);
        vendorSplit.invoiceGeneratedAt = vendorSplit.invoiceGeneratedAt || new Date();
      }
    }

    const subOrder = order.subOrders?.find(
      (entry) => entry.vendor?.toString() === vendorId.toString()
    );
    if (subOrder) {
      subOrder.status = status;

      if (status === ORDER_STATUS.SHIPPED) {
        const { minDays, maxDays, estimatedDeliveryDate } = getDeliveryWindow(options);
        subOrder.trackingId = resolveTrackingId(order._id, vendorId, options, subOrder.trackingId);
        subOrder.deliveryPartner = options.deliveryPartner || subOrder.deliveryPartner || 'Vendor Delivery';
        subOrder.estimatedDeliveryMinDays = minDays;
        subOrder.estimatedDeliveryMaxDays = maxDays;
        subOrder.estimatedDeliveryDate = estimatedDeliveryDate;
        subOrder.shipmentCreatedAt = new Date();
      }

      if (shouldGenerateInvoiceOnTransition(order, status)) {
        subOrder.invoiceNumber = subOrder.invoiceNumber || buildInvoiceNumber(order._id, vendorId);
        subOrder.invoiceGeneratedAt = subOrder.invoiceGeneratedAt || new Date();
      }
    }

    if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REFUNDED) {
      await updateVendorWalletForOrder(order, 'cancel');
    }
    if (status === ORDER_STATUS.DELIVERED) {
      await updateVendorWalletForOrder(order, 'complete');
    }
  } else {
    (order.vendors || []).forEach((split) => {
      split.status = status;

      if (status === ORDER_STATUS.SHIPPED) {
        const vendorRef = split.vendor || '';
        const { minDays, maxDays, estimatedDeliveryDate } = getDeliveryWindow(options);
        split.trackingId = resolveTrackingId(order._id, vendorRef, options, split.trackingId);
        split.deliveryPartner = options.deliveryPartner || split.deliveryPartner || 'Vendor Delivery';
        split.estimatedDeliveryMinDays = minDays;
        split.estimatedDeliveryMaxDays = maxDays;
        split.estimatedDeliveryDate = estimatedDeliveryDate;
        split.shipmentCreatedAt = split.shipmentCreatedAt || new Date();
      }

      if (shouldGenerateInvoiceOnTransition(order, status)) {
        const vendorRef = split.vendor || '';
        split.invoiceNumber = split.invoiceNumber || buildInvoiceNumber(order._id, vendorRef);
        split.invoiceGeneratedAt = split.invoiceGeneratedAt || new Date();
      }
    });
    (order.subOrders || []).forEach((subOrder) => {
      subOrder.status = status;

      if (status === ORDER_STATUS.SHIPPED) {
        const vendorRef = subOrder.vendor || '';
        const { minDays, maxDays, estimatedDeliveryDate } = getDeliveryWindow(options);
        subOrder.trackingId = resolveTrackingId(order._id, vendorRef, options, subOrder.trackingId);
        subOrder.deliveryPartner = options.deliveryPartner || subOrder.deliveryPartner || 'Vendor Delivery';
        subOrder.estimatedDeliveryMinDays = minDays;
        subOrder.estimatedDeliveryMaxDays = maxDays;
        subOrder.estimatedDeliveryDate = estimatedDeliveryDate;
        subOrder.shipmentCreatedAt = subOrder.shipmentCreatedAt || new Date();
      }

      if (shouldGenerateInvoiceOnTransition(order, status)) {
        const vendorRef = subOrder.vendor || '';
        subOrder.invoiceNumber = subOrder.invoiceNumber || buildInvoiceNumber(order._id, vendorRef);
        subOrder.invoiceGeneratedAt = subOrder.invoiceGeneratedAt || new Date();
      }
    });
  }

  if (vendorId) {
    const parentSplits = order.subOrders?.length ? order.subOrders : order.vendors;
    order.orderStatus = deriveOrderStatusFromVendorSplits(parentSplits, order.orderStatus);
  } else {
    order.orderStatus = status;
  }
  await order.save();

  const populatedOrder = await getPopulatedOrder(order._id);
  if (status === ORDER_STATUS.SHIPPED && populatedOrder.user?.email) {
    const trackingId =
      populatedOrder.subOrders?.find((entry) => entry.trackingId)?.trackingId
      || populatedOrder.vendors?.find((entry) => entry.trackingId)?.trackingId
      || '';
    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];

    sendOrderShippingEmail({
      order: populatedOrder,
      user: populatedOrder.user,
      trackingUrl: trackingId
        ? `${baseUrl}/orders/track?trackingId=${encodeURIComponent(trackingId)}`
        : `${baseUrl}/orders/${populatedOrder._id}`,
    }).catch(() => undefined);
  }

  return populatedOrder;
};

export const cancelOrderForUser = async (orderId, user, reason = '') => {
  const order = await getOrderForUser(orderId, user);

  const cancellableStates = [
    ORDER_STATUS.CREATED,
    ORDER_STATUS.PAYMENT_PENDING,
    ORDER_STATUS.PAID,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PACKED,
    'pending',
    'processing',
  ];

  if (!cancellableStates.includes(order.orderStatus)) {
    throw new ApiError(400, 'Order cannot be cancelled at the current stage');
  }

  const updatedOrder = await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);
  const cleanReason = reason?.trim() || '';
  const shouldQueueRefund = String(order.paymentStatus || '').toLowerCase() === 'paid';

  if (shouldUseLocalStore()) {
    const finalOrder = await mutateLocalStore((store) => {
      const localOrder = store.orders.find((entry) => entry._id === orderId);
      if (!localOrder) {
        return updatedOrder;
      }

      localOrder.cancelReason = cleanReason || localOrder.cancelReason || '';
      localOrder.cancelledAt = new Date().toISOString();
      if (shouldQueueRefund) {
        localOrder.refundStatus = 'pending';
        localOrder.refundAmount = Number(localOrder.totalAmount || 0);
        localOrder.refundReason = cleanReason || localOrder.refundReason || 'Cancelled by customer';
      }
      localOrder.updatedAt = new Date().toISOString();
      return hydrateLocalOrder(localOrder, store);
    });

    await notifyOrderCancellationStakeholders({ order: finalOrder, customer: user, reason: cleanReason });
    return finalOrder;
  }

  await Order.findByIdAndUpdate(orderId, {
    cancelReason: cleanReason,
    cancelledAt: new Date(),
    ...(shouldQueueRefund
      ? {
          refundStatus: 'pending',
          refundAmount: Number(order.totalAmount || 0),
          refundReason: cleanReason || 'Cancelled by customer',
        }
      : {}),
  });

  const finalOrder = await getPopulatedOrder(orderId);
  await notifyOrderCancellationStakeholders({ order: finalOrder, customer: user, reason: cleanReason });
  return finalOrder;
};

export const requestOrderReturnForUser = async (orderId, user, payload = {}) => {
  const order = await getOrderForUser(orderId, user);

  if (order.orderStatus !== ORDER_STATUS.DELIVERED) {
    throw new ApiError(400, 'Return can only be requested for delivered orders');
  }

  const reason = payload.reason?.toString().trim();
  const issueType = payload.issueType?.toString().trim();
  const requestedItemId = payload.itemId?.toString?.() || payload.itemId;

  if (!reason || !issueType) {
    throw new ApiError(400, 'reason and issueType are required');
  }

  const appendReturnRecords = (targetOrder) => {
    const allItems = Array.isArray(targetOrder.items) ? targetOrder.items : [];
    const eligibleItems = requestedItemId
      ? allItems.filter((item) => item._id?.toString() === requestedItemId)
      : allItems;

    if (!eligibleItems.length) {
      throw new ApiError(404, 'Requested order item not found');
    }

    targetOrder.returns = targetOrder.returns || [];

    eligibleItems.forEach((item) => {
      targetOrder.returns.push({
        itemId: item._id,
        reason,
        issueType,
        status: 'requested',
        requestedAt: new Date(),
      });
      item.itemStatus = ORDER_STATUS.RETURN_REQUESTED;
    });

    const affectedVendorIds = [...new Set(eligibleItems.map((item) => item.vendor?.toString()).filter(Boolean))];
    (targetOrder.vendors || []).forEach((vendorSplit) => {
      if (affectedVendorIds.includes(vendorSplit.vendor?.toString())) {
        vendorSplit.status = ORDER_STATUS.RETURN_REQUESTED;
      }
    });
    (targetOrder.subOrders || []).forEach((subOrder) => {
      if (affectedVendorIds.includes(subOrder.vendor?.toString())) {
        subOrder.status = ORDER_STATUS.RETURN_REQUESTED;
      }
    });

    targetOrder.orderStatus = ORDER_STATUS.RETURN_REQUESTED;
  };

  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const localOrder = store.orders.find((entry) => entry._id === orderId);

      if (!localOrder) {
        throw new ApiError(404, 'Order not found');
      }

      assertValidOrderTransition(localOrder.orderStatus, ORDER_STATUS.RETURN_REQUESTED);
      appendReturnRecords(localOrder);
      localOrder.updatedAt = new Date().toISOString();
      return hydrateLocalOrder(localOrder, store);
    });
  }

  const dbOrder = await Order.findById(orderId);
  if (!dbOrder) {
    throw new ApiError(404, 'Order not found');
  }

  assertValidOrderTransition(dbOrder.orderStatus, ORDER_STATUS.RETURN_REQUESTED);
  appendReturnRecords(dbOrder);
  await dbOrder.save();

  return getPopulatedOrder(orderId);
};

export const getOrderTrackingById = async (trackingId) => {
  if (!trackingId) {
    throw new ApiError(400, 'trackingId is required');
  }

  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const order = (store.orders || []).find(
      (entry) =>
        entry.trackingId === trackingId
        || (entry.subOrders || []).some((subOrder) => subOrder.trackingId === trackingId)
        || (entry.vendors || []).some((split) => split.trackingId === trackingId),
    );

    if (!order) {
      throw new ApiError(404, 'Tracking information not found');
    }

    const matchingSubOrder = (order.subOrders || []).find((subOrder) => subOrder.trackingId === trackingId) || null;
    return {
      trackingId,
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      estimatedDeliveryDate: matchingSubOrder?.estimatedDeliveryDate || order.reservationExpiresAt || null,
      subOrder: matchingSubOrder,
      items: (order.items || []).map((item) => ({
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        status: item.itemStatus,
        vendorName: item.vendorName || 'Shopzy Seller',
      })),
    };
  }

  const order = await Order.findOne({
    $or: [
      { trackingId },
      { 'subOrders.trackingId': trackingId },
      { 'vendors.trackingId': trackingId },
    ],
  }).populate('items.product', 'name slug images');

  if (!order) {
    throw new ApiError(404, 'Tracking information not found');
  }

  const matchingSubOrder = (order.subOrders || []).find((subOrder) => subOrder.trackingId === trackingId) || null;

  return {
    trackingId,
    orderId: order._id,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    estimatedDeliveryDate: matchingSubOrder?.estimatedDeliveryDate || order.reservationExpiresAt || null,
    subOrder: matchingSubOrder,
    items: (order.items || []).map((item) => ({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      status: item.itemStatus,
      vendorName: item.vendorName || 'Shopzy Seller',
    })),
  };
};

export const approveOrRejectReturnRequest = async ({ orderId, itemId, vendorId, decision, note = '' }) => {
  const status = decision === 'approve' ? 'approved' : 'rejected';

  if (!['approve', 'reject'].includes(decision)) {
    throw new ApiError(400, 'decision must be approve or reject');
  }

  const applyDecision = (targetOrder) => {
    const returnRecord = (targetOrder.returns || []).find((entry) => entry.itemId?.toString() === itemId.toString());
    if (!returnRecord) {
      throw new ApiError(404, 'Return request not found');
    }

    const orderItem = (targetOrder.items || []).find((entry) => entry._id?.toString() === itemId.toString());
    if (!orderItem) {
      throw new ApiError(404, 'Order item not found');
    }

    const itemVendorId = orderItem.vendor?.toString();
    if (vendorId && itemVendorId && itemVendorId !== vendorId.toString()) {
      throw new ApiError(403, 'You cannot process returns for this item');
    }

    returnRecord.status = status;
    returnRecord.reviewedBy = vendorId || returnRecord.reviewedBy || undefined;
    returnRecord.reviewedAt = new Date();
    returnRecord.vendorNote = note?.toString().trim() || returnRecord.vendorNote || '';

    orderItem.itemStatus = decision === 'approve' ? ORDER_STATUS.RETURN_REQUESTED : ORDER_STATUS.DELIVERED;

    const vendorSplit = (targetOrder.vendors || []).find((split) => split.vendor?.toString() === itemVendorId);
    if (vendorSplit) {
      vendorSplit.status = decision === 'approve' ? ORDER_STATUS.RETURN_REQUESTED : vendorSplit.status;
    }

    const subOrder = (targetOrder.subOrders || []).find((split) => split.vendor?.toString() === itemVendorId);
    if (subOrder) {
      subOrder.status = decision === 'approve' ? ORDER_STATUS.RETURN_REQUESTED : subOrder.status;
    }

    targetOrder.orderStatus = deriveOrderStatusFromVendorSplits(targetOrder.subOrders?.length ? targetOrder.subOrders : targetOrder.vendors, targetOrder.orderStatus);
  };

  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const localOrder = (store.orders || []).find((entry) => entry._id === orderId);
      if (!localOrder) {
        throw new ApiError(404, 'Order not found');
      }

      applyDecision(localOrder);
      localOrder.updatedAt = new Date().toISOString();
      return hydrateLocalOrder(localOrder, store);
    });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  applyDecision(order);
  await order.save();
  return getPopulatedOrder(orderId);
};

export const markOrderRefunded = async (orderId, refundPayload = {}) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const order = (store.orders || []).find((entry) => entry._id === orderId);
      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      order.paymentStatus = 'refunded';
      order.refundStatus = refundPayload.isPartial ? 'partial' : 'full';
      order.refundAmount = Number(refundPayload.refundAmount || order.totalAmount || 0);
      order.orderStatus = ORDER_STATUS.REFUNDED;
      order.refundedAt = new Date().toISOString();
      order.refundReason = refundPayload.reason || order.refundReason || '';

      (order.returns || []).forEach((entry) => {
        if (!refundPayload.itemId || entry.itemId?.toString() === refundPayload.itemId.toString()) {
          entry.status = 'processed';
          entry.refundedAt = new Date().toISOString();
          entry.refundAmount = refundPayload.refundAmount || order.totalAmount;
        }
      });

      order.updatedAt = new Date().toISOString();
      return hydrateLocalOrder(order, store);
    });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.paymentStatus = 'refunded';
  order.refundStatus = refundPayload.isPartial ? 'partial' : 'full';
  order.refundAmount = Number(refundPayload.refundAmount || order.totalAmount || 0);
  order.orderStatus = ORDER_STATUS.REFUNDED;
  order.refundedAt = new Date();
  order.refundReason = refundPayload.reason || order.refundReason || '';

  (order.returns || []).forEach((entry) => {
    if (!refundPayload.itemId || entry.itemId?.toString() === refundPayload.itemId.toString()) {
      entry.status = 'processed';
      entry.refundedAt = new Date();
      entry.refundAmount = refundPayload.refundAmount || order.totalAmount;
    }
  });

  await order.save();

  const populatedOrder = await getPopulatedOrder(orderId);
  if (populatedOrder.user?.email) {
    sendRefundProcessedEmail({
      order: populatedOrder,
      user: populatedOrder.user,
      refundAmount: order.refundAmount,
      refundReason: order.refundReason,
    }).catch(() => undefined);
  }

  return populatedOrder;
};

export const markOrderAsPaid = async (orderId, paymentDetails) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const order = store.orders.find((entry) => entry._id === orderId);

      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      if (!order.inventoryProcessed) {
        order.items.forEach((item) => {
          const product = store.products.find((entry) => entry._id === item.product);

          if (!product) {
            throw new ApiError(404, `Product not found for item ${item.name}`);
          }

          if (product.stock < item.quantity) {
            throw new ApiError(409, `Insufficient stock for ${product.name}`);
          }
        });

        order.items.forEach((item) => {
          const product = store.products.find((entry) => entry._id === item.product);
          product.stock -= item.quantity;
          product.updatedAt = new Date().toISOString();
        });
        order.inventoryProcessed = true;
      }

      order.paymentStatus = 'paid';
      assertValidOrderTransition(order.orderStatus, ORDER_STATUS.PAID);
      order.orderStatus = ORDER_STATUS.PAID;
      order.reservationExpiresAt = null;
      (order.vendors || []).forEach((split) => {
        split.status = ORDER_STATUS.PAID;
      });
      (order.subOrders || []).forEach((subOrder) => {
        subOrder.status = ORDER_STATUS.PAID;
      });
      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        ...paymentDetails,
        provider: paymentDetails?.provider || (paymentDetails?.stripePaymentIntentId ? 'stripe' : 'cod'),
        paidAt: new Date().toISOString(),
      };
      order.updatedAt = new Date().toISOString();
      return hydrateLocalOrder(order, store);
    });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!order.inventoryProcessed) {
    await ensureInventoryAvailable(order.items);
    await updateInventory(order.items, 'decrease');
    order.inventoryProcessed = true;
  }

  order.paymentStatus = 'paid';
  assertValidOrderTransition(order.orderStatus, ORDER_STATUS.PAID);
  order.orderStatus = ORDER_STATUS.PAID;
  order.reservationExpiresAt = null;
  (order.vendors || []).forEach((split) => {
    split.status = ORDER_STATUS.PAID;
  });
  (order.subOrders || []).forEach((subOrder) => {
    subOrder.status = ORDER_STATUS.PAID;
  });
  order.paymentDetails = {
    ...order.paymentDetails.toObject(),
    ...paymentDetails,
    provider: paymentDetails?.provider || (paymentDetails?.stripePaymentIntentId ? 'stripe' : 'cod'),
    paidAt: new Date(),
  };

  await order.save();

  if (!order.inventoryProcessed) {
    await ensureInventoryAvailable(order.items);
    await updateInventory(order.items, 'decrease');
    order.inventoryProcessed = true;
    await order.save();
  }

  await updateVendorWalletForOrder(order, 'add');
  await notifyVendorsForPaidOrder(order);

  return getPopulatedOrder(order._id);
};

export const createOrderRecord = async (user, payload) => {
  await releaseExpiredInventoryReservations();

  if (shouldUseLocalStore()) {
    return mutateLocalStore(async (store) => {
      const cart = store.carts.find((entry) => entry.user === user._id);
      const sourceItems = payload.items?.length ? payload.items : cart?.items || [];

      if (!sourceItems.length) {
        throw new ApiError(400, 'Cart is empty');
      }

      const items = [];

      for (const item of sourceItems) {
        const product = store.products.find((entry) => entry._id === (item.productId || item.product));

        if (!product) {
          throw new ApiError(404, 'One or more products no longer exist');
        }

        const normalizeSizeToken = (value = '') =>
          String(value || '')
            .trim()
            .toUpperCase()
            .replace(/[-_\s]+/g, '');

        const isOneSizeToken = (value = '') => {
          const normalized = normalizeSizeToken(value);
          return normalized === 'ONESIZE' || normalized === 'FREESIZE';
        };

        const requestedSize = item.size?.toString().trim();
        const requestedColor = item.color?.toString().trim().toLowerCase();
        const availableSizes = Array.isArray(product.sizes)
          ? product.sizes.map((entry) => entry?.toString().trim()).filter(Boolean)
          : [];
        const availableColors = Array.isArray(product.colors)
          ? product.colors.map((entry) => entry?.toString().trim().toLowerCase()).filter(Boolean)
          : [];

        const matchedSize = availableSizes.find(
          (entry) => normalizeSizeToken(entry) === normalizeSizeToken(requestedSize),
        );

        const fallbackOneSize = !requestedSize && availableSizes.find((entry) => isOneSizeToken(entry));

        if (availableSizes.length && !matchedSize && !fallbackOneSize) {
          throw new ApiError(400, `Size ${requestedSize || '(missing)'} is not available for ${product.name}`);
        }

        if (availableColors.length && (!requestedColor || !availableColors.includes(requestedColor))) {
          throw new ApiError(400, `Color ${requestedColor || '(missing)'} is not available for ${product.name}`);
        }

        const resolvedSize = matchedSize || fallbackOneSize || requestedSize || 'ONE_SIZE';
        const resolvedColor = availableColors.length ? requestedColor : '';
        const variantImage = getColorVariantImages(product, resolvedColor)[0]?.url || product.images[0]?.url || '';

        const quantity = Number(item.quantity);

        if (!quantity || quantity < 1 || quantity > product.stock) {
          throw new ApiError(400, `Requested quantity is unavailable for ${product.name}`);
        }

        const productVendorId = product.vendor?.toString?.() || product.vendor;
        const linkedVendorById = (store.vendors || []).find(
          (entry) => entry._id?.toString() === productVendorId?.toString(),
        );
        const linkedVendorByOwner = (store.vendors || []).find(
          (entry) => entry.user?.toString() === product.createdBy?.toString(),
        );
        const linkedVendor = linkedVendorById || linkedVendorByOwner || null;
        const vendorId = linkedVendor?._id || productVendorId || product.createdBy || null;

        items.push({
          product: product._id,
          vendor: vendorId,
          vendorName: linkedVendor?.businessName || 'Shopzy Seller',
          name: product.name,
          slug: product.slug,
          image: variantImage,
          size: resolvedSize,
          color: resolvedColor,
          sku: buildOrderItemSku(product, resolvedSize, resolvedColor),
          price: product.salePrice ?? product.price,
          quantity,
          itemStatus: ORDER_STATUS.CREATED,
        });
      }

      const vendorSplitMap = items.reduce((acc, item) => {
        const vendorKey = item.vendor?.toString?.() || item.vendor;

        if (!vendorKey) {
          return acc;
        }

        if (!acc[vendorKey]) {
          acc[vendorKey] = {
            vendor: vendorKey,
            vendorName: item.vendorName || 'Shopzy Seller',
            items: [],
            itemIds: [],
            itemCount: 0,
            subtotal: 0,
            commission: 0,
            vendorEarnings: 0,
            status: ORDER_STATUS.CREATED,
            invoiceNumber: '',
            trackingId: '',
            deliveryPartner: '',
          };
        }

        acc[vendorKey].itemCount += Number(item.quantity || 0);
        acc[vendorKey].subtotal += Number(item.price || 0) * Number(item.quantity || 0);
        return acc;
      }, {});

      const { subtotal, discountAmount, couponCode } = calculateCouponDiscount(items, payload.couponCode);
      const paymentMethod = payload.paymentMethod === 'cod' ? 'cod' : 'stripe';
      const shippingAmount = 0;
      const vendorSplits = Object.values(vendorSplitMap);
      const subOrders = buildSubOrdersFromVendorSplits(
        vendorSplits,
        {
          subtotalAmount: subtotal,
          shippingAmount,
          discountAmount,
        },
        null,
      );
      const order = {
        _id: createLocalId(),
        user: user._id,
        items,
        shippingAddress: payload.shippingAddress,
        subtotalAmount: subtotal,
        shippingAmount,
        discountAmount,
        totalAmount: subtotal + shippingAmount - discountAmount,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: ORDER_STATUS.CREATED,
        couponCode: normalizeCouponCode(couponCode),
        paymentDetails: {},
        inventoryProcessed: false,
        inventoryReservedAt: null,
        reservationExpiresAt: null,
        inventoryReleasedAt: null,
        vendors: vendorSplits,
        subOrders,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      order.subOrders = buildSubOrdersFromVendorSplits(
        order.vendors,
        {
          subtotalAmount: order.subtotalAmount,
          shippingAmount: order.shippingAmount,
          discountAmount: order.discountAmount,
        },
        order._id,
      );

      order.items.forEach((item) => {
        const product = store.products.find((entry) => entry._id === item.product);

        if (!product || product.stock < item.quantity) {
          throw new ApiError(409, `Insufficient stock for ${item.name}`);
        }
      });

      order.items.forEach((item) => {
        const product = store.products.find((entry) => entry._id === item.product);
        product.stock -= item.quantity;
        product.updatedAt = new Date().toISOString();
      });
      order.inventoryProcessed = true;
      order.inventoryReservedAt = new Date().toISOString();
      if (paymentMethod === 'stripe') {
        order.reservationExpiresAt = getReservationExpiryDate().toISOString();
        if (order.orderStatus === ORDER_STATUS.CREATED) {
          order.orderStatus = ORDER_STATUS.PAYMENT_PENDING;
        }
      }

      store.orders.push(order);

      if (cart) {
        cart.items = [];
        cart.totalItems = 0;
        cart.totalPrice = 0;
        cart.updatedAt = new Date().toISOString();
      }

      await notifyVendorsForNewOrder(order, store);

      return hydrateLocalOrder(order, store);
    });
  }

  const cart = await Cart.findOne({ user: user._id });
  const sourceItems = payload.items?.length ? payload.items : cart?.items || [];

  if (!sourceItems.length) {
    throw new ApiError(400, 'Cart is empty');
  }

  const items = await normalizeOrderItems(sourceItems);

  const itemsWithVendor = await Promise.all(
    items.map(async (item) => {
      const product = await Product.findById(item.product);
      const vendor = product?.vendor
        ? await Vendor.findById(product.vendor)
        : product?.createdBy
          ? await Vendor.findOne({ user: product.createdBy })
          : null;
      return {
        product: item.product,
        vendor: vendor?._id || product?.vendor || null,
        vendorName: vendor?.businessName || 'Shopzy Seller',
        name: item.name,
        image: item.image,
        slug: item.slug,
        size: item.size,
        color: item.color || '',
        sku: item.sku || buildOrderItemSku(product, item.size, item.color || ''),
        price: item.price,
        quantity: item.quantity,
        itemStatus: ORDER_STATUS.CREATED,
      };
    })
  );

  const missingVendorItem = itemsWithVendor.find((item) => !item.vendor);
  if (missingVendorItem) {
    throw new ApiError(400, `Product "${missingVendorItem.name}" is not linked to an active vendor`);
  }

  const vendorSplits = await splitOrderByVendor(itemsWithVendor);

  const { subtotal, discountAmount, couponCode } = calculateCouponDiscount(items, payload.couponCode);
  const paymentMethod = payload.paymentMethod === 'cod' ? 'cod' : 'stripe';
  const shippingAmount = 0;

  let order;
  try {
    const initialSubOrders = buildSubOrdersFromVendorSplits(
      vendorSplits,
      {
        subtotalAmount: subtotal,
        shippingAmount,
        discountAmount,
      },
      null,
    );

    order = await Order.create({
      user: user._id,
      items: itemsWithVendor,
      vendors: vendorSplits,
      subOrders: initialSubOrders,
      shippingAddress: payload.shippingAddress,
      subtotalAmount: subtotal,
      shippingAmount,
      discountAmount,
      totalAmount: subtotal + shippingAmount - discountAmount,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: ORDER_STATUS.CREATED,
      couponCode: normalizeCouponCode(couponCode),
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      const itemsDebug = JSON.stringify(itemsWithVendor[0], null, 2);
      throw new ApiError(400, `Order validation failed: ${error.message}. Sample item: ${itemsDebug}`);
    }
    throw error;
  }

  // Populate vendor items with the auto-generated item IDs after order is created
  if (order.vendors && order.items && order.vendors.length > 0) {
    for (const vendor of order.vendors) {
      const vendorItems = order.items.filter(
        (item) => item.vendor?.toString() === vendor.vendor?.toString()
      );
      vendor.items = vendorItems.map((item) => item._id);
      vendor.itemIds = vendorItems.map((item) => item._id);
    }

    if (order.subOrders?.length) {
      for (let index = 0; index < order.subOrders.length; index += 1) {
        const subOrder = order.subOrders[index];
        const subOrderItems = order.items.filter(
          (item) => item.vendor?.toString() === subOrder.vendor?.toString(),
        );

        subOrder.itemIds = subOrderItems.map((item) => item._id);
        subOrder.subOrderNumber = subOrder.subOrderNumber || buildSubOrderNumber(order._id, subOrder.vendor, index);
      }
    }

    await order.save();
  }

  await reserveOrderInventory(order);

  if (paymentMethod === 'stripe' && order.orderStatus === ORDER_STATUS.CREATED) {
    order.orderStatus = ORDER_STATUS.PAYMENT_PENDING;
  }

  await order.save();

  if (paymentMethod === 'cod') {
    await updateVendorWalletForOrder(order, 'add');
  }

  if (cart && cart.items.length) {
    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;
    await cart.save();
  }

  const hydratedOrder = await getPopulatedOrder(order._id);

  await notifyVendorsForNewOrder(hydratedOrder);

  sendOrderConfirmationEmail({ order: hydratedOrder, user }).catch(() => undefined);

  return hydratedOrder;
};
