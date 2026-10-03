// M7b MSA: Gauge R&R (Average & Range, ANOVA), observed vs actual Cp, bias, linearity, measurement uncertainty.
import { h, fmt, tx, xl, nl, pctNl } from '../ui/core.ts';
import { Form, row, card, note } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { barChart, lineChart, chartBox } from '../components/charts.ts';
import { grrAnova, grrAvgRange, grrVerdict, cpObserved, cpActual, K1, K2, K3 } from '../calc/anova.ts';
import { biasStudy, linearityStudy, buildCells, uSum, uProd, type UTerm } from '../calc/msa_extra.ts';
import { mean, sdS } from '../stats/desc.ts';
import { live, need, moduleHead, pos, posInt, prob } from './util.ts';
import { theoryPage, type ModuleDef } from './types.ts';
import { msaTheorie } from '../generated/content.ts';
import { calc, anovaTable, parseLongRows, blockToLong, TOOL_EX } from './anova.ts';

// ---------- example datasets ----------
// AIAG MSA manual (4th ed.) Average & Range example: 10 parts, appraisers A/B/C, 3 trials.
// Known results: Rbarbar 0,3417, EV 0,2019, Xdiff 0,4447, AV 0,2297, GRR 0,3058, PV 1,1046, TV 1,1461, %GRR 26,7%, ndc 5.
const AIAG: Record<string, number[][]> = {
  A: [[0.29, -0.56, 1.34, 0.47, -0.8, 0.02, 0.59, -0.31, 2.26, -1.36], [0.41, -0.68, 1.17, 0.5, -0.92, -0.11, 0.75, -0.2, 1.99, -1.25], [0.64, -0.58, 1.27, 0.64, -0.84, -0.21, 0.66, -0.17, 2.01, -1.31]],
  B: [[0.08, -0.47, 1.19, 0.01, -0.56, -0.2, 0.47, -0.63, 1.8, -1.68], [0.25, -1.22, 0.94, 1.03, -1.2, 0.22, 0.55, 0.08, 2.12, -1.62], [0.07, -0.68, 1.34, 0.2, -1.28, 0.06, 0.83, -0.34, 2.19, -1.5]],
  C: [[0.04, -1.38, 0.88, 0.14, -1.46, -0.29, 0.02, -0.46, 1.77, -1.49], [-0.11, -1.13, 1.09, 0.2, -1.07, -0.67, 0.01, -0.56, 1.45, -1.77], [-0.15, -0.96, 0.67, 0.11, -1.45, -0.49, 0.21, -0.49, 1.87, -2.16]],
};
const exAIAG = () => {
  const rows: (string | number)[][] = [];
  for (const [op, trials] of Object.entries(AIAG)) trials.forEach((tr, t) => tr.forEach((v, p) => rows.push([p + 1, op, t + 1, v])));
  return { headers: ['Stuk', 'Operator', 'Herhaling', 'Meting'], rows };
};
// Fictief voorbeeld: 5 stukken x 2 operatoren x 2 herhalingen.
const SMALL: Record<string, Record<string, number[]>> = {
  '1': { A: [10.21, 10.25], B: [10.28, 10.24] },
  '2': { A: [9.58, 9.62], B: [9.66, 9.65] },
  '3': { A: [10.79, 10.83], B: [10.88, 10.85] },
  '4': { A: [9.91, 9.88], B: [9.95, 9.97] },
  '5': { A: [10.42, 10.39], B: [10.47, 10.44] },
};
const exSmall = () => {
  const rows: (string | number)[][] = [];
  for (const [p, ops] of Object.entries(SMALL)) for (const [o, ys] of Object.entries(ops)) ys.forEach((y, t) => rows.push([+p, o, t + 1, y]));
  return { headers: ['Stuk', 'Operator', 'Herhaling', 'Meting'], rows };
};
const GRR_EXAMPLES = [
  { label: 'Voorbeeld ANOVA-tool (5 stukken x 3 operatoren x 2, blokformaat)', data: () => TOOL_EX.grr() },
  { label: 'Voorbeeld AIAG-handboek (10 stukken x 3 operatoren x 3)', data: exAIAG },
  { label: 'Fictief voorbeeld (5 x 2 x 2)', data: exSmall },
];
const GRR_HELP = 'Twee formaten. (1) Excel-blokformaat zoals in de ANOVA-tool: kopregel = operatoren, elk stuk begint op een rij met label in de eerste kolom, volgende herhalingen op rijen met een lege eerste cel. (2) Lang formaat (long format), één rij per meting: kolom 1 = stuk (part), kolom 2 = operator (appraiser), kolom 3 = herhaling (trial, optioneel), laatste kolom = meting. Met 3 kolommen is kolom 3 de meting. Labels mogen tekst of getallen zijn. Elke combinatie stuk x operator moet even veel herhalingen hebben.';

function grrData(grid: DataGrid) {
  let raw = grid.getRaw();
  need(raw.length > 0, 'Vul de meetdata in (lang formaat of Excel-blokformaat) of laad een voorbeeld.');
  const blk = blockToLong(raw, grid.headers); // rows = parts, columns = operators (as in the ANOVA tool)
  if (blk) raw = blk;
  const nc = raw[0].length;
  need(nc === 3 || nc === 4, `Gebruik 3 kolommen (stuk, operator, meting) of 4 kolommen (stuk, operator, herhaling, meting); nu ${nc} kolom(men) gevuld.`);
  const { recs, skipped } = parseLongRows(raw, 2, nc === 4 ? '4 (meting)' : '3 (meting)');
  need(recs.length >= 8, 'Te weinig metingen: minstens 2 stukken x 2 operatoren x 2 herhalingen.');
  const cs = calc(() => buildCells(recs.map((r) => ({ a: r.keys[0], b: r.keys[1], y: r.y })), 'stuk', 'operator'));
  need(cs.aLevels.length >= 2, 'Minstens 2 stukken nodig.');
  need(cs.bLevels.length >= 2, 'Minstens 2 operatoren nodig.');
  need(cs.r >= 2, 'Minstens 2 herhalingen per stuk en operator nodig.');
  return { data: cs.cells, parts: cs.aLevels, ops: cs.bLevels, r: cs.r, n: recs.length, skipped };
}

const verdictKind = (p: number) => (p <= 10 ? 'accept' : p <= 30 ? 'neutral' : 'reject') as 'accept' | 'neutral' | 'reject';

// ---------- Average & Range ----------
function arTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('msaar', () => run());
  const tol = f.optNum('tol', 'Tolerantie USL - LSL (optioneel)', '');
  const grid = new DataGrid({ key: 'msaar', cols: 4, rows: 40, examples: GRR_EXAMPLES, onChange: () => run() });
  el.append(card('Gauge R&R: Average & Range methode (AIAG)', h('p', { class: 'muted' }, GRR_HELP), grid.el, row(tol.el)), out);
  run = live(out, () => {
    const d = grrData(grid);
    const T = tol.get();
    if (T !== undefined) pos(T, 'Tolerantie');
    const p = d.parts.length, o = d.ops.length, r = d.r;
    need(!!K1[r], `Average & Range: K1 enkel gekend voor 2 of 3 herhalingen (nu r = ${r}). Gebruik de ANOVA-methode.`);
    need(!!K2[o], `Average & Range: K2 enkel gekend voor 2 of 3 operatoren (nu ${o}). Gebruik de ANOVA-methode.`);
    need(!!K3[p], `Average & Range: K3 enkel gekend voor 2 tot 10 stukken (nu ${p}). Gebruik de ANOVA-methode.`);
    const g = calc(() => grrAvgRange(d.data, T));
    const opTbl = table(['Operator', 'gemiddelde', 'R̄ (gem. range)'], d.ops.map((op, j) => [op, fmt(g.opMeans[j]), fmt(g.opRbar[j])]));
    const partTbl = table(['Stuk', ...d.parts], [['gemiddelde', ...g.partMeans.map((v) => fmt(v))]]);
    const kTbl = table(
      ['Constante', 'waarden (AIAG)', 'gebruikt'],
      [
        ['K1 (herhalingen)', '2: 0,8862 · 3: 0,5908', `r = ${r}: ${fmt(g.K1)}`],
        ['K2 (operatoren)', '2: 0,7071 · 3: 0,5231', `${o} operatoren: ${fmt(g.K2)}`],
        ['K3 (stukken)', Object.entries(K3).map(([k, v]) => `${k}: ${fmt(v)}`).join(' · '), `${p} stukken: ${fmt(g.K3)}`],
      ],
    );
    const hasT = T !== undefined;
    const main = hasT ? g.pctTol : g.pctGRR;
    const res: [string, string][] = [
      ['R̿ (gemiddelde range)', fmt(g.Rbarbar)], ['X̄_diff (max - min operatorgemiddelde)', fmt(g.Xdiff)], ['R_p (range stukgemiddelden)', fmt(g.Rp)],
      ['EV (herhaalbaarheid, repeatability)', fmt(g.EV)], ['AV (reproduceerbaarheid, reproducibility)', fmt(g.AV)], ['GRR', fmt(g.GRR)], ['PV (part variation)', fmt(g.PV)], ['TV (total variation)', fmt(g.TV)],
      ['%EV = 100·EV/TV', fmt(g.pctEV) + '%'], ['%AV = 100·AV/TV', fmt(g.pctAV) + '%'], ['%GRR = 100·GRR/TV', fmt(g.pctGRR) + '%'], ['%PV = 100·PV/TV', fmt(g.pctPV) + '%'],
    ];
    if (hasT) res.push(['%GRR t.o.v. tolerantie = 100·6·GRR/TOL', fmt(g.pctTol) + '%']);
    res.push(['ndc = ⌊1,41·PV/GRR⌋', `${g.ndc} ${g.ndc >= 5 ? '(>= 5: ok)' : '(< 5: onvoldoende onderscheidend vermogen)'}`], ['Oordeel %GRR (TV)', grrVerdict(g.pctGRR)]);
    if (hasT) res.push(['Oordeel %GRR (tolerantie)', grrVerdict(g.pctTol)]);
    const avNeg = (g.Xdiff * g.K2) ** 2 - (g.EV * g.EV) / (p * r) < 0;
    const warnings: string[] = [];
    if (d.skipped) warnings.push(`${d.skipped} rij(en) zonder meting overgeslagen.`);
    if (avNeg) warnings.push('De term onder de wortel voor AV is negatief: AV = 0 (reproduceerbaarheid niet te onderscheiden van herhaalbaarheid).');
    warnings.push('Opgelet: AIAG gebruikt hier 1σ-waarden (K = 1/d2*). Oudere bronnen gebruiken 5,15σ (K1 = 4,56 / 3,05); de percentages blijven gelijk, enkel %tolerantie hangt af van de keuze 6σ of 5,15σ.');
    return resultPanel({
      question: [`Is het meetsysteem geschikt? ${p} stukken, ${o} operatoren, ${r} herhalingen (${d.n} metingen).`],
      formula: [
        `EV=\\bar{\\bar{R}}\\cdot K_1,\\quad AV=\\sqrt{(\\bar{X}_{diff}K_2)^2-\\frac{EV^2}{n\\,r}},\\quad GRR=\\sqrt{EV^2+AV^2}`,
        `PV=R_p\\cdot K_3,\\quad TV=\\sqrt{GRR^2+PV^2},\\quad \\%GRR=100\\frac{GRR}{TV},\\quad ndc=\\left\\lfloor 1{,}41\\frac{PV}{GRR}\\right\\rfloor`,
      ],
      substituted: [
        `EV=${tx(g.Rbarbar)}\\cdot ${tx(g.K1)}=${tx(g.EV)},\\quad AV=\\sqrt{(${tx(g.Xdiff)}\\cdot ${tx(g.K2)})^2-\\frac{${tx(g.EV)}^2}{${p}\\cdot ${r}}}=${tx(g.AV)}`,
        `GRR=\\sqrt{${tx(g.EV)}^2+${tx(g.AV)}^2}=${tx(g.GRR)},\\quad PV=${tx(g.Rp)}\\cdot ${tx(g.K3)}=${tx(g.PV)},\\quad TV=${tx(g.TV)}`,
        `\\%GRR=100\\cdot\\frac{${tx(g.GRR)}}{${tx(g.TV)}}=${tx(g.pctGRR)}\\%${hasT ? `,\\quad \\%GRR_{tol}=100\\cdot\\frac{6\\cdot ${tx(g.GRR)}}{${tx(T!)}}=${tx(g.pctTol)}\\%` : ''},\\quad ndc=\\lfloor 1{,}41\\cdot ${tx(g.PV)}/${tx(g.GRR)}\\rfloor=${g.ndc}`,
      ],
      result: res,
      decision: { text: `Meetsysteem ${grrVerdict(main)}${hasT ? ' (op tolerantie)' : ' (op TV)'}${g.ndc < 5 ? '; ndc < 5' : ''}`, kind: g.ndc < 5 && verdictKind(main) === 'accept' ? 'neutral' : verdictKind(main) },
      warnings,
      extra: [
        opTbl, partTbl, kTbl,
        chartBox(barChart(['%EV', '%AV', '%GRR', '%PV'].concat(hasT ? ['%GRR tol'] : []), [g.pctEV, g.pctAV, g.pctGRR, g.pctPV].concat(hasT ? [g.pctTol] : []), { refLine: 30, refLabel: '30%', ylabel: '% van TV', highlight: [false, false, true, false, true] }), h('div', { class: 'muted' }, 'Componenten als % van de totale variatie (TV); rode lijn = 30%-grens. Let op: percentages op standaardafwijkingen tellen niet op tot 100%.')),
      ],
      excel: [
        `EV: =${xl(g.Rbarbar)}*${xl(g.K1)}`,
        `AV: =SQRT(MAX(0;(${xl(g.Xdiff)}*${xl(g.K2)})^2-${xl(g.EV)}^2/(${p}*${r})))`,
        `GRR: =SQRT(${xl(g.EV)}^2+${xl(g.AV)}^2)`,
        `PV: =${xl(g.Rp)}*${xl(g.K3)} ; TV: =SQRT(${xl(g.GRR)}^2+${xl(g.PV)}^2)`,
        `ndc: =FLOOR(1,41*${xl(g.PV)}/${xl(g.GRR)};1)`,
      ],
      explain: {
        question: ['Een Gauge R&R-studie splitst de gemeten variatie op in wat van het meetsysteem komt (GRR = herhaalbaarheid EV + reproduceerbaarheid AV) en wat echte verschillen tussen de stukken zijn (PV). Een goed meetsysteem heeft een kleine GRR t.o.v. de totale variatie TV.'],
        formula: [
          'EV (herhaalbaarheid): dezelfde operator meet hetzelfde stuk meerdere keren; de ranges van die herhalingen (gemiddeld R\u033f) zetten we met K\u2081 = 1/d\u2082 om naar een standaardafwijking. Typisch het INSTRUMENT.',
          'AV (reproduceerbaarheid): het verschil tussen de operatorgemiddelden (X\u0304_diff, met K\u2082). Daar zit ook nog een stukje herhaalbaarheid in; dat trekken we af (EV\u00b2/(n\u00b7r)). Typisch de OPERATOREN (methode, opleiding).',
          'PV (stukvariatie): het verschil tussen de stukgemiddelden (R_p, met K\u2083). Standaardafwijkingen tel je kwadratisch op: GRR = \u221a(EV\u00b2 + AV\u00b2), TV = \u221a(GRR\u00b2 + PV\u00b2).',
        ],
        substituted: [
          `Herhalingen van eenzelfde stuk verschillen gemiddeld R\u033f = ${nl(g.Rbarbar)}, dus EV = ${nl(g.EV)}. Operatoren verschillen gemiddeld ${nl(g.Xdiff)}, dus AV = ${nl(g.AV)}. De stukken zelf verschillen R_p = ${nl(g.Rp)}, dus PV = ${nl(g.PV)}.`,
          `${g.EV > g.AV ? 'EV > AV: de grootste meetfout zit in het instrument (herhaalbaarheid).' : 'AV > EV: de grootste meetfout zit bij de operatoren (reproduceerbaarheid).'}`,
        ],
        result: [
          `%GRR = ${nl(g.pctGRR)}%: het meetsysteem neemt dat deel van de totale spreiding (in standaardafwijkingen) in. Criteria: \u2264 10% goed, 10 - 30% voorwaardelijk, > 30% onaanvaardbaar.`,
          `ndc = ${g.ndc}: het meetsysteem kan de stukken in ongeveer ${g.ndc} betrouwbare klassen indelen; minstens 5 is nodig om procesvariatie zinvol te volgen.`,
          `Verbeteren: ${g.EV > g.AV ? 'instrument (onderhoud, resolutie, opspanning, beter toestel)' : 'operatoren (opleiding, duidelijke meetprocedure, hulpmiddelen)'}.`,
        ],
      },
      answer:
        `Met de Average & Range methode (${p} stukken, ${o} operatoren, ${r} herhalingen) is EV = ${nl(g.EV)}, AV = ${nl(g.AV)} en GRR = ${nl(g.GRR)}, tegenover PV = ${nl(g.PV)} en TV = ${nl(g.TV)}. ` +
        `%GRR = ${nl(g.pctGRR)}% van de totale variatie${hasT ? ` en ${nl(g.pctTol)}% van de tolerantie` : ''}: het meetsysteem is ${grrVerdict(main)}. ` +
        `Het aantal te onderscheiden categorieën ndc = ${g.ndc} ${g.ndc >= 5 ? 'voldoet aan de eis ndc >= 5' : 'is kleiner dan 5, dus onvoldoende'}. ` +
        (g.EV > g.AV ? 'De herhaalbaarheid (EV, instrument) is de grootste bron: kijk naar het meetinstrument, de opspanning of het onderhoud.' : 'De reproduceerbaarheid (AV, operatoren) is de grootste bron: standaardiseer de meetprocedure en train de operatoren.'),
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- GRR via ANOVA ----------
function anovaTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('msaan', () => run());
  const tol = f.optNum('tol', 'Tolerantie USL - LSL (optioneel)', '');
  const pool = f.seg('pool', 'Interactie stuk x operator', [['course', 'cursusmethode (ANOVA-tool)'], ['auto', 'AIAG: poolen als p > 0,25'], ['never', 'AIAG: nooit poolen'], ['always', 'AIAG: altijd poolen']], 'course');
  const alpha = f.num('alpha', 'α voor F-kritiek', 0.05);
  const grid = new DataGrid({ key: 'msaan', cols: 4, rows: 40, examples: GRR_EXAMPLES, onChange: () => run() });
  el.append(card('Gauge R&R via ANOVA (variantiecomponenten)', h('p', { class: 'muted' }, GRR_HELP + ' Geen beperking op het aantal stukken, operatoren of herhalingen (wel gebalanceerd).'), grid.el, row(tol.el, alpha.el), row(pool.el)), out);
  run = live(out, () => {
    const d = grrData(grid);
    const T = tol.get();
    if (T !== undefined) pos(T, 'Tolerantie');
    const a = prob(alpha.get(), 'α');
    const pm = pool.get();
    const course = pm === 'course';
    const g = calc(() => grrAnova(d.data, T, pm === 'auto' ? 0.25 : pm === 'never' ? Infinity : -1, course ? 'course' : 'aiag'));
    const p = d.parts.length, o = d.ops.length, r = d.r;
    const v = g.var;
    const sd = (x: number) => Math.sqrt(x);
    const comp: [string, number][] = [['Totaal GRR', v.grr], ['  Herhaalbaarheid (EV)', v.rep], ['  Reproduceerbaarheid (AV)', v.repro], ['    Operator', v.op], ['    Operator x stuk', v.int], ['Stuk-tot-stuk (PV)', v.part], ['Totale variatie (TV)', v.tv]];
    const hasT = T !== undefined;
    const vcTbl = table(
      ['Bron', 'Variantie σ²', '% contributie', 'σ', 'Study var 6σ', '% study var', ...(hasT ? ['% tolerantie'] : [])],
      comp.map(([n, x]) => [n, fmt(x), fmt((100 * x) / v.tv) + '%', fmt(sd(x)), fmt(6 * sd(x)), fmt((100 * sd(x)) / sd(v.tv)) + '%', ...(hasT ? [fmt((600 * sd(x)) / T!) + '%'] : [])]),
    );
    const rows = g.rows;
    const den = (i: number) => (g.pooled ? rows[2].df : course ? rows[3].df : i < 2 ? rows[2].df : rows[3].df);
    const msE = g.pooled ? rows[2].MS : rows[3].MS;
    const msI = rows[2].MS;
    const main = hasT ? g.pctTol : g.pctGRR;
    const warnings: string[] = [];
    if (d.skipped) warnings.push(`${d.skipped} rij(en) zonder meting overgeslagen.`);
    if (course) warnings.push(`Cursusmethode (zoals de UGAIN ANOVA-tool): alle F-waarden tegen MS_E; EV² = MS_E, AV² = (MS_O - MS_E)/(p r), PV² = (MS_P - MS_E)/(o r). De interactie (p = ${fmt(g.interactionP)}) is geen aparte component. Kies "AIAG" om de interactie mee te nemen in de reproduceerbaarheid.`);
    else warnings.push(
      g.pooled
        ? `Interactie stuk x operator: p = ${fmt(g.interactionP)}${pm === 'auto' ? ' > 0,25' : ''}, dus gepoold met de herhaalbaarheid (σ²_OxP = 0). Stukken en operatoren worden getoetst tegen de gepoolde fout.`
        : `Interactie stuk x operator: p = ${fmt(g.interactionP)}${pm === 'auto' ? ' <= 0,25' : ''}, niet gepoold. Stukken en operatoren worden getoetst tegen MS(interactie).`,
    );
    if ([v.op, v.part].concat(g.pooled ? [] : [v.int]).some((x) => x === 0)) warnings.push('Een negatieve variantieschatting werd op 0 gezet.');
    const formula = course
      ? [`\hat\sigma^2_{EV}=MS_E,\quad \hat\sigma^2_{AV}=\frac{MS_O-MS_E}{p\,r},\quad \hat\sigma^2_{PV}=\frac{MS_P-MS_E}{o\,r}`]
      : g.pooled
      ? [`\\hat\\sigma^2_{EV}=MS_{E,pool},\\quad \\hat\\sigma^2_{O}=\\frac{MS_O-MS_{E,pool}}{p\\,r},\\quad \\hat\\sigma^2_{P}=\\frac{MS_P-MS_{E,pool}}{o\\,r}`]
      : [`\\hat\\sigma^2_{EV}=MS_E,\\quad \\hat\\sigma^2_{O\\times P}=\\frac{MS_{OP}-MS_E}{r},\\quad \\hat\\sigma^2_{O}=\\frac{MS_O-MS_{OP}}{p\\,r},\\quad \\hat\\sigma^2_{P}=\\frac{MS_P-MS_{OP}}{o\\,r}`];
    formula.push(`\\sigma^2_{GRR}=\\sigma^2_{EV}+\\sigma^2_{O}+\\sigma^2_{O\\times P},\\quad \\sigma^2_{TV}=\\sigma^2_{GRR}+\\sigma^2_P,\\quad \\%GRR=100\\frac{\\sigma_{GRR}}{\\sigma_{TV}},\\quad ndc=\\left\\lfloor1{,}41\\frac{\\sigma_P}{\\sigma_{GRR}}\\right\\rfloor`);
    const sub = course
      ? [`\hat\sigma^2_{EV}=${tx(msE)},\quad \hat\sigma^2_{AV}=\frac{${tx(rows[1].MS)}-${tx(msE)}}{${p}\cdot ${r}}=${tx(v.op)},\quad \hat\sigma^2_{PV}=\frac{${tx(rows[0].MS)}-${tx(msE)}}{${o}\cdot ${r}}=${tx(v.part)}`]
      : g.pooled
      ? [`\\hat\\sigma^2_{EV}=${tx(msE)},\\quad \\hat\\sigma^2_{O}=\\frac{${tx(rows[1].MS)}-${tx(msE)}}{${p}\\cdot ${r}}=${tx(v.op)},\\quad \\hat\\sigma^2_{P}=\\frac{${tx(rows[0].MS)}-${tx(msE)}}{${o}\\cdot ${r}}=${tx(v.part)}`]
      : [`\\hat\\sigma^2_{EV}=${tx(msE)},\\quad \\hat\\sigma^2_{O\\times P}=\\frac{${tx(msI)}-${tx(msE)}}{${r}}=${tx(v.int)},\\quad \\hat\\sigma^2_{O}=\\frac{${tx(rows[1].MS)}-${tx(msI)}}{${p}\\cdot ${r}}=${tx(v.op)},\\quad \\hat\\sigma^2_{P}=\\frac{${tx(rows[0].MS)}-${tx(msI)}}{${o}\\cdot ${r}}=${tx(v.part)}`];
    sub.push(`\\sigma^2_{GRR}=${tx(v.grr)},\\quad \\sigma^2_{TV}=${tx(v.tv)},\\quad \\%GRR=100\\cdot\\frac{${tx(g.GRR)}}{${tx(g.TV)}}=${tx(g.pctGRR)}\\%,\\quad ndc=${g.ndc}`);
    const res: [string, string][] = [
      ['σ_EV (herhaalbaarheid)', fmt(g.EV)], ['σ_AV (reproduceerbaarheid)', fmt(g.AV)], ['σ_GRR', fmt(g.GRR)], ['σ_PV (stukken)', fmt(g.PV)], ['σ_TV', fmt(g.TV)],
      ['% contributie GRR (varianties)', fmt(g.pctContribGRR) + '%'], ['% study variation GRR (σ)', fmt(g.pctGRR) + '%'],
    ];
    if (hasT) res.push(['% tolerantie GRR = 100·6σ_GRR/TOL', fmt(g.pctTol) + '%']);
    res.push(['ndc', `${g.ndc} ${g.ndc >= 5 ? '(>= 5: ok)' : '(< 5: onvoldoende)'}`], ['Oordeel', grrVerdict(main)]);
    return resultPanel({
      question: [`Gauge R&R via tweeweg-ANOVA met herhaling: ${p} stukken x ${o} operatoren x ${r} herhalingen.`],
      formula,
      substituted: sub,
      result: res,
      decision: { text: `Meetsysteem ${grrVerdict(main)}${hasT ? ' (op tolerantie)' : ' (op study variation)'}${g.ndc < 5 ? '; ndc < 5' : ''}`, kind: g.ndc < 5 && verdictKind(main) === 'accept' ? 'neutral' : verdictKind(main) },
      warnings,
      extra: [
        anovaTable(rows, a, den), vcTbl,
        chartBox(barChart(['GRR', 'EV', 'AV', 'PV'], [g.pctGRR, g.pctEV, g.pctAV, g.pctPV], { refLine: 30, refLabel: '30%', ylabel: '% study var', highlight: [true, false, false, false] })),
        note('Criteria: %study variation (of %tolerantie) <= 10% aanvaardbaar, 10 - 30% voorwaardelijk, > 30% onaanvaardbaar. In % contributie (varianties) komen deze grenzen overeen met 1% en 9%.', 'info'),
      ],
      excel: [
        'ANOVA: Gegevens > Gegevensanalyse > Anova: twee factoren met herhaling (stukken in rijen, operatoren in kolommen, r rijen per stuk)',
        ...(g.pooled ? [] : [`p interactie: =F.DIST.RT(${xl(rows[2].F!)};${rows[2].df};${rows[3].df})`]),
        `σ²_O: =MAX(0;(${xl(rows[1].MS)}-${xl(g.pooled || course ? msE : msI)})/(${p}*${r}))`,
        `σ²_P: =MAX(0;(${xl(rows[0].MS)}-${xl(g.pooled || course ? msE : msI)})/(${o}*${r}))`,
        `%GRR: =100*SQRT(${xl(v.grr)})/SQRT(${xl(v.tv)}) ; ndc: =FLOOR(1,41*SQRT(${xl(v.part)})/SQRT(${xl(v.grr)});1)`,
      ],
      explain: {
        question: ['Dezelfde studie als Average & Range, maar geanalyseerd als tweeweg-ANOVA met herhaling (stuk x operator). De mean squares (MS) worden omgezet naar variantiecomponenten: hoeveel van de totale variantie komt van herhaalbaarheid, operatoren, (interactie) en stukken.'],
        formula: [
          'MS_E (binnen de cellen: zelfde stuk, zelfde operator) is zuivere herhaalbaarheid: \u03c3\u00b2_EV = MS_E. MS_operator bevat de herhaalbaarheid plus p\u00b7r keer de operatorvariantie, vandaar \u03c3\u00b2_AV = (MS_O - MS_E)/(p\u00b7r). Analoog \u03c3\u00b2_PV = (MS_P - MS_E)/(o\u00b7r).',
          '% contributie = aandeel in de totale VARIANTIE (telt op tot 100%); % study variation = aandeel in de totale STANDAARDAFWIJKING (zelfde als %GRR bij Average & Range; telt niet op tot 100%).',
        ],
        substituted: [`\u03c3\u00b2_EV = ${nl(v.rep)}, \u03c3\u00b2_AV = ${nl(v.repro)}, \u03c3\u00b2_PV = ${nl(v.part)}; samen \u03c3\u00b2_TV = ${nl(v.tv)}.`],
        result: [`GRR is ${nl(g.pctContribGRR)}% van de totale variantie (% contributie) en ${nl(g.pctGRR)}% in standaardafwijkingen (% study variation). Grenzen: 10% / 30% in study variation komt overeen met 1% / 9% in contributie. ndc = ${g.ndc}.`],
      },
      answer:
        `Uit de ANOVA (${p} stukken, ${o} operatoren, ${r} herhalingen) volgt σ²_EV = ${nl(v.rep)}, σ²_AV = ${nl(v.repro)} en σ²_stuk = ${nl(v.part)}; ${course ? `volgens de cursusmethode (EV² = MS_E, interactie p = ${nl(g.interactionP)} niet apart)` : g.pooled ? `de interactie (p = ${nl(g.interactionP)}) werd gepoold met de fout` : `de interactie operator x stuk (p = ${nl(g.interactionP)}) werd apart geschat`}. ` +
        `De GRR bedraagt ${nl(g.pctContribGRR)}% van de totale variantie (% contributie) en ${nl(g.pctGRR)}% in standaardafwijkingen (% study variation)${hasT ? `, ${nl(g.pctTol)}% van de tolerantie` : ''}: het meetsysteem is ${grrVerdict(main)}. ` +
        `ndc = ${g.ndc} ${g.ndc >= 5 ? '(>= 5, voldoende)' : '(< 5, onvoldoende)'}.`,
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- observed vs actual Cp ----------
function cpTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('msacp', () => run());
  const dir = f.seg('dir', 'Richting', [['a2o', 'werkelijke Cp -> waargenomen Cp'], ['o2a', 'waargenomen Cp -> werkelijke Cp']], 'a2o');
  const cpa = f.num('cpa', 'Cp werkelijk (actual)', 2);
  const cpo = f.num('cpo', 'Cp waargenomen (observed)', 1.28);
  const grr = f.num('grr', '%GRR t.o.v. tolerantie (in %, bv. 60)', 60);
  el.append(card('Waargenomen vs werkelijke capabiliteit', h('p', { class: 'muted' }, 'σ²_waargenomen = σ²_proces + σ²_GRR. Met %GRR op basis van de tolerantie (6·σ_GRR/TOL als fractie) geldt 1/Cp_o² = 1/Cp_a² + %GRR². Voorbeeld formularium: %GRR 60%, Cp_a = 2 -> Cp_o = 1,28.'), row(dir.el), row(cpa.el, cpo.el, grr.el)), out);
  run = live(out, () => {
    const a2o = dir.get() === 'a2o';
    cpa.el.hidden = !a2o;
    cpo.el.hidden = a2o;
    const gp = grr.get();
    need(gp >= 0, '%GRR moet >= 0 zijn.');
    const gf = gp / 100;
    const curve = [5, 10, 20, 30, 40, 50, 60, 70].map((q) => q / 100);
    if (a2o) {
      const A = pos(cpa.get(), 'Cp werkelijk');
      const O = cpObserved(A, gf);
      return resultPanel({
        question: [`Welke Cp wordt waargenomen als de werkelijke \\(C_{p,a}=${tx(A)}\\) en \\(\\%GRR=${tx(gp)}\\%\\) (tolerantie)?`],
        formula: ['\\frac{1}{C_{p,o}^2}=\\frac{1}{C_{p,a}^2}+\\%GRR^2'],
        substituted: [`\\frac{1}{C_{p,o}^2}=\\frac{1}{${tx(A)}^2}+${tx(gf)}^2=${tx(1 / (A * A))}+${tx(gf * gf)}=${tx(1 / (O * O))}\\Rightarrow C_{p,o}=${tx(O)}`],
        result: [['Cp waargenomen', fmt(O)], ['daling t.o.v. werkelijk', pctNl(1 - O / A)]],
        excel: [`=1/SQRT(1/${xl(A)}^2+${xl(gf)}^2)`],
        extra: table(['%GRR', ...curve.map((q) => pctNl(q, 2))], [[`Cp_o bij Cp_a = ${fmt(A)}`, ...curve.map((q) => fmt(cpObserved(A, q)))]]),
        answer: `Door de meetfout (%GRR = ${nl(gp)}% van de tolerantie) daalt de waargenomen Cp van ${nl(A)} naar ${nl(O)}: 1/Cp_o² = 1/${nl(A)}² + ${nl(gf)}² = ${nl(1 / (O * O))}. ${gp > 30 ? 'Het meetsysteem is onaanvaardbaar (> 30%): het proces lijkt veel slechter dan het werkelijk is; verbeter eerst het meetsysteem.' : gp > 10 ? 'Het meetsysteem is slechts voorwaardelijk aanvaardbaar (10 - 30%).' : 'Het meetsysteem is aanvaardbaar (<= 10%) en beïnvloedt de capabiliteit weinig.'}`,
      });
    }
    const O = pos(cpo.get(), 'Cp waargenomen');
    const A = cpActual(O, gf);
    need(isFinite(A), `Niet mogelijk: 1/Cp_o² - %GRR² = ${fmt(1 / (O * O) - gf * gf)} <= 0. De meetfout alleen verklaart al meer dan de waargenomen spreiding; controleer de invoer.`);
    return resultPanel({
      question: [`Wat is de werkelijke Cp als \\(C_{p,o}=${tx(O)}\\) waargenomen wordt en \\(\\%GRR=${tx(gp)}\\%\\) (tolerantie)?`],
      formula: ['\\frac{1}{C_{p,a}^2}=\\frac{1}{C_{p,o}^2}-\\%GRR^2'],
      substituted: [`\\frac{1}{C_{p,a}^2}=\\frac{1}{${tx(O)}^2}-${tx(gf)}^2=${tx(1 / (O * O))}-${tx(gf * gf)}=${tx(1 / (A * A))}\\Rightarrow C_{p,a}=${tx(A)}`],
      result: [['Cp werkelijk', fmt(A)]],
      excel: [`=1/SQRT(1/${xl(O)}^2-${xl(gf)}^2)`],
      answer: `Na correctie voor de meetfout (%GRR = ${nl(gp)}% van de tolerantie) is de werkelijke procescapabiliteit Cp = ${nl(A)} in plaats van de waargenomen ${nl(O)}. Een deel van de waargenomen spreiding komt dus van het meetsysteem, niet van het proces.`,
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- bias ----------
const BIAS_EX = [6.0, 6.1, 5.9, 6.2, 6.0, 5.8, 6.1, 6.3, 6.0, 5.9, 6.1, 6.2, 6.0, 5.9, 6.1];
function biasTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('msabias', () => run());
  const mode = f.seg('mode', 'Invoer', [['raw', 'Ruwe metingen (grid)'], ['sum', 'Samenvatting']], 'raw');
  const xbar = f.num('xbar', 'x̄ (gemiddelde meting)', 6.04);
  const s = f.num('s', 's', 0.1352);
  const n = f.num('n', 'n', 15);
  const ref = f.num('ref', 'Referentiewaarde', 6);
  const alpha = f.num('alpha', 'α', 0.05);
  const tol = f.optNum('tol', 'Tolerantie (optioneel)', '');
  const pv = f.optNum('pv', 'Procesvariatie 6σ (optioneel)', '');
  const grid = new DataGrid({ key: 'msabias', cols: 2, examples: [{ label: 'Fictief voorbeeld (referentie 6,00; n = 15)', data: () => ({ headers: ['meting'], rows: BIAS_EX.map((v) => [v]) }) }], onChange: () => run() });
  const sumRow = row(xbar.el, s.el, n.el);
  el.append(card('Bias-studie (juistheid, accuracy)', h('p', { class: 'muted' }, 'Meet één referentiestuk (gekende referentiewaarde) n keer, bij voorkeur n >= 10. Grid: metingen in de eerste kolom.'), row(mode.el), sumRow, grid.el, row(ref.el, alpha.el, tol.el, pv.el)), out);
  run = live(out, () => {
    const raw = mode.get() === 'raw';
    sumRow.hidden = raw;
    grid.el.hidden = !raw;
    let X: number, S: number, N: number;
    const warnings: string[] = [];
    if (raw) {
      const c = grid.getFilledColumns()[0];
      need(!!c && c.values.length >= 2, 'Plak minstens 2 metingen in de eerste kolom.');
      if (c.invalid) warnings.push(`${c.invalid} cel(len) met tekst genegeerd.`);
      X = mean(c.values);
      S = sdS(c.values);
      N = c.values.length;
    } else {
      X = xbar.get();
      S = pos(s.get(), 's');
      N = posInt(n.get(), 'n', 2);
    }
    need(S > 0, 'Alle metingen zijn gelijk (s = 0): de t-toets is niet te berekenen.');
    const R = ref.get();
    const a = prob(alpha.get(), 'α');
    const T = tol.get();
    const P = pv.get();
    const b = calc(() => biasStudy(X, S, N, R, a));
    if (N < 10) warnings.push('AIAG adviseert minstens 10 herhaalde metingen voor een bias-studie.');
    const res: [string, string][] = [['x̄', fmt(X)], ['s', fmt(S)], ['n', String(N)], ['bias = x̄ - ref', fmt(b.bias)], ['se = s/√n', fmt(b.se)], ['t', fmt(b.t)], ['df', String(b.df)], ['p-waarde (tweezijdig)', fmt(b.p)], ['t kritiek', fmt(b.tcrit)], [`${pctNl(1 - a)}-BI voor bias`, `[${fmt(b.ci[0])} ; ${fmt(b.ci[1])}]`]];
    if (T !== undefined) res.push(['%bias t.o.v. tolerantie', fmt((100 * Math.abs(b.bias)) / pos(T, 'Tolerantie')) + '%']);
    if (P !== undefined) res.push(['%bias t.o.v. procesvariatie', fmt((100 * Math.abs(b.bias)) / pos(P, 'Procesvariatie')) + '%']);
    return resultPanel({
      question: [`\\(H_0: \\text{bias}=0\\) (\\(\\mu = ${tx(R)}\\)) versus \\(H_a: \\text{bias}\\neq 0\\), \\(\\alpha=${tx(a)}\\)`],
      formula: ['\\text{bias}=\\bar{x}-x_{ref},\\quad t=\\frac{\\bar{x}-x_{ref}}{s/\\sqrt{n}}\\sim t(n-1),\\quad \\text{BI: bias}\\pm t_{1-\\alpha/2;\\,n-1}\\frac{s}{\\sqrt{n}}'],
      substituted: [`\\text{bias}=${tx(X)}-${tx(R)}=${tx(b.bias)},\\quad t=\\frac{${tx(b.bias)}}{${tx(S)}/\\sqrt{${N}}}=${tx(b.t)}`],
      result: res,
      decision: b.reject ? { text: `Verwerp H₀: significante bias (p < ${fmt(a)})`, kind: 'reject' } : { text: `H₀ niet verwerpen: geen significante bias (p ≥ ${fmt(a)})`, kind: 'accept' },
      warnings,
      excel: [`bias: =AVERAGE(bereik)-${xl(R)}`, `t: =(${xl(X)}-${xl(R)})/(${xl(S)}/SQRT(${N}))`, `p: =T.DIST.2T(ABS(${xl(b.t)});${b.df})`, `t kritiek: =T.INV.2T(${xl(a)};${b.df})`],
      answer: `De gemiddelde meting ${nl(X)} wijkt ${nl(b.bias)} af van de referentiewaarde ${nl(R)} (bias). De t-toets geeft t = ${nl(b.t)} met p = ${nl(b.p)} (df = ${b.df}); ${b.reject ? `omdat p < ${nl(a)} is de bias significant: het meetsysteem meet systematisch ${b.bias > 0 ? 'te hoog' : 'te laag'} en moet gekalibreerd worden` : `omdat p >= ${nl(a)} is de bias niet significant verschillend van 0`}. Het ${pctNl(1 - a)}-betrouwbaarheidsinterval voor de bias is [${nl(b.ci[0])} ; ${nl(b.ci[1])}]${b.reject ? ' en bevat 0 niet' : ' en bevat 0'}.`,
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- linearity ----------
// AIAG MSA manual linearity example: 5 reference parts, 12 measurements each, process variation 6,00.
const LIN_EX: Record<number, number[]> = {
  2: [2.7, 2.5, 2.4, 2.5, 2.7, 2.3, 2.5, 2.5, 2.4, 2.4, 2.6, 2.4],
  4: [5.1, 3.9, 4.2, 5.0, 3.8, 3.9, 3.9, 3.9, 3.9, 4.0, 4.1, 3.8],
  6: [5.8, 5.7, 5.9, 5.9, 6.0, 6.1, 6.0, 6.1, 6.4, 6.3, 6.0, 6.1],
  8: [7.6, 7.7, 7.8, 7.7, 7.8, 7.8, 7.8, 7.7, 7.8, 7.5, 7.6, 7.7],
  10: [9.1, 9.3, 9.5, 9.3, 9.4, 9.5, 9.5, 9.5, 9.6, 9.2, 9.3, 9.4],
};
function linTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('msalin', () => run());
  const alpha = f.num('alpha', 'α', 0.05);
  const pv = f.optNum('pv', 'Procesvariatie 6σ (of tolerantie)', 6);
  const grid = new DataGrid({ key: 'msalin', cols: 2, rows: 70, examples: [{ label: 'Voorbeeld AIAG-handboek (5 referenties x 12)', data: () => ({ headers: ['Referentie', 'Meting'], rows: Object.entries(LIN_EX).flatMap(([r, ms]) => ms.map((m) => [+r, m])) }) }], onChange: () => run() });
  el.append(card('Lineariteit (linearity)', h('p', { class: 'muted' }, 'Kolom 1 = referentiewaarde, kolom 2 = meting; meerdere rijen per referentie. De bias per rij (meting - referentie) wordt geregresseerd op de referentiewaarde: bias = a + b·referentie.'), grid.el, row(alpha.el, pv.el)), out);
  run = live(out, () => {
    const M = grid.getMatrix();
    need(M.length > 0, 'Vul referentie- en meetwaarden in (2 kolommen) of laad het voorbeeld.');
    const pairs = M.filter((r) => r[0] !== null && r[0] !== undefined && r[1] !== null && r[1] !== undefined) as number[][];
    const dropped = M.length - pairs.length;
    need(pairs.length >= 3, 'Minstens 3 volledige rijen (referentie en meting) nodig.');
    const a = prob(alpha.get(), 'α');
    const P = pv.get();
    if (P !== undefined) pos(P, 'Procesvariatie');
    const ref = pairs.map((r) => r[0]);
    const meas = pairs.map((r) => r[1]);
    const L = calc(() => linearityStudy(ref, meas, a, P));
    const warnings: string[] = [];
    if (dropped) warnings.push(`${dropped} onvolledige rij(en) genegeerd.`);
    const slopeSig = L.pB < a;
    const intSig = L.pA < a;
    const xs = [Math.min(...ref), Math.max(...ref)];
    const plot = chartBox(
      lineChart({
        series: [
          { pts: ref.map((x, i) => [x, L.bias[i]] as [number, number]), dots: true, cls: 'alt2' },
          { pts: L.perRef.map((p) => [p.ref, p.bias] as [number, number]), dots: true, cls: 'connect alt' },
          { pts: xs.map((x) => [x, L.a + L.b * x] as [number, number]), cls: 'fit' },
        ],
        hlines: [{ y: 0, label: 'bias 0', cls: 'cl' }],
        xlabel: 'referentiewaarde',
        ylabel: 'bias',
      }),
      h('div', { class: 'muted' }, 'Punten = bias per meting, groene streepjeslijn = gemiddelde bias per referentie, rode lijn = regressielijn.'),
    );
    const perTbl = table(['Referentie', 'n', 'gem. bias', 's', 't', 'p'], L.perRef.map((p) => [fmt(p.ref), String(p.n), fmt(p.bias), fmt(p.s), fmt(p.t), fmt(p.p)]));
    const res: [string, string][] = [
      ['helling b', `${fmt(L.b)} (se ${fmt(L.seB)}, t = ${fmt(L.tB)}, p = ${fmt(L.pB)})`],
      ['intercept a', `${fmt(L.a)} (se ${fmt(L.seA)}, t = ${fmt(L.tA)}, p = ${fmt(L.pA)})`],
      ['R²', fmt(L.R2)], ['s (residu)', fmt(L.s)], ['t kritiek', `${fmt(L.tc)} (df = ${L.df})`],
      ['%lineariteit = 100·|b|', fmt(L.pctLin) + '%'],
    ];
    if (P !== undefined) res.push(['lineariteit = |b|·procesvariatie', fmt(L.linearity)]);
    return resultPanel({
      question: ['\\(H_0: b = 0\\) (geen lineariteitsprobleem) en \\(H_0: a = 0\\) (geen bias), tweezijdig, \\(\\alpha=' + tx(a) + '\\)'],
      formula: ['\\text{bias}_i = y_i - x_{ref,i} = a + b\\,x_{ref,i} + \\varepsilon_i,\\quad t_b=\\frac{b}{se(b)},\\ t_a=\\frac{a}{se(a)}\\sim t(n-2)', '\\text{lineariteit}=|b|\\cdot\\text{procesvariatie},\\quad \\%\\text{lineariteit}=100\\,|b|'],
      substituted: [`\\text{bias}=${tx(L.a)} ${L.b < 0 ? '-' : '+'} ${tx(Math.abs(L.b))}\\,x_{ref},\\quad t_b=\\frac{${tx(L.b)}}{${tx(L.seB)}}=${tx(L.tB)},\\quad t_a=\\frac{${tx(L.a)}}{${tx(L.seA)}}=${tx(L.tA)}`],
      result: res,
      decision: slopeSig || intSig ? { text: `${slopeSig ? 'Helling significant: lineariteitsprobleem' : 'Helling niet significant'}${intSig ? '; intercept significant: bias aanwezig' : ''}`, kind: 'reject' } : { text: 'Helling en intercept niet significant: meetsysteem lineair en zonder bias', kind: 'accept' },
      warnings,
      extra: [plot, perTbl],
      excel: ['bias-kolom: =meting-referentie', '=SLOPE(bias;referentie) ; =INTERCEPT(bias;referentie)', '=LINEST(bias;referentie;WAAR;WAAR) (geeft se van helling en intercept)', `p helling: =T.DIST.2T(ABS(${xl(L.tB)});${L.df})`, `p intercept: =T.DIST.2T(ABS(${xl(L.tA)});${L.df})`],
      answer:
        `Regressie van de bias op de referentiewaarde geeft bias = ${nl(L.a)} ${L.b < 0 ? '-' : '+'} ${nl(Math.abs(L.b))} x referentie (R² = ${nl(L.R2)}). ` +
        `De helling is ${slopeSig ? 'significant' : 'niet significant'} (t = ${nl(L.tB)}, p = ${nl(L.pB)}): ${slopeSig ? 'de bias verandert over het meetbereik, er is een lineariteitsprobleem' : 'geen aanwijzing dat de bias verandert over het meetbereik'}. ` +
        `Het intercept is ${intSig ? 'significant' : 'niet significant'} (p = ${nl(L.pA)}). %lineariteit = ${nl(L.pctLin)}%${P !== undefined ? ` (lineariteit = ${nl(L.linearity)} bij procesvariatie ${nl(P)})` : ''}.` +
        (slopeSig ? ' Kalibreer het instrument over het volledige bereik of beperk het gebruik tot het lineaire deel.' : ''),
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- measurement uncertainty ----------
function uncTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('msaunc', () => run());
  const mode = f.seg('mode', 'Model', [['sum', 'Som/verschil y = Σ cᵢ·xᵢ'], ['prod', 'Product/quotiënt y = Π xᵢ^nᵢ'], ['func', 'Functie y = f(x)']], 'sum');
  const k = f.num('k', 'dekkingsfactor k', 2);
  const fx = f.num('fx', 'x', 2);
  const fu = f.num('fu', 'u(x)', 0.05);
  const fy = f.optNum('fy', 'f(x) (optioneel)', 4);
  const fd = f.num('fd', "f'(x) (afgeleide in x)", 4);
  const grid = new DataGrid({
    key: 'msaunc',
    cols: 3,
    rows: 10,
    headers: ['waarde xᵢ', 'u(xᵢ)', 'cᵢ of nᵢ'],
    examples: [
      { label: 'Voorbeeld verschil: L = 25,00 - 10,00', data: () => ({ headers: ['waarde xᵢ', 'u(xᵢ)', 'cᵢ of nᵢ'], rows: [[25, 0.02, 1], [10, 0.01, -1]] }) },
      { label: 'Voorbeeld quotiënt: ρ = m/V', data: () => ({ headers: ['waarde xᵢ', 'u(xᵢ)', 'cᵢ of nᵢ'], rows: [[50, 0.1, 1], [20, 0.2, -1]] }) },
    ],
    onChange: () => run(),
  });
  const help = h('p', { class: 'muted' });
  const funcRow = row(fx.el, fu.el, fy.el, fd.el);
  el.append(card('Meetonzekerheid (measurement uncertainty)', row(mode.el), help, grid.el, funcRow, row(k.el)), out);
  el.append(card('Type B standaardonzekerheid (hulp)', table(['Bron', 'Standaardonzekerheid u'], [['uniform over ± a (bv. certificaat zonder verdeling)', 'u = a/√3'], ['resolutie d (digitaal afleesinterval)', 'u = d/√12 = (d/2)/√3'], ['driehoeksverdeling over ± a', 'u = a/√6'], ['certificaat met U en k', 'u = U/k'], ['type A: gemiddelde van n metingen', 'u = s/√n']])));
  run = live(out, () => {
    const m = mode.get();
    grid.el.hidden = m === 'func';
    funcRow.hidden = m !== 'func';
    help.textContent =
      m === 'sum'
        ? 'Per term een rij: waarde xᵢ, standaardonzekerheid u(xᵢ) en coëfficiënt cᵢ (leeg = 1; -1 voor aftrekken). Onafhankelijke grootheden.'
        : m === 'prod'
          ? 'Per factor een rij: waarde xᵢ, standaardonzekerheid u(xᵢ) en exponent nᵢ (leeg = 1; -1 voor delen, 2 voor kwadraat). Onafhankelijke grootheden.'
          : 'Eén variabele: u(f(x)) ≈ |f\'(x)|·u(x) (lineaire benadering, eerste orde Taylor).';
    const K = pos(k.get(), 'k');
    if (m === 'func') {
      const x = fx.get();
      const u = fu.get();
      need(u >= 0, 'u(x) moet >= 0 zijn.');
      const d = fd.get();
      const y = fy.get();
      const uy = Math.abs(d) * u;
      return resultPanel({
        question: [`Standaardonzekerheid van \\(y=f(x)\\) bij \\(x=${tx(x)}\\), \\(u(x)=${tx(u)}\\)`],
        formula: ["u(y)\\approx\\left|f'(x)\\right|\\,u(x),\\quad U=k\\,u(y)"],
        substituted: [`u(y)\\approx|${tx(d)}|\\cdot ${tx(u)}=${tx(uy)},\\quad U=${tx(K)}\\cdot ${tx(uy)}=${tx(K * uy)}`],
        result: [['u(y)', fmt(uy)], [`U (k = ${fmt(K)})`, fmt(K * uy)], ...(y !== undefined ? ([['resultaat', `y = ${fmt(y)} ± ${fmt(K * uy)}`], ['relatief', y !== 0 ? pctNl(uy / Math.abs(y)) : '-']] as [string, string][]) : [])],
        excel: [`u(y): =ABS(${xl(d)})*${xl(u)}`, `U: =${xl(K)}*ABS(${xl(d)})*${xl(u)}`],
        answer: `Met de lineaire benadering is u(y) = |f'(x)| u(x) = ${nl(Math.abs(d))} x ${nl(u)} = ${nl(uy)}. De uitgebreide onzekerheid is U = ${nl(K)} x ${nl(uy)} = ${nl(K * uy)}${K === 2 ? ' (k = 2, ongeveer 95% betrouwbaarheid)' : ''}${y !== undefined ? `, dus y = ${nl(y)} ± ${nl(K * uy)}` : ''}.`,
      });
    }
    const M = grid.getMatrix();
    const terms: UTerm[] = [];
    M.forEach((r, i) => {
      const x = r[0], u = r[1], c = r[2];
      if ((x === null || x === undefined) && (u === null || u === undefined)) return;
      need(x !== null && x !== undefined && u !== null && u !== undefined, `Rij ${i + 1}: vul zowel de waarde als u in.`);
      need(u >= 0, `Rij ${i + 1}: u moet >= 0 zijn.`);
      terms.push({ x, u, c: c === null || c === undefined ? 1 : c });
    });
    need(terms.length >= 1, 'Vul minstens één term in (waarde, u).');
    if (m === 'sum') {
      const r = uSum(terms);
      const yTex = terms.map((t, i) => `${i === 0 ? (t.c < 0 ? '-' : '') : t.c < 0 ? '-' : '+'}${Math.abs(t.c) !== 1 ? tx(Math.abs(t.c)) + '\\cdot ' : ''}${tx(t.x)}`).join('');
      return resultPanel({
        question: ['Gecombineerde standaardonzekerheid van een som/verschil van onafhankelijke grootheden'],
        formula: ['y=\\sum_i c_i x_i,\\quad u_c(y)=\\sqrt{\\sum_i c_i^2\\,u_i^2},\\quad U=k\\,u_c'],
        substituted: [`y=${yTex}=${tx(r.y)},\\quad u_c=\\sqrt{${terms.map((t) => `${Math.abs(t.c) !== 1 ? `(${tx(t.c)}\\cdot ${tx(t.u)})` : tx(t.u)}^2`).join('+')}}=${tx(r.uc)},\\quad U=${tx(K)}\\cdot ${tx(r.uc)}=${tx(K * r.uc)}`],
        result: [['y', fmt(r.y)], ['u_c', fmt(r.uc)], [`U (k = ${fmt(K)})`, fmt(K * r.uc)], ['resultaat', `${fmt(r.y)} ± ${fmt(K * r.uc)}`]],
        extra: table(['term', 'xᵢ', 'u(xᵢ)', 'cᵢ', '(cᵢ·uᵢ)²', '% bijdrage'], terms.map((t, i) => [String(i + 1), fmt(t.x), fmt(t.u), fmt(t.c), fmt(r.contrib[i]), r.uc > 0 ? fmt((100 * r.contrib[i]) / (r.uc * r.uc)) + '%' : '-'])),
        excel: [`u_c: =SQRT(${terms.map((t) => `(${xl(t.c)}*${xl(t.u)})^2`).join('+')})`, `U: =${xl(K)}*${xl(r.uc)}`],
        answer: `Bij een som of verschil tellen de onzekerheden in kwadratuur op (ook bij aftrekken): u_c = ${nl(r.uc)}. De uitgebreide onzekerheid is U = ${nl(K)} x ${nl(r.uc)} = ${nl(K * r.uc)}, dus y = ${nl(r.y)} ± ${nl(K * r.uc)}${K === 2 ? ' (ongeveer 95%)' : ''}.`,
      });
    }
    const r = calc(() => uProd(terms));
    const yTex = terms.map((t) => (t.c === 1 ? tx(t.x) : `${tx(t.x)}^{${tx(t.c)}}`)).join('\\cdot ');
    return resultPanel({
      question: ['Gecombineerde standaardonzekerheid van een product/quotiënt van onafhankelijke grootheden'],
      formula: ['y=\\prod_i x_i^{n_i},\\quad \\frac{u_c(y)}{|y|}=\\sqrt{\\sum_i\\left(n_i\\frac{u_i}{x_i}\\right)^2},\\quad U=k\\,u_c'],
      substituted: [`y=${yTex}=${tx(r.y)},\\quad \\frac{u_c}{|y|}=\\sqrt{${terms.map((t) => `\\left(${t.c !== 1 ? tx(t.c) + '\\cdot' : ''}\\frac{${tx(t.u)}}{${tx(t.x)}}\\right)^2`).join('+')}}=${tx(r.urel)},\\quad u_c=${tx(r.uc)}`],
      result: [['y', fmt(r.y)], ['relatieve u_c/|y|', pctNl(r.urel)], ['u_c', fmt(r.uc)], [`U (k = ${fmt(K)})`, fmt(K * r.uc)], ['resultaat', `${fmt(r.y)} ± ${fmt(K * r.uc)}`]],
      extra: table(['factor', 'xᵢ', 'u(xᵢ)', 'nᵢ', 'nᵢ·uᵢ/xᵢ', '% bijdrage'], terms.map((t, i) => [String(i + 1), fmt(t.x), fmt(t.u), fmt(t.c), fmt(r.rel[i]), r.urel > 0 ? fmt((100 * r.contrib[i]) / (r.urel * r.urel)) + '%' : '-'])),
      excel: [`relatief: =SQRT(${terms.map((t) => `(${xl(t.c)}*${xl(t.u)}/${xl(t.x)})^2`).join('+')})`, `u_c: =${xl(r.urel)}*ABS(${xl(r.y)})`, `U: =${xl(K)}*${xl(r.uc)}`],
      answer: `Bij een product of quotiënt tellen de relatieve onzekerheden in kwadratuur op: u_c/|y| = ${pctNl(r.urel)}, dus u_c = ${nl(r.uc)}. De uitgebreide onzekerheid is U = ${nl(K)} x ${nl(r.uc)} = ${nl(K * r.uc)}, dus y = ${nl(r.y)} ± ${nl(K * r.uc)}${K === 2 ? ' (ongeveer 95%)' : ''}.`,
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

export const msa: ModuleDef = {
  id: 'msa',
  title: 'MSA / Gauge R&R',
  group: 'Fase 2',
  keywords: ['msa', 'meetsysteemanalyse', 'meetsysteem', 'gauge', 'grr', 'gauge r&r', 'herhaalbaarheid', 'reproduceerbaarheid', 'repeatability', 'reproducibility', 'ndc', 'bias', 'lineariteit', 'linearity', 'meetonzekerheid', 'uncertainty', 'swipe', 'EV AV PV'],
  subs: [
    ['ar', 'Gauge R&R Average & Range (AIAG)', 'gauge grr ev av pv tv ndc k1 k2 k3 average range herhaalbaarheid reproduceerbaarheid'],
    ['anova', 'Gauge R&R via ANOVA (variantiecomponenten)', 'gauge grr anova variantiecomponenten contributie study variation interactie'],
    ['cp', 'Waargenomen vs werkelijke Cp (meetfout)', 'cp observed actual grr capabiliteit meetfout'],
    ['bias', 'Bias-studie (t-toets op bias)', 'bias juistheid accuracy referentie'],
    ['lineariteit', 'Lineariteit (regressie bias op referentie)', 'lineariteit linearity helling'],
    ['onzekerheid', 'Meetonzekerheid: propagatie en U = k u', 'meetonzekerheid uncertainty propagatie kwadratuur uitgebreide onzekerheid'],
    ['theorie', 'Theorie MSA: SWIPE, bias, EV, AV, GRR, PV, TV, ndc, criteria', 'theorie swipe bias juistheid precisie herhaalbaarheid reproduceerbaarheid EV AV PV TV ndc K1 K2 K3 criteria stabiliteit meetonzekerheid'],
  ],
  mount(el) {
    moduleHead(el, 'MSA / Gauge R&R (meetsysteemanalyse)', 'Op \u00e9\u00e9n pagina: 1. de theorie (SWIPE, bias, EV, AV, GRR, PV, TV, ndc, criteria, meetonzekerheid), 2. de berekeningen met uitleg bij elk resultaat.');
    const pg = theoryPage(el, 'msa', 'Theorie: meetsysteemanalyse en Gauge R\u0026R', msaTheorie.html, [
      { id: 'ar', label: 'GRR Average & Range', build: arTab },
      { id: 'anova', label: 'GRR ANOVA', build: anovaTab },
      { id: 'cp', label: 'Cp waargenomen', build: cpTab },
      { id: 'bias', label: 'Bias', build: biasTab },
      { id: 'lineariteit', label: 'Lineariteit', build: linTab },
      { id: 'onzekerheid', label: 'Meetonzekerheid', build: uncTab },

    ]);
    return { route: pg.route };
  },
};
