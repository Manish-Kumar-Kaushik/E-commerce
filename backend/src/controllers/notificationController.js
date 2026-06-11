import asyncHandler from '../utils/asyncHandler.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  getUnreadCount,
} from '../services/notificationService.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await getUserNotifications(req.user._id, 20);

  res.status(200).json({
    success: true,
    notifications,
  });
});

export const getNotificationsCount = asyncHandler(async (req, res) => {
  const count = await getUnreadCount(req.user._id);

  res.status(200).json({
    success: true,
    unreadCount: count,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationAsRead(req.params.id, req.user._id);

  if (!notification) {
    throw new Error('Notification not found');
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
  });
});