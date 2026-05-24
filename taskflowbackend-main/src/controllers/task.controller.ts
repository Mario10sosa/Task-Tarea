import { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { taskProxy } from '../structuralpattern/TaskProxy';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { type, priority, assignedTo } = req.query;
    const filters: any = {};
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assignedTo = assignedTo;

    const tasks = await taskService.getTasks((req.params.id as string), filters);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Proxy: valida membresía, datos y WIP Limit antes de crear
    const { projectId, columnId, ...taskData } = req.body;
    const task = await taskProxy.createTask(
      { requesterId: req.user._id.toString(), boardId: req.params.id as string, projectId, columnId },
      taskData
    );
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const buildTask = async (req: Request, res: Response) => {
  try {
    const { projectId, columnId, ...taskData } = req.body;
    const task = await taskService.createTaskWithBuilder((req.params.id as string), projectId, columnId, taskData);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTask = async (req: Request, res: Response) => {
  try {
    const task = await taskService.getTaskDetails((req.params.id as string));
    res.json(task);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Proxy: valida acceso a la tarea y datos de entrada
    const task = await taskProxy.updateTask(
      { requesterId: req.user._id.toString(), taskId: req.params.id as string },
      req.body
    );
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const moveTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Proxy: valida acceso y WIP Limit en columna destino
    const { columnId } = req.body;
    const task = await taskProxy.moveTask(
      { requesterId: req.user._id.toString(), taskId: req.params.id as string },
      columnId
    );
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const cloneTask = async (req: Request, res: Response) => {
  try {
    const { boardId, columnId } = req.body;
    // Default to the task's current board if not provided
    const taskToClone = await taskService.getTaskDetails((req.params.id as string));
    const targetBoard = boardId || taskToClone.boardId.toString();
    const targetColumnId = columnId || taskToClone.columnId;

    const task = await taskService.cloneTaskService((req.params.id as string), targetBoard, targetColumnId);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Proxy: valida acceso antes de eliminar
    const result = await taskProxy.deleteTask(
      { requesterId: req.user._id.toString(), taskId: req.params.id as string }
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ── Composite: Subtareas y Progreso ───────────────────────────────────────────

export const createSubtask = async (req: Request, res: Response) => {
  try {
    const parentTaskId = req.params.id as string;
    const subtask = await taskService.createSubtask(parentTaskId, req.body);
    res.status(201).json(subtask);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getSubtasks = async (req: Request, res: Response) => {
  try {
    const subtasks = await taskService.getSubtasks(req.params.id as string);
    res.json(subtasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaskProgress = async (req: Request, res: Response) => {
  try {
    const result = await taskService.getTaskProgress(req.params.id as string);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

// ── Decorator: Etiquetas, Adjuntos y Presentación ─────────────────────────────

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuración de multer — almacenamiento local en /uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máx (RF-04.7)
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
    const ext     = allowed.test(path.extname(file.originalname).toLowerCase());
    ext ? cb(null, true) : cb(new Error('Tipo de archivo no permitido'));
  },
});

export const getDecoratedTask = async (req: Request, res: Response) => {
  try {
    const result = await taskService.getDecoratedTask(req.params.id as string);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const addLabel = async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    if (!name || !color) return res.status(400).json({ message: 'name y color son requeridos' });
    const result = await taskService.addLabel(req.params.id as string, { name, color });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeLabel = async (req: Request, res: Response) => {
  try {
    const result = await taskService.removeLabel(
      req.params.id as string,
      req.params.labelName as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const addAttachment = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result  = await taskService.addAttachment(req.params.id as string, {
      filename:     req.file.filename,
      originalName: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
      url:          `${baseUrl}/uploads/${req.file.filename}`,
    });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeAttachment = async (req: Request, res: Response) => {
  try {
    const result = await taskService.removeAttachment(
      req.params.id as string,
      req.params.filename as string
    );
    // Eliminar el archivo físico
    const filePath = path.join(uploadsDir, req.params.filename as string);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
// ── State Pattern ──────────────────────────────────────────────────────────────
import { TaskStateContext } from '../behaviorpatterns/TaskState';

/**
 * GET /api/tasks/:id/transitions
 * Estado actual de la tarea y transiciones permitidas.
 */
export const getTransitions = async (req: Request, res: Response) => {
  try {
    const task = await taskService.getTaskDetails(req.params.id as string);
    const ctx  = new TaskStateContext(task.columnId);
    res.json({ taskId: task._id, title: task.title, ...ctx.getStateInfo() });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * POST /api/tasks/:id/transition
 * Body: { targetColumnId: string }
 * Transiciona la tarea al nuevo estado si la transición es válida.
 */
export const transitionTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetColumnId } = req.body;
    if (!targetColumnId)
      return res.status(400).json({ message: 'targetColumnId es requerido' });

    const task = await taskService.getTaskDetails(req.params.id as string);
    const ctx  = new TaskStateContext(task.columnId);
    const newColumnId = ctx.transition(targetColumnId); // lanza si no permitida

    // Pasa por el Proxy para auditoría
    const updated = await taskProxy.moveTask(
      { requesterId: req.user._id.toString(), taskId: req.params.id as string },
      newColumnId
    );

    res.json({ task: updated, stateInfo: ctx.getStateInfo() });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};