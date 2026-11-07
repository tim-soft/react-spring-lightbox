#!/usr/bin/env node
/**
 * Dates new releases in CHANGELOG.md after `changeset version` writes them (see the `ch:version` script).
 *
 * Changesets writes a bare `## x.y.z` heading for each release. This adds a `_Released YYYY-MM-DD_` line, with
 * today's date in UTC, under each such heading that has no date yet, so running it again changes nothing. The
 * heading stays as it is, because changesets/action finds a release's notes for its GitHub release by the exact
 * version heading. Entries written by hand before Changesets, like `## [1.9.0] - 2026-07-29`, are left alone.
 */
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const VERSION_HEADING = /^## (\d+\.\d+\.\d+(?:-[\w.]+)?)\s*$/;
const RELEASE_DATE = /^_Released \d{4}-\d{2}-\d{2}_\s*$/;

/** The changelog with `date` under each undated version heading, and the versions it dated */
export const addReleaseDates = (markdown, date) => {
    const lines = markdown.split('\n');
    const output = [];
    const dated = [];
    lines.forEach((line, index) => {
        output.push(line);
        const version = VERSION_HEADING.exec(line)?.[1];
        if (!version) {
            return;
        }
        const next = lines.slice(index + 1).find((later) => later.trim());
        if (next && RELEASE_DATE.test(next)) {
            return;
        }
        output.push('', `_Released ${date}_`);
        dated.push(version);
    });
    return { dated, markdown: output.join('\n') };
};

// Run as a script, not when a test imports it
if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const changelog = new URL('../CHANGELOG.md', import.meta.url);
    const today = new Date().toISOString().slice(0, 10);
    const { dated, markdown } = addReleaseDates(readFileSync(changelog, 'utf8'), today);
    writeFileSync(changelog, markdown);
    console.log(
        dated.length
            ? `add-release-dates: dated ${dated.join(', ')} ${today}`
            : 'add-release-dates: every release already has a date'
    );
}
