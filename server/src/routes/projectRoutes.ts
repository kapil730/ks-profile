import { Router } from 'express';
import { getProjects, getProjectById } from '../controllers/projectController.js';

const router = Router();

router.get('/', getProjects);
router.get('/:id', getProjectById);

export default router;
