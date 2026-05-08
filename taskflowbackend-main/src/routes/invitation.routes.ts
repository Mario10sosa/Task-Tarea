import { Router } from 'express';
import {
  invite, getInvitation, accept, reject,
  getInvitations, getProjectInvitations
} from '../controllers/invitation.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.get('/',               protect, getInvitations);
router.post('/invite',        protect, invite);
router.post('/project/:id',   protect, invite);
router.get('/project/:id',    protect, getProjectInvitations); // ← ruta que faltaba
router.get('/:token',         getInvitation);
router.post('/:token/accept', protect, accept);
router.patch('/:token/accept',protect, accept);
router.post('/:token/reject', protect, reject);
router.patch('/:token/reject',protect, reject);

export default router;