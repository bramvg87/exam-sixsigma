// M3 Capabiliteit: Cp/Cpk/Pp/Ppk, % out, sigma level, DPMO, discrete capability.
import { h, fmt, tx, xl, nl, pctNl } from '../ui/core.ts';
import { Form, row, card, note } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { densityPlot, chartBox } from '../components/charts.ts';
import { normPdf, normSf } from '../stats/dist.ts';
import { capability, sigmaForCpk, judgement, dpmoFromSigma, sigmaFromDpmo, discrete } from '../calc/capability.ts';
import { constFor } from '../calc/spc.ts';
import { mean, sdS, range } from '../stats/desc.ts';
import { live, need, moduleHead, pos, posInt } from './util.ts';
import { tabs, type ModuleDef } from './types.ts';
import G from '../../testdata/golden_values.json';

const ppm = (p: number) => fmt(p * 1e6) + ' ppm';

function contTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('cap', () => run());
  const mode = f.seg('mode', 'Invoer', [['direct', 'μ en σ rechtstreeks'], ['ind', 'Data: één kolom individuele waarden'], ['sub', 'Data: subgroepen in rijen']], 'direct');
  const mu = f.num('mu', 'μ (gemiddelde)', 1440);
  const sST = f.num('sigma', 'σ korte termijn (binnen)', 10);
  const sLT = f.optNum('sigmaLT', 'σ lange termijn (overall, optioneel)', '');
  const est = f.seg('est', 'Schatting σ korte termijn', [['rbar', 'R̄/d₂'], ['sbar', 's̄/c₄'], ['sbarraw', 's̄ (zonder c₄, zoals slide)']], 'rbar');
  const LSL = f.optNum('LSL', 'LSL (ondergrens, leeg = geen)', 1400);
  const USL = f.optNum('USL', 'USL (bovengrens, leeg = geen)', 1460);
  const target = f.num('target', 'doel-Cpk', 1.33);
  const grid = new DataGrid({
    key: 'cap',
    cols: 5,
    examples: [
      { label: 'Voorbeeld: SPC oefening 2 (subgroepen)', data: () => ({ headers: ['x1', 'x2', 'x3', 'x4', 'x5'], rows: (G as any).spc_ex2.data }) },
      { label: 'Voorbeeld: individuele waarden', data: () => ({ headers: ['meting'], rows: (G as any).t_test_mean.data.map((v: number) => [v]) }) },
    ],
    onChange: () => run(),
  });
  const directRow = row(mu.el, sST.el, sLT.el);
  el.append(card('Procescapabiliteit (process capability)', h('p', { class: 'muted' }, 'Examen vraag 3: LSL 1400, USL 1460, μ 1440, σ 10. Bij data: σ overall (s van alle waarden) geeft Pp/Ppk, σ binnen subgroepen geeft Cp/Cpk.'), row(mode.el), directRow, row(est.el), grid.el, row(LSL.el, USL.el, target.el)), out);

  run = live(out, () => {
    const m = mode.get();
    directRow.hidden = m !== 'direct';
    grid.el.hidden = m === 'direct';
    est.el.hidden = m !== 'sub';
    let MU: number, SST: number, SLT: number | undefined;
    let srcNote = '';
    if (m === 'direct') {
      MU = mu.get();
      SST = pos(sST.get(), 'σ');
      SLT = sLT.get();
    } else if (m === 'ind') {
      const c = grid.getFilledColumns()[0];
      need(!!c && c.values.length >= 2, 'Plak minstens 2 waarden in de eerste kolom.');
      MU = mean(c.values);
      SST = sdS(c.values);
      SLT = SST;
      srcNote = `n = ${c.values.length}, x̄ = ${fmt(MU)}, s = ${fmt(SST)}. Met één kolom is enkel σ overall gekend: Cp/Cpk = Pp/Ppk.`;
    } else {
      const rows = grid.getMatrix().map((r) => r.filter((v): v is number => v !== null)).filter((r) => r.length);
      need(rows.length >= 2, 'Minstens 2 subgroepen (rijen) nodig.');
      const n = rows[0].length;
      need(rows.every((r) => r.length === n), 'Alle subgroepen moeten even groot zijn.');
      const c = constFor(n);
      const all = rows.flat();
      MU = mean(all);
      const Rb = mean(rows.map(range));
      const sb = mean(rows.map(sdS));
      const e = est.get();
      SST = e === 'rbar' ? Rb / c.d2 : e === 'sbar' ? sb / c.c4 : sb;
      SLT = sdS(all);
      srcNote = `${rows.length} subgroepen van n = ${n}: X̄̄ = ${fmt(MU)}, R̄ = ${fmt(Rb)}, s̄ = ${fmt(sb)}; σ binnen = ${e === 'rbar' ? `R̄/d₂ = ${fmt(Rb)}/${c.d2}` : e === 'sbar' ? `s̄/c₄ = ${fmt(sb)}/${c.c4}` : 's̄'} = ${fmt(SST)}; σ overall = ${fmt(SLT)}.`;
    }
    const L = LSL.get();
    const U = USL.get();
    need(L !== undefined || U !== undefined, 'Geef minstens één specificatiegrens (LSL of USL).');
    if (L !== undefined && U !== undefined) need(U > L, 'USL moet groter zijn dan LSL.');
    const c = capability(MU, SST, L, U);
    const lt = SLT !== undefined ? capability(MU, SLT, L, U) : null;
    const tg = pos(target.get(), 'doel-Cpk');
    const sNeed = sigmaForCpk(MU, tg, L, U);
    const both = L !== undefined && U !== undefined;
    const zST = c.zMin;
    const dpmoLT = normSf(zST - 1.5) * 1e6;
    const res: [string, string][] = [];
    if (both) res.push(['Cp', fmt(c.Cp)]);
    res.push([`Cpk (beperkend: ${c.limiting})`, fmt(c.Cpk)]);
    if (U !== undefined) res.push(['Cpu = (USL-μ)/3σ', fmt(c.Cpu)]);
    if (L !== undefined) res.push(['Cpl = (μ-LSL)/3σ', fmt(c.Cpl)]);
    if (lt && SLT !== SST) {
      if (both) res.push(['Pp (σ overall)', fmt(lt.Cp)]);
      res.push(['Ppk (σ overall)', fmt(lt.Cpk)]);
    }
    if (L !== undefined) res.push(['% onder LSL', `${pctNl(c.pBelow)} (${ppm(c.pBelow)})`]);
    if (U !== undefined) res.push(['% boven USL', `${pctNl(c.pAbove)} (${ppm(c.pAbove)})`]);
    res.push(['% uitval totaal', `${pctNl(c.pTotal)} (${ppm(c.pTotal)})`]);
    if (c.centred) res.push([`Indien gecentreerd (μ = ${fmt(c.centred.mu)}): Cpk ; uitval`, `${fmt(c.centred.Cpk)} ; ${pctNl(c.centred.pTotal)}`]);
    res.push([`σ nodig voor Cpk = ${fmt(tg)} (huidig μ)`, fmt(sNeed)]);
    if (both) res.push([`σ nodig voor Cp = ${fmt(tg)} (gecentreerd)`, fmt((U! - L!) / (6 * tg))]);
    res.push(['Sigma-niveau korte termijn Z = 3·Cpk', fmt(zST)], ['DPMO lange termijn (1,5σ-shift)', fmt(dpmoLT)], ['Oordeel Cpk', judgement(c.Cpk)]);
    const lines = [{ x: MU, label: 'μ', cls: 'mean' }];
    if (L !== undefined) lines.push({ x: L, label: 'LSL', cls: 'spec' });
    if (U !== undefined) lines.push({ x: U, label: 'USL', cls: 'spec' });
    const lo = Math.min(MU - 4 * SST, L ?? Infinity) - SST * 0.5;
    const hi = Math.max(MU + 4 * SST, U ?? -Infinity) + SST * 0.5;
    const shade: [number, number][] = [];
    if (L !== undefined) shade.push([lo - 1e9, L]);
    if (U !== undefined) shade.push([U, hi + 1e9]);
    const formula = [
      both ? `C_p=\\frac{USL-LSL}{6\\sigma},\\quad C_{pk}=\\min\\left(\\frac{USL-\\mu}{3\\sigma},\\frac{\\mu-LSL}{3\\sigma}\\right)` : `C_{pk}=\\frac{${U !== undefined ? 'USL-\\mu' : '\\mu-LSL'}}{3\\sigma}`,
      `P(\\text{uitval}) = \\Phi\\left(\\frac{LSL-\\mu}{\\sigma}\\right) + 1-\\Phi\\left(\\frac{USL-\\mu}{\\sigma}\\right)`,
    ];
    const sub: string[] = [];
    if (both) sub.push(`C_p=\\frac{${tx(U!)}-${tx(L!)}}{6\\cdot ${tx(SST)}}=${tx(c.Cp)}`);
    sub.push(`C_{pk}=\\min\\left(\\frac{${U !== undefined ? `${tx(U)}-${tx(MU)}` : '-'}}{3\\cdot ${tx(SST)}},\\ \\frac{${L !== undefined ? `${tx(MU)}-${tx(L)}` : '-'}}{3\\cdot ${tx(SST)}}\\right)=${tx(c.Cpk)}`);
    const zs: string[] = [];
    if (L !== undefined) zs.push(`z_L=\\frac{${tx(L)}-${tx(MU)}}{${tx(SST)}}=${tx(-c.zL)}\\Rightarrow ${tx(c.pBelow)}`);
    if (U !== undefined) zs.push(`z_U=\\frac{${tx(U)}-${tx(MU)}}{${tx(SST)}}=${tx(c.zU)}\\Rightarrow ${tx(c.pAbove)}`);
    sub.push(zs.join(',\\quad '));
    const excel: string[] = [];
    if (U !== undefined) excel.push(`boven USL: =1-NORM.DIST(${xl(U)};${xl(MU)};${xl(SST)};WAAR)`);
    if (L !== undefined) excel.push(`onder LSL: =NORM.DIST(${xl(L)};${xl(MU)};${xl(SST)};WAAR)`);
    if (both) excel.push(`Cp: =(${xl(U!)}-${xl(L!)})/(6*${xl(SST)})`);
    excel.push(`Cpk: =MIN(${U !== undefined ? `(${xl(U)}-${xl(MU)})/(3*${xl(SST)})` : ''}${both ? ';' : ''}${L !== undefined ? `(${xl(MU)}-${xl(L)})/(3*${xl(SST)})` : ''})`);
    const improve = both ? `Verbeteren kan door (1) het proces te centreren (mu naar ${nl(c.centred!.mu)}: Cpk wordt ${nl(c.centred!.Cpk)} en de uitval ${pctNl(c.centred!.pTotal)}) en (2) de spreiding te verkleinen (voor Cpk = ${nl(tg)} is sigma <= ${nl(sNeed)} nodig bij het huidige gemiddelde); eventueel (3) de toleranties herbekijken met de klant.` : `Verbeteren kan door het gemiddelde verder van de grens te leggen of de spreiding te verkleinen (sigma <= ${nl(sNeed)} voor Cpk = ${nl(tg)}).`;
    const answer = `${both ? `Cp = ${nl(c.Cp)}: ${c.Cp >= 1 ? 'de spreiding past binnen de tolerantie' : 'de spreiding is groter dan de tolerantie'}. ` : ''}Cpk = ${nl(c.Cpk)}${both ? ` (${c.limiting === 'USL' ? 'de bovengrens' : c.limiting === 'LSL' ? 'de ondergrens' : 'beide grenzen'} is beperkend)` : ''}: het proces is ${c.Cpk >= 1.33 ? 'capabel' : c.Cpk >= 1 ? 'net capabel maar zonder marge' : 'niet capabel'}. De verwachte uitval is ${pctNl(c.pTotal)}${both ? ` (${pctNl(c.pAbove)} boven USL en ${pctNl(c.pBelow)} onder LSL)` : ''}. ${improve}`;
    return resultPanel({
      question: [`Capabiliteit met \\(\\mu=${tx(MU)}\\), \\(\\sigma=${tx(SST)}\\)${L !== undefined ? `, \\(LSL=${tx(L)}\\)` : ''}${U !== undefined ? `, \\(USL=${tx(U)}\\)` : ''}`],
      formula,
      substituted: sub,
      result: res,
      decision: { text: c.Cpk >= 1.33 ? 'Capabel (Cpk ≥ 1,33)' : c.Cpk >= 1 ? 'Net capabel (1 ≤ Cpk < 1,33)' : 'Niet capabel (Cpk < 1)', kind: c.Cpk >= 1.33 ? 'accept' : 'reject' },
      warnings: [srcNote, both ? '' : 'Eenzijdige specificatie: enkel Cpk (en Ppk) zijn zinvol, geen Cp.', 'Capabiliteit heeft enkel zin voor een stabiel proces (onder statistische controle) en veronderstelt normaliteit.'].filter(Boolean),
      excel,
      answer,
      extra: [
        chartBox(densityPlot({ pdf: (x) => normPdf(x, MU, SST), x0: lo, x1: hi, shade, vlines: lines as any })),
        note('6 sigma-criterium (examen vraag 3d): hoogstens 3,4 ppm = 0,00034% uitval op lange termijn (Z = 6 met 1,5σ-shift, Cp = 2, Cpk = 1,5). Een perfect gecentreerd 6σ-proces geeft op korte termijn slechts ~0,002 ppm (2 per miljard).', 'info'),
      ],
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

function discTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('capd', () => run());
  const Dd = f.num('D', 'D (aantal defecten)', 34);
  const N = f.num('N', 'N (aantal eenheden)', 750);
  const O = f.num('O', 'O (kansen op defect per eenheid)', 8);
  el.append(card('Discrete capabiliteit: DPU, DPO, DPMO', row(Dd.el, N.el, O.el)), out);
  run = live(out, () => {
    const d = Dd.get();
    need(d >= 0, 'D moet >= 0 zijn.');
    const n = posInt(N.get(), 'N');
    const o = posInt(O.get(), 'O');
    const r = discrete(d, n, o);
    return resultPanel({
      question: 'Discrete capabiliteit uit tellingen van defecten',
      formula: ['DPU=\\frac{D}{N},\\quad DPO=\\frac{D}{N\\cdot O},\\quad DPMO=DPO\\cdot 10^6,\\quad Y_{FTY}\\approx e^{-DPU}', '\\text{sigma-niveau} = z_{1-DPO} + 1{,}5'],
      substituted: [`DPU=\\frac{${tx(d)}}{${n}}=${tx(r.DPU)},\\quad DPO=\\frac{${tx(d)}}{${n}\\cdot ${o}}=${tx(r.DPO)},\\quad DPMO=${tx(r.DPMO)}`],
      result: [['DPU', fmt(r.DPU)], ['DPO', fmt(r.DPO)], ['DPMO', fmt(r.DPMO)], ['Yield (1 - DPO)', pctNl(r.yieldDPO)], ['First time yield e^(-DPU)', pctNl(r.yieldFTY)], ['Sigma-niveau (met 1,5σ-shift)', fmt(r.sigmaLevel)]],
      excel: [`DPMO: =${xl(d)}/(${n}*${o})*10^6`, `sigma-niveau: =NORM.S.INV(1-${xl(r.DPO)})+1,5`],
      answer: `Met ${nl(d)} defecten op ${n} eenheden met elk ${o} kansen is DPO = ${nl(r.DPO)}, dus DPMO = ${nl(r.DPMO)}. Dit komt overeen met een sigma-niveau van ${nl(r.sigmaLevel)} (inclusief de conventionele 1,5 sigma-shift).`,
    });
  });
  run();
}

function dpmoTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('capdp', () => run());
  const dir = f.seg('dir', 'Omzetting', [['s2d', 'sigma-niveau -> DPMO'], ['d2s', 'DPMO -> sigma-niveau']], 's2d');
  const lvl = f.num('lvl', 'sigma-niveau', 6);
  const dp = f.num('dpmo', 'DPMO', 3.4);
  const shift = f.num('shift', 'shift (σ)', 1.5);
  el.append(card('DPMO <-> sigma-niveau', row(dir.el), row(lvl.el, dp.el, shift.el)), out);
  const rowsT = [1, 2, 3, 4, 5, 6].map((k) => [String(k), fmt(dpmoFromSigma(k), 6), pctNl(1 - dpmoFromSigma(k) / 1e6, 6), fmt(2 * normSf(k) * 1e6, 4), fmt(k / 3, 3)]);
  el.append(
    card(
      'Tabel (1,5σ-shift, eenzijdig zoals in de cursus)',
      table(['sigma-niveau', 'DPMO lange termijn', 'yield', 'ppm korte termijn gecentreerd (2 staarten)', 'Cp (gecentreerd)'], rowsT),
      h('p', { class: 'muted' }, 'Waarom 1,5σ? Op lange termijn verschuift het procesgemiddelde typisch tot 1,5σ (Motorola-conventie). Een 6σ-proces (korte termijn) levert dan Z = 4,5 tot de dichtste grens: P(Z > 4,5) = 3,4 ppm. Zonder shift en gecentreerd: 2 × P(Z > 6) = 0,002 ppm.'),
    ),
  );
  run = live(out, () => {
    const s = shift.get();
    lvl.el.hidden = dir.get() !== 's2d';
    dp.el.hidden = dir.get() === 's2d';
    if (dir.get() === 's2d') {
      const L = lvl.get();
      const d = dpmoFromSigma(L, s);
      return resultPanel({ question: `DPMO bij sigma-niveau ${fmt(L)}`, formula: [`DPMO = 10^6\\cdot\\left(1-\\Phi(Z-${tx(s)})\\right)`], substituted: [`DPMO = 10^6\\cdot(1-\\Phi(${tx(L - s)})) = ${tx(d)}`], result: [['DPMO', fmt(d)], ['% defect', pctNl(d / 1e6, 6)]], excel: [`=(1-NORM.S.DIST(${xl(L)}-${xl(s)};WAAR))*10^6`], answer: `Een proces op ${nl(L)} sigma (met ${nl(s)} sigma-shift) geeft ${nl(d)} DPMO.` });
    }
    const d = pos(dp.get(), 'DPMO');
    need(d < 1e6, 'DPMO moet kleiner zijn dan 1 000 000.');
    const L = sigmaFromDpmo(d, s);
    return resultPanel({ question: `Sigma-niveau bij ${fmt(d)} DPMO`, formula: [`Z = \\Phi^{-1}\\left(1-\\frac{DPMO}{10^6}\\right)+${tx(s)}`], substituted: [`Z = ${tx(L - s)} + ${tx(s)} = ${tx(L)}`], result: [['sigma-niveau', fmt(L)]], excel: [`=NORM.S.INV(1-${xl(d)}/10^6)+${xl(s)}`], answer: `${nl(d)} DPMO komt overeen met een sigma-niveau van ${nl(L)}.` });
  });
  run();
}

function judgeTab(el: HTMLElement) {
  el.append(
    card(
      'Beoordeling Cp / Cpk',
      table(
        ['Cp / Cpk', 'Oordeel', 'uitval gecentreerd'],
        [
          ['< 1', 'niet capabel: spreiding groter dan tolerantie', '> 0,27%'],
          ['1 - 1,33', 'net capabel, geen marge (sorteren / bewaken)', '0,27% - 63 ppm'],
          ['1,33 - 1,67', 'capabel (gangbare minimumeis)', '63 - 0,6 ppm'],
          ['≥ 1,67', 'zeer capabel (vaak eis voor nieuwe processen)', '< 0,6 ppm'],
          ['2', 'zes sigma (Cp = 2, Cpk ≥ 1,5 op lange termijn)', '0,002 ppm (3,4 ppm met shift)'],
        ],
      ),
      h('ul', null, h('li', null, 'Cp: potentieel (enkel spreiding). Cpk: werkelijk (houdt rekening met de ligging van het gemiddelde). Cpk ≤ Cp; gelijk als gecentreerd.'), h('li', null, 'Cp/Cpk met σ binnen subgroepen (korte termijn: R̄/d₂ of s̄/c₄); Pp/Ppk met σ overall (lange termijn).'), h('li', null, 'Capabiliteit pas berekenen als het proces stabiel is (regelkaart onder controle).')),
    ),
  );
}

export const capabiliteit: ModuleDef = {
  id: 'capabiliteit',
  title: 'Capabiliteit',
  group: 'Fase 1',
  keywords: ['capabiliteit', 'capability', 'cp', 'cpk', 'pp', 'ppk', 'uitval', 'ppm', 'dpmo', 'sigma niveau', 'zes sigma', '6 sigma', 'specificatie', 'tolerantie', 'LSL', 'USL'],
  subs: [
    ['cont', 'Cp / Cpk / Pp / Ppk en % uitval', 'cp cpk uitval vraag 3'],
    ['disc', 'Discrete capabiliteit DPU DPO DPMO', 'dpu dpo dpmo yield'],
    ['dpmo', 'DPMO <-> sigma-niveau (1,5 sigma shift)', 'sigma niveau shift 3,4 ppm'],
    ['oordeel', 'Beoordeling Cp/Cpk', 'oordeel capabel'],
  ],
  mount(el) {
    moduleHead(el, 'Capabiliteit (process capability)', 'Cp, Cpk, Pp, Ppk, uitval en sigma-niveau.');
    const t = tabs('capabiliteit', [
      { id: 'cont', label: 'Cp / Cpk', build: contTab },
      { id: 'disc', label: 'Discreet (DPMO)', build: discTab },
      { id: 'dpmo', label: 'DPMO <-> sigma', build: dpmoTab },
      { id: 'oordeel', label: 'Beoordeling', build: judgeTab },
    ], el);
    return { route: (sub, params) => sub && t.show(sub, params) };
  },
};
