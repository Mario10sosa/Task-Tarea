import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { taskEventBus, MediatorEventType } from '../behaviorpatterns/TaskMediator';

/**
 * POST /api/mediator/events
 * Publica un evento al TaskEventBus.
 * Body: { type, data }
 */
export const publishEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, data } = req.body as { type: MediatorEventType; data: Record<string, any> };
    if (!type) return res.status(400).json({ message: 'El campo "type" es requerido' });

    const event = await taskEventBus.notify(
      req.user?.email ?? 'API',
      type,
      { ...data, requestedBy: req.user?._id?.toString() }
    );

    res.status(201).json({ message: 'Evento publicado en el bus', event });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/mediator/events
 * Retorna el log de eventos procesados por el Mediator.
 */
export const getEventLog = async (_req: Request, res: Response) => {
  try {
    const log = taskEventBus.getEventLog();
    res.json({ total: log.length, events: log });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/mediator/stats
 * Estadísticas del bus de eventos.
 */
export const getStats = async (_req: Request, res: Response) => {
  try {
    res.json(taskEventBus.getStats());
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};