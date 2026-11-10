// Shows what changing currentIndex looks like on two builds, by jumping between distant
// images and paging quickly in a 60-image gallery with numbered images. It prints, for each
// page change, where the new image starts, how long the old one stays on the stage, and which
// other images cross the stage, then records both builds side by side as a video.
//
//   node perf/jumps.mjs master=origin/master branch=HEAD
//
// The video lands in perf/out/jumps.webm.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { copyFileSync, createReadStream, existsSync, mkdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'perf/out');
const builds = (process.argv.length > 2 ? process.argv.slice(2) : ['master=origin/master', 'branch=HEAD']).map(
    (spec) => {
        const [name, ref] = spec.split('=');
        return { name, ref };
    }
);
const width = 1280;

for (const { name, ref } of builds) {
    const dir = join(out, 'variants', `jumps-${name}`);
    rmSync(dir, { force: true, recursive: true });
    mkdirSync(dir, { recursive: true });
    execFileSync('tar', ['-x', '-C', dir], { input: execFileSync('git', ['archive', ref, 'src'], { cwd: root }) });
    execFileSync('npx', ['vite', 'build', '--config', 'perf/vite.config.mts'], {
        cwd: root,
        env: {
            ...process.env,
            LIGHTBOX_SRC: join(dir, 'src/index.tsx'),
            PERF_OUT_DIR: join(out, 'build', `jumps-${name}`),
        },
        stdio: 'inherit',
    });
}

const numbered = (n) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
<rect width="800" height="500" fill="hsl(${(n * 47) % 360}, 55%, 42%)"/>
<text x="400" y="320" font-family="sans-serif" font-size="240" font-weight="bold" fill="white" text-anchor="middle">${n}</text></svg>`;

const sideBySide = `<!doctype html><meta charset="utf-8"><style>
body { margin: 0; display: flex; font-family: sans-serif; background: #222; }
div { width: 640px; } h1 { margin: 0; height: 40px; line-height: 40px; color: white; font-size: 20px; text-align: center; }
iframe { width: 640px; height: 700px; border: 0; display: block; }
</style>${builds
    .map(({ name }) => `<div><h1>${name}</h1><iframe src="/jumps-${name}/index.html?images=60&index=0"></iframe></div>`)
    .join('')}`;

const server = createServer((request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost');
    const image = /^\/img\/(\d+)\.svg$/.exec(pathname);
    if (image) {
        response.writeHead(200, { 'Content-Type': 'image/svg+xml' }).end(numbered(Number(image[1])));
        return;
    }
    if (pathname === '/side-by-side.html') {
        response.writeHead(200, { 'Content-Type': 'text/html' }).end(sideBySide);
        return;
    }
    const file = join(out, 'build', ...pathname.split('/').slice(1));
    if (!existsSync(file)) {
        response.writeHead(404).end();
        return;
    }
    const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };
    response.writeHead(200, { 'Content-Type': types[extname(file)] });
    createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;

/** Runs in the page: records each visible page's image number and translateX on every frame */
const startSampling = () => {
    const state = { frames: [], marks: [], recording: true };
    Object.assign(window, { __jumps: state });
    const sample = (time) => {
        const pages = [...document.querySelectorAll('.lightbox-image-pager')]
            .filter((span) => getComputedStyle(span).display !== 'none')
            .map((span) => {
                // A page writes translateX in pixels, or in percent of its own width
                const [, value, unit] = /translateX\((-?[\d.e+-]+)(px|%)\)/.exec(span.style.transform) ?? [];
                return [
                    Number(span.querySelector('img').alt.replace('Image ', '')),
                    unit === '%' ? (Number(value) / 100) * span.offsetWidth : Number(value),
                ];
            });
        state.frames.push({ pages, time });
        if (state.recording) {
            requestAnimationFrame(sample);
        }
    };
    requestAnimationFrame(sample);
};

// [index to show, ms to wait before showing it]
const sequences = {
    'jumps 150ms apart': [
        [49, 0],
        [2, 150],
        [14, 150],
    ],
    'jumps that finish': [
        [49, 0],
        [2, 1500],
        [14, 1500],
        [15, 1500],
    ],
    'steps 100ms apart': [
        [1, 0],
        [2, 100],
        [3, 100],
    ],
};

/** For each page change: where the new image starts, how long the old one stays, what else crosses */
const summarize = ({ frames, marks }) => {
    let shown = 1;
    return marks.map(({ index, time }, n) => {
        const end = marks[n + 1]?.time ?? Infinity;
        const during = frames.filter((frame) => frame.time >= time && frame.time < end);
        const onStage = (frame, image) => frame.pages.some(([i, x]) => i === image && Math.abs(x) < width);
        const arriving = during
            .map((frame) => [frame.time - time, frame.pages.find(([i]) => i === index + 1)?.[1]])
            .filter(([, x]) => x !== undefined);
        const crossing = new Set(
            during.flatMap((frame) =>
                frame.pages.filter(([i, x]) => i !== index + 1 && i !== shown && Math.abs(x) < width).map(([i]) => i)
            )
        );
        const row = {
            change: `${shown} to ${index + 1}`,
            'new image on stage after ms': Math.round(arriving.find(([, x]) => Math.abs(x) < width)?.[0]),
            'new image starts at px': Math.round(arriving[0]?.[1]),
            'old image frames on stage': during.filter((frame) => onStage(frame, shown)).length,
            'other images crossing': [...crossing].join(',') || 'none',
        };
        shown = index + 1;
        return row;
    });
};

const browser = await chromium.launch({ channel: 'chromium' });
for (const [sequence, steps] of Object.entries(sequences)) {
    for (const { name } of builds) {
        const page = await browser.newPage({ viewport: { height: 720, width } });
        await page.goto(`${base}/jumps-${name}/index.html?images=60&index=0`);
        await page.locator('.lightbox-container').waitFor();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        await page.evaluate(startSampling);
        for (const [index, delay] of steps) {
            await page.waitForTimeout(delay);
            await page.evaluate((n) => {
                window.__jumps.marks.push({ index: n, time: performance.now() });
                window.setLightboxIndex(n);
            }, index);
        }
        await page.waitForTimeout(1500);
        const recorded = await page.evaluate(() => {
            window.__jumps.recording = false;
            return window.__jumps;
        });
        console.log(`\n${sequence}, ${name}`);
        console.table(summarize(recorded));
        await page.close();
    }
}

const context = await browser.newContext({
    recordVideo: { dir: join(out, 'jumps-video'), size: { height: 740, width } },
    viewport: { height: 740, width },
});
const page = await context.newPage();
await page.goto(`${base}/side-by-side.html`);
await page.waitForTimeout(2500);
for (const [index, delay] of [...sequences['jumps that finish'], [16, 1500], [17, 100], [18, 100]]) {
    await page.waitForTimeout(delay || 800);
    await page.evaluate((n) => {
        for (const frame of document.querySelectorAll('iframe')) {
            frame.contentWindow.setLightboxIndex(n);
        }
    }, index);
}
await page.waitForTimeout(2000);
const video = page.video();
await context.close();
copyFileSync(await video.path(), join(out, 'jumps.webm'));
console.log(`\nVideo: ${join(out, 'jumps.webm')}`);
await browser.close();
server.close();
