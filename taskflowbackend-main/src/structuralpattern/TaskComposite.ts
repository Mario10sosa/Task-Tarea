

// ── Component Interface ────────────────────────────────────────────────────────

export interface TaskComponent {
  getId(): string;
  getTitle(): string;

  /**
   * Retorna un valor entre 0 y 100 representando el % de completitud.
   * - Leaf: basado en columnId ('done') o checklist
   * - Composite: promedio ponderado de sus hijos
   */
  getProgress(): number;

  /**
   * Retorna la representación completa del nodo con sus hijos (si los tiene).
   */
  toJSON(): TaskNode;
}

export interface TaskNode {
  id: string;
  title: string;
  progress: number;          // 0–100
  columnId: string;
  priority: string;
  type: string;
  subtasks?: TaskNode[];     // solo presente en CompositeTask
  subtaskCount?: number;
  completedSubtasks?: number;
}

// ── Leaf ───────────────────────────────────────────────────────────────────────

/**
 * Leaf: tarea sin hijos. Calcula su propio progreso según:
 * 1. Si está en la columna 'done' → 100%
 * 2. Si tiene checklist → % de ítems completados
 * 3. En otro caso → 0%
 */
export class LeafTask implements TaskComponent {
  constructor(
    private readonly task: {
      _id: any;
      title: string;
      columnId: string;
      priority: string;
      type: string;
      checklist?: Array<{ text: string; done: boolean }>;
    }
  ) {}

  getId(): string    { return this.task._id.toString(); }
  getTitle(): string { return this.task.title; }

  getProgress(): number {
    // Columna "done" = completada al 100%
    if (this.task.columnId === 'done') return 100;

    // Si tiene checklist, el progreso es proporcional
    const list = this.task.checklist ?? [];
    if (list.length > 0) {
      const done = list.filter((i) => i.done).length;
      return Math.round((done / list.length) * 100);
    }

    return 0;
  }

  toJSON(): TaskNode {
    return {
      id:       this.getId(),
      title:    this.getTitle(),
      progress: this.getProgress(),
      columnId: this.task.columnId,
      priority: this.task.priority,
      type:     this.task.type,
    };
  }
}

// ── Composite ─────────────────────────────────────────────────────────────────

/**
 * Composite: tarea que contiene subtareas (hijos).
 * Su progreso es el promedio del progreso de todos sus hijos.
 * Si no tiene hijos se comporta igual que un Leaf.
 */
export class CompositeTask implements TaskComponent {
  private children: TaskComponent[] = [];

  constructor(
    private readonly task: {
      _id: any;
      title: string;
      columnId: string;
      priority: string;
      type: string;
      checklist?: Array<{ text: string; done: boolean }>;
    }
  ) {}

  getId(): string    { return this.task._id.toString(); }
  getTitle(): string { return this.task.title; }

  add(child: TaskComponent): void {
    this.children.push(child);
  }

  getProgress(): number {
    if (this.children.length === 0) {
      // Sin hijos: comportamiento igual al Leaf
      if (this.task.columnId === 'done') return 100;
      const list = this.task.checklist ?? [];
      if (list.length > 0) {
        const done = list.filter((i) => i.done).length;
        return Math.round((done / list.length) * 100);
      }
      return 0;
    }

    // Con hijos: promedio ponderado del progreso de cada hijo
    const total = this.children.reduce((sum, child) => sum + child.getProgress(), 0);
    return Math.round(total / this.children.length);
  }

  toJSON(): TaskNode {
    const subtasks = this.children.map((c) => c.toJSON());
    const completed = subtasks.filter((s) => s.progress === 100).length;

    return {
      id:                this.getId(),
      title:             this.getTitle(),
      progress:          this.getProgress(),
      columnId:          this.task.columnId,
      priority:          this.task.priority,
      type:              this.task.type,
      subtasks,
      subtaskCount:      subtasks.length,
      completedSubtasks: completed,
    };
  }
}

// ── Builder del árbol Composite ───────────────────────────────────────────────

/**
 * Construye el árbol TaskComponent a partir de los documentos planos de MongoDB.
 * Soporta árboles de profundidad arbitraria.
 */
export function buildTaskTree(
  tasks: any[],
  rootId: string | null = null
): TaskComponent[] {
  // Agrupar subtareas por parentTaskId
  const childrenMap = new Map<string | null, any[]>();

  for (const task of tasks) {
    const parentKey = task.parentTaskId ? task.parentTaskId.toString() : null;
    if (!childrenMap.has(parentKey)) childrenMap.set(parentKey, []);
    childrenMap.get(parentKey)!.push(task);
  }

  function buildNode(task: any): TaskComponent {
    const taskId = task._id.toString();
    const children = childrenMap.get(taskId) ?? [];

    if (children.length === 0) {
      return new LeafTask(task);
    }

    const composite = new CompositeTask(task);
    for (const child of children) {
      composite.add(buildNode(child));
    }
    return composite;
  }

  const roots = childrenMap.get(rootId) ?? [];
  return roots.map(buildNode);
}