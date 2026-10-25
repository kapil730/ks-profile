import { Router } from 'express';
import { login, getMe } from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/login', loginLimiter, login);
router.get('/me', authenticateAdmin, getMe);

export default router;
