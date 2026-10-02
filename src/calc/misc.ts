// Confusion matrices, contingency tables, goodness of fit, nonparametric tests, queues.
import { chi2Sf, normSf, poisPmf, poisSf } from '../stats/dist.ts';
import { ranks } from '../stats/desc.ts';

// ---------- Confusion matrix: rows = actual (pos, neg), cols = predicted (pos, neg) ----------
export function confusion(m: number[][]) {
  const [[TP, FN], [FP, TN]] = m;
  const N = TP + FN + FP + TN;
  const acc = (TP + TN) / N;
  const precision = TP / (TP + FP);
  const recall = TP / (TP + FN);
  const specificity = TN / (TN + FP);
  const f1 = (2 * precision * recall) / (precision + recall);
  return { TP, FN, FP, TN, N, acc, precision, recall, specificity, f1, err: 1 - acc };
}
export function diagnose(accTrain: number, accTest: number, bestTest: number) {
  const gap = accTrain - accTest;
  if (accTest >= bestTest - 1e-12 && gap < 0.2) return { label: 'goede balans (beste testscore)', gap };
  if (accTrain < 0.8) return { label: 'hoge bias (underfitting): ook op de trainingsdata zwak', gap };
  if (gap > 0.2) return { label: 'hoge variantie (overfitting): train veel beter dan test', gap };
  return { label: 'redelijke balans', gap };
}

// ---------- Contingency table ----------
export function contingency(t: number[][], yates = false) {
  const r = t.length;
  const c = t[0].length;
  const rs = t.map((row) => row.reduce((a, b) => a + b, 0));
  const cs = t[0].map((_, j) => t.reduce((a, row) => a + row[j], 0));
  const n = rs.reduce((a, b) => a + b, 0);
  const E = t.map((_, i) => t[0].map((_, j) => (rs[i] * cs[j]) / n));
  const useYates = yates && r === 2 && c === 2;
  let chi = 0;
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++) {
      const d = useYates ? Math.max(0, Math.abs(t[i][j] - E[i][j]) - 0.5) : t[i][j] - E[i][j];
      chi += (d * d) / E[i][j];
    }
  const df = (r - 1) * (c - 1);
  const minE = Math.min(...E.flat());
  return { rs, cs, n, E, chi2: chi, df, p: chi2Sf(chi, df), minE, yates: useYates, joint: t.map((row) => row.map((v) => v / n)), condRow: t.map((row, i) => row.map((v) => v / rs[i])), margCol: cs.map((v) => v / n), margRow: rs.map((v) => v / n) };
}

// ---------- Goodness of fit ----------
export function gof(observed: number[], expected: number[], estimated: number) {
  const chi = observed.reduce((s, o, i) => s + ((o - expected[i]) ** 2) / expected[i], 0);
  const df = observed.length - estimated - 1;
  return { chi2: chi, df, p: chi2Sf(chi, df), minE: Math.min(...expected) };
}
/** Poisson GOF for counts of 0..m-1 and a last class ">= m-1". */
export function gofPoisson(observed: number[], lam?: number) {
  const n = observed.reduce((a, b) => a + b, 0);
  const lamHat = lam ?? observed.reduce((s, o, k) => s + k * o, 0) / n;
  const m = observed.length;
  const probs = observed.map((_, k) => (k < m - 1 ? poisPmf(k, lamHat) : poisSf(m - 2, lamHat)));
  const expected = probs.map((p) => n * p);
  return { lambda: lamHat, expected, ...gof(observed, expected, lam === undefined ? 1 : 0) };
}

// ---------- Nonparametric ----------
function tieSum(r: number[]) {
  const m = new Map<number, number>();
  r.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
  let s = 0;
  m.forEach((t) => (s += t * t * t - t));
  return s;
}
export function mannWhitney(a: number[], b: number[]) {
  const n1 = a.length, n2 = b.length, N = n1 + n2;
  const r = ranks([...a, ...b]);
  const W = r.slice(0, n1).reduce((x, y) => x + y, 0);
  const U1 = W - (n1 * (n1 + 1)) / 2;
  const U2 = n1 * n2 - U1;
  const mu = (n1 * n2) / 2;
  const sd = Math.sqrt(((n1 * n2) / 12) * (N + 1 - tieSum(r) / (N * (N - 1))));
  const U = Math.max(U1, U2);
  const z = (U - mu - 0.5) / sd;
  return { W, U1, U2, EW: (n1 * (N + 1)) / 2, VarW: (n1 * n2 * (N + 1)) / 12, z, p: Math.min(1, 2 * normSf(z)) };
}
export function wilcoxonSigned(a: number[], b: number[]) {
  const d = a.map((x, i) => x - b[i]).filter((v) => v !== 0);
  const n = d.length;
  const r = ranks(d.map(Math.abs));
  const Tp = r.reduce((s, v, i) => s + (d[i] > 0 ? v : 0), 0);
  const Tm = (n * (n + 1)) / 2 - Tp;
  const mu = (n * (n + 1)) / 4;
  const sd = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - tieSum(r) / 48);
  const T = Math.min(Tp, Tm);
  const z = (Math.abs(Tp - mu) - 0.5) / sd;
  return { n, Tplus: Tp, Tminus: Tm, T, mu, sd, z, p: Math.min(1, 2 * normSf(z)) };
}
export function runsTest(x: number[]) {
  const s = [...x].sort((p, q) => p - q);
  const med = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  const sgn = x.filter((v) => v !== med).map((v) => v > med);
  const n1 = sgn.filter(Boolean).length;
  const n2 = sgn.length - n1;
  let R = sgn.length ? 1 : 0;
  for (let i = 1; i < sgn.length; i++) if (sgn[i] !== sgn[i - 1]) R++;
  const N = n1 + n2;
  const ER = (2 * n1 * n2) / N + 1;
  const VR = (2 * n1 * n2 * (2 * n1 * n2 - N)) / (N * N * (N - 1));
  const z = (R - ER) / Math.sqrt(VR);
  return { median: med, n1, n2, R, ER, VR, z, p: Math.min(1, 2 * normSf(Math.abs(z))) };
}

// ---------- Queues ----------
export function mm1(lam: number, mu: number) {
  const rho = lam / mu;
  if (rho >= 1) throw new Error('Instabiele wachtrij: rho = lambda/mu moet < 1 zijn.');
  const EL = rho / (1 - rho);
  const ELq = (rho * rho) / (1 - rho);
  return { rho, EL, ELq, EW: EL / lam, EWq: ELq / lam, P0: 1 - rho };
}
export function mm1k(lam: number, mu: number, K: number) {
  const rho = lam / mu;
  const pi = Array.from({ length: K + 1 }, (_, j) => (rho === 1 ? 1 / (K + 1) : (Math.pow(rho, j) * (1 - rho)) / (1 - Math.pow(rho, K + 1))));
  const EL = pi.reduce((s, p, j) => s + j * p, 0);
  const lamEff = lam * (1 - pi[K]);
  return { rho, pi, EL, lamEff, pLoss: pi[K], EW: EL / lamEff, ELq: EL - (1 - pi[0]), EWq: (EL - (1 - pi[0])) / lamEff };
}
