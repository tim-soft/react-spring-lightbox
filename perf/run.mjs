// Measures the lightbox in Chromium: production builds of one or more variants
// of src/, real input through the DevTools protocol, and the CPU slowed down 4x.
//
//   node perf/run.mjs --variant master=origin/master --variant branch=worktree \
//       --scenario keys --images 5,100,1000 --runs 5
//
// A variant can add harness flags after a question mark, as in lazy=origin/master?lazy.
// --network 20 limits the page to 20 Mbps down with 40ms of latency.
//
// Each run opens a fresh browser context. Runs alternate the variants, so drift and
// warmup favor neither. --count records renders, listeners and style writes instead
// of timing, and --profile writes a CPU profile of each run to perf/out/profiles.
import { chromium, devices } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { appendFileSync, createReadStream, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'perf/out');

const { values: options } = parseArgs({
    options: {
        count: { default: false, type: 'boolean' },
        images: { default: '5,100,1000', type: 'string' },
        network: { type: 'string' },
        'no-build': { default: false, type: 'boolean' },
        profile: { default: false, type: 'boolean' },
        // Extra harness flags for every run, such as format=jpg or lazy
        query: { default: '', type: 'string' },
        results: { default: join(out, 'results.jsonl'), type: 'string' },
        runs: { default: '5', type: 'string' },
        scenario: { multiple: true, type: 'string' },
        throttle: { default: '4', type: 'string' },
        trace: { default: false, type: 'boolean' },
        variant: { default: ['worktree=worktree'], multiple: true, type: 'string' },
    },
});

const variants = options.variant.map((spec) => {
    const [name, source = name] = spec.split('=');
    const [ref, flags = ''] = source.split('?');
    return { flags, name, ref };
});
const imageCounts = options.images.split(',').map(Number);
const runs = Number(options.runs);
const throttle = options.count ? 1 : Number(options.throttle);

/** Builds the harness for production with the lightbox from `ref`, or from src/ for "worktree" */
const build = ({ name, ref }) => {
    let source = join(root, 'src');
    if (ref !== 'worktree') {
        const dir = join(out, 'variants', name);
        rmSync(dir, { force: true, recursive: true });
        mkdirSync(dir, { recursive: true });
        execFileSync('tar', ['-x', '-C', dir], { input: execFileSync('git', ['archive', ref, 'src'], { cwd: root }) });
        source = join(dir, 'src');
    }
    execFileSync('npx', ['vite', 'build', '--config', 'perf/vite.config.mts'], {
        cwd: root,
        env: {
            ...process.env,
            LIGHTBOX_SRC: join(source, 'index.tsx'),
            PERF_MINIFY: String(!options.profile && !options.count),
            PERF_OUT_DIR: join(out, 'build', name),
        },
        stdio: 'inherit',
    });
};

/** A photo-sized JPEG, drawn in the browser, for runs that load real images */
const makePhoto = async (browser) => {
    const file = join(out, 'photo.jpg');
    if (existsSync(file)) {
        return;
    }
    const page = await browser.newPage();
    const base64 = await page.evaluate(() => {
        const canvas = Object.assign(document.createElement('canvas'), { height: 1067, width: 1600 });
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 1600, 1067);
        gradient.addColorStop(0, '#2b5876');
        gradient.addColorStop(1, '#f4a261');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 1600, 1067);
        for (let i = 0; i < 40000; i += 1) {
            context.fillStyle = `hsla(${(i * 37) % 360}, 60%, 50%, 0.35)`;
            context.fillRect((i * 7919) % 1600, (i * 104729) % 1067, 6, 6);
        }
        return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    });
    writeFileSync(file, Buffer.from(base64, 'base64'));
    await page.close();
};

const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript',
    '.svg': 'image/svg+xml',
};

/** Serves /<variant>/ from its build, and /img/<n>.svg or .jpg as a distinct URL per image */
const serve = () =>
    new Promise((resolve) => {
        const server = createServer((request, response) => {
            const { pathname } = new URL(request.url, 'http://localhost');
            const image = /^\/img\/(\d+)\.(svg|jpg)$/.exec(pathname);
            let file;
            if (image) {
                file =
                    image[2] === 'jpg'
                        ? join(out, 'photo.jpg')
                        : join(root, 'e2e/harness/images', `${((Number(image[1]) - 1) % 5) + 1}.svg`);
            } else {
                const [, variant, ...rest] = pathname.split('/');
                file = join(out, 'build', variant, rest.join('/') || 'index.html');
            }
            if (!existsSync(file)) {
                response.writeHead(404).end();
                return;
            }
            response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': contentTypes[extname(file)] });
            createReadStream(file).pipe(response);
        });
        server.listen(0, () => resolve(server));
    });

/** Runs in the page before its scripts: animation frames, long frames and slow events */
const collector = () => {
    const perf = { entries: [], frames: [], recording: false };
    Object.assign(window, { __perf: perf });
    perf.start = () => {
        perf.frames = [];
        perf.recording = true;
        perf.from = performance.now();
        const tick = (time) => {
            if (perf.recording) {
                perf.frames.push(time);
                requestAnimationFrame(tick);
            }
        };
        requestAnimationFrame(tick);
    };
    perf.stop = () => {
        perf.recording = false;
        perf.to = performance.now();
    };
    // Observers report a moment late, so this filters by time after the window closes
    perf.read = () => ({
        entries: perf.entries.filter(({ start }) => start >= perf.from && start <= perf.to),
        frames: perf.frames,
        from: perf.from,
    });
    const observe = (type, map, extra = {}) =>
        new PerformanceObserver((list) => perf.entries.push(...list.getEntries().map(map))).observe({
            type,
            ...extra,
        });
    observe('long-animation-frame', (entry) => ({
        blocking: entry.blockingDuration,
        duration: entry.duration,
        start: entry.startTime,
        type: 'loaf',
    }));
    observe('element', (entry) => ({ identifier: entry.identifier, start: entry.startTime, type: 'element' }));
    observe(
        'event',
        (entry) => ({
            duration: entry.duration,
            name: entry.name,
            processing: entry.processingEnd - entry.processingStart,
            start: entry.startTime,
            type: 'event',
        }),
        { durationThreshold: 16 }
    );
};

/** Input through the DevTools protocol, paced in real time, with timestamps exactly `ms` apart */
const input = (cdp) => {
    let time = Date.now();
    const at = async (ms) => {
        time += ms;
        const wait = time - Date.now();
        if (wait > 0) {
            await new Promise((resolve) => setTimeout(resolve, wait));
        }
        return time / 1000;
    };
    const mouse = async (type, [x, y], ms = 16, extra = {}) =>
        cdp.send('Input.dispatchMouseEvent', { timestamp: await at(ms), type, x, y, ...extra });
    const touch = async (type, points, ms = 16) =>
        cdp.send('Input.dispatchTouchEvent', {
            timestamp: await at(ms),
            touchPoints: points.map(([x, y], id) => ({ id, x, y })),
            type,
        });
    return {
        async drag(points) {
            time = Date.now();
            const pressed = { button: 'left', buttons: 1, clickCount: 1 };
            await mouse('mouseMoved', points[0], 0);
            await mouse('mousePressed', points[0], 16, pressed);
            for (const point of points.slice(1)) {
                await mouse('mouseMoved', point, 16, { button: 'left', buttons: 1 });
            }
            await mouse('mouseReleased', points.at(-1), 16, { ...pressed, buttons: 0 });
        },
        async touches(frames) {
            time = Date.now();
            await touch('touchStart', frames[0].slice(0, 1), 0);
            if (frames[0].length > 1) {
                await touch('touchStart', frames[0]);
            }
            for (const points of frames.slice(1)) {
                await touch('touchMove', points);
            }
            await touch('touchEnd', []);
        },
        async wheel(point, deltasX) {
            time = Date.now();
            for (const deltaX of deltasX) {
                await mouse('mouseWheel', point, 16, { deltaX, deltaY: 0 });
            }
        },
    };
};

const line = (from, to, steps) =>
    Array.from({ length: steps + 1 }, (_, step) => [
        from[0] + ((to[0] - from[0]) * step) / steps,
        from[1] + ((to[1] - from[1]) * step) / steps,
    ]);

const wait = (page, ms) => page.waitForTimeout(ms);

/** The alt text of the image centered in the viewport, as e2e/support.ts reads it */
const shownImage = (page) =>
    page.evaluate(() => {
        const middle = window.innerWidth / 2;
        const shown = [...document.querySelectorAll('img')].find((img) => {
            const { left, width } = img.getBoundingClientRect();
            return width > 0 && Math.abs(left + width / 2 - middle) < 2;
        });
        return shown?.getAttribute('alt');
    });

const scaleOf = (page, index) =>
    page
        .getByAltText(`Image ${index + 1}`, { exact: true })
        .evaluate((img) => new DOMMatrix(getComputedStyle(img).transform).a);

const shows = (page, index) => async () => (await shownImage(page)) === `Image ${index + 1}`;

// Each scenario starts with the lightbox open on image `index` and settled, except `open`
const scenarios = {
    close: {
        act: async ({ page }) => {
            await page.keyboard.press('Escape');
            await wait(page, 1200);
        },
        check:
            ({ page }) =>
            async () =>
                (await page.locator('.lightbox-container').count()) === 0,
    },
    // A longer window, so collecting the closed lightbox's garbage falls inside it
    'close-slowly': {
        act: async ({ page }) => {
            await page.keyboard.press('Escape');
            await wait(page, 5000);
        },
        check:
            ({ page }) =>
            async () =>
                (await page.locator('.lightbox-container').count()) === 0,
    },
    dblclick: {
        act: async ({ index, page, point: [x, y] }) => {
            await page.mouse.dblclick(x, y);
            await wait(page, 1200);
            const zoomed = await scaleOf(page, index);
            await page.mouse.dblclick(x, y);
            await wait(page, 1200);
            return { zoomed };
        },
        check:
            ({ index, page }) =>
            async (result) =>
                result.zoomed > 1.9 && (await scaleOf(page, index)) === 1,
        target: ({ index, page }) => page.getByAltText(`Image ${index + 1}`, { exact: true }),
    },
    drag: {
        // 25px per 16ms is 1.6px/ms, under the 2px/ms flick speed, so it pages by distance
        act: async ({ input, page }) => {
            await input.drag(line([900, 360], [400, 360], 20));
            await wait(page, 1000);
        },
        check: ({ index, page }) => shows(page, index + 1),
    },
    'drag-hold': {
        // 300px out and back, under the 366px that pages at 1280px wide
        act: async ({ input, page }) => {
            await input.drag([...line([900, 360], [600, 360], 40), ...line([600, 360], [900, 360], 40).slice(1)]);
            await wait(page, 800);
        },
        check: ({ index, page }) => shows(page, index),
    },
    keys: {
        act: async ({ page }) => {
            for (let press = 0; press < 4; press += 1) {
                await page.keyboard.press('ArrowRight');
                await wait(page, 800);
            }
            await wait(page, 400);
        },
        check: ({ index, page }) => shows(page, index + 4),
    },
    open: {
        act: async ({ page, point: [x, y] }) => {
            await page.mouse.click(x, y);
            await wait(page, 1500);
        },
        check: ({ index, page }) => shows(page, index),
        closed: true,
        target: ({ page }) => page.getByRole('button', { exact: true, name: 'Open' }),
    },
    // Opening on a slow network, with --network, waits longer for the images to arrive
    'open-slowly': {
        act: async ({ page, point: [x, y] }) => {
            await page.mouse.click(x, y);
            await wait(page, 8000);
        },
        check: ({ index, page }) => shows(page, index),
        closed: true,
        target: ({ page }) => page.getByRole('button', { exact: true, name: 'Open' }),
    },
    pinch: {
        // Two fingers 80px apart spread to 280px over 30 moves, then lift
        act: async ({ input, page }) => {
            const frames = line([166, 420], [66, 420], 30).map(([x, y]) => [
                [x, y],
                [412 - x, y],
            ]);
            await input.touches(frames);
            await wait(page, 1000);
        },
        check:
            ({ index, page }) =>
            async () =>
                (await scaleOf(page, index)) > 1.5,
        mobile: true,
    },
    swipe: {
        act: async ({ input, page }) => {
            await input.touches(line([350, 420], [50, 420], 20).map((point) => [point]));
            await wait(page, 1000);
        },
        check: ({ index, page }) => shows(page, index + 1),
        mobile: true,
    },
    wheel: {
        // A trackpad swipe: four finger events, then momentum that decays by 6% per event
        act: async ({ input, page }) => {
            const momentum = [];
            for (let delta = -50 * 0.94; Math.abs(delta) >= 1; delta *= 0.94) {
                momentum.push(Math.round(delta));
            }
            await input.wheel([640, 360], [-5, -15, -30, -50, ...momentum]);
            await wait(page, 800);
        },
        check: ({ index, page }) => shows(page, index + 1),
    },
};

const metricNames = [
    'TaskDuration',
    'ScriptDuration',
    'RecalcStyleDuration',
    'LayoutDuration',
    'RecalcStyleCount',
    'LayoutCount',
];

const readMetrics = async (cdp) =>
    Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]));

const measure = async ({ browser, flags, images, run, scenarioName, url, variant }) => {
    const scenario = scenarios[scenarioName];
    const context = await browser.newContext(
        scenario.mobile ? { ...devices['Pixel 7'] } : { viewport: { height: 720, width: 1280 } }
    );
    const page = await context.newPage();
    await page.addInitScript(collector);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    if (options.network) {
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', {
            downloadThroughput: (Number(options.network) * 1e6) / 8,
            latency: 40,
            offline: false,
            uploadThroughput: (Number(options.network) * 1e6) / 8 / 4,
        });
    }

    // Far enough from the end for four pages forward, with an image before it in larger galleries
    const index = Math.max(0, Math.floor(images / 2) - 2);
    const query = new URLSearchParams(`${options.query}&${flags}&images=${images}&index=${index}`);
    if (scenario.closed) {
        query.set('closed', '');
    }
    if (options.count) {
        query.set('count', '');
    }
    await page.goto(`${url}/${variant}/index.html?${query}`);
    if (!scenario.closed) {
        await page.locator('.lightbox-container').waitFor();
    }
    await page.waitForLoadState('networkidle');
    await wait(page, 1500);

    // Clicks go to a point found before timing starts, so Playwright's checks aren't timed
    const box = scenario.target ? await scenario.target({ index, page }).boundingBox() : undefined;
    const point = box ? [box.x + box.width / 2, box.y + box.height / 2] : undefined;

    let requests = 0;
    page.on('request', (request) => {
        if (request.url().includes('/img/')) {
            requests += 1;
        }
    });
    // Collect the garbage from setting up, so it isn't collected in the timed window
    await cdp.send('HeapProfiler.collectGarbage');
    // Only the timed window runs on the slowed-down CPU, so setting up a large gallery stays quick
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    const before = await readMetrics(cdp);
    if (options.count) {
        await page.evaluate(() => window.__resetCounts());
    }
    if (options.profile) {
        await cdp.send('Profiler.enable');
        await cdp.send('Profiler.start');
    }
    if (options.trace) {
        await browser.startTracing(page, {
            categories: [
                'blink',
                'blink.user_timing',
                'devtools.timeline',
                'disabled-by-default-devtools.timeline',
                'loading',
                'toplevel',
                'toplevel.flow',
                'v8.execute',
            ],
        });
    }
    await page.evaluate(() => window.__perf.start());
    const result = (await scenario.act({ index, input: input(cdp), page, point })) ?? {};
    await page.evaluate(() => window.__perf.stop());
    const after = await readMetrics(cdp);
    if (options.trace) {
        mkdirSync(join(out, 'traces'), { recursive: true });
        writeFileSync(
            join(out, 'traces', `${variant}-${scenarioName}-${images}-${run}.json`),
            await browser.stopTracing()
        );
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    if (options.profile) {
        const { profile } = await cdp.send('Profiler.stop');
        mkdirSync(join(out, 'profiles'), { recursive: true });
        writeFileSync(
            join(out, 'profiles', `${variant}-${scenarioName}-${images}-${run}.cpuprofile`),
            JSON.stringify(profile)
        );
    }
    const counts = options.count ? await page.evaluate(() => window.__counts) : undefined;
    await wait(page, 300);
    const { entries, frames, from } = await page.evaluate(() => window.__perf.read());
    const passed = await scenario.check({ index, page })(result);
    await context.close();
    // Let the closed page's renderer exit before the next run starts
    await new Promise((resolve) => setTimeout(resolve, 500));

    const intervals = frames.slice(1).map((time, i) => time - frames[i]);
    const loafs = entries.filter(({ type }) => type === 'loaf');
    const events = entries.filter(({ type }) => type === 'event');
    const shown = entries.find(({ identifier }) => identifier === `image-${index + 1}`);
    return {
        counts,
        // From the start of the window, usually the click or key press, to the first paint of the image
        currentImageMs: shown ? shown.start - from : null,
        domNodes: after.Nodes,
        events: events.map(({ duration, name }) => `${name}:${Math.round(duration)}`),
        frames: intervals.length,
        // The JavaScript heap after the garbage collection before the timed window
        heapMB: before.JSHeapUsedSize / 1e6,
        images,
        jankFrames: intervals.filter((interval) => interval > 25).length,
        jsListeners: after.JSEventListeners,
        loafBlockingMs: loafs.reduce((sum, { blocking }) => sum + blocking, 0),
        maxEventMs: Math.max(0, ...events.map(({ duration }) => duration)),
        maxFrameMs: Math.max(0, ...intervals),
        passed,
        query: options.query,
        requests,
        run,
        scenario: scenarioName,
        throttle,
        variant,
        ...Object.fromEntries(
            metricNames.map((name) => [
                name.replace('Duration', 'Ms'),
                name.endsWith('Duration') ? (after[name] - before[name]) * 1000 : after[name] - before[name],
            ])
        ),
    };
};

if (!options['no-build']) {
    variants.forEach(build);
}
const server = await serve();
const url = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chromium' });
await makePhoto(browser);

const scenarioNames = options.scenario ?? Object.keys(scenarios);
for (let run = 1; run <= runs; run += 1) {
    for (const scenarioName of scenarioNames) {
        for (const images of imageCounts) {
            // Rotate the order, so warmup, drift and the run before favor no variant
            const order = variants.map((_, position) => variants[(position + run - 1) % variants.length]);
            for (const { flags, name } of order) {
                const result = await measure({ browser, flags, images, run, scenarioName, url, variant: name });
                appendFileSync(options.results, `${JSON.stringify(result)}\n`);
                const summary = options.count
                    ? JSON.stringify(result.counts)
                    : `task ${result.TaskMs.toFixed(0)}ms, script ${result.ScriptMs.toFixed(0)}ms, jank ${result.jankFrames}/${result.frames}`;
                console.log(
                    `${run} ${scenarioName} ${images} ${name}: ${result.passed ? 'ok' : 'FAILED CHECK'}, ${summary}`
                );
            }
        }
    }
}
await browser.close();
server.close();
