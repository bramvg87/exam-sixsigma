// Tab "Betrouwbaarheidsintervallen": theory + interval chooser (CLT, mu with z or t, sigma^2 / sigma, ratio of variances),
// with examples, summary or raw-data input, explanations and a picture of the sampling distribution.
import { h, fmt, tx, xl, nl, pctNl, settings, onSettings, renderMath } from '../ui/core.ts';
import { Form, row, card, note, exampleRow } from '../ui/form.ts';
import { resultPanel } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { densityPlot, lineChart, chartBox } from '../components/charts.ts';
import { ciMeanZ, ciMeanT, ciVar, ciRatio, clt, type CiKind } from '../calc/ci.ts';
import { normPdf, tPdf, chi2Pdf, fPdf, chi2InvRt, fInvRt } from '../stats/dist.ts';
import { mean, sdS, varS } from '../stats/desc.ts';
import { live, need, posInt, pos, prob } from './util.ts';
import { biTheorie } from '../generated/content.ts';
import G from '../../testdata/golden_values.json';

type BiType = 'clt' | 'muz' | 'mut' | 'var' | 'ratio' | 'prop';

const kindTxt = (k: CiKind, c: number) => (k === 'two' ? `tweezijdig ${pctNl(c)}-BI` : k === 'lower' ? `eenzijdige ${pctNl(c)}-ondergrens` : `eenzijdige ${pctNl(c)}-bovengrens`);
const ivTxt = (lo: number, hi: number) => `[${isFinite(lo) ? nl(lo) : '-oneindig'} ; ${isFinite(hi) ? nl(hi) : '+oneindig'}]`;
const ivTex = (lo: number, hi: number) => `\\left[${isFinite(lo) ? tx(lo) : '-\\infty'}\\,;\\ ${isFinite(hi) ? tx(hi) : '+\\infty'}\\right]`;
const qTxt = (k: CiKind) => (k === 'two' ? '1-\\alpha/2' : '1-\\alpha');
const kindWhy = (k: CiKind) =>
  k === 'two'
    ? 'Tweezijdig: je wil een interval met een onder- en bovengrens, dus \\(\\alpha\\) wordt verdeeld over twee staarten (\\(\\alpha/2\\) links en \\(\\alpha/2\\) rechts).'
    : k === 'lower'
      ? 'Eenzijdige ondergrens ("minstens ..."): heel \\(\\alpha\\) ligt in \u00e9\u00e9n staart, dus de kritieke waarde is kleiner dan bij tweezijdig en de grens ligt dichter bij de schatting. Hoort bij een rechtszijdige toets.'
      : 'Eenzijdige bovengrens ("hoogstens ..."): heel \\(\\alpha\\) ligt in \u00e9\u00e9n staart. Hoort bij een linkszijdige toets.';
const interp = 'Interpretatie: met deze methode bevat in (1 - \u03b1) van alle herhaalde steekproeven het interval de ware waarde. Zeg dus "met ... betrouwbaarheid ligt de parameter tussen ...", niet "er is ...% kans dat de parameter in dit interval ligt" (de parameter ligt vast, het interval schommelt).';

export function biTab(el: HTMLElement, openTab: (id: string) => void) {
  // ---- theory ----
  const thBody = h('div', { class: 'md', html: biTheorie.html });
  renderMath(thBody);
  const theory = h('details', { class: 'card section' }, h('summary', null, 'Theorie: betrouwbaarheidsintervallen correct uitgelegd'), thBody) as HTMLDetailsElement;
  theory.open = settings.explain;
  let last = settings.explain;
  onSettings(() => {
    if (settings.explain !== last) theory.open = last = settings.explain;
  });

  // ---- chooser ----
  const out = h('div');
  let run = () => {};
  const f = new Form('bi', () => run());
  const type = f.seg('type', 'Welk interval?', [['clt', 'CLT: verdeling van x\u0304'], ['muz', '\u03bc (\u03c3 gekend, z)'], ['mut', '\u03bc (\u03c3 onbekend, t)'], ['var', '\u03c3\u00b2 en \u03c3 (\u03c7\u00b2)'], ['ratio', '2 varianties \u03c3\u2082\u00b2/\u03c3\u2081\u00b2 (F)'], ['prop', 'fractie \u03c0']], 'mut');
  const kind = f.seg('kind', 'Soort interval', [['two', 'tweezijdig'], ['lower', 'eenzijdig: ondergrens'], ['upper', 'eenzijdig: bovengrens']], 'two');
  const conf = f.num('conf', 'betrouwbaarheid 1-\u03b1', 0.95, { hint: 'bv. 0,95 of 0,98' });
  const mode = f.seg('mode', 'Invoer', [['sum', 'samenvatting'], ['raw', 'ruwe data (grid)']], 'sum');
  // CLT
  const cMu = f.num('c_mu', '\u03bc (populatiegemiddelde)', 820);
  const cSig = f.num('c_sig', '\u03c3 (populatie-standaardafwijking)', 60.8);
  const cN = f.num('c_n', 'n (metingen per gemiddelde)', 25);
  const cA = f.optNum('c_a', 'P(x\u0304 \u2264 a): a (optioneel)', 800);
  const cB = f.optNum('c_b', 'P(x\u0304 \u2265 b): b (optioneel)', '');
  // mean
  const mX = f.num('m_x', 'x\u0304 (steekproefgemiddelde)', 9.928, { hint: '=AVERAGE(data)' });
  const mSig = f.num('m_sig', '\u03c3 (gekend)', 0.1, { hint: 'uit historische data' });
  const mS = f.num('m_s', 's (steekproef-standaardafwijking)', 0.1079, { hint: '=STDEV.S(data)' });
  const mN = f.num('m_n', 'n', 20, { hint: 'aantal metingen' });
  // variance
  const vKind = f.seg('v_kind', 'Spreiding ingegeven als', [['sd', 's'], ['var', 's\u00b2']], 'sd');
  const vS = f.num('v_s', 's of s\u00b2', 0.011654);
  const vN = f.num('v_n', 'n', 20);
  // ratio
  const rNm1 = f.text('r_nm1', 'naam groep 1', 'M1');
  const rNm2 = f.text('r_nm2', 'naam groep 2', 'M2');
  const rKind = f.seg('r_kind', 'Spreiding ingegeven als', [['var', 's\u00b2'], ['sd', 's']], 'var');
  const rV1 = f.num('r_v1', 'groep 1: s\u2081\u00b2 (of s\u2081)', 0.004);
  const rN1 = f.num('r_n1', 'n\u2081', 10);
  const rV2 = f.num('r_v2', 'groep 2: s\u2082\u00b2 (of s\u2082)', 0.015);
  const rN2 = f.num('r_n2', 'n\u2082', 15);
  const rOr = f.seg('r_or', 'Verhouding', [['21', '\u03c3\u2082\u00b2/\u03c3\u2081\u00b2 (groep 2 in de teller)'], ['12', '\u03c3\u2081\u00b2/\u03c3\u2082\u00b2']], '21');
  const grid = new DataGrid({
    key: 'bi', cols: 2, rows: 30,
    examples: [
      { label: 'Ruwe data Ottoy (t-toets, 20 stuks)', data: () => ({ headers: ['meting'], rows: (G as any).t_test_mean.data.map((v: number) => [v]) }) },
      { label: 'Ruwe data Ottoy (\u03c7\u00b2, 20 stuks)', data: () => ({ headers: ['meting'], rows: (G as any).chi2_test_sigma.data.map((v: number) => [v]) }) },
      { label: 'Ruwe data 2 groepen (A, B)', data: () => ({ headers: ['A', 'B'], rows: (G as any).two_sample.B.map((b: number, i: number) => [(G as any).two_sample.A[i] ?? '', b]) }) },
    ],
    onChange: () => run(),
  });
  const ex: Record<BiType, [string, Record<string, any>][]> = {
    clt: [['Elco\u2019s: \u03bc 820, \u03c3 60,8, n 25, P(x\u0304 \u2264 800)', { type: 'clt', c_mu: 820, c_sig: 60.8, c_n: 25, c_a: 800, c_b: '', conf: 0.95 }], ['Ottoy: \u03bc 10, \u03c3 0,1, n 20, P(x\u0304 \u2264 9,95)', { type: 'clt', c_mu: 10, c_sig: 0.1, c_n: 20, c_a: 9.95, c_b: '', conf: 0.95 }]],
    muz: [['Hypothesetester: x\u0304 10,1; \u03c3 0,3; n 36; 95%', { type: 'muz', mode: 'sum', m_x: 10.1, m_sig: 0.3, m_n: 36, kind: 'two', conf: 0.95 }]],
    mut: [['Ottoy: eenzijdige 98%-bovengrens (x\u0304 9,928; s 0,1079; n 20)', { type: 'mut', mode: 'sum', m_x: 9.928, m_s: 0.1079, m_n: 20, kind: 'upper', conf: 0.98 }], ['Zelfde data, tweezijdig 95%', { type: 'mut', mode: 'sum', m_x: 9.928, m_s: 0.1079, m_n: 20, kind: 'two', conf: 0.95 }], ['Vullijn (tutorial): x\u0304 248,2; s 2,15; n 10; 95%', { type: 'mut', mode: 'sum', m_x: 248.2, m_s: 2.15, m_n: 10, kind: 'two', conf: 0.95 }]],
    var: [['Ottoy: eenzijdige 98%-ondergrens voor \u03c3 (s 0,011654; n 20)', { type: 'var', mode: 'sum', v_kind: 'sd', v_s: 0.011654, v_n: 20, kind: 'lower', conf: 0.98 }], ['Hypothesetester: s 0,13; n 25; tweezijdig 95%', { type: 'var', mode: 'sum', v_kind: 'sd', v_s: 0.13, v_n: 25, kind: 'two', conf: 0.95 }]],
    ratio: [['Examen vraag 2: eenzijdige 95%-ondergrens \u03c3\u2082\u00b2/\u03c3\u2081\u00b2', { type: 'ratio', mode: 'sum', r_kind: 'var', r_v1: 0.004, r_n1: 10, r_v2: 0.015, r_n2: 15, r_or: '21', kind: 'lower', conf: 0.95, r_nm1: 'M1', r_nm2: 'M2' }], ['Zelfde data, tweezijdig 95%', { type: 'ratio', mode: 'sum', r_kind: 'var', r_v1: 0.004, r_n1: 10, r_v2: 0.015, r_n2: 15, r_or: '21', kind: 'two', conf: 0.95 }]],
    prop: [],
  };
  const exBox = h('div');
  const rowC = h('div', null, row(cMu.el, cSig.el, cN.el), row(cA.el, cB.el));
  const rowM = row(mX.el, mSig.el, mS.el, mN.el);
  const rowV = row(vKind.el, vS.el, vN.el);
  const rowR = h('div', null, row(rNm1.el, rNm2.el), row(rKind.el, rV1.el, rN1.el, rV2.el, rN2.el), row(rOr.el));
  const propBox = h('div', null, note('Voor een fractie (bv. % defecten) is er een aparte tab met de exacte methode van de cursus (Clopper-Pearson), Wilson en de normale benadering naast elkaar.', 'info'), h('button', { class: 'btn btn-primary', type: 'button', onclick: () => openTab('propci') }, 'Open tab "BI fractie"'));
  el.append(
    theory,
    card('Betrouwbaarheidsinterval berekenen', h('p', { class: 'muted' }, 'Kies het soort interval (zoals in het formularium, Les 2.D), de betrouwbaarheid en tweezijdig of eenzijdig. Voorbeelden laden met de knoppen.'), row(type.el), exBox, row(kind.el, conf.el), row(mode.el), rowC, rowM, rowV, rowR, grid.el, propBox),
    out,
  );

  run = live(out, () => {
    const T = type.get() as BiType;
    exBox.replaceChildren(ex[T].length ? exampleRow(f, ex[T]) : '');
    const raw = mode.get() === 'raw';
    rowC.hidden = T !== 'clt';
    rowM.hidden = !(T === 'muz' || T === 'mut') || (raw && T === 'mut');
    mSig.el.hidden = T !== 'muz';
    mS.el.hidden = T !== 'mut';
    if (T === 'muz' && raw) { mX.el.hidden = true; mN.el.hidden = true; } else { mX.el.hidden = false; mN.el.hidden = false; }
    rowV.hidden = T !== 'var' || raw;
    rowR.hidden = T !== 'ratio';
    rKind.el.hidden = rV1.el.hidden = rN1.el.hidden = rV2.el.hidden = rN2.el.hidden = raw;
    mode.el.hidden = T === 'clt' || T === 'prop';
    grid.el.hidden = !raw || T === 'clt' || T === 'prop';
    kind.el.hidden = T === 'clt' || T === 'prop';
    propBox.hidden = T !== 'prop';
    conf.el.hidden = T === 'prop';
    if (T === 'prop') return null;
    const c = prob(conf.get(), 'betrouwbaarheid');
    const a = 1 - c;
    const k = (T === 'clt' ? 'two' : kind.get()) as CiKind;
    const col = (j: number) => {
      const cl = grid.getFilledColumns()[j];
      need(!!cl && cl.values.length >= 2, `Plak minstens 2 getallen in kolom ${j + 1} van het grid.`);
      return cl.values;
    };

    // ---------- CLT ----------
    if (T === 'clt') {
      const mu = cMu.get();
      const sg = pos(cSig.get(), '\u03c3');
      const n = posInt(cN.get(), 'n');
      const A = cA.get();
      const B = cB.get();
      const r = clt(mu, sg, n, a, A, B);
      const zi = r.z * sg;
      const res: [string, string][] = [['SE = \u03c3/\u221an', fmt(r.se)], [`${pctNl(c)} van de gemiddelden x\u0304 ligt in`, ivTxt(r.lo, r.hi)], [`${pctNl(c)} van de individuele waarden ligt in`, ivTxt(mu - zi, mu + zi)]];
      if (A !== undefined) res.push([`P(x\u0304 \u2264 ${fmt(A)})`, fmt(r.pLeA!)]);
      if (B !== undefined) res.push([`P(x\u0304 \u2265 ${fmt(B)})`, fmt(r.pGeB!)]);
      if (A !== undefined && B !== undefined) res.push([`P(${fmt(A)} \u2264 x\u0304 \u2264 ${fmt(B)})`, fmt(r.pBetween!)]);
      const xs = Array.from({ length: 241 }, (_, i) => mu - 4.2 * sg + (8.4 * sg * i) / 240);
      return resultPanel({
        question: [`Hoe is het gemiddelde \\(\\bar X\\) van \\(n=${n}\\) metingen verdeeld als de populatie \\(\\mu=${tx(mu)}\\) en \\(\\sigma=${tx(sg)}\\) heeft?`],
        formula: ['\\bar X\\sim N\\left(\\mu,\\ \\frac{\\sigma^2}{n}\\right),\\qquad SE=\\frac{\\sigma}{\\sqrt n},\\qquad P(\\bar X\\le a)=\\Phi\\left(\\frac{a-\\mu}{\\sigma/\\sqrt n}\\right)'],
        substituted: [`SE=\\frac{${tx(sg)}}{\\sqrt{${n}}}=${tx(r.se)},\\qquad ${tx(mu)}\\pm ${tx(r.z)}\\cdot ${tx(r.se)}=${ivTex(r.lo, r.hi)}`].concat(A !== undefined ? [`P(\\bar X\\le ${tx(A)})=\\Phi\\left(\\frac{${tx(A)}-${tx(mu)}}{${tx(r.se)}}\\right)=\\Phi(${tx((A - mu) / r.se)})=${tx(r.pLeA!)}`] : []),
        result: res,
        explain: {
          question: ['De centrale limietstelling (CLT) beschrijft hoe een GEMIDDELDE van n metingen schommelt. Die verdeling is de basis van elk betrouwbaarheidsinterval voor \\(\\mu\\) en van de \\(\\bar X\\)-regelkaart.'],
          formula: ['Waarom delen door \\(\\sqrt n\\)? Bij het middelen vallen toevallige afwijkingen naar boven en naar beneden deels tegen elkaar weg: de variantie van een gemiddelde is \\(\\sigma^2/n\\), dus de standaardafwijking \\(\\sigma/\\sqrt n\\). De vorm wordt normaal, ook als de individuele waarden het niet zijn (vuistregel n \u2265 30, sneller als de populatie al symmetrisch is).'],
          substituted: [`Individuele waarden schommelen met \u03c3 = ${nl(sg)}; gemiddelden van ${n} stuks slechts met ${nl(r.se)}, dus ${nl(Math.sqrt(n))} keer minder.`],
          result: ['Het BI keert dit om: als \\(\\bar x\\) in 95% van de steekproeven binnen \\(\\mu\\pm1{,}96\\,SE\\) valt, dan ligt \\(\\mu\\) in 95% van de gevallen binnen \\(\\bar x\\pm1{,}96\\,SE\\).'],
        },
        extra: chartBox(lineChart({ series: [{ pts: xs.map((x) => [x, normPdf(x, mu, sg)] as [number, number]), cls: 'alt' }, { pts: xs.map((x) => [x, normPdf(x, mu, r.se)] as [number, number]) }], vlines: [{ x: r.lo, label: 'onder' }, { x: r.hi, label: 'boven' }], xlabel: 'waarde', ylabel: 'dichtheid', y0: 0 }), h('div', { class: 'muted' }, 'Groene stippellijn: verdeling van individuele waarden (\u03c3). Blauwe lijn: verdeling van het gemiddelde van n metingen (\u03c3/\u221an), veel smaller.')),
        excel: [`SE: =${xl(sg)}/SQRT(${n})`, `grenzen: =${xl(mu)}-NORM.S.INV(${xl(1 - a / 2)})*${xl(sg)}/SQRT(${n})`].concat(A !== undefined ? [`P(x\u0304 \u2264 a): =NORM.DIST(${xl(A)};${xl(mu)};${xl(sg)}/SQRT(${n});WAAR)`] : []),
        answer: `Volgens de centrale limietstelling is het gemiddelde van ${n} metingen (bij benadering) normaal verdeeld met gemiddelde ${nl(mu)} en standaardfout ${nl(sg)}/wortel(${n}) = ${nl(r.se)}. ${pctNl(c)} van de steekproefgemiddelden ligt dus tussen ${nl(r.lo)} en ${nl(r.hi)}.${A !== undefined ? ` P(x\u0304 <= ${nl(A)}) = ${nl(r.pLeA!)}.` : ''}`,
      });
    }

    // ---------- mean ----------
    if (T === 'muz' || T === 'mut') {
      let xb: number, s: number, n: number;
      if (raw) {
        const v = col(0);
        xb = mean(v); s = sdS(v); n = v.length;
      } else {
        xb = mX.get(); n = posInt(mN.get(), 'n', 2); s = T === 'mut' ? pos(mS.get(), 's') : NaN;
      }
      const isZ = T === 'muz';
      const sg = isZ ? pos(mSig.get(), '\u03c3') : s;
      const r = isZ ? ciMeanZ(xb, sg, n, a, k) : ciMeanT(xb, s, n, a, k);
      const crit = r.crit[0];
      const sym = isZ ? 'z' : 't';
      const critTex = isZ ? `z_{${qTxt(k)}}` : `t_{${qTxt(k)};\\,n-1}`;
      const sgTex = isZ ? '\\sigma' : 's';
      const formula = k === 'two' ? `\\bar x\\pm ${critTex}\\,\\frac{${sgTex}}{\\sqrt n}` : k === 'lower' ? `\\mu\\ \\ge\\ \\bar x - ${critTex}\\,\\frac{${sgTex}}{\\sqrt n}` : `\\mu\\ \\le\\ \\bar x + ${critTex}\\,\\frac{${sgTex}}{\\sqrt n}`;
      const qv = 1 - (k === 'two' ? a / 2 : a);
      const critXl = isZ ? `=NORM.S.INV(${xl(qv)})` : `=T.INV(${xl(qv)};${n - 1})`;
      const pdf = isZ ? (x: number) => normPdf(x, xb, r.se!) : (x: number) => tPdf((x - xb) / r.se!, n - 1) / r.se!;
      const span = Math.max(4.2, crit * 1.4) * r.se!;
      return resultPanel({
        question: [`${kindTxt(k, c)} voor het populatiegemiddelde \\(\\mu\\) (${isZ ? '\\(\\sigma\\) gekend' : '\\(\\sigma\\) onbekend, geschat met \\(s\\)'})`],
        formula: [formula],
        substituted: [`SE=\\frac{${tx(sg)}}{\\sqrt{${n}}}=${tx(r.se!)},\\quad ${sym}=${tx(crit)},\\quad E=${tx(crit)}\\cdot ${tx(r.se!)}=${tx(r.margin!)}`, `${ivTex(r.lo, r.hi)}`],
        result: [['x\u0304', fmt(xb)], [isZ ? '\u03c3' : 's', fmt(sg)], ['n', String(n)], ['standaardfout SE', fmt(r.se!)], [`kritieke waarde ${sym}${isZ ? '' : ` (df = ${n - 1})`}`, fmt(crit)], ['foutenmarge E', fmt(r.margin!)], [kindTxt(k, c), ivTxt(r.lo, r.hi)]],
        explain: {
          question: [kindWhy(k), interp],
          formula: [
            isZ
              ? 'Waarom z? \\(\\sigma\\) is gekend (vaste procesparameter, bv. uit SPC), dus \\((\\bar X-\\mu)/(\\sigma/\\sqrt n)\\) is exact standaardnormaal (CLT).'
              : 'Waarom t? \\(\\sigma\\) is onbekend en vervangen door \\(s\\). Die schatting voegt onzekerheid toe; de t-verdeling met \\(n-1\\) vrijheidsgraden heeft dikkere staarten en dus een grotere kritieke waarde dan z.',
            `Opbouw: schatting (\\(\\bar x\\)) \\(\\pm\\) kritieke waarde \\(\\times\\) standaardfout. De kritieke waarde ${crit.toFixed(3).replace('.', ',')} betekent: zoveel standaardfouten naar ${k === 'two' ? 'links en rechts' : k === 'lower' ? 'links' : 'rechts'} om ${pctNl(c)} betrouwbaarheid te halen.`,
          ],
          substituted: [`De schatting ${nl(xb)} schommelt van steekproef tot steekproef met typisch ${nl(r.se!)} (SE). ${isZ ? '' : `Ter vergelijking: met z i.p.v. t zou de kritieke waarde ${nl((ciMeanZ(xb, s, n, a, k).crit[0]))} zijn; t maakt het interval breder omdat s een schatting is.`}`],
          result: ['Breder interval bij hogere betrouwbaarheid, kleinere n of grotere spreiding. Toets-koppeling: ligt een normwaarde \\(\\mu_0\\) buiten dit interval, dan verwerp je \\(H_0:\\mu=\\mu_0\\) op niveau \\(\\alpha\\) (met dezelfde zijdigheid).'],
        },
        extra: chartBox(densityPlot({ pdf, x0: xb - span, x1: xb + span, shade: [[r.lo, r.hi]], vlines: [{ x: xb, label: 'x\u0304' }, ...(isFinite(r.lo) ? [{ x: r.lo, label: fmt(r.lo) }] : []), ...(isFinite(r.hi) ? [{ x: r.hi, label: fmt(r.hi) }] : [])] }), h('div', { class: 'muted' }, 'Curve: onzekerheid op de schatting (gecentreerd rond x\u0304, breedte = SE). Gearceerd: het betrouwbaarheidsinterval.')),
        excel: [`kritieke waarde: ${critXl}`, `marge: =${critXl.slice(1)}*${xl(sg)}/SQRT(${n})`, isZ ? `of in \u00e9\u00e9n keer: =CONFIDENCE.NORM(${xl(k === 'two' ? a : 2 * a)};${xl(sg)};${n})` : `of in \u00e9\u00e9n keer: =CONFIDENCE.T(${xl(k === 'two' ? a : 2 * a)};${xl(s)};${n})`],
        answer: `Met x\u0304 = ${nl(xb)}, ${isZ ? 'sigma' : 's'} = ${nl(sg)} en n = ${n} is de standaardfout ${nl(r.se!)}. Met ${sym} = ${nl(crit)} geeft dat ${k === 'two' ? `${nl(xb)} +/- ${nl(r.margin!)}, dus` : ''} het ${kindTxt(k, c)} ${ivTxt(r.lo, r.hi)}: met ${pctNl(c)} betrouwbaarheid ligt het populatiegemiddelde ${k === 'two' ? `tussen ${nl(r.lo)} en ${nl(r.hi)}` : k === 'lower' ? `boven ${nl(r.lo)}` : `onder ${nl(r.hi)}`}.`,
      });
    }

    // ---------- variance ----------
    if (T === 'var') {
      let s: number, n: number;
      if (raw) {
        const v = col(0);
        s = sdS(v); n = v.length;
      } else {
        const x = pos(vS.get(), 's');
        s = vKind.get() === 'var' ? Math.sqrt(x) : x;
        n = posInt(vN.get(), 'n', 2);
      }
      const r = ciVar(s, n, a, k);
      const df = n - 1;
      const ss = df * s * s;
      const chiHi = chi2InvRt(k === 'two' ? a / 2 : a, df);
      const chiLo = ss / (isFinite(r.hi) ? r.hi : Infinity);
      const fTex = k === 'two' ? `\\frac{(n-1)s^2}{\\chi^2_{1-\\alpha/2;\\,n-1}}\\le\\sigma^2\\le\\frac{(n-1)s^2}{\\chi^2_{\\alpha/2;\\,n-1}}` : k === 'lower' ? `\\sigma^2\\ge\\frac{(n-1)s^2}{\\chi^2_{1-\\alpha;\\,n-1}}` : `\\sigma^2\\le\\frac{(n-1)s^2}{\\chi^2_{\\alpha;\\,n-1}}`;
      const sub = k === 'two' ? `\\frac{${tx(ss)}}{${tx(chiHi)}}\\le\\sigma^2\\le\\frac{${tx(ss)}}{${tx(chiLo)}}` : k === 'lower' ? `\\sigma^2\\ge\\frac{${df}\\cdot ${tx(s)}^2}{${tx(chiHi)}}=${tx(r.lo)}` : `\\sigma^2\\le\\frac{${df}\\cdot ${tx(s)}^2}{${tx(chiLo)}}=${tx(r.hi)}`;
      const sLo = Math.sqrt(r.lo), sHi = Math.sqrt(r.hi);
      const xmax = chi2InvRt(0.001, df);
      const shade: [number, number][] = k === 'two' ? [[chiLo, chiHi]] : k === 'lower' ? [[0, chiHi]] : [[chiLo, xmax * 2]];
      return resultPanel({
        question: [`${kindTxt(k, c)} voor de populatievariantie \\(\\sigma^2\\) en standaardafwijking \\(\\sigma\\)`],
        formula: [fTex, '\\text{voor } \\sigma: \\text{ neem de vierkantswortel van beide grenzen}'],
        substituted: [`(n-1)s^2=${df}\\cdot ${tx(s)}^2=${tx(ss)}`, sub],
        result: [['s ; s\u00b2', `${fmt(s)} ; ${fmt(s * s)}`], ['n ; df', `${n} ; ${df}`], [`\u03c7\u00b2-waarde(n)`, r.crit.map((v) => fmt(v)).join(' ; ')], [`${kindTxt(k, c)} voor \u03c3\u00b2`, ivTxt(r.lo, r.hi)], [`${kindTxt(k, c)} voor \u03c3`, ivTxt(sLo, sHi)]],
        explain: {
          question: [kindWhy(k), interp],
          formula: [
            'Waarom \\(\\chi^2\\)? Voor normale data geldt \\((n-1)s^2/\\sigma^2\\sim\\chi^2(n-1)\\): een verhouding, dus het interval is ook een verhouding en geen "schatting \\(\\pm\\) marge".',
            'Omkeren: met kans \\(1-\\alpha\\) ligt \\(\\chi^2\\) tussen de twee kwantielen. Dan \\(\\sigma^2=(n-1)s^2/\\chi^2\\): de GROTE \\(\\chi^2\\)-waarde geeft de ONDERgrens, de kleine de bovengrens.',
            'De \\(\\chi^2\\)-verdeling is scheef naar rechts, daarom ligt het interval niet symmetrisch rond \\(s^2\\) (de bovengrens ligt verder weg). Voor \\(\\sigma\\) neem je de wortel van beide grenzen.',
          ],
          result: ['Opgelet: dit interval steunt sterk op normaliteit (niet robuust). Toets-koppeling: ligt een normwaarde \\(\\sigma_0\\) buiten het interval voor \\(\\sigma\\), dan verwerp je \\(H_0:\\sigma=\\sigma_0\\).'],
        },
        extra: chartBox(densityPlot({ pdf: (x) => chi2Pdf(x, df), x0: 0, x1: xmax, shade, vlines: r.crit.map((v) => ({ x: v, label: fmt(v) })) }), h('div', { class: 'muted' }, `\u03c7\u00b2(${df})-verdeling met de gebruikte kwantielen; gearceerd = kans 1 - \u03b1.`)),
        excel: k === 'two' ? [`ondergrens: =${xl(ss)}/CHISQ.INV.RT(${xl(a / 2)};${df})`, `bovengrens: =${xl(ss)}/CHISQ.INV(${xl(a / 2)};${df})`, 'voor \u03c3: =SQRT(...)'] : k === 'lower' ? [`=${xl(ss)}/CHISQ.INV.RT(${xl(a)};${df})`, 'voor \u03c3: =SQRT(...)'] : [`=${xl(ss)}/CHISQ.INV(${xl(a)};${df})`, 'voor \u03c3: =SQRT(...)'],
        answer: `Met s = ${nl(s)} en n = ${n} (df = ${df}) is (n-1)s^2 = ${nl(ss)}. Het ${kindTxt(k, c)} voor sigma^2 is ${ivTxt(r.lo, r.hi)}, dus voor sigma ${ivTxt(sLo, sHi)}: met ${pctNl(c)} betrouwbaarheid ligt de populatie-standaardafwijking ${k === 'two' ? `tussen ${nl(sLo)} en ${nl(sHi)}` : k === 'lower' ? `boven ${nl(sLo)}` : `onder ${nl(sHi)}`}.`,
      });
    }

    // ---------- ratio ----------
    let s1sq: number, s2sq: number, n1: number, n2: number;
    let nm1 = rNm1.get() || '1';
    let nm2 = rNm2.get() || '2';
    if (raw) {
      const c1 = grid.getFilledColumns();
      need(c1.length >= 2 && c1[0].values.length >= 2 && c1[1].values.length >= 2, 'Plak twee kolommen met elk minstens 2 getallen.');
      s1sq = varS(c1[0].values); s2sq = varS(c1[1].values); n1 = c1[0].values.length; n2 = c1[1].values.length;
      nm1 = c1[0].name; nm2 = c1[1].name;
    } else {
      const sq = rKind.get() === 'sd';
      s1sq = pos(rV1.get(), 'spreiding 1') ** (sq ? 2 : 1);
      s2sq = pos(rV2.get(), 'spreiding 2') ** (sq ? 2 : 1);
      n1 = posInt(rN1.get(), 'n\u2081', 2); n2 = posInt(rN2.get(), 'n\u2082', 2);
    }
    const o21 = rOr.get() === '21';
    // numerator group a, denominator group b
    const [sa, na, sb, nb, A, B, ia, ib] = o21 ? [s2sq, n2, s1sq, n1, nm2, nm1, '2', '1'] : [s1sq, n1, s2sq, n2, nm1, nm2, '1', '2'];
    const r = ciRatio(sa, na, sb, nb, a, k);
    const [d1, d2] = r.df as [number, number];
    const rTex = `\\frac{\\sigma_${ia}^2}{\\sigma_${ib}^2}`;
    const fq = (q: string) => `F_{${q}}(n_${ib}-1;\\,n_${ia}-1)`;
    const formula = k === 'two' ? `\\frac{s_${ia}^2}{s_${ib}^2}\\,${fq('\\alpha/2')}\\ \\le\\ ${rTex}\\ \\le\\ \\frac{s_${ia}^2}{s_${ib}^2}\\,${fq('1-\\alpha/2')}` : k === 'lower' ? `${rTex}\\ \\ge\\ \\frac{s_${ia}^2}{s_${ib}^2}\\,${fq('\\alpha')}` : `${rTex}\\ \\le\\ \\frac{s_${ia}^2}{s_${ib}^2}\\,${fq('1-\\alpha')}`;
    const sub = k === 'two' ? `${tx(r.est)}\\cdot ${tx(r.crit[0])}\\ \\le\\ ${rTex}\\ \\le\\ ${tx(r.est)}\\cdot ${tx(r.crit[1])}\\ \\Rightarrow\\ ${ivTex(r.lo, r.hi)}` : k === 'lower' ? `${rTex}\\ \\ge\\ ${tx(r.est)}\\cdot ${tx(r.crit[0])}=${tx(r.lo)}` : `${rTex}\\ \\le\\ ${tx(r.est)}\\cdot ${tx(r.crit[0])}=${tx(r.hi)}`;
    const qv = (q: number) => `F.INV(${xl(q)};${d1};${d2})`;
    const has1 = r.lo <= 1 && r.hi >= 1;
    const xmax = Math.min(fInvRt(0.002, d1, d2), 12);
    const shade: [number, number][] = k === 'two' ? [[r.crit[0], r.crit[1]]] : k === 'lower' ? [[r.crit[0], xmax * 3]] : [[0, r.crit[0]]];
    return resultPanel({
      question: [`${kindTxt(k, c)} voor de verhouding van twee varianties \\(${rTex}\\) (${A} in de teller, ${B} in de noemer)`],
      formula: [formula, `\\text{pivot: } \\frac{s_${ib}^2/\\sigma_${ib}^2}{s_${ia}^2/\\sigma_${ia}^2}\\sim F(n_${ib}-1;\\,n_${ia}-1)`],
      substituted: [`\\frac{s_${ia}^2}{s_${ib}^2}=\\frac{${tx(sa)}}{${tx(sb)}}=${tx(r.est)},\\quad df=(${d1};\\,${d2})`, sub],
      result: [[`schatting s${ia}\u00b2/s${ib}\u00b2`, fmt(r.est)], ['F-kwantiel(en)', r.crit.map((v) => fmt(v)).join(' ; ')], [kindTxt(k, c), ivTxt(r.lo, r.hi)], ['voor de verhouding van standaardafwijkingen', ivTxt(Math.sqrt(r.lo), Math.sqrt(r.hi))]],
      decision: has1 ? { text: '1 ligt in het interval: gelijke varianties zijn plausibel', kind: 'accept' } : { text: `1 ligt niet in het interval: de varianties verschillen (${r.lo > 1 ? `${A} spreidt meer, ${B} is nauwkeuriger` : `${A} spreidt minder, ${A} is nauwkeuriger`})`, kind: 'reject' },
      explain: {
        question: [kindWhy(k), 'Twee spreidingen vergelijk je met een VERHOUDING: 1 betekent even groot. Schrijf altijd expliciet welke variantie in de teller staat.', interp],
        formula: [
          'Waarom F? Elke \\(s^2/\\sigma^2\\) is (gedeeld door df) \\(\\chi^2\\)-verdeeld; de verhouding van twee zulke grootheden is F-verdeeld. Die pivot bevat de onbekende verhouding van de \\(\\sigma^2\\)\u2019s; omzetten geeft de grenzen.',
          'De eerste vrijheidsgraad hoort bij de groep in de NOEMER van de gezochte verhouding (want die staat in de teller van de pivot). Excel F.INV geeft de linkerstaart (getal < 1), F.INV.RT de rechterstaart.',
          'Je VERMENIGVULDIGT de geschatte verhouding met beide F-kwantielen (niet delen). Omkeerregel: \\(F_\\alpha(a;b)=1/F_{1-\\alpha}(b;a)\\).',
        ],
        result: [`Beslissing via het interval: ${has1 ? 'het bevat 1, dus geen significant verschil in spreiding.' : `het ligt volledig ${r.lo > 1 ? 'boven' : 'onder'} 1, dus de varianties verschillen significant.`} Voor de verhouding van standaardafwijkingen neem je de wortel van de grenzen. Voorwaarde: normale data, onafhankelijke steekproeven.`],
      },
      extra: chartBox(densityPlot({ pdf: (x) => fPdf(x, d1, d2), x0: 0, x1: xmax, shade, vlines: r.crit.map((v) => ({ x: v, label: fmt(v) })) }), h('div', { class: 'muted' }, `F(${d1};${d2})-verdeling met de gebruikte kwantielen; gearceerd = kans 1 - \u03b1.`)),
      excel: k === 'two' ? [`onder: =(${xl(sa)}/${xl(sb)})*${qv(a / 2)}`, `boven: =(${xl(sa)}/${xl(sb)})*${qv(1 - a / 2)}`] : k === 'lower' ? [`=(${xl(sa)}/${xl(sb)})*${qv(a)}`, `idem: =(${xl(sa)}/${xl(sb)})/F.INV.RT(${xl(a)};${d2};${d1})`] : [`=(${xl(sa)}/${xl(sb)})*${qv(1 - a)}`],
      answer: `De geschatte verhouding s${ia}^2/s${ib}^2 = ${nl(sa)}/${nl(sb)} = ${nl(r.est)} (${A} in de teller). Met de F(${d1};${d2})-verdeling is het ${kindTxt(k, c)} voor sigma${ia}^2/sigma${ib}^2 gelijk aan ${ivTxt(r.lo, r.hi)}. ${has1 ? 'Het interval bevat 1: de varianties verschillen niet significant.' : `Het interval ligt volledig ${r.lo > 1 ? 'boven' : 'onder'} 1: met ${pctNl(c)} betrouwbaarheid ${r.lo > 1 ? `spreidt ${A} meer dan ${B}, dus ${B} werkt nauwkeuriger` : `spreidt ${A} minder dan ${B}, dus ${A} werkt nauwkeuriger`}.`}`,
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}
