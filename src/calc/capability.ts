// Process capability, DPMO and sigma level.
import { normCdf, normSf, normInv } from '../stats/dist.ts';

export interface CapIn {
  mu: number;
  sigmaST?: number; // short term (within) sigma -> Cp/Cpk
  sigmaLT?: number; // long term (overall) sigma -> Pp/Ppk
  LSL?: number;
  USL?: number;
}

export function capability(mu: number, sigma: number, LSL?: number, USL?: number) {
  const hasL = LSL !== undefined && isFinite(LSL);
  const hasU = USL !== undefined && isFinite(USL);
  const Cp = hasL && hasU ? (USL! - LSL!) / (6 * sigma) : NaN;
  const Cpu = hasU ? (USL! - mu) / (3 * sigma) : NaN;
  const Cpl = hasL ? (mu - LSL!) / (3 * sigma) : NaN;
  const Cpk = hasL && hasU ? Math.min(Cpu, Cpl) : hasU ? Cpu : Cpl;
  const limiting = hasL && hasU ? (Cpu < Cpl ? 'USL' : Cpu > Cpl ? 'LSL' : 'beide') : hasU ? 'USL' : 'LSL';
  const pBelow = hasL ? normCdf(LSL!, mu, sigma) : 0;
  const pAbove = hasU ? normSf(USL!, mu, sigma) : 0;
  const zU = hasU ? (USL! - mu) / sigma : NaN;
  const zL = hasL ? (mu - LSL!) / sigma : NaN;
  const zMin = Math.min(hasU ? zU : Infinity, hasL ? zL : Infinity);
  // centred
  let centred: { mu: number; Cpk: number; pTotal: number } | null = null;
  if (hasL && hasU) {
    const m = (LSL! + USL!) / 2;
    const half = (USL! - LSL!) / 2;
    centred = { mu: m, Cpk: Cp, pTotal: 2 * normSf(half / sigma) };
  }
  return { Cp, Cpu, Cpl, Cpk, limiting, pBelow, pAbove, pTotal: pBelow + pAbove, zU, zL, zMin, centred };
}

/** sigma needed to reach a target Cpk with the current mean (or Cp when centred). */
export function sigmaForCpk(mu: number, target: number, LSL?: number, USL?: number) {
  const d = Math.min(USL !== undefined ? USL - mu : Infinity, LSL !== undefined ? mu - LSL : Infinity);
  return d / (3 * target);
}

export function judgement(c: number): string {
  if (!isFinite(c)) return '-';
  if (c < 1) return 'niet capabel (< 1)';
  if (c < 1.33) return 'net capabel, onvoldoende marge (1 - 1,33)';
  if (c < 1.67) return 'capabel (1,33 - 1,67)';
  if (c < 2) return 'zeer capabel (1,67 - 2)';
  return 'zes sigma-niveau (>= 2)';
}

/** DPMO for a given (short term) sigma level with a 1.5 sigma shift (one-sided, as in the course table). */
export function dpmoFromSigma(level: number, shift = 1.5): number {
  return normSf(level - shift) * 1e6;
}
export function sigmaFromDpmo(dpmo: number, shift = 1.5): number {
  return normInv(1 - dpmo / 1e6) + shift;
}
export function discrete(Ddef: number, N: number, O: number) {
  const DPU = Ddef / N;
  const DPO = Ddef / (N * O);
  const DPMO = DPO * 1e6;
  const yieldFTY = Math.exp(-DPU);
  return { DPU, DPO, DPMO, yieldFTY, yieldDPO: 1 - DPO, sigmaLevel: sigmaFromDpmo(DPMO) };
}
