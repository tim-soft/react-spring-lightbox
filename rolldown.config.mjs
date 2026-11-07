import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

import pkg from './package.json' with { type: 'json' };

const dependencies = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];
const watching = process.argv.includes('--watch');

// index.cjs sets module.exports to the component, so its types need `export =`
const commonJsTypes = `import type { default as LightboxComponent, ImagesListType as ImagesList } from './index.mjs' with { 'resolution-mode': 'import' };

declare const Lightbox: typeof LightboxComponent;
declare namespace Lightbox {
    export type ImagesListType = ImagesList;
}
export = Lightbox;
`;

const shared = {
    external: (id) => dependencies.some((name) => id === name || id.startsWith(`${name}/`)),
    input: './src/index.tsx',
    transform: {
        // ES2022 runs natively in Safari 15.6+, Chrome 109+, and Firefox 102+
        target: 'es2022',
    },
};

export default defineConfig([
    {
        ...shared,
        output: { dir: 'dist', entryFileNames: '[name].mjs', format: 'es', minify: true, sourcemap: true },
        // The demo's hot reload only needs the JavaScript, and declarations take a TypeScript run
        plugins: watching ? [] : [dts({ tsconfig: 'tsconfig.buildtypes.json' })],
    },
    {
        ...shared,
        output: { exports: 'default', file: 'dist/index.cjs', format: 'cjs', minify: true, sourcemap: true },
        plugins: [
            {
                generateBundle() {
                    this.emitFile({ fileName: 'index.d.cts', source: commonJsTypes, type: 'asset' });
                },
                name: 'commonjs-types',
            },
        ],
    },
]);
