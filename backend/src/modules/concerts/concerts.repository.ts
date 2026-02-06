import { pool } from '../../database/pg.client';
import type { Concert, TicketAvailability } from './concerts.types';

export class ConcertRepository {
  /**
   * Find concert by ID
   */
  async findById(concertId: string): Promise<Concert | null> {
    const result = await pool.query<Concert>(
      'SELECT * FROM concerts WHERE id = $1',
      [concertId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get ticket availability for a concert
   */
  async getTicketAvailability(
    concertId: string
  ): Promise<TicketAvailability[]> {
    const result = await pool.query<TicketAvailability>(
      `SELECT 
         id,
         tier_name,
         price,
         total_quantity,
         available_quantity
       FROM ticket_tiers
       WHERE concert_id = $1
       ORDER BY price DESC`, // VIP first, then Front Row, then GA
      [concertId]
    );
    return result.rows;
  }

  /**
   * Get all concerts (optional - for listing page)
   */
  async findAll(): Promise<Concert[]> {
    const result = await pool.query<Concert>(
      `SELECT * FROM concerts 
       ORDER BY event_date ASC`
    );
    return result.rows;
  }

  /**
   * Check if concert exists
   */
  async exists(concertId: string): Promise<boolean> {
    const result = await pool.query('SELECT 1 FROM concerts WHERE id = $1', [
      concertId,
    ]);
    return result.rows.length > 0;
  }
}

export const concertRepository = new ConcertRepository();
