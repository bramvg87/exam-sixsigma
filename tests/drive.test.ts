// Regression tests against the examples of the UGAIN ANOVA tool and hypothesis tester (reference/drive).
// Expected values: testdata/drive_examples.json (scipy/numpy; the ANOVA tool itself gives identical numbers).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { oneWay, twoWayNoRep, twoWayRep, grrAnova, blockToLong } from '../src/calc/anova.ts';
import * as H from '../src/calc/hypo.ts';

const R = JSON.parse(readFileSync(new URL('../testdata/drive_examples.json', import.meta.url), 'utf8'));
const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('ANOVA tool: one-way cotton', () => {
  const r = oneWay(R.oneway_cotton.groups);
  close(r.F, R.oneway_cotton.F);
  close(r.p, R.oneway_cotton.p, 1e-7);
});
test('ANOVA tool: two-way without replication (machines)', () => {
  const r = twoWayNoRep(R.twoway_machines.matrix);
  close(r.rows[0].SS, R.twoway_machines.SSA);
  close(r.rows[1].SS, R.twoway_machines.SSB);
  close(r.rows[0].F!, R.twoway_machines.FA);
  close(r.rows[1].p!, R.twoway_machines.pB, 1e-7);
});
test('ANOVA tool: two-way with replication (plant) via block layout', () => {
  const t = 'Water\tNone\tLow\tMedium\tHigh\nDaily\t4.8\t5\t6.4\t6.3\n\t4.4\t5.2\t6.2\t6.4\n\t3.2\t5.6\t4.7\t5.6\n\t3.9\t4.3\t5.5\t4.8\n\t4.4\t4.8\t5.8\t5.8\nWeekly\t4.4\t4.9\t5.8\t6\n\t4.2\t5.3\t6.2\t4.9\n\t3.8\t5.7\t6.3\t4.6\n\t3.7\t5.4\t6.5\t5.6\n\t3.9\t4.8\t5.5\t5.5';
  const lines = t.split('\n').map((l) => l.split('\t'));
  const long = blockToLong(lines.slice(1), lines[0])!;
  assert.equal(long.length, 40);
  const r = twoWayRep(R.tworep_plant.cells);
  close(r.rows[1].F!, R.tworep_plant.FB);
  close(r.rows[2].p!, R.tworep_plant.pAB, 1e-7);
  close(r.rows[3].SS, R.tworep_plant.SSE);
});
test('ANOVA tool: Gauge R&R course method', () => {
  const g = grrAnova(R.grr_course.cells, undefined, 0.25, 'course');
  close(g.EV, R.grr_course.EV);
  close(g.AV, R.grr_course.AV);
  close(g.PV, R.grr_course.PV);
  close(g.pctGRR, R.grr_course.pctGRR);
  assert.equal(g.ndc, R.grr_course.ndc);
});
test('Hypothesis tester examples', () => {
  // t: xbar 9.928, s 0.109, n 20, mu0 10, alpha 0.02, left (slide-rounded s)
  const t = H.tMean(9.928, 0.109, 20, 10, 0.02, 'left');
  close(t.stat, -2.95407145651345, 1e-9); // slide: t = -2,95
  // ratio CI: s1 0.06325 (n 10), s2 0.12247 (n 15): upper bound sigma1^2/sigma2^2 = R / F_alpha(9,14)
  const ci = H.ratioCI(0.06325 ** 2, 10, 0.12247 ** 2, 15, 0.05, 'upper');
  close(ci[1], (0.06325 ** 2 / 0.12247 ** 2) / 0.33052686014125293, 1e-9);
});
