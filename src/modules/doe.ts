// M9 DOE 2^k: full factorial (Yates order), effects, ANOVA, pooling, Pareto/normal plot, half fractions.
import { h, fmt, tx, xl, nl, parseNum, store } from '../ui/core.ts';
import { Form, row, card, note, InputError } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { lineChart, barChart, chartBox } from '../components/charts.ts';
import { runLabels, terms, termSign, factorial, halfFraction, type DoeOut } from '../calc/doe.ts';
import { normInv, tInvRt } from '../stats/dist.ts';
import { median, sum } from '../stats/desc.ts';
import { live, need, moduleHead, prob } from './util.ts';
import { tabs, type ModuleDef } from './types.ts';
import G from '../../testdata/golden_values.json';

const g = G as any;
const LET = 'ABCDEFGH';
const pFmt = (p: number | undefined) => (p === undefined ? '' : p < 1e-4 ? fmt(p, 3) : fmt(p));
const sgn = (v: number) => (v > 0 ? '+' : '-');
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** Normalise a run label: '(1)', '1', 'I' -> '(1)'; letters sorted in factor order. */
function normLabel(s: string): string {
  const t = s.trim().toLowerCase().replace(/\s/g, '');
  if (t === '(1)' || t === '1' || t === 'i' || t === '(i)') return '(1)';
  if (!/^[a-h]+$/.test(t)) return '?' + t;
  return [...new Set(t)].sort().join('');
}

/**
 * Read responses from the grid. Rows may start with a run label (text), then the replicates.
 * With labels the order is free; without labels rows are taken in standard order.
 */
function readRuns(grid: DataGrid, labels: string[], designName: string): { responses: number[][]; notes: string[] } {
  const raw = grid.getRaw();
  const N = labels.length;
  const notes: string[] = [];
  const rows: { label?: string; vals: number[]; line: number }[] = [];
  raw.forEach((r, i) => {
    if (r.every((c) => !c.trim())) return;
    let cells = r;
    let label: string | undefined;
    const first = parseNum(r[0] ?? '');
    if (first !== null && Number.isNaN(first)) {
      label = normLabel(r[0]);
      cells = r.slice(1);
    } else if (first === null && r.slice(1).some((c) => c.trim())) {
      // empty first cell: treat as unlabelled replicate list
      cells = r.slice(1);
    }
    const vals: number[] = [];
    for (const c of cells) {
      const v = parseNum(c);
      if (v === null) continue;
      if (Number.isNaN(v)) throw new InputError(`Rij ${i + 1}: "${c}" is geen geldig getal.`);
      vals.push(v);
    }
    if (!vals.length && label === undefined) return;
    rows.push({ label, vals, line: i + 1 });
  });
  need(rows.length > 0, `Vul de responsen in: één rij per run (${N} runs), kolommen = herhalingen (replicates).`);
  const labelled = rows.filter((r) => r.label !== undefined).length;
  let responses: number[][];
  if (labelled === rows.length) {
    const map = new Map<string, number[]>();
    for (const r of rows) {
      need(labels.includes(r.label!), `Onbekend runlabel "${r.label!.replace(/^\?/, '')}" (rij ${r.line}). Geldige labels voor het ${designName}: ${labels.join(', ')}.`);
      need(!map.has(r.label!), `Run "${r.label}" komt twee keer voor (rij ${r.line}).`);
      map.set(r.label!, r.vals);
    }
    const missing = labels.filter((l) => !map.has(l));
    need(!missing.length, `Ontbrekende run(s) voor het ${designName}: ${missing.join(', ')} (${N} runs nodig, ${rows.length} ingevuld).`);
    responses = labels.map((l) => map.get(l)!);
    if (rows.some((r, i) => r.label !== labels[i])) notes.push('Runs herkend aan hun label en in standaardvolgorde (Yates) gezet.');
  } else {
    need(labelled === 0, 'Geef ofwel voor alle runs een label in de eerste kolom, ofwel voor geen enkele.');
    need(rows.length === N, `Het ${designName} heeft ${N} runs, maar er zijn ${rows.length} rijen ingevuld.${[4, 8, 16, 32].includes(rows.length) && rows.length !== N ? ` (${rows.length} runs past bij k = ${Math.log2(rows.length)}${designName.includes('-1)') ? ' + 1' : ''}.)` : ''}`);
    responses = rows.map((r) => r.vals);
  }
  responses.forEach((r, i) => need(r.length > 0, `Run ${labels[i]} heeft geen respons.`));
  const n = responses[0].length;
  need(responses.every((r) => r.length === n), `Ongelijk aantal herhalingen per run (${responses.map((r) => r.length).join(', ')}). Elke run moet even veel herhalingen hebben.`);
  return { responses, notes };
}

/** Lenth's pseudo standard error and margin of error (for unreplicated designs). */
function lenth(effects: number[]) {
  const m = effects.length;
  const abs = effects.map(Math.abs);
  const s0 = 1.5 * median(abs);
  const trimmed = abs.filter((v) => v < 2.5 * s0);
  const PSE = 1.5 * median(trimmed.length ? trimmed : abs);
  const d = m / 3;
  return { PSE, ME: tInvRt(0.025, d) * PSE, d };
}

/** Normal probability plot of effects with labels. */
function normalPlot(eff: { name: string; effect: number }[]) {
  const m = eff.length;
  const sorted = [...eff].sort((a, b) => a.effect - b.effect);
  const z = sorted.map((_, i) => normInv((i + 0.5) / m));
  const ex = sorted.map((e) => e.effect);
  const xr = Math.max(...ex) - Math.min(...ex) || 1;
  const x0 = Math.min(...ex) - 0.08 * xr;
  const x1 = Math.max(...ex) + 0.12 * xr;
  const y0 = Math.min(...z) - 0.3;
  const y1 = Math.max(...z) + 0.3;
  const W = 700;
  const H = 300;
  // reference line through the middle (robust): slope from Lenth PSE
  const L = lenth(ex);
  const ref: [number, number][] = L.PSE > 0 ? [[y0 * L.PSE, y0], [y1 * L.PSE, y1]] : [];
  const svg = lineChart({ series: [{ pts: sorted.map((e, i) => [e.effect, z[i]] as [number, number]), dots: true }, ...(ref.length ? [{ pts: ref.filter((p) => p[0] >= x0 && p[0] <= x1).length === 2 ? ref : clip(ref, x0, x1), cls: 'alt' }] : [])], xlabel: 'effect', ylabel: 'normale score z', x0, x1, y0, y1 }, W, H);
  const Lp = 56, Rp = 70, Tp = 14, Bp = 36;
  const X = (x: number) => Lp + ((x - x0) / (x1 - x0)) * (W - Lp - Rp);
  const Y = (y: number) => H - Bp - ((y - y0) / (y1 - y0)) * (H - Tp - Bp);
  sorted.forEach((e, i) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', String(X(e.effect) + 6));
    t.setAttribute('y', String(Y(z[i]) + 4));
    t.setAttribute('class', 'vlabel');
    t.textContent = e.name;
    svg.appendChild(t);
  });
  return svg;
}
function clip(seg: [number, number][], x0: number, x1: number): [number, number][] {
  const [[ax, ay], [bx, by]] = seg;
  const s = (by - ay) / (bx - ax || 1);
  const cx = (x: number) => Math.min(x1, Math.max(x0, x));
  const p1 = cx(ax);
  const p2 = cx(bx);
  return [[p1, ay + (p1 - ax) * s], [p2, ay + (p2 - ax) * s]];
}

function signTable(labels: string[], signRows: number[][], colNames: string[], extraCols: { name: string; vals: string[] }[] = []) {
  return table(
    ['nr', 'run', ...colNames, ...extraCols.map((c) => c.name)],
    labels.map((l, i) => [String(i + 1), l, ...signRows[i].map(sgn), ...extraCols.map((c) => c.vals[i])]),
    'signs',
  );
}

function interactionPlot(responses: number[][], k: number, fa: number, fb: number) {
  // mean response at A-/A+ for B- and B+ (averaged over other factors)
  const cell = (aHi: boolean, bHi: boolean) => {
    const vals: number[] = [];
    responses.forEach((r, run) => {
      if (!!(run & (1 << fa)) === aHi && !!(run & (1 << fb)) === bHi) vals.push(...r);
    });
    return sum(vals) / vals.length;
  };
  void k;
  const m = [[cell(false, false), cell(true, false)], [cell(false, true), cell(true, true)]];
  const svg = lineChart(
    {
      series: [
        { pts: [[-1, m[0][0]], [1, m[0][1]]], dots: true, cls: 'connect' },
        { pts: [[-1, m[1][0]], [1, m[1][1]]], dots: true, cls: 'alt connect' },
      ],
      hlines: [
        { y: m[0][1], label: `${LET[fb]}-`, cls: 'zone' },
        { y: m[1][1], label: `${LET[fb]}+`, cls: 'zone' },
      ],
      xlabel: `factor ${LET[fa]} (-1 = laag, +1 = hoog)`,
      ylabel: 'gemiddelde respons',
      x0: -1.2,
      x1: 1.2,
    },
    640,
    260,
  );
  return { svg, m };
}

/** Shared effects output (full factorial or half fraction). */
function effectsOutput(o: {
  out: DoeOut;
  responses: number[][];
  alpha: number;
  names: string[]; // display names (aliases for half fractions)
  title: string;
  question: string;
  notes: string[];
  half?: boolean;
  pairSel?: [number, number];
}) {
  const { out, alpha: a, names } = o;
  const k = out.k;
  const n = out.n;
  const N = 1 << k;
  const eff = out.effects;
  const hasErr = out.dfE > 0;
  const tc = hasErr ? tInvRt(a / 2, out.dfE) : NaN;
  const L = lenth(eff.filter((e) => !e.pooled).map((e) => e.effect));
  const lenthOk = !hasErr && eff.filter((e) => !e.pooled).length >= 15;
  const sig = eff.map((e) => (e.pooled ? false : hasErr ? (e.p ?? 1) < a : lenthOk && Math.abs(e.effect) > L.ME));
  const big = eff.filter((e) => !e.pooled).sort((p, q) => Math.abs(q.effect) - Math.abs(p.effect)).slice(0, 3).map((e) => names[eff.indexOf(e)]);
  const effRows = eff.map((e, i) => [
    names[i],
    fmt(e.contrast),
    fmt(e.effect),
    fmt(e.effect / 2),
    fmt(e.SS),
    e.pooled ? 'in fout' : hasErr ? fmt(e.F!) : '',
    e.pooled ? '' : pFmt(e.p),
    !e.pooled && hasErr ? `[${fmt(e.effect - tc * out.seEffect)} ; ${fmt(e.effect + tc * out.seEffect)}]` : '',
    !e.pooled && hasErr ? `${fmt(e.effect)} ± ${fmt(2 * out.seEffect)}` : '',
    e.pooled ? '' : !hasErr && !lenthOk ? 'visueel' : sig[i] ? 'ja' : 'nee',
  ]);
  const effTable = table(['term', 'contrast', 'effect', 'coëf. (effect/2)', 'SS', 'F', 'p', `${fmt(100 * (1 - a))}% BI (t)`, '≈ 95% BI (± 2 se)', 'significant'], effRows);
  const anovaRows: string[][] = eff.filter((e) => !e.pooled).map((e) => [names[eff.indexOf(e)], fmt(e.SS), '1', fmt(e.SS), hasErr ? fmt(e.F!) : '', hasErr ? pFmt(e.p) : '']);
  const dfPure = N * (n - 1);
  const pooled = eff.filter((e) => e.pooled);
  if (hasErr) {
    const label = pooled.length ? `Fout (${dfPure ? 'zuivere fout + ' : ''}gepoold: ${pooled.map((e) => names[eff.indexOf(e)]).join(', ')})` : 'Fout (zuivere fout, pure error)';
    anovaRows.push([label, fmt(out.SSE), String(out.dfE), fmt(out.MSE), '', '']);
  } else anovaRows.push(['Fout', '0', '0', '-', '', '']);
  anovaRows.push(['Totaal', fmt(out.SST), String(N * n - 1), '', '', '']);
  const anovaTable = table(['bron', 'SS', 'df', 'MS', 'F', 'p'], anovaRows);
  // Pareto
  const order = eff.map((_, i) => i).filter((i) => !eff[i].pooled).sort((p, q) => Math.abs(eff[q].effect) - Math.abs(eff[p].effect));
  const ref = hasErr ? tc * out.seEffect : lenthOk ? L.ME : NaN;
  const pareto = barChart(
    order.map((i) => names[i].replace(' = ', '+')),
    order.map((i) => eff[i].effect),
    { refLine: isFinite(ref) && ref > 0 ? ref : undefined, refLabel: hasErr ? `t·se = ${fmt(ref)}` : `Lenth ME = ${fmt(ref)}`, ylabel: '|effect|', highlight: order.map((i) => sig[i]) },
    700,
    260,
  );
  // formulas for effect A (first term)
  const e0 = eff[0];
  const signsA = out.totals.map((_, run) => termSign(run, e0.mask));
  const contrastTex = out.totals.map((T, i) => `${i === 0 ? (signsA[i] < 0 ? '-' : '') : signsA[i] < 0 ? '-' : '+'}${tx(T)}`).join('');
  const formula = [
    `\\text{Contrast}_X=\\sum_{runs}(\\text{teken van }X)\\cdot T_{run},\\qquad \\text{Effect}_X=\\frac{\\text{Contrast}_X}{n\\,2^{k-1}},\\qquad SS_X=\\frac{\\text{Contrast}_X^2}{n\\,2^{k}}`,
    `F_X=\\frac{SS_X/1}{MS_E},\\qquad se(\\text{effect})=\\sqrt{\\frac{MS_E}{n\\,2^{k-2}}},\\qquad \\text{BI: effect}\\pm t_{\\alpha/2;df_E}\\cdot se\\ \\approx\\ \\pm 2\\,se`,
  ];
  const substituted = [
    `\\text{Contrast}_{${names[0].replace(/ = .*/, '')}}=${contrastTex}=${tx(e0.contrast)}`,
    `\\text{Effect}_{${names[0].replace(/ = .*/, '')}}=\\frac{${tx(e0.contrast)}}{${n}\\cdot 2^{${k - 1}}}=${tx(e0.effect)},\\qquad SS=\\frac{${tx(e0.contrast)}^2}{${n}\\cdot 2^{${k}}}=${tx(e0.SS)}`,
  ];
  if (hasErr && !e0.pooled) substituted.push(`F=\\frac{${tx(e0.SS)}}{${tx(out.MSE)}}=${tx(e0.F!)}\\ (p=${tx(e0.p!)}),\\qquad se=\\sqrt{\\frac{${tx(out.MSE)}}{${n}\\cdot 2^{${k - 2}}}}=${tx(out.seEffect)}`);
  const res: (string | [string, string])[] = eff.filter((e) => !e.pooled).map((e) => [`effect ${names[eff.indexOf(e)]}`, `${fmt(e.effect)}${hasErr ? `  (F = ${fmt(e.F!)}, p = ${pFmt(e.p)})` : ''}`] as [string, string]);
  res.unshift(['n (herhalingen) ; runs ; totaal gemiddelde', `${n} ; ${N} ; ${fmt(out.grand)}`]);
  if (hasErr) res.push(['MS_E ; df_E', `${fmt(out.MSE)} ; ${out.dfE}`], ['se(effect)', fmt(out.seEffect)], [`t-kritiek (α/2; ${out.dfE})`, fmt(tc)]);
  else if (lenthOk) res.push(['Lenth PSE ; ME (benadering, geen foutterm)', `${fmt(L.PSE)} ; ${fmt(L.ME)}`]);
  else res.push(['Geen foutterm', 'beoordeel de effecten visueel (te weinig effecten voor Lenth)']);
  const sigNames = eff.map((_, i) => i).filter((i) => sig[i]).map((i) => names[i]);
  const warnings = [...o.notes];
  if (!hasErr) warnings.push('Geen herhalingen (n = 1) en niets gepoold: er is geen foutterm, dus geen F-toets. Gebruik het normaal-kansplot / Pareto (met Lenth ME als richtlijn) of pool hogere-orde interacties in de fout.');
  if (o.half) warnings.push('Halve fractie: elk geschat effect is de som van twee gealiaste (confounded) termen; de interpretatie veronderstelt dat de hogere-orde term verwaarloosbaar is.');
  const excel = [
    `Zet de tekenkolom van ${names[0].replace(/ = .*/, '')} (bv. B2:B${N + 1}) naast de runtotalen (bv. F2:F${N + 1}):`,
    `contrast: =SUMPRODUCT(B2:B${N + 1};F2:F${N + 1})   effect: =SUMPRODUCT(B2:B${N + 1};F2:F${N + 1})/(${n}*2^${k - 1})   SS: =SUMPRODUCT(B2:B${N + 1};F2:F${N + 1})^2/(${n}*2^${k})`,
    ...(hasErr && !e0.pooled
      ? [`p-waarde: =F.DIST.RT(${xl(e0.F!)};1;${out.dfE})   F-kritiek: =F.INV.RT(${xl(a)};1;${out.dfE})   t-kritiek: =T.INV.2T(${xl(a)};${out.dfE})`, `se(effect): =SQRT(${xl(out.MSE)}/(${n}*2^${k - 2}))`]
      : []),
  ];
  const answer = hasErr
    ? `${sigNames.length ? `Significant op alfa = ${nl(a)}: ${sigNames.map((s) => `${s} (effect ${nl(eff[names.indexOf(s)].effect)}, p = ${nl(eff[names.indexOf(s)].p!)})`).join(', ')}.` : `Geen enkel effect is significant op alfa = ${nl(a)}.`} De overige effecten zijn niet significant (p >= ${nl(a)}). Een effect is het verschil in gemiddelde respons tussen het hoge (+) en lage (-) niveau; de foutvariantie MS_E = ${nl(out.MSE)} met ${out.dfE} vrijheidsgraden, se(effect) = ${nl(out.seEffect)}.${sigNames.some((s) => s.replace(/ = .*/, '').length > 1) ? ' Bij een significante interactie mogen de hoofdeffecten van de betrokken factoren niet los geïnterpreteerd worden (kijk naar het interactieplot).' : ''}`
    : !lenthOk
      ? `Zonder herhalingen is er geen schatting van de fout, dus geen F-toets. De grootste effecten zijn ${big.map((s) => `${s} (${nl(eff[names.indexOf(s)].effect)})`).join(', ')}; in het normaal-kansplot en het Pareto-diagram zie je welke effecten duidelijk van de rest afwijken. De kleine effecten (vermoedelijk ruis) kunnen gepoold worden in de fout om een F-toets te doen; met een halve fractie moet je bovendien rekening houden met de aliassen.`
      : `Zonder herhalingen is er geen schatting van de fout. In het normaal-kansplot en het Pareto-diagram springen ${sigNames.length ? sigNames.join(', ') : 'geen effecten'} eruit (|effect| > Lenth ME = ${nl(L.ME)}); de overige effecten liggen op een rechte lijn rond 0 en zijn vermoedelijk ruis. Die kunnen gepoold worden in de fout om een F-toets te doen.`;
  const extra: HTMLElement[] = [h('h4', null, 'Effecten'), effTable, h('h4', null, 'ANOVA-tabel'), anovaTable, h('h4', null, 'Pareto-diagram van |effect|'), chartBox(pareto), h('p', { class: 'muted' }, hasErr ? `Referentielijn: t(α/2; ${out.dfE}) · se(effect). Gemarkeerde staven zijn significant.` : lenthOk ? 'Referentielijn: Lenth margin of error (ME), een benadering voor ongerepliceerde ontwerpen.' : 'Geen referentielijn: zonder foutterm en met minder dan 15 effecten is enkel een visuele beoordeling mogelijk (of pool kleine effecten).')];
  if (n === 1 || !hasErr || eff.length >= 7) {
    extra.push(h('h4', null, 'Normaal-kansplot van de effecten'), chartBox(normalPlot(eff.filter((e) => !e.pooled).map((e) => ({ name: names[eff.indexOf(e)].replace(' = ', '+'), effect: e.effect })))), h('p', { class: 'muted' }, 'Normale score z_i = Φ⁻¹((i - 0,5)/m). Effecten die ver van de stippellijn liggen zijn vermoedelijk echt; effecten op de lijn rond 0 zijn ruis.'));
  }
  if (o.pairSel) {
    const [fa, fb] = o.pairSel;
    const ip = interactionPlot(o.responses, k, fa, fb);
    extra.push(
      h('h4', null, `Interactieplot ${LET[fa]} x ${LET[fb]}`),
      chartBox(ip.svg),
      h('p', { class: 'muted' }, `Volle lijn: ${LET[fb]} laag (-), stippellijn: ${LET[fb]} hoog (+). Gemiddelden: ${LET[fb]}-: ${fmt(ip.m[0][0])} -> ${fmt(ip.m[0][1])}; ${LET[fb]}+: ${fmt(ip.m[1][0])} -> ${fmt(ip.m[1][1])}. Niet-evenwijdige lijnen wijzen op interactie.`),
    );
  }
  return resultPanel({ title: o.title, question: o.question, formula, substituted, result: res, warnings, excel, answer, extra });
}

// ---------- full factorial ----------
function fullTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('doe', () => run());
  const kF = f.select('k', 'k (aantal factoren)', [['2', '2 (4 runs)'], ['3', '3 (8 runs)'], ['4', '4 (16 runs)'], ['5', '5 (32 runs)']], '2');
  const nF = f.num('n', 'n herhalingen (voor lege tabel)', 2);
  const alpha = f.num('alpha', 'α', 0.05);
  const pa = f.select('pa', 'Interactieplot: factor op x-as', [['0', 'A'], ['1', 'B'], ['2', 'C'], ['3', 'D'], ['4', 'E']], '0');
  const pb = f.select('pb', 'lijnen per niveau van', [['1', 'B'], ['0', 'A'], ['2', 'C'], ['3', 'D'], ['4', 'E']], '1');
  const grid = new DataGrid({
    key: 'doe.full',
    cols: 3,
    rows: 8,
    examples: [
      {
        label: 'Voorbeeld: 2² met 2 herhalingen',
        data: () => {
          kF.set('2');
          return { headers: ['run', 'herh 1', 'herh 2'], rows: Object.entries(g.doe_2x2.runs).map(([l, v]: any) => [l, ...v]) };
        },
      },
      {
        label: 'Voorbeeld: 2⁴ zonder herhaling (filtratie)',
        data: () => {
          kF.set('4');
          const y = [45, 71, 48, 65, 68, 60, 80, 65, 43, 100, 45, 104, 75, 86, 70, 96];
          return { headers: ['run', 'y'], rows: runLabels(4).map((l, i) => [l, y[i]]) };
        },
      },
    ],
    onChange: () => run(),
  });
  const makeBtn = h('button', { type: 'button', class: 'btn' }, 'Lege tabel maken (runlabels + n kolommen)');
  makeBtn.addEventListener('click', () => {
    const k = +kF.get();
    const n = Math.max(1, Math.min(10, Math.round(parseNum(String(nF.get())) ?? 1)));
    grid.setData(['run', ...Array.from({ length: n }, (_, i) => `herh ${i + 1}`)], runLabels(k).map((l) => [l]));
  });
  const poolBox = h('div', { class: 'row' });
  let poolKey = '';
  let poolCbs: HTMLInputElement[] = [];
  function syncPool(k: number) {
    if (poolKey === String(k)) return;
    poolKey = String(k);
    const saved = store.get<string[]>(`doe.pool.${k}`, []);
    poolCbs = terms(k).map((t) => {
      const cb = h('input', { type: 'checkbox' }) as HTMLInputElement;
      cb.checked = saved.includes(t.name);
      cb.dataset.name = t.name;
      cb.addEventListener('change', () => {
        store.set(`doe.pool.${k}`, poolCbs.filter((c) => c.checked).map((c) => c.dataset.name));
        run();
      });
      return cb;
    });
    const setOrder = (minOrder: number) => {
      poolCbs.forEach((c) => (c.checked = c.dataset.name!.length >= minOrder));
      store.set(`doe.pool.${k}`, poolCbs.filter((c) => c.checked).map((c) => c.dataset.name));
      run();
    };
    const b = (txt: string, fn: () => void) => {
      const x = h('button', { type: 'button', class: 'btn' }, txt);
      x.addEventListener('click', fn);
      return x;
    };
    poolBox.replaceChildren(
      h(
        'div',
        { class: 'field' },
        h('span', { class: 'lbl' }, 'Poolen in de fout (pooling): aangevinkte termen gaan naar de foutterm'),
        h('div', { class: 'row', style: { marginBottom: '0' } }, poolCbs.map((cb) => h('label', { class: 'field check' }, cb, h('span', null, cb.dataset.name!))), b('geen', () => setOrder(99)), k >= 3 ? b('orde ≥ 3', () => setOrder(3)) : null, b('orde ≥ 2', () => setOrder(2))),
      ),
    );
  }
  const signBox = h('div');
  el.append(
    card(
      'Volledig factorieel 2^k-ontwerp (full factorial)',
      h('p', { class: 'muted' }, 'Eén rij per run in standaardvolgorde (Yates): (1), a, b, ab, c, ac, bc, abc, ... Eerste kolom mag het runlabel bevatten (dan mag de volgorde vrij zijn), de volgende kolommen zijn de herhalingen (replicates). Zonder labels worden de rijen in standaardvolgorde gelezen.'),
      row(kF.el, nF.el, makeBtn, alpha.el),
      grid.el,
      poolBox,
      row(pa.el, pb.el),
    ),
    signBox,
    out,
  );
  run = live(out, () => {
    const k = +kF.get();
    syncPool(k);
    const a = prob(alpha.get(), 'α');
    const labels = runLabels(k);
    const N = 1 << k;
    const T = terms(k);
    const signRows = labels.map((_, run) => T.map((t) => termSign(run, t.mask)));
    let responses: number[][] | null = null;
    let notes: string[] = [];
    let errMsg = '';
    try {
      ({ responses, notes } = readRuns(grid, labels, `2^${k}-ontwerp`));
    } catch (e: any) {
      errMsg = e?.message ?? String(e);
    }
    const totals = responses ? responses.map(sum) : null;
    signBox.replaceChildren(
      card(
        `Tekentabel 2^${k} (sign table, ${N} runs)`,
        signTable(labels, signRows, T.map((t) => t.name), totals ? [{ name: 'totaal T', vals: totals.map((v) => fmt(v)) }, { name: 'gemiddelde', vals: totals.map((v, i) => fmt(v / responses![i].length)) }] : []),
        h('p', { class: 'muted' }, 'Hoofdeffect-kolom: - = laag niveau, + = hoog niveau. Interactiekolom = product van de tekens van de betrokken factoren.'),
      ),
    );
    if (!responses) throw new InputError(errMsg);
    const pool = poolCbs.filter((c) => c.checked).map((c) => c.dataset.name!);
    need(pool.length < T.length, 'Je kan niet alle termen poolen.');
    const fit = factorial(k, responses, pool);
    const fa = +pa.get();
    const fb = +pb.get();
    const pairOk = fa < k && fb < k && fa !== fb;
    if (!pairOk) notes.push(`Interactieplot: kies twee verschillende factoren uit ${LET.slice(0, k).split('').join(', ')}.`);
    return effectsOutput({
      out: fit,
      responses,
      alpha: a,
      names: T.map((t) => t.name),
      title: `Effecten en ANOVA 2^${k}`,
      question: `Welke hoofdeffecten en interacties zijn significant (α = ${fmt(a)})? \\(H_0\\): effect = 0 voor elke term.`,
      notes,
      pairSel: pairOk ? [fa, fb] : undefined,
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- half fraction ----------
function halfTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('doeh', () => run());
  const kF = f.select('k', 'k (aantal factoren)', [['3', '2^(3-1) (4 runs)'], ['4', '2^(4-1) (8 runs)'], ['5', '2^(5-1) (16 runs)']], '4');
  const alpha = f.num('alpha', 'α', 0.05);
  const grid = new DataGrid({
    key: 'doe.half',
    cols: 2,
    rows: 8,
    examples: [
      {
        label: 'Voorbeeld: 2^(4-1), I = ABCD (filtratie)',
        data: () => {
          kF.set('4');
          const hf = halfFraction(4);
          const y = [45, 100, 45, 65, 75, 60, 80, 96];
          return { headers: ['run', 'y'], rows: hf.labels.map((l, i) => [l, y[i]]) };
        },
      },
    ],
    onChange: () => run(),
  });
  const makeBtn = h('button', { type: 'button', class: 'btn' }, 'Lege tabel maken (runlabels)');
  makeBtn.addEventListener('click', () => {
    const hf = halfFraction(+kF.get());
    grid.setData(['run', 'y'], hf.labels.map((l) => [l]));
  });
  const designBox = h('div');
  el.append(
    card(
      'Halve fractie 2^(k-1) (fractional factorial)',
      h('p', { class: 'muted' }, 'Generator: de laatste factor = product van de andere (bv. D = ABC), dus de definiërende relatie is I = ABCD. Vul één respons per run in (runlabel in de eerste kolom is optioneel; zonder label in de getoonde volgorde).'),
      row(kF.el, makeBtn, alpha.el),
      grid.el,
    ),
    designBox,
    out,
  );
  run = live(out, () => {
    const k = +kF.get();
    const a = prob(alpha.get(), 'α');
    const hf = halfFraction(k);
    const base = k - 1;
    const gen = (1 << k) - 1;
    const baseTerms = terms(base);
    const word = (m: number) => {
      let s = '';
      for (let j = 0; j < 8; j++) if (m & (1 << j)) s += LET[j];
      return s || 'I';
    };
    const aliasNames = baseTerms.map((t) => {
      const al = word(t.mask ^ gen);
      return `${t.name} = ${al}`;
    });
    // effect columns of the k factors for the run table
    designBox.replaceChildren(
      card(
        `Ontwerp 2^(${k}-1): ${hf.labels.length} runs, resolutie ${ROMAN[hf.resolution]}`,
        h('div', { class: 'kv' }, h('span', { class: 'k' }, 'Generator'), h('span', { class: 'v' }, hf.generator.replace(/= (\w+)$/, (_, w) => '= ' + w))),
        h('div', { class: 'kv' }, h('span', { class: 'k' }, 'Definiërende relatie (defining relation)'), h('span', { class: 'v' }, hf.definingRelation)),
        h('div', { class: 'kv' }, h('span', { class: 'k' }, 'Resolutie (resolution)'), h('span', { class: 'v' }, `${ROMAN[hf.resolution]} (lengte van het kortste woord)`)),
        signTable(hf.labels, hf.runs, LET.slice(0, k).split('')),
        h('h4', null, 'Aliasstructuur (alias list)'),
        table(['effect', 'gealiast met (confounded with)'], hf.aliases.map((s) => s.split(' = '))),
        h('p', { class: 'muted' }, `Alias van een term = term x ${hf.definingRelation.slice(4)} (letters die twee keer voorkomen vallen weg, A² = I). ${hf.resolution === 3 ? 'Resolutie III: hoofdeffecten zijn gealiast met 2-factor-interacties.' : hf.resolution === 4 ? 'Resolutie IV: hoofdeffecten zijn vrij van 2-factor-interacties, maar 2-factor-interacties zijn onderling gealiast.' : 'Resolutie V: hoofdeffecten en 2-factor-interacties zijn enkel gealiast met interacties van orde 3 of hoger.'}`),
      ),
    );
    const { responses, notes } = readRuns(grid, hf.labels, `2^(${k}-1)-ontwerp`);
    // compute as full factorial in the k-1 base factors (labels of base factors only)
    const fit = factorial(base, responses, []);
    return effectsOutput({
      out: fit,
      responses,
      alpha: a,
      names: aliasNames,
      title: `Gealiaste effecten 2^(${k}-1)`,
      question: `Geschatte (gealiaste) effecten van de halve fractie met ${hf.definingRelation}.`,
      notes,
      half: true,
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

function theoryTab(el: HTMLElement) {
  el.append(
    card(
      'Principes van proefopzet (design of experiments)',
      h(
        'ul',
        null,
        h('li', null, h('b', null, 'Randomisatie (randomization): '), 'voer de runs in willekeurige volgorde uit, zodat onbekende storende factoren (drift, temperatuur, operator) niet systematisch samenvallen met een factor. De standaardvolgorde (Yates) is enkel de notatievolgorde, niet de uitvoeringsvolgorde.'),
        h('li', null, h('b', null, 'Herhaling (replication): '), 'elke run n keer onafhankelijk opnieuw uitvoeren (nieuwe instelling), niet enkel opnieuw meten. Geeft een schatting van de zuivere fout (MS_E met 2^k(n - 1) df) en dus F-toetsen en BI voor de effecten.'),
        h('li', null, h('b', null, 'Blokken (blocking): '), 'groepeer runs in homogene blokken (bv. per dag of per batch grondstof) om een gekende storende factor te elimineren. Bij een 2^k-ontwerp wordt het blok meestal geconfundeerd met de hoogste-orde interactie (bv. ABC).'),
      ),
    ),
    card(
      'Effecten en interacties',
      h(
        'ul',
        null,
        h('li', null, 'Hoofdeffect A = gemiddelde respons bij A+ min gemiddelde bij A-  = contrast / (n·2^(k-1)).'),
        h('li', null, 'Interactie AB: het effect van A hangt af van het niveau van B (niet-evenwijdige lijnen in het interactieplot). AB = halve verschil van het A-effect bij B+ en bij B-.'),
        h('li', null, 'Regressiecoëfficiënt in gecodeerde eenheden (-1/+1) = effect / 2.'),
        h('li', null, 'Zonder herhalingen: gebruik een normaal-kansplot of Pareto van de effecten, of pool hogere-orde interacties (sparsity of effects: de meeste hogere-orde interacties zijn verwaarloosbaar).'),
      ),
    ),
    card(
      'Fractionele ontwerpen, aliasing en resolutie',
      h(
        'ul',
        null,
        h('li', null, 'Een halve fractie 2^(k-1) gebruikt de helft van de runs. De generator (bv. C = AB) bepaalt de definiërende relatie I = ABC.'),
        h('li', null, 'Confounding / aliasing: twee termen hebben in de fractie exact dezelfde tekenkolom en zijn dus niet te onderscheiden. Alias van een term = term x definiërend woord (A·ABC = A²BC = BC).'),
        h('li', null, 'Resolutie = lengte van het kortste woord in de definiërende relatie. III: hoofdeffecten gealiast met 2-factor-interacties. IV: hoofdeffecten vrij van 2fi, 2fi onderling gealiast. V: hoofdeffecten en 2fi vrij van elkaar.'),
        h('li', null, 'Kies een zo hoog mogelijke resolutie; voor een halve fractie met I = ABC..K is de resolutie gelijk aan k.'),
      ),
      note('Een fractioneel ontwerp is ideaal voor screening (veel factoren, weinig runs). Daarna kan de fractie aangevuld worden (fold-over, andere helft) om gealiaste effecten te scheiden.', 'info'),
    ),
  );
}

export const doe: ModuleDef = {
  id: 'doe',
  title: 'DOE 2^k',
  group: 'Fase 2',
  keywords: ['DOE', 'design of experiments', 'proefopzet', 'factorieel', 'factorial', '2^k', 'effect', 'hoofdeffect', 'interactie', 'interaction', 'Yates', 'standaardvolgorde', 'contrast', 'tekentabel', 'alias', 'aliasing', 'confounding', 'fractioneel', 'halve fractie', 'resolutie', 'pooling', 'normaal-kansplot', 'Pareto effecten'],
  subs: [
    ['full', 'Volledig factorieel 2^k (effecten, ANOVA, Yates)', 'DOE factorieel effect interactie Yates contrast tekentabel pooling proefopzet'],
    ['half', 'Halve fractie 2^(k-1) (alias, resolutie)', 'fractioneel alias confounding resolutie generator definierende relatie'],
    ['theorie', 'DOE theorie: randomisatie, blokken, herhaling', 'randomisatie blokken replicatie resolutie confounding proefopzet'],
  ],
  mount(el) {
    moduleHead(el, 'DOE 2^k (factoriële proefopzet)', 'Volledig factoriële 2^k-ontwerpen en halve fracties: effecten, ANOVA, Pareto, normaal-kansplot, interacties en aliassen.');
    const t = tabs('doe', [
      { id: 'full', label: 'Volledig 2^k', build: fullTab },
      { id: 'half', label: 'Halve fractie 2^(k-1)', build: halfTab },
      { id: 'theorie', label: 'Theorie', build: theoryTab },
    ], el);
    return { route: (sub, params) => sub && t.show(sub, params) };
  },
};
