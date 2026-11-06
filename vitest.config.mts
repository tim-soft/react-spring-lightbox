import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            exclude: ['src/__tests__/**'],
            include: ['src/**/*.{ts,tsx}'],
        },
        environment: 'jsdom',
        setupFiles: ['./src/__tests__/setup.ts'],
    },
});
