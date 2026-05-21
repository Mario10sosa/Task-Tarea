import { Request, Response } from 'express';
import { LabelFlyweightFactory, SYSTEM_LABELS, TaskLabelContext } from '../structuralpattern/LabelFlyweight';
import { Task } from '../models/Task';

/**
 * GET /api/flyweight/labels
 * Retorna el pool completo de etiquetas compartidas y estadísticas de reutilización.
 * Útil para demostrar el beneficio de memoria del patrón Flyweight.
 */
export const getFlyweightPool = async (_req: Request, res: Response) => {
  try {
    res.json(LabelFlyweightFactory.getStats());
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/flyweight/labels/system
 * Retorna las etiquetas predefinidas del sistema disponibles para usar en tareas.
 */
export const getSystemLabels = async (_req: Request, res: Response) => {
  try {
    res.json({
      labels:      SYSTEM_LABELS,
      poolSize:    LabelFlyweightFactory.getPoolSize(),
      description: 'Etiquetas del sistema precargadas en el pool Flyweight',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/flyweight/labels/resolve
 * Resuelve una etiqueta a través del Flyweight — retorna la instancia del pool.
 * Body: { name: string, color: string, taskId?: string }
 */
export const resolveLabel = async (req: Request, res: Response) => {
  try {
    const { name, color, taskId } = req.body;
    if (!name || !color) {
      return res.status(400).json({ message: 'name y color son requeridos' });
    }

    const context = new TaskLabelContext(taskId || 'preview', name, color);
    const stats   = LabelFlyweightFactory.getStats();

    res.json({
      resolved:     context.toLabel(),
      rendered:     context.render(),
      flyweightKey: context.getFlyweight().getKey(),
      poolSize:     (stats as any).poolSize,
      reuseRate:    (stats as any).reuseRate,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/flyweight/labels/project/:id
 * Muestra todas las etiquetas únicas usadas en un proyecto (desde el pool Flyweight).
 * Demuestra que etiquetas repetidas en múltiples tareas son la MISMA instancia.
 */
export const getProjectLabels = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const tasks     = await Task.find({ projectId }).select('labels title');

    // Recopilar todas las etiquetas del proyecto a través del Flyweight
    const labelMap = new Map<string, { label: any; usedInTasks: string[]; taskCount: number }>();

    tasks.forEach((task: any) => {
      (task.labels || []).forEach((label: { name: string; color: string }) => {
        // Cada llamada a getLabel retorna la instancia del pool — no crea una nueva
        const flyweight = LabelFlyweightFactory.getLabel(label.name, label.color);
        const key       = flyweight.getKey();

        if (!labelMap.has(key)) {
          labelMap.set(key, { label: flyweight.toJSON(), usedInTasks: [], taskCount: 0 });
        }
        labelMap.get(key)!.usedInTasks.push(task.title);
        labelMap.get(key)!.taskCount++;
      });
    });

    const uniqueLabels = Array.from(labelMap.values());
    const totalUsages  = uniqueLabels.reduce((sum, l) => sum + l.taskCount, 0);

    res.json({
      projectId,
      uniqueLabels,
      summary: {
        uniqueLabelCount: uniqueLabels.length,
        totalUsages,
        memorySaved: totalUsages > 0
          ? `${totalUsages - uniqueLabels.length} objetos ahorrados en memoria`
          : 'Sin datos',
        poolSize: LabelFlyweightFactory.getPoolSize(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};