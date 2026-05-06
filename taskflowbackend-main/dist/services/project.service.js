"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.cloneProjectService = exports.deleteProject = exports.updateProject = exports.getProjectDetails = exports.createProject = exports.getProjectsForUser = void 0;
const Project_1 = require("../models/Project");
const Board_1 = require("../models/Board");
const Task_1 = require("../models/Task");
const Prototype_1 = require("../patterns/Prototype");
const getProjectsForUser = async (userId) => {
    return Project_1.Project.find({
        $or: [{ ownerId: userId }, { 'members.userId': userId }],
    });
};
exports.getProjectsForUser = getProjectsForUser;
const createProject = async (name, description, ownerId) => {
    return Project_1.Project.create({
        name,
        description,
        ownerId,
        members: [{ userId: ownerId, role: 'admin' }],
    });
};
exports.createProject = createProject;
const getProjectDetails = async (projectId) => {
    const project = await Project_1.Project.findById(projectId).populate('members.userId', 'name email theme');
    if (!project)
        throw new Error('Project not found');
    return project;
};
exports.getProjectDetails = getProjectDetails;
const updateProject = async (projectId, updates) => {
    const project = await Project_1.Project.findByIdAndUpdate(projectId, updates, { new: true });
    if (!project)
        throw new Error('Project not found');
    return project;
};
exports.updateProject = updateProject;
const deleteProject = async (projectId) => {
    const project = await Project_1.Project.findById(projectId);
    if (!project)
        throw new Error('Project not found');
    // Cascade delete boards and tasks
    await Task_1.Task.deleteMany({ projectId });
    await Board_1.Board.deleteMany({ projectId });
    await project.deleteOne();
    return { message: 'Project and all related data deleted' };
};
exports.deleteProject = deleteProject;
const cloneProjectService = async (projectId, ownerId) => {
    const newProject = await (0, Prototype_1.cloneProject)(projectId, ownerId);
    if (!newProject)
        throw new Error('Project not found to clone');
    return newProject;
};
exports.cloneProjectService = cloneProjectService;
const removeMember = async (projectId, memberId) => {
    const project = await Project_1.Project.findById(projectId);
    if (!project)
        throw new Error('Project not found');
    if (project.ownerId.toString() === memberId) {
        throw new Error('Cannot remove the project owner');
    }
    project.members = project.members.filter((m) => m.userId.toString() !== memberId);
    await project.save();
    return project;
};
exports.removeMember = removeMember;
