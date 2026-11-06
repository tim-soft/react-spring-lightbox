import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            exclude: ['src/__tests__/**'],
            include: ['src/**/*.{ts,tsx}'],
            // lcov is what the test job uploads to Codecov. The e2e tests
            // write their own report to coverage/e2e.
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: 'coverage/unit',
            thresholds: {
                // At most two uncovered branches: the `else if (goToIndex < 0)`
                // checks in ImagePager can never be false, since goToIndex is
                // always 1 or -1
                branches: -2,
                functions: 100,
                lines: 100,
                statements: 100,
            },
        },
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}'],
        restoreMocks: true,
        setupFiles: ['./src/__tests__/setup.ts'],
    },
});
