// M10 Aanvaardingssteekproeven (acceptance sampling) en steekproefmethoden.
import { h, fmt, tx, xl, nl, pctNl, pct, parseNum } from '../ui/core.ts';
import { Form, row, card, note } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { lineChart, densityPlot, chartBox } from '../components/charts.ts';
import { binomPmf, binomCdf, binomSf, betaInv, nctCdf, normInv } from '../stats/dist.ts';
import { pAccept, singlePlan, ocCurve, designPlan, doublePlan, variablesK, lotDefects, stratification, type OcModel } from '../calc/sampling.ts';
import { live, need, moduleHead, posInt, prob, pos } from './util.ts';
import { theoryPage, type ModuleDef } from './types.ts';
import { stkTheorie } from '../generated/content.ts';
import { exSingle, exDesign, exDouble, exVariables, exLot, exStrat } from './explain_sampling.ts';
import G from '../../testdata/golden_values.json';

const exBtn = (label: string, fn: () => void) => h('button', { type: 'button', class: 'btn btn-sm', onclick: fn }, label);
const MODELS: [OcModel, string][] = [
  ['binom', 'Binomiaal (groot lot)'],
  ['hyper', 'Hypergeometrisch (lot N)'],
  ['pois', 'Poisson (benadering)'],
];

/** pi where P_acc drops below 0,5%: used as x-axis maximum of the OC curve. */
function piMaxFor(f: (pi: number) => number, LQL: number) {
  let p = Math.max(LQL * 1.5, 0.005);
  while (p < 1 && f(p) > 0.005) p *= 1.25;
  return Math.min(1, p);
}
function xlAcc(model: OcModel, c: number, n: number, pi: number, N?: number) {
  if (model === 'pois') return `=POISSON.DIST(${c};${xl(n * pi)};WAAR)`;
  if (model === 'hyper') return `=HYPGEOM.DIST(${c};${n};${Math.round(pi * (N ?? 0))};${N};WAAR)`;
  return `=BINOM.DIST(${c};${n};${xl(pi)};WAAR)`;
}
function accTex(model: OcModel) {
  if (model === 'pois') return 'P_{acc}(\\pi)=\\sum_{d=0}^{c} e^{-n\\pi}\\frac{(n\\pi)^d}{d!}';
  if (model === 'hyper') return 'P_{acc}(\\pi)=\\sum_{d=0}^{c} \\frac{\\binom{D}{d}\\binom{N-D}{n-d}}{\\binom{N}{n}},\\quad D=\\pi N';
  return 'P_{acc}(\\pi)=P(d\\le c)=\\sum_{d=0}^{c}\\binom{n}{d}\\pi^d(1-\\pi)^{n-d}';
}

// ---------- 1. Single plan ----------
function singleTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('ss1', () => run());
  const n = f.num('n', 'n (steekproefgrootte)', 100, { hint: 'aantal stuks dat je keurt' });
  const c = f.num('c', 'c (aanvaardingsgetal)', 4, { hint: 'aanvaard als defecten d ≤ c' });
  const aql = f.num('aql', 'AQL (fractie, bv. 0,02)', 0.02, { hint: 'goede kwaliteit: wil je aanvaarden' });
  const lql = f.num('lql', 'LQL / LTPD (fractie)', 0.08, { hint: 'slechte kwaliteit: wil je afkeuren' });
  const model = f.seg('model', 'Model', MODELS, 'binom');
  const N = f.num('N', 'Lotgrootte N', 10000, { hint: 'aantal stuks in het hele lot' });
  const dObs = f.optNum('d', 'Waargenomen defecten d (optioneel)', '');
  el.append(
    card(
      'Enkelvoudig steekproefplan (single sampling plan) (n, c)',
      h('p', { class: 'muted' }, 'Neem n stuks uit het lot; aanvaard als het aantal defecten d ≤ c. Cursus: (100, 4) met AQL 2% en LQL 8%; (130, 5) geeft α en β beide ongeveer 4,7%.'),
      row(exBtn('Voorbeeld (100, 4)', () => f.setValues({ n: 100, c: 4, aql: 0.02, lql: 0.08, model: 'binom' })), exBtn('Voorbeeld (130, 5)', () => f.setValues({ n: 130, c: 5, aql: 0.02, lql: 0.08, model: 'binom' })), exBtn('Hypergeometrisch N = 10 000', () => f.setValues({ n: 100, c: 4, aql: 0.02, lql: 0.08, model: 'hyper', N: 10000 }))),
      row(n.el, c.el, aql.el, lql.el),
      row(model.el, N.el, dObs.el),
    ),
    out,
  );
  const ci = ciEquivalence(el, () => ({ n: n.get(), c: c.get() }), (v) => f.setValues(v));
  const mainRun = live(out, () => {
    const m = model.get();
    N.el.hidden = m !== 'hyper';
    const nn = posInt(n.get(), 'n');
    const cc = posInt(c.get(), 'c', 0);
    need(cc < nn, 'c moet kleiner zijn dan n.');
    const A = prob(aql.get(), 'AQL');
    const L = prob(lql.get(), 'LQL');
    need(L > A, 'LQL moet groter zijn dan AQL.');
    let NN: number | undefined;
    if (m === 'hyper') {
      NN = posInt(N.get(), 'N');
      need(NN >= nn, 'De lotgrootte N moet minstens n zijn.');
    }
    const r = singlePlan(nn, cc, A, L, m, NN);
    const fa = (pi: number) => pAccept(nn, cc, pi, m, NN);
    const pmax = piMaxFor(fa, L);
    const curve = ocCurve(fa, pmax, 120).map(([p, y]) => [100 * p, y] as [number, number]);
    const steps = 12;
    const tpts = Array.from({ length: steps + 1 }, (_, i) => +(pmax * i / steps).toPrecision(3));
    const tset = [...new Set([...tpts, A, L])].sort((a, b) => a - b);
    const tbl = table(
      ['π (fractie defect)', 'π (%)', 'P_acc', 'P_rej'],
      tset.map((p) => {
        const pa = fa(p);
        const mark = p === A ? ' (AQL)' : p === L ? ' (LQL)' : '';
        return [fmt(p) + mark, pct(p), fmt(pa), fmt(1 - pa)];
      }),
    );
    const res: [string, string][] = [
      ['P_acc(AQL)', `${fmt(r.PaAQL)} (${pct(r.PaAQL)})`],
      ['α = producentenrisico = 1 - P_acc(AQL)', `${fmt(r.alpha)} (${pct(r.alpha)})`],
      ['β = consumentenrisico = P_acc(LQL)', `${fmt(r.beta)} (${pct(r.beta)})`],
    ];
    let pvTxt = '';
    let dRes = '';
    const d = dObs.get();
    if (d !== undefined) {
      need(Number.isInteger(d) && d >= 0 && d <= nn, 'd moet een geheel getal tussen 0 en n zijn.');
      const pv = d === 0 ? 1 : 1 - fa_(nn, d - 1, A, m, NN);
      res.push([`p-waarde P(D ≥ ${d} | π = AQL)`, fmt(pv)]);
      dRes = d <= cc ? `Met d = ${d} ≤ c = ${cc} wordt het lot aanvaard.` : `Met d = ${d} > c = ${cc} wordt het lot afgekeurd.`;
      pvTxt = ` Met ${d} defecten in de steekproef is P(D >= ${d} | AQL) = ${nl(pv)}: ${pv < 0.05 ? 'dit is onwaarschijnlijk als het lot op AQL-kwaliteit is' : 'dit is verenigbaar met een lot op AQL-kwaliteit'}. ${dRes}`;
    }
    const modelTxt = m === 'binom' ? 'binomiaal model' : m === 'hyper' ? `hypergeometrisch model (N = ${NN})` : 'Poisson-benadering';
    return resultPanel({
      question: [`Plan \\((n, c) = (${nn}, ${cc})\\): aanvaardingskans bij AQL \\(= ${tx(A)}\\) en LQL \\(= ${tx(L)}\\) (${modelTxt})`],
      formula: [accTex(m), '\\alpha = 1-P_{acc}(AQL),\\qquad \\beta = P_{acc}(LQL)'],
      substituted: [
        m === 'binom' ? `P_{acc}(${tx(A)})=\\sum_{d=0}^{${cc}}\\binom{${nn}}{d}${tx(A)}^d(1-${tx(A)})^{${nn}-d}=${tx(r.PaAQL)}` : `P_{acc}(${tx(A)})=${tx(r.PaAQL)}`,
        `\\alpha=1-${tx(r.PaAQL)}=${tx(r.alpha)},\\qquad \\beta=P_{acc}(${tx(L)})=${tx(r.beta)}`,
      ],
      result: res,
      decision: dRes ? { text: dRes, kind: d! <= cc ? 'accept' : 'reject' } : undefined,
      warnings: m === 'pois' && L > 0.1 ? ['Poisson is een benadering, goed voor kleine π en grote n.'] : [],
      excel: [`P_acc(AQL): ${xlAcc(m, cc, nn, A, NN)}`, `α: =1-${xlAcc(m, cc, nn, A, NN).slice(1)}`, `β: ${xlAcc(m, cc, nn, L, NN)}`, 'algemeen: =BINOM.DIST(c;n;pi;WAAR)'].concat(d !== undefined && d > 0 ? [`p-waarde: =1-${xlAcc(m, d - 1, nn, A, NN).slice(1)}`] : []),
      explain: exSingle({ n: nn, c: cc, A, L, Pa: r.PaAQL, alpha: r.alpha, beta: r.beta, model: m, N: NN }),
      answer: `Bij het plan (n = ${nn}, c = ${cc}) is de aanvaardingskans bij AQL = ${pctNl(A)} gelijk aan ${nl(r.PaAQL)}, dus het producentenrisico is alfa = ${pctNl(r.alpha)}. Bij LQL = ${pctNl(L)} wordt een lot nog met kans beta = ${pctNl(r.beta)} aanvaard (consumentenrisico). ${r.alpha <= 0.05 && r.beta <= 0.1 ? 'Beide risico\'s zijn klein, het plan onderscheidt goede en slechte loten goed.' : 'Minstens een van beide risico\'s is groot; een groter n (met aangepaste c) maakt de OC-curve steiler.'}${pvTxt}`,
      extra: [
        chartBox(lineChart({ series: [{ pts: curve }], vlines: [{ x: 100 * A, label: 'AQL', cls: 'mean' }, { x: 100 * L, label: 'LQL', cls: 'spec' }], hlines: [{ y: r.PaAQL, label: '1-α ' + fmt(r.PaAQL, 3), cls: 'cl' }, { y: r.beta, label: 'β ' + fmt(r.beta, 3), cls: 'ucl' }], xlabel: 'π (% defect in lot)', ylabel: 'P_acc', x0: 0, x1: 100 * pmax, y0: 0, y1: 1.02 })),
        card('OC-tabel (P_acc versus π)', tbl),
      ],
    });
  });
  run = () => {
    mainRun();
    ci.run();
  };
  run();
  return { prefill: (v: any) => f.setValues(v) };
}
const fa_ = (n: number, c: number, pi: number, m: OcModel, N?: number) => pAccept(n, c, pi, m, N);

// ---------- 1b. Acceptance probability at a chosen pi, CI versus classical test ----------
/** pi where the OC curve of (n, c) has P_acc = g (= lower bound of the one-sided g-CI at d = c + 1). */
const piAt = (n: number, c: number, g: number) => betaInv(1 - g, c + 1, n - c);
/** Clopper-Pearson one-sided lower bound (confidence g) for d defects in n. */
const lowerCP = (d: number, n: number, g: number) => (d === 0 ? 0 : betaInv(1 - g, d, n - d + 1));
const pctTex = (x: number) => tx(100 * x) + '\\%';
const SER_CLS = ['', 'alt', 'alt2', 'fit'];

function ciEquivalence(el: HTMLElement, plan: () => { n: number; c: number }, setPlan: (v: Record<string, any>) => void) {
  const out = h('div');
  let run = () => {};
  const f = new Form('ss1ci', () => run());
  const pi0 = f.num('pi0', 'π van het lot (fractie, bv. 0,0245)', 0.0245, { hint: 'welke aanvaardingskans hoort bij deze π?' });
  const gIn = f.num('g', 'Aanvaardingskans P_acc (bv. 0,90)', 0.9, { hint: 'bij welke π hoort deze kans?' });
  el.append(
    card(
      'π invullen: aanvaardingskans, en de link met een betrouwbaarheidsinterval',
      h('p', { class: 'muted' }, 'Gebruikt n en c van het plan hierboven (binomiaal model, groot lot). Vul een π in om de aanvaardingskans te zien, of een aanvaardingskans om de bijhorende π te vinden. Daaronder: waarom keuren met (n, c) precies hetzelfde is als toetsen met een eenzijdig betrouwbaarheidsinterval (BI).'),
      row(
        exBtn('Cursusvoorbeeld (100, 4), π = 2,45%', () => {
          setPlan({ n: 100, c: 4, model: 'binom' });
          f.setValues({ pi0: 0.0245, g: 0.9 });
        }),
        exBtn('π = 1,30% (P_acc 99%)', () => f.setValues({ pi0: 0.013, g: 0.99 })),
        exBtn('π = 7,85% (P_acc 10%)', () => f.setValues({ pi0: 0.0785, g: 0.1 })),
      ),
      row(pi0.el, gIn.el),
    ),
    out,
  );
  run = live(out, () => {
    const p = plan();
    const nn = posInt(p.n, 'n');
    const cc = posInt(p.c, 'c', 0);
    need(cc < nn, 'c moet kleiner zijn dan n.');
    const P0 = prob(pi0.get(), 'π');
    const G = prob(gIn.get(), 'P_acc');
    need(P0 > 0 && P0 < 1 && G > 0 && G < 1, 'π en P_acc moeten strikt tussen 0 en 1 liggen.');
    const fa = (pi: number) => binomCdf(cc, nn, pi);
    const pa = fa(P0);
    const alpha = 1 - pa;
    const piG = piAt(nn, cc, G);
    // Table: one-sided pa-CI per number of defects d.
    const dMax = Math.min(nn, cc + 3);
    const rows: string[][] = [];
    for (let d = 0; d <= dMax; d++) {
      const pv = d === 0 ? 1 : binomSf(d - 1, nn, P0);
      const L = lowerCP(d, nn, pa);
      const rejCI = pv <= alpha * (1 + 1e-9);
      const edge = d === cc + 1;
      rows.push([
        String(d),
        pct(d / nn),
        fmt(pv),
        `[${pct(L)} ; 100%]`,
        rejCI ? (edge ? 'nee, π valt op de grens (p = α)' : 'nee') : 'ja',
        rejCI ? 'afkeuren' : 'aanvaarden',
        d <= cc ? `aanvaarden (d ≤ ${cc})` : `afkeuren (d > ${cc})`,
      ]);
    }
    const tbl = table(['d (defecten)', 'P = d/n', `p = P(D ≥ d | π = ${pct(P0)})`, `eenzijdig ${pct(pa)}-BI voor π`, `π = ${pct(P0)} in BI?`, 'besluit via BI', 'besluit plan (n, c)'], rows);
    // OC points for a set of acceptance probabilities.
    const gs = [...new Set([0.99, 0.95, 0.9, 0.5, 0.1, 0.05, G])].sort((a, b) => b - a);
    const tbl2 = table(
      ['P_acc (= BI-niveau)', 'π', 'Excel', 'betekenis'],
      gs.map((gg) => {
        const pp = piAt(nn, cc, gg);
        return [pct(gg), `${fmt(pp)} (${pct(pp)})`, `=BETA.INV(${xl(1 - gg)};${cc + 1};${nn - cc})`, `een lot met ${pct(pp)} defecten wordt in ${pct(gg)} van de gevallen aanvaard`];
      }),
    );
    // Chart 1: OC curve with the chosen point and the 99/90/10% points.
    const gLines = [...new Set([0.99, 0.9, 0.1])];
    const pmax = Math.max(piAt(nn, cc, 0.003), P0 * 1.15, piG * 1.15);
    const curve = ocCurve(fa, pmax, 160).map(([x, y]) => [100 * x, y] as [number, number]);
    const ocPts = gLines.map((gg) => [100 * piAt(nn, cc, gg), gg] as [number, number]);
    const oc = lineChart({
      series: [{ pts: curve }, { pts: ocPts, dots: true }, { pts: [[100 * P0, pa]], dots: true, marker: 'ring', cls: 'fit' }],
      vlines: [{ x: 100 * P0, label: 'π ' + pct(P0), cls: 'spec' }],
      hlines: [{ y: pa, label: 'P_acc ' + fmt(pa, 3), cls: 'ucl' }],
      xlabel: 'π (% defect in lot)  -  OC-curve',
      ylabel: 'P_acc',
      x0: 0,
      x1: 100 * pmax,
      y0: 0,
      y1: 1.02,
    });
    // Chart 2: lower CI bounds versus d for several confidence levels; at d = c+1 they hit the OC points.
    const levels = [...new Set([0.99, 0.9, 0.1, pa])];
    const dTop = Math.min(nn, Math.max(2 * cc + 4, cc + 4));
    const ser = levels.map((gg, i) => ({ pts: Array.from({ length: dTop + 1 }, (_, d) => [d, 100 * lowerCP(d, nn, gg)] as [number, number]), dots: true, cls: 'connect ' + SER_CLS[Math.min(i, 3)] }));
    const ciChart = lineChart({
      series: ser,
      vlines: [{ x: cc + 1, label: 'd = c+1 = ' + (cc + 1), cls: 'spec' }],
      hlines: levels.map((gg) => ({ y: 100 * piAt(nn, cc, gg), label: `${pct(gg, 3)}: ${pct(piAt(nn, cc, gg), 3)}`, cls: gg === pa ? 'ucl' : 'zone' })),
      xlabel: `aantal defecten d in de steekproef (P = d/${nn})  -  ondergrens BI per niveau`,
      ylabel: 'π (%)',
      x0: 0,
      x1: dTop,
      y0: 0,
    });
    const legend = `Rechts: de ondergrens L(d) van het eenzijdige BI voor π, per aantal defecten d. Blauw = 99%-BI, groen = 90%-BI, oranje = 10%-BI, rood = ${pct(pa)}-BI (hoort bij jouw π). Lees af op de rode lijn d = c+1 = ${cc + 1}: elke curve snijdt daar op precies de π van het OC-punt met die aanvaardingskans (links).`;
    const Lc = lowerCP(cc, nn, pa);
    const Lc1 = lowerCP(cc + 1, nn, pa);
    return resultPanel({
      question: [`Plan \\((n,c)=(${nn},${cc})\\): aanvaardingskans bij \\(\\pi=${tx(P0)}\\), de \\(\\pi\\) waarbij \\(P_{acc}=${tx(G)}\\), en dezelfde beslissing via een betrouwbaarheidsinterval`],
      formula: [
        'P_{acc}(\\pi)=P(D\\le c\\mid\\pi)=\\sum_{d=0}^{c}\\binom{n}{d}\\pi^d(1-\\pi)^{n-d}',
        '\\pi\\ \\text{bij}\\ P_{acc}=\\gamma:\\quad \\pi=\\text{BETA.INV}(1-\\gamma;\\ c+1;\\ n-c)',
        'H_0:\\ \\pi\\le\\pi_0\\ (\\text{lot OK}),\\quad H_A:\\ \\pi>\\pi_0,\\quad \\alpha=1-P_{acc}(\\pi_0)',
        '\\text{eenzijdig }(1-\\alpha)\\text{-BI: }[L(d);\\ 100\\%],\\quad L(d)=\\text{BETA.INV}(\\alpha;\\ d;\\ n-d+1),\\quad \\text{aanvaard} \\iff \\pi_0\\ \\text{ligt in het BI}',
      ],
      substituted: [
        `P_{acc}(${tx(P0)})=P(D\\le ${cc}\\mid\\pi=${tx(P0)})=${tx(pa)},\\qquad P_{rej}=1-${tx(pa)}=${tx(alpha)}`,
        `\\pi\\ \\text{bij}\\ P_{acc}=${tx(G)}:\\quad \\text{BETA.INV}(${tx(1 - G)};\\ ${cc + 1};\\ ${nn - cc})=${tx(piG)}=${pctTex(piG)}`,
        `\\alpha=1-${tx(pa)}=${tx(alpha)}\\ \\Rightarrow\\ \\text{eenzijdig } ${pctTex(pa)}\\text{-BI}`,
        `d=${cc}:\\ L=\\text{BETA.INV}(${tx(alpha)};\\ ${cc};\\ ${nn - cc + 1})=${pctTex(Lc)}<${pctTex(P0)}\\ \\Rightarrow\\ \\pi_0\\ \\text{in BI: aanvaard}`,
        `d=${cc + 1}:\\ L=\\text{BETA.INV}(${tx(alpha)};\\ ${cc + 1};\\ ${nn - cc})=${pctTex(Lc1)}=\\pi_0\\ \\Rightarrow\\ \\text{grensgeval } p=\\alpha\\text{: afkeur}`,
      ],
      result: [
        [`P_acc(π = ${pct(P0)})`, `${fmt(pa)} (${pct(pa)})`],
        ['P_rej = 1 - P_acc', `${fmt(alpha)} (${pct(alpha)})`],
        [`π waarbij P_acc = ${pct(G)}`, `${fmt(piG)} (${pct(piG)})`],
        ['Gelijkwaardige toets', `H0: π ≤ ${pct(P0)} met α = ${pct(alpha)}, eenzijdig ${pct(pa)}-BI`],
      ],
      excel: [
        `P_acc: =BINOM.DIST(${cc};${nn};${xl(P0)};WAAR)`,
        `π bij P_acc = ${xl(G)}: =BETA.INV(${xl(1 - G)};${cc + 1};${nn - cc})`,
        `ondergrens BI bij d defecten: =BETA.INV(${xl(alpha)};d;${nn}-d+1)`,
        `p-waarde bij d defecten: =1-BINOM.DIST(d-1;${nn};${xl(P0)};WAAR)`,
      ],
      explain: {
        question: 'De OC-curve en een betrouwbaarheidsinterval zijn twee kanten van dezelfde binomiale kansberekening. Het plan (n, c) keurt een lot af als d > c; een BI-toets keurt af als de veronderstelde kwaliteit π0 buiten het BI valt. Beide geven exact dezelfde beslissing.',
        formula: [
          'Waarom BETA.INV? De kans op hoogstens c defecten, als functie van π, is een beta-verdeling: P(D ≤ c | π) = 1 - BETA.DIST(π; c+1; n-c). De π waar P_acc = γ is dus BETA.INV(1-γ; c+1; n-c). Zo lees je een OC-punt af zonder te zoeken.',
          'De ondergrens L(d) van het eenzijdige BI is de kleinste π waarbij d of meer defecten nog niet "te veel" zijn: P(D ≥ d | π = L) = α.',
        ],
        substituted: `Bij d = c+1 = ${cc + 1} geldt P(D ≥ ${cc + 1} | π0) = 1 - P_acc(π0) = α: de ondergrens valt exact op π0 (het grensgeval van de cursus, p = α). Bij d ≤ ${cc} ligt L lager, π0 zit in het BI en het lot wordt aanvaard. Bij d ≥ ${cc + 2} ligt L hoger, π0 valt buiten het BI en het lot wordt afgekeurd: precies de regel d ≤ c.`,
        result: `Lees de OC-curve als een reeks hypothesetoetsen: kies je π0 = ${pct(P0)} als "AQL", dan is het plan (${nn}, ${cc}) een toets van H0: π ≤ ${pct(P0)} met significantie α = ${pct(alpha)}. Een lot met minder defecten wordt minder vaak onterecht afgekeurd, een lot met meer defecten wordt soms onterecht aanvaard (dat is β).`,
      },
      answer: `Bij het plan (n = ${nn}, c = ${cc}) wordt een lot met π = ${pctNl(P0)} defecten aanvaard met kans ${pctNl(pa)} (afgekeurd met kans ${pctNl(alpha)}). Een aanvaardingskans van ${pctNl(G)} hoort bij π = ${pctNl(piG)}. Neem π0 = ${pctNl(P0)} als AQL, dan is het plan gelijkwaardig aan de toets H0: π ≤ ${pctNl(P0)} met α = ${pctNl(alpha)}: het eenzijdige ${pctNl(pa)}-betrouwbaarheidsinterval voor π bevat π0 precies wanneer d ≤ ${cc}, dus precies wanneer het plan het lot aanvaardt.`,
      extra: [
        h('div', { class: 'grid2' }, chartBox(oc), chartBox(ciChart)),
        note(legend, 'info'),
        card(`BI-toets per aantal defecten d (π0 = ${pct(P0)}, α = ${pct(alpha)})`, tbl),
        card('OC-punten: welke π hoort bij welke aanvaardingskans?', tbl2),
      ],
    });
  });
  return { run: () => run() };
}

// ---------- 2. Designer ----------
function designTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('ss2', () => run());
  const aql = f.num('aql', 'AQL (fractie)', 0.02);
  const lql = f.num('lql', 'LQL (fractie)', 0.08);
  const a = f.num('a', 'max. α (producentenrisico)', 0.05, { hint: 'kans goed lot afgekeurd' });
  const b = f.num('b', 'max. β (consumentenrisico)', 0.05, { hint: 'kans slecht lot aanvaard' });
  el.append(card('Plan ontwerpen (plan designer): kleinste n en c', h('p', { class: 'muted' }, 'Zoekt het kleinste n (en bijhorende c) met α ≤ doel bij AQL en β ≤ doel bij LQL (binomiaal). Cursus: AQL 2%, LQL 8%, α = β = 5% geeft (129, 5); het cursusplan (130, 5) ligt er vlak naast (α 4,7%, β 4,7%).'), row(aql.el, lql.el, a.el, b.el)), out);
  run = live(out, () => {
    const A = prob(aql.get(), 'AQL');
    const L = prob(lql.get(), 'LQL');
    need(L > A, 'LQL moet groter zijn dan AQL.');
    const am = prob(a.get(), 'α');
    const bm = prob(b.get(), 'β');
    const r = designPlan(A, L, am, bm);
    need(!!r, 'Geen plan gevonden met n ≤ 5000. Kies AQL en LQL verder uit elkaar of grotere risico\'s.');
    const fa = (pi: number) => pAccept(r!.n, r!.c, pi, 'binom');
    const pmax = piMaxFor(fa, L);
    const curve = ocCurve(fa, pmax, 120).map(([p, y]) => [100 * p, y] as [number, number]);
    return resultPanel({
      question: [`Kleinste plan \\((n, c)\\) met \\(\\alpha \\le ${tx(am)}\\) bij AQL \\(=${tx(A)}\\) en \\(\\beta \\le ${tx(bm)}\\) bij LQL \\(=${tx(L)}\\)`],
      formula: ['1-P(d\\le c\\mid n, AQL)\\le\\alpha,\\qquad P(d\\le c\\mid n, LQL)\\le\\beta'],
      substituted: [`1-P(d\\le ${r!.c}\\mid ${r!.n}, ${tx(A)}) = ${tx(r!.alpha)},\\qquad P(d\\le ${r!.c}\\mid ${r!.n}, ${tx(L)}) = ${tx(r!.beta)}`],
      result: [['Plan (n, c)', `(${r!.n}, ${r!.c})`], ['α werkelijk', `${fmt(r!.alpha)} (${pct(r!.alpha)})`], ['β werkelijk', `${fmt(r!.beta)} (${pct(r!.beta)})`]],
      excel: [`α: =1-BINOM.DIST(${r!.c};${r!.n};${xl(A)};WAAR)`, `β: =BINOM.DIST(${r!.c};${r!.n};${xl(L)};WAAR)`],
      explain: exDesign({ A, L, am, bm, n: r!.n, c: r!.c, alpha: r!.alpha, beta: r!.beta }),
      answer: `Het kleinste enkelvoudige plan dat aan beide eisen voldoet is n = ${r!.n} met aanvaardingsgetal c = ${r!.c}: het lot wordt aanvaard als er hoogstens ${r!.c} defecten in de steekproef van ${r!.n} zitten. Dan is alfa = ${pctNl(r!.alpha)} bij AQL = ${pctNl(A)} en beta = ${pctNl(r!.beta)} bij LQL = ${pctNl(L)}.`,
      extra: chartBox(lineChart({ series: [{ pts: curve }], vlines: [{ x: 100 * A, label: 'AQL', cls: 'mean' }, { x: 100 * L, label: 'LQL', cls: 'spec' }], hlines: [{ y: 1 - am, label: '1-α', cls: 'cl' }, { y: bm, label: 'β', cls: 'ucl' }], xlabel: 'π (% defect)', ylabel: 'P_acc', x0: 0, x1: 100 * pmax, y0: 0, y1: 1.02 })),
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 3. Double plan ----------
function doubleTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('ss3', () => run());
  const n1 = f.num('n1', 'n₁', 90);
  const c1 = f.num('c1', 'c₁ (aanvaard als d₁ ≤ c₁)', 2);
  const c2 = f.num('c2', 'c₂ (afkeur als d₁ ≥ c₂)', 7);
  const n2 = f.num('n2', 'n₂', 90);
  const c3 = f.num('c3', 'c₃ (aanvaard als d₁ + d₂ ≤ c₃)', 8);
  const ns = f.num('ns', 'Vergelijk: enkelvoudig n', 175);
  const cs = f.num('cs', 'enkelvoudig c', 8);
  const aql = f.num('aql', 'AQL', 0.02);
  const lql = f.num('lql', 'LQL', 0.08);
  const model = f.seg('model', 'Model', MODELS.filter((x) => x[0] !== 'hyper'), 'binom');
  el.append(
    card(
      'Dubbel steekproefplan (double sampling plan) en ASN',
      h('p', { class: 'muted' }, 'Stap 1: neem n₁; aanvaard als d₁ ≤ c₁, keur af als d₁ ≥ c₂. Anders stap 2: neem n₂ extra en aanvaard als d₁ + d₂ ≤ c₃. Cursus: enkelvoudig (175, 8) versus dubbel (90, 2, 7) + (90, 8).'),
      row(exBtn('Cursusvoorbeeld', () => f.setValues({ n1: 90, c1: 2, c2: 7, n2: 90, c3: 8, ns: 175, cs: 8, aql: 0.02, lql: 0.08 }))),
      row(n1.el, c1.el, c2.el, n2.el, c3.el),
      row(ns.el, cs.el, aql.el, lql.el, model.el),
    ),
    out,
  );
  run = live(out, () => {
    const m = model.get();
    const N1 = posInt(n1.get(), 'n₁'), N2 = posInt(n2.get(), 'n₂');
    const C1 = posInt(c1.get(), 'c₁', 0), C2 = posInt(c2.get(), 'c₂', 1), C3 = posInt(c3.get(), 'c₃', 0);
    need(C2 > C1 + 1, 'c₂ moet minstens c₁ + 2 zijn (anders is er nooit een tweede steekproef).');
    need(C3 >= C1 && C3 < N1 + N2, 'c₃ moet tussen c₁ en n₁ + n₂ liggen.');
    const NS = posInt(ns.get(), 'enkelvoudig n'), CS = posInt(cs.get(), 'enkelvoudig c', 0);
    const A = prob(aql.get(), 'AQL'), L = prob(lql.get(), 'LQL');
    need(L > A, 'LQL moet groter zijn dan AQL.');
    const dp = (pi: number) => doublePlan(N1, C1, C2, N2, C3, pi, m);
    const sp = (pi: number) => pAccept(NS, CS, pi, m);
    const dA = dp(A), dL = dp(L);
    const pmax = piMaxFor((p) => Math.max(dp(p).Pacc, sp(p)), L);
    const grid = Array.from({ length: 101 }, (_, i) => (pmax * i) / 100);
    const ocD = grid.map((p) => [100 * p, dp(p).Pacc] as [number, number]);
    const ocS = grid.map((p) => [100 * p, sp(p)] as [number, number]);
    const asn = grid.map((p) => [100 * p, dp(p).ASN] as [number, number]);
    const asnMax = Math.max(...asn.map((x) => x[1]));
    const asnTxt = m === 'pois' ? 'POISSON.DIST' : 'BINOM.DIST';
    const xd = (k: number, nn: number, p: number, cum: boolean) => (m === 'pois' ? `POISSON.DIST(${k};${xl(nn * p)};${cum ? 'WAAR' : 'ONWAAR'})` : `BINOM.DIST(${k};${nn};${xl(p)};${cum ? 'WAAR' : 'ONWAAR'})`);
    const sumTerms = Array.from({ length: C2 - C1 - 1 }, (_, i) => C1 + 1 + i);
    return resultPanel({
      question: [`Dubbel plan \\((${N1}, ${C1}, ${C2}) + (${N2}, ${C3})\\) versus enkelvoudig \\((${NS}, ${CS})\\) bij AQL \\(=${tx(A)}\\) en LQL \\(=${tx(L)}\\)`],
      formula: [
        `P_{acc}=P(d_1\\le c_1)+\\sum_{d_1=c_1+1}^{c_2-1}P(d_1)\\,P(d_2\\le c_3-d_1)`,
        `ASN = n_1 + n_2\\cdot P(c_1<d_1<c_2)`,
      ],
      substituted: [
        `P_{acc}(${tx(A)})=P(d_1\\le ${C1})+\\sum_{d_1=${C1 + 1}}^{${C2 - 1}}P(d_1)P(d_2\\le ${C3}-d_1)=${tx(dA.Pacc)}`,
        `ASN(${tx(A)})=${N1}+${N2}\\cdot ${tx(dA.pSecond)}=${tx(dA.ASN)}`,
      ],
      result: [
        ['Dubbel: P_acc(AQL) ; α', `${fmt(dA.Pacc)} ; ${fmt(1 - dA.Pacc)}`],
        ['Dubbel: P_acc(LQL) = β', fmt(dL.Pacc)],
        ['Dubbel: P(tweede steekproef) bij AQL ; LQL', `${fmt(dA.pSecond)} ; ${fmt(dL.pSecond)}`],
        ['Dubbel: ASN bij AQL ; LQL', `${fmt(dA.ASN)} ; ${fmt(dL.ASN)}`],
        ['Dubbel: maximale ASN', fmt(asnMax)],
        [`Enkelvoudig (${NS}, ${CS}): α ; β`, `${fmt(1 - sp(A))} ; ${fmt(sp(L))}`],
        ['Enkelvoudig: steekproefgrootte (altijd)', String(NS)],
      ],
      excel: [
        `P(d₁ ≤ c₁): =${xd(C1, N1, A, true)}`,
        ...sumTerms.map((k) => `term d₁ = ${k}: =${xd(k, N1, A, false)}*${xd(C3 - k, N2, A, true)}`),
        'P_acc(AQL) = P(d₁ ≤ c₁) + som van de termen hierboven',
        `ASN: =${N1}+${N2}*(${xd(C2 - 1, N1, A, true)}-${xd(C1, N1, A, true)})`,
        `enkelvoudig α: =1-${asnTxt === 'BINOM.DIST' ? `BINOM.DIST(${CS};${NS};${xl(A)};WAAR)` : `POISSON.DIST(${CS};${xl(NS * A)};WAAR)`}`,
      ],
      explain: exDouble({ N1, C1, C2, N2, C3, NS, CS, A, L, PaA: dA.Pacc, PaL: dL.Pacc, asnA: dA.ASN, asnL: dL.ASN, pSecA: dA.pSecond, sA: sp(A), sL: sp(L) }),
      answer: `Het dubbele plan (${N1}, ${C1}, ${C2}) + (${N2}, ${C3}) heeft bij AQL = ${pctNl(A)} een aanvaardingskans ${nl(dA.Pacc)} (alfa = ${pctNl(1 - dA.Pacc)}) en bij LQL = ${pctNl(L)} beta = ${pctNl(dL.Pacc)}, vergelijkbaar met het enkelvoudige plan (${NS}, ${CS}) (alfa = ${pctNl(1 - sp(A))}, beta = ${pctNl(sp(L))}). Het gemiddeld aantal gekeurde stuks (ASN) is maar ${nl(dA.ASN)} bij AQL en ${nl(dL.ASN)} bij LQL, tegenover altijd ${NS} bij het enkelvoudige plan: een dubbel plan bespaart gemiddeld inspectie, ten koste van een complexere procedure en een variabele werklast.`,
      extra: [
        chartBox(lineChart({ series: [{ pts: ocD, label: 'dubbel' }, { pts: ocS, cls: 'alt', label: 'enkelvoudig' }], vlines: [{ x: 100 * A, label: 'AQL', cls: 'mean' }, { x: 100 * L, label: 'LQL', cls: 'spec' }], xlabel: 'π (% defect)  -  blauw: dubbel, groen: enkelvoudig', ylabel: 'P_acc', x0: 0, x1: 100 * pmax, y0: 0, y1: 1.02 })),
        chartBox(lineChart({ series: [{ pts: asn }], hlines: [{ y: NS, label: 'n enkelv.', cls: 'zone' }], vlines: [{ x: 100 * A, label: 'AQL', cls: 'mean' }, { x: 100 * L, label: 'LQL', cls: 'spec' }], xlabel: 'π (% defect)  -  ASN-curve dubbel plan', ylabel: 'ASN', x0: 0, x1: 100 * pmax, y0: 0 })),
      ],
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 4. Variables plan ----------
function variablesTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('ss4', () => run());
  const n = f.num('n', 'n', 20);
  const p0 = f.num('p0', 'p₀ (fractie buiten grens)', 0.02);
  const alpha = f.num('alpha', 'α', 0.05);
  const xbar = f.optNum('xbar', 'x̄ (optioneel)', '');
  const s = f.optNum('s', 's (optioneel)', '');
  const lim = f.optNum('lim', 'Grens ξ (LSL of USL)', '');
  const side = f.seg('side', 'Grens', [['lower', 'Ondergrens (LSL)'], ['upper', 'Bovengrens (USL)']], 'lower');
  el.append(
    card(
      'Variabelenplan (variables sampling plan) (n, k)',
      h('p', { class: 'muted' }, 'Meet n stuks, bereken x̄ en s. Aanvaard het lot als Q = (x̄ - ξ)/s ≥ k (ondergrens) of Q = (ξ - x̄)/s ≥ k (bovengrens). k zo gekozen dat een lot met fractie p₀ buiten de grens slechts met kans α aanvaard wordt (equivalent: met betrouwbaarheid 1 - α ligt hoogstens p₀ buiten de grens).'),
      row(n.el, p0.el, alpha.el),
      row(xbar.el, s.el, lim.el, side.el),
    ),
    out,
  );
  run = live(out, () => {
    const nn = posInt(n.get(), 'n', 3);
    const p = prob(p0.get(), 'p₀');
    const a = prob(alpha.get(), 'α');
    const r = variablesK(nn, p, a);
    const res: [string, string][] = [['z_p = z(1 - p₀)', fmt(r.zp)], ['z_α = z(1 - α)', fmt(r.za)], ['k exact (niet-centrale t)', fmt(r.exact)], ['k Natrella (benadering)', fmt(r.natrella)]];
    const X = xbar.get(), S = s.get(), XI = lim.get();
    let dec: { text: string; kind: 'accept' | 'reject' } | undefined;
    let decTxt = '';
    if (X !== undefined && S !== undefined && XI !== undefined) {
      pos(S, 's');
      const Q = side.get() === 'lower' ? (X - XI) / S : (XI - X) / S;
      res.push([side.get() === 'lower' ? 'Q = (x̄ - ξ)/s' : 'Q = (ξ - x̄)/s', fmt(Q)]);
      dec = Q >= r.exact ? { text: `Aanvaard het lot (Q = ${fmt(Q)} ≥ k = ${fmt(r.exact)})`, kind: 'accept' } : { text: `Keur het lot af (Q = ${fmt(Q)} < k = ${fmt(r.exact)})`, kind: 'reject' };
      decTxt = ` Hier is Q = ${nl(Q)} ${Q >= r.exact ? '>=' : '<'} k, dus het lot wordt ${Q >= r.exact ? 'aanvaard' : 'afgekeurd'}.`;
    }
    // OC curve of the variables plan: P_acc(p) = 1 - F_{t'}(k sqrt n; n-1, z_p sqrt n)
    const pm = Math.min(0.5, 4 * p);
    const oc = Array.from({ length: 60 }, (_, i) => {
      const pi = pm * ((i + 1) / 60) ** 3;
      const zp = -normInvSafe(pi);
      return [100 * pi, 1 - nctCdf(r.exact * Math.sqrt(nn), nn - 1, zp * Math.sqrt(nn))] as [number, number];
    });
    return resultPanel({
      question: [`Aanvaardingsconstante \\(k\\) voor \\(n=${nn}\\), \\(p_0=${tx(p)}\\), \\(\\alpha=${tx(a)}\\); beslisregel \\(Q\\ge k\\)`],
      formula: [
        'k_{exact}=\\frac{t\'_{1-\\alpha}(n-1;\\ \\delta=z_{p}\\sqrt{n})}{\\sqrt{n}}',
        'k_{Natrella}=\\frac{z_p+\\sqrt{z_p^2-ab}}{a},\\quad a=1-\\frac{z_\\alpha^2}{2(n-1)},\\quad b=z_p^2-\\frac{z_\\alpha^2}{n}',
      ],
      substituted: [`a=1-\\frac{${tx(r.za)}^2}{2\\cdot ${nn - 1}}=${tx(r.a)},\\quad b=${tx(r.zp)}^2-\\frac{${tx(r.za)}^2}{${nn}}=${tx(r.b)}`, `k_{Natrella}=\\frac{${tx(r.zp)}+\\sqrt{${tx(r.zp)}^2-${tx(r.a)}\\cdot ${tx(r.b)}}}{${tx(r.a)}}=${tx(r.natrella)},\\qquad k_{exact}=${tx(r.exact)}`],
      result: res,
      decision: dec,
      excel: [`z_p: =NORM.S.INV(1-${xl(p)})`, `z_α: =NORM.S.INV(1-${xl(a)})`, `a: =1-NORM.S.INV(1-${xl(a)})^2/(2*(${nn}-1))`, `k Natrella: =(${xl(r.zp)}+SQRT(${xl(r.zp)}^2-${xl(r.a)}*${xl(r.b)}))/${xl(r.a)}`, 'k exact: niet-centrale t zit niet in Excel (gebruik deze tool of tabellen)'],
      explain: exVariables({ n: nn, p0: p, a, k: r.exact, kn: r.natrella, zp: r.zp, za: r.za }),
      answer: `Voor n = ${nn}, p0 = ${pctNl(p)} en alfa = ${pctNl(a)} is de aanvaardingsconstante k = ${nl(r.exact)} (exact, niet-centrale t-verdeling); de Natrella-benadering geeft k = ${nl(r.natrella)}. Het lot wordt aanvaard als (x-gemiddelde - grens)/s >= k.${decTxt}`,
      extra: [chartBox(lineChart({ series: [{ pts: oc }], vlines: [{ x: 100 * p, label: 'p₀', cls: 'spec' }], hlines: [{ y: a, label: 'α', cls: 'ucl' }], xlabel: 'p (% buiten grens)', ylabel: 'P_acc', x0: 0, x1: 100 * pm, y0: 0, y1: 1.02 })), note('Voordeel variabelenplan: veel kleinere n dan een attributenplan voor dezelfde OC-curve. Nadeel: veronderstelt normaliteit en per kenmerk een apart plan.', 'info')],
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}
const normInvSafe = (p: number) => normInv(Math.min(1 - 1e-12, Math.max(1e-12, p)));

// ---------- 5. Lot defects ----------
function lotTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('ss5', () => run());
  const cpk = f.num('cpk', 'Cpk (gecentreerd proces)', 1);
  const N = f.num('N', 'Lotgrootte N', 10000);
  const two = f.seg('two', 'Specificatie', [['two', 'Tweezijdig (gecentreerd)'], ['one', 'Eenzijdig']], 'two');
  const xle = f.num('xle', 'P(defecten ≤ x): x', 12);
  const xge = f.num('xge', 'P(defecten ≥ y): y', 44);
  el.append(card('Aantal defecten in een lot bij gekende Cpk', h('p', { class: 'muted' }, 'Het aantal defecten in een lot van N stuks is binomiaal(N, π) met π = 2·P(Z > 3·Cpk) voor een gecentreerd proces. Cursus: Cpk 1, N 10 000 → π = 0,27%, E = 27.'), row(cpk.el, N.el, two.el), row(xle.el, xge.el)), out);
  run = live(out, () => {
    const C = pos(cpk.get(), 'Cpk');
    const NN = posInt(N.get(), 'N');
    const tw = two.get() === 'two';
    const r = lotDefects(C, NN, tw);
    const x = posInt(xle.get(), 'x', 0);
    const y = posInt(xge.get(), 'y', 0);
    const pLe = r.cdf(x);
    const pGe = y === 0 ? 1 : r.sf(y - 1);
    const k0 = Math.max(0, r.lo - Math.ceil(r.sd)), k1 = Math.min(NN, r.hi + Math.ceil(r.sd));
    return resultPanel({
      question: [`Verdeling van het aantal defecten in een lot van \\(N=${NN}\\) bij \\(C_{pk}=${tx(C)}\\)`],
      formula: [`\\pi=${tw ? '2\\cdot ' : ''}P(Z>3C_{pk}),\\quad X\\sim Bin(N,\\pi),\\quad E[X]=N\\pi,\\quad \\sigma_X=\\sqrt{N\\pi(1-\\pi)}`],
      substituted: [`\\pi=${tw ? '2\\cdot ' : ''}P(Z>${tx(3 * C)})=${tx(r.pi)},\\quad E[X]=${NN}\\cdot ${tx(r.pi)}=${tx(r.E)},\\quad \\sigma_X=${tx(r.sd)}`],
      result: [
        ['π (fractie defect)', `${fmt(r.pi)} (${pct(r.pi)}, ${fmt(r.pi * 1e6)} ppm)`],
        ['E[X] = Nπ', fmt(r.E)],
        ['σ_X', fmt(r.sd)],
        ['Praktisch bereik (0,1% - 99,9%)', `${r.lo} tot ${r.hi} defecten`],
        [`P(X ≤ ${x})`, fmt(pLe)],
        [`P(X ≥ ${y})`, fmt(pGe)],
      ],
      excel: [`π: =${tw ? '2*' : ''}(1-NORM.S.DIST(3*${xl(C)};WAAR))`, `P(X ≤ ${x}): =BINOM.DIST(${x};${NN};${xl(r.pi)};WAAR)`, `P(X ≥ ${y}): =1-BINOM.DIST(${y - 1};${NN};${xl(r.pi)};WAAR)`],
      explain: exLot({ C, N: NN, pi: r.pi, E: r.E, sd: r.sd, lo: r.lo, hi: r.hi }),
      answer: `Bij Cpk = ${nl(C)} is de fractie defect pi = ${pctNl(r.pi)}, dus in een lot van ${NN} stuks verwachten we ${nl(r.E)} defecten (binomiaal, sigma = ${nl(r.sd)}); praktisch tussen ${r.lo} en ${r.hi}. P(X <= ${x}) = ${nl(pLe)} en P(X >= ${y}) = ${nl(pGe)}. Een lot met veel meer defecten (bv. 100 bij Cpk 1, kans ${nl(r.sf(99))}) is zo onwaarschijnlijk dat het proces veranderd moet zijn.`,
      extra: [chartBox(densityPlot({ pdf: (k) => binomPmf(k, NN, r.pi), x0: k0 - 0.5, x1: k1 + 0.5, discrete: { k0, k1, shadeK: (k) => k <= x || k >= y }, xlabel: 'aantal defecten in het lot' })), note(`Een lot met 100 defecten bij Cpk 1 is zo onwaarschijnlijk (P(X ≥ 100) = ${fmt(r.sf(99))}) dat het proces veranderd moet zijn: zoek een speciale oorzaak.`, 'warn')],
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 6. Stratification ----------
function stratTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('ss6', () => run());
  const n = f.num('n', 'n (totale steekproef)', 100, { hint: 'te verdelen over de strata' });
  const g = (G as any).stratification;
  const grid = new DataGrid({ key: 'ss-strat', cols: 3, rows: 8, headers: ['stratum', 'W_h (gewicht of N_h)', 'π_h'], example: () => ({ headers: ['stratum', 'W_h (gewicht of N_h)', 'π_h'], rows: [['A', g.WA, g.piA], ['B', g.WB, g.piB]] }), onChange: () => run(), height: '220px' });
  el.append(card('Gestratificeerde steekproef (stratified sampling) van een fractie', h('p', { class: 'muted' }, 'Eén rij per stratum (een groep die intern gelijkaardig is, bv. lijn, ploeg of leverancier): naam, gewicht W_h = aandeel in de populatie (of het aantal N_h, wordt genormeerd) en π_h = fractie defect in dat stratum. Vergelijkt een gewone aselecte steekproef (SRS) met proportionele allocatie (n_h volgens grootte) en Neyman-allocatie (n_h volgens grootte x spreiding).'), grid.el, row(n.el)), out);
  run = live(out, () => {
    const raw = grid.getRaw();
    const rowsP = raw.map((r) => [r[1], r[2]].map((v) => parseNum(v ?? '') ?? NaN));
    const okRows = rowsP.map((r, i) => ({ r, name: raw[i][0] || `stratum ${i + 1}` })).filter((x) => x.r.every(Number.isFinite));
    need(okRows.length >= 2, 'Geef minstens 2 strata met W_h en π_h.');
    need(okRows.length === rowsP.length, 'Elke rij moet een numerieke W_h en π_h hebben.');
    const Wraw = okRows.map((x) => x.r[0]);
    need(Wraw.every((w) => w > 0), 'Gewichten moeten > 0 zijn.');
    const sw = Wraw.reduce((a, b) => a + b, 0);
    const W = Wraw.map((w) => w / sw);
    const pi = okRows.map((x) => x.r[1]);
    need(pi.every((p) => p >= 0 && p <= 1), 'π_h moet tussen 0 en 1 liggen.');
    const nn = posInt(n.get(), 'n', 2);
    const r = stratification(W, pi, nn);
    const S = pi.map((p) => Math.sqrt(p * (1 - p)));
    const tbl = table(['stratum', 'W_h', 'π_h', 'S_h = √(π_h(1-π_h))', 'n_h proportioneel', 'n_h Neyman'], okRows.map((x, i) => [x.name, fmt(W[i]), fmt(pi[i]), fmt(S[i]), fmt(r.proportional[i]), fmt(r.neyman[i])]));
    const WS = W.map((w, i) => `${tx(w)}\\cdot ${tx(S[i])}`).join('+');
    return resultPanel({
      question: [`Variantie van de geschatte totale fractie \\(\\hat\\pi\\) met \\(n=${nn}\\): proportioneel, SRS en Neyman`],
      formula: [
        '\\pi=\\sum W_h\\pi_h,\\quad Var_{prop}=\\frac{1}{n}\\sum W_h\\pi_h(1-\\pi_h),\\quad Var_{SRS}=\\frac{\\pi(1-\\pi)}{n}',
        'n_h^{Neyman}=n\\frac{W_hS_h}{\\sum W_jS_j},\\quad Var_{Neyman}=\\frac{(\\sum W_hS_h)^2}{n}',
      ],
      substituted: [
        `\\pi=${W.map((w, i) => `${tx(w)}\\cdot ${tx(pi[i])}`).join('+')}=${tx(r.piTot)}`,
        `Var_{prop}=\\frac{${W.map((w, i) => `${tx(w)}\\cdot ${tx(pi[i])}(1-${tx(pi[i])})`).join('+')}}{${nn}}=${tx(r.varProp)}`,
        `Var_{SRS}=\\frac{${tx(r.piTot)}(1-${tx(r.piTot)})}{${nn}}=${tx(r.varSrs)},\\quad Var_{Neyman}=\\frac{(${WS})^2}{${nn}}=${tx(r.varNeyman)}`,
      ],
      result: [
        ['Totale fractie π', fmt(r.piTot)],
        ['Var proportioneel', fmt(r.varProp)],
        ['Var SRS (aselect)', fmt(r.varSrs)],
        ['Var Neyman (optimaal)', fmt(r.varNeyman)],
        ['SE proportioneel ; SRS ; Neyman', `${fmt(Math.sqrt(r.varProp))} ; ${fmt(Math.sqrt(r.varSrs))} ; ${fmt(Math.sqrt(r.varNeyman))}`],
        ['Neyman-allocatie n_h', okRows.map((x, i) => `${x.name}: ${fmt(r.neyman[i])}`).join(', ')],
        ['Winst Neyman t.o.v. SRS (variantie)', pct(1 - r.varNeyman / r.varSrs)],
      ],
      excel: [`Var prop: =SUMPRODUCT(W;pi;1-pi)/${nn}`, `Var SRS: =${xl(r.piTot)}*(1-${xl(r.piTot)})/${nn}`, `Neyman n_h: =${nn}*W_h*SQRT(pi_h*(1-pi_h))/SUMPRODUCT(W;SQRT(pi*(1-pi)))`],
      explain: exStrat({ k: okRows.length, n: nn, piTot: r.piTot, varProp: r.varProp, varSrs: r.varSrs, varNey: r.varNeyman, gainProp: 1 - r.varProp / r.varSrs, gainNey: 1 - r.varNeyman / r.varSrs, bigS: okRows[S.indexOf(Math.max(...S))].name }),
      answer: `De totale fractie is pi = ${nl(r.piTot)}. Met proportionele allocatie is de variantie van de schatter ${nl(r.varProp)}, met een enkelvoudige aselecte steekproef ${nl(r.varSrs)}; stratificatie wint dus ${r.varProp < r.varSrs ? 'een beetje' : 'niets'}, omdat de strata ${Math.abs(pi[0] - pi[pi.length - 1]) > 0.05 ? 'sterk' : 'weinig'} verschillen in fractie. De Neyman-allocatie (n_h evenredig met W_h * S_h) geeft ${okRows.map((x, i) => `${x.name} ${nl(r.neyman[i])}`).join(', ')} met variantie ${nl(r.varNeyman)}: meer steekproef in het stratum met de grootste spreiding.`,
      extra: card('Allocatie per stratum', tbl),
    });
  });
  run();
}

// ---------- 7. Theory ----------
export const steekproeven: ModuleDef = {
  id: 'steekproeven',
  title: 'Aanvaardingssteekproeven',
  group: 'Fase 2',
  keywords: ['aanvaardingssteekproef', 'acceptance sampling', 'OC-curve', 'operating characteristic', 'AQL', 'LQL', 'LTPD', 'producentenrisico', 'consumentenrisico', 'dubbel plan', 'ASN', 'variabelenplan', 'stratificatie', 'Neyman', 'steekproefmethode', 'lot', 'keuring'],
  subs: [
    ['single', 'Enkelvoudig plan (n, c): OC-curve, AQL, LQL', 'aanvaardingssteekproef acceptance sampling OC-curve AQL LQL producentenrisico consumentenrisico binomiaal hypergeometrisch'],
    ['design', 'Plan ontwerpen: kleinste n en c', 'plan designer AQL LQL alfa beta'],
    ['double', 'Dubbel plan en ASN', 'dubbel plan double sampling ASN'],
    ['variables', 'Variabelenplan (n, k)', 'variabelenplan variables plan k Natrella niet-centrale t'],
    ['lot', 'Defecten in een lot bij gekende Cpk', 'lot defecten Cpk binomiaal'],
    ['strat', 'Stratificatie: proportioneel, SRS, Neyman', 'stratificatie stratified Neyman allocatie'],
    ['theorie', 'Theorie aanvaardingssteekproeven: AQL, LQL, alfa, beta, OC-curve, uitgewerkte voorbeelden', 'theorie AQL LQL LTPD producentenrisico consumentenrisico OC-curve aanvaardingsgetal binomiaal hypergeometrisch dubbel plan ASN variabelenplan steekproefmethode cluster systematisch non-respons'],
  ],
  mount(el) {
    moduleHead(el, 'Aanvaardingssteekproeven (acceptance sampling) en steekproefmethoden', 'Enkelvoudig en dubbel plan, OC-curve, AQL/LQL, variabelenplan, defecten in een lot en stratificatie.');
    const pg = theoryPage(el, 'steekproeven', 'Theorie: aanvaardingssteekproeven stap voor stap', stkTheorie.html, [
      { id: 'single', label: 'Enkelvoudig plan', build: singleTab },
      { id: 'design', label: 'Plan ontwerpen', build: designTab },
      { id: 'double', label: 'Dubbel plan / ASN', build: doubleTab },
      { id: 'variables', label: 'Variabelenplan', build: variablesTab },
      { id: 'lot', label: 'Defecten in lot', build: lotTab },
      { id: 'strat', label: 'Stratificatie', build: stratTab },
    ]);
    return { route: pg.route };
  },
};
