import { Router } from 'express';
import {
  getTasks,
  createTask,
  buildTask,
  getTask,
  updateTask,
  moveTask,
  cloneTask,
  deleteTask,
} from '../controllers/task.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.get('/', protect, getTasks);
router.get('/board/:id', protect, getTasks);
router.post('/', protect, createTask);
router.post('/board/:id/factory', protect, createTask);
router.post('/build', protect, buildTask);
router.post('/board/:id/builder', protect, buildTask);

router.get('/:id', protect, getTask);
router.put('/:id', protect, updateTask);
router.put('/:id/move', protect, moveTask);
router.post('/:id/clone', protect, cloneTask);
router.delete('/:id', protect, deleteTask);


export default router;
