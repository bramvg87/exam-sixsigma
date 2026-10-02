// 2^k factorial designs: sign table, effects, SS, ANOVA, half fractions.
import { mean, sum } from '../stats/desc.ts';
import { fSf, tInvRt } from '../stats/dist.ts';

const LETTERS = 'ABCDEFGH';

/** Runs in standard (Yates) order: (1), a, b, ab, c, ac, bc, abc, ... */
export function runLabels(k: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 1 << k; i++) {
    let s = '';
    for (let j = 0; j < k; j++) if (i & (1 << j)) s += LETTERS[j].toLowerCase();
    out.push(s || '(1)');
  }
  return out;
}
export function signs(k: number): number[][] {
  // signs[run][factor]
  return Array.from({ length: 1 << k }, (_, i) => Array.from({ length: k }, (_, j) => (i & (1 << j) ? 1 : -1)));
}
/** All effect terms in Yates order: A, B, AB, C, AC, BC, ABC, ... as bit masks. */
export function terms(k: number): { mask: number; name: string }[] {
  const out: { mask: number; name: string }[] = [];
  for (let m = 1; m < 1 << k; m++) {
    let s = '';
    for (let j = 0; j < k; j++) if (m & (1 << j)) s += LETTERS[j];
    out.push({ mask: m, name: s });
  }
  return out;
}
export function termSign(run: number, mask: number): number {
  let s = 1;
  for (let j = 0; mask >> j; j++) if (mask & (1 << j)) s *= run & (1 << j) ? 1 : -1;
  return s;
}

export interface DoeOut {
  k: number;
  n: number;
  labels: string[];
  totals: number[];
  effects: { name: string; mask: number; contrast: number; effect: number; SS: number; F?: number; p?: number; pooled?: boolean }[];
  SST: number;
  SSE: number;
  dfE: number;
  MSE: number;
  seEffect: number;
  tcrit: number;
  grand: number;
}

/** responses[run] = replicates (standard order). pool = names of terms to pool into error. */
export function factorial(k: number, responses: number[][], pool: string[] = []): DoeOut {
  const N = 1 << k;
  if (responses.length !== N) throw new Error(`Een 2^${k}-ontwerp heeft ${N} runs; er zijn er ${responses.length} ingevuld.`);
  const n = responses[0].length;
  if (n < 1 || responses.some((r) => r.length !== n)) throw new Error('Elke run moet even veel herhalingen hebben.');
  const totals = responses.map(sum);
  const all = responses.flat();
  const grand = mean(all);
  const SST = sum(all.map((v) => (v - grand) ** 2));
  const effects: DoeOut['effects'] = terms(k).map((t) => {
    const contrast = sum(totals.map((T, run) => termSign(run, t.mask) * T));
    return { name: t.name, mask: t.mask, contrast, effect: contrast / (n * (N / 2)), SS: (contrast * contrast) / (n * N), pooled: pool.includes(t.name) };
  });
  const SSpure = n > 1 ? SST - sum(effects.map((e) => e.SS)) : 0;
  const dfPure = N * (n - 1);
  const pooledSS = sum(effects.filter((e) => e.pooled).map((e) => e.SS));
  const dfPool = effects.filter((e) => e.pooled).length;
  const SSE = SSpure + pooledSS;
  const dfE = dfPure + dfPool;
  const MSE = dfE > 0 ? SSE / dfE : NaN;
  if (dfE > 0) {
    for (const e of effects) {
      if (e.pooled) continue;
      e.F = e.SS / MSE;
      e.p = fSf(e.F, 1, dfE);
    }
  }
  const seEffect = dfE > 0 ? Math.sqrt(MSE / (n * Math.pow(2, k - 2))) : NaN;
  return { k, n, labels: runLabels(k), totals, effects, SST, SSE, dfE, MSE, seEffect, tcrit: dfE > 0 ? tInvRt(0.025, dfE) : NaN, grand };
}

function maskName(m: number) {
  let s = '';
  for (let j = 0; j < 8; j++) if (m & (1 << j)) s += LETTERS[j];
  return s || 'I';
}
/** Half fraction 2^(k-1) with generator: last factor = product of the others (I = AB..K). */
export function halfFraction(k: number) {
  const base = k - 1;
  const gen = (1 << k) - 1; // defining word I = ABC..K
  const runs = Array.from({ length: 1 << base }, (_, i) => {
    const s: number[] = Array.from({ length: base }, (_, j) => (i & (1 << j) ? 1 : -1));
    s.push(s.reduce((a, b) => a * b, 1));
    return s;
  });
  const labels = runs.map((s) => s.map((v, j) => (v > 0 ? LETTERS[j].toLowerCase() : '')).join('') || '(1)');
  const aliases: string[] = [];
  const seen = new Set<number>();
  for (let m = 1; m < 1 << k; m++) {
    if (seen.has(m) || m === gen) continue;
    const a = m ^ gen;
    seen.add(m);
    seen.add(a);
    aliases.push(`${maskName(m)} = ${maskName(a)}`);
  }
  return { generator: `${LETTERS[k - 1]} = ${LETTERS.slice(0, k - 1)}`, definingRelation: `I = ${maskName(gen)}`, resolution: k, runs, labels, aliases };
}
