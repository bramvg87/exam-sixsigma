// Descriptive statistics and small linear algebra helpers.

export const sum = (x: number[]) => {
  // Neumaier compensated summation
  let s = 0;
  let c = 0;
  for (const v of x) {
    const t = s + v;
    if (Math.abs(s) >= Math.abs(v)) c += s - t + v;
    else c += v - t + s;
    s = t;
  }
  return s + c;
};
export const mean = (x: number[]) => sum(x) / x.length;
export function devsq(x: number[]): number {
  const m = mean(x);
  return sum(x.map((v) => (v - m) * (v - m)));
}
export const varS = (x: number[]) => devsq(x) / (x.length - 1);
export const varP = (x: number[]) => devsq(x) / x.length;
export const sdS = (x: number[]) => Math.sqrt(varS(x));
export const sdP = (x: number[]) => Math.sqrt(varP(x));
export const min = (x: number[]) => x.reduce((a, b) => (b < a ? b : a), Infinity);
export const max = (x: number[]) => x.reduce((a, b) => (b > a ? b : a), -Infinity);
export const range = (x: number[]) => max(x) - min(x);

/** Excel PERCENTILE.INC / QUARTILE.INC */
export function percentileInc(x: number[], p: number): number {
  const s = [...x].sort((a, b) => a - b);
  const h = (s.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return s[lo] + (h - lo) * (s[hi] - s[lo]);
}
export const median = (x: number[]) => percentileInc(x, 0.5);
export const quartiles = (x: number[]) => [percentileInc(x, 0.25), percentileInc(x, 0.5), percentileInc(x, 0.75)];

export function describe(x: number[]) {
  const n = x.length;
  return {
    n,
    mean: n ? mean(x) : NaN,
    sd: n > 1 ? sdS(x) : NaN,
    var: n > 1 ? varS(x) : NaN,
    min: n ? min(x) : NaN,
    max: n ? max(x) : NaN,
    range: n ? range(x) : NaN,
    median: n ? median(x) : NaN,
  };
}

/** Average ranks (ties get the mean rank), 1-based. */
export function ranks(x: number[]): number[] {
  const idx = x.map((v, i) => [v, i] as [number, number]).sort((a, b) => a[0] - b[0]);
  const r = new Array(x.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}

// ---------- Linear algebra ----------
export type Mat = number[][];
export function transpose(A: Mat): Mat {
  return A[0].map((_, j) => A.map((r) => r[j]));
}
export function matMul(A: Mat, B: Mat): Mat {
  return A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
}
/** Inverse by Gauss-Jordan with partial pivoting. Throws when singular. */
export function matInv(A: Mat): Mat {
  const n = A.length;
  const M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12 * Math.max(1, Math.abs(M[c][c]))) throw new Error('Singuliere matrix (kolommen lineair afhankelijk)');
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c];
    for (let j = 0; j < 2 * n; j++) M[c][j] /= piv;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      if (f !== 0) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((r) => r.slice(n));
}

/** Householder QR least squares: returns beta solving min ||X b - y||. */
export function lstsq(X: Mat, y: number[]): number[] {
  const m = X.length;
  const n = X[0].length;
  const A = X.map((r) => [...r]);
  const b = [...y];
  for (let k = 0; k < n; k++) {
    let norm = 0;
    for (let i = k; i < m; i++) norm += A[i][k] * A[i][k];
    norm = Math.sqrt(norm);
    if (norm === 0) throw new Error('Singuliere matrix (kolommen lineair afhankelijk)');
    const alpha = A[k][k] > 0 ? -norm : norm;
    const v = new Array(m).fill(0);
    for (let i = k; i < m; i++) v[i] = A[i][k];
    v[k] -= alpha;
    let vv = 0;
    for (let i = k; i < m; i++) vv += v[i] * v[i];
    if (vv === 0) continue;
    for (let j = k; j < n; j++) {
      let d = 0;
      for (let i = k; i < m; i++) d += v[i] * A[i][j];
      const f = (2 * d) / vv;
      for (let i = k; i < m; i++) A[i][j] -= f * v[i];
    }
    let d = 0;
    for (let i = k; i < m; i++) d += v[i] * b[i];
    const f = (2 * d) / vv;
    for (let i = k; i < m; i++) b[i] -= f * v[i];
  }
  const beta = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * beta[j];
    if (Math.abs(A[i][i]) < 1e-13) throw new Error('Singuliere matrix (kolommen lineair afhankelijk)');
    beta[i] = s / A[i][i];
  }
  return beta;
}
