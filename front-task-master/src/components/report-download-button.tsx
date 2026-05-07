import { useState } from 'react';
import { Download, FileText, Sheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ReportDownloadButtonProps {
  projectId?: string;
  boardId?: string;
  projectName?: string;
  boardName?: string;
}

/**
 * Componente que consume el patrón Bridge del backend.
 * El usuario elige el formato (PDF o CSV) y el backend decide
 * qué Implementor (PDFExporter / CSVExporter) usar.
 */
export function ReportDownloadButton({
  projectId,
  boardId,
  projectName = 'proyecto',
  boardName = 'tablero',
}: ReportDownloadButtonProps) {
  const [loading, setLoading] = useState<'pdf' | 'csv' | null>(null);

  const download = async (format: 'pdf' | 'csv') => {
    setLoading(format);
    try {
      const url = projectId
        ? `/projects/${projectId}/report?format=${format}`
        : `/boards/${boardId}/report?format=${format}`;

      const name = projectId ? projectName : boardName;

      const response = await api.get(url, { responseType: 'blob' });

      const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';
      const blob = new Blob([response.data], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${name}-reporte.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success(`Reporte ${format.toUpperCase()} descargado`, {
        description: `${name} exportado correctamente.`,
      });
    } catch (error: any) {
      toast.error('Error al generar reporte', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          disabled={!!loading}
        >
          <Download className="w-4 h-4" />
          {loading ? `Generando ${loading.toUpperCase()}...` : 'Exportar reporte'}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Formato de exportación
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => download('pdf')}
          disabled={loading === 'pdf'}
          className="gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-red-500" />
          Descargar PDF
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => download('csv')}
          disabled={loading === 'csv'}
          className="gap-2 cursor-pointer"
        >
          <Sheet className="w-4 h-4 text-green-500" />
          Descargar CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}