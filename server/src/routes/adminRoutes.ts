import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import {
  getMessages,
  markMessageAsRead,
  deleteMessage,
  getDashboardStats,
} from '../controllers/messageController.js';
import {
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';

const router = Router();

// Protect all admin endpoints
router.use(authenticateAdmin);

// Dashboard overview
router.get('/stats', getDashboardStats);

// Message management
router.get('/messages', getMessages);
router.patch('/messages/:id/read', markMessageAsRead);
router.delete('/messages/:id', deleteMessage);

// Project management
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

export default router;
