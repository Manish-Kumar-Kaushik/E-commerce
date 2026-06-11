import asyncHandler from '../utils/asyncHandler.js';
import { generateProductMetadata } from '../services/aiService.js';
import ApiError from '../utils/ApiError.js';

export const generateProductContent = asyncHandler(async (req, res) => {
  const { name, category } = req.body;

  if (!name) {
    throw new ApiError(400, 'Product name is required for AI generation');
  }

  const content = await generateProductMetadata({ name, category });

  res.status(200).json({
    success: true,
    ...content,
  });
});