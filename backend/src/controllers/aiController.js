import asyncHandler from '../utils/asyncHandler.js';
import { generateCustomerSupportReply, generateProductMetadata } from '../services/aiService.js';
import { getProductBySlug } from '../services/productService.js';
import { getUserOrders } from '../services/orderService.js';

export const generateProductContent = asyncHandler(async (req, res) => {
  const { name, category, images = [] } = req.body;

  console.log('generateProductContent handler invoked', {
    path: req.originalUrl,
    method: req.method,
    userId: req.auth?.userId || req.user?._id || null,
  });

  if (!name || !category) {
    return res.status(400).json({
      success: false,
      message: 'Product name and category are required',
    });
  }

  try {
    // Call the AI service to generate product content
    const productContent = await generateProductMetadata({ name, category, images });

    res.status(200).json({
      success: true,
      message: 'Product content generated successfully',
      data: productContent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate product content',
    });
  }
});

export const chatCustomerSupport = asyncHandler(async (req, res) => {
  const { message = '', productId = '', productSlug = '', orderId = '' } = req.body || {};
  const trimmedMessage = String(message || '').trim();

  if (!trimmedMessage) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    });
  }

  const orders = req.user?._id ? await getUserOrders(req.user._id) : [];

  let product = null;
  const productIdentifier = productId || productSlug;

  if (productIdentifier) {
    try {
      product = await getProductBySlug(productIdentifier, { publicOnly: 'true' });
    } catch (error) {
      product = null;
    }
  }

  const response = await generateCustomerSupportReply({
    message: trimmedMessage,
    user: req.user || null,
    product,
    orders,
    orderId,
  });

  res.status(200).json({
    success: true,
    message: 'Customer support reply generated successfully',
    data: response,
  });
});