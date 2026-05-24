/**
 * PATRÓN STRATEGY — Algoritmos de ordenamiento de tareas
 *
 * Problema: El listado de tareas necesita ordenarse por diferentes criterios
 * (prioridad, fecha de vencimiento, tipo, responsable, título) según el contexto
 * del usuario. Usar if/switch para cada criterio acopla el código cliente a los
 * algoritmos concretos y dificulta agregar nuevos criterios.
 *
 * Solución: Cada algoritmo de ordenamiento se encapsula en una estrategia
 * intercambiable. El contexto (TaskSorter) delega el ordenamiento a la
 * estrategia activa sin conocer sus detalles internos.
 *
 * Participantes:
 *   - SortStrategy (interfaz)         → define sort(tasks): ITask[]
 *   - PrioritySortStrategy            → high → medium → low
 *   - DueDateSortStrategy             → más próxima primero (overdue al frente)
 *   - TypeSortStrategy                → BUG → EPIC → STORY → FEATURE → simple
 *   - AssigneeSortStrategy            → alfabético por nombre de responsable
 *   - TitleSortStrategy               → alfabético por título
 *   - CreatedAtSortStrategy           → más reciente primero
 *   - TaskSorter (contexto)           → ejecuta la estrategia activa
 */

import { ITask } from '../types';

// ── Interfaz Strategy ──────────────────────────────────────────────────────────

export interface SortStrategy {
  sort(tasks: ITask[]): ITask[];
  getName(): string;
  getDescription(): string;
}

// ── Estrategias Concretas ──────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export class PrioritySortStrategy implements SortStrategy {
  getName()        { return 'priority'; }
  getDescription() { return 'Ordenar por prioridad: Alta → Media → Baja'; }

  sort(tasks: ITask[]): ITask[] {
    return [...tasks].sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority ?? 'medium'] ?? 1;
      const pb = PRIORITY_ORDER[b.priority ?? 'medium'] ?? 1;
      return pa - pb;
    });
  }
}

export class DueDateSortStrategy implements SortStrategy {
  getName()        { return 'dueDate'; }
  getDescription() { return 'Ordenar por fecha de vencimiento: más próxima primero'; }

  sort(tasks: ITask[]): ITask[] {
    return [...tasks].sort((a, b) => {
      // Tareas sin fecha van al final
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }
}

const TYPE_ORDER: Record<string, number> = {
  BUG: 0, EPIC: 1, STORY: 2, FEATURE: 3, simple: 4,
};

export class TypeSortStrategy implements SortStrategy {
  getName()        { return 'type'; }
  getDescription() { return 'Ordenar por tipo: BUG → EPIC → STORY → FEATURE → Simple'; }

  sort(tasks: ITask[]): ITask[] {
    return [...tasks].sort((a, b) => {
      const ta = TYPE_ORDER[(a.type ?? 'simple').toUpperCase()] ?? 4;
      const tb = TYPE_ORDER[(b.type ?? 'simple').toUpperCase()] ?? 4;
      return ta - tb;
    });
  }
}

export class AssigneeSortStrategy implements SortStrategy {
  getName()        { return 'assignee'; }
  getDescription() { return 'Ordenar por responsable: alfabético'; }

  sort(tasks: ITask[]): ITask[] {
    return [...tasks].sort((a, b) => {
      // assignedTo puede ser ObjectId o string; comparamos toString()
      const aa = a.assignedTo ? a.assignedTo.toString() : 'zzz';
      const ab = b.assignedTo ? b.assignedTo.toString() : 'zzz';
      return aa.localeCompare(ab);
    });
  }
}

export class TitleSortStrategy implements SortStrategy {
  getName()        { return 'title'; }
  getDescription() { return 'Ordenar por título: A → Z'; }

  sort(tasks: ITask[]): ITask[] {
    return [...tasks].sort((a, b) =>
      (a.title ?? '').localeCompare(b.title ?? '', 'es', { sensitivity: 'base' })
    );
  }
}

export class CreatedAtSortStrategy implements SortStrategy {
  getName()        { return 'createdAt'; }
  getDescription() { return 'Ordenar por fecha de creación: más reciente primero'; }

  sort(tasks: ITask[]): ITask[] {
    return [...tasks].sort((a, b) => {
      const da = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const db = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return db - da;
    });
  }
}

// ── Registro de estrategias disponibles ───────────────────────────────────────

const STRATEGIES: Record<string, SortStrategy> = {
  priority:  new PrioritySortStrategy(),
  dueDate:   new DueDateSortStrategy(),
  type:      new TypeSortStrategy(),
  assignee:  new AssigneeSortStrategy(),
  title:     new TitleSortStrategy(),
  createdAt: new CreatedAtSortStrategy(),
};

export function getStrategy(name: string): SortStrategy {
  const strategy = STRATEGIES[name];
  if (!strategy) throw new Error(`Estrategia desconocida: "${name}". Disponibles: ${Object.keys(STRATEGIES).join(', ')}`);
  return strategy;
}

export function listStrategies() {
  return Object.values(STRATEGIES).map(s => ({
    id:          s.getName(),
    description: s.getDescription(),
  }));
}

// ── Contexto ───────────────────────────────────────────────────────────────────

export class TaskSorter {
  private strategy: SortStrategy;

  constructor(strategyName: string) {
    this.strategy = getStrategy(strategyName);
  }

  /** Cambia la estrategia en tiempo de ejecución sin modificar el cliente */
  setStrategy(strategyName: string) {
    this.strategy = getStrategy(strategyName);
  }

  sort(tasks: ITask[]): ITask[] {
    console.log(`[Strategy] Ordenando ${tasks.length} tareas con: ${this.strategy.getName()}`);
    return this.strategy.sort(tasks);
  }

  getStrategyInfo() {
    return {
      active:     this.strategy.getName(),
      description: this.strategy.getDescription(),
      available:  listStrategies(),
    };
  }
}