import { ITask, TaskType } from '../types';
import { TaskFlyweightFactory } from "../structuralpattern/TaskFlyweightFactory";

export abstract class TaskCreator {
  abstract createTask(data: Partial<ITask>): Partial<ITask>;
}

// ── Patrones base ──────────────────────────────────────────────────────────────

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

// ── Creators para tipos de tarea estilo Jira ───────────────────────────────────

/**
 * BUG: prioridad alta por defecto, etiqueta 'bug' agregada automáticamente
 * y checklist base para reproducción / fix / verificación.
 */
class BugTaskCreator extends TaskCreator {
  createTask(data: Partial<ITask>): Partial<ITask> {

    const flyweight =
      TaskFlyweightFactory.getFlyweight("BUG");

    return {
      ...data,

      type: "BUG" as TaskType,

      priority:
        data.priority ??
        flyweight?.defaultPriority ??
        "high",

      tags: [
        ...(data.tags || []),
        ...((flyweight?.defaultTags as string[]) || []),
      ],

      checklist:
        data.checklist && data.checklist.length > 0
          ? data.checklist
          : [...((flyweight?.defaultChecklist as any[]) || [])],
    };
  }
}

/**
 * FEATURE: prioridad media por defecto, etiqueta 'feature',
 * y duración estimada inicial de 120 minutos.
 */
class FeatureTaskCreator extends TaskCreator {
  createTask(data: Partial<ITask>): Partial<ITask> {

    const flyweight =
      TaskFlyweightFactory.getFlyweight("FEATURE");

    return {
      ...data,

      type: "FEATURE" as TaskType,

      priority:
        data.priority ??
        flyweight?.defaultPriority ??
        "medium",

      tags: [
        ...(data.tags || []),
        ...((flyweight?.defaultTags as string[]) || []),
      ],

      durationMinutes:
        data.durationMinutes ??
        flyweight?.defaultDuration ??
        120,
    };
  }
}

/**
 * STORY: prioridad media por defecto, etiqueta 'story',
 * checklist base con criterios de aceptación vacíos listos para completar.
 */
class StoryTaskCreator extends TaskCreator {
  createTask(data: Partial<ITask>): Partial<ITask> {

    const flyweight =
      TaskFlyweightFactory.getFlyweight("STORY");

    return {
      ...data,

      type: "STORY" as TaskType,

      priority:
        data.priority ??
        flyweight?.defaultPriority ??
        "medium",

      tags: [
        ...(data.tags || []),
        ...((flyweight?.defaultTags as string[]) || []),
      ],

      checklist:
        data.checklist && data.checklist.length > 0
          ? data.checklist
          : [...((flyweight?.defaultChecklist as any[]) || [])],
    };
  }
}

/**
 * EPIC: prioridad low por defecto (es un contenedor de largo plazo),
 * etiqueta 'epic' y duración estimada de 480 minutos (1 sprint típico).
 */
class EpicTaskCreator extends TaskCreator {
  createTask(data: Partial<ITask>): Partial<ITask> {

    const flyweight =
      TaskFlyweightFactory.getFlyweight("EPIC");

    return {
      ...data,

      type: "EPIC" as TaskType,

      priority:
        data.priority ??
        flyweight?.defaultPriority ??
        "low",

      tags: [
        ...(data.tags || []),
        ...((flyweight?.defaultTags as string[]) || []),
      ],

      durationMinutes:
        data.durationMinutes ??
        flyweight?.defaultDuration ??
        480,
    };
  }
}

// ── Registro de Creators ───────────────────────────────────────────────────────

export function getTaskCreator(type: TaskType): TaskCreator {
  const map: Record<TaskType, new () => TaskCreator> = {
    simple:    SimpleTaskCreator,
    checklist: ChecklistTaskCreator,
    timed:     TimedTaskCreator,
    BUG:       BugTaskCreator,
    FEATURE:   FeatureTaskCreator,
    STORY:     StoryTaskCreator,
    EPIC:      EpicTaskCreator,
  };
  const CreatorClass = map[type];
  if (!CreatorClass) {
    throw new Error(`Invalid TaskType: ${type}`);
  }
  return new CreatorClass();
}