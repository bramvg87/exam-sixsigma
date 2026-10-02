// M6 SPC regelkaarten: Xbar-R / Xbar-s, Western Electric, herziene grenzen, andere n, constanten, I-MR, theorie.
import { h, fmt, tx, xl, nl, pctNl } from '../ui/core.ts';
import { Form, row, card, note } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { controlChart, lineChart, chartBox } from '../components/charts.ts';
import { normCdf } from '../stats/dist.ts';
import { mean, sdS, range } from '../stats/desc.ts';
import { CONSTANTS, constFor, chartFromStats, limitsForN, shiftDetection, imr, type ChartOut } from '../calc/spc.ts';
import { capability } from '../calc/capability.ts';
import { parseSubgroupList, formatSubgroupList, rulesIncluded, outsideLimits, hitsByIndex, shiftTable, inControl } from '../calc/spc_extra.ts';
import { live, need, moduleHead, pos, posInt } from './util.ts';
import { tabs, type ModuleDef } from './types.ts';
import G from '../../testdata/golden_values.json';

const g2 = (G as any).spc_ex2;
const g3 = (G as any).spc_ex3;

/** Restyle excluded points (hollow grey) on a control chart produced by controlChart(). */
function markExcluded(svg: SVGElement, ex: Set<number>) {
  const dots = svg.querySelectorAll('circle.dot');
  ex.forEach((i) => {
    const c = dots[i] as SVGCircleElement | undefined;
    if (!c) return;
    c.setAttribute('style', 'fill: none; stroke: var(--muted); stroke-width: 1.6');
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    t.textContent = `Subgroep ${i + 1}: uitgesloten`;
    c.appendChild(t);
  });
  return svg;
}

/** .row has display:flex, which overrides the hidden attribute. */
const vis = (el: HTMLElement, on: boolean) => (el.style.display = on ? "" : "none");
const colLetter = (j: number) => String.fromCharCode(65 + j); // 0 -> A

// ---------- 1. Xbar-R / Xbar-s ----------
function xbarTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  let lastFlagged: number[] = [];
  const f = new Form('spcx', () => run());
  const mode = f.seg('mode', 'Invoer', [['raw', 'Ruwe data: subgroepen in rijen'], ['stats', 'Lijst van x̄ en R (of s) per subgroep']], 'raw');
  const kind = f.seg('kind', 'Spreidingskaart', [['R', 'X̄-R (bereik, range)'], ['s', 'X̄-s (standaardafwijking)']], 'R');
  const nF = f.num('n', 'n (subgroepgrootte)', 5);
  const rules = f.check('rules', 'Western Electric regels 2-4 ook toepassen op de X̄-kaart (anders enkel regel 1)', true);
  const excl = f.text('excl', 'Uitgesloten subgroepen (bv. 9, 12 of 3-5)', '');
  const LSL = f.optNum('LSL', 'LSL (optioneel)', 15.7);
  const USL = f.optNum('USL', 'USL (optioneel)', 16.7);
  const LSLs = f.optNum('LSLs', 'LSL (optioneel)', '');
  const USLs = f.optNum('USLs', 'USL (optioneel)', '');
  const rawGrid = new DataGrid({
    key: 'spcx-raw',
    cols: 5,
    examples: [{ label: 'Voorbeeld: oefening 2 (20 subgroepen x 5)', data: () => ({ headers: ['x1', 'x2', 'x3', 'x4', 'x5'], rows: g2.data }) }],
    onChange: () => run(),
  });
  const statGrid = new DataGrid({
    key: 'spcx-stat',
    cols: 2,
    headers: ['xbar', 'R'],
    examples: [{ label: 'Voorbeeld: oefening 3 (24 subgroepen, n = 5)', data: () => ({ headers: ['xbar', 'R'], rows: g3.xbar.map((v: number, i: number) => [v, g3.R[i]]) }) }],
    onChange: () => run(),
  });
  const bExcl = h('button', { type: 'button', class: 'btn btn-primary' }, 'Herzie grenzen: sluit gemarkeerde subgroepen uit');
  bExcl.addEventListener('click', () => {
    const k = mode.get() === 'raw' ? rawGrid.getMatrix().length : statGrid.getMatrix().length;
    const cur = parseSubgroupList(excl.get(), k).set;
    lastFlagged.forEach((i) => cur.add(i));
    excl.set(formatSubgroupList(cur));
    run();
  });
  const bReset = h('button', { type: 'button', class: 'btn' }, 'Alle subgroepen terug opnemen');
  bReset.addEventListener('click', () => {
    excl.set('');
    run();
  });
  const nRow = row(nF.el);
  const specRaw = row(LSL.el, USL.el);
  const specStat = row(LSLs.el, USLs.el);
  el.append(
    card(
      'X̄-R / X̄-s regelkaart (control chart)',
      h('p', { class: 'muted' }, 'Oefening 2: ruwe data, 20 subgroepen van 5 (LSL 15,7 / USL 16,7). Oefening 3: lijst van 24 subgroepgemiddelden en bereiken (n = 5). Bij "Lijst" is de tweede kolom R (X̄-R) of s (X̄-s).'),
      row(mode.el, kind.el),
      nRow,
      rawGrid.el,
      statGrid.el,
      row(rules.el),
      row(excl.el, bExcl, bReset),
      h('h4', null, 'Naar capabiliteit (specificatiegrenzen)'),
      specRaw,
      specStat,
    ),
    out,
  );

  run = live(out, () => {
    const raw = mode.get() === 'raw';
    rawGrid.el.hidden = !raw;
    statGrid.el.hidden = raw;
    vis(nRow, !raw);
    vis(specRaw, raw);
    vis(specStat, !raw);
    const kd = kind.get();
    const warn: string[] = [];
    let xbars: number[];
    let disp: number[];
    let n: number;
    let rows: number[][] | null = null;
    if (raw) {
      const m = rawGrid.getMatrix();
      const nulls = m.reduce((a, r) => a + r.filter((v) => v === null).length, 0);
      rows = m.map((r) => r.filter((v): v is number => v !== null)).filter((r) => r.length > 0);
      need(rows.length >= 2, 'Plak minstens 2 subgroepen (één subgroep per rij) in het grid.');
      n = rows[0].length;
      const bad = rows.findIndex((r) => r.length !== n);
      need(bad < 0, `Alle subgroepen moeten even groot zijn: rij 1 heeft ${n} waarden, rij ${bad + 1} heeft er ${rows[Math.max(bad, 0)].length}.${nulls ? ' (Lege cellen of tekst tellen niet mee.)' : ''}`);
      need(n >= 2, 'Subgroepgrootte n moet minstens 2 zijn (gebruik anders de I-MR kaart).');
      need(n <= 25, 'Subgroepgrootte n > 25 wordt niet ondersteund (constantentabel loopt tot 25).');
      if (nulls) warn.push(`${nulls} lege of ongeldige cel(len) genegeerd.`);
      xbars = rows.map(mean);
      disp = rows.map(kd === 'R' ? range : sdS);
    } else {
      const m = statGrid.getMatrix();
      need(m.length >= 2, `Plak minstens 2 rijen met x̄ en ${kd} in het grid.`);
      const bad = m.findIndex((r) => r.length < 2 || r[0] === null || r[1] === null);
      need(bad < 0, `Rij ${bad + 1}: vul zowel x̄ (kolom 1) als ${kd} (kolom 2) in.`);
      n = posInt(nF.get(), 'n', 2);
      need(n <= 25, 'Subgroepgrootte n > 25 wordt niet ondersteund.');
      xbars = m.map((r) => r[0] as number);
      disp = m.map((r) => r[1] as number);
      need(disp.every((v) => v >= 0), `${kd} kan niet negatief zijn.`);
    }
    const k = xbars.length;
    const pe = parseSubgroupList(excl.get(), k);
    const ex = pe.set;
    if (pe.bad.length) warn.push(`Ongeldige subgroepnummers genegeerd: ${pe.bad.join(', ')} (geldig: 1 tot ${k}).`);
    need(k - ex.size >= 2, 'Na uitsluiten blijven minder dan 2 subgroepen over.');
    const ch = chartFromStats(xbars, disp, n, kd, ex);
    const c = ch.c;
    const X = ch.Xbarbar;
    const D = ch.dispBar;
    const sigX = (ch.xLim.UCL - ch.xLim.CL) / 3;
    const xHits = rulesIncluded(xbars, X, sigX, ex, rules.get() ? [1, 2, 3, 4] : [1]);
    const dHits = outsideLimits(disp, ch.dLim.UCL, ch.dLim.LCL, ex, kd);
    const byIdx = hitsByIndex([...xHits.map((x) => ({ ...x, text: 'X̄-kaart ' + x.text.replace(/^Regel/, 'regel') })), ...dHits]);
    lastFlagged = [...byIdx.keys()].sort((a, b) => a - b);
    const inCtrl = lastFlagged.length === 0;
    const xFlags = xbars.map((_, i) => xHits.some((x) => x.index === i));
    const dFlags = disp.map((_, i) => dHits.some((x) => x.index === i));

    // notes
    if (raw && k === 20 && n === 5 && Math.abs(X - g2.Xbarbar) < 1e-9 && Math.abs(ch.dispBar - (kd === 'R' ? g2.Rbar : g2.sbar)) < 1e-9)
      warn.push('Let op (oefening 2): het klasrekenblad toont UCL 16,9 / LCL 15,7. Dat zijn GEEN X̄-kaart grenzen (eerder spec- of individuele grenzen). De correcte X̄-R grenzen zijn UCL 16,543 / LCL 15,989.');
    xbars.forEach((v, i) => {
      if (ex.has(i) || xFlags[i]) return;
      const dU = ch.xLim.UCL - v;
      const dL = v - ch.xLim.LCL;
      const lim = 0.03 * 3 * sigX;
      if (dU >= 0 && dU < lim) warn.push(`Subgroep ${i + 1} (x̄ = ${nl(v)}) ligt zeer dicht bij de UCL (${nl(ch.xLim.UCL)}): net binnen de grenzen, dus formeel geen signaal (regel 1), maar bespreek dit (verhoogde waakzaamheid, oorzaak nagaan, volgende subgroepen opvolgen).`);
      if (dL >= 0 && dL < lim) warn.push(`Subgroep ${i + 1} (x̄ = ${nl(v)}) ligt zeer dicht bij de LCL (${nl(ch.xLim.LCL)}): net binnen, maar bespreek dit.`);
    });
    if (kd === 'R' && n > 10) warn.push('n > 10: het bereik R verliest efficiëntie; een X̄-s kaart is dan beter.');
    if (ex.size) warn.push(`Herziene grenzen (revised limits): subgroep(en) ${formatSubgroupList(ex)} uitgesloten uit X̿ en ${kd === 'R' ? 'R̄' : 's̄'}. Uitsluiten mag enkel als er een aanwijsbare oorzaak (assignable cause) gevonden en weggenomen is.`);

    const A = kd === 'R' ? c.A2 : c.A3;
    const Dl = kd === 'R' ? c.D3 : c.B3;
    const Du = kd === 'R' ? c.D4 : c.B4;
    const Dc = kd === 'R' ? c.d2 : c.c4;
    const Dt = kd === 'R' ? '\\bar{R}' : '\\bar{s}';
    const At = kd === 'R' ? 'A_2' : 'A_3';
    const Lt = kd === 'R' ? 'D_3' : 'B_3';
    const Ut = kd === 'R' ? 'D_4' : 'B_4';
    const Ct = kd === 'R' ? 'd_2' : 'c_4';
    const Dn = kd === 'R' ? 'R̄' : 's̄';

    const xChart = markExcluded(controlChart(xbars, X, ch.xLim.UCL, ch.xLim.LCL, xFlags, 'x̄', ex), ex);
    const dChart = markExcluded(controlChart(disp, D, ch.dLim.UCL, ch.dLim.LCL, dFlags, kd, ex, false), ex);

    const sigRows = lastFlagged.map((i) => [String(i + 1), fmt(xbars[i]), fmt(disp[i]), byIdx.get(i)!.map((x) => x.text).join('; ')]);
    const subTbl = table(
      ['Subgroep', 'x̄', kd, 'Status / signalen'],
      xbars.map((v, i) => [String(i + 1), fmt(v), fmt(disp[i]), ex.has(i) ? 'uitgesloten' : byIdx.has(i) ? byIdx.get(i)!.map((x) => x.text).join('; ') : 'ok']),
    );
    subTbl.querySelectorAll('tbody tr').forEach((tr, i) => {
      if (byIdx.has(i)) tr.classList.add('flag');
      if (ex.has(i)) (tr as HTMLElement).style.opacity = '0.55';
    });

    // Excel
    const excel: string[] = [];
    if (raw) {
      const last = colLetter(n);
      excel.push(`x̄ per subgroep (rij 2, data in B2:${last}2): =AVERAGE(B2:${last}2)`);
      excel.push(kd === 'R' ? `R per subgroep: =MAX(B2:${last}2)-MIN(B2:${last}2)` : `s per subgroep: =STDEV.S(B2:${last}2)`);
    }
    excel.push(`X̿: =AVERAGE(kolom x̄)   ${Dn}: =AVERAGE(kolom ${kd})`);
    excel.push(`UCL x̄: =${xl(X)}+${xl(A)}*${xl(D)}`, `LCL x̄: =${xl(X)}-${xl(A)}*${xl(D)}`);
    excel.push(`UCL ${kd}: =${xl(Du)}*${xl(D)}`, `LCL ${kd}: =${xl(Dl)}*${xl(D)}`, `sigma: =${xl(D)}/${xl(Dc)}`);

    const sigList = lastFlagged.map((i) => `subgroep ${i + 1} (${byIdx.get(i)!.map((x) => x.text.replace(/:.*/, '')).join(', ')})`).join('; ');
    const answer = `Voor de X̄-${kd} kaart (n = ${n}, ${k - ex.size} subgroepen${ex.size ? `, subgroep(en) ${formatSubgroupList(ex)} uitgesloten` : ''}) is X̿ = ${nl(X)} en ${Dn} = ${nl(D)}. De grenzen van de X̄-kaart zijn UCL = ${nl(ch.xLim.UCL)} en LCL = ${nl(ch.xLim.LCL)} (${At.replace('_', '')} = ${nl(A)}); de ${kd}-kaart heeft UCL = ${nl(ch.dLim.UCL)} en LCL = ${nl(ch.dLim.LCL)}. ${inCtrl ? `Geen enkel punt valt buiten de grenzen en ${rules.get() ? 'geen enkele Western Electric regel (1-4) geeft een signaal' : 'regel 1 geeft geen signaal'}: het proces is onder statistische controle (enkel gewone oorzaken, common causes), dus het is zinvol de capabiliteit te berekenen met σ̂ = ${Dn}/${Ct.replace('_', '')} = ${nl(ch.sigmaHat)}.` : `Er zijn signalen bij ${sigList}: het proces is niet onder statistische controle. Zoek de speciale oorzaak (assignable cause), neem ze weg en herbereken de grenzen zonder die subgroep(en).`}`;

    const panel = resultPanel({
      question: [`Is het proces onder statistische controle (in control)? X̄-${kd} kaart met k = ${k} subgroepen van n = ${n}${ex.size ? `, ${ex.size} uitgesloten (herziene grenzen)` : ''}.`],
      formula: [
        `\\bar{\\bar{x}}=\\frac{1}{k}\\sum_i \\bar{x}_i,\\qquad ${Dt}=\\frac{1}{k}\\sum_i ${kd === 'R' ? 'R_i' : 's_i'}`,
        `UCL_{\\bar{x}}=\\bar{\\bar{x}}+${At}${Dt},\\quad CL_{\\bar{x}}=\\bar{\\bar{x}},\\quad LCL_{\\bar{x}}=\\bar{\\bar{x}}-${At}${Dt}`,
        `UCL_${kd}=${Ut}${Dt},\\quad CL_${kd}=${Dt},\\quad LCL_${kd}=${Lt}${Dt},\\qquad \\hat{\\sigma}=${Dt}/${Ct}`,
      ],
      substituted: [
        `UCL_{\\bar{x}}=${tx(X)}+${tx(A)}\\cdot ${tx(D)}=${tx(ch.xLim.UCL)},\\quad LCL_{\\bar{x}}=${tx(X)}-${tx(A)}\\cdot ${tx(D)}=${tx(ch.xLim.LCL)}`,
        `UCL_${kd}=${tx(Du)}\\cdot ${tx(D)}=${tx(ch.dLim.UCL)},\\quad LCL_${kd}=${tx(Dl)}\\cdot ${tx(D)}=${tx(ch.dLim.LCL)}`,
        `\\hat{\\sigma}=\\frac{${tx(D)}}{${tx(Dc)}}=${tx(ch.sigmaHat)},\\qquad \\sigma_{\\bar{x}}=\\frac{UCL-CL}{3}=${tx(sigX)}`,
      ],
      result: [
        ['X̿ (CL x̄-kaart)', fmt(X)],
        [`${Dn} (CL ${kd}-kaart)`, fmt(D)],
        ['UCL ; LCL x̄-kaart', `${fmt(ch.xLim.UCL)} ; ${fmt(ch.xLim.LCL)}`],
        [`UCL ; LCL ${kd}-kaart`, `${fmt(ch.dLim.UCL)} ; ${fmt(ch.dLim.LCL)}`],
        [`σ̂ = ${Dn}/${Ct.replace('_', '')} (binnen subgroepen)`, fmt(ch.sigmaHat)],
        [`Constanten (n = ${n})`, `${At.replace('_', '')} = ${fmt(A)} ; ${Lt.replace('_', '')} = ${fmt(Dl)} ; ${Ut.replace('_', '')} = ${fmt(Du)} ; ${Ct.replace('_', '')} = ${fmt(Dc)}`],
        ['Signalen', inCtrl ? 'geen' : `${lastFlagged.length} subgroep(en): ${formatSubgroupList(lastFlagged)}`],
      ],
      decision: inCtrl ? { text: 'Onder controle (in control): geen signalen', kind: 'accept' } : { text: `Niet onder controle (out of control): subgroep(en) ${formatSubgroupList(lastFlagged)}`, kind: 'reject' },
      warnings: warn,
      excel,
      answer,
      extra: [
        h('h4', null, `X̄-kaart`),
        chartBox(xChart),
        h('h4', null, `${kd}-kaart`),
        chartBox(dChart),
        h('p', { class: 'muted' }, 'Rood = signaal, hol grijs = uitgesloten. Stippellijnen in de X̄-kaart: zones op 1 en 2 sigma (voor regels 2 en 3).'),
        sigRows.length ? h('div', null, h('h4', null, 'Signalen (welke regel per subgroep)'), table(['Subgroep', 'x̄', kd, 'Regel(s)'], sigRows)) : note('Geen Western Electric signalen.', 'ok'),
        h('details', null, h('summary', null, `Tabel van alle ${k} subgroepen`), subTbl),
      ],
    });

    return [panel, capPanel(ch, rows, ex, raw ? LSL.get() : LSLs.get(), raw ? USL.get() : USLs.get(), inCtrl)];
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

function capPanel(ch: ChartOut, rows: number[][] | null, ex: Set<number>, L: number | undefined, U: number | undefined, inCtrl: boolean): HTMLElement {
  if (L === undefined && U === undefined) return card('Naar capabiliteit', note('Vul LSL en/of USL in om Cp/Cpk (en Pp/Ppk bij ruwe data) te berekenen met σ̂ uit de regelkaart.', 'info'));
  if (L !== undefined && U !== undefined && !(U > L)) return card('Naar capabiliteit', note('USL moet groter zijn dan LSL.', 'warn'));
  const X = ch.Xbarbar;
  const s = ch.sigmaHat;
  const cST = capability(X, s, L, U);
  const all = rows ? rows.filter((_, i) => !ex.has(i)).flat() : null;
  const sLT = all && all.length > 2 ? sdS(all) : undefined;
  const mLT = all ? mean(all) : X;
  const cLT = sLT !== undefined ? capability(mLT, sLT, L, U) : null;
  const both = L !== undefined && U !== undefined;
  const Dn = ch.kind === 'R' ? 'R̄/d2' : 's̄/c4';
  const res: [string, string][] = [['σ̂ binnen (' + Dn + ')', fmt(s)]];
  if (both) res.push(['Cp', fmt(cST.Cp)]);
  res.push([`Cpk (beperkend: ${cST.limiting})`, fmt(cST.Cpk)]);
  if (cLT) {
    res.push(['σ overall (s van alle waarden)', fmt(sLT!)]);
    if (both) res.push(['Pp', fmt(cLT.Cp)]);
    res.push(['Ppk', fmt(cLT.Cpk)]);
  }
  if (L !== undefined) res.push(['% onder LSL', pctNl(cST.pBelow)]);
  if (U !== undefined) res.push(['% boven USL', pctNl(cST.pAbove)]);
  res.push(['% uitval totaal (met σ̂)', pctNl(cST.pTotal)]);
  const excel: string[] = [];
  if (both) excel.push(`Cp: =(${xl(U!)}-${xl(L!)})/(6*${xl(s)})`);
  excel.push(`Cpk: =MIN(${[U !== undefined ? `(${xl(U)}-${xl(X)})/(3*${xl(s)})` : '', L !== undefined ? `(${xl(X)}-${xl(L)})/(3*${xl(s)})` : ''].filter(Boolean).join(';')})`);
  excel.push(`% uitval: =${[L !== undefined ? `NORM.DIST(${xl(L)};${xl(X)};${xl(s)};WAAR)` : '', U !== undefined ? `1-NORM.DIST(${xl(U)};${xl(X)};${xl(s)};WAAR)` : ''].filter(Boolean).join('+')}`);
  if (cLT) excel.push(`σ overall: =STDEV.S(alle data)`);
  const verdict = cST.Cpk >= 1.33 ? 'capabel' : cST.Cpk >= 1 ? 'net capabel zonder marge' : 'niet capabel';
  return resultPanel({
    title: 'Naar capabiliteit (process capability)',
    question: [`Capabiliteit met \\(\\bar{\\bar{x}}=${tx(X)}\\), \\(\\hat\\sigma=${tx(s)}\\)${L !== undefined ? `, \\(LSL=${tx(L)}\\)` : ''}${U !== undefined ? `, \\(USL=${tx(U)}\\)` : ''}`],
    formula: [both ? 'C_p=\\frac{USL-LSL}{6\\hat\\sigma},\\quad C_{pk}=\\min\\left(\\frac{USL-\\bar{\\bar{x}}}{3\\hat\\sigma},\\frac{\\bar{\\bar{x}}-LSL}{3\\hat\\sigma}\\right)' : 'C_{pk}=\\frac{|\\text{spec}-\\bar{\\bar{x}}|}{3\\hat\\sigma}'],
    substituted: [
      ...(both ? [`C_p=\\frac{${tx(U!)}-${tx(L!)}}{6\\cdot ${tx(s)}}=${tx(cST.Cp)}`] : []),
      `C_{pk}=\\min\\left(${U !== undefined ? `\\frac{${tx(U)}-${tx(X)}}{3\\cdot ${tx(s)}}` : '-'},\\ ${L !== undefined ? `\\frac{${tx(X)}-${tx(L)}}{3\\cdot ${tx(s)}}` : '-'}\\right)=${tx(cST.Cpk)}`,
    ],
    result: res,
    decision: { text: cST.Cpk >= 1.33 ? 'Capabel (Cpk ≥ 1,33)' : cST.Cpk >= 1 ? 'Net capabel (1 ≤ Cpk < 1,33)' : 'Niet capabel (Cpk < 1)', kind: cST.Cpk >= 1.33 ? 'accept' : 'reject' },
    warnings: [inCtrl ? '' : 'Het proces is niet onder controle: capabiliteit is dan niet betrouwbaar (eerst stabiliseren).', 'Cp/Cpk gebruiken σ binnen subgroepen (korte termijn); Pp/Ppk gebruiken σ overall (lange termijn). Normaliteit verondersteld.'].filter(Boolean),
    excel,
    answer: `Met σ̂ = ${nl(s)} uit de regelkaart is ${both ? `Cp = ${nl(cST.Cp)} en ` : ''}Cpk = ${nl(cST.Cpk)}${cLT ? ` (Pp = ${both ? nl(cLT.Cp) : '-'}, Ppk = ${nl(cLT.Cpk)} met σ overall = ${nl(sLT!)})` : ''}. Het proces is ${verdict}; de verwachte uitval is ${pctNl(cST.pTotal)}.${both && cST.Cpk < cST.Cp - 1e-9 ? ` Het proces is niet gecentreerd (${cST.limiting} beperkend): centreren en de spreiding verkleinen verbetert de capabiliteit.` : ''}`,
  });
}

// ---------- 2. Andere subgroepgrootte + detectiekans ----------
function newnTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('spcn', () => run());
  const src = f.seg('src', 'Vertrek van', [['rbar', 'X̿, R̄ en oude n'], ['sig', 'X̿ en σ̂ rechtstreeks']], 'rbar');
  const X = f.num('X', 'X̿ (centrale lijn)', 34);
  const Rb = f.num('Rbar', 'R̄ (bij oude n)', 1.766667);
  const n0 = f.num('n0', 'oude n', 5);
  const sg = f.num('sig', 'σ̂ (processpreiding)', 0.7595);
  const n1 = f.num('n1', "nieuwe n'", 3);
  const kF = f.num('k', 'verschuiving k (in σ)', 2);
  const rRow = row(Rb.el, n0.el);
  const sRow = row(sg.el);
  el.append(
    card(
      "Andere subgroepgrootte n' en detectiekans (oefening 4)",
      h('p', { class: 'muted' }, "σ̂ = R̄/d₂(n). Nieuwe grenzen X̿ ± 3σ̂/√n'. Kans op detectie van een verschuiving van het gemiddelde met kσ op de eerstvolgende subgroep."),
      row(src.el),
      row(X.el),
      rRow,
      sRow,
      row(n1.el, kF.el),
    ),
    out,
  );
  run = live(out, () => {
    const byR = src.get() === 'rbar';
    vis(rRow, byR);
    vis(sRow, !byR);
    const Xb = X.get();
    let sigma: number;
    let sigSub = '';
    let nOld: number | undefined;
    if (byR) {
      nOld = posInt(n0.get(), 'oude n', 2);
      need(nOld <= 25, 'oude n moet tussen 2 en 25 liggen.');
      const R = pos(Rb.get(), 'R̄');
      sigma = R / constFor(nOld).d2;
      sigSub = `\\hat\\sigma=\\frac{\\bar{R}}{d_2(${nOld})}=\\frac{${tx(R)}}{${tx(constFor(nOld).d2)}}=${tx(sigma)}`;
    } else sigma = pos(sg.get(), 'σ̂');
    const n = posInt(n1.get(), "nieuwe n'", 2);
    need(n <= 25, "nieuwe n' moet tussen 2 en 25 liggen.");
    const k = kF.get();
    need(k >= 0, 'k moet >= 0 zijn.');
    const L = limitsForN(Xb, sigma, n);
    const d = shiftDetection(k, n);
    const ic = inControl(3, (z) => normCdf(z));
    const old = nOld !== undefined ? shiftDetection(k, nOld) : null;
    const tbl = shiftTable(k, 2, 10);
    const t = table(['n', 'β (niet gedetecteerd)', 'P(detectie) = 1-β', 'ARL₁ = 1/(1-β)', "UCL x̄ voor deze n"], tbl.map((r) => [String(r.n), fmt(r.beta), pctNl(r.pDetect), fmt(r.ARL), fmt(Xb + (3 * sigma) / Math.sqrt(r.n))]));
    t.querySelectorAll('tbody tr').forEach((tr, i) => tbl[i].n === n && tr.classList.add('flag'));
    const ks = Array.from({ length: 61 }, (_, i) => i * 0.05);
    const series = [{ pts: ks.map((kk) => [kk, 100 * shiftDetection(kk, n).pDetect] as [number, number]), label: `n = ${n}` }];
    if (nOld !== undefined && nOld !== n) series.push({ pts: ks.map((kk) => [kk, 100 * shiftDetection(kk, nOld!).pDetect] as [number, number]), label: `n = ${nOld}`, cls: 'alt' } as any);
    const chart = lineChart({ series, vlines: [{ x: k, label: `k = ${fmt(k)}` }], xlabel: 'verschuiving k (in σ)', ylabel: 'P(detectie) %', x0: 0, x1: 3, y0: 0, y1: 100 });
    const sq = Math.sqrt(n);
    return resultPanel({
      question: [`Nieuwe regelgrenzen voor \\(n'=${n}\\) en kans om een verschuiving van \\(${tx(k)}\\sigma\\) te detecteren op de eerstvolgende subgroep.`],
      formula: [
        ...(byR ? ['\\hat\\sigma=\\bar{R}/d_2(n)'] : []),
        "UCL_{\\bar{x}}=\\bar{\\bar{x}}+3\\frac{\\hat\\sigma}{\\sqrt{n'}},\\quad LCL_{\\bar{x}}=\\bar{\\bar{x}}-3\\frac{\\hat\\sigma}{\\sqrt{n'}}",
        "\\bar{R}'=d_2(n')\\hat\\sigma,\\quad UCL_R=D_4(n')\\bar{R}',\\quad LCL_R=D_3(n')\\bar{R}'",
        "\\beta=\\Phi(3-k\\sqrt{n'})-\\Phi(-3-k\\sqrt{n'}),\\quad P(\\text{detectie})=1-\\beta,\\quad ARL_1=\\frac{1}{1-\\beta}",
      ],
      substituted: [
        ...(sigSub ? [sigSub] : []),
        `UCL_{\\bar{x}}=${tx(Xb)}+3\\cdot\\frac{${tx(sigma)}}{\\sqrt{${n}}}=${tx(L.xLim.UCL)},\\quad LCL_{\\bar{x}}=${tx(L.xLim.LCL)}`,
        `\\bar{R}'=${tx(L.c.d2)}\\cdot ${tx(sigma)}=${tx(L.rLim.CL)},\\quad UCL_R=${tx(L.c.D4)}\\cdot ${tx(L.rLim.CL)}=${tx(L.rLim.UCL)},\\quad LCL_R=${tx(L.rLim.LCL)}`,
        `\\beta=\\Phi(3-${tx(k)}\\sqrt{${n}})-\\Phi(-3-${tx(k)}\\sqrt{${n}})=\\Phi(${tx(3 - k * sq)})-\\Phi(${tx(-3 - k * sq)})=${tx(d.beta)}`,
      ],
      result: [
        ['σ̂', fmt(sigma)],
        [`UCL ; LCL x̄-kaart (n' = ${n})`, `${fmt(L.xLim.UCL)} ; ${fmt(L.xLim.LCL)}`],
        [`CL ; UCL ; LCL R-kaart (n' = ${n})`, `${fmt(L.rLim.CL)} ; ${fmt(L.rLim.UCL)} ; ${fmt(L.rLim.LCL)}`],
        [`Constanten n' = ${n}`, `A2 = ${fmt(L.c.A2)} ; d2 = ${fmt(L.c.d2)} ; D3 = ${fmt(L.c.D3)} ; D4 = ${fmt(L.c.D4)}`],
        ['β (kans op geen signaal)', fmt(d.beta)],
        ['P(detectie) op eerstvolgende subgroep', pctNl(d.pDetect)],
        ['ARL₁ (gemiddeld aantal subgroepen tot signaal)', fmt(d.ARL)],
        ['P(detectie binnen 3 subgroepen) = 1-β³', pctNl(1 - d.beta ** 3)],
        ...(old && nOld !== n ? [[`Ter vergelijking oude n = ${nOld}: P(detectie) ; ARL₁`, `${pctNl(old.pDetect)} ; ${fmt(old.ARL)}`] as [string, string]] : []),
        ['In controle: α per punt ; ARL₀', `${pctNl(ic.alpha)} ; ${fmt(ic.ARL0)}`],
      ],
      excel: [
        `UCL x̄: =${xl(Xb)}+3*${xl(sigma)}/SQRT(${n})`,
        `β: =NORM.S.DIST(3-${xl(k)}*SQRT(${n});WAAR)-NORM.S.DIST(-3-${xl(k)}*SQRT(${n});WAAR)`,
        `P(detectie): =1-(NORM.S.DIST(3-${xl(k)}*SQRT(${n});WAAR)-NORM.S.DIST(-3-${xl(k)}*SQRT(${n});WAAR))`,
        `ARL₀: =1/(2*(1-NORM.S.DIST(3;WAAR)))`,
      ],
      answer: `Met σ̂ = ${nl(sigma)} en n' = ${n} worden de grenzen van de X̄-kaart UCL = ${nl(L.xLim.UCL)} en LCL = ${nl(L.xLim.LCL)}. Een verschuiving van het gemiddelde met ${nl(k)}σ wordt op de eerstvolgende subgroep gedetecteerd met kans 1-β = ${pctNl(d.pDetect)} (ARL₁ = ${nl(d.ARL)} subgroepen)${old && nOld !== n ? `, tegenover ${pctNl(old.pDetect)} bij n = ${nOld}` : ''}. Kleinere subgroepen geven bredere X̄-grenzen en dus tragere detectie; grotere subgroepen detecteren sneller maar kosten meer metingen. Zonder verschuiving geeft de kaart gemiddeld om de ${nl(ic.ARL0, 3)} subgroepen een vals alarm (ARL₀ = 370, α = 0,27%).`,
      extra: [h('h4', null, `Detectiekans voor k = ${fmt(k)} bij n = 2 tot 10`), t, h('h4', null, 'P(detectie) in functie van k'), chartBox(chart), h('p', { class: 'muted' }, `Blauw: n = ${n}${nOld !== undefined && nOld !== n ? `; groen gestreept: oude n = ${nOld}` : ''}.`)],
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 3. Constanten ----------
function constTab(el: HTMLElement) {
  const f4 = (x: number) => fmt(x, 4);
  el.append(
    card(
      'Constanten voor regelkaarten (n = 2 tot 25)',
      h('p', { class: 'muted' }, 'Standaardtabel (AIAG / Montgomery) zoals in de cursus. n = subgroepgrootte (aantal metingen per subgroep).'),
      table(['n', 'A2', 'A3', 'd2', 'D3', 'D4', 'B3', 'B4', 'c4'], CONSTANTS.map((c) => [String(c.n), f4(c.A2), f4(c.A3), f4(c.d2), f4(c.D3), f4(c.D4), f4(c.B3), f4(c.B4), f4(c.c4)])),
    ),
    card(
      'Formules',
      resultPanel({
        question: 'Regelgrenzen X̄-R en X̄-s (3-sigma grenzen)',
        formula: [
          '\\bar{x}\\text{-}R:\\quad UCL=\\bar{\\bar{x}}+A_2\\bar{R},\\ \\ LCL=\\bar{\\bar{x}}-A_2\\bar{R};\\qquad UCL_R=D_4\\bar{R},\\ \\ LCL_R=D_3\\bar{R}',
          '\\bar{x}\\text{-}s:\\quad UCL=\\bar{\\bar{x}}+A_3\\bar{s},\\ \\ LCL=\\bar{\\bar{x}}-A_3\\bar{s};\\qquad UCL_s=B_4\\bar{s},\\ \\ LCL_s=B_3\\bar{s}',
          '\\hat\\sigma=\\frac{\\bar{R}}{d_2}\\ \\text{ of }\\ \\hat\\sigma=\\frac{\\bar{s}}{c_4},\\qquad A_2=\\frac{3}{d_2\\sqrt{n}},\\quad A_3=\\frac{3}{c_4\\sqrt{n}}',
          'I\\text{-}MR:\\quad \\hat\\sigma=\\overline{MR}/1{,}128,\\quad UCL_I=\\bar{x}\\pm 3\\hat\\sigma,\\quad UCL_{MR}=3{,}267\\,\\overline{MR}',
        ],
        result: [
          'R of s? Bij kleine subgroepen (n ≤ ~10, typisch 4 of 5) is R̄/d₂ een goede en eenvoudige schatter; bij grotere n (n > 10) verliest R efficiëntie (het gebruikt enkel min en max) en is de s-kaart beter.',
          'D3 = 0 en B3 = 0 voor kleine n: de LCL van de spreidingskaart is dan 0.',
        ],
        excel: ['A2 = 3/(d2*SQRT(n)), bv. n = 5: =3/(2,326*SQRT(5))'],
      }),
    ),
  );
}

// ---------- 4. I-MR ----------
function imrTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const grid = new DataGrid({
    key: 'spci',
    cols: 2,
    examples: [{ label: 'Voorbeeld: 20 individuele metingen', data: () => ({ headers: ['meting'], rows: (G as any).t_test_mean.data.map((v: number) => [v]) }) }],
    onChange: () => run(),
  });
  el.append(card('I-MR kaart (individuals and moving range)', h('p', { class: 'muted' }, 'Voor individuele waarden (subgroepgrootte 1), bv. trage processen of batchmetingen. Eerste kolom = metingen in tijdsvolgorde.'), grid.el), out);
  run = live(out, () => {
    const col = grid.getFilledColumns()[0];
    need(!!col && col.values.length >= 3, 'Plak minstens 3 waarden in de eerste kolom.');
    const r = imr(col.values);
    const none = new Set<number>();
    const iHits = rulesIncluded(r.x, r.X, r.sigma, none);
    const mHits = outsideLimits(r.mr, r.mrLim.UCL, r.mrLim.LCL, none, 'MR');
    const by = hitsByIndex(iHits);
    const iFlags = r.x.map((_, i) => by.has(i));
    const mFlags = r.mr.map((_, i) => mHits.some((x) => x.index === i));
    const inCtrl = by.size === 0 && mHits.length === 0;
    const sig = [...by.keys()].sort((a, b) => a - b).map((i) => [String(i + 1), fmt(r.x[i]), by.get(i)!.map((x) => x.text).join('; ')]);
    mHits.forEach((m) => sig.push([`MR ${m.index + 2}`, fmt(r.mr[m.index]), m.text]));
    return resultPanel({
      question: [`Is het proces onder controle? I-MR kaart met ${r.x.length} individuele waarden.`],
      formula: ['MR_i=|x_i-x_{i-1}|,\\quad \\hat\\sigma=\\frac{\\overline{MR}}{d_2(2)}=\\frac{\\overline{MR}}{1{,}128}', 'UCL_I=\\bar{x}+3\\hat\\sigma,\\quad LCL_I=\\bar{x}-3\\hat\\sigma,\\quad UCL_{MR}=3{,}267\\,\\overline{MR}'],
      substituted: [`\\hat\\sigma=\\frac{${tx(r.MRbar)}}{1{,}128}=${tx(r.sigma)},\\quad UCL_I=${tx(r.X)}+3\\cdot ${tx(r.sigma)}=${tx(r.iLim.UCL)},\\quad LCL_I=${tx(r.iLim.LCL)}`, `UCL_{MR}=3{,}267\\cdot ${tx(r.MRbar)}=${tx(r.mrLim.UCL)}`],
      result: [['x̄ (CL)', fmt(r.X)], ['MR̄', fmt(r.MRbar)], ['σ̂ = MR̄/1,128', fmt(r.sigma)], ['UCL ; LCL I-kaart', `${fmt(r.iLim.UCL)} ; ${fmt(r.iLim.LCL)}`], ['UCL MR-kaart', fmt(r.mrLim.UCL)]],
      decision: inCtrl ? { text: 'Onder controle: geen signalen', kind: 'accept' } : { text: 'Niet onder controle: zie signalen', kind: 'reject' },
      warnings: [col.invalid ? `${col.invalid} ongeldige cel(len) genegeerd.` : '', 'De I-kaart is gevoelig voor niet-normaliteit (geen centrale limietstelling bij n = 1).'].filter(Boolean),
      excel: ['MR (vanaf rij 3): =ABS(A3-A2)', `sigma: =AVERAGE(kolom MR)/1,128`, `UCL I: =${xl(r.X)}+3*${xl(r.sigma)}`, `UCL MR: =3,267*${xl(r.MRbar)}`],
      answer: `De I-kaart heeft CL = ${nl(r.X)}, UCL = ${nl(r.iLim.UCL)} en LCL = ${nl(r.iLim.LCL)} (σ̂ = MR̄/1,128 = ${nl(r.sigma)}); de MR-kaart heeft UCL = ${nl(r.mrLim.UCL)}. ${inCtrl ? 'Er zijn geen signalen: het proces is onder statistische controle.' : 'Er zijn signalen (zie tabel): het proces is niet onder statistische controle; zoek de speciale oorzaak.'}`,
      extra: [
        h('h4', null, 'I-kaart'),
        chartBox(controlChart(r.x, r.X, r.iLim.UCL, r.iLim.LCL, iFlags, 'x')),
        h('h4', null, 'MR-kaart'),
        chartBox(controlChart(r.mr, r.mrLim.CL, r.mrLim.UCL, r.mrLim.LCL, mFlags, 'MR', new Set(), false)),
        sig.length ? table(['Punt', 'waarde', 'Regel'], sig) : note('Geen signalen.', 'ok'),
      ],
    });
  });
  run();
}

// ---------- 5. Theorie ----------
function theorieTab(el: HTMLElement) {
  const li = (...t: (string | HTMLElement)[]) => h('li', null, ...t);
  const b = (t: string) => h('b', null, t);
  el.append(
    card(
      'Waarom regelkaarten? Gewone versus speciale oorzaken',
      h('ul', null,
        li(b('Gewone oorzaken (common causes, toevallige variatie): '), 'altijd aanwezig, veel kleine bronnen, deel van het systeem. Een proces met enkel gewone oorzaken is stabiel, onder statistische controle (in control). Verminderen vraagt een systeemverandering (management).'),
        li(b('Speciale oorzaken (special / assignable causes): '), 'sporadisch, aanwijsbaar (nieuwe grondstof, versleten gereedschap, andere operator, instelfout). Een regelkaart is bedoeld om deze te detecteren: punt buiten de grenzen of een niet-toevallig patroon.'),
        li(b('Doel: '), 'onderscheid maken tussen beide, zodat men enkel ingrijpt bij een speciale oorzaak. Regelgrenzen (UCL/LCL = CL ± 3σ van de statistiek) zijn de stem van het proces, NIET de specificatiegrenzen (stem van de klant).'),
        li(b('Tampering (overcorrectie): '), 'ingrijpen op een stabiel proces bij elke afwijking (gewone variatie) vergroot de spreiding (Deming funnel experiment). Niet bijsturen zolang er geen signaal is.'),
      ),
    ),
    card(
      'Waarom subgroepgemiddelden (normaliteit)?',
      h('ul', null,
        li('Door de centrale limietstelling (CLT) zijn subgroepgemiddelden x̄ bij benadering normaal verdeeld, ook als de individuele waarden dat niet zijn. Daardoor geldt de 3-sigma logica: P(punt buiten de grenzen | in controle) = 0,27%, ARL₀ = 370.'),
        li('σ van x̄ = σ/√n: de X̄-kaart is gevoeliger voor verschuivingen van het gemiddelde dan een kaart van individuele waarden.'),
        li('Rationele subgroepen: metingen binnen een subgroep onder gelijke omstandigheden (kort na elkaar), zodat de variatie binnen = gewone variatie en verschillen tussen subgroepen speciale oorzaken tonen.'),
        li('σ̂ binnen subgroepen = R̄/d₂ (of s̄/c₄): schatting van de korte termijn spreiding. R is de beste (eenvoudige en bijna even efficiënte) schatter bij kleine subgroepen (n < 10, typisch 4-5); bij grotere n is s beter.'),
        li('Eerst de R- (of s-) kaart beoordelen: de grenzen van de X̄-kaart hangen af van R̄; als de spreiding niet stabiel is, zijn de X̄-grenzen niet zinvol.'),
      ),
    ),
    card(
      'Western Electric regels (1-4)',
      h('p', { class: 'muted' }, 'Zones: A = tussen 2 en 3 sigma, B = tussen 1 en 2 sigma, C = binnen 1 sigma van de centrale lijn (sigma van de geplotte statistiek, σ_x̄ = (UCL-CL)/3).'),
      h('ol', null,
        li(b('Regel 1: '), '1 punt buiten de 3-sigma grenzen (boven UCL of onder LCL).'),
        li(b('Regel 2: '), '2 van 3 opeenvolgende punten voorbij 2 sigma (zone A of verder), aan dezelfde kant.'),
        li(b('Regel 3: '), '4 van 5 opeenvolgende punten voorbij 1 sigma (zone B of verder), aan dezelfde kant.'),
        li(b('Regel 4: '), '8 opeenvolgende punten aan dezelfde kant van de centrale lijn (run).'),
      ),
      h('p', null, 'Meer regels = snellere detectie van kleine verschuivingen, maar ook meer valse alarmen.'),
    ),
    card(
      'Stabiliteit versus capabiliteit',
      h('ul', null,
        li(b('Stabiel (onder controle): '), 'enkel gewone oorzaken, voorspelbaar. Zegt niets over de specificaties.'),
        li(b('Capabel: '), 'de spreiding past binnen de specificaties (Cp, Cpk ≥ 1,33). Capabiliteit is pas zinvol voor een stabiel proces.'),
        li('Een proces kan stabiel en niet capabel zijn (systeem verbeteren) of capabel maar niet stabiel (speciale oorzaken wegwerken).'),
        li('Herziene grenzen (revised limits, oefening 3): punten met een gevonden en weggewerkte speciale oorzaak uitsluiten en de grenzen herberekenen; herhaal tot er geen signalen meer zijn. Een punt net binnen de grenzen (bv. 35,0 bij UCL 35,02) is formeel geen signaal, maar verdient aandacht.'),
      ),
    ),
  );
}

export const spc: ModuleDef = {
  id: 'spc',
  title: 'SPC regelkaarten',
  group: 'Fase 2',
  keywords: ['spc', 'regelkaart', 'controlekaart', 'control chart', 'xbar', 'x-bar', 'xbar-r', 'xbar-s', 'western electric', 'UCL', 'LCL', 'subgroep', 'ARL', 'A2', 'D4', 'd2', 'c4', 'herziene grenzen', 'onder controle', 'in control', 'speciale oorzaken', 'I-MR'],
  subs: [
    ['xbar', 'X̄-R / X̄-s regelkaart, Western Electric, herziene grenzen, capabiliteit', 'xbar r s regelkaart oefening 2 oefening 3 ucl lcl herzie grenzen western electric'],
    ['newn', 'Andere subgroepgrootte en detectiekans (ARL)', 'oefening 4 nieuwe n detectie verschuiving shift beta arl'],
    ['const', 'Constantentabel A2 A3 d2 D3 D4 B3 B4 c4', 'constanten tabel a2 d2 d4 c4'],
    ['imr', 'I-MR kaart (individuele waarden)', 'individuals moving range imr'],
    ['theorie', 'Theorie: oorzaken, CLT, regels, stabiliteit vs capabiliteit', 'common special causes tampering clt normaliteit'],
  ],
  mount(el) {
    moduleHead(el, 'SPC regelkaarten (control charts)', 'X̄-R en X̄-s kaarten, Western Electric regels, herziene grenzen, andere subgroepgrootte en detectiekans.');
    const t = tabs('spc', [
      { id: 'xbar', label: 'X̄-R / X̄-s', build: xbarTab },
      { id: 'newn', label: 'Andere n / detectie', build: newnTab },
      { id: 'const', label: 'Constanten', build: constTab },
      { id: 'imr', label: 'I-MR', build: imrTab },
      { id: 'theorie', label: 'Theorie', build: theorieTab },
    ], el);
    return { route: (sub, params) => sub && t.show(sub, params) };
  },
};
