import { Request, Response } from 'express';
import { Task } from '../models/Task';
import {
  TaskNode, VisitableTaskNode,
  getVisitor, listVisitors,
} from '../behaviorpatterns/TaskVisitor';

/** Construye el árbol de tareas con sus subtareas */
async function buildTaskTree(projectId: string): Promise<TaskNode[]> {
  const tasks = await Task.find({ projectId }).lean();

  const map = new Map<string, TaskNode>();
  const roots: TaskNode[] = [];

  // Primer paso: crear nodos
  tasks.forEach(t => {
    map.set(t._id.toString(), {
      _id:             t._id.toString(),
      title:           t.title,
      type:            t.type ?? 'simple',
      priority:        t.priority ?? 'medium',
      columnId:        t.columnId,
      assignedTo:      (t as any).assignedTo?.toString(),
      dueDate:         t.dueDate,
      durationMinutes: t.durationMinutes,
      checklist:       t.checklist,
      labels:          (t as any).labels,
      description:     t.description,
      children:        [],
    });
  });

  // Segundo paso: construir árbol
  tasks.forEach(t => {
    const node = map.get(t._id.toString())!;
    const parentId = (t as any).parentTaskId?.toString();
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * GET /api/projects/:id/visit?visitor=metrics
 * Aplica un Visitor al árbol de tareas del proyecto.
 */
export const visitProject = async (req: Request, res: Response) => {
  try {
    const projectId  = req.params.id as string;
    const visitorType = (req.query.visitor as string) ?? 'metrics';

    const tree    = await buildTaskTree(projectId);
    const visitor = getVisitor(visitorType);

    // El Visitor recorre el árbol completo mediante accept()
    tree.forEach(root => new VisitableTaskNode(root).accept(visitor));

    res.json({
      visitor:  visitorType,
      projectId,
      total:    tree.length,
      result:   visitor.getResult(),
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/projects/:id/visit/types
 * Lista los Visitors disponibles.
 */
export const getVisitorTypes = async (_req: Request, res: Response) => {
  res.json({ visitors: listVisitors() });
};