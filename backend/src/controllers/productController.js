import asyncHandler from '../utils/asyncHandler.js';
import {
  createProduct,
  deleteProduct,
  getProductBySlug,
  getProducts,
  updateProduct,
} from '../services/productService.js';

export const createProductController = asyncHandler(async (req, res) => {
  const product = await createProduct(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    product,
  });
});

export const updateProductController = asyncHandler(async (req, res) => {
  const product = await updateProduct(req.params.identifier, req.body, req.user);

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    product,
  });
});

export const deleteProductController = asyncHandler(async (req, res) => {
  await deleteProduct(req.params.identifier, req.user);

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

export const getProductsController = asyncHandler(async (req, res) => {
  const result = await getProducts(req.query);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getProductController = asyncHandler(async (req, res) => {
  const product = await getProductBySlug(req.params.identifier, req.query);

  res.status(200).json({
    success: true,
    product,
  });
});
