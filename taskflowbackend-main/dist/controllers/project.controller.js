"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.cloneProjectEndpoint = exports.deleteProject = exports.updateProject = exports.getProject = exports.createProject = exports.getProjects = void 0;
const projectService = __importStar(require("../services/project.service"));
const getProjects = async (req, res) => {
    try {
        const projects = await projectService.getProjectsForUser(req.user._id.toString());
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getProjects = getProjects;
const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const project = await projectService.createProject(name, description, req.user._id.toString());
        res.status(201).json(project);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createProject = createProject;
const getProject = async (req, res) => {
    try {
        const project = await projectService.getProjectDetails(req.params.id);
        res.json(project);
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
};
exports.getProject = getProject;
const updateProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const project = await projectService.updateProject(req.params.id, { name, description });
        res.json(project);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const project = await projectService.getProjectDetails(req.params.id);
        if (project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project owner can delete the project' });
        }
        const result = await projectService.deleteProject(req.params.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteProject = deleteProject;
const cloneProjectEndpoint = async (req, res) => {
    try {
        const result = await projectService.cloneProjectService(req.params.id, req.user._id.toString());
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.cloneProjectEndpoint = cloneProjectEndpoint;
const removeMember = async (req, res) => {
    try {
        const result = await projectService.removeMember(req.params.id, req.params.userId);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.removeMember = removeMember;
