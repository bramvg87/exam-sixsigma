// Independence tools against scipy (testdata/independence.json) and the golden contingency case.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fisherExact, cramersV, stdResiduals, pearson, spearman, eventIndependence, crossTab } from '../src/calc/independence.ts';
import { contingency } from '../src/calc/misc.ts';

const R = JSON.parse(readFileSync(new URL('../testdata/independence.json', import.meta.url), 'utf8'));
const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('formularium example: line x quality', () => {
  const t = [[200, 50, 20], [150, 40, 40]];
  const c = contingency(t);
  close(c.chi2, 11.796130153618073);
  close(cramersV(c.chi2, c.n, 2, 3), R.cramers_v);
  stdResiduals(t, c.E).forEach((row, i) => row.forEach((v, j) => close(v, R.std_res[i][j])));
});
test('Fisher exact 2x2', () => {
  const f = fisherExact([[30, 10], [20, 25]]);
  close(f.pTwo, R.fisher_two, 1e-9);
  close(f.pLess, R.fisher_less, 1e-9);
  close(f.pGreater, R.fisher_greater, 1e-9);
  close(f.odds, R.odds);
});
test('Pearson and Spearman', () => {
  const p = pearson(R.x, R.y);
  close(p.r, R.pearson_r);
  close(p.p, R.pearson_p, 1e-7);
  close(spearman(R.x, R.y).r, R.spearman_rho);
});
test('events and cross-tab', () => {
  const e = eventIndependence(0.54, 0.7, 0.4);
  close(e.prod, 0.378);
  close(e.pAgivenB, 0.4 / 0.7);
  const x = crossTab([['L1', 'A'], ['L1', 'R'], ['L2', 'A'], ['L1', 'A']]);
  assert.deepEqual(x.rows, ['L1', 'L2']);
  assert.deepEqual(x.t, [[2, 1], [1, 0]]);
});
