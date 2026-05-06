import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.get('/',              getNotifications); // GET  /api/notifications
router.get('/unread-count',  getUnreadCount);   // GET  /api/notifications/unread-count
router.patch('/read-all',    markAllAsRead);    // PATCH /api/notifications/read-all
router.patch('/:id/read',    markAsRead);       // PATCH /api/notifications/:id/read
router.delete('/:id',        deleteNotification); // DELETE /api/notifications/:id

export default router;