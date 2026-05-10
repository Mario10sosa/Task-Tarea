/**
 * PATRÓN PROXY — Validaciones en Tareas y Proyectos
 *
 * Problema: La lógica de validación de permisos, integridad de datos y
 * auditoría está dispersa en controladores y middlewares. Añadir nuevas
 * validaciones requiere modificar múltiples archivos.
 *
 * Solución: Interponer un Proxy entre el controlador y el servicio real.
 * El Proxy realiza validaciones previas (pre-validation), registra auditoría
 * y luego delega al servicio real. El controlador no sabe si habla con el
 * servicio real o con el Proxy.
 *
 * Estructura:
 *   Subject      → ITaskOperations (interfaz común)
 *   Real Subject → TaskRealService  (delega a task.service)
 *   Proxy        → TaskServiceProxy (valida + audita + delega)
 */

import { Task }    from '../models/Task';
import { Board }   from '../models/Board';
import { Project } from '../models/Project';
import * as taskService from '../services/task.service';
import { ITask }   from '../types';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface TaskOperationContext {
  requesterId: string;   // userId del que hace la petición
  projectId?:  string;
  boardId?:    string;
  taskId?:     string;
  columnId?:   string;
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

// ── Subject Interface ──────────────────────────────────────────────────────────

export interface ITaskOperations {
  createTask(ctx: TaskOperationContext, data: Partial<ITask>): Promise<any>;
  updateTask(ctx: TaskOperationContext, updates: Partial<ITask>): Promise<any>;
  deleteTask(ctx: TaskOperationContext): Promise<any>;
  moveTask(ctx: TaskOperationContext, targetColumnId: string): Promise<any>;
}

// ── Real Subject ───────────────────────────────────────────────────────────────

export class TaskRealService implements ITaskOperations {
  async createTask(ctx: TaskOperationContext, data: Partial<ITask>): Promise<any> {
    return taskService.createTaskWithFactory(
      ctx.boardId!, ctx.projectId!, ctx.columnId!, data
    );
  }

  async updateTask(ctx: TaskOperationContext, updates: Partial<ITask>): Promise<any> {
    return taskService.updateTask(ctx.taskId!, updates);
  }

  async deleteTask(ctx: TaskOperationContext): Promise<any> {
    return taskService.deleteTask(ctx.taskId!);
  }

  async moveTask(ctx: TaskOperationContext, targetColumnId: string): Promise<any> {
    return taskService.moveTask(ctx.taskId!, targetColumnId);
  }
}

// ── Proxy ──────────────────────────────────────────────────────────────────────

export class TaskServiceProxy implements ITaskOperations {
  private realService: TaskRealService;
  private auditLog: Array<{ action: string; userId: string; taskId?: string; timestamp: Date; result: string }> = [];

  constructor() {
    this.realService = new TaskRealService();
  }

  // ── Validaciones previas (pre-validation) ────────────────────────────────────

  private async validateProjectMembership(ctx: TaskOperationContext): Promise<ValidationResult> {
    if (!ctx.projectId) return { allowed: false, reason: 'projectId requerido' };

    const project = await Project.findById(ctx.projectId);
    if (!project) return { allowed: false, reason: 'Proyecto no encontrado' };

    const isOwner  = project.ownerId.toString() === ctx.requesterId;
    const isMember = project.members.some((m) => m.userId.toString() === ctx.requesterId);

    if (!isOwner && !isMember) {
      return { allowed: false, reason: 'No eres miembro de este proyecto' };
    }
    return { allowed: true };
  }

  private async validateTaskOwnership(ctx: TaskOperationContext): Promise<ValidationResult> {
    if (!ctx.taskId) return { allowed: false, reason: 'taskId requerido' };

    const task = await Task.findById(ctx.taskId);
    if (!task) return { allowed: false, reason: 'Tarea no encontrada' };

    // Verificar que la tarea pertenece al proyecto del requester
    const project = await Project.findById(task.projectId);
    if (!project) return { allowed: false, reason: 'Proyecto de la tarea no encontrado' };

    const isOwner  = project.ownerId.toString() === ctx.requesterId;
    const isMember = project.members.some((m) => m.userId.toString() === ctx.requesterId);

    if (!isOwner && !isMember) {
      return { allowed: false, reason: 'No tienes acceso a esta tarea' };
    }
    return { allowed: true };
  }

  /**
   * Validación WIP Limit (RF-03.5): si la columna destino tiene límite de
   * trabajo en progreso y ya está llena, rechaza el movimiento.
   */
  private async validateWIPLimit(boardId: string, columnId: string, excludeTaskId?: string): Promise<ValidationResult> {
    const board = await Board.findById(boardId);
    if (!board) return { allowed: true }; // si no hay board, pasar

    const column = board.columns?.find((c: any) => c.id === columnId || c.name === columnId);
    if (!column || !(column as any).wipLimit) return { allowed: true }; // sin límite configurado

    const wipLimit = (column as any).wipLimit as number;
    const query: any = { boardId, columnId };
    if (excludeTaskId) query._id = { $ne: excludeTaskId };

    const currentCount = await Task.countDocuments(query);
    if (currentCount >= wipLimit) {
      return {
        allowed: false,
        reason:  `Límite WIP alcanzado en "${column.name}" (máx. ${wipLimit} tareas)`,
      };
    }
    return { allowed: true };
  }

  private validateTaskData(data: Partial<ITask>): ValidationResult {
    if (!data.title || data.title.trim().length === 0) {
      return { allowed: false, reason: 'El título de la tarea es obligatorio' };
    }
    if (data.title.length > 200) {
      return { allowed: false, reason: 'El título no puede superar 200 caracteres' };
    }
    if (data.dueDate && new Date(data.dueDate) < new Date(new Date().setHours(0,0,0,0))) {
      return { allowed: false, reason: 'La fecha de vencimiento no puede ser en el pasado' };
    }
    return { allowed: true };
  }

  // ── Auditoría ─────────────────────────────────────────────────────────────────

  private log(action: string, userId: string, taskId?: string, result: 'success' | 'denied' = 'success') {
    const entry = { action, userId, taskId, timestamp: new Date(), result };
    this.auditLog.push(entry);
    console.log(`[TaskProxy] ${result.toUpperCase()} | ${action} | user:${userId} | task:${taskId || 'new'} | ${entry.timestamp.toISOString()}`);
  }

  getAuditLog() { return this.auditLog; }

  // ── Métodos Proxy (intercepción + delegación) ─────────────────────────────────

  async createTask(ctx: TaskOperationContext, data: Partial<ITask>): Promise<any> {
    // Pre-validación 1: membresía
    const memberCheck = await this.validateProjectMembership(ctx);
    if (!memberCheck.allowed) {
      this.log('createTask', ctx.requesterId, undefined, 'denied');
      throw new Error(memberCheck.reason);
    }

    // Pre-validación 2: datos de entrada
    const dataCheck = this.validateTaskData(data);
    if (!dataCheck.allowed) {
      this.log('createTask', ctx.requesterId, undefined, 'denied');
      throw new Error(dataCheck.reason);
    }

    // Pre-validación 3: WIP Limit
    if (ctx.boardId && ctx.columnId) {
      const wipCheck = await this.validateWIPLimit(ctx.boardId, ctx.columnId);
      if (!wipCheck.allowed) {
        this.log('createTask', ctx.requesterId, undefined, 'denied');
        throw new Error(wipCheck.reason);
      }
    }

    // Delegar al Real Subject
    const result = await this.realService.createTask(ctx, data);
    this.log('createTask', ctx.requesterId, result._id?.toString(), 'success');
    return result;
  }

  async updateTask(ctx: TaskOperationContext, updates: Partial<ITask>): Promise<any> {
    const ownerCheck = await this.validateTaskOwnership(ctx);
    if (!ownerCheck.allowed) {
      this.log('updateTask', ctx.requesterId, ctx.taskId, 'denied');
      throw new Error(ownerCheck.reason);
    }

    if (updates.title !== undefined) {
      const dataCheck = this.validateTaskData(updates);
      if (!dataCheck.allowed) {
        this.log('updateTask', ctx.requesterId, ctx.taskId, 'denied');
        throw new Error(dataCheck.reason);
      }
    }

    const result = await this.realService.updateTask(ctx, updates);
    this.log('updateTask', ctx.requesterId, ctx.taskId, 'success');
    return result;
  }

  async deleteTask(ctx: TaskOperationContext): Promise<any> {
    const ownerCheck = await this.validateTaskOwnership(ctx);
    if (!ownerCheck.allowed) {
      this.log('deleteTask', ctx.requesterId, ctx.taskId, 'denied');
      throw new Error(ownerCheck.reason);
    }

    const result = await this.realService.deleteTask(ctx);
    this.log('deleteTask', ctx.requesterId, ctx.taskId, 'success');
    return result;
  }

  async moveTask(ctx: TaskOperationContext, targetColumnId: string): Promise<any> {
    const ownerCheck = await this.validateTaskOwnership(ctx);
    if (!ownerCheck.allowed) {
      this.log('moveTask', ctx.requesterId, ctx.taskId, 'denied');
      throw new Error(ownerCheck.reason);
    }

    // Pre-validación WIP Limit en columna destino
    const task = await Task.findById(ctx.taskId);
    if (task) {
      const wipCheck = await this.validateWIPLimit(
        task.boardId.toString(), targetColumnId, ctx.taskId
      );
      if (!wipCheck.allowed) {
        this.log('moveTask', ctx.requesterId, ctx.taskId, 'denied');
        throw new Error(wipCheck.reason);
      }
    }

    const result = await this.realService.moveTask(ctx, targetColumnId);
    this.log('moveTask', ctx.requesterId, ctx.taskId, 'success');
    return result;
  }
}

// ── Instancia singleton del Proxy ──────────────────────────────────────────────
export const taskProxy = new TaskServiceProxy();