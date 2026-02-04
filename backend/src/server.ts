import { configDotenv } from 'dotenv';
configDotenv();

import express from 'express';
import { healthCheck } from './database/pg.client';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get('/health', async (_req, res) => {
  const isHealthy = await healthCheck();
  res.json({
    status: isHealthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Check database connection on startup
  const dbHealthy = await healthCheck();
  if (!dbHealthy) {
    console.error('Database connection failed on startup');
  }
});
