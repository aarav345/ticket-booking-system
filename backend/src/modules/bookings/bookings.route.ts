import { Router } from 'express';
import { bookingController } from './bookings.controller';
import {
  validate,
  validateParams,
} from '../../common/middlewares/validation.middleware';
import { CreateBookingSchema } from './dto/create-booking.dto';
import { BookingIdParamSchema } from './dto/booking-id-param.dto';

const router = Router();

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Public
 */
router.post(
  '/',
  validate(CreateBookingSchema),
  bookingController.createBooking
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking details
 * @access  Public
 */
router.get(
  '/:id',
  validateParams(BookingIdParamSchema),
  bookingController.getBookingById
);

export default router;
