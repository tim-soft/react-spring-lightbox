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

/**
 * Exact two-sided p-value of the Mann-Whitney U test. It counts how many ways each rank sum can
 * arise for a sample the size of `a`, one rank at a time, instead of listing every split of the ranks.
 */
const mannWhitney = (a, b) => {
    const values = [...a, ...b].sort((x, y) => x - y);
    // Twice each midrank, so tied ranks stay whole numbers
    const doubledRank = (value) => values.indexOf(value) + values.lastIndexOf(value) + 2;
    const ranks = values.map(doubledRank);
    const observed = a.reduce((sum, value) => sum + doubledRank(value), 0);
    const expected = a.length * (values.length + 1);
    const most = ranks.reduce((sum, rank) => sum + rank, 0);
    // ways[k][sum] counts the picks of k ranks, among those seen so far, that add up to sum
    const ways = Array.from({ length: a.length + 1 }, () => new Float64Array(most + 1));
    ways[0][0] = 1;
    for (const rank of ranks) {
        for (let k = a.length; k >= 1; k -= 1) {
            for (let sum = most; sum >= rank; sum -= 1) {
                ways[k][sum] += ways[k - 1][sum - rank];
            }
        }
    }
    let extreme = 0;
    let total = 0;
    ways[a.length].forEach((count, sum) => {
        total += count;
        if (Math.abs(sum - expected) >= Math.abs(observed - expected)) {
            extreme += count;
        }
    });
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
                const baseMedian = median(base);
                const change = ((median(list) - baseMedian) / baseMedian) * 100;
                let percent = `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
                // A change from a median of 0 has no percentage
                if (baseMedian === 0) {
                    percent = median(list) === 0 ? '+0%' : 'n/a';
                }
                cell += ` ${percent} p=${mannWhitney(base, list).toFixed(3)}`;
            }
            return cell;
        });
        console.log(
            `  ${variant.padEnd(12)} n=${variantRows.length}${failed ? ` FAILED ${failed}` : ''}  ${cells.join('  ')}`
        );
    }
}
