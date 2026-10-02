// M2 Hypothesetoetsen & betrouwbaarheidsintervallen.
import { h, fmt, tx, xl, nl, pctNl, pct } from '../ui/core.ts';
import { Form, row, card, note, exampleRow, type Field } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { densityPlot, chartBox } from '../components/charts.ts';
import * as D from '../stats/dist.ts';
import * as H from '../calc/hypo.ts';
import { mean, sdS, varS } from '../stats/desc.ts';
import { live, need, moduleHead, posInt, pos, prob, SIDES, relTex, relTxt, sideNl } from './util.ts';
import { tabs, type ModuleDef } from './types.ts';
import { exMean, exChi, exF, exProp, exPropCi, exTwo, exPaired, exSampleSize } from './explain.ts';
import type { Side } from '../calc/hypo.ts';
import G from '../../testdata/golden_values.json';

const ciTxt = (ci: [number, number]) => `[${isFinite(ci[0]) ? nl(ci[0]) : '-oneindig'} ; ${isFinite(ci[1]) ? nl(ci[1]) : '+oneindig'}]`;
const ciTex = (ci: [number, number]) => `\\left[${isFinite(ci[0]) ? tx(ci[0]) : '-\\infty'}\\,;\\ ${isFinite(ci[1]) ? tx(ci[1]) : '+\\infty'}\\right]`;
const decide = (reject: boolean, alpha: number) =>
  reject ? { text: `Verwerp H\u2080 (p < \u03b1 = ${fmt(alpha)})`, kind: 'reject' as const } : { text: `H\u2080 niet verwerpen (p \u2265 \u03b1 = ${fmt(alpha)})`, kind: 'accept' as const };
const pTxt = (p: number) => `${fmt(p)} (${pct(p)})`;

/** Summary vs raw-data input for one sample. */
function oneSampleInput(f: Form, key: string, onChange: () => void, defaults: { xbar: number; s: number; n: number }, example: { headers: string[]; rows: number[][] }, sigmaKnown = false) {
  const mode = f.seg('mode', 'Invoer', [['sum', 'Samenvatting'], ['raw', 'Ruwe data (grid)']], 'sum');
  const xbar = f.num('xbar', 'x\u0304 (gemiddelde)', defaults.xbar);
  const s = sigmaKnown ? null : f.num('s', 's (steekproef-standaardafwijking)', defaults.s);
  const n = f.num('n', 'n', defaults.n);
  const grid = new DataGrid({ key, cols: 3, example: () => example, onChange });
  const sumRow = row(xbar.el, s?.el ?? null, n.el);
  return {
    mode,
    els: [row(mode.el), sumRow, grid.el],
    sync() {
      const raw = mode.get() === 'raw';
      sumRow.hidden = raw;
      grid.el.hidden = !raw;
    },
    get(): { xbar: number; s: number; n: number; raw?: number[]; note?: string } {
      if (mode.get() === 'raw') {
        const col = grid.getFilledColumns()[0];
        need(!!col && col.values.length >= 2, 'Plak minstens 2 getallen in de eerste kolom van het grid.');
        const nt = col.invalid ? `${col.invalid} cel(len) met tekst genegeerd.` : undefined;
        return { xbar: mean(col.values), s: sdS(col.values), n: col.values.length, raw: col.values, note: nt };
      }
      const nn = posInt(n.get(), 'n', 2);
      return { xbar: xbar.get(), s: s ? pos(s.get(), 's') : NaN, n: nn };
    },
  };
}

function statPlot(pdf: (x: number) => number, x0: number, x1: number, side: Side, crit: number[], stat: number, lowerTailOnly0 = false) {
  const shade: [number, number][] = side === 'left' ? [[x0 - 1e9, crit[0]]] : side === 'right' ? [[crit[0], x1 + 1e9]] : [[x0 - 1e9, crit[0]], [crit[1], x1 + 1e9]];
  void lowerTailOnly0;
  return chartBox(
    densityPlot({ pdf, x0, x1, shade, vlines: [{ x: stat, label: 'toetsgrootheid ' + fmt(stat), cls: 'mean' }, ...crit.map((c) => ({ x: c, label: 'kritiek ' + fmt(c), cls: 'spec' }))] }),
    h('div', { class: 'muted' }, 'Blauw gearceerd = verwerpingsgebied (oppervlakte α onder H₀); rode lijn = kritieke waarde; groene stippellijn = jouw toetsgrootheid. Valt groen in het blauwe gebied, dan verwerp je H₀.'),
  );
}

// ---------- 1. Z test mean ----------
function zTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('hz', () => run());
  const inp = oneSampleInput(f, 'hz', () => run(), { xbar: 9.928, s: 0.1, n: 20 }, { headers: ['meting'], rows: (G as any).t_test_mean.data.map((v: number) => [v]) }, true);
  const sigma = f.num('sigma', '\u03c3 (gekend)', 0.1);
  const mu0 = f.num('mu0', '\u03bc\u2080', 10);
  const alpha = f.num('alpha', '\u03b1', 0.02);
  const side = f.seg('side', 'H\u2090', SIDES, 'left');
  el.append(card('Z-toets voor het gemiddelde (\u03c3 gekend)', exampleRow(f, [['Voorbeeld Hypothesetester (x\u0304 10,1; \u03c3 0,3; n 36)', { mode: 'sum', xbar: 10.1, sigma: 0.3, n: 36, mu0: 10, alpha: 0.05, side: 'two' }]]), ...inp.els, row(sigma.el, mu0.el, alpha.el), row(side.el)), out);
  run = live(out, () => {
    inp.sync();
    const d = inp.get();
    const sg = pos(sigma.get(), '\u03c3');
    const a = prob(alpha.get(), '\u03b1');
    const m0 = mu0.get();
    const sd = side.get();
    const r = H.zMean(d.xbar, sg, d.n, m0, a, sd);
    const za = sd === 'two' ? `z_{1-\\alpha/2}` : `z_{1-\\alpha}`;
    const critXl = sd === 'two' ? `=NORM.S.INV(${xl(1 - a / 2)})` : sd === 'left' ? `=NORM.S.INV(${xl(a)})` : `=NORM.S.INV(${xl(1 - a)})`;
    const pXl = sd === 'left' ? `=NORM.S.DIST(${xl(r.stat)};WAAR)` : sd === 'right' ? `=1-NORM.S.DIST(${xl(r.stat)};WAAR)` : `=2*(1-NORM.S.DIST(ABS(${xl(r.stat)});WAAR))`;
    return resultPanel({
      question: [`\\(H_0: \\mu = ${tx(m0)}\\) versus \\(H_a: \\mu ${relTex(sd)} ${tx(m0)}\\), \\(\\alpha = ${tx(a)}\\)`],
      formula: [`z=\\frac{\\bar{x}-\\mu_0}{\\sigma/\\sqrt{n}}`, `\\text{BI: } \\bar{x} \\pm ${za}\\,\\frac{\\sigma}{\\sqrt{n}}`],
      substituted: [`z=\\frac{${tx(d.xbar)}-${tx(m0)}}{${tx(sg)}/\\sqrt{${d.n}}}=${tx(r.stat)}`],
      result: [['z', fmt(r.stat)], ['kritieke waarde(n)', r.crit.map((v) => fmt(v)).join(' ; ')], ['p-waarde', pTxt(r.p)], [`${pctNl(1 - a)}-BI voor \u03bc`, ciTxt(r.ci)]],
      decision: decide(r.reject, a),
      warnings: d.note ? [d.note] : [],
      excel: [`kritiek: ${critXl}`, `p: ${pXl}`, `z: =(${xl(d.xbar)}-${xl(m0)})/(${xl(sg)}/SQRT(${d.n}))`],
      explain: exMean('z', { xbar: d.xbar, s: sg, n: d.n, m0, a, side: sd, stat: r.stat, crit: r.crit, p: r.p, reject: r.reject, ci: r.ci, se: sg / Math.sqrt(d.n) }),
      answer: `Toetsgrootheid z = ${nl(r.stat)} met p-waarde ${nl(r.p)}. ${r.reject ? `Omdat p < alpha = ${nl(a)} verwerpen we H0: het gemiddelde is significant ${sd === 'left' ? 'kleiner dan' : sd === 'right' ? 'groter dan' : 'verschillend van'} ${nl(m0)}.` : `Omdat p >= alpha = ${nl(a)} kunnen we H0 niet verwerpen: er is onvoldoende bewijs dat het gemiddelde ${sd === 'left' ? 'kleiner is dan' : sd === 'right' ? 'groter is dan' : 'verschilt van'} ${nl(m0)}.`} Het ${pctNl(1 - a)}-betrouwbaarheidsinterval ${ciTxt(r.ci)} ${r.reject ? 'bevat' : 'bevat wel'} ${r.reject ? 'de waarde ' + nl(m0) + ' niet' : 'de waarde ' + nl(m0)}, wat dezelfde conclusie geeft.`,
      extra: statPlot((x) => D.normPdf(x), -4.5, 4.5, sd, r.crit, r.stat),
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 2. t test mean ----------
function tTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('ht', () => run());
  const g = (G as any).t_test_mean;
  const inp = oneSampleInput(f, 'ht', () => run(), { xbar: 9.928, s: 0.1079, n: 20 }, { headers: ['meting'], rows: g.data.map((v: number) => [v]) });
  const mu0 = f.num('mu0', '\u03bc\u2080', 10);
  const alpha = f.num('alpha', '\u03b1', 0.02);
  const side = f.seg('side', 'H\u2090', SIDES, 'left');
  el.append(card('t-toets voor het gemiddelde (\u03c3 onbekend)', h('p', { class: 'muted' }, 'Voorbeeld (Ottoy): 20 stukken, H\u2080: \u03bc = 10 tegen H\u2090: \u03bc < 10, \u03b1 = 2%. Kies "Ruwe data" en klik "Voorbeeld laden".'), exampleRow(f, [['Voorbeeld slide / Hypothesetester (x\u0304 9,928; s 0,109; n 20)', { mode: 'sum', xbar: 9.928, s: 0.109, n: 20, mu0: 10, alpha: 0.02, side: 'left' }]]), ...inp.els, row(mu0.el, alpha.el), row(side.el)), out);
  run = live(out, () => {
    inp.sync();
    const d = inp.get();
    const a = prob(alpha.get(), '\u03b1');
    const m0 = mu0.get();
    const sd = side.get();
    const r = H.tMean(d.xbar, d.s, d.n, m0, a, sd);
    const df = d.n - 1;
    const critXl = sd === 'two' ? `=T.INV.2T(${xl(a)};${df})` : sd === 'left' ? `=T.INV(${xl(a)};${df})` : `=T.INV(${xl(1 - a)};${df})`;
    const pXl = sd === 'left' ? `=T.DIST(${xl(r.stat)};${df};WAAR)` : sd === 'right' ? `=T.DIST.RT(${xl(r.stat)};${df})` : `=T.DIST.2T(ABS(${xl(r.stat)});${df})`;
    const ta = sd === 'two' ? `t_{1-\\alpha/2;\\,n-1}` : `t_{1-\\alpha;\\,n-1}`;
    const ciTexF = sd === 'left' ? `\\mu < \\bar{x} + ${ta}\\frac{s}{\\sqrt{n}}` : sd === 'right' ? `\\mu > \\bar{x} - ${ta}\\frac{s}{\\sqrt{n}}` : `\\bar{x} \\pm ${ta}\\frac{s}{\\sqrt{n}}`;
    const tcrit = Math.abs(r.crit[r.crit.length - 1]);
    const ciSub = sd === 'left' ? `\\mu < ${tx(d.xbar)} + ${tx(tcrit)}\\cdot\\frac{${tx(d.s)}}{\\sqrt{${d.n}}} = ${tx(r.ci[1])}` : sd === 'right' ? `\\mu > ${tx(d.xbar)} - ${tx(tcrit)}\\cdot\\frac{${tx(d.s)}}{\\sqrt{${d.n}}} = ${tx(r.ci[0])}` : `${tx(d.xbar)} \\pm ${tx(tcrit)}\\cdot\\frac{${tx(d.s)}}{\\sqrt{${d.n}}} = ${ciTex(r.ci)}`;
    const inCI = m0 >= r.ci[0] && m0 <= r.ci[1];
    const lim = Math.max(4, Math.abs(r.stat) + 0.5);
    return resultPanel({
      question: [`\\(H_0: \\mu = ${tx(m0)}\\) versus \\(H_a: \\mu ${relTex(sd)} ${tx(m0)}\\), \\(\\alpha = ${tx(a)}\\), toets ${sideNl(sd)}`],
      formula: [`t=\\frac{\\bar{x}-\\mu_0}{s/\\sqrt{n}} \\sim t(n-1)`, ciTexF],
      substituted: [`t=\\frac{${tx(d.xbar)}-${tx(m0)}}{${tx(d.s)}/\\sqrt{${d.n}}}=${tx(r.stat)}`, ciSub],
      result: [['x\u0304', fmt(d.xbar)], ['s', fmt(d.s)], ['n ; df', `${d.n} ; ${df}`], ['t', fmt(r.stat)], ['kritieke waarde(n)', r.crit.map((v) => fmt(v)).join(' ; ')], ['p-waarde', pTxt(r.p)], [`${pctNl(1 - a)}-BI voor \u03bc`, ciTxt(r.ci)]],
      decision: decide(r.reject, a),
      warnings: [d.note ?? '', d.n < 30 ? 'Voorwaarde: X (ongeveer) normaal verdeeld; bij kleine n belangrijk (t-toets is wel robuust bij grote n).' : ''].filter(Boolean),
      excel: [`t: =(AVERAGE(bereik)-${xl(m0)})/(STDEV.S(bereik)/SQRT(COUNT(bereik)))`, `kritiek: ${critXl}`, `p: ${pXl}`],
      explain: exMean('t', { xbar: d.xbar, s: d.s, n: d.n, m0, a, side: sd, stat: r.stat, crit: r.crit, p: r.p, reject: r.reject, ci: r.ci, se: d.s / Math.sqrt(d.n) }),
      answer: `De toetsgrootheid is t = ${nl(r.stat)} (df = ${df}), de p-waarde is ${nl(r.p)} (${pctNl(r.p)}). ${r.reject ? `Omdat p < alpha = ${pctNl(a)} verwerpen we H0: het gemiddelde is significant ${sd === 'left' ? 'kleiner dan' : sd === 'right' ? 'groter dan' : 'verschillend van'} ${nl(m0)}.` : `Omdat p >= alpha = ${pctNl(a)} verwerpen we H0 niet.`} Het ${sideNl(sd) === 'tweezijdig' ? '' : 'eenzijdige '}${pctNl(1 - a)}-betrouwbaarheidsinterval is ${ciTxt(r.ci)}; ${nl(m0)} ligt daar ${inCI ? 'binnen' : 'buiten'}, wat de conclusie bevestigt.`,
      extra: statPlot((x) => D.tPdf(x, df), -lim, lim, sd, r.crit, r.stat),
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 3. chi2 variance ----------
function chiTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('hc', () => run());
  const g = (G as any).chi2_test_sigma;
  const inp = oneSampleInput(f, 'hc', () => run(), { xbar: 10, s: 0.011654, n: 20 }, { headers: ['meting'], rows: g.data.map((v: number) => [v]) });
  const s0 = f.num('sigma0', '\u03c3\u2080', 0.01);
  const alpha = f.num('alpha', '\u03b1', 0.02);
  const side = f.seg('side', 'H\u2090 (voor \u03c3)', SIDES, 'right');
  el.append(card('\u03c7\u00b2-toets voor de variantie / standaardafwijking', h('p', { class: 'muted' }, 'Voorbeeld (Ottoy): 20 stukken, H\u2080: \u03c3 = 0,01 tegen H\u2090: \u03c3 > 0,01, \u03b1 = 2%. Gemiddelde x\u0304 wordt niet gebruikt.'), exampleRow(f, [['Voorbeeld Hypothesetester (s 0,13; \u03c3\u2080 0,10; n 25)', { mode: 'sum', s: 0.13, n: 25, sigma0: 0.1, alpha: 0.05, side: 'right' }]]), ...inp.els, row(s0.el, alpha.el), row(side.el)), out);
  run = live(out, () => {
    inp.sync();
    const d = inp.get();
    const a = prob(alpha.get(), '\u03b1');
    const sg0 = pos(s0.get(), '\u03c3\u2080');
    const sd = side.get();
    const r = H.chi2Var(d.s, d.n, sg0, a, sd);
    const df = d.n - 1;
    const critXl = sd === 'right' ? [`=CHISQ.INV.RT(${xl(a)};${df})`] : sd === 'left' ? [`=CHISQ.INV(${xl(a)};${df})`] : [`=CHISQ.INV(${xl(a / 2)};${df})`, `=CHISQ.INV.RT(${xl(a / 2)};${df})`];
    const pXl = sd === 'right' ? `=CHISQ.DIST.RT(${xl(r.stat)};${df})` : sd === 'left' ? `=CHISQ.DIST(${xl(r.stat)};${df};WAAR)` : `=2*MIN(CHISQ.DIST(${xl(r.stat)};${df};WAAR);CHISQ.DIST.RT(${xl(r.stat)};${df}))`;
    const ciS: [number, number] = [Math.sqrt(r.ci[0]), Math.sqrt(r.ci[1])];
    const ciF = sd === 'right' ? `\\sigma^2 > \\frac{(n-1)s^2}{\\chi^2_{1-\\alpha;\\,n-1}}` : sd === 'left' ? `\\sigma^2 < \\frac{(n-1)s^2}{\\chi^2_{\\alpha;\\,n-1}}` : `\\frac{(n-1)s^2}{\\chi^2_{1-\\alpha/2}} \\le \\sigma^2 \\le \\frac{(n-1)s^2}{\\chi^2_{\\alpha/2}}`;
    return resultPanel({
      question: [`\\(H_0: \\sigma = ${tx(sg0)}\\) versus \\(H_a: \\sigma ${relTex(sd)} ${tx(sg0)}\\), \\(\\alpha = ${tx(a)}\\)`],
      formula: [`\\chi^2=\\frac{(n-1)s^2}{\\sigma_0^2} \\sim \\chi^2(n-1)`, ciF],
      substituted: [`\\chi^2=\\frac{${df}\\cdot ${tx(d.s)}^2}{${tx(sg0)}^2}=${tx(r.stat)}`],
      result: [['s', fmt(d.s)], ['s\u00b2', fmt(d.s * d.s)], ['\u03c7\u00b2', fmt(r.stat)], ['df', String(df)], ['kritieke waarde(n)', r.crit.map((v) => fmt(v)).join(' ; ')], ['p-waarde', pTxt(r.p)], [`${pctNl(1 - a)}-BI voor \u03c3\u00b2`, ciTxt(r.ci)], [`${pctNl(1 - a)}-BI voor \u03c3`, ciTxt(ciS)]],
      decision: decide(r.reject, a),
      warnings: ['Voorwaarde: X normaal verdeeld. De \u03c7\u00b2-toets voor \u03c3 is NIET robuust tegen afwijkingen van normaliteit.', d.note ?? ''].filter(Boolean),
      excel: [...critXl.map((c) => 'kritiek: ' + c), `p: ${pXl}`, `\u03c7\u00b2: =(COUNT(bereik)-1)*VAR.S(bereik)/${xl(sg0)}^2`],
      explain: exChi({ s: d.s, n: d.n, s0: sg0, a, side: sd, stat: r.stat, crit: r.crit, p: r.p, reject: r.reject, ciS }),
      answer: `Met s = ${nl(d.s)} is chi2 = ${nl(r.stat)} (df = ${df}) en p = ${nl(r.p)}. ${r.reject ? `Omdat p < alpha = ${pctNl(a)} verwerpen we H0: de standaardafwijking is significant ${sd === 'right' ? 'groter dan' : sd === 'left' ? 'kleiner dan' : 'verschillend van'} ${nl(sg0)}.` : `Omdat p >= alpha = ${pctNl(a)} verwerpen we H0 niet: er is onvoldoende bewijs dat sigma ${sd === 'right' ? 'groter is dan' : sd === 'left' ? 'kleiner is dan' : 'verschilt van'} ${nl(sg0)}.`} Het ${pctNl(1 - a)}-betrouwbaarheidsinterval voor sigma is ${ciTxt(ciS)}.`,
      extra: statPlot((x) => D.chi2Pdf(x, df), 0, Math.max(D.chi2InvRt(0.001, df), r.stat * 1.1), sd, r.crit, r.stat),
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 4. F test and CI for the variance ratio ----------
function fTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('hf', () => run());
  const mode = f.seg('mode', 'Invoer', [['sum', 'Samenvatting'], ['raw', 'Ruwe data (2 kolommen)']], 'sum');
  const kind = f.seg('kind', 'Spreiding ingegeven als', [['var', 'variantie s\u00b2'], ['sd', 'standaardafwijking s']], 'var');
  const nm1 = f.text('nm1', 'naam groep 1', 'M1');
  const nm2 = f.text('nm2', 'naam groep 2', 'M2');
  const v1 = f.num('v1', 'steekproef 1 (bv. M1)', 0.004);
  const n1 = f.num('n1', 'n\u2081', 10);
  const v2 = f.num('v2', 'steekproef 2 (bv. M2)', 0.015);
  const n2 = f.num('n2', 'n\u2082', 15);
  const alpha = f.num('alpha', '\u03b1', 0.05);
  const side = f.seg('side', 'H\u2090', [['left', '\u03c3\u2081 < \u03c3\u2082 (1 nauwkeuriger)'], ['two', '\u03c3\u2081 \u2260 \u03c3\u2082'], ['right', '\u03c3\u2081 > \u03c3\u2082 (2 nauwkeuriger)']], 'left');
  const grid = new DataGrid({ key: 'hf', cols: 2, headers: ['M1', 'M2'], onChange: () => run(), example: () => ({ headers: ['A', 'B'], rows: (G as any).two_sample.B.map((b: number, i: number) => [(G as any).two_sample.A[i] ?? '', b]) }) });
  const sumRow = h('div', null, row(nm1.el, nm2.el), row(kind.el, v1.el, n1.el, v2.el, n2.el));
  el.append(
    card('F-toets twee varianties en BI voor de verhouding', h('p', { class: 'muted' }, 'Examen vraag 2: M1 n\u2081 = 10, s\u2081\u00b2 = 0,004; M2 n\u2082 = 15, s\u2082\u00b2 = 0,015; vermoeden: M1 nauwkeuriger (H\u2090: \u03c3\u2081 < \u03c3\u2082), eenzijdig 95%.'), exampleRow(f, [['Examen vraag 2', { mode: 'sum', nm1: 'M1', nm2: 'M2', kind: 'var', v1: 0.004, n1: 10, v2: 0.015, n2: 15, alpha: 0.05, side: 'left' }], ['Voorbeeld Hypothesetester (s\u2081 0,12247; n\u2081 15; s\u2082 0,06325; n\u2082 10)', { mode: 'sum', nm1: '1', nm2: '2', kind: 'sd', v1: 0.12247, n1: 15, v2: 0.06325, n2: 10, alpha: 0.05, side: 'right' }]]), row(mode.el), sumRow, grid.el, row(alpha.el), row(side.el)),
    out,
  );
  run = live(out, () => {
    const raw = mode.get() === 'raw';
    sumRow.hidden = raw;
    grid.el.hidden = !raw;
    let s1sq: number, s2sq: number, N1: number, N2: number;
    let names = [nm1.get() || '1', nm2.get() || '2'];
    if (raw) {
      const cols = grid.getFilledColumns();
      need(cols.length >= 2 && cols[0].values.length >= 2 && cols[1].values.length >= 2, 'Plak twee kolommen met elk minstens 2 getallen.');
      s1sq = varS(cols[0].values);
      s2sq = varS(cols[1].values);
      N1 = cols[0].values.length;
      N2 = cols[1].values.length;
      names = [cols[0].name, cols[1].name];
    } else {
      const sq = kind.get() === 'sd';
      s1sq = pos(v1.get(), 'spreiding 1') ** (sq ? 2 : 1);
      s2sq = pos(v2.get(), 'spreiding 2') ** (sq ? 2 : 1);
      N1 = posInt(n1.get(), 'n\u2081', 2);
      N2 = posInt(n2.get(), 'n\u2082', 2);
    }
    const a = prob(alpha.get(), '\u03b1');
    const sd = side.get();
    const d1 = N1 - 1;
    const d2 = N2 - 1;
    const t = H.fTest(s1sq, N1, s2sq, N2, a, sd);
    // Main CI in the course orientation: rho = sigma2^2 / sigma1^2
    const r21 = s2sq / s1sq;
    const r12 = s1sq / s2sq;
    const ci21L = H.ratioCI(s2sq, N2, s1sq, N1, a, 'lower');
    const ci21U = H.ratioCI(s2sq, N2, s1sq, N1, a, 'upper');
    const ci21T = H.ratioCI(s2sq, N2, s1sq, N1, a, 'two');
    const ci12L = H.ratioCI(s1sq, N1, s2sq, N2, a, 'lower');
    const ci12U = H.ratioCI(s1sq, N1, s2sq, N2, a, 'upper');
    const ci12T = H.ratioCI(s1sq, N1, s2sq, N2, a, 'two');
    const Fa = D.fInv(a, d1, d2);
    const conf = pctNl(1 - a);
    let mainQ: string, mainF: string, mainSub: string, mainRes: [string, string], dec: string, ans: string, excelMain: string[];
    if (sd === 'left') {
      // HA: sigma1 < sigma2 <=> σ₂²/σ₁² > 1 -> lower bound
      const L = ci21L[0];
      mainQ = `Eenzijdig ${conf}-BI (ondergrens) voor \\(\\rho = \\sigma_2^2/\\sigma_1^2\\) (variantie van ${names[1]} in de teller)`;
      mainF = `\\frac{s_1^2/\\sigma_1^2}{s_2^2/\\sigma_2^2} = \\frac{s_1^2}{s_2^2}\\,\\rho \\sim F(n_1-1;\\,n_2-1) \\Rightarrow \\rho \\ge L = \\frac{s_2^2}{s_1^2}\\,F_{\\alpha}(n_1-1;\\,n_2-1)`;
      mainSub = `L = \\frac{${tx(s2sq)}}{${tx(s1sq)}}\\cdot F_{${tx(a)}}(${d1};${d2}) = ${tx(r21)}\\cdot ${tx(Fa)} = ${tx(L)}`;
      mainRes = [`ondergrens L voor \u03c3\u2082\u00b2/\u03c3\u2081\u00b2`, fmt(L)];
      dec = L > 1 ? `L = ${fmt(L)} > 1: verwerp H\u2080, \u03c3\u2081 < \u03c3\u2082 (${names[0]} nauwkeuriger)` : `L = ${fmt(L)} \u2264 1: H\u2080 niet verwerpen, niet aangetoond dat ${names[0]} nauwkeuriger is`;
      ans = `We bepalen een eenzijdig ${conf}-betrouwbaarheidsinterval voor de verhouding σ₂²/σ₁² (variantie van ${names[1]} in de teller). Uit (s₁²/s₂²)·ρ ~ F(${d1};${d2}) volgt de ondergrens L = (s₂²/s₁²) · F.INV(${nl(a)};${d1};${d2}) = ${nl(r21)} · ${nl(Fa)} = ${nl(L)}. ${L > 1 ? `Omdat L > 1 ligt het hele interval boven 1: met ${conf} betrouwbaarheid is de variantie van ${names[1]} groter, dus ${names[0]} werkt nauwkeuriger en het vermoeden is gerechtvaardigd.` : `Omdat L <= 1 bevat het interval de waarde 1: we kunnen niet besluiten dat ${names[0]} nauwkeuriger werkt.`}`;
      excelMain = [`F.INV: =F.INV(${xl(a)};${d1};${d2})  ->  ${fmt(Fa, 6)}`, `L: =(${xl(s2sq)}/${xl(s1sq)})*F.INV(${xl(a)};${d1};${d2})`, `idem: =(${xl(s2sq)}/${xl(s1sq)})/F.INV.RT(${xl(a)};${d2};${d1})`];
    } else if (sd === 'right') {
      const L = ci12L[0];
      const Fa2 = D.fInv(a, d2, d1);
      mainQ = `Eenzijdig ${conf}-BI (ondergrens) voor \\(\\rho = \\sigma_1^2/\\sigma_2^2\\) (variantie van ${names[0]} in de teller)`;
      mainF = `\\rho \\ge L = \\frac{s_1^2}{s_2^2}\\,F_{\\alpha}(n_2-1;\\,n_1-1)`;
      mainSub = `L = \\frac{${tx(s1sq)}}{${tx(s2sq)}}\\cdot ${tx(Fa2)} = ${tx(L)}`;
      mainRes = [`ondergrens L voor \u03c3\u2081\u00b2/\u03c3\u2082\u00b2`, fmt(L)];
      dec = L > 1 ? `L = ${fmt(L)} > 1: verwerp H\u2080, \u03c3\u2081 > \u03c3\u2082 (${names[1]} nauwkeuriger)` : `L = ${fmt(L)} \u2264 1: H\u2080 niet verwerpen`;
      ans = `Eenzijdig ${conf}-BI voor σ₁²/σ₂²: ondergrens L = (s₁²/s₂²) · F.INV(${nl(a)};${d2};${d1}) = ${nl(L)}. ${L > 1 ? `L > 1, dus ${names[1]} werkt significant nauwkeuriger.` : `L <= 1, dus geen bewijs dat ${names[1]} nauwkeuriger werkt.`}`;
      excelMain = [`L: =(${xl(s1sq)}/${xl(s2sq)})*F.INV(${xl(a)};${d2};${d1})`];
    } else {
      mainQ = `Tweezijdig ${conf}-BI voor \\(\\rho = \\sigma_2^2/\\sigma_1^2\\)`;
      mainF = `\\frac{s_2^2}{s_1^2}F_{\\alpha/2}(n_1-1;n_2-1) \\le \\frac{\\sigma_2^2}{\\sigma_1^2} \\le \\frac{s_2^2}{s_1^2}F_{1-\\alpha/2}(n_1-1;n_2-1)`;
      mainSub = `${tx(r21)}\\cdot ${tx(D.fInv(a / 2, d1, d2))} \\le \\rho \\le ${tx(r21)}\\cdot ${tx(D.fInv(1 - a / 2, d1, d2))} \\Rightarrow ${ciTex(ci21T)}`;
      mainRes = [`${conf}-BI voor \u03c3\u2082\u00b2/\u03c3\u2081\u00b2`, ciTxt(ci21T)];
      const has1 = ci21T[0] <= 1 && ci21T[1] >= 1;
      dec = has1 ? 'Interval bevat 1: H\u2080 (gelijke varianties) niet verwerpen' : 'Interval bevat 1 niet: verwerp H\u2080, varianties verschillen';
      ans = `Het tweezijdige ${conf}-betrouwbaarheidsinterval voor σ₂²/σ₁² is ${ciTxt(ci21T)}. ${has1 ? 'Het bevat 1, dus de varianties verschillen niet significant.' : 'Het bevat 1 niet, dus de varianties verschillen significant.'}`;
      excelMain = [`onder: =(${xl(s2sq)}/${xl(s1sq)})*F.INV(${xl(a / 2)};${d1};${d2})`, `boven: =(${xl(s2sq)}/${xl(s1sq)})*F.INV(${xl(1 - a / 2)};${d1};${d2})`];
    }
    const pXl = sd === 'left' ? `=F.DIST(${xl(t.stat)};${d1};${d2};WAAR)` : sd === 'right' ? `=F.DIST.RT(${xl(t.stat)};${d1};${d2})` : `=2*MIN(F.DIST(${xl(t.stat)};${d1};${d2};WAAR);F.DIST.RT(${xl(t.stat)};${d1};${d2}))`;
    const ciTable = table(
      ['Verhouding (teller/noemer)', 'schatting', `ondergrens (eenzijdig ${conf})`, `bovengrens (eenzijdig ${conf})`, `tweezijdig ${conf}`],
      [
        ['\u03c3\u2082\u00b2/\u03c3\u2081\u00b2', fmt(r21), `\u2265 ${fmt(ci21L[0])}`, `\u2264 ${fmt(ci21U[1])}`, ciTxt(ci21T)],
        ['\u03c3\u2081\u00b2/\u03c3\u2082\u00b2', fmt(r12), `\u2265 ${fmt(ci12L[0])}`, `\u2264 ${fmt(ci12U[1])}`, ciTxt(ci12T)],
      ],
    );
    return resultPanel({
      question: [`\\(H_0: \\sigma_1^2 = \\sigma_2^2\\) versus \\(H_a: \\sigma_1 ${relTex(sd)} \\sigma_2\\), \\(\\alpha=${tx(a)}\\)`, mainQ],
      formula: [mainF, `F = \\frac{s_1^2}{s_2^2} \\sim F(n_1-1;\\,n_2-1)\\ \\text{onder } H_0`],
      substituted: [mainSub, `F = \\frac{${tx(s1sq)}}{${tx(s2sq)}} = ${tx(t.stat)},\\quad df = (${d1};\\,${d2})`],
      result: [mainRes, ['F = s\u2081\u00b2/s\u2082\u00b2', fmt(t.stat)], ['kritieke waarde(n) F', t.crit.map((v) => fmt(v)).join(' ; ')], ['p-waarde F-toets', pTxt(t.p)], ['s\u2081\u00b2 ; s\u2082\u00b2', `${fmt(s1sq)} ; ${fmt(s2sq)}`]],
      decision: { text: dec, kind: t.reject ? 'reject' : 'accept' },
      warnings: ['Welke variantie staat in de teller? Hierboven expliciet vermeld. Omdraaien: keer teller en noemer \u00e9n de vrijheidsgraden om; F\u03b1(a;b) = 1/F\u2081\u208b\u03b1(b;a).', 'Voorwaarde: beide populaties normaal en onafhankelijke steekproeven. De F-toets is niet robuust.'],
      extra: [
        h(
          'div',
          null,
          h('h4', null, 'Alle betrouwbaarheidsgrenzen, beide oriëntaties'),
          ciTable,
          h('p', { class: 'muted' }, 'Zo lees je de tabel: elke rij is dezelfde informatie, alleen omgekeerd (ondergrens van de ene verhouding = 1 / bovengrens van de andere). Eenzijdige vraag "is 1 nauwkeuriger?" -> kijk naar de ondergrens van σ₂²/σ₁² (> 1 = ja). Tweezijdige vraag "verschillen ze?" -> kijk of 1 in het tweezijdige interval ligt. Voor standaardafwijkingen neem je de vierkantswortel van de grenzen.'),
        ),
      ],
      excel: [...excelMain, `p (F-toets): ${pXl}`],
      explain: exF({ names, side: sd, a, d1, d2, s1sq, s2sq, F: t.stat, crit: t.crit, p: t.p, reject: t.reject, ci21L, ci21T, ci12U, ci12T }),
      answer: ans,
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 5. Z test proportion + exact ----------
function propTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('hp', () => run());
  const d = f.num('d', 'd (aantal defecten / successen)', 8);
  const n = f.num('n', 'n', 200);
  const pi0 = f.num('pi0', '\u03c0\u2080', 0.02);
  const alpha = f.num('alpha', '\u03b1', 0.05);
  const side = f.seg('side', 'H\u2090', SIDES, 'right');
  const cc = f.check('cc', 'Continu\u00efteitscorrectie \u00b11/(2n) (Ottoy-recept)', true);
  el.append(card('Z-toets voor een fractie (proportie) + exacte binomiale toets', exampleRow(f, [['Voorbeeld Hypothesetester (p 0,08 = 16/200; \u03c0\u2080 0,05)', { d: 16, n: 200, pi0: 0.05, alpha: 0.05, side: 'right' }]]), row(d.el, n.el, pi0.el, alpha.el), row(side.el, cc.el)), out);
  run = live(out, () => {
    const N = posInt(n.get(), 'n');
    const dd = posInt(d.get(), 'd', 0);
    need(dd <= N, 'd kan niet groter zijn dan n.');
    const p0 = prob(pi0.get(), '\u03c0\u2080');
    const a = prob(alpha.get(), '\u03b1');
    const sd = side.get();
    const r = H.zProp(dd, N, p0, a, sd, cc.get());
    const p = dd / N;
    const corr = cc.get() ? (sd === 'left' ? ' + \\frac{1}{2n}' : sd === 'right' ? ' - \\frac{1}{2n}' : ' \\mp \\frac{1}{2n}') : '';
    const exXl = sd === 'left' ? `=BINOM.DIST(${dd};${N};${xl(p0)};WAAR)` : sd === 'right' ? `=1-BINOM.DIST(${dd - 1};${N};${xl(p0)};WAAR)` : `=2*MIN(BINOM.DIST(${dd};${N};${xl(p0)};WAAR);1-BINOM.DIST(${dd - 1};${N};${xl(p0)};WAAR))`;
    return resultPanel({
      question: [`\\(H_0: \\pi = ${tx(p0)}\\) versus \\(H_a: \\pi ${relTex(sd)} ${tx(p0)}\\), \\(\\alpha=${tx(a)}\\)`],
      formula: [`z=\\frac{p${corr}-\\pi_0}{\\sqrt{\\pi_0(1-\\pi_0)/n}}`, `\\text{exact: } p\\text{-waarde} = P(D ${sd === 'left' ? '\\le' : '\\ge'} d \\mid \\pi_0),\\ D\\sim B(n,\\pi_0)`],
      substituted: [`p = ${dd}/${N} = ${tx(p)},\\quad z = ${tx(r.z)}`],
      result: [['p = d/n', fmt(p)], ['z', fmt(r.z)], ['kritieke waarde(n)', r.crit.map((v) => fmt(v)).join(' ; ')], ['p-waarde (normale benadering)', pTxt(r.pValue)], ['p-waarde exact (binomiaal)', pTxt(r.pExact)]],
      decision: decide(r.rejectExact, a),
      warnings: [r.npi0 < 5 || r.nq0 < 5 ? `n\u03c0\u2080 = ${fmt(r.npi0)} < 5: normale benadering onbetrouwbaar, gebruik de exacte binomiale p-waarde.` : `n\u03c0\u2080 = ${fmt(r.npi0)} \u2265 5: normale benadering aanvaardbaar.`],
      excel: [`p normaal: =${sd === 'left' ? '' : '1-'}NORM.S.DIST(${xl(sd === 'two' ? Math.abs(r.z) : r.z)};WAAR)${sd === 'two' ? ' (x2)' : ''}`, `p exact: ${exXl}`],
      explain: exProp({ dd, n: N, p0, a, side: sd, z: r.z, crit: r.crit, pN: r.pValue, pE: r.pExact, reject: r.rejectExact, cc: cc.get() }),
      answer: `Waargenomen fractie p = ${dd}/${N} = ${pctNl(p)}. De exacte binomiale p-waarde is ${nl(r.pExact)} (normale benadering ${nl(r.pValue)}). ${r.rejectExact ? `Omdat p < alpha = ${pctNl(a)} verwerpen we H0: de fractie is significant ${sd === 'right' ? 'groter dan' : sd === 'left' ? 'kleiner dan' : 'verschillend van'} ${pctNl(p0)}.` : `Omdat p >= alpha = ${pctNl(a)} verwerpen we H0 niet.`}`,
    });
  });
  run();
}

// ---------- 6. CI for a proportion ----------
function propCiTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('hpci', () => run());
  const d = f.num('d', 'd (aantal defecten)', 4);
  const n = f.num('n', 'n (steekproef)', 100);
  const conf = f.num('conf', 'betrouwbaarheid 1-\u03b1', 0.95);
  const kind = f.seg('kind', 'Interval', [['two', 'tweezijdig'], ['upper', 'eenzijdig bovengrens'], ['lower', 'eenzijdig ondergrens']], 'two');
  const N = f.optNum('N', 'lotgrootte N (optioneel, eindige populatie)', '');
  el.append(card('Betrouwbaarheidsinterval voor een fractie: exact, Wilson en normaal', h('p', { class: 'muted' }, 'Cursusvoorbeeld: n = 100, d = 4 -> 95%-BI [1,1% ; 9,9%] (exact).'), row(d.el, n.el, conf.el, N.el), row(kind.el)), out);
  run = live(out, () => {
    const nn = posInt(n.get(), 'n');
    const dd = posInt(d.get(), 'd', 0);
    need(dd <= nn, 'd kan niet groter zijn dan n.');
    const c = prob(conf.get(), 'betrouwbaarheid');
    const a = 1 - c;
    const k = kind.get();
    const cp = H.clopperPearson(dd, nn, a, k);
    const wi = H.wilson(dd, nn, a, k);
    const wa = H.wald(dd, nn, a, k);
    const NN = N.get();
    let hy: [number, number] | null = null;
    if (NN !== undefined) {
      posInt(NN, 'N');
      need(NN >= nn, 'N moet minstens n zijn.');
      hy = H.hyperCI(dd, nn, NN, k === 'two' ? a : 2 * a);
      if (k === 'upper') hy = [0, hy[1]];
      if (k === 'lower') hy = [hy[0], 1];
    }
    const f2 = (ci: [number, number]) => `[${pctNl(Math.max(ci[0], k === 'upper' ? 0 : -1))} ; ${pctNl(ci[1])}]`;
    const aa = k === 'two' ? a / 2 : a;
    const rows: (string | HTMLElement)[][] = [
      ['Exact (Clopper-Pearson) - methode van de slides', f2(cp), `=BETA.INV(${xl(aa)};${dd};${nn - dd + 1}) ; =BETA.INV(${xl(1 - aa)};${dd + 1};${nn - dd})`],
      ['Wilson (score)', f2(wi), '-'],
      ['Normaal (Wald)', dd === 0 ? 'onbruikbaar (d = 0)' : f2(wa), `=${xl(dd / nn)}\u00b1NORM.S.INV(${xl(1 - aa)})*SQRT(${xl(dd / nn)}*(1-${xl(dd / nn)})/${nn})`],
    ];
    if (hy) rows.push([`Exact hypergeometrisch (N = ${NN})`, f2(hy), 'HYPGEOM.DIST zoeken'] as any);
    return resultPanel({
      question: `${pctNl(c)}-betrouwbaarheidsinterval voor de fractie \\(\\pi\\) met \\(d = ${dd}\\) defecten in \\(n = ${nn}\\)`,
      formula: [`\\pi_L = \\text{BETA.INV}\\left(\\tfrac{\\alpha}{2};\\,d;\\,n-d+1\\right),\\quad \\pi_U = \\text{BETA.INV}\\left(1-\\tfrac{\\alpha}{2};\\,d+1;\\,n-d\\right)`, `\\text{Wilson: } \\frac{p+\\frac{z^2}{2n}\\pm z\\sqrt{\\frac{p(1-p)}{n}+\\frac{z^2}{4n^2}}}{1+\\frac{z^2}{n}},\\qquad \\text{Wald: } p\\pm z\\sqrt{\\frac{p(1-p)}{n}}`],
      substituted: [`p = ${dd}/${nn} = ${tx(dd / nn)}`],
      result: [['p = d/n', pctNl(dd / nn)], ['Exact (cursus)', f2(cp)], ['Wilson', f2(wi)], ['Wald', dd === 0 ? '-' : f2(wa)], ...(hy ? [[`Hypergeometrisch N=${NN}`, f2(hy)] as [string, string]] : [])],
      extra: table(['Methode', 'Interval', 'Excel'], rows),
      warnings: [
        'De cursus (Ottoy, Confidence Intervals) gebruikt de EXACTE methode. De slidewaarden (bv. [0,3% ; 7,0%] bij d = 2) komen overeen met het exacte hypergeometrische interval voor een lot van N = 10000; binomiaal exact geeft [0,24% ; 7,04%].',
        dd < 5 ? `Slechts ${dd} defect(en): de normale benadering (Wald) is hier NIET aanvaardbaar (vuistregel: minstens ~5 defecten).` : 'Minstens 5 defecten: de normale benadering is aanvaardbaar, maar exact blijft beter.',
      ],
      excel: [`ondergrens: =BETA.INV(${xl(aa)};${dd};${nn - dd + 1})`, `bovengrens: =BETA.INV(${xl(1 - aa)};${dd + 1};${nn - dd})`],
      explain: exPropCi({ dd, n: nn }),
      answer: `Met ${dd} defecten op ${nn} is de puntschatting ${pctNl(dd / nn)}. Het exacte ${k === 'two' ? '' : 'eenzijdige '}${pctNl(c)}-betrouwbaarheidsinterval (Clopper-Pearson, via de beta-verdeling) is ${f2(cp)}. ${dd < 5 ? 'Bij zo weinig defecten is de normale benadering onbruikbaar, daarom de exacte methode.' : ''}`,
    });
  });
  run();
}

// ---------- 7. Two independent samples ----------
function twoTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('h2s', () => run());
  const mode = f.seg('mode', 'Invoer', [['raw', 'Ruwe data (2 kolommen)'], ['sum', 'Samenvatting']], 'raw');
  const g = (G as any).two_sample;
  const grid = new DataGrid({ key: 'h2s', cols: 2, headers: ['A', 'B'], onChange: () => run(), example: () => ({ headers: ['A', 'B'], rows: g.B.map((b: number, i: number) => [g.A[i] ?? '', b]) }) });
  const x1 = f.num('x1', 'x\u0304\u2081', 10);
  const s1 = f.num('s1', 's\u2081', 0.5);
  const n1 = f.num('n1', 'n\u2081', 12);
  const x2 = f.num('x2', 'x\u0304\u2082', 10.4);
  const s2 = f.num('s2', 's\u2082', 0.5);
  const n2 = f.num('n2', 'n\u2082', 15);
  const d0 = f.num('d0', 'verschil onder H\u2080 (d)', 0);
  const alpha = f.num('alpha', '\u03b1', 0.05);
  const side = f.seg('side', 'H\u2090 (\u03bc\u2081 - \u03bc\u2082 ... d)', SIDES, 'two');
  const sumRow = h('div', null, row(x1.el, s1.el, n1.el), row(x2.el, s2.el, n2.el));
  el.append(card('Twee onafhankelijke steekproeven: pooled t (cursus) en Welch t', row(mode.el), grid.el, sumRow, row(d0.el, alpha.el), row(side.el)), out);
  run = live(out, () => {
    const raw = mode.get() === 'raw';
    grid.el.hidden = !raw;
    sumRow.hidden = raw;
    let X1: number, S1: number, N1: number, X2: number, S2: number, N2: number;
    let names = ['1', '2'];
    if (raw) {
      const c = grid.getFilledColumns();
      need(c.length >= 2 && c[0].values.length >= 2 && c[1].values.length >= 2, 'Plak twee kolommen met elk minstens 2 getallen.');
      [X1, S1, N1] = [mean(c[0].values), sdS(c[0].values), c[0].values.length];
      [X2, S2, N2] = [mean(c[1].values), sdS(c[1].values), c[1].values.length];
      names = [c[0].name, c[1].name];
    } else {
      [X1, S1, N1] = [x1.get(), pos(s1.get(), 's\u2081'), posInt(n1.get(), 'n\u2081', 2)];
      [X2, S2, N2] = [x2.get(), pos(s2.get(), 's\u2082'), posInt(n2.get(), 'n\u2082', 2)];
    }
    const a = prob(alpha.get(), '\u03b1');
    const sd = side.get();
    const dd = d0.get();
    const P = H.pooledT(X1, S1, N1, X2, S2, N2, dd, a, sd);
    const W = H.welchT(X1, S1, N1, X2, S2, N2, dd, a, sd);
    const Ft = H.fTest(S1 * S1, N1, S2 * S2, N2, 0.05, 'two');
    const tt = sd === 'two' ? 2 : 1;
    return resultPanel({
      question: [`\\(H_0: \\mu_1 - \\mu_2 = ${tx(dd)}\\) versus \\(H_a: \\mu_1 - \\mu_2 ${relTex(sd)} ${tx(dd)}\\), \\(\\alpha=${tx(a)}\\)  (1 = ${names[0]}, 2 = ${names[1]})`],
      formula: [`t=\\frac{\\bar{x}_1-\\bar{x}_2-d}{s_p\\sqrt{\\frac{1}{n_1}+\\frac{1}{n_2}}},\\quad s_p^2=\\frac{(n_1-1)s_1^2+(n_2-1)s_2^2}{n_1+n_2-2},\\quad df=n_1+n_2-2`, `\\text{Welch: } t=\\frac{\\bar{x}_1-\\bar{x}_2-d}{\\sqrt{s_1^2/n_1+s_2^2/n_2}},\\ \\nu=\\frac{(s_1^2/n_1+s_2^2/n_2)^2}{\\frac{(s_1^2/n_1)^2}{n_1-1}+\\frac{(s_2^2/n_2)^2}{n_2-1}}`],
      substituted: [`s_p^2 = \\frac{${N1 - 1}\\cdot ${tx(S1)}^2 + ${N2 - 1}\\cdot ${tx(S2)}^2}{${N1 + N2 - 2}} = ${tx(P.sp2)},\\quad t = \\frac{${tx(X1)}-${tx(X2)}-${tx(dd)}}{${tx(P.sp)}\\sqrt{1/${N1}+1/${N2}}} = ${tx(P.t)}`],
      result: [
        ['x\u0304\u2081 ; s\u2081 ; n\u2081', `${fmt(X1)} ; ${fmt(S1)} ; ${N1}`],
        ['x\u0304\u2082 ; s\u2082 ; n\u2082', `${fmt(X2)} ; ${fmt(S2)} ; ${N2}`],
        ['Pooled t ; df', `${fmt(P.t)} ; ${P.df}`],
        ['Pooled p-waarde', pTxt(P.p)],
        [`Pooled ${pctNl(1 - a)}-BI \u03bc\u2081-\u03bc\u2082`, ciTxt(P.ci)],
        ['Welch t ; \u03bd', `${fmt(W.t)} ; ${fmt(W.df)}`],
        ['Welch p-waarde', pTxt(W.p)],
        [`Welch ${pctNl(1 - a)}-BI`, ciTxt(W.ci)],
        ['Voortoets F = s\u2081\u00b2/s\u2082\u00b2 (tweezijdig, 5%)', `${fmt(Ft.stat)} ; p = ${fmt(Ft.p)}`],
      ],
      decision: { text: `Pooled (cursusrecept): ${P.reject ? 'verwerp H\u2080' : 'H\u2080 niet verwerpen'}  |  Welch: ${W.reject ? 'verwerp H\u2080' : 'H\u2080 niet verwerpen'}`, kind: P.reject ? 'reject' : 'accept' },
      warnings: [
        Ft.p < 0.05 ? `F-voortoets: varianties verschillen significant (p = ${fmt(Ft.p)}); de pooled t-toets veronderstelt gelijke varianties, gebruik bij voorkeur Welch.` : `F-voortoets: geen significant verschil in varianties (p = ${fmt(Ft.p)}); pooled t is verdedigbaar.`,
        'Let op (cursus): de F-toets is niet robuust tegen niet-normaliteit, dus als voortoets met voorzichtigheid gebruiken.',
      ],
      excel: [`pooled p: =T.TEST(bereik1;bereik2;${tt};2)`, `Welch p: =T.TEST(bereik1;bereik2;${tt};3)`, `t pooled kritiek: =T.INV(${xl(sd === 'two' ? 1 - a / 2 : 1 - a)};${P.df})`],
      explain: exTwo({ pooled: P, welch: W, fp: Ft.p, a, side: sd }),
      answer: `Met de pooled t-toets (gelijke varianties verondersteld, df = ${P.df}) is t = ${nl(P.t)} en p = ${nl(P.p)}. ${P.reject ? `Omdat p < alpha = ${pctNl(a)} verwerpen we H0: de gemiddelden verschillen significant.` : `Omdat p >= alpha = ${pctNl(a)} verwerpen we H0 niet: geen significant verschil tussen de gemiddelden.`} De Welch-toets (zonder aanname van gelijke varianties) geeft p = ${nl(W.p)}${W.reject === P.reject ? ', dezelfde conclusie' : ', een andere conclusie: vermeld dit'}.`,
    });
  });
  run();
}

// ---------- 8. Paired ----------
function pairedTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('hpair', () => run());
  const g = (G as any).two_sample;
  const grid = new DataGrid({ key: 'hpair', cols: 2, headers: ['voor', 'na'], onChange: () => run(), example: () => ({ headers: ['x1', 'x2'], rows: g.paired_x1.map((v: number, i: number) => [v, g.paired_x2[i]]) }) });
  const d0 = f.num('d0', 'verschil onder H\u2080 (d)', 0);
  const alpha = f.num('alpha', '\u03b1', 0.05);
  const side = f.seg('side', 'H\u2090 (\u03bc\u1d65 = \u03bc\u2081 - \u03bc\u2082 ... d)', SIDES, 'two');
  el.append(card('Gepaarde t-toets (verschillen v = x\u2081 - x\u2082)', h('p', { class: 'muted' }, 'Twee kolommen, elke rij = \u00e9\u00e9n paar (zelfde stuk, zelfde persoon...). Geen voorwaarde \u03c3\u2081 = \u03c3\u2082.'), grid.el, row(d0.el, alpha.el), row(side.el)), out);
  run = live(out, () => {
    const m = grid.getMatrix().filter((r) => r[0] !== null && r[1] !== null) as number[][];
    need(m.length >= 2, 'Minstens 2 volledige paren nodig (beide kolommen ingevuld).');
    const a = prob(alpha.get(), '\u03b1');
    const sd = side.get();
    const dd = d0.get();
    const r = H.pairedT(m.map((x) => x[0]), m.map((x) => x[1]), dd, a, sd);
    const tt = sd === 'two' ? 2 : 1;
    return resultPanel({
      question: [`\\(H_0: \\mu_v = ${tx(dd)}\\) versus \\(H_a: \\mu_v ${relTex(sd)} ${tx(dd)}\\) met \\(v_i = x_{1i}-x_{2i}\\)`],
      formula: [`t = \\frac{\\bar{v}-d}{s_v/\\sqrt{n}} \\sim t(n-1)`],
      substituted: [`t = \\frac{${tx(r.vbar)}-${tx(dd)}}{${tx(r.sv)}/\\sqrt{${r.n}}} = ${tx(r.stat)}`],
      result: [['v\u0304', fmt(r.vbar)], ['s\u1d65', fmt(r.sv)], ['n ; df', `${r.n} ; ${r.n - 1}`], ['t', fmt(r.stat)], ['p-waarde', pTxt(r.p)], [`${pctNl(1 - a)}-BI voor \u03bc\u1d65`, ciTxt(r.ci)]],
      decision: decide(r.reject, a),
      extra: table(['paar', 'x\u2081', 'x\u2082', 'v = x\u2081 - x\u2082'], m.map((x, i) => [String(i + 1), fmt(x[0]), fmt(x[1]), fmt(r.diffs[i])])),
      excel: [`p: =T.TEST(bereik1;bereik2;${tt};1)`, `of: verschillenkolom v, dan t = AVERAGE(v)/(STDEV.S(v)/SQRT(COUNT(v)))`],
      explain: exPaired({ n: r.n, vbar: r.vbar, sv: r.sv, stat: r.stat, p: r.p, a, side: sd }),
      answer: `Voor de ${r.n} paren is het gemiddelde verschil ${nl(r.vbar)} met s_v = ${nl(r.sv)}, dus t = ${nl(r.stat)} (df = ${r.n - 1}) en p = ${nl(r.p)}. ${r.reject ? `Omdat p < alpha = ${pctNl(a)} verwerpen we H0: er is een significant verschil.` : `Omdat p >= alpha = ${pctNl(a)} verwerpen we H0 niet.`} Een gepaarde toets is hier correct omdat de metingen per paar afhankelijk zijn.`,
    });
  });
  run();
}

// ---------- 9. Sample size and power ----------
function nTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('hn', () => run());
  const what = f.select('what', 'Wat wil je?', [['meanE', 'Gemiddelde: foutenmarge E'], ['meanD', 'Gemiddelde: verschuiving \u03b4 detecteren (\u03b1 en \u03b2)'], ['propE', 'Fractie: foutenmarge E'], ['propD', 'Fractie: \u03c0\u2080 -> \u03c0\u2081 detecteren (\u03b1 en \u03b2)'], ['power', 'Power / \u03b2 bij gegeven n (gemiddelde)']], 'meanE');
  const sigma = f.num('sigma', '\u03c3', 2);
  const E = f.num('E', 'foutenmarge E', 0.5);
  const delta = f.num('delta', 'verschuiving \u03b4', 1);
  const p = f.num('p', 'p (verwacht; worst case 0,5)', 0.5);
  const pi0 = f.num('pi0', '\u03c0\u2080', 0.02);
  const pi1 = f.num('pi1', '\u03c0\u2081', 0.05);
  const alpha = f.num('alpha', '\u03b1', 0.05);
  const beta = f.num('beta', '\u03b2', 0.1);
  const n = f.num('n', 'n', 25);
  const two = f.check('two', 'tweezijdig', false);
  el.append(card('Steekproefgrootte en onderscheidingsvermogen (power)', row(what.el), row(sigma.el, E.el, delta.el, p.el, pi0.el, pi1.el), row(alpha.el, beta.el, n.el, two.el)), out);
  run = live(out, () => {
    const w = what.get();
    const vis: Record<string, Field<any>[]> = { meanE: [sigma, E, alpha], meanD: [sigma, delta, alpha, beta, two], propE: [p, E, alpha], propD: [pi0, pi1, alpha, beta, two], power: [sigma, delta, alpha, n, two] };
    for (const fld of [sigma, E, delta, p, pi0, pi1, alpha, beta, n, two]) fld.el.hidden = !vis[w].includes(fld);
    const a = prob(alpha.get(), '\u03b1');
    if (w === 'meanE') {
      const r = H.nMeanMargin(pos(sigma.get(), '\u03c3'), pos(E.get(), 'E'), a);
      return resultPanel({ explain: exSampleSize, question: `Hoe groot moet n zijn opdat het ${pctNl(1 - a)}-BI voor \\(\\mu\\) een halve breedte \\(E\\) heeft?`, formula: [`n = \\left(\\frac{z_{1-\\alpha/2}\\,\\sigma}{E}\\right)^2`], substituted: [`n = \\left(\\frac{${tx(r.z)}\\cdot ${tx(sigma.get())}}{${tx(E.get())}}\\right)^2 = ${tx(r.nExact)}`], result: [['n (exact)', fmt(r.nExact)], ['n (naar boven afgerond)', String(r.n)]], excel: [`=ROUNDUP((NORM.S.INV(${xl(1 - a / 2)})*${xl(sigma.get())}/${xl(E.get())})^2;0)`], answer: `Er zijn minstens n = ${r.n} waarnemingen nodig (${nl(r.nExact)} naar boven afgerond). De breedte halveren vraagt 4 keer zoveel waarnemingen.` });
    }
    if (w === 'meanD') {
      const b = prob(beta.get(), '\u03b2');
      const r = H.nMeanShift(pos(sigma.get(), '\u03c3'), pos(delta.get(), '\u03b4'), a, b, two.get());
      const za = two.get() ? 'z_{1-\\alpha/2}' : 'z_{1-\\alpha}';
      return resultPanel({ explain: exSampleSize, question: `Steekproefgrootte om een verschuiving \\(\\delta=${tx(delta.get())}\\) te detecteren met \\(\\alpha=${tx(a)}\\) en \\(\\beta=${tx(b)}\\) (power ${pctNl(1 - b)})`, formula: [`n=\\left(\\frac{(${za}+z_{1-\\beta})\\,\\sigma}{\\delta}\\right)^2`], substituted: [`n=\\left(\\frac{(${tx(r.za)}+${tx(r.zb)})\\cdot ${tx(sigma.get())}}{${tx(delta.get())}}\\right)^2=${tx(r.nExact)}`], result: [['n (exact)', fmt(r.nExact)], ['n (afgerond)', String(r.n)]], excel: [`=ROUNDUP(((NORM.S.INV(${xl(two.get() ? 1 - a / 2 : 1 - a)})+NORM.S.INV(${xl(1 - b)}))*${xl(sigma.get())}/${xl(delta.get())})^2;0)`], answer: `Om een verschuiving van ${nl(delta.get())} te detecteren met alpha = ${pctNl(a)} en beta = ${pctNl(b)} zijn n = ${r.n} waarnemingen nodig. Beta verkleinen bij vaste alpha kan enkel met een grotere steekproef.` });
    }
    if (w === 'propE') {
      const r = H.nPropMargin(prob(p.get(), 'p', false), pos(E.get(), 'E'), a);
      return resultPanel({ explain: exSampleSize, question: `Steekproefgrootte voor een fractie met foutenmarge \\(E=${tx(E.get())}\\)`, formula: [`n=\\frac{z_{1-\\alpha/2}^2\\,p(1-p)}{E^2}`], substituted: [`n=\\frac{${tx(r.z)}^2\\cdot ${tx(p.get())}(1-${tx(p.get())})}{${tx(E.get())}^2}=${tx(r.nExact)}`], result: [['n (exact)', fmt(r.nExact)], ['n (afgerond)', String(r.n)]], warnings: ['Worst case p = 0,5 geeft de grootste n. Bij kleine fracties is de normale benadering zwak: controleer achteraf met het exacte interval.'], excel: [`=ROUNDUP(NORM.S.INV(${xl(1 - a / 2)})^2*${xl(p.get())}*(1-${xl(p.get())})/${xl(E.get())}^2;0)`], answer: `Er zijn n = ${r.n} waarnemingen nodig voor een foutenmarge van ${nl(E.get())} bij ${pctNl(1 - a)} betrouwbaarheid.` });
    }
    if (w === 'propD') {
      const b = prob(beta.get(), '\u03b2');
      const p0 = prob(pi0.get(), '\u03c0\u2080');
      const p1 = prob(pi1.get(), '\u03c0\u2081');
      need(p0 !== p1, '\u03c0\u2080 en \u03c0\u2081 moeten verschillen.');
      const r = H.nPropShift(p0, p1, a, b, two.get());
      return resultPanel({ explain: exSampleSize, question: `Steekproefgrootte om \\(\\pi_1=${tx(p1)}\\) te onderscheiden van \\(\\pi_0=${tx(p0)}\\)`, formula: [`n=\\left(\\frac{z_{1-\\alpha}\\sqrt{\\pi_0(1-\\pi_0)}+z_{1-\\beta}\\sqrt{\\pi_1(1-\\pi_1)}}{\\pi_1-\\pi_0}\\right)^2`], substituted: [`n=${tx(r.nExact)}`], result: [['n (exact)', fmt(r.nExact)], ['n (afgerond)', String(r.n)]], excel: [`=ROUNDUP(((NORM.S.INV(${xl(two.get() ? 1 - a / 2 : 1 - a)})*SQRT(${xl(p0)}*(1-${xl(p0)}))+NORM.S.INV(${xl(1 - b)})*SQRT(${xl(p1)}*(1-${xl(p1)})))/(${xl(p1)}-${xl(p0)}))^2;0)`], answer: `Er zijn ongeveer n = ${r.n} stuks nodig (normale benadering).` });
    }
    const nn = posInt(n.get(), 'n');
    const r = H.betaMean(pos(sigma.get(), '\u03c3'), pos(delta.get(), '\u03b4'), nn, a, two.get());
    return resultPanel({ explain: exSampleSize, question: `Power en \\(\\beta\\) van een Z-toets bij \\(n=${nn}\\) voor een verschuiving \\(\\delta=${tx(delta.get())}\\)`, formula: [two.get() ? `\\beta=\\Phi\\left(z_{1-\\alpha/2}-\\frac{\\delta\\sqrt{n}}{\\sigma}\\right)-\\Phi\\left(-z_{1-\\alpha/2}-\\frac{\\delta\\sqrt{n}}{\\sigma}\\right)` : `\\beta=\\Phi\\left(z_{1-\\alpha}-\\frac{\\delta\\sqrt{n}}{\\sigma}\\right)`], substituted: [`\\beta=${tx(r.beta)}`], result: [['\u03b2', `${fmt(r.beta)} (${pct(r.beta)})`], ['power 1-\u03b2', `${fmt(r.power)} (${pct(r.power)})`]], excel: [`=NORM.S.DIST(NORM.S.INV(${xl(two.get() ? 1 - a / 2 : 1 - a)})-${xl(delta.get())}*SQRT(${nn})/${xl(sigma.get())};WAAR)`], answer: `Bij n = ${nn} is de kans op een fout van de tweede soort beta = ${pctNl(r.beta)}, de power is ${pctNl(r.power)}.` });
  });
  run();
}

// ---------- 10. Duality ----------
function dualTab(el: HTMLElement) {
  el.append(
    card(
      'Dualiteit: betrouwbaarheidsinterval <-> hypothesetoets',
      h('p', null, 'Een (1-\u03b1)-betrouwbaarheidsinterval en een toets op significantieniveau \u03b1 bevatten dezelfde informatie: H\u2080: \u03b8 = \u03b8\u2080 wordt verworpen precies wanneer \u03b8\u2080 buiten het interval valt.'),
      table(
        ['Toets (niveau \u03b1)', 'Bijhorend interval', 'Verwerp H\u2080 als...'],
        [
          ['tweezijdig H\u2090: \u03b8 \u2260 \u03b8\u2080', 'tweezijdig (1-\u03b1)-BI', '\u03b8\u2080 buiten [L ; U]'],
          ['rechtszijdig H\u2090: \u03b8 > \u03b8\u2080', 'eenzijdige ondergrens: \u03b8 \u2265 L', '\u03b8\u2080 < L'],
          ['linkszijdig H\u2090: \u03b8 < \u03b8\u2080', 'eenzijdige bovengrens: \u03b8 \u2264 U', '\u03b8\u2080 > U'],
        ],
      ),
      note('Examenvraag 1e: "Om te toetsen op 1% dient een 99%-BI berekend te worden" is correct in de standaardlezing (tweezijdige toets <-> tweezijdig 99%-BI). Nuance: een eenzijdige toets op 1% hoort bij een eenzijdige 99%-grens (equivalent: de grens van een tweezijdig 98%-BI); je kan ook rechtstreeks met de p-waarde werken.', 'info'),
      note('Significant is niet hetzelfde als relevant: een klein (economisch onbelangrijk) effect kan significant zijn bij grote n. Beslis op basis van de grootte van het effect (BI) en kosten-baten.', 'warn'),
    ),
  );
}

export const hypothese: ModuleDef = {
  id: 'hypothese',
  title: 'Toetsen & BI',
  group: 'Fase 1',
  keywords: ['hypothese', 'toets', 'test', 'betrouwbaarheidsinterval', 'confidence interval', 'p-waarde', 'alpha', 'significant', 'verwerpen'],
  subs: [
    ['z', 'Z-toets gemiddelde (\u03c3 gekend)', 'z toets sigma bekend'],
    ['t', 't-toets gemiddelde', 't toets student gemiddelde'],
    ['chi2', '\u03c7\u00b2-toets variantie / standaardafwijking', 'chi kwadraat variantie spreiding sigma'],
    ['f', 'F-toets + BI verhouding varianties', 'verhouding varianties F nauwkeuriger machine vraag 2 F.INV'],
    ['prop', 'Z-toets proportie + exacte binomiale toets', 'fractie proportie defecten binomiaal'],
    ['propci', 'BI voor een fractie (exact / Wilson / Wald)', 'clopper pearson exact interval fractie defecten'],
    ['twee', 'Twee onafhankelijke steekproeven (pooled / Welch)', 'twee steekproeven verschil gemiddelden pooled welch'],
    ['paired', 'Gepaarde t-toets', 'gepaard paired verschillen'],
    ['n', 'Steekproefgrootte en power', 'steekproefgrootte sample size power beta onderscheidingsvermogen'],
    ['dual', 'Dualiteit BI en toets', 'dualiteit eenzijdig tweezijdig'],
  ],
  mount(el) {
    moduleHead(el, 'Hypothesetoetsen & betrouwbaarheidsintervallen (confidence intervals)', 'Invoer als samenvatting of als ruwe data (plakken uit Excel). Elke toets: links-, rechts- of tweezijdig, met p-waarde, kritieke waarde, BI en examenantwoord.');
    const t = tabs('hypothese', [
      { id: 'z', label: 'Z-toets \u03bc', build: zTab },
      { id: 't', label: 't-toets \u03bc', build: tTab },
      { id: 'chi2', label: '\u03c7\u00b2 \u03c3', build: chiTab },
      { id: 'f', label: 'F / BI \u03c3\u2081\u00b2/\u03c3\u2082\u00b2', build: fTab },
      { id: 'prop', label: 'Z-toets \u03c0', build: propTab },
      { id: 'propci', label: 'BI fractie', build: propCiTab },
      { id: 'twee', label: '2 steekproeven', build: twoTab },
      { id: 'paired', label: 'Gepaard', build: pairedTab },
      { id: 'n', label: 'Steekproefgrootte', build: nTab },
      { id: 'dual', label: 'Dualiteit', build: dualTab },
    ], el);
    return { route: (sub, params) => sub && t.show(sub, params) };
  },
};
