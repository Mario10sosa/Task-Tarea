import { Request, Response } from 'express';
import * as taskService from '../services/task.service';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { type, priority, assignedTo } = req.query;
    const filters: any = {};
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assignedTo = assignedTo;

    const tasks = await taskService.getTasks((req.params.id as string), filters);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    // ProjectID typically comes from board lookup or body. Assuming it's in body for simplicity or passed via route
    const { projectId, columnId, ...taskData } = req.body;
    const task = await taskService.createTaskWithFactory((req.params.id as string), projectId, columnId, taskData);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const buildTask = async (req: Request, res: Response) => {
  try {
    const { projectId, columnId, ...taskData } = req.body;
    const task = await taskService.createTaskWithBuilder((req.params.id as string), projectId, columnId, taskData);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTask = async (req: Request, res: Response) => {
  try {
    const task = await taskService.getTaskDetails((req.params.id as string));
    res.json(task);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await taskService.updateTask((req.params.id as string), req.body);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const moveTask = async (req: Request, res: Response) => {
  try {
    const { columnId } = req.body;
    const task = await taskService.moveTask((req.params.id as string), columnId);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const cloneTask = async (req: Request, res: Response) => {
  try {
    const { boardId, columnId } = req.body;
    // Default to the task's current board if not provided
    const taskToClone = await taskService.getTaskDetails((req.params.id as string));
    const targetBoard = boardId || taskToClone.boardId.toString();
    const targetColumnId = columnId || taskToClone.columnId;

    const task = await taskService.cloneTaskService((req.params.id as string), targetBoard, targetColumnId);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const result = await taskService.deleteTask((req.params.id as string));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
