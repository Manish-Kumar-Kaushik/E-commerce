import asyncHandler from '../utils/asyncHandler.js';
import {
  cancelOrderForUser,
  createOrderRecord,
  getAllOrders,
  getOrderForUser,
  getOrderTrackingById,
  markOrderRefunded,
  requestOrderReturnForUser,
  getUserOrders,
  updateOrderStatus,
  approveOrRejectReturnRequest,
} from '../services/orderService.js';
import { buildOrderInvoicePdf } from '../services/invoiceService.js';
import { processStripeRefund } from '../services/stripeService.js';
import ApiError from '../utils/ApiError.js';

export const createOrder = asyncHandler(async (req, res) => {
  const order = await createOrderRecord(req.user, req.body);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order,
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await getUserOrders(req.user._id);

  res.status(200).json({
    success: true,
    orders,
  });
});

export const getOrderByIdController = asyncHandler(async (req, res) => {
  const order = await getOrderForUser(req.params.id, req.user);

  res.status(200).json({
    success: true,
    order,
  });
});

export const getOrders = asyncHandler(async (req, res) => {
  const result = await getAllOrders(req.query);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const updateOrderStatusController = asyncHandler(async (req, res) => {
  const order = await updateOrderStatus(req.params.id, req.body.status);

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    order,
  });
});

export const cancelMyOrderController = asyncHandler(async (req, res) => {
  const order = await cancelOrderForUser(req.params.id, req.user, req.body.reason);

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    order,
  });
});

export const requestOrderReturnController = asyncHandler(async (req, res) => {
  const order = await requestOrderReturnForUser(req.params.id, req.user, req.body);

  res.status(200).json({
    success: true,
    message: 'Return requested successfully',
    order,
  });
});

export const downloadOrderInvoiceController = asyncHandler(async (req, res) => {
  const { order, pdfBuffer, fileName } = await buildOrderInvoicePdf(req.params.id, req.user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.status(200).send(pdfBuffer);
});

export const trackPublicOrderController = asyncHandler(async (req, res) => {
  const tracking = await getOrderTrackingById(req.query.trackingId);

  res.status(200).json({
    success: true,
    tracking,
  });
});

export const refundOrderController = asyncHandler(async (req, res) => {
  const order = await processStripeRefund({
    orderId: req.params.id,
    user: req.user,
    itemId: req.body.itemId,
    reason: req.body.reason,
  });

  res.status(200).json({
    success: true,
    message: 'Refund processed successfully',
    order,
  });
});

export const approveReturnRequestController = asyncHandler(async (req, res) => {
  const order = await approveOrRejectReturnRequest({
    orderId: req.params.id,
    itemId: req.params.itemId,
    vendorId: req.user?.vendorId || req.vendor?._id || req.vendorId,
    decision: 'approve',
    note: req.body.note,
  });

  res.status(200).json({
    success: true,
    message: 'Return request approved',
    order,
  });
});

export const rejectReturnRequestController = asyncHandler(async (req, res) => {
  const order = await approveOrRejectReturnRequest({
    orderId: req.params.id,
    itemId: req.params.itemId,
    vendorId: req.user?.vendorId || req.vendor?._id || req.vendorId,
    decision: 'reject',
    note: req.body.note,
  });

  res.status(200).json({
    success: true,
    message: 'Return request rejected',
    order,
  });
});
