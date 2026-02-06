import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookingService } from '../../../src/modules/bookings/bookings.service';
import { paymentService } from '../../../src/modules/bookings/payment.service';
import { bookingRepository } from '../../../src/modules/bookings/bookings.repository';
import { concertRepository } from '../../../src/modules/concerts/concerts.repository';

describe('BookingService - Unit Tests', () => {
  
  // Mock all dependencies
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // UNIT TEST 1: Payment Success Logic
  // ============================================================
  
  it('should confirm booking when payment succeeds', async () => {
    // Arrange - Mock all repository methods
    const mockLockedTiers = [
      {
        id: 'tier_vip_001',
        tier_name: 'VIP',
        available_quantity: 100,
        price: 100,
        version: 0,
      },
    ];

    vi.spyOn(concertRepository, 'exists').mockResolvedValue(true);
    vi.spyOn(bookingRepository, 'findByIdempotencyKey').mockResolvedValue(null);
    vi.spyOn(bookingRepository, 'lockTicketTiers').mockResolvedValue(mockLockedTiers);
    vi.spyOn(bookingRepository, 'updateTierInventory').mockResolvedValue();
    vi.spyOn(bookingRepository, 'createBooking').mockResolvedValue('booking_123');
    vi.spyOn(bookingRepository, 'createBookingItems').mockResolvedValue();
    vi.spyOn(bookingRepository, 'updateBookingStatus').mockResolvedValue();
    vi.spyOn(bookingRepository, 'findByIdWithinTransaction').mockResolvedValue({
      id: 'booking_123',
      status: 'confirmed',
      // ... other fields
    } as any);
    
    // Mock payment success
    vi.spyOn(paymentService, 'processPayment').mockResolvedValue(true);

    const dto = {
      concertId: 'concert_001',
      userId: 'user_001',
      tickets: [{ tierId: 'tier_vip_001', quantity: 2 }],
      idempotencyKey: 'key_123',
      totalAmount: 200,
    };

    // Act
    const result = await bookingService.createBooking(dto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.booking?.status).toBe('confirmed');
    expect(paymentService.processPayment).toHaveBeenCalledWith(200);
    expect(bookingRepository.updateBookingStatus).toHaveBeenCalledWith(
      expect.anything(),
      'booking_123',
      'confirmed'
    );
  });

  // ============================================================
  // UNIT TEST 2: Payment Failure Logic
  // ============================================================
  
  it('should throw error when payment fails', async () => {
    // Arrange
    vi.spyOn(concertRepository, 'exists').mockResolvedValue(true);
    vi.spyOn(bookingRepository, 'findByIdempotencyKey').mockResolvedValue(null);
    vi.spyOn(bookingRepository, 'lockTicketTiers').mockResolvedValue([
      {
        id: 'tier_vip_001',
        tier_name: 'VIP',
        available_quantity: 100,
        price: 100,
        version: 0,
      },
    ]);
    vi.spyOn(bookingRepository, 'updateTierInventory').mockResolvedValue();
    vi.spyOn(bookingRepository, 'createBooking').mockResolvedValue('booking_123');
    vi.spyOn(bookingRepository, 'createBookingItems').mockResolvedValue();
    vi.spyOn(bookingRepository, 'updateBookingStatus').mockResolvedValue();
    
    // Mock payment failure
    vi.spyOn(paymentService, 'processPayment').mockResolvedValue(false);

    const dto = {
      concertId: 'concert_001',
      userId: 'user_001',
      tickets: [{ tierId: 'tier_vip_001', quantity: 2 }],
      idempotencyKey: 'key_123',
      totalAmount: 200,
    };

    // Act & Assert
    await expect(bookingService.createBooking(dto)).rejects.toThrow('Payment processing failed');
    
    // Verify status was set to failed before throwing
    expect(bookingRepository.updateBookingStatus).toHaveBeenCalledWith(
      expect.anything(),
      'booking_123',
      'failed'
    );
  });

  // ============================================================
  // UNIT TEST 3: Price Validation Logic
  // ============================================================
  
  it('should reject booking with mismatched total amount', async () => {
    // Arrange
    vi.spyOn(concertRepository, 'exists').mockResolvedValue(true);
    vi.spyOn(bookingRepository, 'findByIdempotencyKey').mockResolvedValue(null);
    vi.spyOn(bookingRepository, 'lockTicketTiers').mockResolvedValue([
      {
        id: 'tier_vip_001',
        tier_name: 'VIP',
        available_quantity: 100,
        price: 100, // Actual price
        version: 0,
      },
    ]);

    const dto = {
      concertId: 'concert_001',
      userId: 'user_001',
      tickets: [{ tierId: 'tier_vip_001', quantity: 2 }],
      idempotencyKey: 'key_123',
      totalAmount: 150, // Wrong! Should be 200
    };

    // Act & Assert
    await expect(bookingService.createBooking(dto)).rejects.toThrow(/Total amount mismatch/);
  });

  // ============================================================
  // UNIT TEST 4: Idempotency Logic
  // ============================================================
  
  it('should return existing booking when idempotency key exists', async () => {
    const existingBooking = {
      id: 'booking_existing',
      status: 'confirmed',
      // ... other fields
    };

    vi.spyOn(bookingRepository, 'findByIdempotencyKey').mockResolvedValue(existingBooking as any);
    vi.spyOn(bookingRepository, 'findById').mockResolvedValue({
      ...existingBooking,
      items: [],
    } as any);
    vi.spyOn(paymentService, 'processPayment')
        .mockResolvedValue(true);

    const dto = {
      concertId: 'concert_001',
      userId: 'user_001',
      tickets: [{ tierId: 'tier_vip_001', quantity: 2 }],
      idempotencyKey: 'key_existing',
      totalAmount: 200,
    };

    // Act
    const result = await bookingService.createBooking(dto);

    // Assert
    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(true);
    expect(result.bookingId).toBe('booking_existing');
    
    // Verify no payment was attempted
    expect(paymentService.processPayment).not.toHaveBeenCalled();
  });

  // ============================================================
  // UNIT TEST 5: Availability Check Logic
  // ============================================================
  
  it('should reject booking when insufficient inventory', async () => {
    // Arrange
    vi.spyOn(concertRepository, 'exists').mockResolvedValue(true);
    vi.spyOn(bookingRepository, 'findByIdempotencyKey').mockResolvedValue(null);
    vi.spyOn(bookingRepository, 'lockTicketTiers').mockResolvedValue([
      {
        id: 'tier_vip_001',
        tier_name: 'VIP',
        available_quantity: 1, // Only 1 available
        price: 100,
        version: 0,
      },
    ]);

    const dto = {
      concertId: 'concert_001',
      userId: 'user_001',
      tickets: [{ tierId: 'tier_vip_001', quantity: 5 }], // Requesting 5
      idempotencyKey: 'key_123',
      totalAmount: 500,
    };

    // Act & Assert
    await expect(bookingService.createBooking(dto)).rejects.toMatchObject({
        name: 'BadRequestError',
        message: expect.stringContaining('VIP'),
    });
  });
});