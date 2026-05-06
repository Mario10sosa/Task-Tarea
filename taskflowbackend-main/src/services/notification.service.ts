import { Notification } from '../models/Notification';

export const getNotifications = async (userId: string) => {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
};

export const getUnreadCount = async (userId: string) => {
  const count = await Notification.countDocuments({ userId, read: false });
  return { unreadCount: count };
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
  if (!notification) throw new Error('Notification not found');
  return notification;
};

export const markAllAsRead = async (userId: string) => {
  await Notification.updateMany({ userId, read: false }, { read: true });
  return { message: 'All notifications marked as read' };
};

export const deleteNotification = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
  if (!notification) throw new Error('Notification not found');
  return { message: 'Notification deleted' };
};