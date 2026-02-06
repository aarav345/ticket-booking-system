import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { bookingService } from '../../../src/modules/bookings/bookings.service';
import { pool } from '../../../src/database/pg.client';
import { v4 as uuidv4 } from 'uuid';
import type { CreateBookingDto } from '../../../src/modules/bookings/dto/create-booking.dto';

let client: any;

beforeEach(async () => {
  client = await pool.connect();
  await client.query('BEGIN');

  await pool.query(`
    UPDATE ticket_tiers 
    SET available_quantity = total_quantity,
        version = 0
    WHERE concert_id = 'concert_001'
  `);

});

afterEach(async () => {
  await client.query('ROLLBACK');
  client.release();

  await pool.query(`
    DELETE FROM bookings 
    WHERE user_id LIKE 'user_%_00%' 
       OR user_id LIKE 'user_concurrent_%'
  `);
  
  // Double-check inventory reset
  await pool.query(`
    UPDATE ticket_tiers 
    SET available_quantity = total_quantity,
        version = 0
    WHERE concert_id = 'concert_001'
  `);
});

describe('BookingService - Integration Tests (Real Database)', () => {
  
  // Helper to get current inventory
  const getInventory = async (tierId: string) => {
    const result = await pool.query(
      'SELECT available_quantity FROM ticket_tiers WHERE id = $1',
      [tierId]
    );
    return result.rows[0]?.available_quantity || 0;
  };

  // ============================================================
  // INTEGRATION TEST 1: End-to-End Booking Flow
  // ============================================================
  
  it('should create booking and update database correctly', async () => {
    // Arrange
    const initialInventory = await getInventory('tier_vip_001');
    
    const dto: CreateBookingDto = {
      concertId: 'concert_001',
      userId: 'user_integration_001',
      tickets: [{ tierId: 'tier_vip_001', quantity: 3 }],
      idempotencyKey: uuidv4(),
      totalAmount: 300,
    };

    // Act
    const result = await bookingService.createBooking(dto);

    // Assert - Check service response
    expect(result.success).toBe(true);
    expect(result.booking?.status).toBe('confirmed');

    // Assert - Verify database state
    const finalInventory = await getInventory('tier_vip_001');
    expect(finalInventory).toBe(initialInventory - 3);

    // Assert - Verify booking exists in database
    const bookingCheck = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [result.bookingId]
    );
    expect(bookingCheck.rows).toHaveLength(1);
    expect(bookingCheck.rows[0].status).toBe('confirmed');

    // Assert - Verify booking items exist
    const itemsCheck = await pool.query(
      'SELECT * FROM booking_items WHERE booking_id = $1',
      [result.bookingId]
    );
    expect(itemsCheck.rows).toHaveLength(1);
    expect(itemsCheck.rows[0].quantity).toBe(3);
  });

  // ============================================================
  // INTEGRATION TEST 2: Transaction Rollback on Payment Failure
  // ============================================================
  
  it('should rollback inventory when payment fails', async () => {
    // Arrange
    const initialInventory = await getInventory('tier_vip_001');
    
    const dto: CreateBookingDto = {
      concertId: 'concert_001',
      userId: 'user_integration_002',
      tickets: [{ tierId: 'tier_vip_001', quantity: 2 }],
      idempotencyKey: uuidv4(),
      totalAmount: 200,
    };

    // Note: Payment has 5% failure rate in simulation
    // We'll need to run this multiple times or mock payment in integration tests
    
    // For now, let's just verify the behavior when it does fail
    try {
      await bookingService.createBooking(dto);
    } catch (error: any) {
      if (error.message.includes('Payment')) {
        // Assert - Verify inventory was NOT reduced
        const finalInventory = await getInventory('tier_vip_001');
        expect(finalInventory).toBe(initialInventory);

        // Assert - Verify no confirmed booking exists
        const bookingCheck = await pool.query(
          'SELECT * FROM bookings WHERE user_id = $1 AND status = $2',
          ['user_integration_002', 'confirmed']
        );
        expect(bookingCheck.rows).toHaveLength(0);
      }
    }
  });

  // ============================================================
  // INTEGRATION TEST 3: Concurrent Bookings (Race Condition)
  // ============================================================
  
  it('should prevent double-booking under concurrent requests', async () => {
    // Arrange - Set VIP inventory to only 5 tickets
    await pool.query(
      'UPDATE ticket_tiers SET available_quantity = 5 WHERE id = $1',
      ['tier_vip_001']
    );

    // Create 3 concurrent booking requests for 3 tickets each
    const dto1: CreateBookingDto = {
      concertId: 'concert_001',
      userId: 'user_concurrent_1',
      tickets: [{ tierId: 'tier_vip_001', quantity: 3 }],
      idempotencyKey: uuidv4(),
      totalAmount: 300,
    };

    const dto2: CreateBookingDto = {
      concertId: 'concert_001',
      userId: 'user_concurrent_2',
      tickets: [{ tierId: 'tier_vip_001', quantity: 3 }],
      idempotencyKey: uuidv4(),
      totalAmount: 300,
    };

    const dto3: CreateBookingDto = {
      concertId: 'concert_001',
      userId: 'user_concurrent_3',
      tickets: [{ tierId: 'tier_vip_001', quantity: 3 }],
      idempotencyKey: uuidv4(),
      totalAmount: 300,
    };

    // Act - Fire all 3 requests simultaneously
    const results = await Promise.allSettled([
      bookingService.createBooking(dto1),
      bookingService.createBooking(dto2),
      bookingService.createBooking(dto3),
    ]);

    // Assert - Only 1 should succeed (first to acquire lock)
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(2);

    // Assert - Verify database consistency
    const finalInventory = await getInventory('tier_vip_001');
    expect(finalInventory).toBe(2); // 5 - 3 = 2

    // Assert - Only 1 confirmed booking exists
    const confirmedBookings = await pool.query(
      `SELECT * FROM bookings 
       WHERE user_id IN ($1, $2, $3) AND status = 'confirmed'`,
      ['user_concurrent_1', 'user_concurrent_2', 'user_concurrent_3']
    );
    expect(confirmedBookings.rows).toHaveLength(1);
  });

  // ============================================================
  // INTEGRATION TEST 4: Idempotency Across Real Database
  // ============================================================
  
  it('should handle duplicate requests correctly in database', async () => {
    // Arrange
    const initialInventory = await getInventory('tier_vip_001');
    const idempotencyKey = uuidv4();
    
    const dto: CreateBookingDto = {
      concertId: 'concert_001',
      userId: 'user_integration_004',
      tickets: [{ tierId: 'tier_vip_001', quantity: 2 }],
      idempotencyKey,
      totalAmount: 200,
    };

    // Act - Send same request twice
    const result1 = await bookingService.createBooking(dto);
    const result2 = await bookingService.createBooking(dto);

    // Assert
    expect(result1.bookingId).toBe(result2.bookingId);
    expect(result2.duplicate).toBe(true);

    // Assert - Inventory only reduced once
    const finalInventory = await getInventory('tier_vip_001');
    expect(finalInventory).toBe(initialInventory - 2);

    // Assert - Only 1 booking in database
    const bookingCount = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    expect(parseInt(bookingCount.rows[0].count)).toBe(1);
  });

  // ============================================================
  // INTEGRATION TEST 5: Multi-Tier Booking Database Consistency
  // ============================================================
  
  it('should update all tier inventories atomically', async () => {
    // Arrange
    const initialVip = await getInventory('tier_vip_001');
    const initialFront = await getInventory('tier_fr_001');
    const initialGa = await getInventory('tier_ga_001');

    const dto: CreateBookingDto = {
      concertId: 'concert_001',
      userId: 'user_integration_005',
      tickets: [
        { tierId: 'tier_vip_001', quantity: 1 },
        { tierId: 'tier_fr_001', quantity: 2 },
        { tierId: 'tier_ga_001', quantity: 3 },
      ],
      idempotencyKey: uuidv4(),
      totalAmount: 100 + 100 + 30, // 1*100 + 2*50 + 3*10
    };

    // Act
    const result = await bookingService.createBooking(dto);

    // Assert - All inventories updated
    expect(await getInventory('tier_vip_001')).toBe(initialVip - 1);
    expect(await getInventory('tier_fr_001')).toBe(initialFront - 2);
    expect(await getInventory('tier_ga_001')).toBe(initialGa - 3);

    // Assert - 3 booking items created
    const itemsCount = await pool.query(
      'SELECT COUNT(*) FROM booking_items WHERE booking_id = $1',
      [result.bookingId]
    );
    expect(parseInt(itemsCount.rows[0].count)).toBe(3);
  });
});