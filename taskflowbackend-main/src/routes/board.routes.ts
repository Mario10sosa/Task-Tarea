import { Router } from 'express';
import { iterateBoardTasks } from '../controllers/iterator.controller';
import { getBoards, createBoard, updateBoard, deleteBoard } from '../controllers/board.controller';
import { generateBoardReport } from '../controllers/report.controller';
import { protect } from '../middlewares/auth.middleware';
import { requireProjectRole } from '../middlewares/permissions';

const router = Router({ mergeParams: true });

router.get('/', protect, getBoards);
router.get('/project/:id', protect, requireProjectRole(['admin', 'member']), getBoards);
router.post('/', protect, createBoard);
router.post('/project/:id', protect, requireProjectRole(['admin']), createBoard);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);

// Bridge — Reportes: GET /api/boards/:id/report?format=pdf|csv
router.get('/:id/report', protect, generateBoardReport);

// Iterator — recorrer tareas del tablero
router.get('/:id/iterate', protect, iterateBoardTasks);

export default router;