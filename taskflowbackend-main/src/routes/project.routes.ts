import { Router } from 'express';
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  cloneProjectEndpoint,
  removeMember,
  getProjectDashboard,
  archiveProject,
} from '../controllers/project.controller';
import { generateProjectReport } from '../controllers/report.controller';
import { protect } from '../middlewares/auth.middleware';
import { requireProjectRole } from '../middlewares/permissions';

const router = Router();

router.get('/',    protect, getProjects);
router.post('/',   protect, createProject);   // Facade: crea proyecto completo
router.get('/:id', protect, requireProjectRole(['admin', 'member']), getProject);
router.put('/:id', protect, requireProjectRole(['admin']), updateProject);
router.delete('/:id', protect, deleteProject); // Facade: elimina en cascada
router.post('/:id/clone',   protect, cloneProjectEndpoint);
router.post('/:id/archive', protect, requireProjectRole(['admin']), archiveProject); // Facade: archiva
router.delete('/:id/members/:userId', protect, requireProjectRole(['admin']), removeMember);

// Facade — Dashboard unificado
router.get('/:id/dashboard', protect, requireProjectRole(['admin', 'member']), getProjectDashboard);

// Bridge — Reportes
router.get('/:id/report', protect, requireProjectRole(['admin', 'member']), generateProjectReport);

export default router;