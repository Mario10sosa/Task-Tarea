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
exports.deleteBoard = exports.updateBoard = exports.createBoard = exports.getBoards = void 0;
const boardService = __importStar(require("../services/board.service"));
const getBoards = async (req, res) => {
    try {
        const boards = await boardService.getProjectBoards(req.params.id);
        res.json(boards);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getBoards = getBoards;
const createBoard = async (req, res) => {
    try {
        const { name, columns } = req.body;
        const board = await boardService.createBoard(req.params.id, name, columns);
        res.status(201).json(board);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createBoard = createBoard;
const updateBoard = async (req, res) => {
    try {
        const { name, columns } = req.body;
        const board = await boardService.updateBoard(req.params.id, { name, columns });
        res.json(board);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateBoard = updateBoard;
const deleteBoard = async (req, res) => {
    try {
        const result = await boardService.deleteBoard(req.params.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteBoard = deleteBoard;
