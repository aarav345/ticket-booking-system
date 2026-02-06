import { Router } from 'express';
import concertRoutes from '../modules/concerts/concerts.route';
import bookingRoutes from '../modules/bookings/bookings.route';

const router = Router();

// Module routes
router.use('/concerts', concertRoutes);
router.use('/bookings', bookingRoutes);

// API info
router.get('/', (_req, res) => {
  res.json({
    message: 'Ticket Booking System API',
    version: '1.0.0',
    endpoints: {
      concerts: '/api/v1/concerts',
      bookings: '/api/v1/bookings',
    },
  });
});

export default router;
