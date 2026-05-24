import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bell, ArrowRight, UserCheck, AlertTriangle, Clock, Plus, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface TaskEvent {
  type:       string;
  taskId:     string;
  taskTitle:  string;
  projectId?: string;
  actorId?:   string;
  payload?:   Record<string, any>;
  timestamp:  string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

function useTaskEvents(taskId?: string) {
  const url = taskId ? `/tasks/${taskId}/events` : '/tasks/events/log';
  return useQuery<TaskEvent[]>({
    queryKey: ['task-events', taskId || 'all'],
    queryFn:  async () => (await api.get(url)).data,
    refetchInterval: 15_000, // polling cada 15 seg
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function eventIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    'task:created':   <Plus className="w-3.5 h-3.5 text-green-500" />,
    'task:moved':     <ArrowRight className="w-3.5 h-3.5 text-blue-500" />,
    'task:assigned':  <UserCheck className="w-3.5 h-3.5 text-purple-500" />,
    'task:updated':   <Edit className="w-3.5 h-3.5 text-yellow-500" />,
    'task:due_soon':  <Clock className="w-3.5 h-3.5 text-orange-500" />,
    'task:overdue':   <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
  };
  return icons[type] ?? <Bell className="w-3.5 h-3.5 text-muted-foreground" />;
}

function eventLabel(event: TaskEvent): string {
  switch (event.type) {
    case 'task:created':  return `Tarea creada`;
    case 'task:moved':    return `Movida: ${event.payload?.from} → ${event.payload?.to}`;
    case 'task:assigned': return `Asignada`;
    case 'task:updated':  return `Actualizada (${(event.payload?.updates || []).join(', ')})`;
    case 'task:due_soon': return `Vence en ${event.payload?.daysLeft} día(s)`;
    case 'task:overdue':  return `Vencida hace ${event.payload?.daysOverdue} día(s)`;
    default: return event.type;
  }
}

function eventColor(type: string): string {
  const colors: Record<string, string> = {
    'task:created':   'bg-green-50 text-green-700 border-green-200',
    'task:moved':     'bg-blue-50 text-blue-700 border-blue-200',
    'task:assigned':  'bg-purple-50 text-purple-700 border-purple-200',
    'task:updated':   'bg-yellow-50 text-yellow-700 border-yellow-200',
    'task:due_soon':  'bg-orange-50 text-orange-700 border-orange-200',
    'task:overdue':   'bg-red-50 text-red-700 border-red-200',
  };
  return colors[type] || 'bg-muted text-muted-foreground';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Ahora';
  if (mins < 60) return `Hace ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

// ── TaskEventFeed ─────────────────────────────────────────────────────────────

/**
 * Feed de eventos del Observer — muestra los cambios en tiempo real.
 * Si se pasa taskId, muestra solo los eventos de esa tarea.
 * Si no, muestra el log global.
 */
export function TaskEventFeed({ taskId, maxItems = 10 }: { taskId?: string; maxItems?: number }) {
  const { data: events = [], isLoading } = useTaskEvents(taskId);

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded-lg" />)}
      </div>
    );
  }

  const recent = [...events].reverse().slice(0, maxItems);

  if (recent.length === 0) {
    return (
      <div className="text-center py-6">
        <Bell className="w-6 h-6 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Sin eventos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map((event, idx) => (
        <div
          key={`${event.taskId}-${event.type}-${idx}`}
          className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card hover:bg-muted/20 transition-colors"
        >
          <div className="mt-0.5 shrink-0">{eventIcon(event.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{event.taskTitle}</p>
            <p className="text-[10px] text-muted-foreground">{eventLabel(event)}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className={`text-[9px] px-1.5 h-4 ${eventColor(event.type)}`}>
              {event.type.split(':')[1]}
            </Badge>
            <span className="text-[9px] text-muted-foreground">{timeAgo(event.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}