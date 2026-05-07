import { Router } from 'express';
import {
  getTasks, createTask, buildTask, getTask, updateTask,
  moveTask, cloneTask, deleteTask,
  createSubtask, getSubtasks, getTaskProgress,
  getDecoratedTask, addLabel, removeLabel,
  addAttachment, removeAttachment, upload,
} from '../controllers/task.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

// Base CRUD
router.get('/',                   protect, getTasks);
router.get('/board/:id',          protect, getTasks);
router.post('/',                  protect, createTask);
router.post('/board/:id/factory', protect, createTask);
router.post('/build',             protect, buildTask);
router.post('/board/:id/builder', protect, buildTask);
router.get('/:id',                protect, getTask);
router.put('/:id',                protect, updateTask);
router.put('/:id/move',           protect, moveTask);
router.post('/:id/clone',         protect, cloneTask);
router.delete('/:id',             protect, deleteTask);

// Composite — Subtareas
router.post('/:id/subtasks',      protect, createSubtask);
router.get('/:id/subtasks',       protect, getSubtasks);
router.get('/:id/progress',       protect, getTaskProgress);

// Decorator — Presentación enriquecida
router.get('/:id/decorated',      protect, getDecoratedTask);

// Decorator — Etiquetas
router.post('/:id/labels',              protect, addLabel);
router.delete('/:id/labels/:labelName', protect, removeLabel);

// Decorator — Adjuntos (multer middleware)
router.post('/:id/attachments',              protect, upload.single('file'), addAttachment);
router.delete('/:id/attachments/:filename',  protect, removeAttachment);

export default router;