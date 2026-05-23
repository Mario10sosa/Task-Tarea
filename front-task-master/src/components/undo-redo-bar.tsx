import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, History, Clock } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CommandResult {
  success:   boolean;
  command:   string;
  before?:   any;
  after?:    any;
  message:   string;
  canUndo:   boolean;
  canRedo:   boolean;
}

interface CommandRecord {
  id:         string;
  name:       string;
  taskId:     string;
  executedAt: string;
  executedBy: string;
  payload:    any;
}

interface HistoryResponse {
  taskId:  string;
  history: CommandRecord[];
  canUndo: boolean;
  canRedo: boolean;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useCommandHistory(taskId: string) {
  return useQuery<HistoryResponse>({
    queryKey: ['task-history', taskId],
    queryFn:  async () => (await api.get(`/tasks/${taskId}/history`)).data,
    enabled:  !!taskId,
  });
}

function useUndo(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/tasks/${taskId}/undo`);
      return data as CommandResult;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task-history', taskId] });
      toast.success('Acción deshecha', { description: data.message });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'No hay nada que deshacer');
    },
  });
}

function useRedo(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/tasks/${taskId}/redo`);
      return data as CommandResult;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task-history', taskId] });
      toast.success('Acción rehecha', { description: data.message });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'No hay nada que rehacer');
    },
  });
}

// ── UndoRedoBar ───────────────────────────────────────────────────────────────

/**
 * Barra de Undo/Redo que se integra en el detalle de tarea.
 * Implementa RF-06.2: deshacer el último cambio en una tarea.
 */
export function UndoRedoBar({ taskId }: { taskId: string }) {
  const [showHistory, setShowHistory] = useState(false);
  const { data } = useCommandHistory(taskId);
  const undo = useUndo(taskId);
  const redo = useRedo(taskId);

  const canUndo = data?.canUndo ?? false;
  const canRedo = data?.canRedo ?? false;

  return (
    <div className="space-y-2">
      {/* Botones Undo / Redo */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 gap-1.5"
          onClick={() => undo.mutate()}
          disabled={!canUndo || undo.isPending}
          title="Deshacer último cambio"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="text-xs">Deshacer</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 gap-1.5"
          onClick={() => redo.mutate()}
          disabled={!canRedo || redo.isPending}
          title="Rehacer"
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span className="text-xs">Rehacer</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1.5 ml-auto"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="w-3.5 h-3.5" />
          <span className="text-xs">
            Historial {data?.history?.length ? `(${data.history.length})` : ''}
          </span>
        </Button>
      </div>

      {/* Historial de comandos */}
      {showHistory && (
        <div className="border rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Historial de cambios
          </div>
          {!data?.history?.length ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sin cambios registrados
            </p>
          ) : (
            <div className="divide-y divide-border/40 max-h-48 overflow-y-auto">
              {[...data.history].reverse().map((record) => (
                <div key={record.id} className="flex items-start gap-2 px-3 py-2">
                  <Clock className="w-3 h-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{record.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(record.executedAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}