/**
 * PATRÓN FLYWEIGHT — Elementos Compartidos entre Proyectos/Tareas
 *
 * Problema: Las etiquetas de color (labels) se repiten en muchas tareas.
 * Si cada tarea almacena su propio objeto { name, color }, se duplican
 * datos en memoria que son idénticos. Con miles de tareas esto es ineficiente.
 *
 * Solución: Separar el estado intrínseco (name, color — inmutable, compartible)
 * del estado extrínseco (a qué tarea pertenece — variable, no compartible).
 * La FlyweightFactory mantiene un pool de instancias únicas y retorna
 * la misma instancia cuando se pide la misma combinación name+color.
 *
 * Estructura:
 *   Flyweight        → LabelFlyweight       (estado intrínseco compartido)
 *   FlyweightFactory → LabelFlyweightFactory (pool de instancias)
 *   Context          → TaskLabelContext      (estado extrínseco por tarea)
 *   Client           → label.service         (usa la factory, no crea instancias directas)
 */

// ── Flyweight ──────────────────────────────────────────────────────────────────

/**
 * Estado intrínseco: datos que son IGUALES para todas las tareas
 * que usan la misma etiqueta. Se comparte una sola instancia en el pool.
 */
export class LabelFlyweight {
  private readonly name:  string;
  private readonly color: string;

  constructor(name: string, color: string) {
    this.name  = name.trim().toLowerCase();
    this.color = color.toLowerCase();
  }

  getName():  string { return this.name; }
  getColor(): string { return this.color; }

  /**
   * Clave única que identifica este Flyweight en el pool.
   */
  getKey(): string { return `${this.name}::${this.color}`; }

  /**
   * Renderiza la etiqueta combinando su estado intrínseco con el
   * estado extrínseco (taskId) recibido como parámetro.
   * El Flyweight NUNCA guarda el taskId — solo lo usa al renderizar.
   */
  render(taskId: string): object {
    return {
      taskId,
      label:     { name: this.name, color: this.color },
      sharedKey: this.getKey(),
    };
  }

  toJSON(): object {
    return { name: this.name, color: this.color, key: this.getKey() };
  }
}

// ── FlyweightFactory ───────────────────────────────────────────────────────────

/**
 * Mantiene el pool de Flyweights.
 * Garantiza que solo existe UNA instancia por combinación name+color.
 * Si 500 tareas usan la etiqueta "bug #ef4444", todas apuntan al mismo objeto.
 */
export class LabelFlyweightFactory {
  private static pool: Map<string, LabelFlyweight> = new Map();
  private static requestCount = 0;
  private static reuseCount   = 0;

  /**
   * Retorna el Flyweight existente o crea uno nuevo si no existe en el pool.
   */
  static getLabel(name: string, color: string): LabelFlyweight {
    const key = `${name.trim().toLowerCase()}::${color.toLowerCase()}`;
    this.requestCount++;

    if (this.pool.has(key)) {
      this.reuseCount++;
      return this.pool.get(key)!;
    }

    // Solo se crea una nueva instancia si no existe en el pool
    const flyweight = new LabelFlyweight(name, color);
    this.pool.set(key, flyweight);
    return flyweight;
  }

  /**
   * Estadísticas del pool: cuántas instancias únicas hay,
   * cuántas veces se reutilizó vs cuántas veces se creó una nueva.
   * Útil para demostrar el beneficio de memoria del patrón.
   */
  static getStats(): object {
    return {
      poolSize:      this.pool.size,
      totalRequests: this.requestCount,
      reuses:        this.reuseCount,
      newCreations:  this.requestCount - this.reuseCount,
      reuseRate:     this.requestCount > 0
        ? `${Math.round((this.reuseCount / this.requestCount) * 100)}%`
        : '0%',
      pool: Array.from(this.pool.values()).map(f => f.toJSON()),
    };
  }

  static getAllLabels(): LabelFlyweight[] {
    return Array.from(this.pool.values());
  }

  /**
   * Precarga el pool con etiquetas predefinidas del sistema.
   * Evita crear instancias duplicadas desde el primer uso.
   */
  static preload(labels: Array<{ name: string; color: string }>): void {
    labels.forEach(({ name, color }) => this.getLabel(name, color));
  }

  static getPoolSize(): number { return this.pool.size; }

  static reset(): void {
    this.pool.clear();
    this.requestCount = 0;
    this.reuseCount   = 0;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

/**
 * Estado extrínseco: datos que varían por tarea (el taskId).
 * El Context referencia el Flyweight del pool — no duplica sus datos.
 */
export class TaskLabelContext {
  private flyweight: LabelFlyweight;

  constructor(
    private readonly taskId: string,
    name: string,
    color: string
  ) {
    // Obtener del pool — nunca crear una instancia directamente
    this.flyweight = LabelFlyweightFactory.getLabel(name, color);
  }

  getTaskId():      string { return this.taskId; }
  getName():        string { return this.flyweight.getName(); }
  getColor():       string { return this.flyweight.getColor(); }
  getFlyweight():   LabelFlyweight { return this.flyweight; }

  render(): object {
    return this.flyweight.render(this.taskId);
  }

  toLabel(): { name: string; color: string } {
    return { name: this.flyweight.getName(), color: this.flyweight.getColor() };
  }
}

// ── Etiquetas predefinidas del sistema ────────────────────────────────────────

export const SYSTEM_LABELS = [
  { name: 'bug',          color: '#ef4444' },
  { name: 'feature',      color: '#3b82f6' },
  { name: 'mejora',       color: '#8b5cf6' },
  { name: 'urgente',      color: '#f97316' },
  { name: 'revision',     color: '#eab308' },
  { name: 'bloqueado',    color: '#6b7280' },
  { name: 'completado',   color: '#22c55e' },
  { name: 'en progreso',  color: '#06b6d4' },
];

// Precargar el pool con etiquetas del sistema al importar el módulo
LabelFlyweightFactory.preload(SYSTEM_LABELS);