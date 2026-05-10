import { TaskFlyweight } from "./TaskFlyweight";

export class TaskFlyweightFactory {
  private static flyweights: Record<string, TaskFlyweight> = {
    BUG: {
      type: "BUG",
      defaultPriority: "high",
      defaultTags: ["bug"],
      defaultChecklist: [
        { text: "Reproducir el error", done: false },
        { text: "Identificar causa raíz", done: false },
        { text: "Aplicar corrección", done: false },
        { text: "Verificar en ambiente de pruebas", done: false },
      ],
    },

    FEATURE: {
      type: "FEATURE",
      defaultPriority: "medium",
      defaultTags: ["feature"],
      defaultDuration: 120,
    },

    STORY: {
      type: "STORY",
      defaultPriority: "medium",
      defaultTags: ["story"],
      defaultChecklist: [
        { text: "Definir criterios de aceptación", done: false },
        { text: "Revisión con el equipo", done: false },
        { text: "Implementación completada", done: false },
        { text: "Pruebas de aceptación aprobadas", done: false },
      ],
    },

    EPIC: {
      type: "EPIC",
      defaultPriority: "low",
      defaultTags: ["epic"],
      defaultDuration: 480,
    },
  };

  static getFlyweight(type: string): TaskFlyweight | null {
    return this.flyweights[type] || null;
  }
}