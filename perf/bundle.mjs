// What the lightbox adds to a consumer's bundle, and what importing it costs.
//
//   node perf/bundle.mjs [entry ...]
//
// Each entry is a module that a consumer might import. rolldown bundles it with
// React left out, as an app that already has React would, then minifies it.
// Sizes are bytes before compression, after gzip -9, and after brotli -11.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { rolldown } from 'rolldown';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'perf/out/bundle');
mkdirSync(out, { recursive: true });

const entries = {
    'lightbox (dist/index.mjs)': `export { default } from '${join(root, 'dist/index.mjs')}';`,
    'react-spring, what the lightbox imports': `export { animated, config, to, useSpring, useSprings, useTransition } from '@react-spring/web';`,
    'use-gesture, drag + pinch + wheel only': `import { createUseGesture, dragAction, pinchAction, wheelAction } from '@use-gesture/react';
export const useGesture = createUseGesture([dragAction, pinchAction, wheelAction]);`,
    'use-gesture, useGesture': `export { useGesture } from '@use-gesture/react';`,
};

const sizes = async (name, source) => {
    const file = join(out, `${name.replace(/\W+/g, '-')}.mjs`);
    writeFileSync(file, source);
    const bundle = await rolldown({
        external: (id) => /^react(-dom)?(\/|$)/.test(id),
        input: file,
        logLevel: 'silent',
    });
    const { output } = await bundle.generate({ format: 'es', minify: true });
    const code = Buffer.from(output[0].code);
    writeFileSync(file.replace(/\.mjs$/, '.bundle.mjs'), code);
    return {
        brotli: brotliCompressSync(code, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
        gzip: gzipSync(code, { level: 9 }).length,
        minified: code.length,
        name,
    };
};

const rows = [];
for (const [name, source] of Object.entries(entries)) {
    rows.push(await sizes(name, source));
}
console.table(rows);

// Import time: each page preloads one bundle with React in it, then times `import()`,
// which only evaluates the module, in Chromium with the CPU slowed down 4x
const { chromium } = await import('@playwright/test');
const { createServer } = await import('node:http');

const withReact = `export { default as React } from 'react'; export { createRoot } from 'react-dom/client';`;
const importCases = {
    'React + @react-spring/web': `${withReact} export * from '@react-spring/web';`,
    'React + @use-gesture/react': `${withReact} export * from '@use-gesture/react';`,
    'React + lightbox': `${withReact} export { default as Lightbox } from '${join(root, 'dist/index.mjs')}';`,
    'React alone': withReact,
};
const files = {};
for (const [name, source] of Object.entries(importCases)) {
    const file = join(out, `import-${name.replace(/\W+/g, '-')}.mjs`);
    writeFileSync(file, source);
    const bundle = await rolldown({
        input: file,
        logLevel: 'silent',
        transform: { define: { 'process.env.NODE_ENV': '"production"' } },
    });
    const { output } = await bundle.generate({ format: 'es', minify: true });
    files[name] = output[0].code;
}

const server = createServer((request, response) => {
    const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname.slice(1));
    if (name.endsWith('.mjs')) {
        response.writeHead(200, { 'Content-Type': 'text/javascript' }).end(files[name.slice(0, -4)]);
        return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html' }).end(`<!doctype html>
<link rel="modulepreload" href="/${encodeURIComponent(name)}.mjs">
<script type="module">
    await new Promise((resolve) => setTimeout(resolve, 300));
    const start = performance.now();
    await import('/${encodeURIComponent(name)}.mjs');
    window.importMs = performance.now() - start;
</script>`);
});
await new Promise((resolve) => server.listen(0, resolve));
const browser = await chromium.launch({ channel: 'chromium' });
const times = Object.fromEntries(Object.keys(importCases).map((name) => [name, []]));
for (let run = 0; run < 15; run += 1) {
    const names = Object.keys(importCases);
    for (const name of run % 2 ? names : names.reverse()) {
        const page = await browser.newPage();
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await page.goto(`http://localhost:${server.address().port}/${encodeURIComponent(name)}`);
        times[name].push(await page.waitForFunction(() => window.importMs).then((handle) => handle.jsonValue()));
        await page.close();
    }
}
await browser.close();
server.close();
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
console.table(
    Object.entries(times).map(([name, values]) => ({
        'max ms': Math.max(...values).toFixed(1),
        'median ms': median(values).toFixed(1),
        'min ms': Math.min(...values).toFixed(1),
        name,
        runs: values.length,
    }))
);
