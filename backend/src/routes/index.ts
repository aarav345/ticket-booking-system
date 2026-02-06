import { Router } from 'express';
import concertRoutes from '../modules/concerts/concerts.route';

const router = Router();

// Module routes
router.use('/concerts', concertRoutes);

// API info
router.get('/', (_req, res) => {
  res.json({
    message: 'Ticket Booking System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/concerts',
    },
  });
});

export default router;
