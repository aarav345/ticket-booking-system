import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
        exclude: ['node_modules', 'dist'],
        coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        exclude: [
            'node_modules/',
            'tests/',
            'dist/',
            'src/server.ts',
            '**/*.d.ts',
        ],
        },
        mockReset: true,
        clearMocks: true,
        restoreMocks: true,
    },
    resolve: {
        alias: {
        '@': path.resolve(__dirname, './src'),
        '@config': path.resolve(__dirname, './src/config'),
        '@common': path.resolve(__dirname, './src/common'),
        '@modules': path.resolve(__dirname, './src/modules'),
        '@database': path.resolve(__dirname, './src/database'),
        },
    },
});