import { Router } from 'express';
import { searchDocuments } from '../controllers/searchController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Semantic Search Endpoint (Accessible by both Admin and Employee)
router.post('/', authenticateToken, searchDocuments);

export default router;
