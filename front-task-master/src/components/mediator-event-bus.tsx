import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Radio, ArrowRightLeft } from 'lucide-react';

interface MediatorEvent {
  id:        string;
  type:      string;
  sender:    string;
  timestamp: string;
  reactions: string[];
  data:      Record<string, any>;
}

interface StatsResponse {
  total:  number;
  byType: Record<string, number>;
}

const EVENT_COLORS: Record<string, string> = {
  'task:created': 'bg-green-500/10 text-green-600 border-green-200/50',
  'task:updated': 'bg-blue-500/10 text-blue-600 border-blue-200/50',
  'task:moved':   'bg-yellow-500/10 text-yellow-600 border-yellow-200/50',
  'task:deleted': 'bg-red-500/10 text-red-600 border-red-200/50',
  'task:assigned':'bg-purple-500/10 text-purple-600 border-purple-200/50',
  'task:overdue': 'bg-orange-500/10 text-orange-600 border-orange-200/50',
  'member:invited':'bg-cyan-500/10 text-cyan-600 border-cyan-200/50',
};

export function MediatorEventBus() {
  const { data: logData, isLoading } = useQuery<{ total: number; events: MediatorEvent[] }>({
    queryKey: ['mediator-events'],
    queryFn:  async () => {
      const res = await api.get('/mediator/events');
      return res.data;
    },
    refetchInterval: 5000, // polling cada 5 seg
  });

  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ['mediator-stats'],
    queryFn:  async () => {
      const res = await api.get('/mediator/stats');
      return res.data;
    },
    refetchInterval: 5000,
  });

  const events = logData?.events ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Header con stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
          <Radio className="w-4 h-4 text-primary animate-pulse" />
          TaskEventBus
        </div>
        {stats && (
          <>
            <Badge variant="outline" className="text-xs">
              {stats.total} eventos totales
            </Badge>
            {Object.entries(stats.byType).map(([type, count]) => (
              <Badge
                key={type}
                variant="outline"
                className={`text-[10px] px-1.5 ${EVENT_COLORS[type] ?? ''}`}
              >
                {type.split(':')[1]}: {count}
              </Badge>
            ))}
          </>
        )}
      </div>

      {/* Lista de eventos */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-4">Cargando eventos...</p>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
          <ArrowRightLeft className="w-8 h-8 opacity-30" />
          <p className="text-sm">Sin eventos en el bus</p>
          <p className="text-xs text-center max-w-xs">
            Los eventos aparecerán aquí cuando se creen, muevan o actualicen tareas
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[420px]">
          <div className="flex flex-col gap-2 pr-1">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 shrink-0 ${EVENT_COLORS[event.type] ?? ''}`}
                  >
                    {event.type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString('es-CO', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Emisor:</span>
                  <span className="font-medium">{event.sender}</span>
                  {event.data?.title && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="truncate max-w-[150px]">"{event.data.title}"</span>
                    </>
                  )}
                </div>

                {event.reactions.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Reacciones:</span>
                    {event.reactions.map((r, i) => (
                      <span key={i} className="text-[10px] text-muted-foreground pl-2 border-l border-border/50">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}