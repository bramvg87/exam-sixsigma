// M8 Regressie: simple and multiple linear regression (least squares), CI/PI, residual analysis.
import { h, fmt, tx, xl, nl, pctNl, parseNum, store } from '../ui/core.ts';
import { Form, row, card, note, InputError } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { lineChart, chartBox } from '../components/charts.ts';
import { regress, predict } from '../calc/regression.ts';
import { mean } from '../stats/desc.ts';
import { normInv } from '../stats/dist.ts';
import { live, need, moduleHead, prob } from './util.ts';
import { tabs, type ModuleDef } from './types.ts';
import G from '../../testdata/golden_values.json';

const g = G as any;
const colL = (j: number) => (j < 26 ? String.fromCharCode(65 + j) : 'A' + String.fromCharCode(65 + j - 26));
const pFmt = (p: number) => (p < 1e-4 ? fmt(p, 3) : fmt(p));
const ciTxt = (c: [number, number]) => `[${fmt(c[0])} ; ${fmt(c[1])}]`;
const ciNl = (c: [number, number]) => `[${nl(c[0])} ; ${nl(c[1])}]`;
const ciTex = (c: [number, number]) => `\\left[${tx(c[0])}\\,;\\ ${tx(c[1])}\\right]`;

/** Run calc code that throws plain Errors and turn those into Dutch input errors. */
function safe<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e: any) {
    if (e instanceof InputError) throw e;
    throw new InputError(String(e?.message ?? e));
  }
}

function legend(items: [string, string][]) {
  return h('div', { class: 'muted', style: { fontSize: '13px', margin: '2px 0 8px' } }, items.map(([sym, t]) => h('span', { style: { marginRight: '16px' } }, h('b', null, sym), ' ', t)));
}

function regTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('reg', () => run());
  const alpha = f.num('alpha', 'α (significantieniveau)', 0.05);
  const x0f = f.text('x0', 'x₀ voor voorspelling (bij meerdere X: gescheiden door ;)', '7,5');
  const grid = new DataGrid({
    key: 'reg',
    cols: 4,
    examples: [
      { label: 'Voorbeeld: enkelvoudig (x, y)', data: () => ({ headers: ['x', 'y'], rows: g.regression_simple.x.map((v: number, i: number) => [v, g.regression_simple.y[i]]) }) },
      { label: 'Voorbeeld: meervoudig (x1, x2, y)', data: () => ({ headers: ['x1', 'x2', 'y'], rows: g.regression_multiple.x1.map((v: number, i: number) => [v, g.regression_multiple.x2[i], g.regression_multiple.y[i]]) }) },
    ],
    onChange: () => run(),
  });

  // ----- Y / X selectors built from the grid headers -----
  const selBox = h('div', { class: 'row' });
  let lastHeads = '';
  const ySel = h('select', null) as HTMLSelectElement;
  ySel.addEventListener('change', () => {
    store.set('reg.ycol', ySel.value);
    lastHeads = '';
    run();
  });
  let xBoxes: HTMLInputElement[] = [];
  function heads(): string[] {
    const hs = grid.headers.map((x, j) => x.trim() || colL(j));
    // make names unique
    return hs.map((x, j) => (hs.indexOf(x) !== j ? `${x} (${colL(j)})` : x));
  }
  function syncSelectors(hs: string[]) {
    const key = hs.join('\u0001') + '|' + store.get('reg.ycol', '');
    if (key === lastHeads) return;
    lastHeads = key;
    let y = store.get<string>('reg.ycol', '');
    if (!hs.includes(y)) y = hs[hs.length - 1] ?? '';
    let xs = store.get<string[]>('reg.xcols', []).filter((x) => hs.includes(x) && x !== y);
    if (!xs.length) xs = hs.filter((x) => x !== y);
    ySel.replaceChildren(...hs.map((x) => h('option', { value: x }, x)));
    ySel.value = y;
    xBoxes = [];
    const xEls = hs
      .filter((x) => x !== y)
      .map((x) => {
        const cb = h('input', { type: 'checkbox' }) as HTMLInputElement;
        cb.checked = xs.includes(x);
        cb.dataset.name = x;
        cb.addEventListener('change', () => {
          store.set('reg.xcols', xBoxes.filter((b) => b.checked).map((b) => b.dataset.name));
          run();
        });
        xBoxes.push(cb);
        return h('label', { class: 'field check' }, cb, h('span', null, x));
      });
    store.set('reg.ycol', y);
    store.set('reg.xcols', xs);
    selBox.replaceChildren(
      h('label', { class: 'field' }, h('span', { class: 'lbl' }, 'Y (respons, afhankelijke variabele)'), ySel),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'X-kolommen (verklarende variabelen, predictors)'), h('div', { class: 'row', style: { marginBottom: '0' } }, xEls.length ? xEls : h('span', { class: 'muted' }, 'geen andere kolommen'))),
    );
  }

  el.append(
    card(
      'Lineaire regressie (kleinste kwadraten, least squares)',
      h('p', { class: 'muted' }, 'Plak de data met een kolom per variabele (eerste rij = kolomnamen). Kies de Y-kolom en de X-kolom(men). Eén X = enkelvoudige regressie (met BI/PI en banden), meerdere X = meervoudige regressie.'),
      grid.el,
      selBox,
      row(alpha.el, x0f.el),
    ),
    out,
  );

  run = live(out, () => {
    const hs = heads();
    need(hs.length >= 2, 'Plak minstens twee kolommen (X en Y) in het grid.');
    syncSelectors(hs);
    const yName = ySel.value;
    const xNames = xBoxes.filter((b) => b.checked).map((b) => b.dataset.name!);
    need(xNames.length >= 1, 'Kies minstens één X-kolom.');
    const a = prob(alpha.get(), 'α');
    const yj = hs.indexOf(yName);
    const xj = xNames.map((x) => hs.indexOf(x));
    // ----- rows, dropping incomplete ones -----
    const raw = grid.getRaw();
    const y: number[] = [];
    const X: number[][] = xj.map(() => []);
    let dropped = 0;
    for (const r of raw) {
      const vals = [yj, ...xj].map((j) => parseNum(r[j] ?? ''));
      if (vals.every((v) => v === null)) continue;
      if (vals.some((v) => v === null || Number.isNaN(v))) {
        dropped++;
        continue;
      }
      y.push(vals[0]!);
      xj.forEach((_, i) => X[i].push(vals[i + 1]!));
    }
    const k = xj.length;
    const n = y.length;
    need(n >= k + 2, `Te weinig volledige rijen: n = ${n}, nodig minstens ${k + 2} (k + 2) voor ${k} X-variabele(n).`);
    X.forEach((c, i) => need(Math.max(...c) > Math.min(...c), `Kolom "${xNames[i]}" is constant; daarmee kan geen helling geschat worden.`));
    need(Math.max(...y) > Math.min(...y), 'De Y-kolom is constant (SS_T = 0).');
    const fit = safe(() => regress(y, X, a));
    const warnings: string[] = [];
    if (dropped) warnings.push(`${dropped} rij(en) met een lege of ongeldige cel in de gebruikte kolommen zijn weggelaten.`);
    warnings.push('R²adj gebruikt de noemer n - k - 1 (zoals Excel en het formularium); de slide vermeldt n - k - 2.');
    const dfE = fit.dfE;
    const yLetter = colL(yj);
    const yR = `${yLetter}2:${yLetter}${n + 1}`;
    const xRs = xj.map((j) => `${colL(j)}2:${colL(j)}${n + 1}`);
    const contiguous = xj.every((j, i) => i === 0 || j === xj[i - 1] + 1);
    const xRange = contiguous ? `${colL(xj[0])}2:${colL(xj[k - 1])}${n + 1}` : xRs.join(' en ');
    const conf = Math.round((1 - a) * 1000) / 10;
    const names = ['b0 (intercept)', ...xNames.map((x, i) => `b${i + 1} (${x})`)];
    const coefTable = table(
      ['coëfficiënt', 'b', 'SE(b)', 't = b/SE', 'p (tweezijdig)', `${fmt(conf)}% BI ondergrens`, `${fmt(conf)}% BI bovengrens`],
      fit.beta.map((b, i) => [names[i], fmt(b), fmt(fit.se[i]), fmt(fit.t[i]), pFmt(fit.p[i]), fmt(fit.ci[i][0]), fmt(fit.ci[i][1])]),
    );
    const anovaTable = table(
      ['bron', 'SS', 'df', 'MS', 'F', 'p'],
      [
        ['Regressie (SS_R)', fmt(fit.SSR), String(fit.dfR), fmt(fit.MSR), fmt(fit.F), pFmt(fit.pF)],
        ['Residu / fout (SS_E)', fmt(fit.SSE), String(dfE), fmt(fit.MSE), '', ''],
        ['Totaal (SS_T)', fmt(fit.SST), String(n - 1), '', '', ''],
      ],
    );
    const eq = `\\hat y = ${tx(fit.beta[0])}${fit.beta
      .slice(1)
      .map((b, i) => ` ${b < 0 ? '-' : '+'} ${tx(Math.abs(b))}\\,${xNames[i].replace(/[_^{}\\$&#%]/g, '')}`)
      .join('')}`;
    const eqTxt = `${yName} = ${nl(fit.beta[0])}${fit.beta.slice(1).map((b, i) => ` ${b < 0 ? '-' : '+'} ${nl(Math.abs(b))}·${xNames[i]}`).join('')}`;
    const sig = fit.p.slice(1).map((p) => p < a);
    const res: (string | [string, string])[] = [
      ['Regressievergelijking', eqTxt],
      ['n ; k (aantal X)', `${n} ; ${k}`],
      ['R² = SS_R / SS_T', `${fmt(fit.R2)} (${pctNl(fit.R2)})`],
      ['R²adj (n - k - 1)', fmt(fit.R2adj)],
      ['s = √MSE (standaardfout van de schatting)', fmt(fit.s)],
    ];
    if (k === 1) res.push(['r (correlatiecoëfficiënt)', fmt(fit.r)]);
    res.push(['F (model) ; p', `${fmt(fit.F)} ; ${pFmt(fit.pF)}`]);
    fit.beta.slice(1).forEach((b, i) => res.push([`${names[i + 1]}: t ; p`, `${fmt(fit.t[i + 1])} ; ${pFmt(fit.p[i + 1])} ${sig[i] ? '(significant)' : '(niet significant)'}`]));

    let formula: string[];
    let substituted: string[];
    let excel: string[];
    let extra: HTMLElement[] = [];
    const xb = k === 1 ? mean(X[0]) : NaN;
    const yb = mean(y);
    if (k === 1) {
      const x = X[0];
      const Sxx = x.reduce((s, v) => s + (v - xb) ** 2, 0);
      const Sxy = x.reduce((s, v, i) => s + (v - xb) * (y[i] - yb), 0);
      formula = [
        'b_1=\\frac{S_{xy}}{S_{xx}}=\\frac{\\sum (x_i-\\bar x)(y_i-\\bar y)}{\\sum (x_i-\\bar x)^2},\\qquad b_0=\\bar y-b_1\\bar x',
        'R^2=\\frac{SS_R}{SS_T}=1-\\frac{SS_E}{SS_T},\\quad R^2_{adj}=1-\\frac{(1-R^2)(n-1)}{n-k-1},\\quad s=\\sqrt{MSE}=\\sqrt{\\frac{SS_E}{n-2}}',
        'H_0:\\beta_1=0:\\quad t=\\frac{b_1}{SE(b_1)},\\ SE(b_1)=\\frac{s}{\\sqrt{S_{xx}}},\\ df=n-2;\\qquad F=\\frac{MS_R}{MS_E}=t^2',
      ];
      substituted = [
        `b_1=\\frac{${tx(Sxy)}}{${tx(Sxx)}}=${tx(fit.beta[1])},\\qquad b_0=${tx(yb)}-${tx(fit.beta[1])}\\cdot ${tx(xb)}=${tx(fit.beta[0])}`,
        `R^2=\\frac{${tx(fit.SSR)}}{${tx(fit.SST)}}=${tx(fit.R2)},\\quad R^2_{adj}=1-\\frac{(1-${tx(fit.R2)})(${n - 1})}{${dfE}}=${tx(fit.R2adj)},\\quad s=\\sqrt{\\frac{${tx(fit.SSE)}}{${dfE}}}=${tx(fit.s)}`,
        `t=\\frac{${tx(fit.beta[1])}}{${tx(fit.se[1])}}=${tx(fit.t[1])},\\quad p=${tx(fit.p[1])},\\quad F=${tx(fit.F)}`,
      ];
      excel = [
        `helling b1: =SLOPE(${yR};${xRs[0]})`,
        `intercept b0: =INTERCEPT(${yR};${xRs[0]})`,
        `R²: =RSQ(${yR};${xRs[0]})   r: =CORREL(${xRs[0]};${yR})`,
        `s: =STEYX(${yR};${xRs[0]})`,
        `volledige tabel (5 rijen x 2 kolommen selecteren): =LINEST(${yR};${xRs[0]};WAAR;WAAR)`,
        `p-waarde helling: =T.DIST.2T(${xl(Math.abs(fit.t[1]))};${dfE})   p-waarde F: =F.DIST.RT(${xl(fit.F)};1;${dfE})`,
        `BI helling: =${xl(fit.beta[1])}-T.INV.2T(${xl(a)};${dfE})*${xl(fit.se[1])}  en  =${xl(fit.beta[1])}+T.INV.2T(${xl(a)};${dfE})*${xl(fit.se[1])}`,
      ];
      // chart with fitted line + bands
      let x0v: number | undefined;
      const x0p = parseNum(x0f.get().split(';')[0] ?? '');
      if (x0p !== null && !Number.isNaN(x0p)) x0v = x0p;
      const lo = Math.min(...x, x0v ?? Infinity);
      const hi = Math.max(...x, x0v ?? -Infinity);
      const grid50 = Array.from({ length: 61 }, (_, i) => lo + ((hi - lo) * i) / 60);
      const pr = grid50.map((v) => predict(fit, [v], a));
      const svg = lineChart(
        {
          series: [
            { pts: x.map((v, i) => [v, y[i]] as [number, number]), dots: true },
            { pts: grid50.map((v, i) => [v, pr[i].yhat] as [number, number]), cls: 'fit' },
          ],
          bands: [
            { lo: grid50.map((v, i) => [v, pr[i].pi[0]] as [number, number]), hi: grid50.map((v, i) => [v, pr[i].pi[1]] as [number, number]), cls: 'pi' },
            { lo: grid50.map((v, i) => [v, pr[i].ci[0]] as [number, number]), hi: grid50.map((v, i) => [v, pr[i].ci[1]] as [number, number]) },
          ],
          vlines: x0v !== undefined ? [{ x: x0v, label: 'x₀ = ' + fmt(x0v) }] : [],
          xlabel: xNames[0],
          ylabel: yName,
        },
        700,
        300,
      );
      extra.push(h('h4', null, 'Spreidingsdiagram met regressielijn, BI- en PI-band'), chartBox(svg), legend([['rode lijn', 'ŷ = b0 + b1·x'], ['donkere band', `${fmt(conf)}% BI gemiddelde respons`], ['lichte band', `${fmt(conf)}% PI nieuwe waarneming`]]));
    } else {
      formula = [
        '\\mathbf b=(\\mathbf X^T\\mathbf X)^{-1}\\mathbf X^T\\mathbf y,\\qquad SE(b_j)=\\sqrt{MSE\\cdot\\left[(\\mathbf X^T\\mathbf X)^{-1}\\right]_{jj}},\\quad t_j=\\frac{b_j}{SE(b_j)},\\ df=n-k-1',
        'F=\\frac{SS_R/k}{SS_E/(n-k-1)},\\quad R^2=\\frac{SS_R}{SS_T},\\quad R^2_{adj}=1-\\frac{(1-R^2)(n-1)}{n-k-1},\\quad s=\\sqrt{MSE}',
      ];
      substituted = [
        `F=\\frac{${tx(fit.SSR)}/${k}}{${tx(fit.SSE)}/${dfE}}=${tx(fit.F)},\\quad p=${tx(fit.pF)}`,
        `R^2=\\frac{${tx(fit.SSR)}}{${tx(fit.SST)}}=${tx(fit.R2)},\\quad R^2_{adj}=1-\\frac{(1-${tx(fit.R2)})(${n - 1})}{${dfE}}=${tx(fit.R2adj)},\\quad s=${tx(fit.s)}`,
        ...fit.beta.slice(1).map((b, i) => `t_{${i + 1}}=\\frac{${tx(b)}}{${tx(fit.se[i + 1])}}=${tx(fit.t[i + 1])}\\ (p=${tx(fit.p[i + 1])})`),
      ];
      excel = [
        `volledige tabel (5 rijen x ${k + 1} kolommen selecteren, Ctrl+Shift+Enter in oudere Excel): =LINEST(${yR};${xRange};WAAR;WAAR)`,
        'Let op: LINEST geeft de coëfficiënten in omgekeerde volgorde (b_k ... b_1, b0); rij 3 bevat R² en s, rij 4 F en df, rij 5 SS_R en SS_E.',
        ...(contiguous ? [] : ['De X-kolommen moeten in Excel naast elkaar staan voor LINEST.']),
        `p-waarde coëfficiënt: =T.DIST.2T(ABS(t);${dfE})   p-waarde model: =F.DIST.RT(${xl(fit.F)};${k};${dfE})`,
        `t-kritiek voor BI: =T.INV.2T(${xl(a)};${dfE})`,
      ];
    }
    // residual plot
    const resid = fit.res;
    const rsvg = lineChart({ series: [{ pts: fit.yhat.map((v, i) => [v, resid[i]] as [number, number]), dots: true }], hlines: [{ y: 0, label: '0', cls: 'cl' }], xlabel: 'voorspelde waarde ŷ (fitted)', ylabel: 'residu e = y - ŷ' }, 700, 240);
    const sres = [...resid].sort((p, q) => p - q);
    const qsvg = lineChart(
      { series: [{ pts: sres.map((v, i) => [v, normInv((i + 0.5) / n)] as [number, number]), dots: true }, { pts: [[sres[0], (sres[0] - 0) / fit.s], [sres[n - 1], sres[n - 1] / fit.s]], cls: 'alt' }], xlabel: 'residu', ylabel: 'normale score z' },
      700,
      240,
    );
    extra.push(
      h('h4', null, 'Coëfficiënten'),
      coefTable,
      h('h4', null, 'ANOVA-tabel van de regressie'),
      anovaTable,
      h('h4', null, 'Residuplot (residuals vs fitted)'),
      chartBox(rsvg),
      h('p', { class: 'muted' }, 'Goed model: de residuen liggen willekeurig rond 0 met constante spreiding. Een trechter wijst op niet-constante variantie, een boog op niet-lineariteit.'),
      h('h4', null, 'Normaal-kansplot van de residuen'),
      chartBox(qsvg),
      h('p', { class: 'muted' }, 'Punten dicht bij de stippellijn: residuen ongeveer normaal verdeeld.'),
    );
    const sigNames = xNames.filter((_, i) => sig[i]);
    const answer =
      k === 1
        ? `De regressievergelijking is ${eqTxt}: per eenheid toename van ${xNames[0]} stijgt ${yName} gemiddeld met ${nl(fit.beta[1])}. De helling is ${sig[0] ? 'significant' : 'niet significant'} verschillend van 0 (t = ${nl(fit.t[1])}, df = ${dfE}, p = ${nl(fit.p[1])} ${sig[0] ? '<' : '>='} alfa = ${nl(a)})${sig[0] ? ', er is dus een significant lineair verband' : ''}. R² = ${pctNl(fit.R2)}: dit deel van de variatie in ${yName} wordt verklaard door het lineaire model (r = ${nl(fit.r)}). De residuen moeten nog gecontroleerd worden op normaliteit en constante variantie; extrapoleren buiten het bereik van de data is niet betrouwbaar.`
        : `Het meervoudig model ${eqTxt} is ${fit.pF < a ? 'als geheel significant' : 'als geheel niet significant'} (F = ${nl(fit.F)}, df = ${k} en ${dfE}, p = ${nl(fit.pF)}). ${sigNames.length ? `Significante verklarende variabelen (p < ${nl(a)}): ${sigNames.join(', ')}.` : 'Geen enkele coëfficiënt is afzonderlijk significant.'} R² = ${pctNl(fit.R2)} en de aangepaste R²adj = ${nl(fit.R2adj)} (gecorrigeerd voor het aantal variabelen, n - k - 1 = ${dfE}); s = ${nl(fit.s)}.`;
    const panels: HTMLElement[] = [
      resultPanel({
        question: [
          `Model: \\(${k === 1 ? 'y=\\beta_0+\\beta_1 x+\\varepsilon' : 'y=\\beta_0+\\beta_1 x_1+\\dots+\\beta_k x_k+\\varepsilon'}\\) met Y = ${yName}, X = ${xNames.join(', ')} (n = ${n})`,
          k === 1 ? '\\(H_0:\\beta_1=0\\) (geen lineair verband) tegen \\(H_1:\\beta_1\\neq 0\\)' : `\\(H_0:\\beta_1=\\dots=\\beta_${k}=0\\) (model niet nuttig) tegen \\(H_1\\): minstens één \\(\\beta_j\\neq 0\\)`,
        ],
        formula,
        substituted: [eq, ...substituted],
        result: res,
        decision:
          (k === 1 ? fit.p[1] : fit.pF) < a
            ? { text: k === 1 ? `Verwerp H0: helling significant (p < α = ${fmt(a)})` : `Verwerp H0: model significant (p < α = ${fmt(a)})`, kind: 'reject' }
            : { text: `H0 niet verwerpen (p ≥ α = ${fmt(a)})`, kind: 'accept' },
        warnings,
        excel,
        answer,
        extra,
      }),
    ];
    // ----- prediction at x0 -----
    const x0raw = x0f.get().trim();
    if (x0raw) {
      const parts = x0raw.split(';').map((s) => parseNum(s));
      if (!(parts.length === k && parts.every((v) => v !== null && !Number.isNaN(v)))) {
        panels.push(note(`Voorspelling: geef ${k} waarde(n) voor x₀ (gescheiden door ;), één per X-kolom in deze volgorde: ${xNames.join('; ')}.`, 'warn'));
        return panels;
      }
      const x0 = parts as number[];
      const p = predict(fit, x0, a);
      const ext = x0.some((v, i) => v < Math.min(...X[i]) || v > Math.max(...X[i]));
      let pf: string[];
      let ps: string[];
      if (k === 1) {
        const Sxx = X[0].reduce((s, v) => s + (v - xb) ** 2, 0);
        pf = [
          '\\hat y_0=b_0+b_1x_0',
          'BI\\ (gemiddelde\\ respons):\\ \\hat y_0\\pm t_{\\alpha/2;\\,n-2}\\cdot s\\sqrt{\\frac1n+\\frac{(x_0-\\bar x)^2}{S_{xx}}}',
          'PI\\ (nieuwe\\ waarneming):\\ \\hat y_0\\pm t_{\\alpha/2;\\,n-2}\\cdot s\\sqrt{1+\\frac1n+\\frac{(x_0-\\bar x)^2}{S_{xx}}}',
        ];
        ps = [
          `\\hat y_0=${tx(fit.beta[0])}+${tx(fit.beta[1])}\\cdot ${tx(x0[0])}=${tx(p.yhat)}`,
          `BI: ${tx(p.yhat)}\\pm ${tx(p.tc)}\\cdot ${tx(fit.s)}\\sqrt{\\frac1{${n}}+\\frac{(${tx(x0[0])}-${tx(xb)})^2}{${tx(Sxx)}}}=${tx(p.yhat)}\\pm ${tx(p.tc * p.seMean)}=${ciTex(p.ci)}`,
          `PI: ${tx(p.yhat)}\\pm ${tx(p.tc)}\\cdot ${tx(fit.s)}\\sqrt{1+\\frac1{${n}}+\\frac{(${tx(x0[0])}-${tx(xb)})^2}{${tx(Sxx)}}}=${tx(p.yhat)}\\pm ${tx(p.tc * p.sePred)}=${ciTex(p.pi)}`,
        ];
      } else {
        pf = [
          '\\hat y_0=\\mathbf x_0^T\\mathbf b,\\quad h_0=\\mathbf x_0^T(\\mathbf X^T\\mathbf X)^{-1}\\mathbf x_0\\ \\ (\\mathbf x_0=(1,x_{01},\\dots,x_{0k}))',
          'BI:\\ \\hat y_0\\pm t_{\\alpha/2;\\,n-k-1}\\, s\\sqrt{h_0},\\qquad PI:\\ \\hat y_0\\pm t_{\\alpha/2;\\,n-k-1}\\, s\\sqrt{1+h_0}',
        ];
        ps = [
          `\\hat y_0=${tx(p.yhat)},\\quad h_0=${tx(p.h)}`,
          `BI: ${tx(p.yhat)}\\pm ${tx(p.tc)}\\cdot ${tx(fit.s)}\\sqrt{${tx(p.h)}}=${ciTex(p.ci)},\\quad PI: ${tx(p.yhat)}\\pm ${tx(p.tc)}\\cdot ${tx(fit.s)}\\sqrt{1+${tx(p.h)}}=${ciTex(p.pi)}`,
        ];
      }
      const x0txt = x0.map((v, i) => `${xNames[i]} = ${nl(v)}`).join(', ');
      panels.push(
        resultPanel({
          title: 'Voorspelling bij x₀',
          question: [`Voorspelde waarde, ${fmt(conf)}% betrouwbaarheidsinterval (confidence interval) voor de gemiddelde respons en ${fmt(conf)}% voorspellingsinterval (prediction interval) voor een nieuwe waarneming bij ${x0txt}`],
          formula: pf,
          substituted: ps,
          result: [
            ['ŷ₀', fmt(p.yhat)],
            [`${fmt(conf)}% BI gemiddelde respons`, ciTxt(p.ci)],
            [`${fmt(conf)}% PI nieuwe waarneming`, ciTxt(p.pi)],
            ['t-kritiek ; h₀ (leverage)', `${fmt(p.tc)} ; ${fmt(p.h)}`],
          ],
          warnings: ext ? ['x₀ ligt buiten het bereik van de data: dit is extrapolatie, het model is daar niet gevalideerd.'] : [],
          excel: [
            k === 1 ? `ŷ₀: =TREND(${yR};${xRs[0]};${xl(x0[0])})   of  =${xl(fit.beta[0])}+${xl(fit.beta[1])}*${xl(x0[0])}` : `ŷ₀: =${xl(fit.beta[0])}${fit.beta.slice(1).map((b, i) => `+${xl(b)}*${xl(x0[i])}`).join('')}`,
            `t-kritiek: =T.INV.2T(${xl(a)};${dfE})`,
            k === 1
              ? `halve breedte BI: =T.INV.2T(${xl(a)};${dfE})*STEYX(${yR};${xRs[0]})*SQRT(1/${n}+(${xl(x0[0])}-AVERAGE(${xRs[0]}))^2/DEVSQ(${xRs[0]}))`
              : `halve breedte BI: =T.INV.2T(${xl(a)};${dfE})*${xl(fit.s)}*SQRT(${xl(p.h)})`,
            k === 1
              ? `halve breedte PI: =T.INV.2T(${xl(a)};${dfE})*STEYX(${yR};${xRs[0]})*SQRT(1+1/${n}+(${xl(x0[0])}-AVERAGE(${xRs[0]}))^2/DEVSQ(${xRs[0]}))`
              : `halve breedte PI: =T.INV.2T(${xl(a)};${dfE})*${xl(fit.s)}*SQRT(1+${xl(p.h)})`,
          ],
          answer: `Bij ${x0txt} is de voorspelde waarde ${nl(p.yhat)}. Met ${nl(conf)}% betrouwbaarheid ligt de gemiddelde respons in ${ciNl(p.ci)}; een individuele nieuwe waarneming ligt met ${nl(conf)}% kans in het bredere voorspellingsinterval ${ciNl(p.pi)}. Het PI is breder omdat het naast de onzekerheid op de regressielijn ook de spreiding s van individuele waarnemingen bevat.${ext ? ' Let op: x0 ligt buiten het waargenomen bereik (extrapolatie).' : ''}`,
        }),
      );
    }
    return panels;
  });
  run();
  return {
    prefill: (v: any) => {
      if (v?.example === 'simple' || v?.example === 'multiple') {
        const d = v.example === 'simple' ? g.regression_simple : g.regression_multiple;
        if (v.example === 'simple') grid.setData(['x', 'y'], d.x.map((x: number, i: number) => [x, d.y[i]]));
        else grid.setData(['x1', 'x2', 'y'], d.x1.map((x: number, i: number) => [x, d.x2[i], d.y[i]]));
      }
      const { example, ...rest } = v ?? {};
      void example;
      f.setValues(rest);
    },
  };
}

function theoryTab(el: HTMLElement) {
  el.append(
    card(
      'Veronderstellingen van lineaire regressie',
      h(
        'ol',
        null,
        h('li', null, h('b', null, 'Lineariteit: '), 'het verband tussen X en het gemiddelde van Y is lineair. Controle: spreidingsdiagram, residuplot zonder boog.'),
        h('li', null, h('b', null, 'Onafhankelijkheid: '), 'de fouten (residuen) zijn onafhankelijk, bv. geen autocorrelatie in de tijd. Controle: residuen in volgorde van meting.'),
        h('li', null, h('b', null, 'Constante variantie (homoscedasticiteit): '), 'de spreiding rond de lijn is overal gelijk. Controle: residuplot zonder trechtervorm.'),
        h('li', null, h('b', null, 'Normaliteit van de residuen: '), 'nodig voor t-toetsen, F-toets, BI en PI. Controle: normaal-kansplot of histogram van de residuen.'),
      ),
      note('De toetsen en intervallen (t, F, BI, PI) zijn pas geldig als deze veronderstellingen ongeveer kloppen. Kijk dus altijd eerst naar de residuen.', 'info'),
    ),
    card(
      'Residuanalyse',
      h(
        'ul',
        null,
        h('li', null, 'Residu e_i = y_i - ŷ_i. Som van de residuen = 0 (kleinste kwadraten minimaliseert SS_E = Σ e_i²).'),
        h('li', null, 'Residuplot (e tegen ŷ of tegen x): willekeurige wolk rond 0 = in orde; boog = kwadratische term ontbreekt; trechter = niet-constante variantie (transformatie, bv. log Y).'),
        h('li', null, 'Uitschieters (|e/s| > 2 à 3) en invloedrijke punten (hoge leverage h_i, ver van x̄) apart bekijken.'),
        h('li', null, 'R² = SS_R/SS_T = aandeel verklaarde variatie; bij enkelvoudige regressie R² = r². R²adj straft extra variabelen af en is beter om modellen met verschillend aantal X te vergelijken.'),
      ),
    ),
    card(
      'Correlatie is geen causaliteit',
      h('p', null, 'Een significant verband (helling ≠ 0, hoge r) bewijst geen oorzaak-gevolg. Mogelijke verklaringen: een verborgen derde variabele (confounder), omgekeerde causaliteit, of toeval (bij veel geteste verbanden). Causaliteit aantonen vraagt een gecontroleerd experiment (DOE) waarin X actief ingesteld wordt (interventie, "doing" in plaats van "seeing").'),
    ),
    card(
      'Extrapolatie en BI versus PI',
      h(
        'ul',
        null,
        h('li', null, 'Het model is enkel gevalideerd binnen het bereik van de waargenomen X-waarden. Voorspellen daarbuiten (extrapolatie) is riskant: het verband kan er anders zijn.'),
        h('li', null, 'Het BI (confidence interval) voor de gemiddelde respons is het smalst bij x = x̄ en wordt breder naarmate x₀ verder van x̄ ligt.'),
        h('li', null, 'Het PI (prediction interval) voor één nieuwe waarneming bevat een extra "1 +" onder de wortel en is daardoor altijd breder dan het BI; het wordt niet smaller dan ± t·s, ook niet bij grote n.'),
      ),
    ),
  );
}

export const regressie: ModuleDef = {
  id: 'regressie',
  title: 'Regressie',
  group: 'Fase 2',
  keywords: ['regressie', 'regression', 'lineaire regressie', 'kleinste kwadraten', 'least squares', 'R2', 'R²', 'determinatiecoëfficiënt', 'correlatie', 'helling', 'slope', 'intercept', 'voorspellingsinterval', 'prediction interval', 'betrouwbaarheidsinterval gemiddelde respons', 'residu', 'residuen', 'LINEST', 'meervoudige regressie', 'verband'],
  subs: [
    ['reg', 'Enkelvoudige en meervoudige regressie (kleinste kwadraten)', 'regressie helling intercept R2 voorspellingsinterval prediction interval LINEST kleinste kwadraten residu'],
    ['theorie', 'Regressie: veronderstellingen, residuanalyse, causaliteit', 'veronderstellingen residuen extrapolatie correlatie causaliteit'],
  ],
  mount(el) {
    moduleHead(el, 'Regressie (linear regression)', 'Enkelvoudige en meervoudige lineaire regressie met kleinste kwadraten, ANOVA-tabel, R², BI en PI.');
    const t = tabs('regressie', [
      { id: 'reg', label: 'Regressie', build: regTab },
      { id: 'theorie', label: 'Theorie', build: theoryTab },
    ], el);
    return { route: (sub, params) => sub && t.show(sub === 'simple' || sub === 'multi' ? 'reg' : sub, params) };
  },
};
