/**
 * PATRÓN STATE — Ciclo de vida de una tarea
 *
 * Problema: moveTask() actualizaba el columnId sin validar si la transición
 * era lógicamente permitida, generando saltos arbitrarios entre estados.
 *
 * Solución: Cada estado concreto define qué transiciones puede hacer.
 * El contexto delega la validación al estado actual, eliminando if/switch
 * en el código cliente.
 *
 * Participantes:
 *   - TaskState (interfaz)                          → define handle() y getAllowedTransitions()
 *   - TodoState, InProgressState, ReviewState,
 *     DoneState                                     → estados concretos con sus reglas
 *   - TaskStateContext                              → mantiene el estado actual y delega
 */

// ── Interfaz State ─────────────────────────────────────────────────────────────

export interface TaskState {
  getId(): string;
  getName(): string;
  getAllowedTransitions(): string[];
  handle(targetColumnId: string): string;
}

// ── Estados Concretos ──────────────────────────────────────────────────────────

export class TodoState implements TaskState {
  getId()   { return 'todo'; }
  getName() { return 'Por hacer'; }
  getAllowedTransitions() { return ['inprogress']; }
  handle(target: string): string {
    if (!this.getAllowedTransitions().includes(target))
      throw new Error(`Transición no permitida: ${this.getName()} → "${target}". Permitidas: ${this.getAllowedTransitions().join(', ')}`);
    return target;
  }
}

export class InProgressState implements TaskState {
  getId()   { return 'inprogress'; }
  getName() { return 'En progreso'; }
  getAllowedTransitions() { return ['todo', 'review']; }
  handle(target: string): string {
    if (!this.getAllowedTransitions().includes(target))
      throw new Error(`Transición no permitida: ${this.getName()} → "${target}". Permitidas: ${this.getAllowedTransitions().join(', ')}`);
    return target;
  }
}

export class ReviewState implements TaskState {
  getId()   { return 'review'; }
  getName() { return 'En revisión'; }
  getAllowedTransitions() { return ['inprogress', 'done']; }
  handle(target: string): string {
    if (!this.getAllowedTransitions().includes(target))
      throw new Error(`Transición no permitida: ${this.getName()} → "${target}". Permitidas: ${this.getAllowedTransitions().join(', ')}`);
    return target;
  }
}

export class DoneState implements TaskState {
  getId()   { return 'done'; }
  getName() { return 'Completado'; }
  getAllowedTransitions() { return ['review', 'inprogress']; }
  handle(target: string): string {
    if (!this.getAllowedTransitions().includes(target))
      throw new Error(`Transición no permitida: ${this.getName()} → "${target}". Permitidas: ${this.getAllowedTransitions().join(', ')}`);
    return target;
  }
}

// ── Fábrica de estados ─────────────────────────────────────────────────────────

const STATE_MAP: Record<string, TaskState> = {
  todo:       new TodoState(),
  inprogress: new InProgressState(),
  review:     new ReviewState(),
  done:       new DoneState(),
};

export function getTaskState(columnId: string): TaskState {
  return STATE_MAP[columnId] ?? {
    getId:   () => columnId,
    getName: () => columnId,
    getAllowedTransitions: () => Object.keys(STATE_MAP),
    handle:  (target: string) => target,
  };
}

// ── Contexto ───────────────────────────────────────────────────────────────────

export class TaskStateContext {
  private currentState: TaskState;

  constructor(currentColumnId: string) {
    this.currentState = getTaskState(currentColumnId);
  }

  getState() { return this.currentState; }

  getAllowedTransitions() { return this.currentState.getAllowedTransitions(); }

  transition(targetColumnId: string): string {
    const newColumnId = this.currentState.handle(targetColumnId);
    console.log(`[State] ${this.currentState.getName()} → ${getTaskState(newColumnId).getName()}`);
    this.currentState = getTaskState(newColumnId);
    return newColumnId;
  }

  getStateInfo() {
    return {
      current: { id: this.currentState.getId(), name: this.currentState.getName() },
      allowedTransitions: this.currentState.getAllowedTransitions().map(id => ({
        id, name: getTaskState(id).getName(),
      })),
    };
  }
}