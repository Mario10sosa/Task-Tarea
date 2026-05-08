/**
 * PATRÓN BRIDGE — Generación de Reportes
 * Abstraction (QUÉ reportar) desacoplado del Implementor (CÓMO exportar).
 *
 * Estructura:
 *   Abstraction           → ReportGenerator
 *   Refined Abstractions  → ProjectReportGenerator, TaskReportGenerator
 *   Implementor           → ReportExporter (interfaz)
 *   Concrete Implementors → PDFExporter, CSVExporter
 */

import PDFDocument from 'pdfkit';
import { Response } from 'express';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface ReportData {
  title:       string;
  generatedAt: string;
  rows:        Record<string, any>[];
  summary?:    Record<string, any>;
}

// ── Implementor ────────────────────────────────────────────────────────────────

export interface ReportExporter {
  exportReport(data: ReportData, res: Response): void;
  getMimeType():  string;
  getExtension(): string;
}

// ── Concrete Implementor 1: PDF ────────────────────────────────────────────────

export class PDFExporter implements ReportExporter {
  exportReport(data: ReportData, res: Response): void {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', this.getMimeType());
    res.setHeader('Content-Disposition', `attachment; filename="${data.title}.pdf"`);
    doc.pipe(res);

    // Título
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1F3864')
       .text(data.title, { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#666666')
       .text(`Generado el ${data.generatedAt}`, { align: 'center' });
    doc.moveDown(1);

    // Resumen
    if (data.summary && Object.keys(data.summary).length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#2E75B6').text('Resumen', { underline: true });
      doc.moveDown(0.3);
      Object.entries(data.summary).forEach(([key, value]) => {
        doc.fontSize(10).font('Helvetica').fillColor('#333333').text(`• ${key}: ${value}`);
      });
      doc.moveDown(1);
    }

    // Tabla de datos
    if (data.rows.length === 0) {
      doc.fontSize(10).fillColor('#999').text('No hay datos para mostrar.');
    } else {
      const columns  = Object.keys(data.rows[0]);
      const colWidth = (doc.page.width - 80) / columns.length;
      const rowH     = 20;
      let y          = doc.y;

      // Cabecera tabla
      doc.rect(40, y, doc.page.width - 80, rowH).fill('#1F3864');
      columns.forEach((col, i) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
           .text(col.toUpperCase(), 40 + i * colWidth + 4, y + 5, { width: colWidth - 8, ellipsis: true });
      });
      y += rowH;

      // Filas
      data.rows.forEach((row, idx) => {
        if (y + rowH > doc.page.height - 60) { doc.addPage(); y = 40; }
        doc.rect(40, y, doc.page.width - 80, rowH).fill(idx % 2 === 0 ? '#DCE6F1' : '#FFFFFF');
        columns.forEach((col, i) => {
          doc.fontSize(8).font('Helvetica').fillColor('#1A1A1A')
             .text(String(row[col] ?? '-'), 40 + i * colWidth + 4, y + 5, { width: colWidth - 8, ellipsis: true });
        });
        y += rowH;
      });
    }

    doc.end();
  }

  getMimeType():  string { return 'application/pdf'; }
  getExtension(): string { return 'pdf'; }
}

// ── Concrete Implementor 2: CSV (sin dependencias externas) ───────────────────

export class CSVExporter implements ReportExporter {
  exportReport(data: ReportData, res: Response): void {
    res.setHeader('Content-Type', this.getMimeType());
    res.setHeader('Content-Disposition', `attachment; filename="${data.title}.csv"`);

    if (data.rows.length === 0) { res.send('Sin datos'); return; }

    const fields = Object.keys(data.rows[0]);

    // Escapar valores para CSV (RFC 4180)
    const escape = (val: any): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header  = `# ${data.title}\n# Generado el: ${data.generatedAt}\n`;
    const summary = data.summary
      ? Object.entries(data.summary).map(([k, v]) => `# ${k}: ${v}`).join('\n') + '\n'
      : '';

    const csvHeader = fields.map(escape).join(',');
    const csvRows   = data.rows.map(row => fields.map(f => escape(row[f])).join(',')).join('\n');

    res.send(header + summary + csvHeader + '\n' + csvRows);
  }

  getMimeType():  string { return 'text/csv'; }
  getExtension(): string { return 'csv'; }
}

// ── Abstraction ────────────────────────────────────────────────────────────────

export abstract class ReportGenerator {
  constructor(protected exporter: ReportExporter) {}

  async generate(params: any, res: Response): Promise<void> {
    const data = await this.collectData(params);
    this.exporter.exportReport(data, res);
  }

  protected abstract collectData(params: any): Promise<ReportData>;
}

// ── Refined Abstraction 1: Reporte de Proyecto ─────────────────────────────────

export class ProjectReportGenerator extends ReportGenerator {
  constructor(exporter: ReportExporter) { super(exporter); }

  protected async collectData(params: { projectId: string }): Promise<ReportData> {
    const { Task }    = require('../models/Task');
    const { Project } = require('../models/Project');

    const project = await Project.findById(params.projectId).populate('members.userId', 'name email');
    if (!project) throw new Error('Project not found');

    const tasks     = await Task.find({ projectId: params.projectId });
    const total     = tasks.length;
    const completed = tasks.filter((t: any) => t.columnId === 'done').length;
    const progress  = total > 0 ? Math.round((completed / total) * 100) : 0;
    const highPrio  = tasks.filter((t: any) => t.priority === 'high').length;
    const bugs      = tasks.filter((t: any) => t.type === 'BUG').length;

    return {
      title:       `Reporte de Proyecto — ${project.name}`,
      generatedAt: new Date().toLocaleString('es-CO'),
      summary: {
        'Total de tareas': total,
        'Completadas':     completed,
        'Progreso':        `${progress}%`,
        'Alta prioridad':  highPrio,
        'Bugs':            bugs,
        'Miembros':        project.members.length,
      },
      rows: tasks.map((t: any) => ({
        Título:      t.title,
        Tipo:        t.type,
        Prioridad:   t.priority,
        Estado:      t.columnId,
        Vencimiento: t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-CO') : 'Sin fecha',
        Etiquetas:   (t.tags || []).join(', ') || 'Ninguna',
      })),
    };
  }
}

// ── Refined Abstraction 2: Reporte de Tablero ──────────────────────────────────

export class TaskReportGenerator extends ReportGenerator {
  constructor(exporter: ReportExporter) { super(exporter); }

  protected async collectData(params: { boardId: string }): Promise<ReportData> {
    const { Task }  = require('../models/Task');
    const { Board } = require('../models/Board');

    const board = await Board.findById(params.boardId);
    if (!board) throw new Error('Board not found');

    const tasks = await Task.find({ boardId: params.boardId }).populate('assignedTo', 'name');

    return {
      title:       `Reporte de Tablero — ${board.name}`,
      generatedAt: new Date().toLocaleString('es-CO'),
      summary: { 'Total de tareas': tasks.length, 'Tablero': board.name },
      rows: tasks.map((t: any) => ({
        Título:           t.title,
        Tipo:             t.type,
        Prioridad:        t.priority,
        Columna:          t.columnId,
        Responsable:      t.assignedTo?.name || 'Sin asignar',
        Vencimiento:      t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-CO') : 'Sin fecha',
        'Duración (min)': t.durationMinutes ?? '-',
      })),
    };
  }
}

// ── Bridge Factory ─────────────────────────────────────────────────────────────

export function createReportGenerator(type: 'project' | 'tasks', format: 'pdf' | 'csv'): ReportGenerator {
  const exporter: ReportExporter = format === 'pdf' ? new PDFExporter() : new CSVExporter();
  if (type === 'project') return new ProjectReportGenerator(exporter);
  if (type === 'tasks')   return new TaskReportGenerator(exporter);
  throw new Error(`Unknown report type: ${type}`);
}