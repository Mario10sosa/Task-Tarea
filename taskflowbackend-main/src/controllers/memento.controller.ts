import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  TaskMemento,
  TaskMementoOriginator,
  TaskMementoCaretaker,
} from '../behaviorpatterns/TaskMemento';

/**
 * POST /api/tasks/:id/snapshot
 * Body: { label?: string }
 * Toma un snapshot del estado actual de la tarea.
 */
export const createSnapshot = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId  = req.params.id as string;
    const userId  = req.user._id.toString();
    const label   = req.body.label || `Snapshot ${new Date().toLocaleString('es-CO')}`;

    const memento  = await TaskMementoOriginator.createMemento(taskId, label, userId);
    const snapshot = TaskMementoCaretaker.save(taskId, memento);

    res.status(201).json({ message: 'Snapshot creado', snapshot });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/tasks/:id/snapshots
 * Lista el historial de snapshots de una tarea.
 */
export const getSnapshots = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId   = req.params.id as string;
    const history  = TaskMementoCaretaker.getHistory(taskId);

    res.json({
      taskId,
      total:    history.length,
      snapshots: history,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * POST /api/tasks/:id/restore/:snapshotId
 * Restaura la tarea al estado de un snapshot específico.
 */
export const restoreSnapshot = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: taskId, snapshotId } = req.params as { id: string; snapshotId: string };

    const memento = TaskMementoCaretaker.getMemento(taskId, snapshotId);
    if (!memento) {
      return res.status(404).json({
        message: `Snapshot "${snapshotId}" no encontrado para la tarea ${taskId}`,
      });
    }

    const restored = await TaskMementoOriginator.restoreFromMemento(memento);
    const snap     = memento.getSnapshot();

    res.json({
      message:  `Tarea restaurada al snapshot "${snap.label}"`,
      snapshot: snap,
      task:     restored,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * DELETE /api/tasks/:id/snapshots
 * Limpia el historial de snapshots de una tarea.
 */
export const clearSnapshots = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = req.params.id as string;
    TaskMementoCaretaker.clearHistory(taskId);
    res.json({ message: `Historial de snapshots eliminado para tarea ${taskId}` });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/tasks/snapshots/stats
 * Estadísticas del Caretaker — cuántos snapshots hay por tarea.
 */
export const getSnapshotStats = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = TaskMementoCaretaker.getStats();
    res.json({ stats });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};