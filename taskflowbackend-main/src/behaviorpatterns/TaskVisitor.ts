/**
 * PATRÓN VISITOR — Métricas sobre el árbol de tareas
 *
 * Problema: Necesitamos calcular diferentes métricas sobre las tareas
 * (contar bugs, sumar horas estimadas, calcular progreso, validar datos)
 * sin modificar los modelos de tarea. Agregar estos cálculos directamente
 * al modelo viola el principio de responsabilidad única.
 *
 * Solución: El Visitor separa el algoritmo de la estructura de datos.
 * Cada Visitor encapsula una operación (métricas, validación, exportación)
 * y los nodos del árbol de tareas simplemente lo aceptan mediante accept().
 * Agregar nuevas operaciones solo requiere crear un nuevo Visitor —
 * los modelos de tarea no se tocan.
 *
 * Participantes:
 *   - ITaskVisitor (interfaz)      → declara visit() para cada tipo de nodo
 *   - VisitableTask (interfaz)     → declara accept(visitor) en los nodos
 *   - TaskNode                     → nodo del árbol (hoja o compuesto)
 *   - MetricsVisitor               → calcula métricas: bugs, horas, progreso
 *   - ValidationVisitor            → detecta problemas en las tareas
 *   - ExportVisitor                → serializa el árbol a JSON plano
 *   - SummaryVisitor               → resumen ejecutivo del proyecto
 */

// ── Nodo del árbol de tareas ───────────────────────────────────────────────────

export interface TaskNode {
  _id:             string;
  title:           string;
  type:            string;
  priority:        string;
  columnId:        string;
  assignedTo?:     string;
  dueDate?:        Date | string;
  durationMinutes?: number;
  checklist?:      { text: string; done: boolean }[];
  labels?:         { name: string; color: string }[];
  description?:    string;
  children?:       TaskNode[];  // subtareas
}

// ── Interfaz Visitor ───────────────────────────────────────────────────────────

export interface ITaskVisitor {
  visitTask(node: TaskNode): void;
  getResult(): any;
}

// ── Interfaz Visitable ─────────────────────────────────────────────────────────

export interface Visitable {
  accept(visitor: ITaskVisitor): void;
}

// ── Implementación Visitable para TaskNode ─────────────────────────────────────

export class VisitableTaskNode implements Visitable {
  constructor(private node: TaskNode) {}

  accept(visitor: ITaskVisitor): void {
    visitor.visitTask(this.node);
    // Recorre recursivamente los hijos (árbol de subtareas)
    if (this.node.children && this.node.children.length > 0) {
      this.node.children.forEach(child =>
        new VisitableTaskNode(child).accept(visitor)
      );
    }
  }
}

// ── Visitor 1: MetricsVisitor ──────────────────────────────────────────────────

export interface TaskMetrics {
  total:              number;
  byType:             Record<string, number>;
  byPriority:         Record<string, number>;
  byStatus:           Record<string, number>;
  totalHoursEstimated: number;
  completedTasks:     number;
  completionRate:     string;
  withChecklist:      number;
  checklistProgress:  string;
  overdue:            number;
  withLabels:         number;
  unassigned:         number;
}

export class MetricsVisitor implements ITaskVisitor {
  private metrics: TaskMetrics = {
    total:               0,
    byType:              {},
    byPriority:          {},
    byStatus:            {},
    totalHoursEstimated: 0,
    completedTasks:      0,
    completionRate:      '0%',
    withChecklist:       0,
    checklistProgress:   '0%',
    overdue:             0,
    withLabels:          0,
    unassigned:          0,
  };

  private checklistTotal = 0;
  private checklistDone  = 0;

  visitTask(node: TaskNode): void {
    this.metrics.total++;

    // Por tipo
    const type = node.type ?? 'simple';
    this.metrics.byType[type] = (this.metrics.byType[type] ?? 0) + 1;

    // Por prioridad
    const priority = node.priority ?? 'medium';
    this.metrics.byPriority[priority] = (this.metrics.byPriority[priority] ?? 0) + 1;

    // Por estado (columna)
    this.metrics.byStatus[node.columnId] = (this.metrics.byStatus[node.columnId] ?? 0) + 1;

    // Horas estimadas
    if (node.durationMinutes) {
      this.metrics.totalHoursEstimated += node.durationMinutes / 60;
    }

    // Completadas
    if (node.columnId === 'done') this.metrics.completedTasks++;

    // Checklist
    if (node.checklist && node.checklist.length > 0) {
      this.metrics.withChecklist++;
      this.checklistTotal += node.checklist.length;
      this.checklistDone  += node.checklist.filter(c => c.done).length;
    }

    // Vencidas
    if (node.dueDate && node.columnId !== 'done') {
      if (new Date(node.dueDate) < new Date()) this.metrics.overdue++;
    }

    // Con etiquetas
    if (node.labels && node.labels.length > 0) this.metrics.withLabels++;

    // Sin asignar
    if (!node.assignedTo) this.metrics.unassigned++;
  }

  getResult(): TaskMetrics {
    if (this.metrics.total > 0) {
      this.metrics.completionRate   = `${Math.round((this.metrics.completedTasks / this.metrics.total) * 100)}%`;
    }
    if (this.checklistTotal > 0) {
      this.metrics.checklistProgress = `${Math.round((this.checklistDone / this.checklistTotal) * 100)}%`;
    }
    this.metrics.totalHoursEstimated = Math.round(this.metrics.totalHoursEstimated * 10) / 10;
    return { ...this.metrics };
  }
}

// ── Visitor 2: ValidationVisitor ──────────────────────────────────────────────

export interface ValidationIssue {
  taskId:   string;
  title:    string;
  issues:   string[];
  severity: 'warning' | 'error';
}

export class ValidationVisitor implements ITaskVisitor {
  private issues: ValidationIssue[] = [];

  visitTask(node: TaskNode): void {
    const taskIssues: string[] = [];

    if (!node.title || node.title.trim().length < 3)
      taskIssues.push('Título muy corto o vacío (mínimo 3 caracteres)');

    if (!node.assignedTo)
      taskIssues.push('Sin responsable asignado');

    if (!node.dueDate && node.columnId !== 'done')
      taskIssues.push('Sin fecha de vencimiento');

    if (node.priority === 'high' && node.columnId === 'todo')
      taskIssues.push('Tarea de alta prioridad sin iniciar');

    if (node.type === 'BUG' && !node.description)
      taskIssues.push('Bug sin descripción de pasos para reproducir');

    if (node.dueDate && node.columnId !== 'done' && new Date(node.dueDate) < new Date())
      taskIssues.push(`Vencida hace ${Math.floor((Date.now() - new Date(node.dueDate).getTime()) / 86400000)} días`);

    if (taskIssues.length > 0) {
      this.issues.push({
        taskId:   node._id,
        title:    node.title,
        issues:   taskIssues,
        severity: taskIssues.some(i => i.includes('Vencida') || i.includes('alta prioridad'))
          ? 'error' : 'warning',
      });
    }
  }

  getResult(): { total: number; errors: number; warnings: number; issues: ValidationIssue[] } {
    return {
      total:    this.issues.length,
      errors:   this.issues.filter(i => i.severity === 'error').length,
      warnings: this.issues.filter(i => i.severity === 'warning').length,
      issues:   this.issues,
    };
  }
}

// ── Visitor 3: SummaryVisitor ─────────────────────────────────────────────────

export class SummaryVisitor implements ITaskVisitor {
  private lines: string[] = [];
  private counts = { total: 0, done: 0, bugs: 0, highPriority: 0 };

  visitTask(node: TaskNode): void {
    this.counts.total++;
    if (node.columnId === 'done')         this.counts.done++;
    if (node.type?.toUpperCase() === 'BUG') this.counts.bugs++;
    if (node.priority === 'high')         this.counts.highPriority++;

    this.lines.push(
      `[${node.columnId.toUpperCase()}] ${node.title} (${node.type ?? 'simple'} | ${node.priority ?? 'medium'})`
    );
  }

  getResult(): { summary: string; counts: { total: number; done: number; bugs: number; highPriority: number }; lines: string[] } {
    const rate = this.counts.total
      ? Math.round((this.counts.done / this.counts.total) * 100)
      : 0;

    return {
      summary: `Proyecto con ${this.counts.total} tareas — ${rate}% completado. ` +
               `${this.counts.bugs} bugs, ${this.counts.highPriority} de alta prioridad.`,
      counts:  { ...this.counts },
      lines:   this.lines,
    };
  }
}

// ── Fábrica de Visitors ────────────────────────────────────────────────────────

export function getVisitor(type: string): ITaskVisitor {
  switch (type) {
    case 'metrics':  return new MetricsVisitor();
    case 'validate': return new ValidationVisitor();
    case 'summary':  return new SummaryVisitor();
    default:
      throw new Error(`Visitor desconocido: "${type}". Disponibles: metrics, validate, summary`);
  }
}

export function listVisitors() {
  return [
    { id: 'metrics',  description: 'Métricas completas: tipos, prioridades, horas, progreso' },
    { id: 'validate', description: 'Validación: detecta tareas incompletas o problemáticas' },
    { id: 'summary',  description: 'Resumen ejecutivo del estado del proyecto' },
  ];
}