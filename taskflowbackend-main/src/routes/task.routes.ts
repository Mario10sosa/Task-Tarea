import { Router } from 'express';
import {
  getTasks, createTask, buildTask, getTask, updateTask,
  moveTask, cloneTask, deleteTask,
  createSubtask, getSubtasks, getTaskProgress,
  getDecoratedTask, addLabel, removeLabel,
  addAttachment, removeAttachment, upload,
  getTransitions, transitionTask,
} from '../controllers/task.controller';
import { protect } from '../middlewares/auth.middleware';
import { taskProxy } from '../structuralpattern/TaskProxy';
import { executeCommand, undoCommand, redoCommand, getCommandHistory } from '../controllers/command.controller';
import { AuditLogObserver } from '../behaviorpatterns/TaskObserver';
import { getSortedTasks, getAvailableStrategies } from '../controllers/strategy.controller';

const router = Router({ mergeParams: true });

// ── Rutas estáticas PRIMERO (antes de /:id) ────────────────────────────────────

// Base CRUD sin parámetro id
router.get('/',                   protect, getTasks);
router.get('/board/:id',          protect, getTasks);
router.post('/',                  protect, createTask);
router.post('/board/:id/factory', protect, createTask);
router.post('/build',             protect, buildTask);
router.post('/board/:id/builder', protect, buildTask);

// Proxy — Log de auditoría
router.get('/audit/log', protect, (_req, res) => res.json(taskProxy.getAuditLog()));

// Observer — Audit log de eventos (rutas estáticas antes de /:id)
router.get('/events/log', protect, (_req, res) => res.json(AuditLogObserver.getLog()));

// Strategy — Ordenamiento (DEBE ir antes de /:id)
router.get('/sort/strategies', protect, getAvailableStrategies);
router.get('/sort',            protect, getSortedTasks);

// ── Rutas con parámetro /:id DESPUÉS ──────────────────────────────────────────

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
router.post('/:id/labels',               protect, addLabel);
router.delete('/:id/labels/:labelName',  protect, removeLabel);

// Decorator — Adjuntos
router.post('/:id/attachments',              protect, upload.single('file'), addAttachment);
router.delete('/:id/attachments/:filename',  protect, removeAttachment);

// Command — Undo/Redo
router.post('/:id/commands', protect, executeCommand);
router.post('/:id/undo',     protect, undoCommand);
router.post('/:id/redo',     protect, redoCommand);
router.get('/:id/history',   protect, getCommandHistory);

// Observer — Eventos por tarea
router.get('/:id/events', protect, (req, res) => res.json(AuditLogObserver.getLogByTask(req.params.id as string)));

// State — Ciclo de vida
router.get('/:id/transitions', protect, getTransitions);
router.post('/:id/transition', protect, transitionTask);

export default router;