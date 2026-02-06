import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { v4 as uuidv4 } from 'uuid';
import { ERROR_MESSAGES } from '../../../src/common/constants/messages.constant';

describe('Bookings API - HTTP Integration Tests', () => {
  
  describe('POST /api/v1/bookings', () => {
    
    it('should return 201 with booking details on success', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .send({
          concertId: 'concert_001',
          userId: 'user_api_001',
          tickets: [{ tierId: 'tier_vip_001', quantity: 2 }],
          idempotencyKey: uuidv4(),
          totalAmount: 200,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('confirmed');
      expect(response.body.message).toContain('Booking created successfully');
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .send({
          concertId: 'concert_001',
          // Missing userId
          tickets: [{ tierId: 'tier_vip_001', quantity: 2 }],
          idempotencyKey: uuidv4(),
          totalAmount: 200,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent concert', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .send({
          concertId: 'concert_invalid',
          userId: 'user_api_002',
          tickets: [{ tierId: 'tier_vip_001', quantity: 1 }],
          idempotencyKey: uuidv4(),
          totalAmount: 100,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Concert not found');
    });

    it('should return 200 for duplicate idempotency key', async () => {
      const idempotencyKey = uuidv4();
      const payload = {
        concertId: 'concert_001',
        userId: 'user_api_003',
        tickets: [{ tierId: 'tier_ga_001', quantity: 1 }],
        idempotencyKey,
        totalAmount: 10,
      };

      // First request
      await request(app)
        .post('/api/v1/bookings')
        .send(payload)
        .expect(201);

      // Second request with same idempotency key
      const response = await request(app)
        .post('/api/v1/bookings')
        .send(payload)
        .expect(200);

      expect(response.body.message).toContain(ERROR_MESSAGES.DUPLICATE_BOOKING);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    
    it('should return 200 with booking details', async () => {
      // Create a booking first
      const createResponse = await request(app)
        .post('/api/v1/bookings')
        .send({
          concertId: 'concert_001',
          userId: 'user_api_004',
          tickets: [{ tierId: 'tier_fr_001', quantity: 2 }],
          idempotencyKey: uuidv4(),
          totalAmount: 100,
        });

      const bookingId = createResponse.body.data.id;

      // Retrieve the booking
      const response = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(bookingId);
      expect(response.body.data.items).toBeDefined();
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/v1/bookings/booking_invalid_999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Booking not found');
    });
  });
});