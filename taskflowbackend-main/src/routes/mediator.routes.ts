import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { publishEvent, getEventLog, getStats } from '../controllers/mediator.controller';

const router = Router();

router.post('/events',  protect, publishEvent);   // publicar evento al bus
router.get('/events',   protect, getEventLog);    // ver log de eventos
router.get('/stats',    protect, getStats);        // estadísticas del bus

export default router;