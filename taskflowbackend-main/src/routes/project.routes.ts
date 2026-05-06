import { Router } from 'express';
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  cloneProjectEndpoint,
  removeMember,
} from '../controllers/project.controller';
import { protect } from '../middlewares/auth.middleware';
import { requireProjectRole } from '../middlewares/permissions';

const router = Router();

router.get('/', protect, getProjects);
router.post('/', protect, createProject);
router.get('/:id', protect, requireProjectRole(['admin', 'member']), getProject);
router.put('/:id', protect, requireProjectRole(['admin']), updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/clone', protect, cloneProjectEndpoint);
router.delete('/:id/members/:userId', protect, requireProjectRole(['admin']), removeMember);

export default router;
