import { Router } from 'express';
import { sendMessage } from '../controllers/messageController.js';
import { contactLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/', contactLimiter, sendMessage);

export default router;
