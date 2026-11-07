import { defineConfig } from 'rolldown';

import pkg from './package.json' with { type: 'json' };

const dependencies = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

export default defineConfig({
    external: (id) => dependencies.some((name) => id === name || id.startsWith(`${name}/`)),
    input: './src/index.tsx',
    output: {
        exports: 'default',
        file: 'dist/index.cjs.js',
        format: 'cjs',
        minify: true,
        sourcemap: true,
    },
    transform: {
        // ES2022 runs natively in Safari 15.6+, Chrome 109+, and Firefox 102+
        target: 'es2022',
    },
});
