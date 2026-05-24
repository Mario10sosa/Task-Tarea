import { Request, Response } from 'express';
import { Task } from '../models/Task';
import { TaskSorter, listStrategies } from '../behaviorpatterns/TaskSortStrategy';

/**
 * GET /api/tasks/sort?strategy=priority&boardId=xxx
 * Retorna las tareas ordenadas según la estrategia indicada.
 */
export const getSortedTasks = async (req: Request, res: Response) => {
  try {
    const { strategy = 'priority', boardId, projectId } = req.query as Record<string, string>;

    if (!boardId && !projectId)
      return res.status(400).json({ message: 'boardId o projectId es requerido' });

    // Buscar tareas
    const filter: Record<string, string> = {};
    if (boardId)   filter.boardId   = boardId;
    if (projectId) filter.projectId = projectId;

    const tasks = await Task.find(filter).lean();

    // Aplicar estrategia
    const sorter  = new TaskSorter(strategy);
    const sorted  = sorter.sort(tasks as any);

    res.json({
      strategy:    sorter.getStrategyInfo(),
      total:       sorted.length,
      tasks:       sorted,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/tasks/sort/strategies
 * Lista todas las estrategias disponibles.
 */
export const getAvailableStrategies = async (_req: Request, res: Response) => {
  res.json({ strategies: listStrategies() });
};