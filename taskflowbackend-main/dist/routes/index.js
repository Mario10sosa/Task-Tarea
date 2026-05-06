"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const project_routes_1 = __importDefault(require("./project.routes"));
const board_routes_1 = __importDefault(require("./board.routes"));
const task_routes_1 = __importDefault(require("./task.routes"));
const invitation_routes_1 = __importDefault(require("./invitation.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/projects', project_routes_1.default);
// According to plan.md:
// GET /api/projects/:id/boards -> boardRoutes
// POST /api/projects/:id/boards -> boardRoutes
router.use('/projects/:id/boards', board_routes_1.default);
// PUT /api/boards/:id -> boardRoutes
// DELETE /api/boards/:id -> boardRoutes
router.use('/boards', board_routes_1.default);
// GET /api/boards/:id/tasks -> taskRoutes
// POST /api/boards/:id/tasks -> taskRoutes
// POST /api/boards/:id/tasks/build -> taskRoutes
router.use('/boards/:id/tasks', task_routes_1.default);
// GET /api/tasks/:id, PUT, PATCH, DELETE -> taskRoutes
router.use('/tasks', task_routes_1.default);
// POST /api/projects/:id/invite -> invitationRoutes (invite)
router.use('/projects/:id', invitation_routes_1.default);
// GET /api/invitations/:token, PATCH accept/reject -> invitationRoutes
router.use('/invitations', invitation_routes_1.default);
exports.default = router;
