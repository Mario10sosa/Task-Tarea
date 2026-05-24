import { Router } from 'express';
import {
  getTasks, createTask, buildTask, getTask, updateTask,
  moveTask, cloneTask, deleteTask,
  createSubtask, getSubtasks, getTaskProgress,
  getDecoratedTask, addLabel, removeLabel,
  addAttachment, removeAttachment, upload,
} from '../controllers/task.controller';
import { protect } from '../middlewares/auth.middleware';
import { taskProxy } from '../structuralpattern/TaskProxy';

const router = Router({ mergeParams: true });

// Base CRUD — Proxy intercepta create, update, move, delete
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

// Proxy — Log de auditoría
router.get('/audit/log', protect, (_req, res) => res.json(taskProxy.getAuditLog()));

export default router;
// ── Command Pattern — Undo/Redo ────────────────────────────────────────────────
import {
  executeCommand, undoCommand, redoCommand, getCommandHistory
} from '../controllers/command.controller';

router.post('/:id/commands', protect, executeCommand);  // ejecutar comando
router.post('/:id/undo',     protect, undoCommand);     // deshacer (RF-06.2)
router.post('/:id/redo',     protect, redoCommand);     // rehacer
router.get('/:id/history',   protect, getCommandHistory); // historial (RF-06.1)
// Observer — Audit log de eventos
import { AuditLogObserver } from '../behaviorpatterns/TaskObserver';
router.get('/events/log',         protect, (_req, res) => res.json(AuditLogObserver.getLog()));
router.get('/:id/events',         protect, (req, res) => res.json(AuditLogObserver.getLogByTask(req.params.id as string)));
// ── State Pattern — Ciclo de vida de la tarea ──────────────────────────────────
import { getTransitions, transitionTask } from '../controllers/task.controller';
router.get('/:id/transitions', protect, getTransitions);  // estados permitidos
router.post('/:id/transition', protect, transitionTask);  // transicionar con validación