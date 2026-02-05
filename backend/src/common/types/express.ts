/* eslint-disable @typescript-eslint/no-namespace */

import type { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      logger: Logger;
      correlationId: string;
    }
  }
}

export {};
