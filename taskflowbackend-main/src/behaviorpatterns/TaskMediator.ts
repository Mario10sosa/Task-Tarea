/**
 * PATRÓN MEDIATOR — TaskEventBus central
 *
 * Problema: El tablero Kanban, el panel de notificaciones y el dashboard
 * se comunican directamente entre sí, generando dependencias directas que
 * dificultan el mantenimiento. Si una tarea cambia de estado, el Kanban
 * actualiza su columna, el dashboard recalcula métricas Y se envía una
 * notificación — tres componentes acoplados entre sí.
 *
 * Solución: Un TaskEventBus central actúa como Mediator. Cada componente
 * (Colleague) solo conoce al Mediator — nunca a los demás. Cuando el Kanban
 * mueve una tarea, notifica al bus; el bus decide quién más debe reaccionar.
 *
 * Participantes:
 *   - IMediator (interfaz)           → define notify(sender, event, data)
 *   - TaskEventBus (Mediator)        → coordina la comunicación entre Colleagues
 *   - KanbanColleague                → gestiona el estado del tablero Kanban
 *   - NotificationColleague          → gestiona el envío de notificaciones
 *   - DashboardColleague             → actualiza métricas del dashboard
 *   - AnalyticsColleague             → registra eventos para analíticas
 */

import { Notification } from '../models/Notification';

// ── Tipos de eventos del bus ───────────────────────────────────────────────────

export type MediatorEventType =
  | 'task:created'
  | 'task:updated'
  | 'task:moved'
  | 'task:deleted'
  | 'task:assigned'
  | 'task:overdue'
  | 'project:archived'
  | 'member:invited';

export interface MediatorEvent {
  id:        string;
  type:      MediatorEventType;
  sender:    string;             // nombre del Colleague que emitió el evento
  timestamp: Date;
  data:      Record<string, any>;
  reactions: string[];           // qué Colleagues reaccionaron
}

// ── Interfaz Mediator ──────────────────────────────────────────────────────────

export interface IMediator {
  notify(sender: string, event: MediatorEventType, data: Record<string, any>): Promise<MediatorEvent>;
}

// ── Interfaz Colleague ─────────────────────────────────────────────────────────

export abstract class Colleague {
  constructor(protected mediator: IMediator) {}

  /** Envía un evento al Mediator — nunca habla directamente con otros Colleagues */
  protected async emit(event: MediatorEventType, data: Record<string, any>) {
    return this.mediator.notify(this.getName(), event, data);
  }

  abstract getName(): string;
  abstract handleEvent(event: MediatorEventType, data: Record<string, any>): Promise<string | null>;
}

// ── Colleagues Concretos ───────────────────────────────────────────────────────

export class KanbanColleague extends Colleague {
  getName() { return 'KanbanBoard'; }

  async handleEvent(event: MediatorEventType, data: Record<string, any>): Promise<string | null> {
    if (event === 'task:moved') {
      const msg = `[Kanban] Tarea "${data.title}" movida a columna "${data.targetColumn}"`;
      console.log(msg);
      return msg;
    }
    if (event === 'task:created') {
      const msg = `[Kanban] Nueva tarea "${data.title}" agregada al tablero`;
      console.log(msg);
      return msg;
    }
    if (event === 'task:deleted') {
      const msg = `[Kanban] Tarea "${data.title}" eliminada del tablero`;
      console.log(msg);
      return msg;
    }
    return null;
  }

  /** Notifica al bus cuando una tarea es movida en el Kanban */
  async onTaskMoved(taskId: string, title: string, fromColumn: string, targetColumn: string, projectId: string) {
    return this.emit('task:moved', { taskId, title, fromColumn, targetColumn, projectId });
  }
}

export class NotificationColleague extends Colleague {
  getName() { return 'NotificationPanel'; }

  async handleEvent(event: MediatorEventType, data: Record<string, any>): Promise<string | null> {
    const notifiableEvents: MediatorEventType[] = [
      'task:assigned', 'task:overdue', 'member:invited', 'project:archived',
    ];

    if (!notifiableEvents.includes(event)) return null;

    const messages: Record<MediatorEventType, string> = {
      'task:assigned':    `Se te asignó la tarea "${data.title}"`,
      'task:overdue':     `La tarea "${data.title}" está vencida`,
      'member:invited':   `Fuiste invitado al proyecto "${data.projectName}"`,
      'project:archived': `El proyecto "${data.projectName}" fue archivado`,
      'task:created':     '',
      'task:updated':     '',
      'task:moved':       '',
      'task:deleted':     '',
    };

    const message = messages[event];
    if (message && data.userId) {
      try {
        await Notification.create({
          userId:  data.userId,
          title:   event.replace(':', ' ').toUpperCase(),
          message,
          type:    'general',
          read:    false,
        });
        const msg = `[Notification] Enviada a usuario ${data.userId}: "${message}"`;
        console.log(msg);
        return msg;
      } catch {
        return `[Notification] Error enviando notificación para ${event}`;
      }
    }
    return null;
  }
}

export class DashboardColleague extends Colleague {
  getName() { return 'Dashboard'; }

  /** Cache simple de métricas — en producción sería Redis */
  private static metricsCache: Map<string, any> = new Map();

  async handleEvent(event: MediatorEventType, data: Record<string, any>): Promise<string | null> {
    const dashboardEvents: MediatorEventType[] = [
      'task:created', 'task:moved', 'task:deleted', 'task:updated',
    ];

    if (!dashboardEvents.includes(event)) return null;

    const projectId = data.projectId;
    if (!projectId) return null;

    // Invalida el cache del dashboard para este proyecto
    DashboardColleague.metricsCache.delete(projectId);

    const msg = `[Dashboard] Métricas del proyecto ${projectId} invalidadas por evento "${event}"`;
    console.log(msg);
    return msg;
  }

  static getCache(projectId: string) {
    return DashboardColleague.metricsCache.get(projectId);
  }

  static setCache(projectId: string, metrics: any) {
    DashboardColleague.metricsCache.set(projectId, metrics);
  }
}

export class AnalyticsColleague extends Colleague {
  getName() { return 'Analytics'; }

  private static eventLog: MediatorEvent[] = [];

  async handleEvent(event: MediatorEventType, data: Record<string, any>): Promise<string | null> {
    // Analytics registra absolutamente todos los eventos
    const msg = `[Analytics] Evento registrado: "${event}" desde "${data._sender ?? 'unknown'}"`;
    console.log(msg);
    return msg;
  }

  static getLog() { return [...AnalyticsColleague.eventLog]; }
  static appendToLog(entry: MediatorEvent) { AnalyticsColleague.eventLog.push(entry); }
}

// ── TaskEventBus — Mediator Concreto ──────────────────────────────────────────

export class TaskEventBus implements IMediator {
  private static instance: TaskEventBus;
  private eventLog: MediatorEvent[] = [];

  private kanban:       KanbanColleague;
  private notification: NotificationColleague;
  private dashboard:    DashboardColleague;
  private analytics:    AnalyticsColleague;

  private constructor() {
    this.kanban       = new KanbanColleague(this);
    this.notification = new NotificationColleague(this);
    this.dashboard    = new DashboardColleague(this);
    this.analytics    = new AnalyticsColleague(this);
  }

  static getInstance(): TaskEventBus {
    if (!TaskEventBus.instance) {
      TaskEventBus.instance = new TaskEventBus();
    }
    return TaskEventBus.instance;
  }

  getKanban()       { return this.kanban; }
  getNotification() { return this.notification; }
  getDashboard()    { return this.dashboard; }
  getAnalytics()    { return this.analytics; }

  /**
   * Punto central de comunicación — todos los Colleagues llaman aquí.
   * El bus decide quién más debe reaccionar al evento.
   */
  async notify(sender: string, event: MediatorEventType, data: Record<string, any>): Promise<MediatorEvent> {
    const entry: MediatorEvent = {
      id:        `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type:      event,
      sender,
      timestamp: new Date(),
      data:      { ...data, _sender: sender },
      reactions: [],
    };

    console.log(`[Mediator] Evento recibido: "${event}" de "${sender}"`);

    // El bus notifica a todos los Colleagues excepto al emisor
    const colleagues = [this.kanban, this.notification, this.dashboard, this.analytics];
    const reactions = await Promise.all(
      colleagues
        .filter(c => c.getName() !== sender)
        .map(c => c.handleEvent(event, entry.data))
    );

    entry.reactions = reactions.filter(Boolean) as string[];
    this.eventLog.push(entry);
    AnalyticsColleague.appendToLog(entry);

    // Limita el log a los últimos 100 eventos
    if (this.eventLog.length > 100) this.eventLog.shift();

    return entry;
  }

  getEventLog(): MediatorEvent[] {
    return [...this.eventLog].reverse();
  }

  getStats() {
    const byType: Record<string, number> = {};
    this.eventLog.forEach(e => { byType[e.type] = (byType[e.type] ?? 0) + 1; });
    return {
      total:   this.eventLog.length,
      byType,
      lastEvent: this.eventLog[this.eventLog.length - 1] ?? null,
    };
  }
}

// Singleton exportado para usar en controllers y services
export const taskEventBus = TaskEventBus.getInstance();