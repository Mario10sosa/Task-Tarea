import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, AlertTriangle, BarChart2, FileText } from 'lucide-react';

interface VisitorType {
  id:          string;
  description: string;
}

interface VisitorResult {
  visitor:   string;
  projectId: string;
  total:     number;
  result:    any;
}

interface Props {
  projectId: string;
}

const VISITOR_ICONS: Record<string, typeof Eye> = {
  metrics:  BarChart2,
  validate: AlertTriangle,
  summary:  FileText,
};

export function TaskVisitorPanel({ projectId }: Props) {
  const [selected, setSelected] = useState('metrics');

  const { data: typesData } = useQuery<{ visitors: VisitorType[] }>({
    queryKey: ['visitor-types'],
    queryFn:  async () => {
      const res = await api.get(`/projects/${projectId}/visit/types`);
      return res.data;
    },
    enabled: !!projectId,
  });

  const { data, isLoading } = useQuery<VisitorResult>({
    queryKey: ['visitor-result', projectId, selected],
    queryFn:  async () => {
      const res = await api.get(`/projects/${projectId}/visit?visitor=${selected}`);
      return res.data;
    },
    enabled: !!projectId,
  });

  const visitors = typesData?.visitors ?? [
    { id: 'metrics',  description: 'Métricas completas' },
    { id: 'validate', description: 'Validación de tareas' },
    { id: 'summary',  description: 'Resumen ejecutivo' },
  ];


  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground/80">Visitor — Análisis de Tareas</span>
        {data && (
          <Badge variant="outline" className="text-[10px] px-1.5">
            {data.total} tareas raíz
          </Badge>
        )}
      </div>

      {/* Selector de visitor */}
      <div className="flex gap-2 flex-wrap">
        {visitors.map(v => {
          const VIcon = VISITOR_ICONS[v.id] ?? Eye;
          return (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                selected === v.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/20 border-border/40 hover:bg-muted/50 text-foreground/70'
              }`}
            >
              <VIcon className="w-3 h-3" />
              {v.description}
            </button>
          );
        })}
      </div>

      {/* Resultado del Visitor */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-6">Aplicando visitor...</p>
      ) : !data ? null : (
        <div className="flex flex-col gap-3">
          {/* Metrics Visitor */}
          {selected === 'metrics' && data.result && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Total tareas',     value: data.result.total },
                { label: 'Completadas',      value: `${data.result.completedTasks} (${data.result.completionRate})` },
                { label: 'Horas estimadas',  value: `${data.result.totalHoursEstimated}h` },
                { label: 'Vencidas',         value: data.result.overdue, alert: data.result.overdue > 0 },
                { label: 'Sin responsable',  value: data.result.unassigned },
                { label: 'Progreso checklist', value: data.result.checklistProgress },
                { label: 'Con etiquetas',    value: data.result.withLabels },
                { label: 'Con checklist',    value: data.result.withChecklist },
              ].map(item => (
                <div key={item.label} className={`p-2.5 rounded-lg border ${item.alert ? 'border-orange-300/50 bg-orange-500/5' : 'border-border/40 bg-muted/20'}`}>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className={`text-sm font-bold ${item.alert ? 'text-orange-500' : ''}`}>{item.value}</p>
                </div>
              ))}

              {/* Por tipo */}
              {data.result.byType && Object.keys(data.result.byType).length > 0 && (
                <div className="col-span-2 p-2.5 rounded-lg border border-border/40 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Por tipo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(data.result.byType).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="text-[10px]">
                        {type}: {count as number}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Por prioridad */}
              {data.result.byPriority && (
                <div className="col-span-2 p-2.5 rounded-lg border border-border/40 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Por prioridad</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(data.result.byPriority).map(([p, count]) => (
                      <Badge key={p} variant="outline" className={`text-[10px] ${p === 'high' ? 'text-orange-500' : p === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`}>
                        {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}: {count as number}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Visitor */}
          {selected === 'validate' && data.result && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[10px] text-red-500 border-red-300/50">
                  {data.result.errors} errores
                </Badge>
                <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-300/50">
                  {data.result.warnings} advertencias
                </Badge>
              </div>
              {data.result.total === 0 ? (
                <p className="text-sm text-green-500 text-center py-4">✅ Todas las tareas están en buen estado</p>
              ) : (
                <ScrollArea className="h-64">
                  <div className="flex flex-col gap-2 pr-1">
                    {data.result.issues.map((issue: any) => (
                      <div key={issue.taskId} className={`p-2.5 rounded-lg border ${issue.severity === 'error' ? 'border-red-300/50 bg-red-500/5' : 'border-yellow-300/50 bg-yellow-500/5'}`}>
                        <p className="text-xs font-medium truncate">{issue.title}</p>
                        <ul className="mt-1 space-y-0.5">
                          {issue.issues.map((msg: string, i: number) => (
                            <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                              <span className={issue.severity === 'error' ? 'text-red-500' : 'text-yellow-500'}>•</span>
                              {msg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Summary Visitor */}
          {selected === 'summary' && data.result && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
                <p className="text-xs text-foreground/80 leading-relaxed">{data.result.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.result.counts as Record<string, number>).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-lg border border-border/40 bg-muted/20">
                    <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-sm font-bold">{val}</p>
                  </div>
                ))}
              </div>
              <ScrollArea className="h-40">
                <div className="flex flex-col gap-1 pr-1">
                  {data.result.lines.map((line: string, i: number) => (
                    <p key={i} className="text-[10px] text-muted-foreground font-mono">{line}</p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
}