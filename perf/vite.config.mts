import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Builds the perf harness for production, with the lightbox from LIGHTBOX_SRC.
// perf/run.mjs builds one copy per variant, each from a different src/.
export default defineConfig({
    base: './',
    build: {
        emptyOutDir: true,
        minify: process.env.PERF_MINIFY !== 'false',
        outDir: process.env.PERF_OUT_DIR ?? fileURLToPath(new URL('./out/build/worktree', import.meta.url)),
        // Profiles map back to source files through these
        sourcemap: process.env.PERF_MINIFY === 'false',
    },
    logLevel: 'warn',
    resolve: {
        alias: {
            'perf-lightbox': process.env.LIGHTBOX_SRC ?? fileURLToPath(new URL('../src/index.tsx', import.meta.url)),
        },
    },
    root: fileURLToPath(new URL('./harness', import.meta.url)),
});
