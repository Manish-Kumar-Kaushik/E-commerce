import asyncHandler from '../utils/asyncHandler.js';
import {
  addUserAddress,
  deleteUserById,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  updateUserRole,
} from '../services/userService.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await getUserProfile(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateUserProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
  });
});

export const addAddress = asyncHandler(async (req, res) => {
  const addresses = await addUserAddress(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    addresses,
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const result = await getAllUsers(req.query);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const changeUserRole = asyncHandler(async (req, res) => {
  const user = await updateUserRole(req.params.id, req.body.role);

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    user,
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  await deleteUserById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});
