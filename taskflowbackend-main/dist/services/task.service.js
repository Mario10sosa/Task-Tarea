"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.cloneTaskService = exports.moveTask = exports.updateTask = exports.getTaskDetails = exports.createTaskWithBuilder = exports.createTaskWithFactory = exports.getTasks = void 0;
const Task_1 = require("../models/Task");
const TaskFactory_1 = require("../patterns/TaskFactory");
const TaskBuilder_1 = require("../patterns/TaskBuilder");
const Prototype_1 = require("../patterns/Prototype");
const getTasks = async (boardId, filters) => {
    return Task_1.Task.find({ boardId, ...filters });
};
exports.getTasks = getTasks;
const createTaskWithFactory = async (boardId, projectId, columnId, data) => {
    const creator = (0, TaskFactory_1.getTaskCreator)(data.type);
    const taskData = creator.createTask(data);
    return Task_1.Task.create({ ...taskData, boardId, projectId, columnId });
};
exports.createTaskWithFactory = createTaskWithFactory;
const createTaskWithBuilder = async (boardId, projectId, columnId, data) => {
    // Assuming 'simple' as default type for builder if not specified in plan explicitly,
    // but let's let the user pass it or default to simple
    const builder = new TaskBuilder_1.TaskBuilder();
    if (data.title)
        builder.setTitle(data.title);
    if (data.priority)
        builder.setPriority(data.priority);
    if (data.dueDate)
        builder.setDueDate(data.dueDate);
    if (data.assignedTo)
        builder.setAssignee(data.assignedTo);
    if (data.tags)
        data.tags.forEach((tag) => builder.addTag(tag));
    if (data.checklist)
        builder.setChecklist(data.checklist.map((c) => c.text || c));
    const buildData = builder.build();
    return Task_1.Task.create({
        ...buildData,
        boardId,
        projectId,
        columnId,
        type: data.type || 'simple',
    });
};
exports.createTaskWithBuilder = createTaskWithBuilder;
const getTaskDetails = async (taskId) => {
    const task = await Task_1.Task.findById(taskId);
    if (!task)
        throw new Error('Task not found');
    return task;
};
exports.getTaskDetails = getTaskDetails;
const updateTask = async (taskId, updates) => {
    const task = await Task_1.Task.findByIdAndUpdate(taskId, updates, { new: true });
    if (!task)
        throw new Error('Task not found');
    return task;
};
exports.updateTask = updateTask;
const moveTask = async (taskId, columnId) => {
    const task = await Task_1.Task.findByIdAndUpdate(taskId, { columnId }, { new: true });
    if (!task)
        throw new Error('Task not found');
    return task;
};
exports.moveTask = moveTask;
const cloneTaskService = async (taskId, boardId, columnId) => {
    // the prototype handles adding '(copia)' to the name
    const newTask = await (0, Prototype_1.cloneTask)(taskId, boardId, columnId);
    if (!newTask)
        throw new Error('Failed to clone task');
    return newTask;
};
exports.cloneTaskService = cloneTaskService;
const deleteTask = async (taskId) => {
    const task = await Task_1.Task.findByIdAndDelete(taskId);
    if (!task)
        throw new Error('Task not found');
    return { message: 'Task deleted' };
};
exports.deleteTask = deleteTask;
