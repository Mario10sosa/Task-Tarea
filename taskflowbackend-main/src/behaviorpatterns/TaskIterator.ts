/**
 * PATRÓN ITERATOR — Recorrer Colecciones de Tareas/Proyectos
 *
 * Problema: Recorrer las tareas de un proyecto con diferentes criterios
 * (por prioridad, vencidas, por columna, por tipo) requiere lógica de
 * filtrado y ordenamiento dispersa en múltiples partes del código.
 * El cliente no debería conocer la estructura interna de la colección.
 *
 * Solución: Encapsular el recorrido en objetos Iterator independientes.
 * El cliente usa siempre la misma interfaz (hasNext/next) sin importar
 * qué tipo de iterador o colección está usando por debajo.
 *
 * Estructura:
 *   Iterator interface  → IIterator<T>
 *   Aggregate interface → IAggregate<T>
 *   Concrete Iterators  → TaskIterator, PriorityTaskIterator,
 *                         OverdueTaskIterator, ColumnTaskIterator,
 *                         TypeTaskIterator
 *   Concrete Aggregate  → TaskCollection
 */

// ── Interfaces ─────────────────────────────────────────────────────────────────

export interface IIterator<T> {
  hasNext(): boolean;
  next():    T;
  reset():   void;
  current(): T | null;
  toArray(): T[];      // materializa todos los elementos restantes
}

export interface IAggregate<T> {
  createIterator():          IIterator<T>;
  createPriorityIterator():  IIterator<T>;
  createOverdueIterator():   IIterator<T>;
  createColumnIterator(columnId: string): IIterator<T>;
  createTypeIterator(type: string):       IIterator<T>;
  count(): number;
}

// ── Tipo de tarea simplificado para el iterador ────────────────────────────────

export interface TaskItem {
  _id:            string;
  title:          string;
  columnId:       string;
  priority:       string;
  type:           string;
  dueDate?:       Date;
  assignedTo?:    string;
  tags?:          string[];
  createdAt?:     Date;
}

// ── Concrete Iterator 1: Secuencial (todos en orden de creación) ───────────────

export class TaskIterator implements IIterator<TaskItem> {
  private index = 0;

  constructor(private readonly tasks: TaskItem[]) {}

  hasNext():  boolean     { return this.index < this.tasks.length; }
  next():     TaskItem    { return this.tasks[this.index++]; }
  reset():    void        { this.index = 0; }
  current():  TaskItem | null {
    return this.index > 0 ? this.tasks[this.index - 1] : null;
  }
  toArray():  TaskItem[]  {
    const result = this.tasks.slice(this.index);
    this.index = this.tasks.length;
    return result;
  }

  getName(): string { return 'TaskIterator (secuencial)'; }
}

// ── Concrete Iterator 2: Por prioridad (high → medium → low) ──────────────────

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export class PriorityTaskIterator implements IIterator<TaskItem> {
  private index = 0;
  private sorted: TaskItem[];

  constructor(tasks: TaskItem[]) {
    this.sorted = [...tasks].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)
    );
  }

  hasNext():  boolean     { return this.index < this.sorted.length; }
  next():     TaskItem    { return this.sorted[this.index++]; }
  reset():    void        { this.index = 0; }
  current():  TaskItem | null {
    return this.index > 0 ? this.sorted[this.index - 1] : null;
  }
  toArray():  TaskItem[]  {
    const result = this.sorted.slice(this.index);
    this.index = this.sorted.length;
    return result;
  }

  getName(): string { return 'PriorityTaskIterator (high → medium → low)'; }
}

// ── Concrete Iterator 3: Solo tareas vencidas ─────────────────────────────────

export class OverdueTaskIterator implements IIterator<TaskItem> {
  private index    = 0;
  private overdue: TaskItem[];

  constructor(tasks: TaskItem[]) {
    const now = new Date();
    this.overdue = tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.columnId !== 'done'
    ).sort((a, b) =>
      new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );
  }

  hasNext():  boolean     { return this.index < this.overdue.length; }
  next():     TaskItem    { return this.overdue[this.index++]; }
  reset():    void        { this.index = 0; }
  current():  TaskItem | null {
    return this.index > 0 ? this.overdue[this.index - 1] : null;
  }
  toArray():  TaskItem[]  {
    const result = this.overdue.slice(this.index);
    this.index = this.overdue.length;
    return result;
  }

  getName(): string { return 'OverdueTaskIterator (solo vencidas)'; }
}

// ── Concrete Iterator 4: Por columna (estado Kanban) ──────────────────────────

export class ColumnTaskIterator implements IIterator<TaskItem> {
  private index  = 0;
  private column: TaskItem[];

  constructor(tasks: TaskItem[], columnId: string) {
    this.column = tasks.filter(t => t.columnId === columnId);
  }

  hasNext():  boolean     { return this.index < this.column.length; }
  next():     TaskItem    { return this.column[this.index++]; }
  reset():    void        { this.index = 0; }
  current():  TaskItem | null {
    return this.index > 0 ? this.column[this.index - 1] : null;
  }
  toArray():  TaskItem[]  {
    const result = this.column.slice(this.index);
    this.index = this.column.length;
    return result;
  }

  getName(): string { return `ColumnTaskIterator (columna: ${this.column[0]?.columnId || 'N/A'})`; }
}

// ── Concrete Iterator 5: Por tipo de tarea ────────────────────────────────────

export class TypeTaskIterator implements IIterator<TaskItem> {
  private index  = 0;
  private byType: TaskItem[];

  constructor(tasks: TaskItem[], type: string) {
    this.byType = tasks.filter(t => t.type === type);
  }

  hasNext():  boolean     { return this.index < this.byType.length; }
  next():     TaskItem    { return this.byType[this.index++]; }
  reset():    void        { this.index = 0; }
  current():  TaskItem | null {
    return this.index > 0 ? this.byType[this.index - 1] : null;
  }
  toArray():  TaskItem[]  {
    const result = this.byType.slice(this.index);
    this.index = this.byType.length;
    return result;
  }

  getName(): string { return `TypeTaskIterator (tipo: ${this.byType[0]?.type || 'N/A'})`; }
}

// ── Concrete Aggregate: TaskCollection ────────────────────────────────────────

/**
 * Colección de tareas que sabe crear sus propios iteradores.
 * El cliente no necesita saber cómo están almacenadas las tareas.
 */
export class TaskCollection implements IAggregate<TaskItem> {
  constructor(private readonly tasks: TaskItem[]) {}

  /** Iterador por defecto: recorre todas en orden de creación */
  createIterator(): IIterator<TaskItem> {
    return new TaskIterator(this.tasks);
  }

  /** Iterador por prioridad: high primero */
  createPriorityIterator(): IIterator<TaskItem> {
    return new PriorityTaskIterator(this.tasks);
  }

  /** Iterador de vencidas: solo las que pasaron su fecha de entrega */
  createOverdueIterator(): IIterator<TaskItem> {
    return new OverdueTaskIterator(this.tasks);
  }

  /** Iterador por columna Kanban */
  createColumnIterator(columnId: string): IIterator<TaskItem> {
    return new ColumnTaskIterator(this.tasks, columnId);
  }

  /** Iterador por tipo de tarea */
  createTypeIterator(type: string): IIterator<TaskItem> {
    return new TypeTaskIterator(this.tasks, type);
  }

  count(): number { return this.tasks.length; }

  /** Retorna estadísticas sin exponer la colección interna */
  getStats() {
    const now = new Date();
    return {
      total:       this.tasks.length,
      byPriority: {
        high:   this.tasks.filter(t => t.priority === 'high').length,
        medium: this.tasks.filter(t => t.priority === 'medium').length,
        low:    this.tasks.filter(t => t.priority === 'low').length,
      },
      overdue:     this.tasks.filter(
        t => t.dueDate && new Date(t.dueDate) < now && t.columnId !== 'done'
      ).length,
      byColumn:    this.tasks.reduce((acc, t) => {
        acc[t.columnId] = (acc[t.columnId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType:      this.tasks.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// ── Factory de iteradores ──────────────────────────────────────────────────────

export function createIterator(
  tasks:   TaskItem[],
  mode:    string,
  param?:  string
): IIterator<TaskItem> {
  const collection = new TaskCollection(tasks);

  switch (mode) {
    case 'priority': return collection.createPriorityIterator();
    case 'overdue':  return collection.createOverdueIterator();
    case 'column':   return collection.createColumnIterator(param || 'todo');
    case 'type':     return collection.createTypeIterator(param || 'simple');
    default:         return collection.createIterator();
  }
}