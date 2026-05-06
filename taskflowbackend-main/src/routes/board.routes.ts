import { Router } from 'express';
import { getBoards, createBoard, updateBoard, deleteBoard } from '../controllers/board.controller';
import { protect } from '../middlewares/auth.middleware';
import { requireProjectRole } from '../middlewares/permissions';


const router = Router({ mergeParams: true });

router.get('/', protect, getBoards);
router.get('/project/:id', protect, requireProjectRole(['admin', 'member']), getBoards);
router.post('/', protect, createBoard);
router.post('/project/:id', protect, requireProjectRole(['admin']), createBoard);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);



export default router;
