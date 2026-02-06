import { type PoolClient } from 'pg';
import { pool } from '../../database/pg.client';
import type { Booking, BookingWithItems, LockedTier } from './bookings.types';
import { randomUUID } from 'crypto';

export class BookingRepository {
  /**
   * Check if booking exists by idempotency key
   */
  async findByIdempotencyKey(
    client: PoolClient,
    idempotencyKey: string
  ): Promise<Booking | null> {
    const result = await client.query<Booking>(
      'SELECT * FROM bookings WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    return result.rows[0] || null;
  }

  /**
   * Lock ticket tiers and get their details
   * CRITICAL: Uses SELECT FOR UPDATE to prevent race conditions
   */
  async lockTicketTiers(
    client: PoolClient,
    tierIds: string[],
    concertId: string
  ): Promise<LockedTier[]> {
    const result = await client.query<LockedTier>(
      `SELECT 
         id,
         tier_name,
         available_quantity,
         price,
         version
       FROM ticket_tiers
       WHERE id = ANY($1) AND concert_id = $2
       FOR UPDATE`,
      [tierIds, concertId]
    );
    return result.rows;
  }

  /**
   * Update ticket tier inventory
   */
  async updateTierInventory(
    client: PoolClient,
    tierId: string,
    quantity: number
  ): Promise<void> {
    await client.query(
      `UPDATE ticket_tiers
       SET available_quantity = available_quantity - $1,
           version = version + 1
       WHERE id = $2`,
      [quantity, tierId]
    );
  }

  /**
   * Create booking record
   */
  async createBooking(
    client: PoolClient,
    data: {
      concertId: string;
      userId: string;
      idempotencyKey: string;
      totalAmount: number;
      status: string;
    }
  ): Promise<string> {
    const bookingId = `booking_${randomUUID()}`;

    await client.query(
      `INSERT INTO bookings (
         id, concert_id, user_id, idempotency_key, status, total_amount
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        bookingId,
        data.concertId,
        data.userId,
        data.idempotencyKey,
        data.status,
        data.totalAmount,
      ]
    );

    return bookingId;
  }

  /**
   * Create booking items
   */
  async createBookingItems(
    client: PoolClient,
    bookingId: string,
    items: Array<{
      tierId: string;
      quantity: number;
      pricePerTicket: number;
    }>
  ): Promise<void> {
    for (const item of items) {
      const itemId = `item_${randomUUID()}`;
      await client.query(
        `INSERT INTO booking_items (
           id, booking_id, tier_id, quantity, price_per_ticket
         ) VALUES ($1, $2, $3, $4, $5)`,
        [itemId, bookingId, item.tierId, item.quantity, item.pricePerTicket]
      );
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    client: PoolClient,
    bookingId: string,
    status: string
  ): Promise<void> {
    await client.query('UPDATE bookings SET status = $1 WHERE id = $2', [
      status,
      bookingId,
    ]);
  }

  /**
   * Find booking by ID with items (no N+1)
   * Used outside of transactions (uses pool)
   */
  async findById(bookingId: string): Promise<BookingWithItems | null> {
    const result = await pool.query<BookingWithItems>(
      `SELECT 
         b.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', bi.id,
               'booking_id', bi.booking_id,
               'tier_id', bi.tier_id,
               'quantity', bi.quantity,
               'price_per_ticket', bi.price_per_ticket
             )
           ) FILTER (WHERE bi.id IS NOT NULL),
           '[]'
         ) as items
       FROM bookings b
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
       WHERE b.id = $1
       GROUP BY b.id`,
      [bookingId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find booking by ID within a transaction (uses client)
   * Used when we need to fetch booking details inside a transaction context
   */
  async findByIdWithinTransaction(
    client: PoolClient,
    bookingId: string
  ): Promise<BookingWithItems | null> {
    const result = await client.query<BookingWithItems>(
      `SELECT 
         b.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', bi.id,
               'booking_id', bi.booking_id,
               'tier_id', bi.tier_id,
               'quantity', bi.quantity,
               'price_per_ticket', bi.price_per_ticket
             )
           ) FILTER (WHERE bi.id IS NOT NULL),
           '[]'
         ) as items
       FROM bookings b
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
       WHERE b.id = $1
       GROUP BY b.id`,
      [bookingId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find bookings by user ID
   */
  async findByUserId(userId: string): Promise<BookingWithItems[]> {
    const result = await pool.query<BookingWithItems>(
      `SELECT 
         b.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', bi.id,
               'booking_id', bi.booking_id,
               'tier_id', bi.tier_id,
               'quantity', bi.quantity,
               'price_per_ticket', bi.price_per_ticket
             )
           ) FILTER (WHERE bi.id IS NOT NULL),
           '[]'
         ) as items
       FROM bookings b
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
       WHERE b.user_id = $1
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return result.rows;
  }
}

export const bookingRepository = new BookingRepository();
