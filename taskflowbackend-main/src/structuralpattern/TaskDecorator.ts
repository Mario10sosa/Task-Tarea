

// ── Tipos de datos ─────────────────────────────────────────────────────────────

export interface TaskLabel {
  name: string;
  color: string;   // hex, ej: '#FF5733'
}

export interface TaskAttachment {
  filename:     string;
  originalName: string;
  mimetype:     string;
  size:         number;   // bytes
  url:          string;
  uploadedAt:   Date;
}

export interface TaskPresentation {
  id:           string;
  title:        string;
  type:         string;
  priority:     string;
  columnId:     string;
  labels:       TaskLabel[];
  attachments:  TaskAttachment[];
  badges:       TaskBadge[];       // indicadores visuales agregados por decoradores
  cssClasses:   string[];          // clases CSS adicionales
  isOverdue:    boolean;
  daysUntilDue: number | null;
}

export interface TaskBadge {
  text:  string;
  color: string;   // 'red' | 'yellow' | 'green' | 'blue' | 'gray'
  icon?: string;   // emoji o nombre de icono
}

// ── Component Interface ────────────────────────────────────────────────────────

export interface TaskPresenter {
  present(): TaskPresentation;
}

// ── Concrete Component ─────────────────────────────────────────────────────────

/**
 * Presentación base de una tarea: sin decoraciones adicionales.
 */
export class BaseTaskPresenter implements TaskPresenter {
  constructor(
    private readonly task: {
      _id: any;
      title: string;
      type: string;
      priority: string;
      columnId: string;
      tags?: string[];
      attachments?: TaskAttachment[];
      dueDate?: Date;
      labels?: TaskLabel[];
    }
  ) {}

  present(): TaskPresentation {
    return {
      id:           this.task._id.toString(),
      title:        this.task.title,
      type:         this.task.type,
      priority:     this.task.priority,
      columnId:     this.task.columnId,
      labels:       this.task.labels ?? [],
      attachments:  this.task.attachments ?? [],
      badges:       [],
      cssClasses:   [],
      isOverdue:    false,
      daysUntilDue: null,
    };
  }
}

// ── Base Decorator ─────────────────────────────────────────────────────────────

/**
 * Decorator abstracto: delega al componente envuelto y permite
 * que las subclases extiendan la presentación.
 */
export abstract class TaskDecorator implements TaskPresenter {
  constructor(protected readonly wrapped: TaskPresenter) {}

  present(): TaskPresentation {
    return this.wrapped.present();
  }
}

// ── Concrete Decorator 1: Etiquetas de color ───────────────────────────────────

/**
 * Agrega etiquetas (labels) con color personalizado a la presentación.
 * Cada etiqueta genera un badge visual en la tarjeta.
 */
export class LabelDecorator extends TaskDecorator {
  constructor(
    wrapped: TaskPresenter,
    private readonly labels: TaskLabel[]
  ) {
    super(wrapped);
  }

  present(): TaskPresentation {
    const base = super.present();

    const labelBadges: TaskBadge[] = this.labels.map((label) => ({
      text:  label.name,
      color: label.color,
      icon:  '🏷️',
    }));

    return {
      ...base,
      labels:     [...base.labels, ...this.labels],
      badges:     [...base.badges, ...labelBadges],
      cssClasses: [...base.cssClasses, 'has-labels'],
    };
  }
}

// ── Concrete Decorator 2: Archivos adjuntos ────────────────────────────────────

/**
 * Agrega un badge de adjuntos con la cantidad de archivos.
 * Si hay adjuntos, también agrega una clase CSS para mostrar el icono.
 */
export class AttachmentDecorator extends TaskDecorator {
  constructor(
    wrapped: TaskPresenter,
    private readonly attachments: TaskAttachment[]
  ) {
    super(wrapped);
  }

  present(): TaskPresentation {
    const base = super.present();

    if (this.attachments.length === 0) return base;

    const badge: TaskBadge = {
      text:  `${this.attachments.length} adjunto${this.attachments.length > 1 ? 's' : ''}`,
      color: 'blue',
      icon:  '📎',
    };

    return {
      ...base,
      attachments: [...base.attachments, ...this.attachments],
      badges:      [...base.badges, badge],
      cssClasses:  [...base.cssClasses, 'has-attachments'],
    };
  }
}

// ── Concrete Decorator 3: Indicador de vencimiento ────────────────────────────

/**
 * Calcula si la tarea está vencida o próxima a vencer y agrega
 * el badge y clase CSS correspondiente.
 */
export class DueDateDecorator extends TaskDecorator {
  constructor(
    wrapped: TaskPresenter,
    private readonly dueDate: Date | undefined
  ) {
    super(wrapped);
  }

  present(): TaskPresentation {
    const base = super.present();

    if (!this.dueDate) return base;

    const now      = new Date();
    const due      = new Date(this.dueDate);
    const diffMs   = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;
    const isDueSoon = diffDays >= 0 && diffDays <= 2;

    let badge: TaskBadge | null = null;
    let cssClass = '';

    if (isOverdue) {
      badge    = { text: `Vencida hace ${Math.abs(diffDays)} día(s)`, color: 'red', icon: '🔴' };
      cssClass = 'is-overdue';
    } else if (isDueSoon) {
      badge    = { text: `Vence en ${diffDays} día(s)`, color: 'yellow', icon: '⚠️' };
      cssClass = 'due-soon';
    }

    return {
      ...base,
      isOverdue:    isOverdue,
      daysUntilDue: diffDays,
      badges:       badge ? [...base.badges, badge] : base.badges,
      cssClasses:   cssClass ? [...base.cssClasses, cssClass] : base.cssClasses,
    };
  }
}

// ── Concrete Decorator 4: Prioridad destacada ──────────────────────────────────

/**
 * Resalta visualmente las tareas de alta prioridad o urgentes.
 */
export class PriorityDecorator extends TaskDecorator {
  present(): TaskPresentation {
    const base = super.present();

    if (base.priority !== 'high') return base;

    const badge: TaskBadge = {
      text:  'Alta prioridad',
      color: 'red',
      icon:  '🔥',
    };

    return {
      ...base,
      badges:     [...base.badges, badge],
      cssClasses: [...base.cssClasses, 'high-priority'],
    };
  }
}

// ── Factory de decoración ──────────────────────────────────────────────────────

/**
 * Aplica automáticamente todos los decoradores relevantes a una tarea.
 * El cliente recibe la presentación enriquecida sin conocer qué decoradores se usaron.
 */
export function decorateTask(task: any): TaskPresentation {
  let presenter: TaskPresenter = new BaseTaskPresenter(task);

  // Decorar con etiquetas si las tiene
  if (task.labels && task.labels.length > 0) {
    presenter = new LabelDecorator(presenter, task.labels);
  }

  // Decorar con adjuntos si los tiene
  if (task.attachments && task.attachments.length > 0) {
    presenter = new AttachmentDecorator(presenter, task.attachments);
  }

  // Decorar con fecha de vencimiento si existe
  if (task.dueDate) {
    presenter = new DueDateDecorator(presenter, task.dueDate);
  }

  // Decorar con prioridad alta
  if (task.priority === 'high') {
    presenter = new PriorityDecorator(presenter);
  }

  return presenter.present();
}