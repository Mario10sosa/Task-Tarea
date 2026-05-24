import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ArrowUpDown, Columns, Filter, Tag, List } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface TaskItem {
  _id: string; title: string; columnId: string;
  priority: string; type: string; dueDate?: string;
}

interface IteratorResponse {
  total: number; returned: number; mode: string;
  stats: { total: number; overdue: number; byPriority: Record<string,number>; byColumn: Record<string,number>; byType: Record<string,number> };
  tasks: TaskItem[];
}

const MODES = [
  { value: 'all',      label: 'Todas (secuencial)',     icon: <List className="w-3.5 h-3.5" /> },
  { value: 'priority', label: 'Por prioridad',           icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
  { value: 'overdue',  label: 'Vencidas',                icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { value: 'column',   label: 'Por columna',             icon: <Columns className="w-3.5 h-3.5" /> },
  { value: 'type',     label: 'Por tipo',                icon: <Tag className="w-3.5 h-3.5" /> },
];

const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:    'bg-green-100 text-green-700 border-green-200',
};

const COLUMNS = [
  { value: 'todo',       label: 'Por hacer' },
  { value: 'inprogress', label: 'En progreso' },
  { value: 'review',     label: 'En revisión' },
  { value: 'done',       label: 'Completado' },
];

const TYPES = [
  { value: 'simple',    label: 'Simple' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'timed',     label: 'Con tiempo' },
  { value: 'BUG',       label: 'Bug' },
  { value: 'FEATURE',   label: 'Feature' },
  { value: 'STORY',     label: 'Story' },
  { value: 'EPIC',      label: 'Epic' },
];

// ── Hook ──────────────────────────────────────────────────────────────────────

function useIterator(projectId: string, mode: string, param?: string) {
  const url = `/projects/${projectId}/iterate?mode=${mode}${param ? `&param=${param}` : ''}`;
  return useQuery<IteratorResponse>({
    queryKey: ['iterator', projectId, mode, param],
    queryFn:  async () => (await api.get(url)).data,
    enabled:  !!projectId,
  });
}

// ── TaskIteratorView ──────────────────────────────────────────────────────────

/**
 * Vista que usa los Iteradores del backend para recorrer tareas
 * con distintos criterios sin conocer la estructura interna.
 */
export function TaskIteratorView({ projectId }: { projectId: string }) {
  const [mode,  setMode]  = useState('all');
  const [param, setParam] = useState<string | undefined>(undefined);

  const { data, isLoading } = useIterator(projectId, mode, param);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setParam(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Controles del iterador */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-muted/20">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold">Iterador:</span>

        <div className="flex flex-wrap gap-2">
          {MODES.map(m => (
            <Button
              key={m.value}
              variant={mode === m.value ? 'default' : 'outline'}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => handleModeChange(m.value)}
            >
              {m.icon}
              {m.label}
            </Button>
          ))}
        </div>

        {/* Selector de parámetro según modo */}
        {mode === 'column' && (
          <Select value={param} onValueChange={setParam}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue placeholder="Columna..." />
            </SelectTrigger>
            <SelectContent>
              {COLUMNS.map(c => (
                <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {mode === 'type' && (
          <Select value={param} onValueChange={setParam}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue placeholder="Tipo..." />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map(t => (
                <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Estadísticas del iterador */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border bg-card text-center">
            <p className="text-xl font-bold">{data.stats.total}</p>
            <p className="text-xs text-muted-foreground">Total tareas</p>
          </div>
          <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 text-center">
            <p className="text-xl font-bold text-red-600">{data.stats.overdue}</p>
            <p className="text-xs text-muted-foreground">Vencidas</p>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <p className="text-xl font-bold text-orange-500">{data.stats.byPriority?.high || 0}</p>
            <p className="text-xs text-muted-foreground">Alta prioridad</p>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <p className="text-xl font-bold text-primary">{data.returned}</p>
            <p className="text-xs text-muted-foreground">Iteradas</p>
          </div>
        </div>
      )}

      {/* Lista de tareas del iterador */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-lg" />)}
        </div>
      ) : !data?.tasks?.length ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {mode === 'overdue' ? 'No hay tareas vencidas 🎉' : 'Sin tareas para este iterador'}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            Mostrando {data.returned} de {data.total} tareas
            {mode !== 'all' && ` — iterador: ${MODES.find(m => m.value === mode)?.label}`}
          </p>
          {data.tasks.map((task, idx) => (
            <div
              key={task._id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-[10px] text-muted-foreground">{task.columnId}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] px-1.5 shrink-0 ${PRIORITY_COLORS[task.priority] || ''}`}>
                {task.priority}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                {task.type}
              </Badge>
              {task.dueDate && new Date(task.dueDate) < new Date() && task.columnId !== 'done' && (
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}