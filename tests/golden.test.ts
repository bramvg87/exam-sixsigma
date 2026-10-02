import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildChecks, passes } from '../src/selftest/checks.ts';

const G = JSON.parse(readFileSync(new URL('../testdata/golden_values.json', import.meta.url), 'utf8'));
const checks = buildChecks(G);
const groups = [...new Set(checks.map((c) => c.group))];

test('all 25 golden cases are covered', () => {
  const covered = new Set(groups);
  const missing = Object.keys(G).filter((k) => !covered.has(k));
  assert.deepEqual(missing, []);
});

for (const g of groups) {
  test(g, () => {
    const failed = checks.filter((c) => c.group === g && !passes(c));
    assert.equal(failed.length, 0, failed.map((c) => `${c.name}: got ${c.actual}, expected ${c.expected}`).join('\n'));
  });
}
