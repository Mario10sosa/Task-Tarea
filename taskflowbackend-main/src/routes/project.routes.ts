import { Router } from 'express';
import {
  getProjects, createProject, getProject, updateProject,
  deleteProject, cloneProjectEndpoint, removeMember,
  getProjectDashboard, archiveProject,
} from '../controllers/project.controller';
import { generateProjectReport } from '../controllers/report.controller';
import { protect }               from '../middlewares/auth.middleware';
//import { requireProjectRole }    from '../middlewares/permissions';
import { buildProjectChain, buildFullChain } from '../behaviorpatterns/RequestValidationChain';

const router = Router();

router.get('/',    protect, getProjects);
router.post('/',   protect, createProject);

// Chain of Responsibility: auth + activo + membresía + rol
router.get('/:id',    buildProjectChain(['admin', 'member']), getProject);
router.put('/:id',    buildProjectChain(['admin']),           updateProject);
router.delete('/:id', protect,                                deleteProject);

router.post('/:id/clone',   protect,                        cloneProjectEndpoint);
router.post('/:id/archive', buildProjectChain(['admin']),   archiveProject);

router.delete('/:id/members/:userId',
  buildProjectChain(['admin']), removeMember);

// Chain completa (con rate limit): dashboard y reportes
router.get('/:id/dashboard',
  buildFullChain(['admin', 'member'], 30), getProjectDashboard);

router.get('/:id/report',
  buildFullChain(['admin', 'member'], 10), generateProjectReport);

export default router;