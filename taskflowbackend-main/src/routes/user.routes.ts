import { Router } from 'express';
import { getProfile, updateProfile, deleteProfile, getUserTheme } from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:id', getProfile);
router.get('/:id/theme', protect, getUserTheme);  // AbstractFactory — config visual del usuario
router.put('/:id', protect, updateProfile);
router.delete('/:id', protect, deleteProfile);

export default router;