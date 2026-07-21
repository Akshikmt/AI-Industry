import { Router } from 'express';
import { getOperationsInsights } from '../controllers/insightsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Retrieve operations alerts, anomalies, and AI recommendations
router.get('/', authenticateToken, getOperationsInsights);

export default router;
