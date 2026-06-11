import asyncHandler from '../utils/asyncHandler.js';
import { getDashboardAnalytics } from '../services/adminService.js';
import Admin from '../models/Admin.js';
import ApiError from '../utils/ApiError.js';

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getDashboardAnalytics();

  res.status(200).json({
    success: true,
    analytics,
  });
});

export const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id);

  if (!admin) {
    throw new ApiError(404, 'Admin profile not found');
  }

  res.status(200).json({
    success: true,
    admin,
  });
});

export const updateAdminProfile = asyncHandler(async (req, res) => {
  const { name, phone, profileImage, profileImageUrl } = req.body;

  const admin = await Admin.findById(req.admin.id);

  if (!admin) {
    throw new ApiError(404, 'Admin profile not found');
  }

  if (name) admin.name = name;
  if (phone !== undefined) admin.phone = phone;
  if (profileImage) admin.profileImage = profileImage;
  if (profileImageUrl) admin.profileImageUrl = profileImageUrl;

  await admin.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    admin,
  });
});

export const updateAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, 'All fields are required');
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'New passwords do not match');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }

  const admin = await Admin.findById(req.admin.id).select('+password');

  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  const isPasswordCorrect = await admin.matchPassword(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  admin.password = newPassword;
  await admin.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});

export const updateAdminEmail = asyncHandler(async (req, res) => {
  const { newEmail, password } = req.body;

  if (!newEmail || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const admin = await Admin.findById(req.admin.id).select('+password');

  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  const isPasswordCorrect = await admin.matchPassword(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Password is incorrect');
  }

  const emailExists = await Admin.findOne({ email: newEmail.toLowerCase() });

  if (emailExists && emailExists._id.toString() !== req.admin.id) {
    throw new ApiError(400, 'Email already in use');
  }

  admin.email = newEmail.toLowerCase();
  await admin.save();

  res.status(200).json({
    success: true,
    message: 'Email updated successfully',
    admin,  });
});