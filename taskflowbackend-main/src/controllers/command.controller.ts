import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { TaskCommandInvoker, createCommand } from '../behaviorpatterns/TaskCommand';

/**
 * POST /api/tasks/:id/commands
 * Ejecuta un comando sobre una tarea.
 * Body: { type: 'move'|'update'|'assign'|'priority', ...payload }
 */
export const executeCommand = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, ...payload } = req.body;
    if (!type) return res.status(400).json({ message: 'El campo "type" es requerido' });

    const command = createCommand(type, req.params.id as string, payload, req.user._id.toString());
    const result  = await TaskCommandInvoker.execute(command);

    res.json({
      ...result,
      canUndo: TaskCommandInvoker.canUndo(req.params.id as string),
      canRedo: TaskCommandInvoker.canRedo(req.params.id as string),
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * POST /api/tasks/:id/undo
 * Deshace el último comando ejecutado sobre la tarea (RF-06.2).
 */
export const undoCommand = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await TaskCommandInvoker.undo(req.params.id as string);

    res.json({
      ...result,
      canUndo: TaskCommandInvoker.canUndo(req.params.id as string),
      canRedo: TaskCommandInvoker.canRedo(req.params.id as string),
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * POST /api/tasks/:id/redo
 * Rehace el último comando deshecho.
 */
export const redoCommand = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await TaskCommandInvoker.redo(req.params.id as string);

    res.json({
      ...result,
      canUndo: TaskCommandInvoker.canUndo(req.params.id as string),
      canRedo: TaskCommandInvoker.canRedo(req.params.id as string),
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/tasks/:id/history
 * Retorna el historial de comandos ejecutados sobre la tarea (RF-06.1).
 */
export const getCommandHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = TaskCommandInvoker.getHistory(req.params.id as string);
    res.json({
      taskId:  req.params.id,
      history,
      canUndo: TaskCommandInvoker.canUndo(req.params.id as string),
      canRedo: TaskCommandInvoker.canRedo(req.params.id as string),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};