// Sums the self time in CPU profiles from `perf/run.mjs --profile` by source file,
// through the harness build's source map, then lists the slowest functions.
//
//   node perf/profile.mjs perf/out/profiles/f1f2-keys-1000-1.cpuprofile [...]
import { readdirSync, readFileSync } from 'node:fs';
import { SourceMap } from 'node:module';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const build = fileURLToPath(new URL('./out/build', import.meta.url));
const maps = new Map();

/** The source map of the harness build that served `url` */
const mapFor = (url) => {
    const match = /\/([^/]+)\/assets\/([^/?]+\.js)/.exec(url);
    if (!match) {
        return null;
    }
    const file = join(build, match[1], 'assets', match[2]);
    if (!maps.has(file)) {
        const payload = readdirSync(join(build, match[1], 'assets')).includes(`${match[2]}.map`)
            ? JSON.parse(readFileSync(`${file}.map`, 'utf8'))
            : null;
        maps.set(file, payload && new SourceMap(payload));
    }
    return maps.get(file);
};

/** node_modules/<package> or the path under src/ */
const owner = (source) => {
    const pkg = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(source);
    if (pkg) {
        return pkg[1];
    }
    const src = /\/src\/(.*)$/.exec(source);
    return src ? `src/${src[1]}` : source;
};

for (const file of process.argv.slice(2)) {
    const { nodes, samples, timeDeltas } = JSON.parse(readFileSync(file, 'utf8'));
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const self = new Map();
    samples.forEach((id, index) => self.set(id, (self.get(id) ?? 0) + (timeDeltas[index] ?? 0) / 1000));
    const total = [...self.values()].reduce((sum, ms) => sum + ms, 0);

    const byOwner = new Map();
    const byFunction = new Map();
    for (const [id, ms] of self) {
        const { callFrame } = byId.get(id);
        let where = callFrame.url ? basename(callFrame.url) : `(${callFrame.functionName || 'native'})`;
        const map = callFrame.url ? mapFor(callFrame.url) : null;
        const entry = map?.findEntry(callFrame.lineNumber, callFrame.columnNumber);
        if (entry?.originalSource) {
            where = owner(entry.originalSource);
        }
        const name = `${callFrame.functionName || '(anonymous)'} ${where}${entry?.originalLine === undefined ? '' : `:${entry.originalLine + 1}`}`;
        byOwner.set(where, (byOwner.get(where) ?? 0) + ms);
        byFunction.set(name, (byFunction.get(name) ?? 0) + ms);
    }
    const top = (map, count) =>
        [...map]
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(
                ([name, ms]) =>
                    `  ${ms.toFixed(1).padStart(8)} ms ${((ms / total) * 100).toFixed(1).padStart(5)}%  ${name}`
            )
            .join('\n');
    console.log(
        `\n${basename(file)}: ${total.toFixed(0)} ms sampled\nBy source:\n${top(byOwner, 12)}\nBy function:\n${top(byFunction, 20)}`
    );
}
