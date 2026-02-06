import type { CorsOptions } from 'cors';

const corsConfig: CorsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
  credentials: true,
  optionsSuccessStatus: 200,
};

export default corsConfig;
