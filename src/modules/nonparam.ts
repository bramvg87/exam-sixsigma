// M12 Niet-parametrische toetsen en goodness of fit (Ottoy test recipes).
import { h, fmt, tx, xl, nl, pct, parseNum } from '../ui/core.ts';
import { Form, row, card, note } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { barChart, chartBox } from '../components/charts.ts';
import { chi2InvRt, normInv } from '../stats/dist.ts';
import { ranks } from '../stats/desc.ts';
import { gof, mannWhitney, wilcoxonSigned, runsTest } from '../calc/misc.ts';
import { classProbs, midpoints, mergeSmall, type GofDist, type GofClass } from '../calc/gofclasses.ts';
import { live, need, moduleHead, prob, pos } from './util.ts';
import { tabs, type ModuleDef } from './types.ts';
import G from '../../testdata/golden_values.json';

const decide = (p: number, a: number) => (p < a ? { text: `Verwerp H₀ (p = ${fmt(p)} < α = ${fmt(a)})`, kind: 'reject' as const } : { text: `H₀ niet verwerpen (p = ${fmt(p)} ≥ α = ${fmt(a)})`, kind: 'accept' as const });
const pTxt = (p: number) => `${fmt(p)} (${pct(p)})`;

// ---------- 1. Goodness of fit ----------
const DISTS: [GofDist, string][] = [
  ['pois', 'Poisson'],
  ['norm', 'Normaal'],
  ['exp', 'Exponentieel'],
  ['unif', 'Uniform [a, b]'],
  ['equal', 'Gelijke kansen (discreet uniform)'],
  ['custom', 'Eigen kansen (kolom p)'],
];
function gofTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('npgof', () => run());
  const dist = f.select('dist', 'Verdeling onder H₀', DISTS, 'pois');
  const est = f.seg('est', 'Parameters', [['est', 'Schatten uit de data'], ['given', 'Gegeven']], 'est');
  const lam = f.num('lam', 'λ', 2.1);
  const mu = f.num('mu', 'μ', 10);
  const sd = f.num('sd', 'σ', 0.3);
  const a = f.num('a', 'a (ondergrens)', 0);
  const b = f.num('b', 'b (bovengrens)', 1);
  const alpha = f.num('alpha', 'α', 0.05);
  const merge = f.check('merge', 'Voeg aangrenzende klassen met verwachte frequentie e < 5 automatisch samen', true);
  const g = (G as any).chi2_gof_poisson;
  const H = ['x (waarde k of bovengrens klasse)', 'O (waargenomen)', 'p (enkel bij eigen kansen)'];
  const EX = {
    pois: { headers: H, rows: g.observed.map((o: number, k: number) => [k, o]) },
    norm: { headers: H, rows: [[9.6, 6], [9.8, 14], [10, 28], [10.2, 31], [10.4, 15], ['', 6]] },
    die: { headers: H, rows: [[1, 16], [2, 22], [3, 18], [4, 25], [5, 14], [6, 25]] },
  };
  const grid = new DataGrid({
    key: 'np-gof',
    cols: 3,
    rows: 14,
    headers: H,
    example: () => EX.pois,
    onChange: () => run(),
    height: '300px',
  });
  el.append(
    card(
      'Chi-kwadraat goodness of fit-toets',
      h('p', { class: 'muted' }, 'Kolom x: bij Poisson de waarden k (opeenvolgend; de eerste klasse is P(X ≤ k), de laatste P(X ≥ k)); bij normaal, exponentieel en uniform de bovengrens van elke klasse (eerste klasse open naar onder, laatste klasse open naar boven, laatste x mag leeg). Kolom O: waargenomen aantallen. df = aantal klassen - geschatte parameters - 1.'),
      row(
        h('button', { type: 'button', class: 'btn btn-sm', onclick: () => (grid.setData(EX.pois.headers, EX.pois.rows), f.setValues({ dist: 'pois', est: 'est' })) }, 'Voorbeeld Poisson (cursus, 0..5+)'),
        h('button', { type: 'button', class: 'btn btn-sm', onclick: () => (grid.setData(EX.norm.headers, EX.norm.rows), f.setValues({ dist: 'norm', est: 'est' })) }, 'Voorbeeld normaal (bovengrenzen)'),
        h('button', { type: 'button', class: 'btn btn-sm', onclick: () => (grid.setData(EX.die.headers, EX.die.rows), f.setValues({ dist: 'equal' })) }, 'Voorbeeld dobbelsteen (gelijke kansen)'),
      ),
      grid.el,
      row(dist.el, est.el, alpha.el),
      row(lam.el, mu.el, sd.el, a.el, b.el),
      row(merge.el),
    ),
    out,
  );
  run = live(out, () => {
    const D = dist.get();
    const estimate = est.get() === 'est' && ['pois', 'norm', 'exp'].includes(D);
    est.el.hidden = !['pois', 'norm', 'exp'].includes(D);
    lam.el.hidden = !(D === 'pois' || D === 'exp') || estimate;
    mu.el.hidden = sd.el.hidden = D !== 'norm' || estimate;
    a.el.hidden = b.el.hidden = D !== 'unif';
    const al = prob(alpha.get(), 'α');
    const raw = grid.getRaw();
    need(raw.length >= 2, 'Geef minstens 2 klassen (rijen) met waargenomen aantallen.');
    const xs: number[] = [], O: number[] = [], P: number[] = [], labels: string[] = [];
    raw.forEach((r, i) => {
      const o = parseNum(r[1] ?? '');
      need(o !== null && Number.isFinite(o) && o >= 0, `Rij ${i + 1}: O moet een getal ≥ 0 zijn.`);
      O.push(o!);
      const xv = parseNum(r[0] ?? '');
      xs.push(xv === null || Number.isNaN(xv) ? NaN : xv);
      labels.push((r[0] ?? '').trim() || (i === raw.length - 1 ? 'rest' : `klasse ${i + 1}`));
      if (D === 'custom') {
        const pv = parseNum(r[2] ?? '');
        need(pv !== null && Number.isFinite(pv) && pv >= 0, `Rij ${i + 1}: p moet een getal ≥ 0 zijn.`);
        P.push(pv!);
      }
    });
    const n = O.reduce((s, v) => s + v, 0);
    need(n > 0, 'De som van de waargenomen aantallen moet > 0 zijn.');
    const m = O.length;
    let k = 0;
    const par: any = {};
    let parTxt = '';
    let parTex = '';
    let lbl = labels.slice();
    if (D === 'pois') {
      need(xs.every((v, i) => Number.isInteger(v) && (i === 0 || v === xs[i - 1] + 1) && v >= 0), 'Bij Poisson moet kolom x opeenvolgende gehele getallen ≥ 0 bevatten (0, 1, 2, ...).');
      par.lam = estimate ? xs.reduce((s, v, i) => s + v * O[i], 0) / n : pos(lam.get(), 'λ');
      if (estimate) k = 1;
      parTxt = `λ = ${fmt(par.lam)}${estimate ? ' (geschat: Σ k·O/n)' : ''}`;
      parTex = `\\hat\\lambda=\\frac{\\sum k\\,O_k}{n}=${tx(par.lam)}`;
      lbl = xs.map((v, i) => (i === m - 1 ? `≥ ${v}` : i === 0 && v > 0 ? `≤ ${v}` : String(v)));
    } else if (D === 'norm' || D === 'exp' || D === 'unif') {
      need(xs.slice(0, -1).every(Number.isFinite), 'Kolom x moet de bovengrenzen van de klassen bevatten (enkel de laatste mag leeg).');
      const ub = xs.slice(0, -1);
      need(ub.every((v, i) => i === 0 || v > ub[i - 1]), 'De bovengrenzen moeten stijgend zijn.');
      const mids = midpoints(xs.map((v, i) => (i === m - 1 && !Number.isFinite(v) ? NaN : v)), D === 'exp' ? 0 : undefined);
      if (D === 'norm') {
        if (estimate) {
          const mb = mids.reduce((s, v, i) => s + v * O[i], 0) / n;
          const vv = mids.reduce((s, v, i) => s + O[i] * (v - mb) ** 2, 0) / (n - 1);
          par.mu = mb;
          par.sd = Math.sqrt(vv);
          k = 2;
        } else {
          par.mu = mu.get();
          par.sd = pos(sd.get(), 'σ');
        }
        parTxt = `μ = ${fmt(par.mu)}, σ = ${fmt(par.sd)}${estimate ? ' (geschat uit klassenmiddens)' : ''}`;
        parTex = `\\hat\\mu=\\frac{\\sum m_iO_i}{n}=${tx(par.mu)},\\quad \\hat\\sigma=\\sqrt{\\frac{\\sum O_i(m_i-\\hat\\mu)^2}{n-1}}=${tx(par.sd)}`;
      } else if (D === 'exp') {
        need(ub.every((v) => v > 0), 'Bij exponentieel moeten de bovengrenzen > 0 zijn (eerste klasse start bij 0).');
        par.lam = estimate ? n / mids.reduce((s, v, i) => s + v * O[i], 0) : pos(lam.get(), 'λ');
        if (estimate) k = 1;
        parTxt = `λ = ${fmt(par.lam)}${estimate ? ' (geschat: 1 / gemiddelde van de klassenmiddens)' : ''}`;
        parTex = `\\hat\\lambda=\\frac{1}{\\bar m}=${tx(par.lam)}`;
      } else {
        par.a = a.get();
        par.b = b.get();
        need(par.b > par.a, 'b moet groter zijn dan a.');
        parTxt = `a = ${fmt(par.a)}, b = ${fmt(par.b)}`;
      }
      lbl = xs.map((v, i) => (i === 0 ? `≤ ${fmt(v)}` : i === m - 1 ? `> ${fmt(xs[i - 1])}` : `${fmt(xs[i - 1])} - ${fmt(v)}`));
    } else if (D === 'custom') {
      need(P.reduce((s, v) => s + v, 0) > 0, 'Geef kansen p (of verwachte aantallen) in de derde kolom.');
      par.p = P;
    }
    const probs = classProbs(D, xs, par);
    let cls: GofClass[] = probs.map((p, i) => ({ label: lbl[i], O: O[i], p, E: n * p }));
    need(cls.every((c) => c.E > 0), 'Een klasse heeft verwachte frequentie 0; voeg klassen samen of pas de parameters aan.');
    const small = cls.filter((c) => c.E < 5).length;
    const merged = merge.get() && small > 0;
    if (merged) cls = mergeSmall(cls, 5);
    need(cls.length - k - 1 >= 1, `Te weinig klassen: df = ${cls.length} - ${k} - 1 < 1.`);
    const r = gof(cls.map((c) => c.O), cls.map((c) => c.E), k);
    const crit = chi2InvRt(al, r.df);
    const contrib = cls.map((c) => (c.O - c.E) ** 2 / c.E);
    const tbl = table(['klasse', 'O', 'p', 'E = n·p', '(O - E)²/E'], cls.map((c, i) => [c.label, fmt(c.O), fmt(c.p), fmt(c.E), fmt(contrib[i])]).concat([['totaal', fmt(n), fmt(cls.reduce((s, c) => s + c.p, 0)), fmt(n), fmt(r.chi2)]]));
    const distNl = ({ pois: 'Poisson-verdeling', norm: 'normale verdeling', exp: 'exponentiële verdeling', unif: 'uniforme verdeling', equal: 'discreet uniforme verdeling', custom: 'opgegeven verdeling' } as Record<GofDist, string>)[D];
    const warn: string[] = [];
    if (r.minE < 5) warn.push(`Kleinste verwachte frequentie is ${fmt(r.minE)} < 5: de chi-kwadraatbenadering is onbetrouwbaar. Vink samenvoegen aan.`);
    if (merged) warn.push(`${small} klasse(n) met e < 5 werden samengevoegd met een buurklasse; nu ${cls.length} klassen.`);
    return resultPanel({
      question: [`\\(H_0\\): de data volgen een ${distNl}${parTxt ? ` (${parTxt})` : ''}; \\(H_a\\): niet. \\(\\alpha=${tx(al)}\\)`],
      formula: ['\\chi^2=\\sum_i\\frac{(O_i-E_i)^2}{E_i},\\quad E_i=n\\,p_i,\\quad df=\\#\\text{klassen}-\\#\\text{geschatte parameters}-1'].concat(parTex ? [parTex] : []),
      substituted: [`\\chi^2=${cls.slice(0, 4).map((c) => `\\frac{(${tx(c.O)}-${tx(c.E)})^2}{${tx(c.E)}}`).join('+')}${cls.length > 4 ? '+\\dots' : ''}=${tx(r.chi2)},\\quad df=${cls.length}-${k}-1=${r.df}`],
      result: [['χ²', fmt(r.chi2)], ['df', String(r.df)], ['p-waarde', pTxt(r.p)], [`kritieke waarde χ²(${r.df}; 1-α)`, fmt(crit)], ['n', fmt(n)]],
      decision: decide(r.p, al),
      warnings: warn,
      excel: [`p-waarde: =CHISQ.DIST.RT(${xl(r.chi2)};${r.df})`, `kritieke waarde: =CHISQ.INV.RT(${xl(al)};${r.df})`].concat(D === 'pois' ? [`p_k: =POISSON.DIST(k;${xl(par.lam)};ONWAAR), laatste klasse: =1-POISSON.DIST(${xs[m - 1] - 1};${xl(par.lam)};WAAR)`] : D === 'norm' ? [`p_i: =NORM.DIST(boven;${xl(par.mu)};${xl(par.sd)};WAAR)-NORM.DIST(onder;${xl(par.mu)};${xl(par.sd)};WAAR)`] : D === 'exp' ? [`p_i: =EXPON.DIST(boven;${xl(par.lam)};WAAR)-EXPON.DIST(onder;${xl(par.lam)};WAAR)`] : []).concat(['Let op: CHISQ.TEST(O;E) gebruikt df = k - 1 en houdt geen rekening met geschatte parameters.']),
      answer: `De chi-kwadraat goodness of fit-toets geeft chi2 = ${nl(r.chi2)} met df = ${cls.length} - ${k} - 1 = ${r.df} (p = ${nl(r.p)}). ${r.p < al ? `Omdat p < ${nl(al)} verwerpen we H0: de data volgen geen ${distNl}.` : `Omdat p >= ${nl(al)} verwerpen we H0 niet: de ${distNl}${parTxt ? ` met ${parTxt}` : ''} past goed bij de data.`}${k ? ` Er ${k === 1 ? 'werd 1 parameter' : `werden ${k} parameters`} geschat, wat het aantal vrijheidsgraden verlaagt.` : ''}`,
      extra: [card('Klassentabel', tbl), chartBox(barChart(cls.map((c) => c.label), cls.map((c) => c.O), { ylabel: 'O (balk) / E (zie tabel)' }))],
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- two-column helpers ----------
function twoCols(grid: DataGrid, paired: boolean) {
  const cols = grid.getColumns();
  if (paired) {
    const m = grid.getMatrix().filter((r) => r[0] !== null && r[0] !== undefined && r[1] !== null && r[1] !== undefined) as number[][];
    need(m.length >= 2, 'Geef minstens 2 paren in de eerste twee kolommen.');
    return { a: m.map((r) => r[0]), b: m.map((r) => r[1]), na: cols[0]?.name ?? 'x1', nb: cols[1]?.name ?? 'x2' };
  }
  const f = cols.slice(0, 2);
  need(f.length === 2 && f[0].values.length >= 1 && f[1].values.length >= 1, 'Geef twee kolommen met data (groep 1 en groep 2).');
  return { a: f[0].values, b: f[1].values, na: f[0].name, nb: f[1].name };
}

// ---------- 2. Mann-Whitney ----------
function mwTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('npmw', () => run());
  const alpha = f.num('alpha', 'α', 0.05);
  const g = (G as any).two_sample;
  const grid = new DataGrid({ key: 'np-mw', cols: 2, headers: ['A', 'B'], example: () => ({ headers: ['A', 'B'], rows: Array.from({ length: Math.max(g.A.length, g.B.length) }, (_, i) => [g.A[i] ?? '', g.B[i] ?? '']) }), onChange: () => run(), height: '300px' });
  el.append(card('Wilcoxon-Mann-Whitney toets (rangsomtoets, twee onafhankelijke steekproeven)', h('p', { class: 'muted' }, 'Twee kolommen, ongelijke lengte toegelaten. H₀: beide groepen komen uit dezelfde verdeling (zelfde mediaan). Normale benadering met continuïteitscorrectie en tie-correctie.'), grid.el, row(alpha.el)), out);
  run = live(out, () => {
    const al = prob(alpha.get(), 'α');
    const { a, b, na, nb } = twoCols(grid, false);
    need(a.length + b.length >= 4, 'Te weinig waarnemingen.');
    const r = mannWhitney(a, b);
    const n1 = a.length, n2 = b.length, N = n1 + n2;
    const tie = new Map<number, number>();
    ranks([...a, ...b]).forEach((v) => tie.set(v, (tie.get(v) ?? 0) + 1));
    let ts = 0;
    tie.forEach((t) => (ts += t ** 3 - t));
    const sdU = Math.sqrt(((n1 * n2) / 12) * (N + 1 - ts / (N * (N - 1))));
    const warn = n1 < 8 || n2 < 8 ? ['Kleine steekproeven (n < 8): gebruik bij voorkeur de exacte tabel van de Mann-Whitney U.'] : [];
    return resultPanel({
      question: [`\\(H_0\\): ${na} en ${nb} hebben dezelfde verdeling; \\(H_a\\): verschillende ligging (tweezijdig), \\(\\alpha=${tx(al)}\\)`],
      formula: [
        'W=\\sum R_{1i},\\quad U_1=W-\\frac{n_1(n_1+1)}{2},\\quad U_2=n_1n_2-U_1,\\quad U=\\min(U_1,U_2)',
        'E[W]=\\frac{n_1(N+1)}{2},\\quad Var[W]=\\frac{n_1n_2(N+1)}{12},\\quad z=\\frac{|U_1-\\frac{n_1n_2}{2}|-0{,}5}{\\sigma_U}',
      ],
      substituted: [`W=${tx(r.W)},\\quad U_1=${tx(r.W)}-\\frac{${n1}\\cdot ${n1 + 1}}{2}=${tx(r.U1)},\\quad U_2=${n1}\\cdot ${n2}-${tx(r.U1)}=${tx(r.U2)}`, `z=\\frac{|${tx(r.U1)}-${tx((n1 * n2) / 2)}|-0{,}5}{${tx(sdU)}}=${tx(r.z)}`],
      result: [['n₁ ; n₂', `${n1} ; ${n2}`], ['W (rangsom groep 1)', fmt(r.W)], ['E[W] ; Var[W] (zonder ties)', `${fmt(r.EW)} ; ${fmt(r.VarW)}`], ['U₁ ; U₂', `${fmt(r.U1)} ; ${fmt(r.U2)}`], ['U = min(U₁, U₂) (tabelwaarde)', fmt(Math.min(r.U1, r.U2))], ['σ_U (met tie-correctie)', fmt(sdU)], ['z (met continuïteitscorrectie)', fmt(r.z)], ['p-waarde (tweezijdig)', pTxt(r.p)]],
      decision: decide(r.p, al),
      warnings: warn,
      excel: [`rangen: =RANK.AVG(A2;$A$2:$B$${N + 1};1) over beide kolommen samen`, `z: =(ABS(${xl(r.U1)}-${xl((n1 * n2) / 2)})-0,5)/SQRT(${n1}*${n2}*(${N}+1)/12)`, `p: =2*(1-NORM.S.DIST(${xl(r.z)};WAAR))`],
      answer: `Met de Wilcoxon-Mann-Whitney toets is de rangsom van ${na} W = ${nl(r.W)} (verwacht ${nl(r.EW)}), dus U = min(U1, U2) = ${nl(Math.min(r.U1, r.U2))} en z = ${nl(r.z)} met continuïteitscorrectie, p = ${nl(r.p)}. ${r.p < al ? `Omdat p < ${nl(al)} verwerpen we H0: de ligging van beide groepen verschilt significant.` : `Omdat p >= ${nl(al)} verwerpen we H0 niet: er is geen significant verschil in ligging tussen beide groepen.`} Deze toets veronderstelt geen normaliteit.`,
    });
  });
  run();
}

// ---------- 3. Wilcoxon signed ranks ----------
function wsrTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('npwsr', () => run());
  const alpha = f.num('alpha', 'α', 0.05);
  const g = (G as any).two_sample;
  const grid = new DataGrid({ key: 'np-wsr', cols: 2, headers: ['x1', 'x2'], example: () => ({ headers: ['x1', 'x2'], rows: g.paired_x1.map((v: number, i: number) => [v, g.paired_x2[i]]) }), onChange: () => run(), height: '300px' });
  el.append(card('Wilcoxon rangtekentoets (signed rank test, gepaarde waarnemingen)', h('p', { class: 'muted' }, 'Twee kolommen met gepaarde waarnemingen. Verschillen d = x1 - x2; nulverschillen worden weggelaten. H₀: mediaan van de verschillen = 0.'), grid.el, row(alpha.el)), out);
  run = live(out, () => {
    const al = prob(alpha.get(), 'α');
    const { a, b } = twoCols(grid, true);
    const r = wilcoxonSigned(a, b);
    need(r.n >= 2, 'Minstens 2 verschillen ≠ 0 nodig.');
    const d = a.map((x, i) => x - b[i]);
    const nz = d.filter((v) => v !== 0);
    const rk = ranks(nz.map(Math.abs));
    let j = 0;
    const rows = d.map((v, i) => {
      if (v === 0) return [String(i + 1), fmt(a[i]), fmt(b[i]), '0', '-', '-'];
      const rr = rk[j++];
      return [String(i + 1), fmt(a[i]), fmt(b[i]), fmt(v), fmt(rr), v > 0 ? '+' + fmt(rr) : '-' + fmt(rr)];
    });
    return resultPanel({
      question: [`\\(H_0\\): mediaan van \\(d=x_1-x_2\\) is 0; \\(H_a\\): \\(\\neq 0\\), \\(\\alpha=${tx(al)}\\)`],
      formula: ['T^+=\\sum_{d_i>0}R_i,\\quad T=\\min(T^+,T^-),\\quad \\mu_T=\\frac{n(n+1)}{4},\\quad \\sigma_T=\\sqrt{\\frac{n(n+1)(2n+1)}{24}}', 'z=\\frac{|T^+-\\mu_T|-0{,}5}{\\sigma_T}'],
      substituted: [`T^+=${tx(r.Tplus)},\\ T^-=${tx(r.Tminus)},\\ \\mu_T=\\frac{${r.n}\\cdot ${r.n + 1}}{4}=${tx(r.mu)},\\ \\sigma_T=${tx(r.sd)}`, `z=\\frac{|${tx(r.Tplus)}-${tx(r.mu)}|-0{,}5}{${tx(r.sd)}}=${tx(r.z)}`],
      result: [['n (verschillen ≠ 0)', String(r.n)], ['T⁺ ; T⁻', `${fmt(r.Tplus)} ; ${fmt(r.Tminus)}`], ['T = min(T⁺, T⁻)', fmt(r.T)], ['μ_T ; σ_T', `${fmt(r.mu)} ; ${fmt(r.sd)}`], ['z (met continuïteitscorrectie)', fmt(r.z)], ['p-waarde (tweezijdig)', pTxt(r.p)]],
      decision: decide(r.p, al),
      warnings: r.n < 10 ? ['Kleine n (< 10): vergelijk T bij voorkeur met de exacte kritieke waarde uit de tabel van de rangtekentoets.'] : [],
      excel: ['verschil: =A2-B2 ; rang: =RANK.AVG(ABS(C2);ABS($C$2:$C$11);1) (matrixformule)', `z: =(ABS(${xl(r.Tplus)}-${xl(r.mu)})-0,5)/SQRT(${r.n}*(${r.n}+1)*(2*${r.n}+1)/24)`, `p: =2*(1-NORM.S.DIST(${xl(r.z)};WAAR))`],
      answer: `Met de Wilcoxon rangtekentoets op ${r.n} verschillen is T+ = ${nl(r.Tplus)} en T- = ${nl(r.Tminus)}, dus T = ${nl(r.T)} (verwacht ${nl(r.mu)}). Dit geeft z = ${nl(r.z)} en p = ${nl(r.p)}. ${r.p < al ? `Omdat p < ${nl(al)} verwerpen we H0: er is een significant verschil tussen beide metingen.` : `Omdat p >= ${nl(al)} verwerpen we H0 niet: geen significant verschil.`} De toets is het niet-parametrische alternatief voor de gepaarde t-toets.`,
      extra: card('Rangtabel', table(['#', 'x1', 'x2', 'd', 'rang |d|', 'rang met teken'], rows)),
    });
  });
  run();
}

// ---------- 4. Runs test ----------
function runsTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('npruns', () => run());
  const alpha = f.num('alpha', 'α', 0.05);
  const g = (G as any).two_sample;
  const grid = new DataGrid({ key: 'np-runs', cols: 1, headers: ['waarde (in tijdsvolgorde)'], example: () => ({ headers: ['waarde (in tijdsvolgorde)'], rows: g.paired_x1.concat(g.paired_x2).map((v: number) => [v]) }), onChange: () => run(), height: '300px' });
  el.append(card('Runs test rond de mediaan (willekeurigheid van een reeks)', h('p', { class: 'muted' }, 'Eén kolom in tijdsvolgorde. Elke waarde boven (+) of onder (-) de mediaan; waarden gelijk aan de mediaan vallen weg. Te weinig runs = trends/clustering, te veel = alternerend patroon.'), grid.el, row(alpha.el)), out);
  run = live(out, () => {
    const al = prob(alpha.get(), 'α');
    const c = grid.getFilledColumns()[0];
    need(!!c && c.values.length >= 4, 'Geef minstens 4 waarden in de eerste kolom.');
    const r = runsTest(c.values);
    need(r.n1 > 0 && r.n2 > 0, 'Alle waarden liggen aan dezelfde kant van de mediaan.');
    const signs = c.values.filter((v) => v !== r.median).map((v) => (v > r.median ? '+' : '-')).join(' ');
    const za = normInv(1 - al / 2);
    return resultPanel({
      question: [`\\(H_0\\): de reeks is willekeurig (random); \\(H_a\\): niet willekeurig, \\(\\alpha=${tx(al)}\\)`],
      formula: ['E[R]=\\frac{2n_1n_2}{N}+1,\\quad Var[R]=\\frac{2n_1n_2(2n_1n_2-N)}{N^2(N-1)},\\quad z=\\frac{R-E[R]}{\\sqrt{Var[R]}}'],
      substituted: [`E[R]=\\frac{2\\cdot ${r.n1}\\cdot ${r.n2}}{${r.n1 + r.n2}}+1=${tx(r.ER)},\\quad Var[R]=${tx(r.VR)},\\quad z=\\frac{${r.R}-${tx(r.ER)}}{${tx(Math.sqrt(r.VR))}}=${tx(r.z)}`],
      result: [['mediaan', fmt(r.median)], ['n₁ (boven) ; n₂ (onder)', `${r.n1} ; ${r.n2}`], ['R (aantal runs)', String(r.R)], ['E[R] ; Var[R]', `${fmt(r.ER)} ; ${fmt(r.VR)}`], ['z', fmt(r.z)], ['p-waarde (tweezijdig)', pTxt(r.p)], ['kritieke |z|', fmt(za)]],
      decision: decide(r.p, al),
      warnings: r.n1 < 10 || r.n2 < 10 ? ['n₁ of n₂ < 10: de normale benadering is ruw; gebruik de tabel van de runs test.'] : [],
      excel: [`mediaan: =MEDIAN(A2:A${c.values.length + 1})`, `z: =(${r.R}-${xl(r.ER)})/SQRT(${xl(r.VR)})`, `p: =2*(1-NORM.S.DIST(ABS(${xl(r.z)});WAAR))`],
      answer: `Rond de mediaan ${nl(r.median)} liggen ${r.n1} waarden boven en ${r.n2} onder, met R = ${r.R} runs (verwacht ${nl(r.ER)}). Dit geeft z = ${nl(r.z)} en p = ${nl(r.p)}. ${r.p < al ? `Omdat p < ${nl(al)} verwerpen we H0: de reeks is niet willekeurig (${r.R < r.ER ? 'te weinig runs: trend of clustering' : 'te veel runs: alternerend patroon'}).` : `Omdat p >= ${nl(al)} verwerpen we H0 niet: geen aanwijzing tegen willekeurigheid.`}`,
      extra: note('Tekenreeks: ' + signs, 'info'),
    });
  });
  run();
}

export const nonparam: ModuleDef = {
  id: 'nonparam',
  title: 'Niet-parametrisch & GOF',
  group: 'Extra',
  keywords: ['goodness of fit', 'aanpassingstoets', 'chi-kwadraat', 'chi2', 'Poisson', 'Mann-Whitney', 'Wilcoxon', 'rangsomtoets', 'rangtekentoets', 'signed rank', 'runs', 'runs test', 'niet-parametrisch', 'nonparametric', 'mediaan'],
  subs: [
    ['gof', 'Chi-kwadraat goodness of fit (Poisson, normaal, exponentieel, uniform)', 'goodness of fit aanpassingstoets chi2 verdeling klassen samenvoegen'],
    ['mw', 'Wilcoxon-Mann-Whitney (twee onafhankelijke steekproeven)', 'Mann-Whitney U rangsomtoets Wilcoxon rank sum'],
    ['wsr', 'Wilcoxon rangtekentoets (gepaard)', 'Wilcoxon signed rank gepaard rangtekentoets'],
    ['runs', 'Runs test (willekeurigheid)', 'runs test willekeurig random mediaan'],
  ],
  mount(el) {
    moduleHead(el, 'Niet-parametrische toetsen en goodness of fit', 'Chi-kwadraat aanpassingstoets, Wilcoxon-Mann-Whitney, Wilcoxon rangtekentoets en runs test (normale benaderingen volgens de test recipes).');
    const t = tabs('nonparam', [
      { id: 'gof', label: 'Goodness of fit', build: gofTab },
      { id: 'mw', label: 'Mann-Whitney', build: mwTab },
      { id: 'wsr', label: 'Wilcoxon gepaard', build: wsrTab },
      { id: 'runs', label: 'Runs test', build: runsTab },
    ], el);
    return { route: (sub, params) => sub && t.show(sub, params) };
  },
};
