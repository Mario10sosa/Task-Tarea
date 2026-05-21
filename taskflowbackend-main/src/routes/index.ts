import { Router } from 'express';
import authRoutes         from './auth.routes';
import userRoutes         from './user.routes';
import projectRoutes      from './project.routes';
import boardRoutes        from './board.routes';
import taskRoutes         from './task.routes';
import invitationRoutes   from './invitation.routes';
import notificationRoutes from './notification.routes';
import flyweightRoutes    from './flyweight.routes';

const router = Router();

router.use('/auth',                  authRoutes);
router.use('/users',                 userRoutes);
router.use('/projects',              projectRoutes);
router.use('/projects/:id/boards',   boardRoutes);
router.use('/boards',                boardRoutes);
router.use('/boards/:id/tasks',      taskRoutes);
router.use('/tasks',                 taskRoutes);
router.use('/projects/:id',          invitationRoutes);
router.use('/invitations',           invitationRoutes);
router.use('/notifications',         notificationRoutes);
router.use('/flyweight',             flyweightRoutes);   // Flyweight — pool de etiquetas

export default router;