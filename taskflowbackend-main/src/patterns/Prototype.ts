import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { Board } from '../models/Board';
import { ITask, IProject } from '../types';

export async function cloneTask(taskId: string, targetBoardId: string, targetColumnId: string): Promise<ITask | null> {
  const original = await Task.findById(taskId).lean();
  if (!original) return null;
  const { _id, createdAt, updatedAt, ...rest } = original as any;
  return Task.create({
    ...rest,
    boardId: targetBoardId,
    columnId: targetColumnId,
    title: `${rest.title} (copia)`,
  });
}

export async function cloneProject(projectId: string, ownerId: string): Promise<IProject | null> {
  const original = await Project.findById(projectId).lean();
  if (!original) return null;
  const { _id, createdAt, updatedAt, ...rest } = original as any;
  
  const newProject = await Project.create({
    ...rest,
    name: `${rest.name} (copia)`,
    ownerId,
    members: [{ userId: ownerId, role: 'admin' }], // Reset members to only the new owner
  });

  // Clone associated boards and tasks
  const boards = await Board.find({ projectId: _id }).lean();
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
