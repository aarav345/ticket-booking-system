import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

router.get('/live', healthController.liveness.bind(healthController));

router.get('/ready', healthController.readiness.bind(healthController));

// Alias for backward compatibility
router.get('/', healthController.readiness.bind(healthController));

export default router;
