import { Request, Response } from 'express';
import * as projectService from '../services/project.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projects = await projectService.getProjectsForUser(req.user._id.toString());
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const project = await projectService.createProject(name, description, req.user._id.toString());
    res.status(201).json(project);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await projectService.getProjectDetails((req.params.id as string));
    res.json(project);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const project = await projectService.updateProject((req.params.id as string), { name, description });
    res.json(project);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = await projectService.getProjectDetails((req.params.id as string));
    if (project.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can delete the project' });
    }
    const result = await projectService.deleteProject((req.params.id as string));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const cloneProjectEndpoint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await projectService.cloneProjectService((req.params.id as string), req.user._id.toString());
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const result = await projectService.removeMember((req.params.id as string), (req.params.userId as string));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
