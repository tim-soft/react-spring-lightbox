/**
 * Configure Jest as the test runner for @testing-library
 *
 * @see https://jestjs.io/docs/en/configuration
 */
module.exports = {
    collectCoverage: true,
    coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/'],
    preset: 'ts-jest',
    setupFilesAfterEnv: [
        '@testing-library/jest-dom/extend-expect',
        'babel-polyfill',
    ],
    testEnvironment: 'jsdom',
    testMatch: ['**/__tests__/**/*.(spec|test).[jt]s?(x)'],
};
