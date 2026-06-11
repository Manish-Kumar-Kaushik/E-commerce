import asyncHandler from '../utils/asyncHandler.js';
import {
  loginAdminUser,
  loginUser,
  loginVendorUser,
  requestPasswordResetOtp,
  registerUser,
  resetPasswordWithOtp,
  verifyPasswordResetOtp,
} from '../services/authService.js';
import { upsertUserFromClerk } from '../services/userService.js';
import generateToken from '../utils/generateToken.js';

export const register = asyncHandler(async (req, res) => {
  const { role, businessName, businessPhone, businessAddress } = req.body;
  const result = await registerUser({ ...req.body, role, businessName, businessPhone, businessAddress });

  res.status(201).json({
    success: true,
    message: result.message || 'User registered successfully',
    user: result.user,
    token: result.token,
    vendorCreated: result.vendorCreated,
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    ...result,
  });
});

export const adminLogin = asyncHandler(async (req, res) => {
  const result = await loginAdminUser(req.body);

  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    ...result,
  });
});

export const vendorLogin = asyncHandler(async (req, res) => {
  const result = await loginVendorUser(req.body);

  res.status(200).json({
    success: true,
    message: 'Vendor login successful',
    ...result,
  });
});

export const syncUser = asyncHandler(async (req, res) => {
  const result = await upsertUserFromClerk(req.body);
  const token = generateToken(result);

  res.status(200).json({
    success: true,
    message: 'User synced successfully',
    token,
    user: result,
    ...result,
  });
});

export const requestResetOtp = asyncHandler(async (req, res) => {
  const result = await requestPasswordResetOtp(req.body);

  res.status(200).json({
    success: true,
    message: result?.message || 'OTP sent successfully',
  });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  await verifyPasswordResetOtp(req.body);

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await resetPasswordWithOtp(req.body);

  res.status(200).json({
    success: true,
    message: 'Password reset successful. Please login with your new password.',
  });
});
