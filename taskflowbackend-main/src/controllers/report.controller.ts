import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { createReportGenerator } from '../structuralpattern/ReportBridge';

/**
 * GET /api/projects/:id/report?format=pdf|csv
 * Genera un reporte del proyecto completo (tareas, progreso, miembros).
 */
export const generateProjectReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const format    = (req.query.format as 'pdf' | 'csv') || 'pdf';

    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ message: 'Formato inválido. Use pdf o csv.' });
    }

    // Bridge: desacopla tipo de reporte del formato de exportación
    const generator = createReportGenerator('project', format);
    await generator.generate({ projectId }, res);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/boards/:id/report?format=pdf|csv
 * Genera un reporte de las tareas de un tablero específico.
 */
export const generateBoardReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const boardId = req.params.id as string;
    const format  = (req.query.format as 'pdf' | 'csv') || 'pdf';

    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ message: 'Formato inválido. Use pdf o csv.' });
    }

    const generator = createReportGenerator('tasks', format);
    await generator.generate({ boardId }, res);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};