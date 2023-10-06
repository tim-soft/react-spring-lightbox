/**
 * Configure Jest as the test runner for @testing-library
 *
 * @see https://jestjs.io/docs/en/configuration
 */
module.exports = {
    collectCoverage: true,
    coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/'],
    preset: 'ts-jest',
    setupFilesAfterEnv: ['babel-polyfill', '<rootDir>/jest-setup.ts'],
    testEnvironment: 'jsdom',
    testMatch: ['**/__tests__/**/*.(spec|test).[jt]s?(x)'],
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
        '^.+\\.(ts|tsx)?$': 'ts-jest',
    },
};
