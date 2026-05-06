import { Task } from '../models/Task';
import { Board } from '../models/Board';
import { getTaskCreator } from '../patterns/TaskFactory';
import { TaskBuilder } from '../patterns/TaskBuilder';
import { cloneTask } from '../patterns/Prototype';
import { ITask, TaskType } from '../types';

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
  if (data.title) builder.setTitle(data.title);
  if (data.priority) builder.setPriority(data.priority);
  if (data.dueDate) builder.setDueDate(data.dueDate);
  if (data.assignedTo) builder.setAssignee(data.assignedTo);
  if (data.tags) data.tags.forEach((tag) => builder.addTag(tag));
  if (data.checklist) builder.setChecklist(data.checklist.map((c: any) => c.text || c));

  const buildData = builder.build();
  return Task.create({
    ...buildData,
    boardId,
    projectId,
    columnId,
    type: resolvedType,
  });
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
  // the prototype handles adding '(copia)' to the name
  const newTask = await cloneTask(taskId, boardId, columnId);
  if (!newTask) throw new Error('Failed to clone task');
  return newTask;
};

export const deleteTask = async (taskId: string) => {
  const task = await Task.findByIdAndDelete(taskId);
  if (!task) throw new Error('Task not found');
  return { message: 'Task deleted' };
};
