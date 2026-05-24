/**
 * PATRÓN OBSERVER — Notificaciones en Tiempo Real sobre Eventos de Tareas
 *
 * Problema: Cuando una tarea cambia de estado, se asigna a un usuario o
 * está por vencer, múltiples partes del sistema deben reaccionar
 * (notificaciones, auditoría, dashboard). Acoplarlos directamente genera
 * dependencias rígidas y dificulta agregar nuevas reacciones.
 *
 * Solución: El Subject (TaskEventEmitter) mantiene una lista de Observers
 * y los notifica automáticamente cuando ocurre un evento. Cada Observer
 * reacciona de forma independiente sin conocer a los demás.
 *
 * Estructura:
 *   Subject interface  → ITaskSubject
 *   Observer interface → ITaskObserver
 *   Concrete Subject   → TaskEventEmitter (singleton)
 *   Concrete Observers → NotificationObserver, AuditLogObserver, DueDateObserver
 */

import { NotificationManager } from '../structuralpattern/NotificationAdapter';
import { Task }    from '../models/Task';
import { User }    from '../models/User';
import { Project } from '../models/Project';

// ── Tipos de eventos ───────────────────────────────────────────────────────────

export type TaskEventType =
  | 'task:created'
  | 'task:moved'
  | 'task:assigned'
  | 'task:updated'
  | 'task:deleted'
  | 'task:due_soon'
  | 'task:overdue';

export interface TaskEvent {
  type:       TaskEventType;
  taskId:     string;
  taskTitle:  string;
  projectId?: string;
  boardId?:   string;
  actorId?:   string;     // usuario que realizó la acción
  payload?:   Record<string, any>;
  timestamp:  Date;
}

// ── Observer Interface ─────────────────────────────────────────────────────────

export interface ITaskObserver {
  update(event: TaskEvent): Promise<void>;
  getName(): string;
}

// ── Subject Interface ──────────────────────────────────────────────────────────

export interface ITaskSubject {
  subscribe(observer: ITaskObserver):   void;
  unsubscribe(observer: ITaskObserver): void;
  notify(event: TaskEvent):             Promise<void>;
}

// ── Concrete Subject: TaskEventEmitter ────────────────────────────────────────

/**
 * Emite eventos de tareas y notifica a todos los observers suscritos.
 * Implementado como Singleton para que haya un único bus de eventos.
 */
export class TaskEventEmitter implements ITaskSubject {
  private static instance: TaskEventEmitter;
  private observers: ITaskObserver[] = [];

  private constructor() {}

  static getInstance(): TaskEventEmitter {
    if (!TaskEventEmitter.instance) {
      TaskEventEmitter.instance = new TaskEventEmitter();
    }
    return TaskEventEmitter.instance;
  }

  subscribe(observer: ITaskObserver): void {
    const exists = this.observers.find(o => o.getName() === observer.getName());
    if (!exists) {
      this.observers.push(observer);
      console.log(`[Observer] ✅ Suscrito: ${observer.getName()}`);
    }
  }

  unsubscribe(observer: ITaskObserver): void {
    this.observers = this.observers.filter(o => o.getName() !== observer.getName());
    console.log(`[Observer] ❌ Desuscrito: ${observer.getName()}`);
  }

  async notify(event: TaskEvent): Promise<void> {
    console.log(`[Observer] 📢 Evento: ${event.type} | tarea: ${event.taskTitle}`);
    await Promise.allSettled(
      this.observers.map(observer => observer.update(event))
    );
  }

  getObservers(): string[] {
    return this.observers.map(o => o.getName());
  }
}

// ── Concrete Observer 1: NotificationObserver ─────────────────────────────────

/**
 * Crea notificaciones InApp cuando ocurren eventos relevantes.
 * Usa el NotificationManager (Adapter) para enviar — no está acoplado a MongoDB.
 */
export class NotificationObserver implements ITaskObserver {
  getName() { return 'NotificationObserver'; }

  async update(event: TaskEvent): Promise<void> {
    try {
      // Solo notificar eventos relevantes
      const relevantEvents: TaskEventType[] = [
        'task:assigned', 'task:moved', 'task:due_soon', 'task:overdue'
      ];
      if (!relevantEvents.includes(event.type)) return;

      const manager = NotificationManager.inAppOnly();

      // Determinar a quién notificar y el mensaje
      let targetUserId = event.actorId;
      let title = '';
      let body  = '';
      let notifType: any = 'general';

      switch (event.type) {
        case 'task:assigned':
          targetUserId = event.payload?.assigneeId;
          title = `Tarea asignada: "${event.taskTitle}"`;
          body  = `Se te ha asignado una nueva tarea en el proyecto.`;
          notifType = 'task_assigned';
          break;

        case 'task:moved':
          targetUserId = event.payload?.assigneeId || event.actorId;
          title = `Tarea movida: "${event.taskTitle}"`;
          body  = `La tarea pasó de "${event.payload?.from}" a "${event.payload?.to}".`;
          notifType = 'status_change';
          break;

        case 'task:due_soon':
          targetUserId = event.payload?.assigneeId;
          title = `⚠️ Tarea por vencer: "${event.taskTitle}"`;
          body  = `La tarea vence en ${event.payload?.daysLeft} día(s).`;
          notifType = 'task_due';
          break;

        case 'task:overdue':
          targetUserId = event.payload?.assigneeId;
          title = `🔴 Tarea vencida: "${event.taskTitle}"`;
          body  = `La tarea superó su fecha de entrega.`;
          notifType = 'task_due';
          break;
      }

      if (!targetUserId) return;

      await manager.notify({
        to:       targetUserId,
        subject:  title,
        body,
        metadata: { type: notifType, taskId: event.taskId, projectId: event.projectId },
      });

      console.log(`[NotificationObserver] Notificación creada para ${targetUserId}`);
    } catch (error) {
      console.error('[NotificationObserver] Error:', error);
    }
  }
}

// ── Concrete Observer 2: AuditLogObserver ────────────────────────────────────

/**
 * Registra todos los eventos de tareas para auditoría (RF-06.3).
 * Guarda un log completo de quién hizo qué y cuándo.
 */
export class AuditLogObserver implements ITaskObserver {
  private static log: TaskEvent[] = [];

  getName() { return 'AuditLogObserver'; }

  async update(event: TaskEvent): Promise<void> {
    AuditLogObserver.log.push(event);

    console.log(
      `[AuditLog] ${event.timestamp.toISOString()} | ` +
      `${event.type} | ` +
      `tarea:"${event.taskTitle}" | ` +
      `actor:${event.actorId || 'system'}`
    );
  }

  static getLog(): TaskEvent[] {
    return AuditLogObserver.log;
  }

  static getLogByTask(taskId: string): TaskEvent[] {
    return AuditLogObserver.log.filter(e => e.taskId === taskId);
  }

  static clearLog(): void {
    AuditLogObserver.log = [];
  }
}

// ── Concrete Observer 3: DueDateObserver ─────────────────────────────────────

/**
 * Al crear o actualizar una tarea, verifica si está por vencer
 * y emite eventos secundarios task:due_soon o task:overdue.
 */
export class DueDateObserver implements ITaskObserver {
  getName() { return 'DueDateObserver'; }

  async update(event: TaskEvent): Promise<void> {
    // Solo reacciona a creación y actualización
    if (!['task:created', 'task:updated'].includes(event.type)) return;

    try {
      const task = await Task.findById(event.taskId);
      if (!task || !task.dueDate || task.columnId === 'done') return;

      const now      = new Date();
      const due      = new Date(task.dueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const emitter = TaskEventEmitter.getInstance();

      if (diffDays < 0) {
        // Tarea vencida
        await emitter.notify({
          type:      'task:overdue',
          taskId:    event.taskId,
          taskTitle: event.taskTitle,
          projectId: event.projectId,
          actorId:   event.actorId,
          payload:   { assigneeId: (task as any).assignedTo?.toString(), daysOverdue: Math.abs(diffDays) },
          timestamp: new Date(),
        });
      } else if (diffDays <= 2) {
        // Tarea por vencer en los próximos 2 días
        await emitter.notify({
          type:      'task:due_soon',
          taskId:    event.taskId,
          taskTitle: event.taskTitle,
          projectId: event.projectId,
          actorId:   event.actorId,
          payload:   { assigneeId: (task as any).assignedTo?.toString(), daysLeft: diffDays },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('[DueDateObserver] Error:', error);
    }
  }
}

// ── Setup del sistema Observer ─────────────────────────────────────────────────

/**
 * Inicializa el Subject con todos los Observers suscritos.
 * Se llama una vez al arrancar el servidor.
 */
export function setupTaskObservers(): TaskEventEmitter {
  const emitter = TaskEventEmitter.getInstance();

  emitter.subscribe(new NotificationObserver());
  emitter.subscribe(new AuditLogObserver());
  emitter.subscribe(new DueDateObserver());

  console.log('[Observer] Sistema de eventos inicializado con observers:', emitter.getObservers());
  return emitter;
}