// Acceptance sampling (attributes and variables), lot defects, stratification.
import { binomCdf, binomPmf, binomSf, hyperCdf, hyperPmf, nctInv, normInv, normSf, poisCdf, poisPmf } from '../stats/dist.ts';

export type OcModel = 'binom' | 'hyper' | 'pois';

export function pAccept(n: number, c: number, pi: number, model: OcModel = 'binom', N?: number): number {
  if (c < 0) return 0;
  if (model === 'pois') return poisCdf(c, n * pi);
  if (model === 'hyper') {
    if (!N) throw new Error('Lotgrootte N vereist voor het hypergeometrisch model.');
    return hyperCdf(c, N, Math.round(pi * N), n);
  }
  return binomCdf(c, n, pi);
}
function pmf(d: number, n: number, pi: number, model: OcModel, N?: number) {
  if (model === 'pois') return poisPmf(d, n * pi);
  if (model === 'hyper') return hyperPmf(d, N!, Math.round(pi * N!), n);
  return binomPmf(d, n, pi);
}

export function singlePlan(n: number, c: number, AQL: number, LQL: number, model: OcModel = 'binom', N?: number) {
  const pa = pAccept(n, c, AQL, model, N);
  const pb = pAccept(n, c, LQL, model, N);
  return { PaAQL: pa, alpha: 1 - pa, beta: pb };
}

export function ocCurve(f: (pi: number) => number, piMax: number, steps = 100) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const pi = (piMax * i) / steps;
    return [pi, f(pi)] as [number, number];
  });
}

/** Smallest n (and c) such that alpha <= aMax at AQL and beta <= bMax at LQL (binomial). */
export function designPlan(AQL: number, LQL: number, aMax: number, bMax: number, nMax = 5000) {
  for (let n = 1; n <= nMax; n++) {
    // largest c that satisfies beta: P(d<=c|LQL) <= bMax
    let c = -1;
    while (c + 1 <= n && binomCdf(c + 1, n, LQL) <= bMax) c++;
    if (c < 0) continue;
    if (1 - binomCdf(c, n, AQL) <= aMax) return { n, c, alpha: 1 - binomCdf(c, n, AQL), beta: binomCdf(c, n, LQL) };
  }
  return null;
}

/** Double plan: (n1, c1, c2) then (n2, c3). Accept if d1 <= c1; reject if d1 >= c2; else accept if d1+d2 <= c3. */
export function doublePlan(n1: number, c1: number, c2: number, n2: number, c3: number, pi: number, model: OcModel = 'binom', N?: number) {
  let pa = pAccept(n1, c1, pi, model, N);
  let pSecond = 0;
  for (let d1 = c1 + 1; d1 <= c2 - 1; d1++) {
    const p1 = pmf(d1, n1, pi, model, N);
    pSecond += p1;
    pa += p1 * pAccept(n2, c3 - d1, pi, model, N);
  }
  return { Pacc: pa, pSecond, ASN: n1 + n2 * pSecond };
}

/** Variables plan (n, k): exact k via noncentral t and Natrella approximation. */
export function variablesK(n: number, p0: number, alpha: number) {
  const zp = normInv(1 - p0);
  const za = normInv(1 - alpha);
  const exact = nctInv(1 - alpha, n - 1, zp * Math.sqrt(n)) / Math.sqrt(n);
  const a = 1 - (za * za) / (2 * (n - 1));
  const b = zp * zp - (za * za) / n;
  const natrella = (zp + Math.sqrt(zp * zp - a * b)) / a;
  return { zp, za, exact, natrella, a, b };
}

/** Defects in a lot of N for a centred process with given Cpk (both sides). */
export function lotDefects(Cpk: number, N: number, twoSided = true) {
  const pi = (twoSided ? 2 : 1) * normSf(3 * Cpk);
  const E = N * pi;
  const sd = Math.sqrt(N * pi * (1 - pi));
  // practical range: 0.1% - 99.9% quantiles
  let lo = 0;
  while (binomCdf(lo, N, pi) < 0.001) lo++;
  let hi = lo;
  while (binomCdf(hi, N, pi) < 0.999) hi++;
  return { pi, E, sd, lo, hi, cdf: (k: number) => binomCdf(k, N, pi), sf: (k: number) => binomSf(k, N, pi) };
}

/** Stratified sampling of a proportion: proportional vs SRS vs Neyman. */
export function stratification(W: number[], pi: number[], n: number) {
  const S = pi.map((p) => Math.sqrt(p * (1 - p)));
  const piTot = W.reduce((s, w, i) => s + w * pi[i], 0);
  const varProp = W.reduce((s, w, i) => s + w * pi[i] * (1 - pi[i]), 0) / n;
  const varSrs = (piTot * (1 - piTot)) / n;
  const den = W.reduce((s, w, i) => s + w * S[i], 0);
  const neyman = W.map((w, i) => (n * w * S[i]) / den);
  const varNeyman = (den * den) / n;
  return { piTot, varProp, varSrs, neyman, varNeyman, proportional: W.map((w) => n * w) };
}
