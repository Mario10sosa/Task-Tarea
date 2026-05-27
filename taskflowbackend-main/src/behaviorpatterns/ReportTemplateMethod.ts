/**
 * PATRÓN TEMPLATE METHOD — Flujo de generación de reportes
 *
 * Problema: Todos los reportes siguen el mismo flujo:
 *   cargar datos → procesar/filtrar → formatear → exportar
 * Pero cada tipo de reporte (proyecto, tareas, miembros, actividad)
 * tiene su propia lógica de carga y procesamiento. Sin un esqueleto
 * común, el código se duplica en cada controlador.
 *
 * Solución: La clase base AbstractReportGenerator define el algoritmo
 * completo como pasos fijos (Template Method). Las subclases solo
 * sobrescriben los pasos variables (loadData, processData, getTitle)
 * sin poder cambiar el orden del flujo.
 *
 * Diferencia con Bridge:
 *   Bridge   → desacopla QUÉ se reporta del FORMATO de exportación (PDF/CSV)
 *   Template → define el FLUJO completo y deja que las subclases personalicen
 *              los pasos de carga y procesamiento
 *
 * Participantes:
 *   - AbstractReportGenerator   → clase base con el Template Method
 *   - ProjectSummaryReport      → carga tareas por columna y calcula métricas
 *   - TaskDetailReport          → carga tareas con checklist, etiquetas y adjuntos
 *   - MemberActivityReport      → carga actividad por miembro del proyecto
 *   - OverdueTaskReport         → carga solo tareas vencidas con días de retraso
 */

import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { Board } from '../models/Board';
import { ReportData } from '../structuralpattern/ReportBridge';

// ── Clase Base — Template Method ───────────────────────────────────────────────

export abstract class AbstractReportGenerator {
  /**
   * TEMPLATE METHOD — define el esqueleto del algoritmo.
   * Este método es final: las subclases NO pueden sobrescribirlo.
   */
  async generate(projectId: string): Promise<ReportData> {
    console.log(`[TemplateMethod] Iniciando reporte: ${this.getReportType()}`);

    // Paso 1 — Cargar datos (variable: cada subclase lo implementa)
    const rawData = await this.loadData(projectId);
    console.log(`[TemplateMethod] Datos cargados: ${rawData.length} registros`);

    // Paso 2 — Hook opcional: validar datos antes de procesar
    this.validateData(rawData);

    // Paso 3 — Procesar/filtrar datos (variable: cada subclase lo implementa)
    const rows = await this.processData(rawData, projectId);
    console.log(`[TemplateMethod] Datos procesados: ${rows.length} filas`);

    // Paso 4 — Calcular resumen (variable: cada subclase puede sobrescribirlo)
    const summary = this.buildSummary(rows, rawData);

    // Paso 5 — Ensamblar el reporte (fijo: siempre igual)
    const report: ReportData = {
      title:       await this.getTitle(projectId),
      generatedAt: new Date().toLocaleString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      rows,
      summary,
    };

    console.log(`[TemplateMethod] Reporte "${report.title}" listo`);
    return report;
  }

  // ── Pasos ABSTRACTOS — las subclases DEBEN implementarlos ─────────────────

  /** Carga los datos crudos desde la BD */
  protected abstract loadData(projectId: string): Promise<any[]>;

  /** Transforma los datos crudos en filas del reporte */
  protected abstract processData(rawData: any[], projectId: string): Promise<Record<string, any>[]>;

  /** Nombre del tipo de reporte (para logs) */
  protected abstract getReportType(): string;

  /** Título del reporte (puede hacer consulta async) */
  protected abstract getTitle(projectId: string): Promise<string>;

  // ── Pasos HOOK — las subclases PUEDEN sobrescribirlos ─────────────────────

  /** Validación opcional antes de procesar — hook por defecto no hace nada */
  protected validateData(rawData: any[]): void {
    // Hook vacío — las subclases pueden sobrescribir para validar
  }

  /** Resumen opcional — hook por defecto retorna estadísticas básicas */
  protected buildSummary(rows: Record<string, any>[], _rawData: any[]): Record<string, any> {
    return { 'Total de registros': rows.length };
  }
}

// ── Helper: nombre de proyecto ─────────────────────────────────────────────────

async function getProjectName(projectId: string): Promise<string> {
  const project = await Project.findById(projectId).lean();
  return (project as any)?.name ?? projectId;
}

// ── Subclases Concretas ────────────────────────────────────────────────────────

/**
 * Reporte de resumen de proyecto:
 * Muestra el conteo de tareas por columna y su distribución por prioridad.
 */
export class ProjectSummaryReport extends AbstractReportGenerator {
  getReportType() { return 'ProjectSummary'; }

  async getTitle(projectId: string) {
    return `Resumen del Proyecto — ${await getProjectName(projectId)}`;
  }

  async loadData(projectId: string) {
    return Task.find({ projectId }).lean();
  }

  async processData(rawData: any[]): Promise<Record<string, any>[]> {
    // Agrupa por columna
    const byColumn: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    rawData.forEach(t => {
      byColumn[t.columnId]        = (byColumn[t.columnId] ?? 0) + 1;
      const p = t.priority ?? 'sin prioridad';
      byPriority[p]               = (byPriority[p] ?? 0) + 1;
    });

    return [
      ...Object.entries(byColumn).map(([columna, tareas]) => ({ Categoría: 'Por columna', Columna: columna, Tareas: tareas })),
      ...Object.entries(byPriority).map(([prioridad, tareas]) => ({ Categoría: 'Por prioridad', Columna: prioridad, Tareas: tareas })),
    ];
  }

  protected buildSummary(rows: Record<string, any>[], rawData: any[]) {
    const done = rawData.filter(t => t.columnId === 'done').length;
    return {
      'Total de tareas':   rawData.length,
      'Completadas':       done,
      'En progreso':       rawData.filter(t => t.columnId === 'inprogress').length,
      'Por hacer':         rawData.filter(t => t.columnId === 'todo').length,
      '% Completado':      rawData.length ? `${Math.round((done / rawData.length) * 100)}%` : '0%',
    };
  }
}

/**
 * Reporte de detalle de tareas:
 * Lista todas las tareas con sus atributos completos.
 */
export class TaskDetailReport extends AbstractReportGenerator {
  getReportType() { return 'TaskDetail'; }

  async getTitle(projectId: string) {
    return `Detalle de Tareas — ${await getProjectName(projectId)}`;
  }

  async loadData(projectId: string) {
    return Task.find({ projectId }).lean();
  }

  async processData(rawData: any[]): Promise<Record<string, any>[]> {
    return rawData.map(t => ({
      'Título':       t.title,
      'Tipo':         t.type ?? 'simple',
      'Estado':       t.columnId,
      'Prioridad':    t.priority ?? 'media',
      'Etiquetas':    (t.labels ?? []).map((l: any) => l.name).join(', ') || '—',
      'Checklist':    t.checklist?.length ? `${t.checklist.filter((c: any) => c.done).length}/${t.checklist.length}` : '—',
      'Adjuntos':     t.attachments?.length ?? 0,
      'Vencimiento':  t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-CO') : '—',
      'Descripción':  t.description ?? '—',
    }));
  }

  protected buildSummary(_rows: any[], rawData: any[]) {
    return {
      'Total tareas':        rawData.length,
      'Con checklist':       rawData.filter(t => t.checklist?.length).length,
      'Con etiquetas':       rawData.filter(t => t.labels?.length).length,
      'Con adjuntos':        rawData.filter(t => t.attachments?.length).length,
      'Con fecha límite':    rawData.filter(t => t.dueDate).length,
    };
  }
}

/**
 * Reporte de tareas vencidas:
 * Solo tareas cuya fecha de vencimiento ya pasó y no están en "done".
 */
export class OverdueTaskReport extends AbstractReportGenerator {
  getReportType() { return 'OverdueTask'; }

  async getTitle(projectId: string) {
    return `Tareas Vencidas — ${await getProjectName(projectId)}`;
  }

  async loadData(projectId: string) {
    return Task.find({
      projectId,
      dueDate:  { $lt: new Date() },
      columnId: { $ne: 'done' },
    }).lean();
  }

  async processData(rawData: any[]): Promise<Record<string, any>[]> {
    const now = new Date();
    return rawData.map(t => {
      const due     = new Date(t.dueDate);
      const diffMs  = now.getTime() - due.getTime();
      const days    = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return {
        'Título':          t.title,
        'Estado actual':   t.columnId,
        'Prioridad':       t.priority ?? 'media',
        'Fecha límite':    due.toLocaleDateString('es-CO'),
        'Días de retraso': days,
      };
    });
  }

  protected validateData(rawData: any[]) {
    if (rawData.length === 0) {
      console.log('[TemplateMethod] ✅ No hay tareas vencidas — reporte vacío');
    }
  }

  protected buildSummary(_rows: any[], rawData: any[]) {
    const critical = rawData.filter(t => {
      const days = Math.floor((Date.now() - new Date(t.dueDate).getTime()) / 86400000);
      return days > 7;
    }).length;
    return {
      'Total vencidas':         rawData.length,
      'Críticas (>7 días)':     critical,
      'Alta prioridad vencidas': rawData.filter(t => t.priority === 'high').length,
    };
  }
}

/**
 * Reporte de tableros del proyecto:
 * Muestra las columnas y conteo de tareas por tablero.
 */
export class BoardSummaryReport extends AbstractReportGenerator {
  getReportType() { return 'BoardSummary'; }

  async getTitle(projectId: string) {
    return `Tableros — ${await getProjectName(projectId)}`;
  }

  async loadData(projectId: string) {
    return Board.find({ projectId }).lean();
  }

  async processData(rawData: any[], projectId: string): Promise<Record<string, any>[]> {
    const rows: Record<string, any>[] = [];
    for (const board of rawData) {
      const columns = (board as any).columns ?? [];
      for (const col of columns) {
        const count = await Task.countDocuments({ projectId, columnId: col.id ?? col.name });
        rows.push({
          'Tablero':  (board as any).name,
          'Columna':  col.name,
          'ID':       col.id ?? col.name,
          'Tareas':   count,
        });
      }
    }
    return rows;
  }

  protected buildSummary(_rows: any[], rawData: any[]) {
    return { 'Total tableros': rawData.length };
  }
}

// ── Fábrica de generadores ─────────────────────────────────────────────────────

const REPORT_GENERATORS: Record<string, AbstractReportGenerator> = {
  summary:  new ProjectSummaryReport(),
  tasks:    new TaskDetailReport(),
  overdue:  new OverdueTaskReport(),
  boards:   new BoardSummaryReport(),
};

export function getTemplateReportGenerator(type: string): AbstractReportGenerator {
  const generator = REPORT_GENERATORS[type];
  if (!generator)
    throw new Error(`Tipo de reporte desconocido: "${type}". Disponibles: ${Object.keys(REPORT_GENERATORS).join(', ')}`);
  return generator;
}

export function listTemplateReportTypes() {
  return Object.keys(REPORT_GENERATORS);
}