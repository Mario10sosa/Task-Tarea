/**
 * PATRÓN COMMAND — Acciones sobre Tareas como Objetos (Undo/Redo)
 *
 * Problema: Las acciones sobre tareas (mover, actualizar, asignar, cambiar
 * prioridad) se ejecutan directamente sin historial ni capacidad de deshacer.
 * El requerimiento RF-06.2 exige poder deshacer el último cambio en una tarea.
 *
 * Solución: Encapsular cada acción como un objeto Command que conoce cómo
 * ejecutarse y cómo deshacerse. Un Invoker mantiene el historial de comandos
 * ejecutados y permite deshacer/rehacer en cualquier momento.
 *
 * Estructura:
 *   Command interface  → ICommand
 *   Concrete Commands  → MoveTaskCommand, UpdateTaskCommand,
 *                        AssignTaskCommand, ChangePriorityCommand
 *   Invoker            → TaskCommandInvoker (historial + undo/redo)
 *   Receiver           → Task (modelo Mongoose)
 */

import { Task } from '../models/Task';

// ── Command Interface ──────────────────────────────────────────────────────────

export interface ICommand {
  execute(): Promise<CommandResult>;
  undo():    Promise<CommandResult>;
  getName(): string;
  toJSON():  CommandRecord;
}

export interface CommandResult {
  success:   boolean;
  taskId:    string;
  command:   string;
  before?:   any;
  after?:    any;
  message:   string;
}

export interface CommandRecord {
  id:        string;
  name:      string;
  taskId:    string;
  executedAt: string;
  executedBy: string;
  payload:   any;
  undone:    boolean;
}

// ── Concrete Command 1: Mover tarea entre columnas ────────────────────────────

export class MoveTaskCommand implements ICommand {
  private previousColumnId: string = '';
  private readonly id: string;

  constructor(
    private readonly taskId:        string,
    private readonly targetColumnId: string,
    private readonly executedBy:    string
  ) {
    this.id = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  getName() { return 'MoveTask'; }

  async execute(): Promise<CommandResult> {
    const task = await Task.findById(this.taskId);
    if (!task) throw new Error('Task not found');

    this.previousColumnId = task.columnId; // guardar estado anterior para undo
    task.columnId = this.targetColumnId;
    await task.save();

    return {
      success: true,
      taskId:  this.taskId,
      command: this.getName(),
      before:  { columnId: this.previousColumnId },
      after:   { columnId: this.targetColumnId },
      message: `Tarea movida de "${this.previousColumnId}" a "${this.targetColumnId}"`,
    };
  }

  async undo(): Promise<CommandResult> {
    const task = await Task.findById(this.taskId);
    if (!task) throw new Error('Task not found');

    const current = task.columnId;
    task.columnId = this.previousColumnId;
    await task.save();

    return {
      success: true,
      taskId:  this.taskId,
      command: `Undo ${this.getName()}`,
      before:  { columnId: current },
      after:   { columnId: this.previousColumnId },
      message: `Movimiento deshecho — tarea volvió a "${this.previousColumnId}"`,
    };
  }

  toJSON(): CommandRecord {
    return {
      id:          this.id,
      name:        this.getName(),
      taskId:      this.taskId,
      executedAt:  new Date().toISOString(),
      executedBy:  this.executedBy,
      payload:     { targetColumnId: this.targetColumnId, previousColumnId: this.previousColumnId },
      undone:      false,
    };
  }
}

// ── Concrete Command 2: Actualizar título y descripción ───────────────────────

export class UpdateTaskCommand implements ICommand {
  private previousState: { title?: string; description?: string } = {};
  private readonly id: string;

  constructor(
    private readonly taskId:      string,
    private readonly updates:     { title?: string; description?: string },
    private readonly executedBy:  string
  ) {
    this.id = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  getName() { return 'UpdateTask'; }

  async execute(): Promise<CommandResult> {
    const task = await Task.findById(this.taskId);
    if (!task) throw new Error('Task not found');

    // Guardar estado anterior
    this.previousState = {
      title:       task.title,
      description: task.description,
    };

    if (this.updates.title)       task.title       = this.updates.title;
    if (this.updates.description !== undefined) task.description = this.updates.description;
    await task.save();

    return {
      success: true,
      taskId:  this.taskId,
      command: this.getName(),
      before:  this.previousState,
      after:   this.updates,
      message: `Tarea actualizada correctamente`,
    };
  }

  async undo(): Promise<CommandResult> {
    const task = await Task.findById(this.taskId);
    if (!task) throw new Error('Task not found');

    const current = { title: task.title, description: task.description };
    if (this.previousState.title !== undefined)       task.title       = this.previousState.title;
    if (this.previousState.description !== undefined) task.description = this.previousState.description;
    await task.save();

    return {
      success: true,
      taskId:  this.taskId,
      command: `Undo ${this.getName()}`,
      before:  current,
      after:   this.previousState,
      message: `Actualización deshecha`,
    };
  }

  toJSON(): CommandRecord {
    return {
      id:          this.id,
      name:        this.getName(),
      taskId:      this.taskId,
      executedAt:  new Date().toISOString(),
      executedBy:  this.executedBy,
      payload:     { updates: this.updates, previousState: this.previousState },
      undone:      false,
    };
  }
}

// ── Concrete Command 3: Asignar responsable ───────────────────────────────────

export class AssignTaskCommand implements ICommand {
  private previousAssignee: any = null;
  private readonly id: string;

  constructor(
    private readonly taskId:      string,
    private readonly assigneeId:  string | null,
    private readonly executedBy:  string
  ) {
    this.id = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  getName() { return 'AssignTask'; }

  async execute(): Promise<CommandResult> {
    const task = await Task.findById(this.taskId);
    if (!task) throw new Error('Task not found');

    this.previousAssignee = task.assignedTo;
    (task as any).assignedTo = this.assigneeId;
    await task.save();

    return {
      success: true,
      taskId:  this.taskId,
      command: this.getName(),
      before:  { assignedTo: this.previousAssignee },
      after:   { assignedTo: this.assigneeId },
      message: this.assigneeId
        ? `Tarea asignada a usuario ${this.assigneeId}`
        : `Tarea desasignada`,
    };
  }

  async undo(): Promise<CommandResult> {
    const task = await Task.findById(this.taskId);
    if (!task) throw new Error('Task not found');

    const current = (task as any).assignedTo;
    (task as any).assignedTo = this.previousAssignee;
    await task.save();

    return {
      success: true,
      taskId:  this.taskId,
      command: `Undo ${this.getName()}`,
      before:  { assignedTo: current },
      after:   { assignedTo: this.previousAssignee },
      message: `Asignación deshecha`,
    };
  }

  toJSON(): CommandRecord {
    return {
      id:          this.id,
      name:        this.getName(),
      taskId:      this.taskId,
      executedAt:  new Date().toISOString(),
      executedBy:  this.executedBy,
      payload:     { assigneeId: this.assigneeId, previousAssignee: this.previousAssignee },
      undone:      false,
    };
  }
}

// ── Concrete Command 4: Cambiar prioridad ─────────────────────────────────────

export class ChangePriorityCommand implements ICommand {
  private previousPriority: string = '';
  private readonly id: string;

  constructor(
    private readonly taskId:      string,
    private readonly priority:    'low' | 'medium' | 'high',
    private readonly executedBy:  string
  ) {
    this.id = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  getName() { return 'ChangePriority'; }

  async execute(): Promise<CommandResult> {
    const task = await Task.findById(this.taskId);
    if (!task) throw new Error('Task not found');

    this.previousPriority = task.priority;
    task.priority = this.priority;
    await task.save();

    return {
      success: true,
      taskId:  this.taskId,
      command: this.getName(),
      before:  { priority: this.previousPriority },
      after:   { priority: this.priority },
      message: `Prioridad cambiada de "${this.previousPriority}" a "${this.priority}"`,
    };
  }

  async undo(): Promise<CommandResult> {
    const task = await Task.findById(this.taskId);
    if (!task) throw new Error('Task not found');

    const current = task.priority;
    task.priority = this.previousPriority as any;
    await task.save();

    return {
      success: true,
      taskId:  this.taskId,
      command: `Undo ${this.getName()}`,
      before:  { priority: current },
      after:   { priority: this.previousPriority },
      message: `Cambio de prioridad deshecho — volvió a "${this.previousPriority}"`,
    };
  }

  toJSON(): CommandRecord {
    return {
      id:          this.id,
      name:        this.getName(),
      taskId:      this.taskId,
      executedAt:  new Date().toISOString(),
      executedBy:  this.executedBy,
      payload:     { priority: this.priority, previousPriority: this.previousPriority },
      undone:      false,
    };
  }
}

// ── Invoker ────────────────────────────────────────────────────────────────────

/**
 * Mantiene el historial de comandos ejecutados por tarea.
 * Permite ejecutar, deshacer y rehacer comandos.
 * Implementa RF-06.2: "deshacer el último cambio realizado en una tarea".
 */
export class TaskCommandInvoker {
  // Historial por taskId: pila de comandos ejecutados
  private static history: Map<string, ICommand[]> = new Map();
  // Pila de comandos deshechos (para redo)
  private static redoStack: Map<string, ICommand[]> = new Map();

  static async execute(command: ICommand): Promise<CommandResult> {
    const result = await command.execute();

    const taskId = result.taskId;
    if (!this.history.has(taskId)) this.history.set(taskId, []);
    this.history.get(taskId)!.push(command);

    // Al ejecutar un nuevo comando se limpia el redo stack
    this.redoStack.set(taskId, []);

    console.log(`[Command] ✅ ${command.getName()} ejecutado en tarea ${taskId}`);
    return result;
  }

  static async undo(taskId: string): Promise<CommandResult> {
    const stack = this.history.get(taskId);
    if (!stack || stack.length === 0) {
      throw new Error('No hay comandos para deshacer en esta tarea');
    }

    const command = stack.pop()!;
    const result  = await command.undo();

    if (!this.redoStack.has(taskId)) this.redoStack.set(taskId, []);
    this.redoStack.get(taskId)!.push(command);

    console.log(`[Command] ↩️  Undo ${command.getName()} en tarea ${taskId}`);
    return result;
  }

  static async redo(taskId: string): Promise<CommandResult> {
    const stack = this.redoStack.get(taskId);
    if (!stack || stack.length === 0) {
      throw new Error('No hay comandos para rehacer en esta tarea');
    }

    const command = stack.pop()!;
    const result  = await command.execute();

    this.history.get(taskId)!.push(command);

    console.log(`[Command] ↪️  Redo ${command.getName()} en tarea ${taskId}`);
    return result;
  }

  static getHistory(taskId: string): CommandRecord[] {
    const stack = this.history.get(taskId) || [];
    return stack.map(cmd => cmd.toJSON());
  }

  static canUndo(taskId: string): boolean {
    return (this.history.get(taskId)?.length || 0) > 0;
  }

  static canRedo(taskId: string): boolean {
    return (this.redoStack.get(taskId)?.length || 0) > 0;
  }

  static clearHistory(taskId: string): void {
    this.history.delete(taskId);
    this.redoStack.delete(taskId);
  }
}

// ── Factory de comandos ────────────────────────────────────────────────────────

export function createCommand(
  type:       string,
  taskId:     string,
  payload:    any,
  executedBy: string
): ICommand {
  switch (type) {
    case 'move':
      return new MoveTaskCommand(taskId, payload.columnId, executedBy);
    case 'update':
      return new UpdateTaskCommand(taskId, payload, executedBy);
    case 'assign':
      return new AssignTaskCommand(taskId, payload.assigneeId, executedBy);
    case 'priority':
      return new ChangePriorityCommand(taskId, payload.priority, executedBy);
    default:
      throw new Error(`Tipo de comando desconocido: ${type}. Use: move | update | assign | priority`);
  }
}