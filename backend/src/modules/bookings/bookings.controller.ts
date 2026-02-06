import { bookingService } from './bookings.service';
import { asyncHandler } from '../../common/utils/asyncHandler.util';
import { ResponseUtil } from '../../common/utils/response.utils';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../../common/constants/messages.constant';
import type { CreateBookingDto } from './dto/create-booking.dto';
import type { BookingIdParamDto } from './dto/booking-id-param.dto';

export class BookingController {
  /**
   * POST /api/bookings
   * Create a new booking
   */
  createBooking = asyncHandler<CreateBookingDto, undefined, undefined>(
    async (req, res): Promise<void> => {
      const dto = req.validatedBody;

      const result = await bookingService.createBooking(dto);

      if (result.duplicate) {
        // Return 200 for duplicate (idempotent)
        ResponseUtil.success(
          res,
          result.booking,
          ERROR_MESSAGES.DUPLICATE_BOOKING,
          200
        );
        return;
      }

      // Return 201 for new booking
      ResponseUtil.success(
        res,
        result.booking,
        SUCCESS_MESSAGES.BOOKING_CREATED,
        201
      );
    }
  );

  /**
   * GET /api/bookings/:id
   * Get booking details
   */
  getBookingById = asyncHandler<undefined, undefined, BookingIdParamDto>(
    async (req, res): Promise<void> => {
      const { id } = req.validatedParams;

      const booking = await bookingService.getBookingById(id);

      ResponseUtil.success(
        res,
        booking,
        SUCCESS_MESSAGES.BOOKING_RETRIEVED,
        200
      );
    }
  );
}

export const bookingController = new BookingController();
