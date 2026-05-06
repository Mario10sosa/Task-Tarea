import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { Project } from '../models/Project';

export const requireProjectRole = (requiredRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId || req.params.id || req.body.projectId;
      
      if (!projectId) {
        res.status(400).json({ message: 'Project ID is required' });
        return;
      }

      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (project.ownerId.toString() === userId.toString()) {
        return next(); // Owner has all permissions
      }

      const member = project.members.find((m) => m.userId.toString() === userId.toString());
      if (!member || !requiredRoles.includes(member.role)) {
        res.status(403).json({ message: 'Not authorized to perform this action in this project' });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Server error checking permissions' });
    }

  };
};
