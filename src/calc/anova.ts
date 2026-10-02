// ANOVA (one-way, two-way with/without replication) and Gauge R&R (ANOVA and Average & Range).
import { mean, sum } from '../stats/desc.ts';
import { fSf } from '../stats/dist.ts';

export interface AnovaRow { source: string; SS: number; df: number; MS: number; F?: number; p?: number }

function row(source: string, SS: number, df: number, msErr?: number, dfErr?: number): AnovaRow {
  const MS = SS / df;
  if (msErr === undefined) return { source, SS, df, MS };
  const F = MS / msErr;
  return { source, SS, df, MS, F, p: fSf(F, df, dfErr!) };
}

export function oneWay(groups: number[][]) {
  const g = groups.filter((x) => x.length > 0);
  if (g.length < 2) throw new Error('Minstens 2 groepen (kolommen) met data nodig.');
  const all = g.flat();
  const N = all.length;
  const k = g.length;
  if (N - k < 1) throw new Error('Te weinig waarnemingen voor de foutterm.');
  const gm = mean(all);
  const SSB = sum(g.map((x) => x.length * (mean(x) - gm) ** 2));
  const SSW = sum(g.map((x) => { const m = mean(x); return sum(x.map((v) => (v - m) ** 2)); }));
  const MSW = SSW / (N - k);
  const rows = [row('Tussen groepen (factor)', SSB, k - 1, MSW, N - k), row('Binnen groepen (fout)', SSW, N - k), { source: 'Totaal', SS: SSB + SSW, df: N - 1, MS: NaN }];
  return { rows, F: rows[0].F!, p: rows[0].p!, df: [k - 1, N - k], means: g.map(mean), ns: g.map((x) => x.length), grand: gm, MSW };
}

/** Two-way without replication: matrix rows = level of factor A, columns = level of factor B. */
export function twoWayNoRep(M: number[][]) {
  const a = M.length;
  const b = M[0].length;
  if (a < 2 || b < 2) throw new Error('Minstens 2 rijen en 2 kolommen nodig.');
  const all = M.flat();
  if (all.some((v) => !isFinite(v))) throw new Error('Lege cellen niet toegelaten in een tweeweg-ANOVA zonder herhaling.');
  const gm = mean(all);
  const rm = M.map(mean);
  const cm = M[0].map((_, j) => mean(M.map((r) => r[j])));
  const SSA = b * sum(rm.map((m) => (m - gm) ** 2));
  const SSB = a * sum(cm.map((m) => (m - gm) ** 2));
  const SST = sum(all.map((v) => (v - gm) ** 2));
  const SSE = SST - SSA - SSB;
  const dfE = (a - 1) * (b - 1);
  const MSE = SSE / dfE;
  return { rows: [row('Rijen (factor A)', SSA, a - 1, MSE, dfE), row('Kolommen (factor B)', SSB, b - 1, MSE, dfE), row('Fout', SSE, dfE), { source: 'Totaal', SS: SST, df: a * b - 1, MS: NaN }], rm, cm, gm };
}

/** Two-way with replication: cells[i][j] = array of replicates (balanced). */
export function twoWayRep(cells: number[][][]) {
  const a = cells.length;
  const b = cells[0].length;
  const r = cells[0][0].length;
  if (cells.some((ro) => ro.length !== b || ro.some((c) => c.length !== r))) throw new Error('Ongebalanceerd ontwerp: elke cel moet even veel herhalingen hebben.');
  if (r < 2) throw new Error('Minstens 2 herhalingen per cel nodig.');
  const all = cells.flat(2);
  const gm = mean(all);
  const cellM = cells.map((ro) => ro.map(mean));
  const rm = cells.map((ro) => mean(ro.flat()));
  const cm = cells[0].map((_, j) => mean(cells.map((ro) => ro[j]).flat()));
  const SSA = b * r * sum(rm.map((m) => (m - gm) ** 2));
  const SSB = a * r * sum(cm.map((m) => (m - gm) ** 2));
  const SSCells = r * sum(cellM.flat().map((m) => (m - gm) ** 2));
  const SSAB = SSCells - SSA - SSB;
  const SST = sum(all.map((v) => (v - gm) ** 2));
  const SSE = SST - SSCells;
  const dfE = a * b * (r - 1);
  const MSE = SSE / dfE;
  return {
    rows: [
      row('Factor A (rijen)', SSA, a - 1, MSE, dfE),
      row('Factor B (kolommen)', SSB, b - 1, MSE, dfE),
      row('Interactie AxB', SSAB, (a - 1) * (b - 1), MSE, dfE),
      row('Fout (binnen cellen)', SSE, dfE),
      { source: 'Totaal', SS: SST, df: a * b * r - 1, MS: NaN },
    ],
    cellM, rm, cm, gm,
  };
}

/**
 * Gauge R&R via ANOVA. data[part][operator] = array of trials.
 * AIAG: interaction pooled into error when p(interaction) > 0.25 (option).
 */
export function grrAnova(data: number[][][], tol?: number, poolAlpha = 0.25) {
  const p = data.length;
  const o = data[0].length;
  const r = data[0][0].length;
  if (p < 2 || o < 2 || r < 2) throw new Error('Minstens 2 stukken, 2 operatoren en 2 herhalingen nodig.');
  const res = twoWayRep(data);
  const [P, O, PO, E] = res.rows;
  let pooled = false;
  let MSe = E.MS;
  let dfe = E.df;
  let rows: AnovaRow[];
  if (PO.p! > poolAlpha) {
    pooled = true;
    dfe = PO.df + E.df;
    MSe = (PO.SS + E.SS) / dfe;
    rows = [
      row('Stukken (parts)', P.SS, P.df, MSe, dfe),
      row('Operatoren', O.SS, O.df, MSe, dfe),
      row('Herhaalbaarheid (gepoold)', PO.SS + E.SS, dfe),
      { source: 'Totaal', SS: res.rows[4].SS, df: res.rows[4].df, MS: NaN },
    ];
  } else {
    // F for P and O against interaction
    rows = [
      row('Stukken (parts)', P.SS, P.df, PO.MS, PO.df),
      row('Operatoren', O.SS, O.df, PO.MS, PO.df),
      row('Interactie stuk x operator', PO.SS, PO.df, E.MS, E.df),
      row('Herhaalbaarheid (fout)', E.SS, E.df),
      { source: 'Totaal', SS: res.rows[4].SS, df: res.rows[4].df, MS: NaN },
    ];
  }
  const varRep = MSe;
  const msInt = pooled ? MSe : PO.MS;
  const varInt = pooled ? 0 : Math.max(0, (PO.MS - E.MS) / r);
  const varOp = Math.max(0, (O.MS - msInt) / (p * r));
  const varPart = Math.max(0, (P.MS - msInt) / (o * r));
  const varRepro = varOp + varInt;
  const varGRR = varRep + varRepro;
  const varTV = varGRR + varPart;
  const EV = Math.sqrt(varRep), AV = Math.sqrt(varRepro), GRR = Math.sqrt(varGRR), PV = Math.sqrt(varPart), TV = Math.sqrt(varTV);
  return {
    rows, pooled, interactionP: PO.p!,
    var: { rep: varRep, op: varOp, int: varInt, repro: varRepro, grr: varGRR, part: varPart, tv: varTV },
    EV, AV, GRR, PV, TV,
    pctEV: (100 * EV) / TV, pctAV: (100 * AV) / TV, pctGRR: (100 * GRR) / TV, pctPV: (100 * PV) / TV,
    pctContribGRR: (100 * varGRR) / varTV,
    pctTol: tol ? (100 * 6 * GRR) / tol : NaN,
    ndc: Math.floor((1.41 * PV) / GRR),
  };
}

export const K1: Record<number, number> = { 2: 0.8862, 3: 0.5908 };
export const K2: Record<number, number> = { 2: 0.7071, 3: 0.5231 };
export const K3: Record<number, number> = { 2: 0.7071, 3: 0.5231, 4: 0.4467, 5: 0.403, 6: 0.3742, 7: 0.3534, 8: 0.3375, 9: 0.3249, 10: 0.3146 };

/** Gauge R&R Average & Range method (AIAG). data[part][operator] = trials. */
export function grrAvgRange(data: number[][][], tol?: number) {
  const p = data.length;
  const o = data[0].length;
  const r = data[0][0].length;
  if (!K1[r]) throw new Error('Average & Range: enkel 2 of 3 herhalingen (trials) ondersteund.');
  if (!K2[o]) throw new Error('Average & Range: enkel 2 of 3 operatoren ondersteund.');
  if (!K3[p]) throw new Error('Average & Range: 2 tot 10 stukken ondersteund.');
  const ranges: number[] = [];
  const opMeans: number[] = [];
  const opRbar: number[] = [];
  for (let j = 0; j < o; j++) {
    const rs = data.map((part) => Math.max(...part[j]) - Math.min(...part[j]));
    ranges.push(...rs);
    opRbar.push(mean(rs));
    opMeans.push(mean(data.map((part) => part[j]).flat()));
  }
  const Rbarbar = mean(opRbar);
  const Xdiff = Math.max(...opMeans) - Math.min(...opMeans);
  const partMeans = data.map((part) => mean(part.flat()));
  const Rp = Math.max(...partMeans) - Math.min(...partMeans);
  const EV = Rbarbar * K1[r];
  const av2 = (Xdiff * K2[o]) ** 2 - (EV * EV) / (p * r);
  const AV = Math.sqrt(Math.max(0, av2));
  const GRR = Math.sqrt(EV * EV + AV * AV);
  const PV = Rp * K3[p];
  const TV = Math.sqrt(GRR * GRR + PV * PV);
  return {
    Rbarbar, Xdiff, Rp, opMeans, opRbar, partMeans, K1: K1[r], K2: K2[o], K3: K3[p],
    EV, AV, GRR, PV, TV,
    pctEV: (100 * EV) / TV, pctAV: (100 * AV) / TV, pctGRR: (100 * GRR) / TV, pctPV: (100 * PV) / TV,
    pctTol: tol ? (100 * 6 * GRR) / tol : NaN,
    ndc: Math.floor((1.41 * PV) / GRR),
  };
}

export function grrVerdict(pct: number) {
  if (!isFinite(pct)) return '-';
  if (pct <= 10) return 'aanvaardbaar (<= 10%)';
  if (pct <= 30) return 'voorwaardelijk aanvaardbaar (10 - 30%), afhankelijk van toepassing en kost';
  return 'onaanvaardbaar (> 30%): meetsysteem verbeteren';
}

/** Observed vs actual Cp: 1/Cp_o^2 = 1/Cp_a^2 + %GRR^2 (tolerance based, fraction). */
export const cpObserved = (cpActual: number, grrFrac: number) => 1 / Math.sqrt(1 / (cpActual * cpActual) + grrFrac * grrFrac);
export const cpActual = (cpObs: number, grrFrac: number) => {
  const v = 1 / (cpObs * cpObs) - grrFrac * grrFrac;
  return v > 0 ? 1 / Math.sqrt(v) : NaN;
};
