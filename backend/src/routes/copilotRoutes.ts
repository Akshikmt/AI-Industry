import { Router } from 'express';
import { askCopilot } from '../controllers/copilotController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// RAG Ask Copilot Endpoint
router.post('/ask', authenticateToken, askCopilot);

export default router;
