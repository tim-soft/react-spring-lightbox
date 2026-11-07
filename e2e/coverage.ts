import type { CoverageReportOptions } from 'monocart-coverage-reports';

import { CoverageReport } from 'monocart-coverage-reports';
import path from 'node:path';

// With E2E_COVERAGE set, the e2e tests record which lines of the library's
// source Chromium runs, and write coverage/e2e/lcov.info for Codecov

export const measuringCoverage = Boolean(process.env.E2E_COVERAGE);

export const coverageOptions: CoverageReportOptions = {
    // Vite serves the library's modules from their paths on disk, under /@fs/
    entryFilter: (entry) => entry.url.includes('/src/') && !entry.url.includes('/node_modules/'),
    name: 'E2E coverage',
    outputDir: 'coverage/e2e',
    reports: ['lcovonly', 'console-summary'],
    sourceFilter: (sourcePath) => sourcePath.startsWith('src/'),
    // Vite's source maps name only the file, so find it beside the served module
    sourcePath: (fileName, { distFile }) => {
        const [, servedPath] = distFile?.split('/@fs/') ?? [];
        if (!servedPath) {
            return fileName;
        }
        const file = path.join(path.dirname(`/${servedPath}`), fileName);
        return path.relative(process.cwd(), file);
    },
};

/** Playwright's global setup: clears coverage from earlier runs, then reports this run's once it ends */
export default () => {
    if (!measuringCoverage) {
        return undefined;
    }
    new CoverageReport(coverageOptions).cleanCache();
    return async () => {
        await new CoverageReport(coverageOptions).generate();
    };
};
