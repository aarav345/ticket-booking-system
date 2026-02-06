import { vi } from 'vitest';
import { config } from 'dotenv';
import path from 'path';

// ✅ Load .env file FIRST
config({ path: path.resolve(__dirname, '../.env') });


// ─── Environment Setup ─────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

console.log('Test environment initialized');

if (process.env.CI || process.env.SILENT_TESTS) {
    global.console = {
        ...console,
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
    };
}