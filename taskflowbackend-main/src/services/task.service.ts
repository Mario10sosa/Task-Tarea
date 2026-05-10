import { Task } from '../models/Task';
import { getTaskCreator } from '../patterns/TaskFactory';
import { TaskBuilder } from '../patterns/TaskBuilder';
import { cloneTask } from '../patterns/Prototype';
import { ITask, TaskType } from '../types';
import { buildTaskTree, LeafTask } from '../structuralpattern/TaskComposite';
import { decorateTask } from '../structuralpattern/TaskDecorator';

// ── Creacionales (existentes) ─────────────────────────────────────────────────

export const getTasks = async (boardId: string, filters: any) => {
  return Task.find({ boardId, ...filters });
};

export const createTaskWithFactory = async (boardId: string, projectId: string, columnId: string, data: Partial<ITask>) => {
  const resolvedType = (data.type || 'simple') as TaskType;
  const creator = getTaskCreator(resolvedType);
  const taskData = creator.createTask({ ...data, type: resolvedType });
  return Task.create({ ...taskData, boardId, projectId, columnId });
};

export const createTaskWithBuilder = async (
  boardId: string,
  projectId: string,
  columnId: string,
  data: Partial<ITask>
) => {
  const resolvedType = (data.type || 'simple') as TaskType;
  const builder = new TaskBuilder();
  if (data.title)     builder.setTitle(data.title);
  if (data.priority)  builder.setPriority(data.priority);
  if (data.dueDate)   builder.setDueDate(data.dueDate);
  if (data.assignedTo) builder.setAssignee(data.assignedTo);
  if (data.tags)      data.tags.forEach((tag) => builder.addTag(tag));
  if (data.checklist) builder.setChecklist(data.checklist.map((c: any) => c.text || c));

  const buildData = builder.build();
  return Task.create({ ...buildData, boardId, projectId, columnId, type: resolvedType });
};

export const getTaskDetails = async (taskId: string) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error('Task not found');
  return task;
};

export const updateTask = async (taskId: string, updates: Partial<ITask>) => {
  const task = await Task.findByIdAndUpdate(taskId, updates, { new: true });
  if (!task) throw new Error('Task not found');
  return task;
};

export const moveTask = async (taskId: string, columnId: string) => {
  const task = await Task.findByIdAndUpdate(taskId, { columnId }, { new: true });
  if (!task) throw new Error('Task not found');
  return task;
};

export const cloneTaskService = async (taskId: string, boardId: string, columnId: string) => {
  const newTask = await cloneTask(taskId, boardId, columnId);
  if (!newTask) throw new Error('Failed to clone task');
  return newTask;
};

export const deleteTask = async (taskId: string) => {
  const task = await Task.findByIdAndDelete(taskId);
  if (!task) throw new Error('Task not found');
  return { message: 'Task deleted' };
};

// ── Composite: Subtareas y Progreso ───────────────────────────────────────────

export const createSubtask = async (
  parentTaskId: string,
  data: Partial<ITask>
) => {

  const parent = await Task.findById(parentTaskId);

  if (!parent) {
    throw new Error('Parent task not found');
  }

  return Task.create({
    ...data,
    boardId: parent.boardId,
    projectId: parent.projectId,
    columnId: parent.columnId,
    type: data.type || parent.type,
    parentTaskId,
  });
};

export const getTaskProgress = async (taskId: string) => {
  const root = await Task.findById(taskId);
  if (!root) throw new Error('Task not found');

  const allTasks = await getAllDescendants(taskId, [root]);
  const tree     = buildTaskTree(allTasks, null);
  const rootNode = tree.find((n) => n.getId() === taskId);

  if (!rootNode) {
    // Sin hijos → comportamiento Leaf
    const leaf = new LeafTask(root as any);
    return leaf.toJSON();
  }

  return rootNode.toJSON();
};

async function getAllDescendants(taskId: string, acc: any[]): Promise<any[]> {
  const children = await Task.find({ parentTaskId: taskId });
  if (children.length === 0) return acc;
  acc.push(...children);
  for (const child of children) {
    await getAllDescendants(child._id.toString(), acc);
  }
  return acc;
}

export const getSubtasks = async (parentTaskId: string) => {
  return Task.find({ parentTaskId });
};

// ── Decorator: Etiquetas y Adjuntos ───────────────────────────────────────────

export const getDecoratedTask = async (taskId: string) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error('Task not found');
  return decorateTask(task);
};

export const addLabel = async (taskId: string, label: { name: string; color: string }) => {
  const task = await Task.findByIdAndUpdate(taskId, { $push: { labels: label } }, { new: true });
  if (!task) throw new Error('Task not found');
  return decorateTask(task);
};

export const removeLabel = async (taskId: string, labelName: string) => {
  const task = await Task.findByIdAndUpdate(taskId, { $pull: { labels: { name: labelName } } }, { new: true });
  if (!task) throw new Error('Task not found');
  return decorateTask(task);
};

export const addAttachment = async (
  taskId: string,
  attachment: { filename: string; originalName: string; mimetype: string; size: number; url: string }
) => {
  const task = await Task.findByIdAndUpdate(
    taskId,
    { $push: { attachments: { ...attachment, uploadedAt: new Date() } } },
    { new: true }
  );
  if (!task) throw new Error('Task not found');
  return decorateTask(task);
};

export const removeAttachment = async (taskId: string, filename: string) => {
  const task = await Task.findByIdAndUpdate(taskId, { $pull: { attachments: { filename } } }, { new: true });
  if (!task) throw new Error('Task not found');
  return decorateTask(task);
};