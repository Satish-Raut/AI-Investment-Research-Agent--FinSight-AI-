import { Router } from 'express';
import { runResearch, getHistory, getHistoryItem } from '../controllers/researchController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Secure all endpoints using token validator middleware
router.use(authMiddleware);

router.post('/', runResearch);
router.get('/history', getHistory);
router.get('/history/:id', getHistoryItem);

export default router;
