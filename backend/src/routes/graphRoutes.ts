import { Router } from 'express';
import { getKnowledgeGraph } from '../controllers/graphController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Retrieve full knowledge graph structure
router.get('/', authenticateToken, getKnowledgeGraph);

export default router;
