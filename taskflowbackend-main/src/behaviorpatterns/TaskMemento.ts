/**
 * PATRÓN MEMENTO — Snapshot del estado completo de una tarea
 *
 * Problema: El patrón Command (RF-06.2) permite deshacer acciones individuales,
 * pero no captura el estado COMPLETO de una tarea antes de una sesión de edición.
 * Si el usuario cancela una edición larga (múltiples campos), necesita restaurar
 * todo de una sola vez, no acción por acción.
 *
 * Solución: Antes de editar, el Originator crea un Memento con una copia inmutable
 * del estado completo. El Caretaker almacena el historial de snapshots. Si el usuario
 * cancela, el Originator restaura el estado desde el Memento — sin conocer los
 * detalles internos de la tarea.
 *
 * Diferencia con Command:
 *   Command  → historial de acciones individuales (mover, asignar, cambiar prioridad)
 *   Memento  → snapshot completo del estado antes de una sesión de edición
 *
 * Participantes:
 *   - TaskMemento (Memento)            → snapshot inmutable, opaco para el Caretaker
 *   - TaskMementoOriginator (Originator) → crea y restaura Mementos desde el modelo
 *   - TaskMementoCaretaker (Caretaker)   → almacena historial de Mementos por tarea
 */

import { Task } from '../models/Task';
import { ITask } from '../types';

// ── Memento ────────────────────────────────────────────────────────────────────

export interface TaskSnapshot {
  id:          string;
  taskId:      string;
  label:       string;          // descripción legible del momento del snapshot
  createdAt:   Date;
  createdBy:   string;          // userId de quien tomó el snapshot
  state: {
    title:           string;
    description?:    string;
    columnId:        string;
    priority:        string;
    type:            string;
    assignedTo?:     string;
    dueDate?:        string;
    checklist?:      { text: string; done: boolean }[];
    labels?:         { name: string; color: string }[];
    durationMinutes?: number;
    tags?:           string[];
  };
}

export class TaskMemento {
  private readonly snapshot: TaskSnapshot;

  constructor(task: ITask, label: string, createdBy: string) {
    this.snapshot = {
      id:        `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      taskId:    task._id?.toString() ?? '',
      label,
      createdAt: new Date(),
      createdBy,
      state: {
        title:           task.title,
        description:     task.description,
        columnId:        task.columnId,
        priority:        task.priority ?? 'medium',
        type:            task.type ?? 'simple',
        assignedTo:      task.assignedTo?.toString(),
        dueDate:         task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
        checklist:       task.checklist?.map(c => ({ text: c.text, done: c.done })),
        labels:          (task as any).labels?.map((l: any) => ({ name: l.name, color: l.color })),
        durationMinutes: task.durationMinutes,
        tags:            task.tags,
      },
    };
  }

  /** El Caretaker solo puede obtener el snapshot completo — no modificarlo */
  getSnapshot(): Readonly<TaskSnapshot> {
    return Object.freeze({ ...this.snapshot });
  }
}

// ── Originator ─────────────────────────────────────────────────────────────────

export class TaskMementoOriginator {
  /**
   * Crea un Memento con el estado actual de la tarea.
   * Llamar ANTES de cualquier edición para poder restaurar.
   */
  static async createMemento(taskId: string, label: string, userId: string): Promise<TaskMemento> {
    const task = await Task.findById(taskId).lean();
    if (!task) throw new Error(`Tarea ${taskId} no encontrada`);
    return new TaskMemento(task as unknown as ITask, label, userId);
  }

  /**
   * Restaura la tarea al estado guardado en el Memento.
   * Solo restaura campos editables — no toca boardId, projectId, _id.
   */
  static async restoreFromMemento(memento: TaskMemento): Promise<ITask> {
    const snap = memento.getSnapshot();
    const restored = await Task.findByIdAndUpdate(
      snap.taskId,
      {
        $set: {
          title:           snap.state.title,
          description:     snap.state.description,
          columnId:        snap.state.columnId,
          priority:        snap.state.priority,
          type:            snap.state.type,
          assignedTo:      snap.state.assignedTo ?? null,
          dueDate:         snap.state.dueDate ? new Date(snap.state.dueDate) : null,
          checklist:       snap.state.checklist ?? [],
          labels:          snap.state.labels ?? [],
          durationMinutes: snap.state.durationMinutes,
          tags:            snap.state.tags ?? [],
        },
      },
      { returnDocument: 'after' }
    ).lean();

    if (!restored) throw new Error(`No se pudo restaurar la tarea ${snap.taskId}`);
    console.log(`[Memento] Restaurado: "${snap.state.title}" desde snapshot "${snap.label}" (${snap.id})`);
    return restored as unknown as ITask;
  }
}

// ── Caretaker ──────────────────────────────────────────────────────────────────

export class TaskMementoCaretaker {
  /** Mapa en memoria: taskId → historial de snapshots (máx 20 por tarea) */
  private static store: Map<string, TaskMemento[]> = new Map();
  private static readonly MAX_SNAPSHOTS = 20;

  /** Guarda un Memento en el historial de la tarea */
  static save(taskId: string, memento: TaskMemento): TaskSnapshot {
    const history = this.store.get(taskId) ?? [];
    history.push(memento);

    // Limita el historial a MAX_SNAPSHOTS
    if (history.length > this.MAX_SNAPSHOTS) history.shift();

    this.store.set(taskId, history);
    const snap = memento.getSnapshot();
    console.log(`[Memento] Snapshot guardado: "${snap.label}" para tarea ${taskId} (total: ${history.length})`);
    return snap as TaskSnapshot;
  }

  /** Retorna el historial de snapshots de una tarea (más reciente primero) */
  static getHistory(taskId: string): TaskSnapshot[] {
    const history = this.store.get(taskId) ?? [];
    return [...history].reverse().map(m => m.getSnapshot() as TaskSnapshot);
  }

  /** Obtiene un Memento específico por su id de snapshot */
  static getMemento(taskId: string, snapshotId: string): TaskMemento | null {
    const history = this.store.get(taskId) ?? [];
    return history.find(m => m.getSnapshot().id === snapshotId) ?? null;
  }

  /** Elimina todos los snapshots de una tarea */
  static clearHistory(taskId: string): void {
    this.store.delete(taskId);
  }

  /** Retorna estadísticas del Caretaker */
  static getStats() {
    const stats: { taskId: string; snapshots: number; oldest?: string; newest?: string }[] = [];
    this.store.forEach((history, taskId) => {
      if (history.length > 0) {
        stats.push({
          taskId,
          snapshots: history.length,
          oldest:  history[0].getSnapshot().createdAt.toISOString(),
          newest:  history[history.length - 1].getSnapshot().createdAt.toISOString(),
        });
      }
    });
    return stats;
  }
}