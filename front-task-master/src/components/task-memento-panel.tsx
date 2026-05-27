import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, RotateCcw, Trash2, Clock } from 'lucide-react';

interface Snapshot {
  id:        string;
  taskId:    string;
  label:     string;
  createdAt: string;
  createdBy: string;
  state: {
    title:    string;
    priority: string;
    columnId: string;
    type:     string;
  };
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta', medium: 'Media', low: 'Baja',
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   'text-orange-500',
  medium: 'text-yellow-500',
  low:    'text-blue-500',
};

export function TaskMementoPanel({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const [labelInput, setLabelInput] = useState('');

  // Cargar historial de snapshots
  const { data, isLoading } = useQuery<{ total: number; snapshots: Snapshot[] }>({
    queryKey: ['snapshots', taskId],
    queryFn:  async () => {
      const res = await api.get(`/tasks/${taskId}/snapshots`);
      return res.data;
    },
    enabled: !!taskId,
  });

  // Tomar snapshot
  const takeSnapshot = useMutation({
    mutationFn: async (label: string) => {
      const res = await api.post(`/tasks/${taskId}/snapshot`, { label: label || undefined });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots', taskId] });
      setLabelInput('');
    },
  });

  // Restaurar snapshot
  const restoreSnapshot = useMutation({
    mutationFn: async (snapshotId: string) => {
      const res = await api.post(`/tasks/${taskId}/restore/${snapshotId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Limpiar historial
  const clearHistory = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/tasks/${taskId}/snapshots`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots', taskId] });
    },
  });

  const snapshots = data?.snapshots ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
          <Camera className="w-4 h-4 text-primary" />
          Snapshots
          {snapshots.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {snapshots.length}
            </Badge>
          )}
        </div>
        {snapshots.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
            onClick={() => clearHistory.mutate()}
            disabled={clearHistory.isPending}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Tomar snapshot */}
      <div className="flex gap-2">
        <input
          type="text"
          value={labelInput}
          onChange={e => setLabelInput(e.target.value)}
          placeholder="Descripción del snapshot (opcional)"
          className="flex-1 h-8 px-2 text-xs rounded-md border border-border/50 bg-muted/20 outline-none focus:border-primary/50"
          onKeyDown={e => e.key === 'Enter' && takeSnapshot.mutate(labelInput)}
        />
        <Button
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => takeSnapshot.mutate(labelInput)}
          disabled={takeSnapshot.isPending}
        >
          <Camera className="w-3 h-3 mr-1" />
          {takeSnapshot.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      {/* Lista de snapshots */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-2">Cargando...</p>
      ) : snapshots.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          Sin snapshots — guarda uno antes de editar
        </p>
      ) : (
        <ScrollArea className="max-h-52">
          <div className="flex flex-col gap-2 pr-1">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-medium truncate">{snap.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${PRIORITY_COLORS[snap.state.priority] ?? ''}`}>
                      {PRIORITY_LABELS[snap.state.priority] ?? snap.state.priority}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1 uppercase">
                      {snap.state.columnId}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(snap.createdAt).toLocaleString('es-CO', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px] shrink-0"
                  onClick={() => {
                    if (confirm(`¿Restaurar al snapshot "${snap.label}"? Se perderán los cambios actuales.`)) {
                      restoreSnapshot.mutate(snap.id);
                    }
                  }}
                  disabled={restoreSnapshot.isPending}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Restaurar
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}