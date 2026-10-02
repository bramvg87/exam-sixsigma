// Simple and multiple linear regression (OLS with intercept).
import { mean, lstsq, matInv, transpose, matMul } from '../stats/desc.ts';
import { fSf, tInvRt, tSf } from '../stats/dist.ts';

export function regress(y: number[], Xcols: number[][], alpha = 0.05) {
  const n = y.length;
  const k = Xcols.length;
  if (Xcols.some((c) => c.length !== n)) throw new Error('Alle kolommen moeten even veel waarden hebben (verwijder lege cellen of rijen).');
  if (n < k + 2) throw new Error(`Te weinig waarnemingen: n = ${n}, nodig minstens ${k + 2}.`);
  const X = y.map((_, i) => [1, ...Xcols.map((c) => c[i])]);
  const beta = lstsq(X, y);
  const yhat = X.map((r) => r.reduce((s, v, j) => s + v * beta[j], 0));
  const res = y.map((v, i) => v - yhat[i]);
  const yb = mean(y);
  const SST = y.reduce((s, v) => s + (v - yb) ** 2, 0);
  const SSE = res.reduce((s, v) => s + v * v, 0);
  const SSR = SST - SSE;
  const dfR = k;
  const dfE = n - k - 1;
  const MSR = SSR / dfR;
  const MSE = SSE / dfE;
  const F = MSR / MSE;
  const pF = fSf(F, dfR, dfE);
  const XtXi = matInv(matMul(transpose(X), X));
  const se = XtXi.map((r, i) => Math.sqrt(MSE * r[i]));
  const t = beta.map((b, i) => b / se[i]);
  const p = t.map((v) => 2 * tSf(Math.abs(v), dfE));
  const tc = tInvRt(alpha / 2, dfE);
  const ci = beta.map((b, i) => [b - tc * se[i], b + tc * se[i]] as [number, number]);
  const R2 = 1 - SSE / SST;
  const R2adj = 1 - ((1 - R2) * (n - 1)) / (n - k - 1);
  const r = k === 1 ? Math.sign(beta[1]) * Math.sqrt(Math.max(0, R2)) : NaN;
  return { n, k, beta, se, t, p, ci, tc, yhat, res, SST, SSE, SSR, dfR, dfE, MSR, MSE, F, pF, R2, R2adj, s: Math.sqrt(MSE), r, XtXi };
}

/** CI for the mean response and PI for a new observation at x0 (vector without the 1). */
export function predict(fit: ReturnType<typeof regress>, x0: number[], alpha = 0.05) {
  const v = [1, ...x0];
  const yh = v.reduce((s, a, i) => s + a * fit.beta[i], 0);
  const h = v.reduce((s, a, i) => s + a * v.reduce((t, b, j) => t + fit.XtXi[i][j] * b, 0), 0);
  const tc = tInvRt(alpha / 2, fit.dfE);
  const seMean = Math.sqrt(fit.MSE * h);
  const sePred = Math.sqrt(fit.MSE * (1 + h));
  return { yhat: yh, h, tc, seMean, sePred, ci: [yh - tc * seMean, yh + tc * seMean] as [number, number], pi: [yh - tc * sePred, yh + tc * sePred] as [number, number] };
}
