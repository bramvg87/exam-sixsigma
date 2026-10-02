// Extra regression tests (not part of golden_values.json): AIAG MSA manual Average & Range example,
// expected values computed independently with numpy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grrAvgRange } from '../src/calc/anova.ts';

const AIAG: Record<string, number[][]> = {
  A: [[0.29, -0.56, 1.34, 0.47, -0.8, 0.02, 0.59, -0.31, 2.26, -1.36], [0.41, -0.68, 1.17, 0.5, -0.92, -0.11, 0.75, -0.2, 1.99, -1.25], [0.64, -0.58, 1.27, 0.64, -0.84, -0.21, 0.66, -0.17, 2.01, -1.31]],
  B: [[0.08, -0.47, 1.19, 0.01, -0.56, -0.2, 0.47, -0.63, 1.8, -1.68], [0.25, -1.22, 0.94, 1.03, -1.2, 0.22, 0.55, 0.08, 2.12, -1.62], [0.07, -0.68, 1.34, 0.2, -1.28, 0.06, 0.83, -0.34, 2.19, -1.5]],
  C: [[0.04, -1.38, 0.88, 0.14, -1.46, -0.29, 0.02, -0.46, 1.77, -1.49], [-0.11, -1.13, 1.09, 0.2, -1.07, -0.67, 0.01, -0.56, 1.45, -1.77], [-0.15, -0.96, 0.67, 0.11, -1.45, -0.49, 0.21, -0.49, 1.87, -2.16]],
};
// data[part][operator] = trials
const data = Array.from({ length: 10 }, (_, p) => ['A', 'B', 'C'].map((o) => AIAG[o].map((tr) => tr[p])));
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) / Math.abs(b) < 1e-6, `${a} vs ${b}`);

test('GRR average & range (AIAG)', () => {
  const r = grrAvgRange(data);
  close(r.EV, 0.20185666666666666);
  close(r.AV, 0.2296670291032038);
  close(r.PV, 1.1045955555555556);
  close(r.GRR, 0.3057663456544386);
  close(r.pctGRR, 26.678049841026674);
  assert.equal(r.ndc, 5);
});
