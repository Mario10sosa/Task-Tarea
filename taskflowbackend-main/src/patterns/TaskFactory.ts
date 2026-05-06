import { ITask, TaskType } from '../types';

export abstract class TaskCreator {
  abstract createTask(data: Partial<ITask>): Partial<ITask>;
}

class SimpleTaskCreator extends TaskCreator {
  createTask(data: Partial<ITask>) {
    return { ...data, type: 'simple' as TaskType };
  }
}

class ChecklistTaskCreator extends TaskCreator {
  createTask(data: Partial<ITask>) {
    return { ...data, type: 'checklist' as TaskType, checklist: data.checklist || [] };
  }
}

class TimedTaskCreator extends TaskCreator {
  createTask(data: Partial<ITask>) {
    return { ...data, type: 'timed' as TaskType, durationMinutes: data.durationMinutes ?? 30 };
  }
}

export function getTaskCreator(type: TaskType): TaskCreator {
  const map: Record<TaskType, new () => TaskCreator> = {
    simple: SimpleTaskCreator,
    checklist: ChecklistTaskCreator,
    timed: TimedTaskCreator,
    BUG: SimpleTaskCreator,
    FEATURE: SimpleTaskCreator,
    STORY: SimpleTaskCreator,
    EPIC: SimpleTaskCreator,
  };
  const CreatorClass = map[type];
  if (!CreatorClass) {
    throw new Error(`Invalid TaskType: ${type}`);
  }
  return new CreatorClass();
}
