// Summarizes perf/run.mjs results: the median and range of each metric for each
// scenario, gallery size and variant, and, against the first variant, the change
// in the median with an exact two-sided Mann-Whitney U p-value.
//
//   node perf/report.mjs perf/out/results.jsonl [--metric TaskMs --metric jankFrames]
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { metric: { multiple: true, type: 'string' } },
});
const metrics = values.metric ?? ['TaskMs', 'ScriptMs', 'jankFrames', 'maxFrameMs', 'maxEventMs'];

const results = positionals.flatMap((file) =>
    readFileSync(file, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
);

const median = (list) => {
    const sorted = [...list].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** Exact two-sided p-value of the Mann-Whitney U test, by enumerating every split of the ranks */
const mannWhitney = (a, b) => {
    const all = [...a.map((value) => ({ group: 0, value })), ...b.map((value) => ({ group: 1, value }))].sort(
        (x, y) => x.value - y.value
    );
    const ranks = all.map(({ value }) => {
        const first = all.findIndex((item) => item.value === value);
        const last = all.findLastIndex((item) => item.value === value);
        return (first + last) / 2 + 1;
    });
    const rankSum = (indexes) => indexes.reduce((sum, index) => sum + ranks[index], 0);
    const observed = rankSum(all.flatMap(({ group }, index) => (group === 0 ? [index] : [])));
    const expected = (a.length * (all.length + 1)) / 2;
    let extreme = 0;
    let total = 0;
    const choose = (start, picked) => {
        if (picked.length === a.length) {
            total += 1;
            if (Math.abs(rankSum(picked) - expected) >= Math.abs(observed - expected) - 1e-9) {
                extreme += 1;
            }
            return;
        }
        for (let index = start; index <= all.length - (a.length - picked.length); index += 1) {
            choose(index + 1, [...picked, index]);
        }
    };
    choose(0, []);
    return extreme / total;
};

const format = (value) => (Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1));

const groups = Map.groupBy(results, ({ images, scenario }) => `${scenario} ${images}`);
for (const [group, rows] of groups) {
    const variants = Map.groupBy(rows, ({ variant }) => variant);
    const [baseName, baseRows] = [...variants][0];
    console.log(`\n${group} images`);
    for (const [variant, variantRows] of variants) {
        const failed = variantRows.filter(({ passed }) => !passed).length;
        const cells = metrics.map((metric) => {
            const list = variantRows.map((row) => row[metric]);
            let cell = `${metric} ${format(median(list))} [${format(Math.min(...list))}-${format(Math.max(...list))}]`;
            if (variant !== baseName) {
                const base = baseRows.map((row) => row[metric]);
                const change = median(base) ? ((median(list) - median(base)) / median(base)) * 100 : 0;
                cell += ` ${change >= 0 ? '+' : ''}${change.toFixed(0)}% p=${mannWhitney(base, list).toFixed(3)}`;
            }
            return cell;
        });
        console.log(
            `  ${variant.padEnd(12)} n=${variantRows.length}${failed ? ` FAILED ${failed}` : ''}  ${cells.join('  ')}`
        );
    }
}
