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
exports.deleteTask = exports.cloneTask = exports.moveTask = exports.updateTask = exports.getTask = exports.buildTask = exports.createTask = exports.getTasks = void 0;
const taskService = __importStar(require("../services/task.service"));
const getTasks = async (req, res) => {
    try {
        const { type, priority, assignedTo } = req.query;
        const filters = {};
        if (type)
            filters.type = type;
        if (priority)
            filters.priority = priority;
        if (assignedTo)
            filters.assignedTo = assignedTo;
        const tasks = await taskService.getTasks(req.params.id, filters);
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res) => {
    try {
        // ProjectID typically comes from board lookup or body. Assuming it's in body for simplicity or passed via route
        const { projectId, columnId, ...taskData } = req.body;
        const task = await taskService.createTaskWithFactory(req.params.id, projectId, columnId, taskData);
        res.status(201).json(task);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createTask = createTask;
const buildTask = async (req, res) => {
    try {
        const { projectId, columnId, ...taskData } = req.body;
        const task = await taskService.createTaskWithBuilder(req.params.id, projectId, columnId, taskData);
        res.status(201).json(task);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.buildTask = buildTask;
const getTask = async (req, res) => {
    try {
        const task = await taskService.getTaskDetails(req.params.id);
        res.json(task);
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
};
exports.getTask = getTask;
const updateTask = async (req, res) => {
    try {
        const task = await taskService.updateTask(req.params.id, req.body);
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateTask = updateTask;
const moveTask = async (req, res) => {
    try {
        const { columnId } = req.body;
        const task = await taskService.moveTask(req.params.id, columnId);
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.moveTask = moveTask;
const cloneTask = async (req, res) => {
    try {
        const { boardId, columnId } = req.body;
        // Default to the task's current board if not provided
        const taskToClone = await taskService.getTaskDetails(req.params.id);
        const targetBoard = boardId || taskToClone.boardId.toString();
        const targetColumnId = columnId || taskToClone.columnId;
        const task = await taskService.cloneTaskService(req.params.id, targetBoard, targetColumnId);
        res.status(201).json(task);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.cloneTask = cloneTask;
const deleteTask = async (req, res) => {
    try {
        const result = await taskService.deleteTask(req.params.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteTask = deleteTask;
