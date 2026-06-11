import Notification from '../models/Notification.js';
import {
  createLocalId,
  mutateLocalStore,
  shouldUseLocalStore,
} from './localStoreService.js';

export const createNotification = async (userId, type, title, message, data = {}) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const notification = {
        _id: createLocalId(),
        user: userId,
        type,
        title,
        message,
        data,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.notifications.push(notification);
      return notification;
    });
  }

  return Notification.create({
    user: userId,
    type,
    title,
    message,
    data,
  });
};

export const createVendorOrderNotification = async (vendorId, orderId, orderTotal, itemCount) => {
  const message = `New order received! ${itemCount} item(s) - ₹${orderTotal}`;
  
  return createNotification(
    vendorId,
    'order',
    'New Order Received',
    message,
    { orderId, amount: orderTotal, itemCount }
  );
};

export const getUserNotifications = async (userId, limit = 20) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const notifications = (store.notifications || [])
        .filter((n) => n.user === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
      return notifications;
    });
  }

  return Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

export const markNotificationAsRead = async (notificationId, userId) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const notification = store.notifications.find(
        (n) => n._id === notificationId && n.user === userId
      );
      if (notification) {
        notification.isRead = true;
        notification.updatedAt = new Date().toISOString();
      }
      return notification;
    });
  }

  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
};

export const getUnreadCount = async (userId) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      return (store.notifications || []).filter(
        (n) => n.user === userId && !n.isRead
      ).length;
    });
  }

  return Notification.countDocuments({ user: userId, isRead: false });
};