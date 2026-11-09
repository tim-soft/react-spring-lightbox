// Sums the time of each trace event on the page's main thread, by event name, to show
// what the time outside JavaScript went to.
//
//   node perf/trace.mjs perf/out/traces/f12-close-1000-1.json [...]
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

for (const file of process.argv.slice(2)) {
    const { traceEvents } = JSON.parse(readFileSync(file, 'utf8'));
    const main = traceEvents.find(({ args, name }) => name === 'thread_name' && args.name === 'CrRendererMain');
    const events = traceEvents.filter(
        ({ dur, ph, pid, tid }) => pid === main.pid && tid === main.tid && ph === 'X' && dur > 0
    );
    const total = new Map();
    for (const { dur, name } of events) {
        total.set(name, (total.get(name) ?? 0) + dur / 1000);
    }
    const top = [...total]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 18)
        .map(([name, ms]) => `  ${ms.toFixed(1).padStart(8)} ms  ${name}`)
        .join('\n');
    console.log(`\n${basename(file)}, main thread, inclusive time by event:\n${top}`);
}
