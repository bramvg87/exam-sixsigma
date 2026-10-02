// M13 Simulatie & wachtrijen: M/M/1, M/M/1/K, Poisson-proces, Monte Carlo, Little en flow efficiency.
import { h, fmt, tx, xl, nl, pctNl, pct } from '../ui/core.ts';
import { Form, row, card, note } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { barChart, densityPlot, chartBox } from '../components/charts.ts';
import { normInv, poisCdf, poisPmf, poisSf, expSf } from '../stats/dist.ts';
import { mm1, mm1k } from '../calc/misc.ts';
import { live, need, moduleHead, posInt, pos, prob } from './util.ts';
import { tabs, type ModuleDef } from './types.ts';
import G from '../../testdata/golden_values.json';

const exBtn = (label: string, fn: () => void) => h('button', { type: 'button', class: 'btn btn-sm', onclick: fn }, label);

// ---------- 1. M/M/1 ----------
function mm1Tab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('qmm1', () => run());
  const lam = f.num('lam', 'λ (aankomstintensiteit per tijdseenheid)', 4);
  const mu = f.num('mu', 'μ (bedieningsintensiteit per tijdseenheid)', 5);
  const jmax = f.num('jmax', 'Tabel P(N = j) tot j =', 10);
  const t = f.num('t', 't voor P(W > t)', 1);
  el.append(card('M/M/1-wachtrij (één bediende, Poisson-aankomsten, exponentiële bedieningstijd)', row(lam.el, mu.el, jmax.el, t.el)), out);
  run = live(out, () => {
    const L = pos(lam.get(), 'λ');
    const M = pos(mu.get(), 'μ');
    need(L < M, `Instabiele wachtrij: ρ = λ/μ = ${fmt(L / M)} ≥ 1. De rij groeit onbeperkt; gebruik M/M/1/K of verhoog μ.`);
    const J = posInt(jmax.get(), 'j', 1);
    need(J <= 200, 'j hoogstens 200.');
    const tt = t.get();
    need(tt >= 0, 't moet ≥ 0 zijn.');
    const r = mm1(L, M);
    const pj = Array.from({ length: J + 1 }, (_, j) => (1 - r.rho) * r.rho ** j);
    const pW = Math.exp(-(M - L) * tt);
    return resultPanel({
      question: [`M/M/1 met \\(\\lambda=${tx(L)}\\) en \\(\\mu=${tx(M)}\\): bezettingsgraad, aantal in systeem en wachttijden`],
      formula: ['\\rho=\\frac{\\lambda}{\\mu},\\quad P_0=1-\\rho,\\quad P(N=j)=(1-\\rho)\\rho^j', 'E[L]=\\frac{\\rho}{1-\\rho},\\quad E[L_q]=\\frac{\\rho^2}{1-\\rho},\\quad E[W]=\\frac{E[L]}{\\lambda}=\\frac{1}{\\mu-\\lambda},\\quad E[W_q]=\\frac{E[L_q]}{\\lambda}'],
      substituted: [`\\rho=\\frac{${tx(L)}}{${tx(M)}}=${tx(r.rho)},\\quad E[L]=\\frac{${tx(r.rho)}}{1-${tx(r.rho)}}=${tx(r.EL)},\\quad E[L_q]=${tx(r.ELq)}`, `E[W]=\\frac{1}{${tx(M)}-${tx(L)}}=${tx(r.EW)},\\quad E[W_q]=${tx(r.EWq)}`],
      result: [
        ['ρ (bezettingsgraad, utilisation)', `${fmt(r.rho)} (${pct(r.rho)})`],
        ['P₀ (systeem leeg)', fmt(r.P0)],
        ['E[L] (gemiddeld aantal in systeem)', fmt(r.EL)],
        ['E[L_q] (gemiddeld aantal in de rij)', fmt(r.ELq)],
        ['E[W] (gemiddelde verblijftijd)', fmt(r.EW)],
        ['E[W_q] (gemiddelde wachttijd in de rij)', fmt(r.EWq)],
        [`P(W > ${fmt(tt)}) = e^(-(μ-λ)t)`, fmt(pW)],
        [`P(N > ${J})`, fmt(r.rho ** (J + 1))],
      ],
      excel: [`ρ: =${xl(L)}/${xl(M)}`, `E[L]: =${xl(r.rho)}/(1-${xl(r.rho)})`, `E[W]: =1/(${xl(M)}-${xl(L)})`, `P(N=j): =(1-${xl(r.rho)})*${xl(r.rho)}^j`],
      answer: `De bezettingsgraad is rho = lambda/mu = ${nl(r.rho)}, dus de bediende is ${pctNl(r.rho)} van de tijd bezig en het systeem is ${pctNl(r.P0)} van de tijd leeg. Gemiddeld zijn er E[L] = ${nl(r.EL)} klanten in het systeem (${nl(r.ELq)} in de rij); de gemiddelde verblijftijd is E[W] = ${nl(r.EW)} en de wachttijd E[Wq] = ${nl(r.EWq)} tijdseenheden (Little: L = lambda W). Naarmate rho naar 1 gaat, stijgen L en W explosief.`,
      extra: [card('P(N = j)', table(['j', 'P(N = j)', 'P(N ≤ j)'], pj.map((p, j) => [String(j), fmt(p), fmt(1 - r.rho ** (j + 1))]))), chartBox(barChart(pj.map((_, j) => String(j)), pj, { ylabel: 'P(N = j)' }))],
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 2. M/M/1/K ----------
function mm1kTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('qmm1k', () => run());
  const g = (G as any).mm1k;
  const lam = f.num('lam', 'λ', g.lam);
  const mu = f.num('mu', 'μ', g.mu);
  const K = f.num('K', 'K (max. aantal in systeem, incl. in bediening)', g.K);
  el.append(card('M/M/1/K-wachtrij (beperkte capaciteit, klanten gaan verloren als het systeem vol is)', row(exBtn('Voorbeeld λ = 4, μ = 5, K = 6', () => f.setValues({ lam: 4, mu: 5, K: 6 }))), row(lam.el, mu.el, K.el)), out);
  run = live(out, () => {
    const L = pos(lam.get(), 'λ');
    const M = pos(mu.get(), 'μ');
    const k = posInt(K.get(), 'K', 1);
    need(k <= 500, 'K hoogstens 500.');
    const r = mm1k(L, M, k);
    const one = Math.abs(r.rho - 1) < 1e-12;
    return resultPanel({
      question: [`M/M/1/K met \\(\\lambda=${tx(L)}\\), \\(\\mu=${tx(M)}\\), \\(K=${k}\\): toestandskansen, verlies en verblijftijd`],
      formula: [one ? '\\pi_j=\\frac{1}{K+1}' : '\\pi_j=\\frac{(1-\\rho)\\rho^j}{1-\\rho^{K+1}},\\ j=0..K', 'E[L]=\\sum_j j\\,\\pi_j,\\quad \\lambda_{eff}=\\lambda(1-\\pi_K),\\quad E[W]=\\frac{E[L]}{\\lambda_{eff}}'],
      substituted: [`\\rho=${tx(r.rho)},\\quad \\pi_0=${tx(r.pi[0])},\\quad \\pi_K=\\pi_{${k}}=${tx(r.pi[k])}`, `E[L]=${tx(r.EL)},\\quad \\lambda_{eff}=${tx(L)}(1-${tx(r.pi[k])})=${tx(r.lamEff)},\\quad E[W]=\\frac{${tx(r.EL)}}{${tx(r.lamEff)}}=${tx(r.EW)}`],
      result: [
        ['ρ = λ/μ', fmt(r.rho)],
        ['π₀ (leeg)', fmt(r.pi[0])],
        [`π_K = verlieskans (blocking)`, `${fmt(r.pLoss)} (${pct(r.pLoss)})`],
        ['E[L]', fmt(r.EL)],
        ['E[L_q] = E[L] - (1 - π₀)', fmt(r.ELq)],
        ['λ_eff = λ(1 - π_K)', fmt(r.lamEff)],
        ['Verloren klanten per tijdseenheid λπ_K', fmt(L * r.pLoss)],
        ['E[W] = E[L]/λ_eff', fmt(r.EW)],
        ['E[W_q] = E[L_q]/λ_eff', fmt(r.EWq)],
        ['Bezettingsgraad bediende 1 - π₀', fmt(1 - r.pi[0])],
      ],
      warnings: ['Little met verliescorrectie: deel door λ_eff (de klanten die effectief binnenkomen), niet door λ.'],
      excel: [one ? `π_j: =1/(${k}+1)` : `π_j: =(1-${xl(r.rho)})*${xl(r.rho)}^j/(1-${xl(r.rho)}^(${k}+1))`, 'E[L]: =SUMPRODUCT(j;pi_j)', `E[W]: =${xl(r.EL)}/(${xl(L)}*(1-${xl(r.pi[k])}))`],
      answer: `Met rho = ${nl(r.rho)} en capaciteit K = ${k} is het systeem ${pctNl(r.pi[0])} van de tijd leeg en ${pctNl(r.pLoss)} van de tijd vol: zoveel aankomsten gaan verloren. Gemiddeld zijn er E[L] = ${nl(r.EL)} klanten in het systeem. Volgens Little met verliescorrectie is de effectieve aankomstintensiteit lambda_eff = ${nl(r.lamEff)}, dus de gemiddelde verblijftijd E[W] = ${nl(r.EL)}/${nl(r.lamEff)} = ${nl(r.EW)}.`,
      extra: [card('Toestandskansen π_j', table(['j', 'π_j', 'cumulatief'], r.pi.map((p, j) => [String(j), fmt(p), fmt(r.pi.slice(0, j + 1).reduce((a, b) => a + b, 0))]))), chartBox(barChart(r.pi.map((_, j) => String(j)), r.pi, { ylabel: 'π_j', highlight: r.pi.map((_, j) => j === k) }))],
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 3. Poisson process ----------
function poissonTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('qpois', () => run());
  const l1 = f.num('l1', 'λ₁ (gebeurtenissen per tijdseenheid)', 3);
  const l2 = f.num('l2', 'λ₂ (tweede stroom, superpositie; 0 = geen)', 0);
  const p = f.num('p', 'p (thinning: fractie die meetelt; 1 = alles)', 1);
  const t = f.num('t', 't (tijdsduur)', 2);
  const k = f.num('k', 'k', 4);
  el.append(card('Poisson-proces: aantal gebeurtenissen in een tijdsinterval', h('p', { class: 'muted' }, 'N(t) ~ Poisson(λt). Superpositie van onafhankelijke Poisson-stromen: λ = λ₁ + λ₂. Thinning (elke gebeurtenis telt met kans p): λ·p. Tussenaankomsttijden zijn exponentieel met gemiddelde 1/λ.'), row(l1.el, l2.el, p.el), row(t.el, k.el)), out);
  run = live(out, () => {
    const L1 = pos(l1.get(), 'λ₁');
    const L2 = l2.get();
    need(L2 >= 0, 'λ₂ moet ≥ 0 zijn.');
    const P = prob(p.get(), 'p', false);
    need(P > 0, 'p moet > 0 zijn.');
    const T = pos(t.get(), 't');
    const K = posInt(k.get(), 'k', 0);
    const lam = (L1 + L2) * P;
    const m = lam * T;
    const pe = poisPmf(K, m), pc = poisCdf(K, m), pg = K === 0 ? 1 : poisSf(K - 1, m);
    const pT = expSf(T, lam);
    const k1 = Math.max(K + 2, Math.ceil(m + 4 * Math.sqrt(m) + 2));
    return resultPanel({
      question: [`Poisson-proces met \\(\\lambda=${L2 > 0 ? `(${tx(L1)}+${tx(L2)})` : tx(L1)}${P < 1 ? `\\cdot ${tx(P)}` : ''}=${tx(lam)}\\) over \\(t=${tx(T)}\\): kansen op \\(k=${K}\\) gebeurtenissen`],
      formula: ['P(N(t)=k)=e^{-\\lambda t}\\frac{(\\lambda t)^k}{k!},\\quad P(T>t)=e^{-\\lambda t}', '\\lambda_{super}=\\lambda_1+\\lambda_2,\\qquad \\lambda_{thin}=p\\,\\lambda'],
      substituted: [`\\lambda t=${tx(lam)}\\cdot ${tx(T)}=${tx(m)},\\quad P(N(t)=${K})=e^{-${tx(m)}}\\frac{${tx(m)}^{${K}}}{${K}!}=${tx(pe)}`],
      result: [
        ['λ (effectief)', fmt(lam)],
        ['λt = E[N(t)] = Var[N(t)]', fmt(m)],
        [`P(N(t) = ${K})`, fmt(pe)],
        [`P(N(t) ≤ ${K})`, fmt(pc)],
        [`P(N(t) ≥ ${K})`, fmt(pg)],
        [`P(N(t) = 0) = P(T > t): geen gebeurtenis in ${fmt(T)}`, fmt(pT)],
        ['Gemiddelde tussenaankomsttijd 1/λ', fmt(1 / lam)],
      ],
      excel: [`=POISSON.DIST(${K};${xl(m)};ONWAAR)`, `=POISSON.DIST(${K};${xl(m)};WAAR)`, `P(≥ ${K}): =1-POISSON.DIST(${K - 1};${xl(m)};WAAR)`, `P(T > t): =1-EXPON.DIST(${xl(T)};${xl(lam)};WAAR)`],
      answer: `Het aantal gebeurtenissen in een interval van ${nl(T)} is Poisson-verdeeld met gemiddelde lambda t = ${nl(m)}${L2 > 0 ? ' (superpositie: de intensiteiten worden opgeteld)' : ''}${P < 1 ? ` (thinning: intensiteit maal p = ${nl(P)})` : ''}. Dan is P(N = ${K}) = ${nl(pe)}, P(N <= ${K}) = ${nl(pc)} en P(N >= ${K}) = ${nl(pg)}. De kans op geen enkele gebeurtenis (tussenaankomsttijd langer dan ${nl(T)}) is e^(-${nl(m)}) = ${nl(pT)}.`,
      extra: chartBox(densityPlot({ pdf: (x) => poisPmf(x, m), x0: -0.5, x1: k1 + 0.5, discrete: { k0: 0, k1, shadeK: (x) => x === K }, xlabel: 'k (aantal in interval t)' })),
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 4. Monte Carlo ----------
function mcTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('qmc', () => run());
  const m = f.num('m', 'Gemiddelde van de runs x̄', 12.5);
  const s = f.num('s', 'Standaardafwijking s van de runs', 3.2);
  const n = f.num('n', 'Aantal runs n', 1000);
  const conf = f.num('conf', 'Betrouwbaarheid (bv. 0,95)', 0.95);
  const E = f.optNum('E', 'Gewenste foutmarge E (optioneel)', 0.1);
  el.append(card('Monte Carlo: betrouwbaarheidsinterval en aantal runs', h('p', { class: 'muted' }, 'De onzekerheid op een simulatieresultaat daalt met 1/√n: vier keer zoveel runs halveert de foutmarge.'), row(m.el, s.el, n.el), row(conf.el, E.el)), out);
  run = live(out, () => {
    const M = m.get();
    const S = pos(s.get(), 's');
    const N = posInt(n.get(), 'n', 2);
    const C = prob(conf.get(), 'betrouwbaarheid');
    const z = normInv(1 - (1 - C) / 2);
    const se = S / Math.sqrt(N);
    const marg = z * se;
    const e = E.get();
    const res: [string, string][] = [['z', fmt(z)], ['Standaardfout s/√n', fmt(se)], ['Foutmarge z·s/√n', fmt(marg)], [`${pct(C)}-BI`, `[${fmt(M - marg)} ; ${fmt(M + marg)}]`]];
    let nNeed = 0;
    if (e !== undefined) {
      pos(e, 'E');
      nNeed = Math.ceil((z * S / e) ** 2);
      res.push([`Runs nodig voor marge ${fmt(e)}`, String(nNeed)]);
    }
    return resultPanel({
      question: [`${pct(C)}-betrouwbaarheidsinterval voor het verwachte simulatieresultaat uit \\(n=${N}\\) runs`],
      formula: ['\\bar{x}\\pm z_{1-\\alpha/2}\\frac{s}{\\sqrt{n}},\\qquad n\\ge\\left(\\frac{z_{1-\\alpha/2}\\,s}{E}\\right)^2'],
      substituted: [`${tx(M)}\\pm ${tx(z)}\\cdot\\frac{${tx(S)}}{\\sqrt{${N}}}=${tx(M)}\\pm ${tx(marg)}`].concat(e !== undefined ? [`n\\ge\\left(\\frac{${tx(z)}\\cdot ${tx(S)}}{${tx(e)}}\\right)^2=${tx((z * S / e) ** 2)}\\Rightarrow ${nNeed}`] : []),
      result: res,
      excel: [`marge: =NORM.S.INV(${xl(1 - (1 - C) / 2)})*${xl(S)}/SQRT(${N})`].concat(e !== undefined ? [`runs: =ROUNDUP((NORM.S.INV(${xl(1 - (1 - C) / 2)})*${xl(S)}/${xl(e)})^2;0)`] : []),
      answer: `Uit ${N} simulatieruns is het gemiddelde ${nl(M)} met s = ${nl(S)}; het ${pctNl(C)}-betrouwbaarheidsinterval is ${nl(M)} +/- ${nl(marg)} = [${nl(M - marg)} ; ${nl(M + marg)}].${e !== undefined ? ` Voor een foutmarge van hoogstens ${nl(e)} zijn minstens ${nNeed} runs nodig.` : ''} De foutmarge daalt met de wortel van het aantal runs.`,
    });
  });
  run();
  return { prefill: (v: any) => f.setValues(v) };
}

// ---------- 4b. Simulation demo examples (De Vuyst, BB_SIM_demo.xlsx) ----------
function serieTab(el: HTMLElement) {
  const out = h('div');
  const out2 = h('div');
  let run = () => {};
  let run2 = () => {};
  const f = new Form('qser', () => run());
  const m = f.num('m', 'Gemiddelde levensduur per lamp E[X] (uur)', 10000);
  const k = f.num('k', 'Aantal lampen in serie k', 3);
  const t = f.num('t', 'Tijd t voor P(T > t) (uur)', 2000);
  const target = f.optNum('target', 'Beloofde MTTF (uur, optioneel)', 2000);
  el.append(card('Serieschakeling: minimum van exponenti\u00eble levensduren (BB_SIM_demo "3 Lightbulbs")', h('p', { class: 'muted' }, 'X\u2081..X\u2096 iid exponentieel met gemiddelde m; de lichten gaan uit zodra \u00e9\u00e9n lamp faalt: T = min(X\u2081,...,X\u2096). In Excel simuleer je X met = -m*LN(RAND()) en T met MIN(...); analytisch is T opnieuw exponentieel.'), row(m.el, k.el, t.el, target.el)), out);
  run = live(out, () => {
    const M = pos(m.get(), 'gemiddelde levensduur');
    const K = posInt(k.get(), 'k');
    const T = t.get();
    need(T >= 0, 't moet >= 0 zijn.');
    const rate = K / M;
    const mttf = M / K;
    const sv = expSf(T, rate);
    const tg = target.get();
    const res: [string, string][] = [['rate van T: k/m', fmt(rate)], ['MTTF = E[min] = m/k', fmt(mttf)], [`P(T > ${fmt(T)})`, fmt(sv)], ['mediaan van T = ln(2)\u00b7m/k', fmt((Math.LN2 * M) / K)]];
    let kmax = 0;
    if (tg !== undefined) {
      pos(tg, 'beloofde MTTF');
      kmax = Math.floor(M / tg + 1e-12);
      res.push([`max. aantal lampen voor MTTF \u2265 ${fmt(tg)}`, String(kmax)]);
    }
    return resultPanel({
      question: [`Levensduur van een serieschakeling van \\(k=${K}\\) lampen met elk \\(E[X]=${tx(M)}\\) uur`],
      formula: ['P(T>t)=\\prod_{i=1}^{k}P(X_i>t)=e^{-k t/m}\\ \\Rightarrow\\ T\\sim \\text{Exp}(k/m),\\quad E[T]=\\frac{m}{k}', 'E[T]\\ge MTTF^* \\iff k\\le \\frac{m}{MTTF^*}'],
      substituted: [`E[T]=\\frac{${tx(M)}}{${K}}=${tx(mttf)},\\quad P(T>${tx(T)})=e^{-${K}\\cdot ${tx(T)}/${tx(M)}}=${tx(sv)}`].concat(tg !== undefined ? [`k\\le\\frac{${tx(M)}}{${tx(tg)}}=${tx(M / tg)}\\Rightarrow k_{max}=${kmax}`] : []),
      result: res,
      excel: [`simulatie X: =-${xl(M)}*LN(RAND())`, 'simulatie T: =MIN(B11:D11) ; MTTF: =AVERAGE(G11:G1010)', `analytisch P(T > t): =EXP(-${K}*${xl(T)}/${xl(M)})`, `=1-EXPON.DIST(${xl(T)};${xl(rate)};WAAR)`],
      answer: `Het minimum van ${K} onafhankelijke exponenti\u00eble levensduren met gemiddelde ${nl(M)} uur is opnieuw exponentieel met rate ${K}/${nl(M)}, dus MTTF = ${nl(M)}/${K} = ${nl(mttf)} uur en P(T > ${nl(T)}) = ${nl(sv)}.${tg !== undefined ? ` Voor een beloofde MTTF van minstens ${nl(tg)} uur mogen er hoogstens ${kmax} lampen in serie staan (m/k >= ${nl(tg)}).` : ''} Een simulatie (Monte Carlo) benadert deze waarden, met een foutmarge die daalt met 1/wortel(n).`,
    });
  });
  run();
  const f2 = new Form('qpi', () => run2());
  const n = f2.num('n', 'aantal runs n', 1000);
  const hits = f2.num('hits', 'aantal treffers (X\u00b2 + Y\u00b2 < 1)', 785);
  const conf = f2.num('conf', 'betrouwbaarheid', 0.95);
  el.append(card('Monte Carlo voor een kans: \u03c0/4 (BB_SIM_demo "Pi")', h('p', { class: 'muted' }, 'Trek X, Y uniform op [-1, 1]; h = 1 als X\u00b2 + Y\u00b2 < 1, anders 0. Het gemiddelde van h schat \u03c0/4 = 0,7854; het BI gebruikt de steekproefvariantie van h (in Excel VAR.S).'), row(n.el, hits.el, conf.el)), out2);
  run2 = live(out2, () => {
    const N = posInt(n.get(), 'n', 2);
    const H = hits.get();
    need(Number.isInteger(H) && H >= 0 && H <= N, 'Aantal treffers moet een geheel getal tussen 0 en n zijn.');
    const C = prob(conf.get(), 'betrouwbaarheid');
    const p = H / N;
    const v = (N / (N - 1)) * p * (1 - p);
    const z = normInv(1 - (1 - C) / 2);
    const marg = z * Math.sqrt(v / N);
    const truth = Math.PI / 4;
    return resultPanel({
      question: `Monte Carlo-schatting van \\(\\pi/4\\) met \\(n=${N}\\) runs en ${pctNl(C)}-betrouwbaarheidsinterval`,
      formula: ['\\hat{J}=\\frac{1}{n}\\sum h_i,\\qquad \\hat{J}\\pm z_{1-\\alpha/2}\\sqrt{\\frac{s_h^2}{n}},\\qquad s_h^2=\\frac{n}{n-1}\\hat{J}(1-\\hat{J})'],
      substituted: [`\\hat{J}=\\frac{${H}}{${N}}=${tx(p)},\\quad ${tx(p)}\\pm ${tx(z)}\\sqrt{\\frac{${tx(v)}}{${N}}}=${tx(p)}\\pm ${tx(marg)}`],
      result: [['schatting \u03c0/4', fmt(p)], ['schatting \u03c0 (x 4)', fmt(4 * p)], [`${pct(C)}-BI voor \u03c0/4`, `[${fmt(p - marg)} ; ${fmt(p + marg)}]`], ['werkelijke \u03c0/4', fmt(truth)], ['werkelijke waarde in BI?', truth >= p - marg && truth <= p + marg ? 'ja' : 'nee']],
      excel: ['=RAND()*2-1 (X en Y) ; =IF(B4^2+C4^2<1;1;0) ; =AVERAGE($D$4:D4)', `BI: =E-NORM.INV(1-${xl(1 - C)}/2;0;1)*SQRT(VAR.S(h)/n)`],
      answer: `Met ${H} treffers op ${N} runs is de schatting van pi/4 gelijk aan ${nl(p)} (pi ~ ${nl(4 * p)}). Het ${pctNl(C)}-betrouwbaarheidsinterval is [${nl(p - marg)} ; ${nl(p + marg)}]; de foutmarge ${nl(marg)} halveert pas bij vier keer zoveel runs.`,
    });
  });
  run2();
}

// ---------- 5. Little + flow efficiency ----------
function littleTab(el: HTMLElement) {
  const out = h('div');
  const out2 = h('div');
  let run = () => {};
  let run2 = () => {};
  const f = new Form('qlit', () => run());
  const solve = f.seg('solve', 'Zoek', [['L', 'L (WIP)'], ['lam', 'λ (doorvoer, throughput)'], ['W', 'W (doorlooptijd, lead time)']], 'W');
  const L = f.num('L', 'L = gemiddeld aantal in systeem (WIP)', 120);
  const lam = f.num('lam', 'λ = doorvoer per tijdseenheid', 40);
  const W = f.num('W', 'W = gemiddelde doorlooptijd', 3);
  const f2 = new Form('qflow', () => run2());
  const va = f2.num('va', 'Waarde toevoegende tijd (value-added time)', 2);
  const lt = f2.num('lt', 'Doorlooptijd (lead time)', 24);
  el.append(card("Wet van Little (Little's law): L = λ·W", h('p', { class: 'muted' }, 'Geldt voor elk stabiel systeem op lange termijn, onafhankelijk van verdelingen. Gebruik dezelfde tijdseenheid voor λ en W.'), row(solve.el), row(L.el, lam.el, W.el)), out, card('Flow efficiency (stroomefficiëntie)', row(va.el, lt.el)), out2);
  run = live(out, () => {
    const s = solve.get();
    L.el.hidden = s === 'L';
    lam.el.hidden = s === 'lam';
    W.el.hidden = s === 'W';
    let l = 0, la = 0, w = 0, sub = '';
    if (s === 'L') {
      la = pos(lam.get(), 'λ'); w = pos(W.get(), 'W'); l = la * w;
      sub = `L=${tx(la)}\\cdot ${tx(w)}=${tx(l)}`;
    } else if (s === 'lam') {
      l = pos(L.get(), 'L'); w = pos(W.get(), 'W'); la = l / w;
      sub = `\\lambda=\\frac{${tx(l)}}{${tx(w)}}=${tx(la)}`;
    } else {
      l = pos(L.get(), 'L'); la = pos(lam.get(), 'λ'); w = l / la;
      sub = `W=\\frac{${tx(l)}}{${tx(la)}}=${tx(w)}`;
    }
    const nm = s === 'L' ? 'L' : s === 'lam' ? 'λ' : 'W';
    const val = s === 'L' ? l : s === 'lam' ? la : w;
    return resultPanel({
      question: [`Wet van Little: bereken ${nm}`],
      formula: ['L=\\lambda\\,W\\quad\\Leftrightarrow\\quad W=\\frac{L}{\\lambda}\\quad\\Leftrightarrow\\quad \\lambda=\\frac{L}{W}'],
      substituted: [sub],
      result: [['L (WIP)', fmt(l)], ['λ (doorvoer)', fmt(la)], ['W (doorlooptijd)', fmt(w)]],
      excel: [s === 'L' ? `=${xl(la)}*${xl(w)}` : s === 'lam' ? `=${xl(l)}/${xl(w)}` : `=${xl(l)}/${xl(la)}`],
      answer: `Volgens de wet van Little is L = lambda * W. Met ${s !== 'L' ? `L = ${nl(l)}` : `lambda = ${nl(la)}`} en ${s === 'W' ? `lambda = ${nl(la)}` : `W = ${nl(w)}`} volgt ${nm === 'λ' ? 'lambda' : nm} = ${nl(val)}. Minder onderhanden werk (WIP) bij gelijke doorvoer verkort dus rechtstreeks de doorlooptijd.`,
    });
  });
  run2 = live(out2, () => {
    const v = pos(va.get(), 'waarde toevoegende tijd');
    const l = pos(lt.get(), 'doorlooptijd');
    need(v <= l, 'De waarde toevoegende tijd kan niet groter zijn dan de doorlooptijd.');
    const fe = v / l;
    return resultPanel({
      question: ['Welk deel van de doorlooptijd voegt waarde toe?'],
      formula: ['\\text{flow efficiency}=\\frac{\\text{waarde toevoegende tijd}}{\\text{doorlooptijd}}'],
      substituted: [`\\frac{${tx(v)}}{${tx(l)}}=${tx(fe)}`],
      result: [['Flow efficiency', `${fmt(fe)} (${pct(fe)})`], ['Niet waarde toevoegende tijd (wachten, transport, ...)', fmt(l - v)]],
      excel: [`=${xl(v)}/${xl(l)}`],
      answer: `De flow efficiency is ${nl(v)}/${nl(l)} = ${pctNl(fe)}: slechts ${pctNl(fe)} van de doorlooptijd voegt waarde toe, de rest (${nl(l - v)}) is wachten, transport of andere verspilling. ${fe < 0.25 ? 'Dit is typisch laag; de grootste winst zit in het verminderen van wachttijd en WIP (Little), niet in sneller werken.' : ''}`,
      extra: note('Tip: doorlooptijd via Little = WIP / doorvoer; vul die waarde hierboven in als doorlooptijd.', 'info'),
    });
  });
  run();
  run2();
  return { prefill: (v: any) => f.setValues(v) };
}

export const wachtrij: ModuleDef = {
  id: 'wachtrij',
  title: 'Simulatie & wachtrijen',
  group: 'Extra',
  keywords: ['wachtrij', 'queue', 'queueing', 'M/M/1', 'M/M/1/K', 'Little', 'Poisson-proces', 'Poisson proces', 'superpositie', 'thinning', 'exponentieel', 'Monte Carlo', 'simulatie', 'flow efficiency', 'doorlooptijd', 'WIP', 'lead time'],
  subs: [
    ['mm1', 'M/M/1-wachtrij', 'wachtrij M/M/1 queue bezettingsgraad rho'],
    ['mm1k', 'M/M/1/K (beperkte capaciteit, verlies)', 'M/M/1/K wachtrij verlies blocking Little'],
    ['poisson', 'Poisson-proces (superpositie, thinning)', 'Poisson-proces superpositie thinning exponentieel tussenaankomsttijd'],
    ['mc', 'Monte Carlo BI en aantal runs', 'Monte Carlo simulatie runs betrouwbaarheidsinterval'],
    ['little', 'Wet van Little en flow efficiency', 'Little L = lambda W flow efficiency doorlooptijd WIP'],
  ],
  mount(el) {
    moduleHead(el, 'Simulatie & wachtrijen', 'M/M/1, M/M/1/K, Poisson-proces, Monte Carlo-interval, wet van Little en flow efficiency.');
    const t = tabs('wachtrij', [
      { id: 'mm1', label: 'M/M/1', build: mm1Tab },
      { id: 'mm1k', label: 'M/M/1/K', build: mm1kTab },
      { id: 'poisson', label: 'Poisson-proces', build: poissonTab },
      { id: 'mc', label: 'Monte Carlo', build: mcTab },
      { id: 'serie', label: 'Lampen in serie / π', build: serieTab },
      { id: 'little', label: 'Little / flow', build: littleTab },
    ], el);
    return { route: (sub, params) => sub && t.show(sub, params) };
  },
};
