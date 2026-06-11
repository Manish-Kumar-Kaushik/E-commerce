import asyncHandler from '../utils/asyncHandler.js';
import { uploadImages } from '../services/uploadService.js';
import User from '../models/User.js';

export const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded',
    });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const images = await uploadImages(req.files, { baseUrl });

  res.status(201).json({
    success: true,
    message: 'Images uploaded successfully',
    images,
  });
});

export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const images = await uploadImages([req.file], { baseUrl });

  if (images.length === 0) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }

  const imageUrl = images[0].url;

  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { profileImage: imageUrl });
  }

  res.status(201).json({
    success: true,
    message: 'Profile image uploaded successfully',
    imageUrl,
  });
});
