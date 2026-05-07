import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface TaskNode {
  id: string;
  title: string;
  progress: number;
  columnId: string;
  priority: string;
  type: string;
  subtasks?: TaskNode[];
  subtaskCount?: number;
  completedSubtasks?: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

function useTaskProgress(taskId: string) {
  return useQuery<TaskNode>({
    queryKey: ['task-progress', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}/progress`);
      return data;
    },
    enabled: !!taskId,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function progressColor(progress: number): string {
  if (progress === 100) return 'text-green-500';
  if (progress >= 50)   return 'text-blue-500';
  if (progress > 0)     return 'text-yellow-500';
  return 'text-muted-foreground';
}

function priorityColor(priority: string): string {
  const map: Record<string, string> = {
    high:   'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low:    'bg-green-100 text-green-700 border-green-200',
  };
  return map[priority] ?? 'bg-muted text-muted-foreground';
}

// ── SubtaskRow ────────────────────────────────────────────────────────────────

function SubtaskRow({ node, depth = 0 }: { node: TaskNode; depth?: number }) {
  const isCompleted = node.progress === 100;
  const hasChildren = (node.subtasks?.length ?? 0) > 0;

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors"
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        {/* Icono estado */}
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
        ) : (
          <Circle className="w-4 h-4 shrink-0 text-muted-foreground/40" />
        )}

        {/* Título */}
        <span className={`text-sm flex-1 truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
          {node.title}
        </span>

        {/* Badges */}
        <Badge variant="outline" className={`text-[9px] px-1.5 h-4 ${priorityColor(node.priority)}`}>
          {node.priority}
        </Badge>

        {/* Progreso numérico */}
        <span className={`text-xs font-bold tabular-nums w-8 text-right ${progressColor(node.progress)}`}>
          {node.progress}%
        </span>

        {/* Indicador de hijos */}
        {hasChildren && (
          <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
        )}
      </div>

      {/* Barra de progreso si tiene hijos */}
      {hasChildren && (
        <div className="px-2" style={{ paddingLeft: `${28 + depth * 20}px` }}>
          <Progress value={node.progress} className="h-1 bg-muted" />
        </div>
      )}

      {/* Subtareas recursivas */}
      {node.subtasks?.map((child) => (
        <SubtaskRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── SubtaskProgress (componente principal exportado) ──────────────────────────

/**
 * Muestra el árbol de subtareas con el progreso calculado por el patrón Composite.
 * Úsalo dentro del detalle de una tarea.
 */
export function SubtaskProgress({ taskId }: { taskId: string }) {
  const { data, isLoading, isError } = useTaskProgress(taskId);

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No se pudo cargar el progreso.
      </p>
    );
  }

  const hasSubtasks = (data.subtasks?.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      {/* Barra de progreso general */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Progreso general
          </span>
          <span className={`text-sm font-bold tabular-nums ${progressColor(data.progress)}`}>
            {data.progress}%
          </span>
        </div>
        <Progress value={data.progress} className="h-2" />
        {hasSubtasks && (
          <p className="text-xs text-muted-foreground">
            {data.completedSubtasks} de {data.subtaskCount} subtareas completadas
          </p>
        )}
      </div>

      {/* Árbol de subtareas */}
      {hasSubtasks ? (
        <div className="border rounded-xl overflow-hidden divide-y divide-border/40">
          <div className="px-3 py-2 bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Subtareas
            </span>
          </div>
          <div className="p-1">
            {data.subtasks!.map((child) => (
              <SubtaskRow key={child.id} node={child} depth={0} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Esta tarea no tiene subtareas.
        </p>
      )}
    </div>
  );
}