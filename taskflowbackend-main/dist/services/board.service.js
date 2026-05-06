"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBoard = exports.updateBoard = exports.createBoard = exports.getProjectBoards = void 0;
const Board_1 = require("../models/Board");
const Task_1 = require("../models/Task");
const getProjectBoards = async (projectId) => {
    return Board_1.Board.find({ projectId });
};
exports.getProjectBoards = getProjectBoards;
const createBoard = async (projectId, name, columns) => {
    return Board_1.Board.create({
        projectId,
        name,
        columns,
    });
};
exports.createBoard = createBoard;
const updateBoard = async (boardId, updates) => {
    const board = await Board_1.Board.findByIdAndUpdate(boardId, updates, { new: true });
    if (!board)
        throw new Error('Board not found');
    return board;
};
exports.updateBoard = updateBoard;
const deleteBoard = async (boardId) => {
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new Error('Board not found');
    // Cascade delete tasks in this board
    await Task_1.Task.deleteMany({ boardId });
    await board.deleteOne();
    return { message: 'Board and related tasks deleted' };
};
exports.deleteBoard = deleteBoard;
