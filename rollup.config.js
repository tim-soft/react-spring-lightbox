import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

const root = process.platform === 'win32' ? path.resolve('/') : '/';

export default {
    external: (id) => !id.startsWith('.') && !id.startsWith(root),
    input: './src/index.tsx',
    output: [
        {
            exports: 'default',
            file: pkg.main,
            format: 'cjs',
            sourcemap: true,
        },
        {
            exports: 'default',
            file: pkg.module,
            format: 'es',
            sourcemap: true,
        },
    ],
    plugins: [
        typescript(),
        nodeResolve(),
        commonjs({
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            include: 'node_modules/**',
        }),
        terser(),
        filesize(),
    ],
};
