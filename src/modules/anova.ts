// M7a ANOVA: one-way, two-way without and with replication.
import { h, fmt, tx, xl, nl, parseNum } from '../ui/core.ts';
import { Form, row, card, InputError } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { lineChart, chartBox } from '../components/charts.ts';
import { oneWay, twoWayNoRep, twoWayRep, type AnovaRow } from '../calc/anova.ts';
import { buildCells } from '../calc/msa_extra.ts';
import { fInvRt } from '../stats/dist.ts';
import { sdS } from '../stats/desc.ts';
import { live, need, moduleHead, prob } from './util.ts';
import { theoryPage, type ModuleDef } from './types.ts';
import { anovaTheorie } from '../generated/content.ts';
import { exOneWay, exTwoWay } from './explain.ts';
import G from '../../testdata/golden_values.json';

/** Run a calc function; turn its plain Errors into Dutch InputErrors. */
export function calc<T>(f: () => T): T {
  try {
    return f();
  } catch (e: any) {
    if (e instanceof InputError) throw e;
    throw new InputError(e?.message ?? String(e));
  }
}

/** ANOVA table with F critical per row (denominator df given per row index). */
export function anovaTable(rows: AnovaRow[], alpha: number, denDf: (i: number) => number) {
  return table(
    ['Bron (source)', 'SS', 'df', 'MS', 'F', 'p-waarde', `F kritiek (α = ${fmt(alpha)})`],
    rows.map((r, i) => [
      r.source,
      fmt(r.SS),
      String(r.df),
      isFinite(r.MS) ? fmt(r.MS) : '',
      r.F !== undefined ? fmt(r.F) : '',
      r.p !== undefined ? fmt(r.p) : '',
      r.F !== undefined ? fmt(fInvRt(alpha, r.df, denDf(i))) : '',
    ]),
  );
}

const STYLES = ['connect', 'connect alt', 'connect alt2', 'connect fit'];
const STYLE_NL = ['blauw', 'groen (streepjes)', 'oranje', 'rood'];

/** Interaction / effects plot: x = level of B, one line per level of A. */
export function interactionPlot(cellM: number[][], aNames: string[], bNames: string[], aLabel = 'A', bLabel = 'B', ylabel = 'gemiddelde respons') {
  const svg = lineChart(
    {
      series: cellM.map((ro, i) => ({ pts: ro.map((v, j) => [j + 1, v] as [number, number]), cls: STYLES[i % STYLES.length], dots: true })),
      xlabel: `${bLabel}: ` + bNames.map((n, j) => `${j + 1} = ${n}`).join(', '),
      ylabel,
      x0: 0.7,
      x1: bNames.length + 0.3,
    },
    640,
    260,
  );
  const legend = h('div', { class: 'muted' }, `Lijnen per niveau van ${aLabel}: ` + aNames.map((n, i) => `${n} = ${STYLE_NL[i % STYLE_NL.length]}`).join('; ') + (aNames.length > 4 ? ' (kleuren herhalen na 4 lijnen)' : '') + '. Parallelle lijnen = geen interactie.');
  return chartBox(svg, legend);
}

const pDec = (p: number, a: number) => (p < a ? 'significant' : 'niet significant');

// ---------- one-way ----------
function onewayTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('an1', () => run());
  const alpha = f.num('alpha', 'α (significantieniveau)', 0.05);
  const g = (G as any).anova_oneway;
  const maxN = Math.max(...g.groups.map((x: number[]) => x.length));
  const grid = new DataGrid({
    key: 'an1',
    cols: 4,
    examples: [{ label: 'Voorbeeld ANOVA-tool: katoen % (5 groepen)', data: TOOL_EX.cotton }, { label: 'Voorbeeld laden (3 groepen)', data: () => ({ headers: g.groups.map((_: any, i: number) => `Groep ${i + 1}`), rows: Array.from({ length: maxN }, (_, i) => g.groups.map((c: number[]) => c[i] ?? '')) }) }],
    onChange: () => run(),
  });
  el.append(card('Eenweg-ANOVA (one-way ANOVA)', h('p', { class: 'muted' }, 'Elke kolom is een groep (niveau van de factor); de kolomkop is de groepsnaam. Groepen mogen verschillend groot zijn. H0: alle groepsgemiddelden zijn gelijk.'), grid.el, row(alpha.el)), out);
  run = live(out, () => {
    const a = prob(alpha.get(), 'α');
    const cols = grid.getFilledColumns();
    need(cols.length >= 2, 'Vul minstens 2 kolommen (groepen) met getallen in.');
    const bad = cols.filter((c) => c.invalid > 0);
    for (const c of cols) need(c.values.length >= 1, `Groep "${c.name}" bevat geen getallen.`);
    const r = calc(() => oneWay(cols.map((c) => c.values)));
    const k = cols.length;
    const N = r.ns.reduce((s, v) => s + v, 0);
    const [B, W] = r.rows;
    const Fc = fInvRt(a, r.df[0], r.df[1]);
    const sds = cols.map((c) => (c.values.length >= 2 ? sdS(c.values) : NaN));
    const fs = sds.filter((v) => isFinite(v) && v > 0);
    const ratio = fs.length >= 2 ? Math.max(...fs) / Math.min(...fs) : NaN;
    const warnings: string[] = [];
    if (bad.length) warnings.push(`Tekst in de kolom(men) ${bad.map((c) => `"${c.name}"`).join(', ')} werd genegeerd.`);
    if (isFinite(ratio) && ratio > 2) warnings.push(`Gelijke varianties twijfelachtig: grootste/kleinste s = ${fmt(ratio)} > 2. ANOVA is redelijk robuust bij gelijke groepsgroottes; overweeg anders Welch-ANOVA of een transformatie.`);
    if (r.ns.some((n) => n < 2)) warnings.push('Minstens één groep heeft slechts 1 waarneming: geen spreiding binnen die groep te schatten.');
    warnings.push('Aannames: (1) onafhankelijke waarnemingen (random toewijzing/volgorde), (2) normaal verdeelde residuen per groep, (3) gelijke varianties (homoscedasticiteit). Controleer met de s per groep hieronder en een residuplot.');
    const best = r.means.indexOf(Math.max(...r.means));
    const worst = r.means.indexOf(Math.min(...r.means));
    const grpTbl = table(['Groep', 'n', 'gemiddelde', 's'], cols.map((c, i) => [c.name, String(r.ns[i]), fmt(r.means[i]), fmt(sds[i])]).concat([['Totaal', String(N), fmt(r.grand), '']]));
    const pts: [number, number][] = cols.flatMap((c, i) => c.values.map((v) => [i + 1, v] as [number, number]));
    const plot = chartBox(
      lineChart({ series: [{ pts, dots: true, cls: 'alt2' }, { pts: r.means.map((m, i) => [i + 1, m] as [number, number]), cls: 'connect fit', dots: true }], hlines: [{ y: r.grand, label: 'ȳ ' + fmt(r.grand), cls: 'cl' }], xlabel: 'Groep: ' + cols.map((c, i) => `${i + 1} = ${c.name}`).join(', '), ylabel: 'respons', x0: 0.6, x1: k + 0.4 }),
      h('div', { class: 'muted' }, 'Gemiddeldenplot (main effects plot): punten = waarnemingen, rode lijn = groepsgemiddelden, groene lijn = algemeen gemiddelde.'),
    );
    return resultPanel({
      question: [`\\(H_0: \\mu_1 = \\mu_2 = \\dots = \\mu_{${k}}\\) versus \\(H_a\\): minstens één gemiddelde verschilt, \\(\\alpha = ${tx(a)}\\)`],
      formula: [
        `SS_T = SS_B + SS_W,\\quad SS_B=\\sum_i n_i(\\bar{y}_i-\\bar{y})^2,\\quad SS_W=\\sum_i\\sum_j (y_{ij}-\\bar{y}_i)^2`,
        `F=\\frac{MS_B}{MS_W}=\\frac{SS_B/(k-1)}{SS_W/(N-k)}\\sim F(k-1;\\,N-k)`,
      ],
      substituted: [`${tx(B.SS + W.SS)} = ${tx(B.SS)} + ${tx(W.SS)}`, `F=\\frac{${tx(B.SS)}/${r.df[0]}}{${tx(W.SS)}/${r.df[1]}}=\\frac{${tx(B.MS)}}{${tx(W.MS)}}=${tx(r.F)},\\quad F_{krit}=F_{${tx(a)};\\,${r.df[0]};\\,${r.df[1]}}=${tx(Fc)}`],
      result: [['F', fmt(r.F)], ['df', `${r.df[0]} ; ${r.df[1]}`], ['p-waarde', fmt(r.p)], ['F kritiek', fmt(Fc)], ['MS_W (schatting σ²)', fmt(r.MSW)], ['R² = SS_B/SS_T', fmt(B.SS / (B.SS + W.SS))]],
      decision: r.p < a ? { text: `Verwerp H₀ (p < α = ${fmt(a)}): minstens één groepsgemiddelde verschilt`, kind: 'reject' } : { text: `H₀ niet verwerpen (p ≥ α = ${fmt(a)})`, kind: 'accept' },
      warnings,
      extra: [anovaTable(r.rows, a, () => r.df[1]), grpTbl, plot],
      excel: [`p: =F.DIST.RT(${xl(r.F)};${r.df[0]};${r.df[1]})`, `F kritiek: =F.INV.RT(${xl(a)};${r.df[0]};${r.df[1]})`, 'SS_W per groep: =DEVSQ(bereik groep); SS_T: =DEVSQ(alle data)', 'Of: Gegevens > Gegevensanalyse > Anova: één factor'],
      explain: exOneWay({ k, N, F: r.F, Fc, p: r.p, a, msb: B.MS, msw: W.MS, df1: r.df[0], df2: r.df[1], r2: B.SS / (B.SS + W.SS) }),
      answer:
        `Eenweg-ANOVA met ${k} groepen (N = ${N}): F = ${nl(r.F)} met df = (${r.df[0]}; ${r.df[1]}) en p-waarde ${nl(r.p)} (F kritiek = ${nl(Fc)}). ` +
        (r.p < a
          ? `Omdat p < alpha = ${nl(a)} verwerpen we H0: minstens één groepsgemiddelde verschilt significant (hoogste gemiddelde: ${cols[best].name} = ${nl(r.means[best])}, laagste: ${cols[worst].name} = ${nl(r.means[worst])}). Welke groepen precies verschillen, volgt uit een post-hoc vergelijking (bv. Tukey of paarsgewijze t-toetsen met Bonferroni).`
          : `Omdat p >= alpha = ${nl(a)} kunnen we H0 niet verwerpen: er is onvoldoende bewijs dat de groepsgemiddelden verschillen.`) +
        ' Aannames: onafhankelijke waarnemingen, normaliteit en gelijke varianties per groep.',
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- two-way ----------
// Examples from the UGAIN ANOVA tool (reference/drive/ANOVA Tool), verified in tests/drive.test.ts.
export const TOOL_EX = {
  cotton: () => ({ headers: ['15', '20', '25', '30', '35'], rows: [[7, 12, 14, 19, 7], [7, 17, 18, 25, 10], [15, 12, 18, 22, 11], [11, 18, 19, 19, 15], [9, 18, 19, 23, 11]] }),
  machines: () => ({ headers: ['', 'Milling', 'Turning', 'Painting', 'Cutting'], rows: [['Peter', 46, 56, 55, 47], ['Paul', 54, 55, 51, 56], ['Mary', 48, 56, 50, 58], ['Donald', 46, 60, 51, 59], ['Hillary', 51, 53, 53, 55]] }),
  plant: () => ({ headers: ['Water', 'None', 'Low', 'Medium', 'High'], rows: [['Daily', 4.8, 5, 6.4, 6.3], ['', 4.4, 5.2, 6.2, 6.4], ['', 3.2, 5.6, 4.7, 5.6], ['', 3.9, 4.3, 5.5, 4.8], ['', 4.4, 4.8, 5.8, 5.8], ['Weekly', 4.4, 4.9, 5.8, 6], ['', 4.2, 5.3, 6.2, 4.9], ['', 3.8, 5.7, 6.3, 4.6], ['', 3.7, 5.4, 6.5, 5.6], ['', 3.9, 4.8, 5.5, 5.5]] }),
  grr: () => ({ headers: ['', 'A', 'B', 'C'], rows: [['P1', 20, 20, 20], ['', 15, 20, 15], ['P2', 20, 15, 20], ['', 25, 10, 20], ['P3', 25, 15, 25], ['', 25, 10, 25], ['P4', 50, 45, 45], ['', 50, 20, 50], ['P5', 45, 35, 40], ['', 40, 40, 40]] }),
};
const NOREP_EX = { headers: ['Operator 1', 'Operator 2', 'Operator 3'], rows: [[52, 55, 50], [48, 51, 47], [56, 58, 54], [50, 54, 49]] };
const REP_EX = () => {
  const d: Record<string, Record<string, number[]>> = {
    Laag: { P1: [20, 22, 21], P2: [25, 24, 26], P3: [28, 27, 29] },
    Hoog: { P1: [23, 24, 22], P2: [30, 31, 29], P3: [38, 36, 37] },
  };
  const rows: (string | number)[][] = [];
  for (const [a, bs] of Object.entries(d)) for (const [b, ys] of Object.entries(bs)) for (const y of ys) rows.push([a, b, y]);
  return { headers: ['Temperatuur (A)', 'Druk (B)', 'Opbrengst (y)'], rows };
};

import { blockToLong } from '../calc/anova.ts';
export { blockToLong };

/** Parse a long-format grid: label columns + last column numeric response. */
export function parseLongRows(raw: string[][], nKeys: number, what: string) {
  const recs: { keys: string[]; y: number }[] = [];
  let skipped = 0;
  raw.forEach((r, i) => {
    const keys = r.slice(0, nKeys).map((v) => (v ?? '').trim());
    const vs = (r[r.length - 1] ?? '').trim();
    const y = parseNum(vs);
    if (y === null) {
      if (keys.some(Boolean)) skipped++;
      return;
    }
    if (Number.isNaN(y)) {
      if (i === 0) return; // header row pasted as data
      throw new InputError(`Rij ${i + 1}: "${vs}" in de kolom ${what} is geen getal.`);
    }
    const miss = keys.findIndex((k) => !k);
    if (miss >= 0) throw new InputError(`Rij ${i + 1}: kolom ${miss + 1} (niveau) is leeg.`);
    recs.push({ keys, y });
  });
  return { recs, skipped };
}

function twowayTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('an2', () => run());
  const mode = f.seg('mode', 'Ontwerp', [['norep', 'Zonder herhaling (1 waarneming per cel)'], ['rep', 'Met herhaling (lang formaat)']], 'rep');
  const alpha = f.num('alpha', 'α', 0.05);
  const gN = new DataGrid({ key: 'an2n', cols: 4, examples: [{ label: 'Voorbeeld ANOVA-tool: machines x operatoren', data: TOOL_EX.machines }, { label: 'Voorbeeld laden (4 x 3)', data: () => NOREP_EX }], onChange: () => run() });
  const gR = new DataGrid({ key: 'an2r', cols: 3, rows: 30, examples: [{ label: 'Voorbeeld ANOVA-tool: plantengroei (blokformaat)', data: TOOL_EX.plant }, { label: 'Voorbeeld lang formaat (2 x 3, 3 herhalingen)', data: REP_EX }], onChange: () => run() });
  const helpN = h('p', { class: 'muted' }, 'Zonder herhaling: elke rij = niveau van factor A (rij 1, 2, ...), elke kolom = niveau van factor B (kolomkop = naam). Eén waarneming per cel; geen lege cellen. De interactie kan hier niet getoetst worden (zit in de fout).');
  const helpR = h('p', { class: 'muted' }, 'Met herhaling, twee formaten: (1) Excel-blokformaat zoals in Excel "Anova: twee factoren met herhaling" en de ANOVA-tool: kopregel = niveaus van factor B, elk niveau van factor A begint op een rij met label in de eerste kolom, de volgende herhalingen staan op rijen met een lege eerste cel. (2) Lang formaat: kolom 1 = niveau A, kolom 2 = niveau B, kolom 3 = y. Elke combinatie A x B moet even veel herhalingen (r >= 2) hebben.');
  el.append(card('Tweeweg-ANOVA (two-way ANOVA)', row(mode.el), helpN, gN.el, helpR, gR.el, row(alpha.el)), out);
  run = live(out, () => {
    const rep = mode.get() === 'rep';
    gN.el.hidden = rep;
    helpN.hidden = rep;
    gR.el.hidden = !rep;
    helpR.hidden = !rep;
    const a = prob(alpha.get(), 'α');
    if (!rep) {
      let M = gN.getMatrix();
      const rawN = gN.getRaw();
      const labelCol = rawN.length > 0 && rawN.every((r) => { const p = parseNum(r[0] ?? ''); return p === null || Number.isNaN(p); });
      if (labelCol) M = M.map((r) => r.slice(1));
      need(M.length >= 2 && (M[0]?.length ?? 0) >= 2, 'Vul een matrix van minstens 2 rijen x 2 kolommen in.');
      need(M.every((r) => r.every((v) => v !== null)), 'Lege of niet-numerieke cellen gevonden: tweeweg zonder herhaling vereist een volledige matrix.');
      const Mx = M as number[][];
      const r = calc(() => twoWayNoRep(Mx));
      const [A, B, E] = r.rows;
      const an = Mx.map((_, i) => (labelCol ? rawN[i][0] : '') || `rij ${i + 1}`);
      const bn = gN.headers.slice(labelCol ? 1 : 0, (labelCol ? 1 : 0) + Mx[0].length);
      const FcA = fInvRt(a, A.df, E.df);
      const FcB = fInvRt(a, B.df, E.df);
      return resultPanel({
        question: [`\\(H_0^A\\): geen effect van factor A (rijen); \\(H_0^B\\): geen effect van factor B (kolommen); \\(\\alpha = ${tx(a)}\\)`],
        formula: [`SS_A=b\\sum_i(\\bar{y}_{i\\cdot}-\\bar{y})^2,\\quad SS_B=a\\sum_j(\\bar{y}_{\\cdot j}-\\bar{y})^2,\\quad SS_E=SS_T-SS_A-SS_B`, `F_A=\\frac{MS_A}{MS_E},\\quad F_B=\\frac{MS_B}{MS_E},\\quad df_E=(a-1)(b-1)`],
        substituted: [`SS_T=${tx(r.rows[3].SS)} = ${tx(A.SS)} + ${tx(B.SS)} + ${tx(E.SS)}`, `F_A=\\frac{${tx(A.MS)}}{${tx(E.MS)}}=${tx(A.F!)},\\quad F_B=\\frac{${tx(B.MS)}}{${tx(E.MS)}}=${tx(B.F!)}`],
        result: [['F_A (rijen)', `${fmt(A.F!)} (p = ${fmt(A.p!)}, F krit ${fmt(FcA)}): ${pDec(A.p!, a)}`], ['F_B (kolommen)', `${fmt(B.F!)} (p = ${fmt(B.p!)}, F krit ${fmt(FcB)}): ${pDec(B.p!, a)}`], ['MS_E', fmt(E.MS)]],
        warnings: ['Zonder herhaling is de interactie A x B niet te scheiden van de fout: we veronderstellen dat er geen interactie is. Wil je de interactie toetsen, meet dan elke combinatie minstens 2 keer.'],
        extra: [anovaTable(r.rows, a, () => E.df), table(['', ...bn, 'rijgemiddelde'], Mx.map((ro, i) => [an[i], ...ro.map((v) => fmt(v)), fmt(r.rm[i])]).concat([['kolomgemiddelde', ...r.cm.map((v) => fmt(v)), fmt(r.gm)]])), interactionPlot(Mx, an, bn, 'A (rijen)', 'B (kolommen)', 'respons')],
        excel: [`p_A: =F.DIST.RT(${xl(A.F!)};${A.df};${E.df})`, `p_B: =F.DIST.RT(${xl(B.F!)};${B.df};${E.df})`, `F krit A: =F.INV.RT(${xl(a)};${A.df};${E.df})`, 'Of: Gegevens > Gegevensanalyse > Anova: twee factoren zonder herhaling'],
        explain: exTwoWay({ rep: false, pA: A.p!, pB: B.p!, a }),
        answer: `Tweeweg-ANOVA zonder herhaling (${Mx.length} x ${Mx[0].length}): factor A (rijen) heeft F = ${nl(A.F!)} met p = ${nl(A.p!)} en is dus ${pDec(A.p!, a)}; factor B (kolommen) heeft F = ${nl(B.F!)} met p = ${nl(B.p!)} en is ${pDec(B.p!, a)} (alpha = ${nl(a)}). Omdat er per cel slechts één waarneming is, wordt verondersteld dat er geen interactie is; de interactie zit in de foutterm.`,
      });
    }
    let raw = gR.getRaw();
    need(raw.length > 0, 'Vul de data in (lang formaat A, B, y of Excel-blokformaat) of laad een voorbeeld.');
    const blk = blockToLong(raw, gR.headers);
    const isBlock = blk !== null;
    if (blk) raw = blk;
    need((raw[0]?.length ?? 0) >= 3, 'Lang formaat heeft 3 kolommen nodig: niveau A, niveau B, respons y.');
    const { recs, skipped } = parseLongRows(raw.map((r) => r.slice(0, 3)), 2, '3 (respons)');
    need(recs.length >= 8, 'Te weinig waarnemingen: minstens 2 x 2 combinaties met elk 2 herhalingen.');
    const hd = gR.headers;
    const aLab = isBlock ? hd[0] || 'A (rijen)' : hd[0] || 'A';
    const bLab = isBlock ? 'B (kolommen)' : hd[1] || 'B';
    const cs = calc(() => buildCells(recs.map((r) => ({ a: r.keys[0], b: r.keys[1], y: r.y })), aLab, bLab));
    need(cs.aLevels.length >= 2 && cs.bLevels.length >= 2, 'Beide factoren moeten minstens 2 niveaus hebben.');
    const r = calc(() => twoWayRep(cs.cells));
    const [A, B, AB, E, T] = r.rows;
    const fc = (d: number) => fInvRt(a, d, E.df);
    const intSig = AB.p! < a;
    const warnings: string[] = [];
    if (skipped) warnings.push(`${skipped} rij(en) zonder respons overgeslagen.`);
    warnings.push(intSig ? `Significante interactie (p = ${fmt(AB.p!)}): het effect van ${aLab} hangt af van het niveau van ${bLab}. Interpreteer de hoofdeffecten niet afzonderlijk; kijk naar de celgemiddelden en het interactieplot (lijnen niet parallel).` : `Geen significante interactie (p = ${fmt(AB.p!)}): de lijnen in het interactieplot lopen ongeveer parallel; de hoofdeffecten mogen afzonderlijk geïnterpreteerd worden.`);
    const cellTbl = table([`${aLab} \\ ${bLab}`, ...cs.bLevels, 'gemiddelde'], cs.aLevels.map((an, i) => [an, ...r.cellM[i].map((v) => fmt(v)), fmt(r.rm[i])]).concat([['gemiddelde', ...r.cm.map((v) => fmt(v)), fmt(r.gm)]]));
    return resultPanel({
      question: [`Tweeweg-ANOVA met herhaling: ${cs.aLevels.length} niveaus ${aLab} x ${cs.bLevels.length} niveaus ${bLab}, r = ${cs.r} herhalingen, \\(\\alpha = ${tx(a)}\\)`, '\\(H_0\\): geen effect van A; geen effect van B; geen interactie A x B (drie afzonderlijke toetsen)'],
      formula: [
        `SS_T = SS_A + SS_B + SS_{AB} + SS_E`,
        `SS_A=br\\sum_i(\\bar{y}_{i\\cdot\\cdot}-\\bar{y})^2,\\ SS_B=ar\\sum_j(\\bar{y}_{\\cdot j\\cdot}-\\bar{y})^2,\\ SS_{AB}=r\\sum_{i,j}(\\bar{y}_{ij\\cdot}-\\bar{y}_{i\\cdot\\cdot}-\\bar{y}_{\\cdot j\\cdot}+\\bar{y})^2`,
        `F=\\frac{MS_{effect}}{MS_E},\\quad df_E=ab(r-1)`,
      ],
      substituted: [`${tx(T.SS)} = ${tx(A.SS)} + ${tx(B.SS)} + ${tx(AB.SS)} + ${tx(E.SS)}`, `F_A=\\frac{${tx(A.MS)}}{${tx(E.MS)}}=${tx(A.F!)},\\ F_B=\\frac{${tx(B.MS)}}{${tx(E.MS)}}=${tx(B.F!)},\\ F_{AB}=\\frac{${tx(AB.MS)}}{${tx(E.MS)}}=${tx(AB.F!)}`],
      result: [
        [`F_A (${aLab})`, `${fmt(A.F!)} (p = ${fmt(A.p!)}, F krit ${fmt(fc(A.df))}): ${pDec(A.p!, a)}`],
        [`F_B (${bLab})`, `${fmt(B.F!)} (p = ${fmt(B.p!)}, F krit ${fmt(fc(B.df))}): ${pDec(B.p!, a)}`],
        [`F_AB (interactie)`, `${fmt(AB.F!)} (p = ${fmt(AB.p!)}, F krit ${fmt(fc(AB.df))}): ${pDec(AB.p!, a)}`],
        ['MS_E (schatting σ²)', fmt(E.MS)],
      ],
      decision: { text: intSig ? 'Interactie significant: effecten samen interpreteren' : 'Interactie niet significant: hoofdeffecten afzonderlijk interpreteren', kind: intSig ? 'reject' : 'accept' },
      warnings,
      extra: [anovaTable(r.rows, a, () => E.df), cellTbl, interactionPlot(r.cellM, cs.aLevels, cs.bLevels, aLab, bLab, 'celgemiddelde')],
      excel: [`p_A: =F.DIST.RT(${xl(A.F!)};${A.df};${E.df})`, `p_B: =F.DIST.RT(${xl(B.F!)};${B.df};${E.df})`, `p_AB: =F.DIST.RT(${xl(AB.F!)};${AB.df};${E.df})`, `F krit AB: =F.INV.RT(${xl(a)};${AB.df};${E.df})`, `Of: Gegevensanalyse > Anova: twee factoren met herhaling (blokformaat, rijen per steekproef = ${cs.r})`],
      explain: exTwoWay({ rep: true, pA: A.p!, pB: B.p!, pAB: AB.p!, a }),
      answer:
        `Tweeweg-ANOVA met herhaling (${cs.aLevels.length} x ${cs.bLevels.length}, r = ${cs.r}, alpha = ${nl(a)}): ${aLab} F = ${nl(A.F!)} (p = ${nl(A.p!)}, ${pDec(A.p!, a)}), ${bLab} F = ${nl(B.F!)} (p = ${nl(B.p!)}, ${pDec(B.p!, a)}), interactie F = ${nl(AB.F!)} (p = ${nl(AB.p!)}, ${pDec(AB.p!, a)}). ` +
        (intSig ? `Door de significante interactie hangt het effect van ${aLab} af van het niveau van ${bLab}; de beste instelling volgt uit de celgemiddelden en niet uit de hoofdeffecten afzonderlijk.` : `Zonder significante interactie kunnen de hoofdeffecten afzonderlijk worden geïnterpreteerd.`),
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

export const anova: ModuleDef = {
  id: 'anova',
  title: 'ANOVA',
  group: 'Fase 2',
  keywords: ['anova', 'variantieanalyse', 'analysis of variance', 'eenweg', 'tweeweg', 'one-way', 'two-way', 'interactie', 'F-toets groepen', 'gemiddelden vergelijken', 'meerdere groepen', 'SST SSB SSW', 'doe'],
  subs: [
    ['oneway', 'Eenweg-ANOVA (one-way)', 'eenweg groepen gemiddelden vergelijken F p'],
    ['twoway', 'Tweeweg-ANOVA met en zonder herhaling', 'tweeweg interactie herhaling interactieplot'],
    ['theorie', 'Theorie ANOVA: SS opsplitsen, MS, F, tweeweg, interactie', 'theorie variantieanalyse SST SSB SSW MS F logica df post-hoc interactie tweeweg aannames'],
  ],
  mount(el) {
    moduleHead(el, 'ANOVA (variantieanalyse)', 'Op \u00e9\u00e9n pagina: 1. de theorie (waarom ANOVA, SS opsplitsen, MS en F, tabel lezen, tweeweg en interactie), 2. de berekening met uitleg bij elk resultaat.');
    const pg = theoryPage(el, 'anova', 'Theorie: variantieanalyse stap voor stap', anovaTheorie.html, [
      { id: 'oneway', label: 'Eenweg', build: onewayTab },
      { id: 'twoway', label: 'Tweeweg', build: twowayTab },
    ]);
    return { route: pg.route };
  },
};
