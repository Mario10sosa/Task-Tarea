import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Tag, X, Upload, FileText, Image, Download, Plus } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface TaskLabel  { name: string; color: string; }
interface TaskAttachment {
  filename: string; originalName: string;
  mimetype: string; size: number; url: string; uploadedAt: string;
}
interface DecoratedTask {
  id: string; title: string; labels: TaskLabel[];
  attachments: TaskAttachment[]; badges: { text: string; color: string; icon?: string }[];
  isOverdue: boolean; daysUntilDue: number | null;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useDecoratedTask(taskId: string) {
  return useQuery<DecoratedTask>({
    queryKey: ['task-decorated', taskId],
    queryFn: async () => (await api.get(`/tasks/${taskId}/decorated`)).data,
    enabled: !!taskId,
  });
}

function useAddLabel(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (label: TaskLabel) => api.post(`/tasks/${taskId}/labels`, label),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task-decorated', taskId] }); toast.success('Etiqueta agregada'); },
    onError:   () => toast.error('Error al agregar etiqueta'),
  });
}

function useRemoveLabel(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.delete(`/tasks/${taskId}/labels/${encodeURIComponent(name)}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task-decorated', taskId] }); },
  });
}

function useUploadAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post(`/tasks/${taskId}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task-decorated', taskId] }); toast.success('Archivo adjuntado'); },
    onError:   () => toast.error('Error al subir archivo'),
  });
}

function useRemoveAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => api.delete(`/tasks/${taskId}/attachments/${filename}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task-decorated', taskId] }); toast.success('Adjunto eliminado'); },
  });
}

// ── Colores predefinidos para etiquetas ───────────────────────────────────────

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

function fileIcon(mimetype: string) {
  if (mimetype.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-gray-500" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Sección de Etiquetas ──────────────────────────────────────────────────────

function LabelsSection({ taskId, labels }: { taskId: string; labels: TaskLabel[] }) {
  const [newName, setNewName]   = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [adding, setAdding]     = useState(false);
  const addLabel    = useAddLabel(taskId);
  const removeLabel = useRemoveLabel(taskId);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addLabel.mutate({ name: newName.trim(), color: newColor });
    setNewName(''); setAdding(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" /> Etiquetas
        </span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setAdding(!adding)}>
          <Plus className="w-3 h-3 mr-1" /> Agregar
        </Button>
      </div>

      {/* Lista de etiquetas */}
      <div className="flex flex-wrap gap-1.5">
        {labels.length === 0 && !adding && (
          <p className="text-xs text-muted-foreground">Sin etiquetas</p>
        )}
        {labels.map((label) => (
          <Badge
            key={label.name}
            className="group gap-1 pr-1 text-white text-xs"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
            <button
              onClick={() => removeLabel.mutate(label.name)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Formulario agregar etiqueta */}
      {adding && (
        <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
          <Input
            placeholder="Nombre de etiqueta"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${newColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={handleAdd} disabled={addLabel.isPending}>
            OK
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Sección de Adjuntos ───────────────────────────────────────────────────────

function AttachmentsSection({ taskId, attachments }: { taskId: string; attachments: TaskAttachment[] }) {
  const fileRef        = useRef<HTMLInputElement>(null);
  const uploadFile     = useUploadAttachment(taskId);
  const removeFile     = useRemoveAttachment(taskId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile.mutate(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Paperclip className="w-3.5 h-3.5" /> Adjuntos ({attachments.length})
        </span>
        <Button
          variant="ghost" size="sm" className="h-6 px-2 text-xs"
          onClick={() => fileRef.current?.click()}
          disabled={uploadFile.isPending}
        >
          <Upload className="w-3 h-3 mr-1" />
          {uploadFile.isPending ? 'Subiendo...' : 'Subir'}
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin archivos adjuntos</p>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((att) => (
            <div key={att.filename} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 group transition-colors">
              {fileIcon(att.mimetype)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{att.originalName}</p>
                <p className="text-[10px] text-muted-foreground">{formatBytes(att.size)}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={att.url} download={att.originalName} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Download className="w-3 h-3" />
                  </Button>
                </a>
                <Button
                  variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive"
                  onClick={() => removeFile.mutate(att.filename)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TaskDecorations (componente principal exportado) ──────────────────────────

/**
 * Muestra las decoraciones de una tarea: badges del Decorator, etiquetas y adjuntos.
 * Úsalo dentro del detalle de una tarea.
 */
export function TaskDecorations({ taskId }: { taskId: string }) {
  const { data, isLoading } = useDecoratedTask(taskId);

  if (isLoading) return <div className="h-20 animate-pulse bg-muted rounded-xl" />;
  if (!data)     return null;

  return (
    <div className="space-y-4">
      {/* Badges del Decorator (vencimiento, prioridad, etc.) */}
      {data.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.badges.map((badge, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border
                ${badge.color === 'red'    ? 'bg-red-50 text-red-700 border-red-200' : ''}
                ${badge.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                ${badge.color === 'green'  ? 'bg-green-50 text-green-700 border-green-200' : ''}
                ${badge.color === 'blue'   ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                ${badge.color === 'gray'   ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
              `}
            >
              {badge.icon && <span>{badge.icon}</span>}
              {badge.text}
            </span>
          ))}
        </div>
      )}

      <LabelsSection     taskId={taskId} labels={data.labels} />
      <AttachmentsSection taskId={taskId} attachments={data.attachments} />
    </div>
  );
}