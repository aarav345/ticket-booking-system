import { type PoolClient } from 'pg';
import { withTransaction } from '../../database/transaction.util';
import { bookingRepository } from './bookings.repository';
import { paymentService } from './payment.service';
import { concertRepository } from '../concerts/concerts.repository';
import { NotFoundError, BadRequestError } from '../../common/errors/app.error';
import {
  ERROR_MESSAGES,
  RESOURCE_NAMES,
  USER_MESSAGES,
  insufficientInventoryMessage,
} from '../../common/constants/messages.constant';
import type { CreateBookingDto } from './dto/create-booking.dto';
import type { CreateBookingResult, BookingWithItems } from './bookings.types';
import { logger } from '../../common/logger/logger';

export class BookingService {
  /**
   * Create a new booking with double-booking prevention
   *
   * This is the CRITICAL function that prevents race conditions using:
   * 1. Idempotency keys (prevent duplicate submissions)
   * 2. SELECT FOR UPDATE (prevent concurrent bookings)
   * 3. Database transactions (ensure atomicity)
   */
  async createBooking(dto: CreateBookingDto): Promise<CreateBookingResult> {
    logger.info({ dto }, 'Creating booking');

    return withTransaction(async (client: PoolClient) => {
      // Set transaction timeout to prevent long-running locks
      await client.query('SET LOCAL statement_timeout = 3000'); // 3 seconds

      // ============================================================
      // STEP 1: Check Idempotency (prevent duplicate submissions)
      // ============================================================
      const existingBooking = await bookingRepository.findByIdempotencyKey(
        client,
        dto.idempotencyKey
      );

      if (existingBooking) {
        logger.info(
          { idempotencyKey: dto.idempotencyKey },
          'Duplicate booking detected'
        );

        // Return existing booking instead of creating new one
        const bookingWithItems = await bookingRepository.findById(
          existingBooking.id
        );

        return {
          success: true,
          bookingId: existingBooking.id,
          booking: bookingWithItems!,
          duplicate: true,
        };
      }

      // ============================================================
      // STEP 2: Verify Concert Exists
      // ============================================================
      const concertExists = await concertRepository.exists(dto.concertId);
      if (!concertExists) {
        throw new NotFoundError(
          ERROR_MESSAGES.CONCERT_NOT_FOUND,
          RESOURCE_NAMES.CONCERT,
          dto.concertId
        );
      }

      // ============================================================
      // STEP 3: Lock Ticket Tiers (CRITICAL - Prevents Race Conditions)
      // ============================================================
      const tierIds = dto.tickets.map(t => t.tierId);
      const lockedTiers = await bookingRepository.lockTicketTiers(
        client,
        tierIds,
        dto.concertId
      );

      // Verify all requested tiers exist
      if (lockedTiers.length !== tierIds.length) {
        const foundIds = lockedTiers.map(t => t.id);
        const missingIds = tierIds.filter(id => !foundIds.includes(id));
        throw new NotFoundError(
          `Ticket tiers not found: ${missingIds.join(', ')}`,
          RESOURCE_NAMES.TICKET_TIER,
          missingIds[0]
        );
      }

      // ============================================================
      // STEP 4: Check Availability (within locked transaction)
      // ============================================================
      for (const ticket of dto.tickets) {
        const tier = lockedTiers.find(t => t.id === ticket.tierId);

        if (!tier) {
          throw new NotFoundError(
            ERROR_MESSAGES.TIER_NOT_FOUND,
            RESOURCE_NAMES.TICKET_TIER,
            ticket.tierId
          );
        }

        // Check if enough tickets available
        if (tier.available_quantity < ticket.quantity) {
          throw new BadRequestError(
            insufficientInventoryMessage(
              tier.tier_name,
              ticket.quantity,
              tier.available_quantity
            ),
            USER_MESSAGES.INSUFFICIENT_INVENTORY
          );
        }

        // Validate sold out
        if (tier.available_quantity === 0) {
          throw new BadRequestError(
            `${tier.tier_name} tickets are sold out`,
            USER_MESSAGES.TIER_SOLD_OUT
          );
        }
      }

      // ============================================================
      // STEP 5: Validate Total Amount (prevent price manipulation)
      // ============================================================
      const calculatedTotal = dto.tickets.reduce((sum, ticket) => {
        const tier = lockedTiers.find(t => t.id === ticket.tierId)!;
        return sum + Number(tier.price) * ticket.quantity;
      }, 0);

      if (Math.abs(calculatedTotal - dto.totalAmount) > 0.01) {
        throw new BadRequestError(
          `Total amount mismatch. Expected: ${calculatedTotal}, Received: ${dto.totalAmount}`,
          ERROR_MESSAGES.INVALID_AMOUNT
        );
      }

      // ============================================================
      // STEP 6: Update Inventory (within transaction)
      // ============================================================
      for (const ticket of dto.tickets) {
        await bookingRepository.updateTierInventory(
          client,
          ticket.tierId,
          ticket.quantity
        );
      }

      // ============================================================
      // STEP 7: Create Booking Record
      // ============================================================
      const bookingId = await bookingRepository.createBooking(client, {
        concertId: dto.concertId,
        userId: dto.userId,
        idempotencyKey: dto.idempotencyKey,
        totalAmount: dto.totalAmount,
        status: 'pending',
      });

      // ============================================================
      // STEP 8: Create Booking Items
      // ============================================================
      const bookingItems = dto.tickets.map(ticket => {
        const tier = lockedTiers.find(t => t.id === ticket.tierId)!;
        return {
          tierId: ticket.tierId,
          quantity: ticket.quantity,
          pricePerTicket: Number(tier.price),
        };
      });

      await bookingRepository.createBookingItems(
        client,
        bookingId,
        bookingItems
      );

      // ============================================================
      // STEP 9: Process Payment (simulated)
      // ============================================================
      logger.info({ bookingId, amount: dto.totalAmount }, 'Processing payment');

      const paymentSuccess = await paymentService.processPayment(
        dto.totalAmount
      );

      if (!paymentSuccess) {
        // Payment failed - transaction will rollback automatically
        logger.warn({ bookingId }, 'Payment failed, rolling back');

        // Update status to failed before rollback
        await bookingRepository.updateBookingStatus(
          client,
          bookingId,
          'failed'
        );

        throw new BadRequestError(
          ERROR_MESSAGES.PAYMENT_FAILED,
          USER_MESSAGES.PAYMENT_FAILED
        );
      }

      // ============================================================
      // STEP 10: Confirm Booking
      // ============================================================
      await bookingRepository.updateBookingStatus(
        client,
        bookingId,
        'confirmed'
      );

      logger.info({ bookingId }, 'Booking confirmed successfully');

      // ============================================================
      // STEP 11: Fetch Complete Booking Details (within transaction)
      // ============================================================
      const booking = await bookingRepository.findByIdWithinTransaction(
        client,
        bookingId
      );

      if (!booking) {
        throw new Error(
          'Booking creation failed: booking not found after insert'
        );
      }

      return {
        success: true,
        bookingId,
        booking,
      };
    }); // withTransaction handles COMMIT/ROLLBACK/release automatically
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string): Promise<BookingWithItems> {
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(
        ERROR_MESSAGES.BOOKING_NOT_FOUND,
        RESOURCE_NAMES.BOOKING,
        bookingId
      );
    }

    return booking;
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(userId: string): Promise<BookingWithItems[]> {
    return bookingRepository.findByUserId(userId);
  }
}

export const bookingService = new BookingService();
