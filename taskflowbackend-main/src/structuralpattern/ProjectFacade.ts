/**
 * PATRÓN FACADE — Gestión de Proyectos
 *
 * Problema: Las operaciones de gestión de proyectos involucran múltiples
 * subsistemas (Project, Board, Task, Notification, Invitation) que el
 * controlador debe coordinar directamente, generando alto acoplamiento
 * y lógica de negocio dispersa en la capa HTTP.
 *
 * Solución: Proveer una interfaz simplificada (Facade) que oculta la
 * complejidad de la coordinación entre subsistemas. El controlador
 * solo conoce al Facade, no a los subsistemas individuales.
 *
 * Estructura:
 *   Facade      → ProjectFacade
 *   Subsistemas → ProjectService, BoardService, TaskService,
 *                 NotificationManager, InvitationService
 */

import { Project }             from '../models/Project';
import { Board }               from '../models/Board';
import { Task }                from '../models/Task';
import { Invitation }          from '../models/Invitation';
import { Notification }        from '../models/Notification';
import { NotificationManager } from './NotificationAdapter';

// ── Tipos de resultado del Facade ──────────────────────────────────────────────

export interface FullProjectResult {
  project:  any;
  board:    any;
  message:  string;
}

export interface ProjectDashboard {
  project:       any;
  boards:        any[];
  stats: {
    totalTasks:      number;
    completedTasks:  number;
    inProgressTasks: number;
    overdueTasks:    number;
    progress:        number;       // 0–100
    tasksByType:     Record<string, number>;
    tasksByPriority: Record<string, number>;
    tasksByColumn:   Record<string, number>;
  };
  recentActivity: any[];
}

export interface ArchiveResult {
  project: any;
  notified: number;
  message: string;
}

// ── Facade ────────────────────────────────────────────────────────────────────

export class ProjectFacade {

  /**
   * Operación compleja 1: Crear proyecto completo
   * Coordina: crear proyecto → crear tablero Kanban por defecto →
   *           crear columnas estándar → notificar al creador (InApp)
   *
   * El cliente hace UNA llamada en lugar de 3–4 llamadas a distintos servicios.
   */
  async createFullProject(
    name: string,
    description: string | undefined,
    ownerId: string
  ): Promise<FullProjectResult> {

    // Subsistema 1: Crear proyecto con el owner como admin
    const project = await Project.create({
      name,
      description,
      ownerId,
      members: [{ userId: ownerId, role: 'admin' }],
    });

    // Subsistema 2: Crear tablero Kanban por defecto (RF-03.1)
    const board = await Board.create({
      projectId: project._id,
      name:      'Tablero principal',
      columns: [
        { id: 'todo',       name: 'Por hacer',    order: 0 },
        { id: 'inprogress', name: 'En progreso',  order: 1 },
        { id: 'review',     name: 'En revisión',  order: 2 },
        { id: 'done',       name: 'Completado',   order: 3 },
      ],
    });

    // Subsistema 3: Notificar al creador (InApp) via Adapter
    const notifManager = NotificationManager.inAppOnly();
    await notifManager.notify({
      to:      ownerId,
      subject: `Proyecto "${name}" creado`,
      body:    `Tu proyecto "${name}" ha sido creado con un tablero Kanban por defecto.`,
      metadata: { type: 'general', projectId: project._id.toString() },
    });

    return {
      project,
      board,
      message: `Proyecto "${name}" creado con tablero Kanban y columnas por defecto.`,
    };
  }

  /**
   * Operación compleja 2: Eliminar proyecto en cascada
   * Coordina: verificar permisos → eliminar tareas → eliminar tableros →
   *           eliminar invitaciones → eliminar notificaciones → eliminar proyecto
   *
   * Sin Facade, el controlador haría 5 llamadas a distintos servicios.
   */
  async deleteProjectCascade(
    projectId: string,
    requesterId: string
  ): Promise<{ message: string; deleted: Record<string, number> }> {

    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    if (project.ownerId.toString() !== requesterId) {
      throw new Error('Only the project owner can delete the project');
    }

    // Subsistema 1: Contar y eliminar tareas
    const taskCount = await Task.countDocuments({ projectId });
    await Task.deleteMany({ projectId });

    // Subsistema 2: Contar y eliminar tableros
    const boardCount = await Board.countDocuments({ projectId });
    await Board.deleteMany({ projectId });

    // Subsistema 3: Eliminar invitaciones del proyecto
    const invitationCount = await Invitation.countDocuments({ projectId });
    await Invitation.deleteMany({ projectId });

    // Subsistema 4: Eliminar notificaciones relacionadas
    const notifCount = await Notification.countDocuments({
      'metadata.projectId': projectId,
    });
    await Notification.deleteMany({ 'metadata.projectId': projectId });

    // Subsistema 5: Eliminar el proyecto
    await project.deleteOne();

    return {
      message: `Proyecto "${project.name}" eliminado correctamente.`,
      deleted: {
        tasks:         taskCount,
        boards:        boardCount,
        invitations:   invitationCount,
        notifications: notifCount,
      },
    };
  }

  /**
   * Operación compleja 3: Obtener dashboard completo del proyecto
   * Coordina: datos del proyecto → boards → tareas → cálculo de métricas
   *
   * El frontend hace UNA llamada en lugar de 3 llamadas separadas.
   */
  async getProjectDashboard(projectId: string): Promise<ProjectDashboard> {

    // Subsistema 1: Datos del proyecto con miembros populados
    const project = await Project.findById(projectId)
      .populate('members.userId', 'name email');
    if (!project) throw new Error('Project not found');

    // Subsistema 2: Tableros del proyecto
    const boards = await Board.find({ projectId });

    // Subsistema 3: Todas las tareas del proyecto
    const tasks = await Task.find({ projectId })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    // Subsistema 4: Calcular métricas agregadas
    const now          = new Date();
    const totalTasks   = tasks.length;
    const completedTasks  = tasks.filter((t: any) => t.columnId === 'done').length;
    const inProgressTasks = tasks.filter((t: any) => t.columnId === 'inprogress').length;
    const overdueTasks    = tasks.filter(
      (t: any) => t.dueDate && new Date(t.dueDate) < now && t.columnId !== 'done'
    ).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tareas agrupadas por tipo
    const tasksByType: Record<string, number> = {};
    tasks.forEach((t: any) => {
      tasksByType[t.type] = (tasksByType[t.type] || 0) + 1;
    });

    // Tareas agrupadas por prioridad
    const tasksByPriority: Record<string, number> = {};
    tasks.forEach((t: any) => {
      tasksByPriority[t.priority] = (tasksByPriority[t.priority] || 0) + 1;
    });

    // Tareas agrupadas por columna
    const tasksByColumn: Record<string, number> = {};
    tasks.forEach((t: any) => {
      tasksByColumn[t.columnId] = (tasksByColumn[t.columnId] || 0) + 1;
    });

    // Actividad reciente: últimas 10 tareas modificadas
    const recentActivity = tasks.slice(0, 10).map((t: any) => ({
      taskId:    t._id,
      title:     t.title,
      columnId:  t.columnId,
      priority:  t.priority,
      updatedAt: t.updatedAt,
    }));

    return {
      project,
      boards,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        progress,
        tasksByType,
        tasksByPriority,
        tasksByColumn,
      },
      recentActivity,
    };
  }

  /**
   * Operación compleja 4: Archivar proyecto
   * Coordina: marcar como archivado → notificar a todos los miembros
   */
  async archiveProject(
    projectId: string,
    requesterId: string
  ): Promise<ArchiveResult> {

    const project = await Project.findById(projectId)
      .populate('members.userId', 'name');
    if (!project) throw new Error('Project not found');

    if (project.ownerId.toString() !== requesterId) {
      throw new Error('Only the project owner can archive the project');
    }

    // Subsistema 1: Actualizar estado del proyecto
    (project as any).archived = true;
    await project.save();

    // Subsistema 2: Notificar a todos los miembros via Adapter
    const notifManager = NotificationManager.inAppOnly();
    const memberIds    = project.members.map((m: any) =>
      typeof m.userId === 'object' ? m.userId._id.toString() : m.userId.toString()
    );

    await Promise.allSettled(
      memberIds.map((memberId: string) =>
        notifManager.notify({
          to:      memberId,
          subject: `Proyecto archivado: "${project.name}"`,
          body:    `El proyecto "${project.name}" ha sido archivado y es ahora de solo lectura.`,
          metadata: { type: 'general', projectId },
        })
      )
    );

    return {
      project,
      notified: memberIds.length,
      message:  `Proyecto "${project.name}" archivado. ${memberIds.length} miembro(s) notificados.`,
    };
  }
}

// ── Instancia única (compatible con Singleton) ─────────────────────────────────

export const projectFacade = new ProjectFacade();