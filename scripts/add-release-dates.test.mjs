import { expect, test } from 'vitest';

import { addReleaseDates } from './add-release-dates.mjs';

// What `changeset version` leaves at the top of CHANGELOG.md, above the
// entries written by hand
const versioned = `# Changelog

## 1.10.0

### Minor Changes

- 1a2b3c4: Add a feature

## [1.9.0] - 2026-07-29

-   Drop \`styled-components\` dependency
`;

test('dates a new release and leaves the hand-written entries alone', () => {
    const { dated, markdown } = addReleaseDates(versioned, '2026-11-07');

    expect(dated).toEqual(['1.10.0']);
    expect(markdown).toBe(`# Changelog

## 1.10.0

_Released 2026-11-07_

### Minor Changes

- 1a2b3c4: Add a feature

## [1.9.0] - 2026-07-29

-   Drop \`styled-components\` dependency
`);
});

test('changes nothing when it runs again, even on a later day', () => {
    const once = addReleaseDates(versioned, '2026-11-07').markdown;

    const again = addReleaseDates(once, '2026-11-08');

    expect(again.dated).toEqual([]);
    expect(again.markdown).toBe(once);
});

test('dates prereleases too', () => {
    const { dated } = addReleaseDates('## 2.0.0-beta.1\n\n- Try it\n', '2026-11-07');

    expect(dated).toEqual(['2.0.0-beta.1']);
});
