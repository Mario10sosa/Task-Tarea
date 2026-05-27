import { Router } from 'express';
import {
  getProjects, createProject, getProject, updateProject,
  deleteProject, cloneProjectEndpoint, removeMember,
  getProjectDashboard, archiveProject,
} from '../controllers/project.controller';
import { generateProjectReport } from '../controllers/report.controller';
import { iterateTasks } from '../controllers/iterator.controller';
import { generateTemplateReport, getReportTypes } from '../controllers/template.controller';
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

// Iterator — recorrer tareas del proyecto con distintos criterios
router.get('/:id/iterate', buildProjectChain(['admin', 'member']), iterateTasks);

// Template Method — flujo completo de generación de reportes (cargar→procesar→formatear→exportar)
router.get('/:id/template-report/types', buildProjectChain(['admin', 'member']), getReportTypes);
router.get('/:id/template-report',       buildProjectChain(['admin', 'member']), generateTemplateReport);

export default router;