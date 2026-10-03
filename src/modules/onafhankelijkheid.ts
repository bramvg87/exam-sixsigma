// Onafhankelijkheid: contingency tables (chi2, Fisher exact, Cramer's V, residuals, conditional profiles),
// independence of two events, correlation of two numeric variables.
import { h, fmt, tx, xl, nl, pctNl, parseNum } from '../ui/core.ts';
import { Form, row, card, note } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { lineChart, scatterChart, chartBox } from '../components/charts.ts';
import { contingency } from '../calc/misc.ts';
import { fisherExact, cramersV, stdResiduals, pearson, spearman, eventIndependence, crossTab } from '../calc/independence.ts';
import { chi2InvRt, tInvRt } from '../stats/dist.ts';
import { live, need, moduleHead, prob } from './util.ts';
import { tabs, type ModuleDef, type Ctx } from './types.ts';

const isText = (v: string) => {
  const p = parseNum(v ?? '');
  return p === null || Number.isNaN(p);
};
const strength = (v: number) => (v < 0.1 ? 'verwaarloosbaar' : v < 0.3 ? 'zwak' : v < 0.5 ? 'matig' : 'sterk');

const EX_LINE = () => ({ headers: ['Lijn', 'Accepted', 'Downgraded', 'Rejected'], rows: [['Lijn 1', 200, 50, 20], ['Lijn 2', 150, 40, 40]] });
const EX_22 = () => ({ headers: ['Behandeling', 'Defect', 'OK'], rows: [['Nieuw', 30, 10], ['Oud', 20, 25]] });
const EX_SHIFT = () => ({ headers: ['Ploeg', 'Kras', 'Deuk', 'Maatfout', 'Geen fout'], rows: [['Vroeg', 12, 8, 5, 175], ['Laat', 18, 9, 7, 166], ['Nacht', 25, 14, 12, 149]] });
const EX_RAW = () => {
  const data: [string, string, number][] = [['Leverancier A', 'OK', 46], ['Leverancier A', 'NOK', 4], ['Leverancier B', 'OK', 38], ['Leverancier B', 'NOK', 12], ['Leverancier C', 'OK', 44], ['Leverancier C', 'NOK', 6]];
  const rows: string[][] = [];
  for (const [a, b, k] of data) for (let i = 0; i < k; i++) rows.push([a, b]);
  // deterministic interleave (37 and 150 are coprime) so the list looks like a raw export
  return { headers: ['Leverancier', 'Keuring'], rows: rows.map((_, i) => rows[(i * 37) % rows.length]) };
};

// ---------- 1. Contingency table ----------
function tableTab(el: HTMLElement, ctx: Ctx) {
  const out = h('div');
  let run = () => {};
  const f = new Form('onaf', () => run());
  const mode = f.seg('mode', 'Invoer', [['tab', 'Kruistabel (aantallen)'], ['raw', 'Ruwe data (2 kolommen met categorieën)']], 'tab');
  const alpha = f.num('alpha', 'α', 0.05);
  const yates = f.check('yates', 'Yates-correctie bij 2x2 (Ottoy-recept)', true);
  const nmX = f.text('nmX', 'naam variabele X (rijen, optioneel)', '');
  const nmY = f.text('nmY', 'naam variabele Y (kolommen, optioneel)', 'Kwaliteit');
  const gT = new DataGrid({
    key: 'onafT', cols: 4, rows: 8,
    examples: [
      { label: 'Formularium: lijn x kwaliteit (500 stuks)', data: EX_LINE },
      { label: 'Voorbeeld 2x2', data: EX_22 },
      { label: 'Voorbeeld ploeg x fouttype (3x4)', data: EX_SHIFT },
    ],
    onChange: () => run(),
  });
  const gR = new DataGrid({ key: 'onafR', cols: 2, rows: 40, examples: [{ label: 'Voorbeeld ruwe data (leverancier x keuring)', data: EX_RAW }], onChange: () => run() });
  const helpT = h('p', { class: 'muted' }, 'Rijen = categorieën van X, kolommen = categorieën van Y, cellen = aantallen. Een eerste kolom met tekst wordt als rijlabel gebruikt; de kolomkoppen zijn de categorieën van Y.');
  const helpR = h('p', { class: 'muted' }, 'Één rij per waarneming (stuk, klant, ...): kolom 1 = categorie van X, kolom 2 = categorie van Y. De tool telt zelf de kruistabel. Handig als je een lijst uit Excel plakt.');
  el.append(card('Onafhankelijkheid van twee categorische variabelen (kruistabel, contingency table)', row(mode.el), helpT, gT.el, helpR, gR.el, row(nmX.el, nmY.el), row(alpha.el, yates.el)), out);

  run = live(out, () => {
    const raw = mode.get() === 'raw';
    gT.el.hidden = helpT.hidden = raw;
    gR.el.hidden = helpR.hidden = !raw;
    let t: number[][];
    let rl: string[];
    let cl: string[];
    let xName = 'X';
    let yName = 'Y';
    if (raw) {
      const rr = gR.getRaw().filter((r) => (r[0] ?? '').trim() && (r[1] ?? '').trim());
      need(rr.length >= 4, 'Plak minstens 4 rijen met twee categorieën (kolom 1 = X, kolom 2 = Y).');
      const ct = crossTab(rr.map((r) => [r[0].trim(), r[1].trim()] as [string, string]));
      t = ct.t;
      rl = ct.rows;
      cl = ct.cols;
      xName = gR.headers[0] || 'X';
      yName = gR.headers[1] || 'Y';
    } else {
      const rw = gT.getRaw();
      need(rw.length >= 2, 'Vul minstens 2 rijen in (of laad een voorbeeld).');
      const lab = rw.every((r) => isText(r[0]));
      rl = rw.map((r, i) => (lab ? r[0] : '') || `rij ${i + 1}`);
      const hd = gT.headers.slice(lab ? 1 : 0);
      t = rw.map((r, i) =>
        r.slice(lab ? 1 : 0).map((v, j) => {
          const p = parseNum(v);
          need(p !== null && !Number.isNaN(p) && p >= 0 && Number.isInteger(p), `Rij ${i + 1}, kolom ${j + 1}: "${v}" is geen aantal (geheel getal >= 0).`);
          return p!;
        }),
      );
      cl = hd.slice(0, t[0].length).map((c, j) => c || `kolom ${j + 1}`);
      if (lab) xName = gT.headers[0] || 'X';
    }
    if (nmX.get().trim()) xName = nmX.get().trim();
    if (nmY.get().trim() && !raw) yName = nmY.get().trim();
    need(t.length >= 2 && t[0].length >= 2, 'Minstens 2 categorieën voor X en 2 voor Y nodig.');
    need(t.every((r) => r.length === t[0].length), 'Alle rijen moeten even veel kolommen hebben.');
    const a = prob(alpha.get(), 'α');
    const c = contingency(t, yates.get());
    need(c.rs.every((v) => v > 0) && c.cs.every((v) => v > 0), 'Elke rij en kolom moet een totaal > 0 hebben.');
    const R = t.length;
    const C = t[0].length;
    const crit = chi2InvRt(a, c.df);
    const reject = c.p < a;
    const V = cramersV(c.chi2, c.n, R, C);
    const sr = stdResiduals(t, c.E);
    const is22 = R === 2 && C === 2;
    const fe = is22 ? fisherExact(t) : null;
    const nSmall = c.E.flat().filter((e) => e < 5).length;
    const p3 = (x: number) => fmt(x, 3);
    // largest residual
    let bi = 0, bj = 0;
    sr.forEach((r, i) => r.forEach((v, j) => { if (Math.abs(v) > Math.abs(sr[bi][bj])) { bi = i; bj = j; } }));
    const big = sr[bi][bj];
    const obsT = table([`${xName} \\ ${yName}`, ...cl, 'totaal'], [...t.map((r, i) => [rl[i], ...r.map(String), String(c.rs[i])]), ['totaal', ...c.cs.map(String), String(c.n)]]);
    const expT = table(['verwacht e = rij x kolom / n', ...cl], c.E.map((r, i) => [rl[i], ...r.map((v) => fmt(v))]));
    const condT = table([`P(${yName} | ${xName})`, ...cl], [...c.condRow.map((r, i) => [rl[i], ...r.map(pctNl)]), [`P(${yName}) marginaal`, ...c.margCol.map(pctNl)]]);
    const colCond = c.cs.map((cs, j) => t.map((r) => r[j] / cs));
    const condT2 = table([`P(${xName} | ${yName})`, ...cl, `P(${xName}) marginaal`], rl.map((r, i) => [r, ...colCond.map((col) => pctNl(col[i])), pctNl(c.margRow[i])]));
    const jointT = table([`P(${xName} en ${yName})`, ...cl, `P(${xName})`], [...c.joint.map((r, i) => [rl[i], ...r.map(p3), p3(c.margRow[i])]), [`P(${yName})`, ...c.margCol.map(p3), '1']]);
    const resT = h('div', { class: 'tablewrap' }, h('table', { class: 'tbl' },
      h('thead', null, h('tr', null, h('th', null, 'gestandaardiseerd residu (n - e)/√e'), cl.map((x) => h('th', null, x)))),
      h('tbody', null, sr.map((r, i) => h('tr', null, h('td', null, rl[i]), r.map((v) => h('td', { style: Math.abs(v) > 2 ? { background: 'var(--bad-soft)', fontWeight: '700' } : {} }, fmt(v, 3))))))));
    const prof = chartBox(
      lineChart({
        series: [
          ...c.condRow.map((r, i) => ({ pts: r.map((v, j) => [j + 1, 100 * v] as [number, number]), cls: 'connect ' + ['', 'alt', 'alt2', 'fit'][i % 4], dots: true, label: rl[i] })),
          { pts: c.margCol.map((v, j) => [j + 1, 100 * v] as [number, number]), cls: 'connect fit', dots: false },
        ],
        xlabel: cl.map((x, j) => `${j + 1} = ${x}`).join(', '),
        ylabel: `% binnen de rij`,
        x0: 0.7, x1: C + 0.3, y0: 0,
      }),
      h('div', { class: 'muted' }, `Profielen P(${yName} | ${xName}) per rij (${rl.join(', ')}); rode lijn = marginale verdeling P(${yName}). Bij onafhankelijkheid liggen alle profielen op de rode lijn.`),
    );
    const warnings: string[] = [];
    if (nSmall) warnings.push(`${nSmall} verwachte frequentie(s) < 5 (kleinste ${fmt(c.minE)}): de χ²-benadering is twijfelachtig. ${is22 ? 'Gebruik de exacte toets van Fisher hieronder.' : 'Voeg dunne categorieën samen.'}`);
    if (is22 && !yates.get()) warnings.push('Bij een 2x2-tabel schrijft het Ottoy-recept de Yates-correctie voor.');
    const fisherBlock = fe
      ? card('Exacte toets van Fisher (2x2)', h('p', null, `p tweezijdig = ${fmt(fe.pTwo)}; eenzijdig: p(cel linksboven klein) = ${fmt(fe.pLess)}, p(cel linksboven groot) = ${fmt(fe.pGreater)}. Odds ratio = ${fmt(fe.odds)}.`), h('p', { class: 'muted' }, 'Fisher rekent exact met de hypergeometrische verdeling (marges vast) en is altijd geldig, ook bij kleine verwachte aantallen. Odds ratio = (a·d)/(b·c): 1 = geen verband.'))
      : null;
    const sortedP = c.condRow.map((r, i) => ({ i, v: r[bj] }));
    return resultPanel({
      question: [`\\(H_0\\): ${xName} en ${yName} zijn onafhankelijk versus \\(H_a\\): ze hangen samen, \\(\\alpha=${tx(a)}\\)`],
      formula: [
        `P(X,Y)=P(X)P(Y)\\iff P(Y\\mid X)=P(Y)\\iff e_{kl}=\\frac{n_{k\\cdot}\\,n_{\\cdot l}}{n}`,
        `\\chi^2=\\sum_{k,l}\\frac{(${c.yates ? '\\lvert n_{kl}-e_{kl}\\rvert-\\tfrac12' : 'n_{kl}-e_{kl}'})^2}{e_{kl}}\\sim\\chi^2\\big((r-1)(s-1)\\big),\\qquad V=\\sqrt{\\frac{\\chi^2}{n\\,(\\min(r,s)-1)}}`,
      ],
      substituted: [`e_{11}=\\frac{${c.rs[0]}\\cdot ${c.cs[0]}}{${c.n}}=${tx(c.E[0][0])},\\quad \\chi^2=${tx(c.chi2)},\\quad df=(${R}-1)(${C}-1)=${c.df},\\quad V=${tx(V)}`],
      result: [
        ['χ²', fmt(c.chi2)], ['df', String(c.df)], ['kritieke waarde', fmt(crit)], ['p-waarde', fmt(c.p)],
        ...(fe ? [['p exact (Fisher, tweezijdig)', fmt(fe.pTwo)] as [string, string]] : []),
        ["Cramér's V (sterkte)", `${fmt(V, 3)} (${strength(V)})`],
        ['grootste afwijking', `${rl[bi]} x ${cl[bj]}: residu ${fmt(big, 3)} (${big > 0 ? 'meer' : 'minder'} dan verwacht)`],
      ],
      decision: reject ? { text: `Verwerp H₀: ${xName} en ${yName} zijn afhankelijk`, kind: 'reject' } : { text: 'H₀ niet verwerpen: geen bewijs van afhankelijkheid', kind: 'accept' },
      warnings,
      explain: {
        question: [
          'Onafhankelijk betekent: weten in welke categorie X zit, leert je niets over Y. Formeel \\(P(Y\\mid X)=P(Y)\\): de verdeling van Y is in elke rij dezelfde als de totale (marginale) verdeling.',
          'De toets vraagt: zijn de verschillen tussen de rijprofielen groter dan wat je door toeval zou verwachten bij deze steekproefgrootte?',
        ],
        formula: [
          'Verwachte aantallen: als X en Y onafhankelijk zijn, is \\(P(\\text{rij }k\\text{ en kolom }l)=P(\\text{rij }k)P(\\text{kolom }l)\\), dus \\(e_{kl}=n\\cdot\\frac{n_{k\\cdot}}{n}\\cdot\\frac{n_{\\cdot l}}{n}=\\frac{\\text{rijtotaal}\\times\\text{kolomtotaal}}{n}\\).',
          '\\(\\chi^2\\) telt per cel de gekwadrateerde afwijking tussen waargenomen en verwacht, geschaald met de verwachting (een afwijking van 10 weegt zwaarder in een cel met verwacht 20 dan met verwacht 200). Onder \\(H_0\\) is de som \\(\\chi^2\\)-verdeeld met \\((r-1)(s-1)\\) vrijheidsgraden: zoveel cellen kan je vrij invullen als de marges vastliggen.',
          'Altijd rechtszijdig: enkel een grote \\(\\chi^2\\) (veel afwijking) is bewijs tegen onafhankelijkheid. Yates (enkel 2x2) trekt 0,5 af van elke absolute afwijking om de discrete telling beter te benaderen.',
          "Cramér's V zet \\(\\chi^2\\) om naar een sterkte tussen 0 (geen verband) en 1 (perfect verband), los van n. Significant (p klein) is niet hetzelfde als sterk: bij grote n is een zwak verband ook significant.",
        ],
        substituted: [`Bijvoorbeeld cel ${rl[0]} x ${cl[0]}: verwacht ${fmt(c.E[0][0])}, waargenomen ${t[0][0]}. Verwacht onder H0 is \\(\\chi^2\\) ongeveer gelijk aan df = ${c.df}; waargenomen ${fmt(c.chi2)}.`],
        result: [
          `Kritieke waarde ${fmt(crit)}: onder H0 is \\(\\chi^2\\) slechts met kans ${pctNl(a)} groter. p-waarde ${fmt(c.p)} = kans op minstens deze totale afwijking als X en Y echt onafhankelijk zijn.`,
          `Waar zit het verband? Kijk naar de gestandaardiseerde residuen: ongeveer |r| > 2 is een cel die duidelijk afwijkt. Hier: ${rl[bi]} x ${cl[bj]} (r = ${fmt(big, 3)}). In de tabel P(${yName} | ${xName}): ${sortedP.map((s) => `${rl[s.i]} ${pctNl(s.v)}`).join(', ')} tegenover ${pctNl(c.margCol[bj])} gemiddeld.`,
          'Beschrijvend (zonder toets) vergelijk je P(Y | X) met P(Y), zoals in het formularium. De χ²-toets voegt toe of het verschil groter is dan toeval. Onafhankelijkheid toetsen zegt niets over oorzaak en gevolg.',
        ],
      },
      extra: [h('h4', null, 'Waargenomen'), obsT, h('h4', null, 'Verwacht onder onafhankelijkheid'), expT, h('h4', null, 'Voorwaardelijke kansen per rij (vergelijk met de marginale rij)'), condT, prof, h('h4', null, 'Voorwaardelijke kansen per kolom'), condT2, h('h4', null, 'Gezamenlijke en marginale kansen'), jointT, h('h4', null, 'Waar zit de afhankelijkheid?'), resT, fisherBlock].filter(Boolean) as HTMLElement[],
      excel: ['verwacht: =rijtotaal*kolomtotaal/totaal (bv. =$E2*B$4/$E$4)', 'p: =CHISQ.TEST(waargenomen;verwacht)', `kritiek: =CHISQ.INV.RT(${xl(a)};${c.df})`, `p uit χ²: =CHISQ.DIST.RT(${xl(c.chi2)};${c.df})`, `V: =SQRT(${xl(c.chi2)}/(${c.n}*${Math.min(R, C) - 1}))`].concat(fe ? [`Fisher (1 term): =HYPGEOM.DIST(${t[0][0]};${c.rs[0]};${c.cs[0]};${c.n};ONWAAR)`] : []),
      answer: `De chi-kwadraattoets op de ${R}x${C}-kruistabel geeft chi2 = ${nl(c.chi2)} met df = ${c.df} en p = ${nl(c.p)}${fe ? ` (exact volgens Fisher p = ${nl(fe.pTwo)})` : ''}. ${reject ? `Omdat p < alpha = ${pctNl(a)} verwerpen we de onafhankelijkheid: ${xName} en ${yName} hangen samen. Het verband zit vooral in ${rl[bi]} x ${cl[bj]} (${big > 0 ? 'meer' : 'minder'} dan verwacht: P(${cl[bj]} | ${rl[bi]}) = ${pctNl(c.condRow[bi][bj])} tegenover ${pctNl(c.margCol[bj])} gemiddeld). Cramer's V = ${nl(V)}: een ${strength(V)} verband.` : `Omdat p >= alpha = ${pctNl(a)} is er geen bewijs dat ${xName} en ${yName} samenhangen; de voorwaardelijke verdelingen P(${yName} | ${xName}) wijken niet meer af van de marginale dan toeval verklaart.`}`,
    });
  });
  run();
  void ctx;
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 2. Events ----------
function eventsTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('onafev', () => run());
  const mode = f.seg('mode', 'Invoer', [['p', 'kansen'], ['n', 'aantallen']], 'p');
  const pA = f.num('pA', 'P(A)', 0.54);
  const pB = f.num('pB', 'P(B)', 0.7);
  const pAB = f.num('pAB', 'P(A en B)', 0.4);
  const N = f.num('N', 'N (totaal)', 500);
  const nA = f.num('nA', 'aantal met A', 270);
  const nB = f.num('nB', 'aantal met B', 350);
  const nAB = f.num('nAB', 'aantal met A en B', 200);
  const pRow = row(pA.el, pB.el, pAB.el);
  const nRow = row(N.el, nA.el, nB.el, nAB.el);
  el.append(card('Onafhankelijkheid van twee gebeurtenissen', h('p', { class: 'muted' }, 'Voorbeeld formularium: A = "Lijn 1" (270 van 500), B = "Accepted" (350 van 500), A en B = 200. Dit is de beschrijvende controle P(A en B) = P(A)P(B), zonder steekproefonzekerheid (voor een toets: zie Kruistabel).'), row(mode.el), pRow, nRow), out);
  run = live(out, () => {
    const cnt = mode.get() === 'n';
    pRow.hidden = cnt;
    nRow.hidden = !cnt;
    let a: number, b: number, ab: number;
    if (cnt) {
      const n = N.get();
      need(n > 0, 'N moet > 0 zijn.');
      a = nA.get() / n; b = nB.get() / n; ab = nAB.get() / n;
    } else {
      a = pA.get(); b = pB.get(); ab = pAB.get();
    }
    need(a > 0 && a <= 1 && b > 0 && b <= 1 && ab >= 0, 'Kansen moeten tussen 0 en 1 liggen (P(A), P(B) > 0).');
    need(ab <= Math.min(a, b) + 1e-12, 'P(A en B) kan niet groter zijn dan P(A) of P(B).');
    need(a + b - ab <= 1 + 1e-12, 'Inconsistent: P(A of B) = P(A) + P(B) - P(A en B) zou groter zijn dan 1.');
    const e = eventIndependence(a, b, ab);
    const rel = Math.abs(e.diff) / e.prod;
    const indep = rel < 0.005;
    return resultPanel({
      question: 'Zijn A en B onafhankelijk? Drie gelijkwaardige controles: \\(P(A\\cap B)=P(A)P(B)\\), \\(P(A\\mid B)=P(A)\\), \\(P(B\\mid A)=P(B)\\).',
      formula: ['P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)},\\qquad P(A\\cup B)=P(A)+P(B)-P(A\\cap B)'],
      substituted: [`P(A)P(B)=${tx(a)}\\cdot ${tx(b)}=${tx(e.prod)}\\ \\text{vs}\\ P(A\\cap B)=${tx(ab)};\\quad P(B\\mid A)=\\frac{${tx(ab)}}{${tx(a)}}=${tx(e.pBgivenA)}\\ \\text{vs}\\ P(B)=${tx(b)}`],
      result: [['P(A)·P(B)', fmt(e.prod)], ['P(A en B)', fmt(ab)], ['P(A | B)', `${fmt(e.pAgivenB)} (P(A) = ${fmt(a)})`], ['P(B | A)', `${fmt(e.pBgivenA)} (P(B) = ${fmt(b)})`], ['P(A of B)', fmt(e.pAorB)]],
      decision: indep ? { text: 'Onafhankelijk (P(A en B) = P(A)P(B))', kind: 'accept' } : { text: `Niet onafhankelijk: A ${e.diff > 0 ? 'verhoogt' : 'verlaagt'} de kans op B`, kind: 'reject' },
      explain: {
        formula: ['Onafhankelijk = de kans op B verandert niet als je weet dat A gebeurd is. Dan is het gezamenlijke voorkomen gewoon het product van de afzonderlijke kansen.', 'Let op het verschil met "elkaar uitsluiten" (disjunct): dan is P(A en B) = 0, en dat is juist een sterke afhankelijkheid (weet je A, dan weet je dat B niet gebeurt).'],
        result: [`P(B | A) = ${pctNl(e.pBgivenA)} tegenover P(B) = ${pctNl(b)}: ${indep ? 'gelijk, dus A geeft geen informatie over B.' : `A maakt B ${e.diff > 0 ? 'waarschijnlijker' : 'minder waarschijnlijk'}.`} Met steekproefgegevens is een klein verschil ook toeval mogelijk: toets dan met de χ²-toets op de kruistabel.`],
      },
      excel: [`=${xl(a)}*${xl(b)} vergelijken met ${xl(ab)}`, `P(B|A): =${xl(ab)}/${xl(a)}`],
      answer: `P(A)P(B) = ${nl(e.prod)} ${indep ? 'is gelijk aan' : 'verschilt van'} P(A en B) = ${nl(ab)}; equivalent: P(B | A) = ${nl(e.pBgivenA)} ${indep ? '=' : 'tegenover'} P(B) = ${nl(b)}. ${indep ? 'A en B zijn dus onafhankelijk.' : 'A en B zijn dus niet onafhankelijk: kennis van A verandert de kans op B.'}`,
    });
  });
  run();
}

// ---------- 3. Correlation ----------
function corrTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('onafcor', () => run());
  const alpha = f.num('alpha', 'α', 0.05);
  const grid = new DataGrid({
    key: 'onafcor', cols: 2, rows: 30,
    examples: [{ label: 'Voorbeeld (oventemperatuur x hardheid)', data: () => ({ headers: ['temperatuur', 'hardheid'], rows: [[1.2, 2.0], [2.3, 2.9], [2.9, 4.2], [4.1, 4.0], [5.0, 6.1], [6.2, 5.9], [6.8, 7.5], [8.1, 7.9], [9.0, 9.6], [10.2, 9.9]].map(([x, y]) => [x * 10 + 150, y * 5 + 40]) }) }],
    onChange: () => run(),
  });
  el.append(card('Onafhankelijkheid van twee numerieke variabelen (correlatie)', h('p', { class: 'muted' }, 'Twee kolommen, elke rij = één waarneming (x, y).'), grid.el, row(alpha.el)), out);
  run = live(out, () => {
    const m = grid.getMatrix().filter((r) => r[0] !== null && r[1] !== null) as number[][];
    need(m.length >= 4, 'Minstens 4 volledige paren (x, y) nodig.');
    const x = m.map((r) => r[0]);
    const y = m.map((r) => r[1]);
    const a = prob(alpha.get(), 'α');
    const p = pearson(x, y, a);
    need(isFinite(p.r), 'Een van beide kolommen is constant: correlatie niet gedefinieerd.');
    const s = spearman(x, y, a);
    const tc = tInvRt(a / 2, p.df);
    const b1 = p.sxy / p.sxx;
    const b0 = y.reduce((u, v) => u + v, 0) / y.length - (b1 * x.reduce((u, v) => u + v, 0)) / x.length;
    const xs = [Math.min(...x), Math.max(...x)];
    const hd = grid.headers;
    return resultPanel({
      question: [`\\(H_0: \\rho = 0\\) (geen lineair verband) versus \\(H_a: \\rho \\ne 0\\), \\(\\alpha=${tx(a)}\\)`],
      formula: ['r=\\frac{S_{xy}}{\\sqrt{S_{xx}S_{yy}}},\\qquad t=\\frac{r\\sqrt{n-2}}{\\sqrt{1-r^2}}\\sim t(n-2),\\qquad \\text{BI via } z=\\tanh^{-1}(r)\\pm\\frac{z_{1-\\alpha/2}}{\\sqrt{n-3}}'],
      substituted: [`r=\\frac{${tx(p.sxy)}}{\\sqrt{${tx(p.sxx)}\\cdot ${tx(p.syy)}}}=${tx(p.r)},\\quad t=\\frac{${tx(p.r)}\\sqrt{${p.df}}}{\\sqrt{1-${tx(p.r)}^2}}=${tx(p.t)}`],
      result: [['r (Pearson)', fmt(p.r)], ['r²', fmt(p.r2)], ['t ; df', `${fmt(p.t)} ; ${p.df}`], ['kritieke waarde t', `±${fmt(tc)}`], ['p-waarde', fmt(p.p)], [`${pctNl(1 - a)}-BI voor ρ`, `[${fmt(p.ci[0])} ; ${fmt(p.ci[1])}]`], ['Spearman ρ (rangen)', `${fmt(s.r)} (p = ${fmt(s.p)})`]],
      decision: p.p < a ? { text: 'Verwerp H₀: significant lineair verband, dus niet onafhankelijk', kind: 'reject' } : { text: 'H₀ niet verwerpen: geen significant lineair verband', kind: 'accept' },
      explain: {
        question: ['Voor twee numerieke variabelen meet de correlatiecoëfficiënt r de sterkte van het LINEAIRE verband (-1 tot 1). Onafhankelijk impliceert \\(\\rho=0\\); het omgekeerde geldt niet: een sterk niet-lineair verband (bv. een U-vorm) kan r = 0 geven. Kijk dus altijd ook naar de puntenwolk.'],
        formula: ['\\(S_{xy}\\) is positief als grote x samengaan met grote y. Delen door \\(\\sqrt{S_{xx}S_{yy}}\\) maakt r eenheidsloos. De t-toets is opnieuw signaal/ruis: r gedeeld door zijn standaardfout \\(\\sqrt{(1-r^2)/(n-2)}\\); df = n - 2 omdat een rechte twee parameters heeft.', 'Spearman berekent dezelfde r op de rangen: robuust tegen uitschieters en meet elk monotoon (stijgend of dalend) verband.'],
        result: [`r² = ${pctNl(p.r2)}: zoveel van de variatie in y wordt lineair verklaard door x (zelfde r² als bij enkelvoudige regressie). Correlatie is geen causaliteit: een derde variabele (confounder) kan beide sturen.`],
      },
      extra: chartBox(scatterChart(x, y, { series: [{ pts: xs.map((v) => [v, b0 + b1 * v] as [number, number]), cls: 'fit' }], xlabel: hd[0] || 'x', ylabel: hd[1] || 'y' })),
      excel: ['r: =CORREL(x;y) (of PEARSON)', `t: =${xl(p.r)}*SQRT(${p.df})/SQRT(1-${xl(p.r)}^2)`, `p: =T.DIST.2T(ABS(${xl(p.t)});${p.df})`, 'BI: =TANH(FISHER(r) ± NORM.S.INV(1-α/2)/SQRT(n-3))'],
      answer: `De correlatie tussen ${hd[0] || 'x'} en ${hd[1] || 'y'} is r = ${nl(p.r)} (r2 = ${pctNl(p.r2)}), met t = ${nl(p.t)} (df = ${p.df}) en p = ${nl(p.p)}. ${p.p < a ? `Omdat p < alpha = ${pctNl(a)} is er een significant lineair verband: de variabelen zijn niet onafhankelijk.` : `Omdat p >= alpha = ${pctNl(a)} is er geen significant lineair verband (dat bewijst geen onafhankelijkheid: een niet-lineair verband blijft mogelijk).`} Correlatie toont geen oorzakelijk verband aan.`,
    });
  });
  run();
}

// ---------- 4. Overview ----------
function overviewTab(el: HTMLElement, ctx: Ctx) {
  const go = (id: string, sub?: string) => h('a', { href: '#', onclick: (e: Event) => { e.preventDefault(); ctx.go(id, sub); } }, 'open');
  el.append(
    card('Welke methode voor onafhankelijkheid?',
      table(['Gegevens', 'Vraag', 'Methode', ''], [
        ['2 categorische variabelen (aantallen per combinatie)', 'Hangen X en Y samen?', 'χ²-toets op de kruistabel; 2x2: Yates of exact Fisher', go('onafhankelijkheid', 'kruistabel')],
        ['2 gebeurtenissen met gekende kansen', 'Is P(A en B) = P(A)P(B)?', 'beschrijvende controle (geen toets)', go('onafhankelijkheid', 'gebeurtenissen')],
        ['2 numerieke variabelen', 'Is er een (lineair) verband?', 'correlatie r + t-toets; Spearman bij uitschieters', go('onafhankelijkheid', 'correlatie')],
        ['1 reeks in tijdsvolgorde', 'Zijn de waarnemingen onafhankelijk (iid, random)?', 'runs-toets; regelkaart (Western Electric-regels)', go('nonparam', 'runs')],
        ['Verdeling van 1 variabele', 'Past een verdeling?', 'χ² goodness of fit (andere vraag: geen onafhankelijkheid)', go('nonparam', 'gof')],
      ]),
      note('Onafhankelijk ≠ disjunct, en afhankelijk ≠ oorzakelijk. Afhankelijkheid zegt enkel dat X informatie geeft over Y; voor oorzaak-gevolg heb je een experiment (randomisatie) of een causaal model nodig.', 'info'),
    ),
  );
}

export const onafhankelijkheid: ModuleDef = {
  id: 'onafhankelijkheid',
  title: 'Onafhankelijkheid',
  group: 'Fase 2',
  keywords: ['onafhankelijkheid', 'onafhankelijk', 'afhankelijk', 'kruistabel', 'contingentietabel', 'contingency', 'chi kwadraat', 'samenhang', 'verband', 'voorwaardelijke kans', 'marginale kans', 'fisher', 'cramer', 'correlatie', 'pearson', 'spearman', 'gebeurtenissen'],
  subs: [
    ['kruistabel', 'Onafhankelijkheid: kruistabel + χ² (lijn x kwaliteit)', 'kruistabel contingentie chi2 lijn kwaliteit fisher cramer'],
    ['gebeurtenissen', 'Onafhankelijkheid van twee gebeurtenissen', 'P(A en B) P(A)P(B) voorwaardelijke kans'],
    ['correlatie', 'Correlatie en onafhankelijkheid (numeriek)', 'correlatie pearson spearman r'],
    ['overzicht', 'Welke methode voor onafhankelijkheid?', 'overzicht keuze'],
  ],
  mount(el, ctx) {
    moduleHead(el, 'Onafhankelijkheid', 'Hangen twee variabelen samen? Kruistabel met χ²-toets, gebeurtenissen, of correlatie voor numerieke data.');
    const t = tabs('onafhankelijkheid', [
      { id: 'kruistabel', label: 'Kruistabel (categorisch)', build: (e) => tableTab(e, ctx) },
      { id: 'gebeurtenissen', label: 'Gebeurtenissen', build: eventsTab },
      { id: 'correlatie', label: 'Correlatie (numeriek)', build: corrTab },
      { id: 'overzicht', label: 'Welke methode?', build: (e) => overviewTab(e, ctx) },
    ], el);
    return { route: (sub, params) => sub && t.show(sub, params) };
  },
};
