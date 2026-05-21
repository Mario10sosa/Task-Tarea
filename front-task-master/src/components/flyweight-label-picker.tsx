import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface SystemLabel { name: string; color: string; }
interface FlyweightStats {
  poolSize:      number;
  totalRequests: number;
  reuses:        number;
  newCreations:  number;
  reuseRate:     string;
  pool:          Array<{ name: string; color: string; key: string }>;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useSystemLabels() {
  return useQuery<{ labels: SystemLabel[]; poolSize: number }>({
    queryKey: ['flyweight', 'system-labels'],
    queryFn:  async () => (await api.get('/flyweight/labels/system')).data,
  });
}

function useFlyweightStats() {
  return useQuery<FlyweightStats>({
    queryKey: ['flyweight', 'pool'],
    queryFn:  async () => (await api.get('/flyweight/labels')).data,
    refetchInterval: 10_000,
  });
}

// ── FlyweightLabelPicker ──────────────────────────────────────────────────────

/**
 * Selector de etiquetas que consume el pool Flyweight del backend.
 * Muestra las etiquetas del sistema (instancias compartidas) y permite
 * seleccionarlas para agregar a una tarea.
 */
export function FlyweightLabelPicker({
  onSelect,
  selectedLabels = [],
}: {
  onSelect: (label: { name: string; color: string }) => void;
  selectedLabels?: Array<{ name: string; color: string }>;
}) {
  const { data: systemData, isLoading } = useSystemLabels();
  const { data: stats } = useFlyweightStats();

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-muted rounded-lg" />;
  }

  const labels = systemData?.labels ?? [];

  return (
    <div className="space-y-3">
      {/* Header con stats del pool */}
      {stats && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span>
            Pool Flyweight: <strong>{stats.poolSize}</strong> instancias únicas ·
            Reutilización: <strong>{stats.reuseRate}</strong>
          </span>
        </div>
      )}

      {/* Etiquetas del pool compartido */}
      <div className="flex flex-wrap gap-1.5">
        {labels.map((label) => {
          const isSelected = selectedLabels.some(
            s => s.name.toLowerCase() === label.name.toLowerCase()
          );
          return (
            <button
              key={`${label.name}::${label.color}`}
              onClick={() => onSelect(label)}
              className={`transition-all rounded-full border-2 ${
                isSelected ? 'scale-110 ring-2 ring-offset-1' : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              style={{ borderColor: label.color }}
              title={`${label.name} (instancia compartida del pool)`}
            >
              <Badge
                className="text-white text-xs px-2 py-0.5 cursor-pointer"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </Badge>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Etiquetas compartidas por el pool Flyweight — una instancia por tipo
      </p>
    </div>
  );
}

// ── FlyweightPoolInfo ─────────────────────────────────────────────────────────

/**
 * Panel informativo que muestra el estado del pool Flyweight.
 * Útil para demostrar el patrón en la presentación.
 */
export function FlyweightPoolInfo() {
  const { data: stats, isLoading } = useFlyweightStats();

  if (isLoading || !stats) return null;

  return (
    <div className="p-3 rounded-xl border bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200/50 space-y-2">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-500" />
        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">
          Pool Flyweight activo
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white dark:bg-black/20 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-yellow-600">{stats.poolSize}</p>
          <p className="text-muted-foreground">Instancias únicas</p>
        </div>
        <div className="bg-white dark:bg-black/20 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-green-600">{stats.reuseRate}</p>
          <p className="text-muted-foreground">Tasa de reutilización</p>
        </div>
        <div className="bg-white dark:bg-black/20 rounded-lg p-2 text-center">
          <p className="text-lg font-bold">{stats.totalRequests}</p>
          <p className="text-muted-foreground">Solicitudes totales</p>
        </div>
        <div className="bg-white dark:bg-black/20 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-blue-600">{stats.reuses}</p>
          <p className="text-muted-foreground">Reutilizaciones</p>
        </div>
      </div>
    </div>
  );
}