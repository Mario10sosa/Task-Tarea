import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2 } from 'lucide-react';

interface ReportType {
  id:          string;
  description: string;
}

interface Props {
  projectId: string;
}

const FORMAT_LABELS: Record<string, string> = {
  pdf: 'PDF',
  csv: 'CSV',
};

export function TemplateReportSelector({ projectId }: Props) {
  const [selectedType,   setSelectedType]   = useState('summary');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isDownloading,  setIsDownloading]  = useState(false);

  const { data } = useQuery<{ types: ReportType[] }>({
    queryKey: ['template-report-types', projectId],
    queryFn:  async () => {
      const res = await api.get(`/projects/${projectId}/template-report/types`);
      return res.data;
    },
    enabled: !!projectId,
  });

  const types = data?.types ?? [
    { id: 'summary', description: 'Resumen del proyecto' },
    { id: 'tasks',   description: 'Detalle de tareas' },
    { id: 'overdue', description: 'Tareas vencidas' },
    { id: 'boards',  description: 'Tableros y columnas' },
  ];

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await api.get(
        `/projects/${projectId}/template-report?type=${selectedType}&format=${selectedFormat}`,
        { responseType: 'blob' }
      );
      const ext      = selectedFormat === 'pdf' ? 'pdf' : 'csv';
      const mime     = selectedFormat === 'pdf' ? 'application/pdf' : 'text/csv';
      const blob     = new Blob([res.data], { type: mime });
      const url      = URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `reporte-${selectedType}-${Date.now()}.${ext}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando reporte:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border border-border/40 bg-muted/20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground/80">Generar Reporte</span>
        <Badge variant="outline" className="text-[10px] px-1.5">Template Method</Badge>
      </div>

      {/* Descripción del flujo */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
        {['Cargar datos', 'Procesar', 'Formatear', 'Exportar'].map((step, i, arr) => (
          <span key={step} className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/30">{step}</span>
            {i < arr.length - 1 && <span className="text-muted-foreground/40">→</span>}
          </span>
        ))}
      </div>

      {/* Selector de tipo */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground font-medium">Tipo de reporte</span>
        <div className="flex flex-wrap gap-2">
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                selectedType === t.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/20 border-border/40 hover:bg-muted/50 text-foreground/70'
              }`}
            >
              {t.description}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de formato */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground font-medium">Formato</span>
        <div className="flex gap-2">
          {Object.entries(FORMAT_LABELS).map(([fmt, label]) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                selectedFormat === fmt
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/20 border-border/40 hover:bg-muted/50 text-foreground/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Botón de descarga */}
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full h-9 text-sm gap-2"
      >
        {isDownloading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
          : <><Download className="w-4 h-4" /> Descargar {FORMAT_LABELS[selectedFormat]}</>
        }
      </Button>
    </div>
  );
}