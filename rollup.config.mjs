import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { nodeExternals } from 'rollup-plugin-node-externals';

export default {
    input: './src/index.tsx',
    output: [
        {
            exports: 'default',
            file: 'dist/index.cjs.js',
            format: 'cjs',
            interop: 'auto',
            sourcemap: true,
        },
    ],
    plugins: [
        nodeExternals(),
        nodeResolve(),
        commonjs({
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            include: 'node_modules/**',
        }),
        babel({
            babelHelpers: 'runtime',
            exclude: 'node_modules/**',
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        }),
        terser(),
        filesize(),
    ],
};
