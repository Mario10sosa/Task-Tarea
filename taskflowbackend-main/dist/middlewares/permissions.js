"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireProjectRole = void 0;
const Project_1 = require("../models/Project");
const requireProjectRole = (requiredRoles) => {
    return async (req, res, next) => {
        try {
            const projectId = req.params.projectId || req.body.projectId;
            if (!projectId) {
                res.status(400).json({ message: 'Project ID is required' });
                return;
            }
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                res.status(404).json({ message: 'Project not found' });
                return;
            }
            const userId = req.user?._id;
            if (project.ownerId.toString() === userId.toString()) {
                return next(); // Owner has all permissions
            }
            const member = project.members.find((m) => m.userId.toString() === userId.toString());
            if (!member || !requiredRoles.includes(member.role)) {
                res.status(403).json({ message: 'Not authorized to perform this action in this project' });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({ message: 'Server error checking permissions' });
        }
    };
};
exports.requireProjectRole = requireProjectRole;
