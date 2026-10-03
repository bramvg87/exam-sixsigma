// Stand-alone confidence intervals against the golden values and scipy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ciMeanT, ciMeanZ, ciVar, ciRatio, clt } from '../src/calc/ci.ts';
import { mean, sdS } from '../src/stats/desc.ts';

const G = JSON.parse(readFileSync(new URL('../testdata/golden_values.json', import.meta.url), 'utf8'));
const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('mean, t, one-sided 98% upper bound (Ottoy)', () => {
  const x = G.t_test_mean.data;
  close(ciMeanT(mean(x), sdS(x), x.length, 0.02, 'upper').hi, G.t_test_mean.ci98_upper);
});
test('sigma, chi2, one-sided 98% lower bound (Ottoy)', () => {
  const x = G.chi2_test_sigma.data;
  close(Math.sqrt(ciVar(sdS(x), x.length, 0.02, 'lower').lo), G.chi2_test_sigma.ci98_lower_sigma);
});
test('ratio sigma2^2/sigma1^2, exam Q2', () => {
  const g = G.exam_q2_f_ratio;
  close(ciRatio(g.s2sq, g.n2, g.s1sq, g.n1, 0.05, 'lower').lo, g.lower_bound);
  // two-sided 95% (scipy): [0.987374122624323, 12.03487627836257]
  const t = ciRatio(g.s2sq, g.n2, g.s1sq, g.n1, 0.05, 'two');
  close(t.lo, 0.987374122624323);
  close(t.hi, 12.03487627836257);
});
test('mean, z and CLT', () => {
  const z = ciMeanZ(10.1, 0.3, 36, 0.05, 'two');
  close(z.lo, 10.1 - 1.959963984540054 * 0.05);
  const c = clt(820, 60.8, 25, 0.05, 800);
  close(c.se, 12.16);
  close(c.pLeA!, 0.0500120458368019, 1e-9);
});
