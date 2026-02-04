import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: parseInt(process.env.PGBOUNCER_PORT ?? '6433'),
  database: 'ticket_booking',
  user: 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  max: 50,
  min: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function healthCheck() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('✅ Database health check passed');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  } finally {
    client.release();
  }
}

export { pool };
