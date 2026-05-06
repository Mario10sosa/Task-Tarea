import { Router } from 'express';
import { getProfile, updateProfile, deleteProfile } from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:id', getProfile);
router.put('/:id', protect, updateProfile);
router.delete('/:id', protect, deleteProfile);

export default router;
