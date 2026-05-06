import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import projectRoutes from './project.routes';
import boardRoutes from './board.routes';
import taskRoutes from './task.routes';
import invitationRoutes from './invitation.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);

// According to plan.md:
// GET /api/projects/:id/boards -> boardRoutes
// POST /api/projects/:id/boards -> boardRoutes
router.use('/projects/:id/boards', boardRoutes);

// PUT /api/boards/:id -> boardRoutes
// DELETE /api/boards/:id -> boardRoutes
router.use('/boards', boardRoutes);

// GET /api/boards/:id/tasks -> taskRoutes
// POST /api/boards/:id/tasks -> taskRoutes
// POST /api/boards/:id/tasks/build -> taskRoutes
router.use('/boards/:id/tasks', taskRoutes);

// GET /api/tasks/:id, PUT, PATCH, DELETE -> taskRoutes
router.use('/tasks', taskRoutes);

// POST /api/projects/:id/invite -> invitationRoutes (invite)
router.use('/projects/:id', invitationRoutes);

// GET /api/invitations/:token, PATCH accept/reject -> invitationRoutes
router.use('/invitations', invitationRoutes);

export default router;
