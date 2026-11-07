/**
 * Oxlint JS plugin that sorts object destructuring keys case-insensitively. It replaces
 * eslint-plugin-sort-destructure-keys, which needs ESLint installed.
 */

/**
 * @param {import('estree').Property | import('estree').RestElement} prop
 * @returns {string | null} null = skip pattern (computed, etc.)
 */
function getSortKey(prop) {
    if (prop.type === 'RestElement') {
        return null;
    }
    if (prop.method || prop.kind !== 'init') {
        return null;
    }
    if (prop.computed) {
        return null;
    }
    const k = prop.key;
    if (k.type === 'Identifier') {
        return k.name;
    }
    if (k.type === 'Literal') {
        return String(k.value);
    }
    return null;
}

/**
 * @param {string} a
 * @param {string} b
 */
function compareKeys(a, b) {
    return a.localeCompare(b, 'en', { sensitivity: 'base' });
}

/**
 * @param {import('eslint').Rule.RuleContext} context
 */
function getSourceCode(context) {
    if (context.sourceCode) {
        return context.sourceCode;
    }
    if (typeof context.getSourceCode === 'function') {
        return context.getSourceCode();
    }
    throw new Error('sort-destructure-keys: no sourceCode on context');
}

/** @type {import('eslint').Rule.RuleModule} */
const sortedDestructuringKeysRule = {
    create(context) {
        const sourceCode = getSourceCode(context);

        return {
            ObjectPattern(node) {
                const { properties } = node;
                if (properties.length < 2) {
                    return;
                }

                /** @type {{ prop: import('estree').Property; key: string }[]} */
                const entries = [];
                /** @type {import('estree').RestElement | null} */
                let restNode = null;

                for (let i = 0; i < properties.length; i++) {
                    const p = properties.at(i);
                    if (!p) {
                        continue;
                    }
                    if (p.type === 'RestElement') {
                        if (i !== properties.length - 1) {
                            context.report({
                                messageId: 'restNotLast',
                                node: p,
                            });
                        }
                        restNode = p;
                        break;
                    }

                    const key = getSortKey(p);
                    if (key === null) {
                        return;
                    }
                    entries.push({ key, prop: p });
                }

                if (entries.length < 2) {
                    return;
                }

                const keys = entries.map((e) => e.key);
                const sortedKeys = [...keys].sort(compareKeys);
                const isSorted = keys.every((k, i) => compareKeys(k, sortedKeys.at(i) ?? '') === 0);

                if (isSorted) {
                    return;
                }

                context.report({
                    data: { expected: sortedKeys.join(', ') },
                    fix(fixer) {
                        // A default, even a nested one, can read a sibling binding that sorting would move after it
                        if (entries.some(({ prop }) => prop.value.type !== 'Identifier')) {
                            return null;
                        }
                        // Rebuilding the pattern from each property's text would drop the comments between them
                        if (sourceCode.getCommentsInside(node).length > 0) {
                            return null;
                        }
                        const open = sourceCode.getFirstToken(node);
                        const close = sourceCode.getLastToken(node);
                        if (!open || !close || open.value !== '{' || close.value !== '}') {
                            return null;
                        }

                        const innerStart = open.range[1];
                        const innerEnd = close.range[0];
                        const inner = sourceCode.text.slice(innerStart, innerEnd);
                        const sortedEntries = [...entries].sort((a, b) => compareKeys(a.key, b.key));

                        if (!inner.includes('\n')) {
                            const sep = inner.includes(',  ') ? ',  ' : ', ';
                            let body = sortedEntries.map(({ prop }) => sourceCode.getText(prop).trim()).join(sep);
                            if (restNode) {
                                body += sep + sourceCode.getText(restNode).trim();
                            }
                            const leading = inner.slice(0, inner.length - inner.trimStart().length);
                            const trailing = inner.slice(inner.trimEnd().length);
                            return fixer.replaceTextRange([innerStart, innerEnd], leading + body + trailing);
                        }

                        const firstPropStart = entries[0].prop.range[0];
                        const propLineStart = sourceCode.text.lastIndexOf('\n', firstPropStart) + 1;
                        const propIndent = sourceCode.text.slice(propLineStart, firstPropStart);

                        const closeStart = close.range[0];
                        const closingLineStart = sourceCode.text.lastIndexOf('\n', closeStart - 1) + 1;
                        const closingIndent = sourceCode.text.slice(closingLineStart, closeStart);
                        // Code that shares a line with a brace would be copied into every rebuilt line
                        if (propIndent.trim() !== '' || closingIndent.trim() !== '') {
                            return null;
                        }

                        const lines = sortedEntries.map(
                            ({ prop }) => `${propIndent}${sourceCode.getText(prop).trim()}`
                        );
                        if (restNode) {
                            lines.push(`${propIndent}${sourceCode.getText(restNode).trim()}`);
                        }
                        const trailingComma = !restNode && inner.trimEnd().endsWith(',') ? ',' : '';
                        const newInner = `\n${lines.join(',\n')}${trailingComma}\n${closingIndent}`;
                        return fixer.replaceTextRange([innerStart, innerEnd], newInner);
                    },
                    messageId: 'unsorted',
                    node,
                });
            },
        };
    },

    meta: {
        docs: {
            description: 'Enforce case-insensitive alphabetical order of keys in object destructuring patterns.',
        },
        fixable: 'code',
        messages: {
            restNotLast: 'Rest element must be last in object destructuring.',
            unsorted:
                'Object destructuring keys should be sorted (case-insensitive alphabetical). Expected order: {{expected}}.',
        },
        schema: [],
        type: 'layout',
    },
};

const plugin = {
    meta: {
        name: 'sort-destructure-keys',
    },
    rules: {
        'sort-destructure-keys': sortedDestructuringKeysRule,
    },
};

export default plugin;
