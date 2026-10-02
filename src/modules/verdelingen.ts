// M1 Verdelingen: distribution calculator, sigma from tail probability, which distribution.
import { h, fmt, tx, xl, nl, pctNl } from '../ui/core.ts';
import { Form, row, card } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { densityPlot, chartBox } from '../components/charts.ts';
import * as D from '../stats/dist.ts';
import { live, need, moduleHead, posInt, pos, prob } from './util.ts';
import { tabs, type ModuleDef } from './types.ts';

type P = Record<string, number>;
interface Dist {
  id: string;
  label: string;
  params: [string, string, number][];
  discrete: boolean;
  check(p: P): void;
  cdf(x: number, p: P): number; // P(X <= x)
  sf(x: number, p: P): number; // P(X > x)
  pdf(x: number, p: P): number;
  inv(q: number, p: P): number; // smallest x with P(X<=x) >= q
  invRt?(q: number, p: P): number; // x with P(X > x) = q (continuous)
  mean(p: P): number;
  var(p: P): number;
  span(p: P): [number, number];
  xlCdf(x: string, p: P): string; // Excel for P(X <= x)
  xlInv(q: string, p: P): string;
  xlPdf?(x: string, p: P): string;
  meanTex: string;
  varTex: string;
}

const dists: Dist[] = [
  {
    id: 'normal', label: 'Normaal N(μ, σ)', params: [['mu', 'μ (gemiddelde)', 0], ['sigma', 'σ (standaardafwijking)', 1]], discrete: false,
    check: (p) => pos(p.sigma, 'σ'),
    cdf: (x, p) => D.normCdf(x, p.mu, p.sigma), sf: (x, p) => D.normSf(x, p.mu, p.sigma), pdf: (x, p) => D.normPdf(x, p.mu, p.sigma),
    inv: (q, p) => D.normInv(q, p.mu, p.sigma), invRt: (q, p) => D.normInvRt(q, p.mu, p.sigma),
    mean: (p) => p.mu, var: (p) => p.sigma ** 2, span: (p) => [p.mu - 4 * p.sigma, p.mu + 4 * p.sigma],
    xlCdf: (x, p) => `NORM.DIST(${x};${xl(p.mu)};${xl(p.sigma)};WAAR)`, xlInv: (q, p) => `NORM.INV(${q};${xl(p.mu)};${xl(p.sigma)})`, xlPdf: (x, p) => `NORM.DIST(${x};${xl(p.mu)};${xl(p.sigma)};ONWAAR)`,
    meanTex: 'E[X]=\\mu', varTex: 'Var[X]=\\sigma^2',
  },
  {
    id: 'z', label: 'Standaardnormaal Z', params: [], discrete: false, check: () => {},
    cdf: (x) => D.normCdf(x), sf: (x) => D.normSf(x), pdf: (x) => D.normPdf(x), inv: (q) => D.normInv(q), invRt: (q) => -D.normInv(q),
    mean: () => 0, var: () => 1, span: () => [-4, 4],
    xlCdf: (x) => `NORM.S.DIST(${x};WAAR)`, xlInv: (q) => `NORM.S.INV(${q})`, xlPdf: (x) => `NORM.S.DIST(${x};ONWAAR)`,
    meanTex: 'E[Z]=0', varTex: 'Var[Z]=1',
  },
  {
    id: 't', label: 'Student t', params: [['df', 'vrijheidsgraden ν', 10]], discrete: false, check: (p) => pos(p.df, 'df'),
    cdf: (x, p) => D.tCdf(x, p.df), sf: (x, p) => D.tSf(x, p.df), pdf: (x, p) => D.tPdf(x, p.df), inv: (q, p) => D.tInv(q, p.df), invRt: (q, p) => D.tInvRt(q, p.df),
    mean: (p) => (p.df > 1 ? 0 : NaN), var: (p) => (p.df > 2 ? p.df / (p.df - 2) : NaN), span: (p) => { const a = Math.max(4, D.tInvRt(0.002, p.df)); return [-a, a]; },
    xlCdf: (x, p) => `T.DIST(${x};${xl(p.df)};WAAR)`, xlInv: (q, p) => `T.INV(${q};${xl(p.df)})`, xlPdf: (x, p) => `T.DIST(${x};${xl(p.df)};ONWAAR)`,
    meanTex: 'E[T]=0\\ (\\nu>1)', varTex: 'Var[T]=\\frac{\\nu}{\\nu-2}\\ (\\nu>2)',
  },
  {
    id: 'chi2', label: 'Chi-kwadraat χ²', params: [['df', 'vrijheidsgraden ν', 10]], discrete: false, check: (p) => pos(p.df, 'df'),
    cdf: (x, p) => D.chi2Cdf(x, p.df), sf: (x, p) => D.chi2Sf(x, p.df), pdf: (x, p) => D.chi2Pdf(x, p.df), inv: (q, p) => D.chi2Inv(q, p.df), invRt: (q, p) => D.chi2InvRt(q, p.df),
    mean: (p) => p.df, var: (p) => 2 * p.df, span: (p) => [0, D.chi2InvRt(0.001, p.df)],
    xlCdf: (x, p) => `CHISQ.DIST(${x};${xl(p.df)};WAAR)`, xlInv: (q, p) => `CHISQ.INV(${q};${xl(p.df)})`, xlPdf: (x, p) => `CHISQ.DIST(${x};${xl(p.df)};ONWAAR)`,
    meanTex: 'E[X]=\\nu', varTex: 'Var[X]=2\\nu',
  },
  {
    id: 'f', label: 'F-verdeling', params: [['d1', 'df teller', 9], ['d2', 'df noemer', 14]], discrete: false, check: (p) => (pos(p.d1, 'df teller'), pos(p.d2, 'df noemer')),
    cdf: (x, p) => D.fCdf(x, p.d1, p.d2), sf: (x, p) => D.fSf(x, p.d1, p.d2), pdf: (x, p) => D.fPdf(x, p.d1, p.d2), inv: (q, p) => D.fInv(q, p.d1, p.d2), invRt: (q, p) => D.fInvRt(q, p.d1, p.d2),
    mean: (p) => (p.d2 > 2 ? p.d2 / (p.d2 - 2) : NaN), var: (p) => (p.d2 > 4 ? (2 * p.d2 ** 2 * (p.d1 + p.d2 - 2)) / (p.d1 * (p.d2 - 2) ** 2 * (p.d2 - 4)) : NaN),
    span: (p) => [0, Math.min(D.fInvRt(0.003, p.d1, p.d2), 50)],
    xlCdf: (x, p) => `F.DIST(${x};${xl(p.d1)};${xl(p.d2)};WAAR)`, xlInv: (q, p) => `F.INV(${q};${xl(p.d1)};${xl(p.d2)})`, xlPdf: (x, p) => `F.DIST(${x};${xl(p.d1)};${xl(p.d2)};ONWAAR)`,
    meanTex: 'E[F]=\\frac{d_2}{d_2-2}', varTex: 'Var[F]=\\frac{2d_2^2(d_1+d_2-2)}{d_1(d_2-2)^2(d_2-4)}',
  },
  {
    id: 'binom', label: 'Binomiaal B(n, π)', params: [['n', 'n (aantal pogingen)', 100], ['pi', 'π (kans op succes)', 0.05]], discrete: true,
    check: (p) => (posInt(p.n, 'n'), prob(p.pi, 'π', false)),
    cdf: (x, p) => D.binomCdf(x, p.n, p.pi), sf: (x, p) => D.binomSf(x, p.n, p.pi), pdf: (x, p) => D.binomPmf(x, p.n, p.pi), inv: (q, p) => D.binomInv(p.n, p.pi, q),
    mean: (p) => p.n * p.pi, var: (p) => p.n * p.pi * (1 - p.pi), span: (p) => { const m = p.n * p.pi, s = Math.sqrt(m * (1 - p.pi)); return [Math.max(0, Math.floor(m - 5 * s - 2)), Math.min(p.n, Math.ceil(m + 5 * s + 2))]; },
    xlCdf: (x, p) => `BINOM.DIST(${x};${xl(p.n)};${xl(p.pi)};WAAR)`, xlInv: (q, p) => `BINOM.INV(${xl(p.n)};${xl(p.pi)};${q})`, xlPdf: (x, p) => `BINOM.DIST(${x};${xl(p.n)};${xl(p.pi)};ONWAAR)`,
    meanTex: 'E[X]=n\\pi', varTex: 'Var[X]=n\\pi(1-\\pi)',
  },
  {
    id: 'pois', label: 'Poisson(λ)', params: [['lam', 'λ (gemiddeld aantal)', 4]], discrete: true, check: (p) => pos(p.lam, 'λ'),
    cdf: (x, p) => D.poisCdf(x, p.lam), sf: (x, p) => D.poisSf(x, p.lam), pdf: (x, p) => D.poisPmf(x, p.lam), inv: (q, p) => D.poisInv(p.lam, q),
    mean: (p) => p.lam, var: (p) => p.lam, span: (p) => [Math.max(0, Math.floor(p.lam - 5 * Math.sqrt(p.lam) - 2)), Math.ceil(p.lam + 5 * Math.sqrt(p.lam) + 3)],
    xlCdf: (x, p) => `POISSON.DIST(${x};${xl(p.lam)};WAAR)`, xlInv: () => '(geen Excel-functie: zoek kleinste k met POISSON.DIST(k;λ;WAAR) >= p)', xlPdf: (x, p) => `POISSON.DIST(${x};${xl(p.lam)};ONWAAR)`,
    meanTex: 'E[X]=\\lambda', varTex: 'Var[X]=\\lambda',
  },
  {
    id: 'hyper', label: 'Hypergeometrisch (N, K, n)', params: [['N', 'N (populatie / lot)', 1000], ['K', 'K (aantal defect in lot)', 50], ['n', 'n (steekproef)', 50]], discrete: true,
    check: (p) => { posInt(p.N, 'N'); posInt(p.K, 'K', 0); posInt(p.n, 'n'); need(p.K <= p.N && p.n <= p.N, 'K en n moeten <= N zijn.'); },
    cdf: (x, p) => D.hyperCdf(x, p.N, p.K, p.n), sf: (x, p) => D.hyperSf(x, p.N, p.K, p.n), pdf: (x, p) => D.hyperPmf(x, p.N, p.K, p.n),
    inv: (q, p) => { let k = Math.max(0, p.n - (p.N - p.K)); while (k < Math.min(p.n, p.K) && D.hyperCdf(k, p.N, p.K, p.n) < q) k++; return k; },
    mean: (p) => (p.n * p.K) / p.N, var: (p) => ((p.n * p.K) / p.N) * (1 - p.K / p.N) * ((p.N - p.n) / (p.N - 1)),
    span: (p) => { const m = (p.n * p.K) / p.N, s = Math.sqrt(Math.max(1e-9, ((p.n * p.K) / p.N) * (1 - p.K / p.N))); return [Math.max(0, Math.floor(m - 5 * s - 2)), Math.min(p.n, p.K, Math.ceil(m + 5 * s + 2))]; },
    xlCdf: (x, p) => `HYPGEOM.DIST(${x};${xl(p.n)};${xl(p.K)};${xl(p.N)};WAAR)`, xlInv: () => '(geen Excel-functie: zoek kleinste k met HYPGEOM.DIST(k;n;K;N;WAAR) >= p)', xlPdf: (x, p) => `HYPGEOM.DIST(${x};${xl(p.n)};${xl(p.K)};${xl(p.N)};ONWAAR)`,
    meanTex: 'E[X]=n\\frac{K}{N}', varTex: 'Var[X]=n\\frac{K}{N}\\left(1-\\frac{K}{N}\\right)\\frac{N-n}{N-1}',
  },
  {
    id: 'bern', label: 'Bernoulli(π)', params: [['pi', 'π (kans op 1)', 0.95]], discrete: true, check: (p) => prob(p.pi, 'π', false),
    cdf: (x, p) => D.binomCdf(x, 1, p.pi), sf: (x, p) => D.binomSf(x, 1, p.pi), pdf: (x, p) => D.binomPmf(x, 1, p.pi), inv: (q, p) => D.binomInv(1, p.pi, q),
    mean: (p) => p.pi, var: (p) => p.pi * (1 - p.pi), span: () => [0, 1],
    xlCdf: (x, p) => `BINOM.DIST(${x};1;${xl(p.pi)};WAAR)`, xlInv: (q, p) => `BINOM.INV(1;${xl(p.pi)};${q})`, xlPdf: (x, p) => `BINOM.DIST(${x};1;${xl(p.pi)};ONWAAR)`,
    meanTex: 'E[X]=\\pi', varTex: 'Var[X]=\\pi(1-\\pi)',
  },
  {
    id: 'expon', label: 'Exponentieel(λ)', params: [['lam', 'λ (rate, per tijdseenheid)', 1]], discrete: false, check: (p) => pos(p.lam, 'λ'),
    cdf: (x, p) => D.expCdf(x, p.lam), sf: (x, p) => D.expSf(x, p.lam), pdf: (x, p) => D.expPdf(x, p.lam), inv: (q, p) => D.expInv(q, p.lam), invRt: (q, p) => -Math.log(q) / p.lam,
    mean: (p) => 1 / p.lam, var: (p) => 1 / p.lam ** 2, span: (p) => [0, 6 / p.lam],
    xlCdf: (x, p) => `EXPON.DIST(${x};${xl(p.lam)};WAAR)`, xlInv: (q, p) => `-LN(1-${q})/${xl(p.lam)}`, xlPdf: (x, p) => `EXPON.DIST(${x};${xl(p.lam)};ONWAAR)`,
    meanTex: 'E[T]=\\frac{1}{\\lambda}', varTex: 'Var[T]=\\frac{1}{\\lambda^2}',
  },
  {
    id: 'unif', label: 'Uniform(a, b)', params: [['a', 'a (minimum)', 0], ['b', 'b (maximum)', 1]], discrete: false, check: (p) => need(p.b > p.a, 'b moet groter zijn dan a.'),
    cdf: (x, p) => D.unifCdf(x, p.a, p.b), sf: (x, p) => 1 - D.unifCdf(x, p.a, p.b), pdf: (x, p) => D.unifPdf(x, p.a, p.b), inv: (q, p) => D.unifInv(q, p.a, p.b), invRt: (q, p) => D.unifInv(1 - q, p.a, p.b),
    mean: (p) => (p.a + p.b) / 2, var: (p) => (p.b - p.a) ** 2 / 12, span: (p) => [p.a - 0.15 * (p.b - p.a), p.b + 0.15 * (p.b - p.a)],
    xlCdf: (x, p) => `(${x}-${xl(p.a)})/(${xl(p.b)}-${xl(p.a)})`, xlInv: (q, p) => `${xl(p.a)}+${q}*(${xl(p.b)}-${xl(p.a)})`,
    meanTex: 'E[X]=\\frac{a+b}{2}', varTex: 'Var[X]=\\frac{(b-a)^2}{12}',
  },
];

function calculator(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('dist', () => run());
  const dsel = f.select('dist', 'Verdeling', dists.map((d) => [d.id, d.label] as [string, string]), 'normal');
  const paramBox = h('div', { class: 'row' });
  const mode = f.seg('mode', 'Wat zoek je?', [['le', 'P(X ≤ x)'], ['ge', 'P(X ≥ x)'], ['ab', 'P(a ≤ X ≤ b)'], ['invL', 'x bij linkerstaart'], ['invR', 'x bij rechterstaart'], ['invC', 'centraal interval']], 'le');
  const xF = f.num('x', 'x', 1.96);
  const aF = f.num('a', 'a', -1.96);
  const bF = f.num('b', 'b', 1.96);
  const pF = f.num('p', 'kans p', 0.05);
  const valRow = row(xF.el, aF.el, bF.el, pF.el);
  // param fields per dist (created once)
  const pfields = new Map<string, { el: HTMLElement; get(): number }>();
  for (const d of dists) for (const [k, lbl, def] of d.params) {
    const key = `${d.id}.${k}`;
    if (!pfields.has(key)) pfields.set(key, f.num(key, lbl, def));
  }
  el.append(card('Verdelingscalculator', row(dsel.el), paramBox, row(mode.el), valRow), out);

  run = live(out, () => {
    const d = dists.find((x) => x.id === dsel.get())!;
    paramBox.replaceChildren(...d.params.map(([k]) => pfields.get(`${d.id}.${k}`)!.el));
    const m = mode.get();
    xF.el.hidden = !(m === 'le' || m === 'ge');
    aF.el.hidden = bF.el.hidden = m !== 'ab';
    pF.el.hidden = !m.startsWith('inv');
    const p: P = {};
    for (const [k] of d.params) p[k] = pfields.get(`${d.id}.${k}`)!.get();
    d.check(p);
    const [s0, s1] = d.span(p);
    const mean = d.mean(p);
    const vr = d.var(p);
    let res: [string, string][] = [];
    let excel: string[] = [];
    let formula: string[] = [];
    let q = '';
    let shade: [number, number][] = [];
    let shadeK: (k: number) => boolean = () => false;
    let vlines: { x: number; label: string }[] = [];
    let answer = '';
    const disc = d.discrete;
    if (m === 'le' || m === 'ge') {
      const x = xF.get();
      if (disc) need(Number.isInteger(x), 'Voor een discrete verdeling moet x een geheel getal zijn.');
      const val = m === 'le' ? d.cdf(x, p) : disc ? d.sf(x - 1, p) : d.sf(x, p);
      q = m === 'le' ? `Gevraagd: \\(P(X \\le ${tx(x)})\\)` : `Gevraagd: \\(P(X \\ge ${tx(x)})\\)`;
      res = [[m === 'le' ? `P(X ≤ ${fmt(x)})` : `P(X ≥ ${fmt(x)})`, fmt(val)], ['in %', pctNl(val)]];
      if (d.id === 'normal') formula = [`z=\\frac{x-\\mu}{\\sigma}=\\frac{${tx(x)}-${tx(p.mu)}}{${tx(p.sigma)}}=${tx((x - p.mu) / p.sigma)}`, m === 'le' ? `P(X\\le x)=\\Phi(z)=${tx(val)}` : `P(X\\ge x)=1-\\Phi(z)=${tx(val)}`];
      else if (disc) formula = [m === 'le' ? `P(X\\le ${x})=\\sum_{k\\le ${x}} P(X=k)=${tx(val)}` : `P(X\\ge ${x})=1-P(X\\le ${x - 1})=${tx(val)}`];
      excel = m === 'le' ? [`=${d.xlCdf(xl(x), p)}`] : [disc ? `=1-${d.xlCdf(xl(x - 1), p)}` : `=1-${d.xlCdf(xl(x), p)}`];
      if (disc && d.xlPdf) excel.push(`P(X = ${xl(x)}): =${d.xlPdf(xl(x), p)}  ->  ${fmt(d.pdf(x, p))}`);
      shade = m === 'le' ? [[s0 - 1e9, x]] : [[x, s1 + 1e9]];
      shadeK = m === 'le' ? (k) => k <= x : (k) => k >= x;
      vlines = [{ x, label: 'x = ' + fmt(x) }];
      answer = `De kans is ${m === 'le' ? `P(X <= ${nl(x)})` : `P(X >= ${nl(x)})`} = ${nl(val)} (${pctNl(val)}).`;
    } else if (m === 'ab') {
      const a = aF.get();
      const b = bF.get();
      need(b >= a, 'b moet groter dan of gelijk aan a zijn.');
      if (disc) need(Number.isInteger(a) && Number.isInteger(b), 'Voor een discrete verdeling moeten a en b gehele getallen zijn.');
      const val = disc ? d.cdf(b, p) - d.cdf(a - 1, p) : d.cdf(b, p) - d.cdf(a, p);
      q = `Gevraagd: \\(P(${tx(a)} \\le X \\le ${tx(b)})\\)`;
      formula = [disc ? `P(a\\le X\\le b)=F(b)-F(a-1)=${tx(d.cdf(b, p))}-${tx(d.cdf(a - 1, p))}=${tx(val)}` : `P(a\\le X\\le b)=F(b)-F(a)=${tx(d.cdf(b, p))}-${tx(d.cdf(a, p))}=${tx(val)}`];
      res = [['P(a ≤ X ≤ b)', fmt(val)], ['in %', pctNl(val)], ['P(buiten [a, b])', fmt(1 - val)]];
      excel = [disc ? `=${d.xlCdf(xl(b), p)}-${d.xlCdf(xl(a - 1), p)}` : `=${d.xlCdf(xl(b), p)}-${d.xlCdf(xl(a), p)}`];
      shade = [[a, b]];
      shadeK = (k) => k >= a && k <= b;
      vlines = [{ x: a, label: 'a' }, { x: b, label: 'b' }];
      answer = `P(${nl(a)} <= X <= ${nl(b)}) = ${nl(val)} (${pctNl(val)}).`;
    } else {
      const pp = pF.get();
      prob(pp, 'p');
      if (m === 'invL') {
        const x = d.inv(pp, p);
        q = `Gevraagd: \\(x\\) zodat \\(P(X \\le x) = ${tx(pp)}\\)${disc ? ' (kleinste x met P(X ≤ x) ≥ p)' : ''}`;
        res = [['x', fmt(x)]];
        if (disc) res.push(['P(X ≤ x) werkelijk', fmt(d.cdf(x, p))]);
        excel = [`=${d.xlInv(xl(pp), p)}`];
        shade = [[s0 - 1e9, x]];
        shadeK = (k) => k <= x;
        vlines = [{ x, label: 'x = ' + fmt(x) }];
        answer = `De waarde x met een linkerstaartkans van ${pctNl(pp)} is x = ${nl(x)}.`;
      } else if (m === 'invR') {
        const x = disc ? d.inv(1 - pp, p) + 1 : d.invRt!(pp, p);
        q = `Gevraagd: \\(x\\) zodat \\(P(X ${disc ? '\\ge' : '>'} x) = ${tx(pp)}\\)${disc ? ' (kleinste x met P(X ≥ x) ≤ p)' : ''}`;
        res = [['x', fmt(x)]];
        if (disc) res.push(['P(X ≥ x) werkelijk', fmt(d.sf(x - 1, p))]);
        excel = [disc ? `=${d.xlInv(xl(1 - pp), p)}+1` : `=${d.xlInv(xl(1 - pp), p)}`];
        if (d.id === 't') excel.push(`=T.INV(${xl(1 - pp)};${xl(p.df)})  (= -T.INV(${xl(pp)};${xl(p.df)}))`);
        if (d.id === 'chi2') excel = [`=CHISQ.INV.RT(${xl(pp)};${xl(p.df)})`];
        if (d.id === 'f') excel = [`=F.INV.RT(${xl(pp)};${xl(p.d1)};${xl(p.d2)})`, `=1/F.INV(${xl(pp)};${xl(p.d2)};${xl(p.d1)})`];
        shade = [[x, s1 + 1e9]];
        shadeK = (k) => k >= x;
        vlines = [{ x, label: 'x = ' + fmt(x) }];
        answer = `De waarde x met een rechterstaartkans van ${pctNl(pp)} is x = ${nl(x)}.`;
      } else {
        need(!disc, 'Centraal interval: kies een continue verdeling.');
        const lo = d.inv(pp / 2, p);
        const hi = d.invRt!(pp / 2, p);
        q = `Gevraagd: centraal interval met \\(${tx(1 - pp)}\\) kans in het midden (\\(${tx(pp / 2)}\\) in elke staart)`;
        res = [['ondergrens', fmt(lo)], ['bovengrens', fmt(hi)]];
        excel = [`=${d.xlInv(xl(pp / 2), p)}`, `=${d.xlInv(xl(1 - pp / 2), p)}`];
        shade = [[lo, hi]];
        vlines = [{ x: lo, label: fmt(lo) }, { x: hi, label: fmt(hi) }];
        answer = `${pctNl(1 - pp)} van de waarden ligt tussen ${nl(lo)} en ${nl(hi)}.`;
      }
    }
    res.push(['Verwachtingswaarde E[X]', fmt(mean)], ['Variantie Var[X]', fmt(vr)], ['Standaardafwijking', fmt(Math.sqrt(vr))]);
    const plot = densityPlot({ pdf: (x) => d.pdf(x, p), x0: s0, x1: s1, shade, vlines, discrete: disc ? { k0: s0, k1: s1, shadeK } : undefined });
    return resultPanel({
      question: [q, `Verdeling: ${d.label}`],
      formula: [...formula, d.meanTex + ',\\quad ' + d.varTex],
      result: res,
      excel,
      answer,
      extra: chartBox(plot),
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

function sigmaHelper(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('sigtail', () => run());
  const what = f.seg('what', 'Zoek', [['sigma', 'σ (gemiddelde gekend)'], ['mu', 'μ (σ gekend)']], 'sigma');
  const mu = f.num('mu', 'μ (gemiddelde)', 820);
  const sg = f.num('sigma', 'σ', 10);
  const c = f.num('c', 'grenswaarde c', 720);
  const tail = f.seg('tail', 'Staart', [['left', 'P(X < c)'], ['right', 'P(X > c)']], 'left');
  const p = f.num('p', 'staartkans p', 0.05);
  el.append(card('σ (of μ) uit een staartkans', h('p', { class: 'muted' }, 'Voorbeeld examen vraag 6: gemiddelde 820 µF, 5% niet-conform onder 720 µF -> σ = 60,80, Var = 3696.'), row(what.el), row(mu.el, sg.el, c.el, tail.el, p.el)), out);
  run = live(out, () => {
    const w = what.get();
    mu.el.hidden = w === 'mu';
    sg.el.hidden = w === 'sigma';
    const cc = c.get();
    const pp = prob(p.get(), 'p');
    const left = tail.get() === 'left';
    const z = left ? D.normInv(pp) : D.normInvRt(pp);
    const zTex = left ? `z_{${tx(pp)}}` : `z_{${tx(1 - pp)}}`;
    const xlz = left ? `NORM.S.INV(${xl(pp)})` : `NORM.S.INV(${xl(1 - pp)})`;
    if (w === 'sigma') {
      const m = mu.get();
      const sigma = (cc - m) / z;
      need(sigma > 0, `Inconsistent: met μ = ${fmt(m)} moet c ${left ? 'kleiner' : 'groter'} dan μ zijn voor een ${left ? 'linker' : 'rechter'}staartkans < 50%.`);
      return resultPanel({
        question: `Gegeven \\(\\mu=${tx(m)}\\) en \\(P(X ${left ? '<' : '>'} ${tx(cc)}) = ${tx(pp)}\\). Zoek \\(\\sigma\\) en \\(Var[X]\\).`,
        formula: [`P(X ${left ? '<' : '>'} c) = p \\Rightarrow \\frac{c-\\mu}{\\sigma} = ${zTex} \\Rightarrow \\sigma = \\frac{c-\\mu}{${zTex}}`],
        substituted: [`\\sigma = \\frac{${tx(cc)}-${tx(m)}}{${tx(z)}} = ${tx(sigma)}`, `Var[X]=\\sigma^2=${tx(sigma * sigma)}`],
        result: [['z', fmt(z)], ['σ', fmt(sigma)], ['Var[X] = σ²', fmt(sigma * sigma)]],
        excel: [`z: =${xlz}`, `σ: =(${xl(cc)}-${xl(m)})/${xlz}`, `Var: =((${xl(cc)}-${xl(m)})/${xlz})^2`],
        answer: `Uit P(X ${left ? '<' : '>'} ${nl(cc)}) = ${pctNl(pp)} volgt z = ${nl(z)}, dus sigma = (${nl(cc)} - ${nl(m)}) / ${nl(z)} = ${nl(sigma)}. De variantie is sigma^2 = ${nl(sigma * sigma)}.`,
        extra: chartBox(densityPlot({ pdf: (x) => D.normPdf(x, m, sigma), x0: m - 4 * sigma, x1: m + 4 * sigma, shade: [left ? [m - 1e9, cc] : [cc, m + 1e9]], vlines: [{ x: cc, label: 'c' }, { x: m, label: 'μ' }] })),
      });
    }
    const s = pos(sg.get(), 'σ');
    const m = cc - z * s;
    return resultPanel({
      question: `Gegeven \\(\\sigma=${tx(s)}\\) en \\(P(X ${left ? '<' : '>'} ${tx(cc)}) = ${tx(pp)}\\). Zoek \\(\\mu\\).`,
      formula: [`\\mu = c - ${zTex}\\,\\sigma`],
      substituted: [`\\mu = ${tx(cc)} - (${tx(z)})(${tx(s)}) = ${tx(m)}`],
      result: [['z', fmt(z)], ['μ', fmt(m)]],
      excel: [`=${xl(cc)}-${xlz}*${xl(s)}`],
      answer: `Om hoogstens ${pctNl(pp)} ${left ? 'onder' : 'boven'} ${nl(cc)} te hebben, moet het gemiddelde op mu = ${nl(cc)} - (${nl(z)})(${nl(s)}) = ${nl(m)} liggen.`,
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

function whichDist(el: HTMLElement) {
  el.append(
    card(
      'Welke verdeling? Tellen of meten',
      table(
        ['Situatie', 'Verdeling', 'E[X]', 'Var[X]', 'Excel'],
        [
          ['Tellen: 1 poging, succes ja/nee (conform?)', 'Bernoulli(π)', 'π', 'π(1-π)', 'BINOM.DIST(x;1;π;WAAR)'],
          ['Tellen: aantal successen in n onafhankelijke pogingen (defecten in een lot, met teruglegging of N groot)', 'Binomiaal(n, π)', 'nπ', 'nπ(1-π)', 'BINOM.DIST(x;n;π;WAAR)'],
          ['Tellen: steekproef zonder teruglegging uit klein lot N met K defecten', 'Hypergeometrisch', 'nK/N', 'n(K/N)(1-K/N)(N-n)/(N-1)', 'HYPGEOM.DIST(x;n;K;N;WAAR)'],
          ['Tellen: aantal gebeurtenissen per tijd/ruimte-eenheid (bestellingen per week, fouten per m²)', 'Poisson(λ)', 'λ', 'λ', 'POISSON.DIST(x;λ;WAAR)'],
          ['Meten: tijd tussen gebeurtenissen van een Poisson-proces', 'Exponentieel(λ)', '1/λ', '1/λ²', 'EXPON.DIST(x;λ;WAAR)'],
          ['Meten: elke waarde in [a, b] even waarschijnlijk', 'Uniform(a, b)', '(a+b)/2', '(b-a)²/12', '(x-a)/(b-a)'],
          ['Meten: som van veel kleine invloeden (afmeting, capaciteit, gewicht)', 'Normaal(μ, σ)', 'μ', 'σ²', 'NORM.DIST(x;μ;σ;WAAR)'],
          ['Toetsen: gemiddelde met geschatte s', 't(n-1)', '0', 'ν/(ν-2)', 'T.DIST, T.INV'],
          ['Toetsen: variantie (n-1)s²/σ²', 'χ²(n-1)', 'ν', '2ν', 'CHISQ.DIST, CHISQ.INV'],
          ['Toetsen: verhouding van twee varianties', 'F(n1-1, n2-1)', 'd2/(d2-2)', '-', 'F.DIST, F.INV'],
        ],
      ),
      h('p', { class: 'muted' }, 'Vuistregels: binomiaal ~ Poisson als n groot en π klein (λ = nπ); binomiaal ~ normaal als nπ ≥ 5 en n(1-π) ≥ 5; hypergeometrisch ~ binomiaal als n/N < 10%. Examen vraag 6: B Poisson, T exponentieel, C normaal, X Bernoulli, D binomiaal.'),
    ),
  );
}

export const verdelingen: ModuleDef = {
  id: 'verdelingen',
  title: 'Verdelingen',
  group: 'Fase 1',
  keywords: ['verdeling', 'normaal', 'binomiaal', 'poisson', 'exponentieel', 'uniform', 'hypergeometrisch', 'bernoulli', 't-verdeling', 'chi', 'F', 'kans', 'kwantiel', 'inverse', 'staartkans', 'z-waarde', 'distribution'],
  subs: [
    ['calc', 'Verdelingscalculator', 'cdf kans inverse kwantiel'],
    ['sigma', 'Sigma uit staartkans', 'sigma variantie 720 820 vraag 6'],
    ['welke', 'Welke verdeling? (tellen vs meten)', 'tellen meten E[X] Var[X]'],
  ],
  mount(el) {
    moduleHead(el, 'Verdelingen', 'Kansen, kwantielen, E[X] en Var[X] voor alle verdelingen uit de cursus, met grafiek en Excel-formule.');
    const t = tabs('verdelingen', [
      { id: 'calc', label: 'Calculator', build: calculator },
      { id: 'sigma', label: 'σ uit staartkans', build: sigmaHelper },
      { id: 'welke', label: 'Welke verdeling?', build: whichDist },
    ], el);
    return { route: (sub, params) => sub && t.show(sub, params) };
  },
};

