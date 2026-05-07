import { Request, Response } from 'express';
import * as projectService from '../services/project.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { projectFacade } from '../structuralpattern/ProjectFacade';

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projects = await projectService.getProjectsForUser(req.user._id.toString());
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/projects
 * Facade: crea proyecto + tablero Kanban + columnas + notificación en una sola operación.
 */
export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre del proyecto es requerido' });

    const result = await projectFacade.createFullProject(
      name,
      description,
      req.user._id.toString()
    );
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await projectService.getProjectDetails(req.params.id as string);
    res.json(project);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const project = await projectService.updateProject(req.params.id as string, { name, description });
    res.json(project);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * DELETE /api/projects/:id
 * Facade: elimina proyecto + boards + tasks + invitaciones + notificaciones en cascada.
 */
export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await projectFacade.deleteProjectCascade(
      req.params.id as string,
      req.user._id.toString()
    );
    res.json(result);
  } catch (error: any) {
    const status = error.message.includes('owner') ? 403 : 400;
    res.status(status).json({ message: error.message });
  }
};

export const cloneProjectEndpoint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await projectService.cloneProjectService(
      req.params.id as string,
      req.user._id.toString()
    );
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const result = await projectService.removeMember(
      req.params.id as string,
      req.params.userId as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/projects/:id/dashboard
 * Facade: retorna proyecto + boards + tareas + métricas en una sola respuesta.
 */
export const getProjectDashboard = async (req: Request, res: Response) => {
  try {
    const dashboard = await projectFacade.getProjectDashboard(req.params.id as string);
    res.json(dashboard);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * POST /api/projects/:id/archive
 * Facade: archiva el proyecto y notifica a todos los miembros.
 */
export const archiveProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await projectFacade.archiveProject(
      req.params.id as string,
      req.user._id.toString()
    );
    res.json(result);
  } catch (error: any) {
    const status = error.message.includes('owner') ? 403 : 400;
    res.status(status).json({ message: error.message });
  }
};