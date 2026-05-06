"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneTask = cloneTask;
exports.cloneProject = cloneProject;
const Task_1 = require("../models/Task");
const Project_1 = require("../models/Project");
const Board_1 = require("../models/Board");
async function cloneTask(taskId, targetBoardId, targetColumnId) {
    const original = await Task_1.Task.findById(taskId).lean();
    if (!original)
        return null;
    const { _id, createdAt, updatedAt, ...rest } = original;
    return Task_1.Task.create({
        ...rest,
        boardId: targetBoardId,
        columnId: targetColumnId,
        title: `${rest.title} (copia)`,
    });
}
async function cloneProject(projectId, ownerId) {
    const original = await Project_1.Project.findById(projectId).lean();
    if (!original)
        return null;
    const { _id, createdAt, updatedAt, ...rest } = original;
    const newProject = await Project_1.Project.create({
        ...rest,
        name: `${rest.name} (copia)`,
        ownerId,
        members: [{ userId: ownerId, role: 'admin' }], // Reset members to only the new owner
    });
    // Clone associated boards and tasks
    const boards = await Board_1.Board.find({ projectId: _id }).lean();
    for (const board of boards) {
        const { _id: boardId, createdAt: bca, updatedAt: bua, ...boardRest } = board;
        const newBoard = await Board_1.Board.create({
            ...boardRest,
            projectId: newProject._id,
        });
        const tasks = await Task_1.Task.find({ boardId }).lean();
        for (const task of tasks) {
            const { _id: taskId, createdAt: tca, updatedAt: tua, ...taskRest } = task;
            await Task_1.Task.create({
                ...taskRest,
                projectId: newProject._id,
                boardId: newBoard._id,
            });
        }
    }
    return newProject;
}
