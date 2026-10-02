// SPC helpers used by the SPC module: subgroup list parsing, rules on included points only, shift tables.
import { westernElectric, shiftDetection, type RuleHit } from './spc.ts';

/** Parse "9, 12; 15-17" into 0-based indices. Returns invalid tokens separately. */
export function parseSubgroupList(text: string, k: number): { set: Set<number>; bad: string[] } {
  const set = new Set<number>();
  const bad: string[] = [];
  for (const tok of text.split(/[\s,;]+/).filter(Boolean)) {
    const m = tok.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) {
      bad.push(tok);
      continue;
    }
    const a = +m[1];
    const b = m[2] ? +m[2] : a;
    if (a < 1 || b > k || b < a) {
      bad.push(tok);
      continue;
    }
    for (let i = a; i <= b; i++) set.add(i - 1);
  }
  return { set, bad };
}

export const formatSubgroupList = (s: Iterable<number>) => [...s].sort((a, b) => a - b).map((i) => i + 1).join(', ');

/** Western Electric rules 1-4 applied to the included points only (in order), indices mapped back. */
export function rulesIncluded(x: number[], CL: number, sig: number, excluded: Set<number>, rules: number[] = [1, 2, 3, 4]): RuleHit[] {
  const idx = x.map((_, i) => i).filter((i) => !excluded.has(i));
  if (!(sig > 0)) return [];
  return westernElectric(idx.map((i) => x[i]), CL, sig)
    .filter((h) => rules.includes(h.rule))
    .map((h) => ({ ...h, index: idx[h.index] }));
}

/** Rule 1 (outside limits) for an asymmetric chart such as R or s. */
export function outsideLimits(x: number[], UCL: number, LCL: number, excluded: Set<number>, label: string): RuleHit[] {
  const out: RuleHit[] = [];
  x.forEach((v, i) => {
    if (excluded.has(i)) return;
    if (v > UCL) out.push({ index: i, rule: 1, text: `${label}-kaart regel 1: boven UCL` });
    else if (v < LCL) out.push({ index: i, rule: 1, text: `${label}-kaart regel 1: onder LCL` });
  });
  return out;
}

/** Group hits by subgroup index. */
export function hitsByIndex(hits: RuleHit[]): Map<number, RuleHit[]> {
  const m = new Map<number, RuleHit[]>();
  for (const h of hits) {
    const arr = m.get(h.index) ?? [];
    if (!arr.some((a) => a.text === h.text)) arr.push(h);
    m.set(h.index, arr);
  }
  return m;
}

/** Detection table for n = from..to for a k-sigma shift. */
export function shiftTable(k: number, from = 2, to = 10) {
  const out: { n: number; beta: number; pDetect: number; ARL: number }[] = [];
  for (let n = from; n <= to; n++) out.push({ n, ...shiftDetection(k, n) });
  return out;
}

/** In-control false alarm rate and ARL0 for L-sigma limits. */
export function inControl(L = 3, normCdf: (x: number) => number) {
  const alpha = 2 * (1 - normCdf(L));
  return { alpha, ARL0: 1 / alpha };
}
