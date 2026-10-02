// Extra regression tests (not in golden_values.json); expected values from scipy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { designPlan, doublePlan } from '../src/calc/sampling.ts';

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) / Math.abs(b) < 1e-6, `${a} vs ${b}`);

test('plan designer AQL 2%, LQL 8%, alpha/beta <= 5%', () => {
  const p = designPlan(0.02, 0.08, 0.05, 0.05)!;
  assert.equal(p.n, 129);
  assert.equal(p.c, 5);
  close(p.alpha, 0.045819357379193626);
  close(p.beta, 0.0490675655535194);
});

test('double plan (90,2,7)+(90,8) at 2%', () => {
  const d = doublePlan(90, 2, 7, 90, 8, 0.02);
  close(d.Pacc, 0.9890388171053593);
  close(d.ASN, 113.99169274898377);
});
