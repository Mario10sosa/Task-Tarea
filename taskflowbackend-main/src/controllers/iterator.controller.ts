import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Task } from '../models/Task';
import { TaskCollection, createIterator, TaskItem } from '../behaviorpatterns/TaskIterator';

/**
 * GET /api/projects/:id/iterate?mode=priority|overdue|column|type|all&param=columnId|type
 *
 * Recorre las tareas de un proyecto usando el Iterator indicado.
 * El cliente siempre recibe la misma estructura de respuesta
 * sin importar qué iterador se usó internamente.
 */
export const iterateTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const mode      = (req.query.mode as string) || 'all';
    const param     = req.query.param as string | undefined;

    // Cargar tareas del proyecto
    const rawTasks = await Task.find({ projectId }).lean();
    const tasks: TaskItem[] = rawTasks.map((t: any) => ({
      _id:        t._id.toString(),
      title:      t.title,
      columnId:   t.columnId,
      priority:   t.priority,
      type:       t.type,
      dueDate:    t.dueDate,
      assignedTo: t.assignedTo?.toString(),
      tags:       t.tags || [],
      createdAt:  t.createdAt,
    }));

    // Crear colección y usar el iterador solicitado
    const collection = new TaskCollection(tasks);
    const iterator   = createIterator(tasks, mode, param);

    // Materializar todos los elementos del iterador
    const items: TaskItem[] = [];
    while (iterator.hasNext()) {
      items.push(iterator.next());
    }

    res.json({
      projectId,
      mode,
      param:      param || null,
      total:      tasks.length,
      returned:   items.length,
      stats:      collection.getStats(),
      tasks:      items,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/boards/:id/iterate?mode=priority|overdue|column|type|all&param=...
 *
 * Recorre las tareas de un tablero usando el Iterator indicado.
 */
export const iterateBoardTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const boardId = req.params.id as string;
    const mode    = (req.query.mode as string) || 'all';
    const param   = req.query.param as string | undefined;

    const rawTasks = await Task.find({ boardId }).lean();
    const tasks: TaskItem[] = rawTasks.map((t: any) => ({
      _id:        t._id.toString(),
      title:      t.title,
      columnId:   t.columnId,
      priority:   t.priority,
      type:       t.type,
      dueDate:    t.dueDate,
      assignedTo: t.assignedTo?.toString(),
      tags:       t.tags || [],
      createdAt:  t.createdAt,
    }));

    const collection = new TaskCollection(tasks);
    const iterator   = createIterator(tasks, mode, param);

    const items: TaskItem[] = [];
    while (iterator.hasNext()) {
      items.push(iterator.next());
    }

    res.json({
      boardId,
      mode,
      param:    param || null,
      total:    tasks.length,
      returned: items.length,
      stats:    collection.getStats(),
      tasks:    items,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};