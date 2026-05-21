import { Router } from 'express';
import {
  getFlyweightPool,
  getSystemLabels,
  resolveLabel,
  getProjectLabels,
} from '../controllers/flyweight.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// GET  /api/flyweight/labels           → pool completo + estadísticas
// GET  /api/flyweight/labels/system    → etiquetas predefinidas del sistema
// POST /api/flyweight/labels/resolve   → resolver una etiqueta por el pool
// GET  /api/flyweight/labels/project/:id → etiquetas únicas de un proyecto

router.get('/labels',              protect, getFlyweightPool);
router.get('/labels/system',       protect, getSystemLabels);
router.post('/labels/resolve',     protect, resolveLabel);
router.get('/labels/project/:id',  protect, getProjectLabels);

export default router;