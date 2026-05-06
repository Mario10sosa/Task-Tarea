import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as notificationService from '../services/notification.service';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await notificationService.getNotifications(req.user._id.toString());
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await notificationService.getUnreadCount(req.user._id.toString());
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const notification = await notificationService.markAsRead(id, req.user._id.toString());
    res.json(notification);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id.toString());
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await notificationService.deleteNotification(id, req.user._id.toString());
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};