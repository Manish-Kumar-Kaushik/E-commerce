import { canGenerateInvoiceForOrder, getOrderForUser } from './orderService.js';
import { createOrderInvoicePdfBuffer } from '../utils/invoicePdf.js';
import ApiError from '../utils/ApiError.js';

export const buildOrderInvoicePdf = async (orderId, user) => {
  const order = await getOrderForUser(orderId, user);

  if (!canGenerateInvoiceForOrder(order)) {
    throw new ApiError(400, 'Invoice is available only after delivery and successful payment');
  }

  const pdfBuffer = await createOrderInvoicePdfBuffer(order);

  return {
    order,
    pdfBuffer,
    fileName: `invoice-${order._id.toString().slice(-6).toUpperCase()}.pdf`,
  };
};
