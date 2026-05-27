import { Request, Response } from 'express';
import { getTemplateReportGenerator, listTemplateReportTypes } from '../behaviorpatterns/ReportTemplateMethod';
import { PDFExporter, CSVExporter } from '../structuralpattern/ReportBridge';

/**
 * GET /api/projects/:id/template-report?type=summary&format=pdf
 * Genera un reporte usando el Template Method + Bridge para exportar.
 * El Template Method define el FLUJO, el Bridge define el FORMATO.
 */
export const generateTemplateReport = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const type      = (req.query.type as string) ?? 'summary';
    const format    = (req.query.format as string) ?? 'pdf';

    // Template Method: ejecuta el flujo completo cargar→procesar→formatear
    const generator = getTemplateReportGenerator(type);
    const reportData = await generator.generate(projectId);

    // Bridge: exporta en el formato solicitado
    const exporter = format === 'csv' ? new CSVExporter() : new PDFExporter();
    exporter.exportReport(reportData, res);

  } catch (error: any) {
    if (!res.headersSent) {
      res.status(400).json({ message: error.message });
    }
  }
};

/**
 * GET /api/projects/:id/template-report/types
 * Lista los tipos de reporte disponibles.
 */
export const getReportTypes = async (_req: Request, res: Response) => {
  res.json({
    types: listTemplateReportTypes().map(t => ({
      id:          t,
      description: {
        summary: 'Resumen del proyecto — tareas por columna y prioridad',
        tasks:   'Detalle completo de todas las tareas',
        overdue: 'Tareas vencidas con días de retraso',
        boards:  'Tableros y conteo de tareas por columna',
      }[t] ?? t,
    })),
  });
};