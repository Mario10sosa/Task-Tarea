import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCircle2, Clock, AlertTriangle, BarChart3, Layers, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalTasks:      number;
  completedTasks:  number;
  inProgressTasks: number;
  overdueTasks:    number;
  progress:        number;
  tasksByType:     Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksByColumn:   Record<string, number>;
}

interface DashboardData {
  project:       any;
  boards:        any[];
  stats:         DashboardStats;
  recentActivity: any[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Llama al endpoint Facade que retorna TODO en una sola petición:
 * proyecto + boards + tareas + métricas calculadas.
 */
function useProjectDashboard(projectId: string) {
  return useQuery<DashboardData>({
    queryKey: ['project-dashboard', projectId],
    queryFn:  async () => (await api.get(`/projects/${projectId}/dashboard`)).data,
    enabled:  !!projectId,
  });
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border bg-card`}>
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── DistributionBar ───────────────────────────────────────────────────────────

function DistributionBar({
  label, data, colors,
}: { label: string; data: Record<string, number>; colors: Record<string, string> }) {
  const total  = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex rounded-full overflow-hidden h-3">
        {Object.entries(data).map(([key, count]) => (
          <div
            key={key}
            className={colors[key] || 'bg-gray-300'}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${key}: ${count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(data).map(([key, count]) => (
          <span key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${colors[key] || 'bg-gray-300'}`} />
            {key} ({count})
          </span>
        ))}
      </div>
    </div>
  );
}

// ── ProjectDashboard ──────────────────────────────────────────────────────────

export function ProjectDashboard({ projectId }: { projectId: string }) {
  const { data, isLoading, isError } = useProjectDashboard(projectId);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
        <div className="h-40 bg-muted rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-muted-foreground text-center py-8">No se pudo cargar el dashboard.</p>;
  }

  const { stats, boards, recentActivity } = data;

  const typeColors: Record<string, string> = {
    BUG:         'bg-red-500',
    FEATURE:     'bg-blue-500',
    STORY:       'bg-purple-500',
    EPIC:        'bg-indigo-500',
    simple:      'bg-gray-400',
    checklist:   'bg-yellow-500',
    timed:       'bg-green-500',
  };

  const priorityColors: Record<string, string> = {
    high:   'bg-red-500',
    medium: 'bg-yellow-500',
    low:    'bg-green-500',
  };

  return (
    <div className="space-y-6">

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Layers className="w-5 h-5 text-blue-600" />}
          label="Total de tareas"
          value={stats.totalTasks}
          color="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          label="Completadas"
          value={stats.completedTasks}
          color="bg-green-50"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          label="En progreso"
          value={stats.inProgressTasks}
          color="bg-yellow-50"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          label="Vencidas"
          value={stats.overdueTasks}
          color="bg-red-50"
        />
      </div>

      {/* Progreso general */}
      <div className="p-4 rounded-xl border bg-card space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Progreso general del proyecto</span>
          </div>
          <span className="text-2xl font-bold tabular-nums text-primary">{stats.progress}%</span>
        </div>
        <Progress value={stats.progress} className="h-3" />
        <p className="text-xs text-muted-foreground">
          {stats.completedTasks} de {stats.totalTasks} tareas completadas
        </p>
      </div>

      {/* Distribuciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-card space-y-4">
          <DistributionBar label="Por tipo"     data={stats.tasksByType}     colors={typeColors} />
          <DistributionBar label="Por prioridad" data={stats.tasksByPriority} colors={priorityColors} />
        </div>

        {/* Tableros */}
        <div className="p-4 rounded-xl border bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Tableros ({boards.length})</span>
          </div>
          {boards.map((board: any) => (
            <div key={board._id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <span className="text-sm">{board.name}</span>
              <Badge variant="secondary" className="text-xs">
                {board.columns?.length ?? 0} columnas
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Actividad reciente */}
      {recentActivity.length > 0 && (
        <div className="p-4 rounded-xl border bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Actividad reciente</span>
          </div>
          <div className="space-y-2">
            {recentActivity.map((item: any) => (
              <div key={item.taskId} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
                <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                <span className="text-sm flex-1 truncate">{item.title}</span>
                <Badge variant="outline" className="text-xs shrink-0">{item.columnId}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}