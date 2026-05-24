import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';

interface Strategy {
  id:          string;
  description: string;
}

interface StrategyInfo {
  active:      string;
  description: string;
  available:   Strategy[];
}

interface SortedResponse {
  strategy: StrategyInfo;
  total:    number;
  tasks:    any[];
}

interface Props {
  boardId?:   string;
  projectId?: string;
  onSorted?:  (tasks: any[]) => void;
}

const DEFAULT_STRATEGIES: Strategy[] = [
  { id: 'priority',  description: 'Por prioridad: Alta → Media → Baja' },
  { id: 'dueDate',   description: 'Por fecha de vencimiento' },
  { id: 'type',      description: 'Por tipo de tarea' },
  { id: 'assignee',  description: 'Por responsable' },
  { id: 'title',     description: 'Por título: A → Z' },
  { id: 'createdAt', description: 'Por fecha de creación' },
];

export function TaskSortStrategy({ boardId, projectId, onSorted }: Props) {
  const [selected, setSelected] = useState('priority');

  const { data, isLoading } = useQuery<SortedResponse>({
    queryKey: ['tasks-sorted', selected, boardId, projectId],
    queryFn:  async (): Promise<SortedResponse> => {
      const params = new URLSearchParams({ strategy: selected });
      if (boardId)   params.append('boardId',   boardId);
      if (projectId) params.append('projectId', projectId);
      const res = await api.get<SortedResponse>(`/tasks/sort?${params}`);
      return res.data;
    },
    enabled: !!(boardId || projectId),
  });

  // Notificar al padre cuando cambian los datos ordenados
  useEffect(() => {
    if (data?.tasks) onSorted?.(data.tasks);
  }, [data]);

  const strategies: Strategy[] = (data as SortedResponse | undefined)?.strategy?.available ?? DEFAULT_STRATEGIES;

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="h-8 w-52 text-xs bg-muted/20 border-border/50">
          <SelectValue placeholder="Ordenar por..." />
        </SelectTrigger>
        <SelectContent>
          {strategies.map(s => (
            <SelectItem key={s.id} value={s.id} className="text-xs">
              {s.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && (
        <Badge variant="secondary" className="text-xs">Ordenando...</Badge>
      )}
      {data && (
        <Badge variant="outline" className="text-xs">
          {(data as SortedResponse).total} tareas
        </Badge>
      )}
    </div>
  );
}