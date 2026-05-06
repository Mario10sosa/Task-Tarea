import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { Board } from '../models/Board';
import { ITask, IProject } from '../types';

// ── Interfaz Prototype ─────────────────────────────────────────────────────────

/**
 * Contrato GoF: cada prototipo sabe clonarse a sí mismo.
 */
interface Prototype<T> {
  clone(): Promise<T>;
}

// ── TaskPrototype ──────────────────────────────────────────────────────────────

/**
 * Envuelve un documento Task existente y expone clone() para
 * duplicarlo en otro board/columna sin acoplarse al caller.
 */
export class TaskPrototype implements Prototype<ITask> {
  constructor(
    private readonly taskId: string,
    private readonly targetBoardId: string,
    private readonly targetColumnId: string,
  ) {}

  async clone(): Promise<ITask> {
    const original = await Task.findById(this.taskId).lean();
    if (!original) throw new Error(`Task ${this.taskId} not found`);

    const { _id, createdAt, updatedAt, ...rest } = original as any;

    const cloned = await Task.create({
      ...rest,
      boardId: this.targetBoardId,
      columnId: this.targetColumnId,
      title: `${rest.title} (copia)`,
    });

    return cloned;
  }
}

// ── ProjectPrototype ───────────────────────────────────────────────────────────

/**
 * Envuelve un Project y realiza una clonación profunda:
 * duplica el proyecto, todos sus boards y todas sus tareas.
 * El nuevo proyecto queda asignado al ownerId indicado.
 */
export class ProjectPrototype implements Prototype<IProject> {
  constructor(
    private readonly projectId: string,
    private readonly newOwnerId: string,
  ) {}

  async clone(): Promise<IProject> {
    const original = await Project.findById(this.projectId).lean();
    if (!original) throw new Error(`Project ${this.projectId} not found`);

    const { _id: originalProjectId, createdAt, updatedAt, ...projectRest } = original as any;

    // Clonar proyecto — sólo el nuevo owner como miembro inicial
    const newProject = await Project.create({
      ...projectRest,
      name: `${projectRest.name} (copia)`,
      ownerId: this.newOwnerId,
      members: [{ userId: this.newOwnerId, role: 'admin' }],
    });

    // Clonar boards y sus tareas en cascada
    const boards = await Board.find({ projectId: originalProjectId }).lean();
    for (const board of boards) {
      const { _id: boardId, createdAt: bca, updatedAt: bua, ...boardRest } = board as any;

      const newBoard = await Board.create({
        ...boardRest,
        projectId: newProject._id,
      });

      const tasks = await Task.find({ boardId }).lean();
      for (const task of tasks) {
        const { _id: taskId, createdAt: tca, updatedAt: tua, ...taskRest } = task as any;
        await Task.create({
          ...taskRest,
          projectId: newProject._id,
          boardId: newBoard._id,
        });
      }
    }

    return newProject;
  }
}

// ── Helpers de conveniencia (usados desde task.service / project.service) ──────

export async function cloneTask(
  taskId: string,
  targetBoardId: string,
  targetColumnId: string,
): Promise<ITask> {
  return new TaskPrototype(taskId, targetBoardId, targetColumnId).clone();
}

export async function cloneProject(
  projectId: string,
  ownerId: string,
): Promise<IProject> {
  return new ProjectPrototype(projectId, ownerId).clone();
}