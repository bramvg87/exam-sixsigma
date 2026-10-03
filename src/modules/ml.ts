// M11 ML, kansen en causaliteit: confusion matrices, contingency tables, explainer cards.
import { h, fmt, xl, nl, pctNl, parseNum } from '../ui/core.ts';
import { Form, row, card, note } from '../ui/form.ts';
import { resultPanel, table } from '../components/result.ts';
import { DataGrid } from '../components/grid.ts';
import { lineChart, chartBox } from '../components/charts.ts';
import { confusion, diagnose, contingency } from '../calc/misc.ts';
import { chi2InvRt, normInv } from '../stats/dist.ts';
import { live, need, moduleHead } from './util.ts';
import { tabs, type ModuleDef } from './types.ts';
import G from '../../testdata/golden_values.json';
import { exam } from '../generated/content.ts';

const NAMES = ['A', 'B', 'C', 'D'];

function confTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('mlconf', () => run());
  const nModels = f.seg('nm', 'Aantal modellen', [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], '3');
  const ex = (G as any).exam_q5_confusion.models;
  const fields: Record<string, any> = {};
  const boxes: HTMLElement[] = [];
  for (let i = 0; i < 4; i++) {
    const m = NAMES[i];
    const def = ex[m] ?? { train: [[0, 0], [0, 0]], test: [[0, 0], [0, 0]] };
    const mk = (set: 'train' | 'test') => {
      const ks = ['TP', 'FN', 'FP', 'TN'];
      const vals = [def[set][0][0], def[set][0][1], def[set][1][0], def[set][1][1]];
      const fl = ks.map((k, j) => f.num(`${m}.${set}.${k}`, '', vals[j], { width: '80px' }));
      fields[`${m}.${set}`] = fl;
      return h('table', { class: 'tbl' },
        h('tr', null, h('th', null, set === 'train' ? 'Training' : 'Test'), h('th', null, 'voorspeld Goed'), h('th', null, 'voorspeld Slecht')),
        h('tr', null, h('th', null, 'werkelijk Goed'), h('td', null, fl[0].el), h('td', null, fl[1].el)),
        h('tr', null, h('th', null, 'werkelijk Slecht'), h('td', null, fl[2].el), h('td', null, fl[3].el)));
    };
    const b = h('div', { class: 'card' }, h('h3', null, `Model ${m}`), h('div', { class: 'row' }, mk('train'), mk('test')));
    boxes.push(b);
  }
  el.append(card('Confusion matrices: bias of variantie?', h('p', { class: 'muted' }, 'Rijen = werkelijk (Goed, Slecht), kolommen = voorspeld (Goed, Slecht); Goed = positief. Standaard geladen: voorbeeldexamen vraag 5.'), row(nModels.el)), h('div', { class: 'grid2' }, boxes), out);
  const get = (m: string, set: string) => {
    const v = fields[`${m}.${set}`].map((x: any) => x.get());
    v.forEach((x: number) => need(x >= 0, 'Aantallen moeten >= 0 zijn.'));
    return [[v[0], v[1]], [v[2], v[3]]];
  };
  run = live(out, () => {
    const k = +nModels.get();
    boxes.forEach((b, i) => (b.hidden = i >= k));
    const res = NAMES.slice(0, k).map((m) => ({ m, tr: confusion(get(m, 'train')), te: confusion(get(m, 'test')) }));
    res.forEach((r) => need(r.tr.N > 0 && r.te.N > 0, `Model ${r.m}: matrix is leeg.`));
    const best = Math.max(...res.map((r) => r.te.acc));
    const diag = res.map((r) => ({ ...r, d: diagnose(r.tr.acc, r.te.acc, best) }));
    const rows = diag.map((r) => [
      r.m, pctNl(r.tr.acc, 4), pctNl(r.te.acc, 4), fmt(100 * (r.tr.acc - r.te.acc), 3) + ' %-punt',
      pctNl(r.te.precision, 3), pctNl(r.te.recall, 3), pctNl(r.te.specificity, 3), fmt(r.te.f1, 3), r.d.label,
    ]);
    const lines = diag.map((r) => `Model ${r.m}: train ${pctNl(r.tr.acc, 3)}, test ${pctNl(r.te.acc, 3)} -> ${r.d.label}.`);
    return resultPanel({
      question: 'Welk model heeft hoge variantie, welk hoge bias, welk is optimaal?',
      formula: ['\\text{accuracy}=\\frac{TP+TN}{N},\\quad \\text{precision}=\\frac{TP}{TP+FP},\\quad \\text{recall}=\\frac{TP}{TP+FN},\\quad \\text{specificiteit}=\\frac{TN}{TN+FP},\\quad F_1=\\frac{2PR}{P+R}'],
      substituted: diag.map((r) => `${r.m}:\\ \\text{acc}_{train}=\\frac{${r.tr.TP}+${r.tr.TN}}{${r.tr.N}}=${fmt(r.tr.acc).replace(',', '{,}')},\\quad \\text{acc}_{test}=\\frac{${r.te.TP}+${r.te.TN}}{${r.te.N}}=${fmt(r.te.acc).replace(',', '{,}')}`),
      result: lines,
      extra: [table(['Model', 'acc train', 'acc test', 'kloof', 'precision (test)', 'recall (test)', 'specificiteit (test)', 'F1 (test)', 'diagnose'], rows),
        note('Beslisregel: lage score al op de trainingsdata -> hoge bias (underfitting). Hoge trainingsscore maar veel lagere testscore -> hoge variantie (overfitting). Beste testscore met beperkte kloof -> optimaal (beste generalisatie).', 'info'),
        note('Vraag 5b: bij hoge bias moet de boom complexer: diepere boom (max depth hoger), kleiner minimum aantal waarnemingen per blad/split, minder snoeien (pruning), meer of betere features. Bij hoge variantie omgekeerd: snoeien, ondiepere boom, meer data, ensembles (random forest).', 'ok')],
      excel: ['accuracy: =(TP+TN)/(TP+FN+FP+TN)', 'precision: =TP/(TP+FP)', 'recall: =TP/(TP+FN)'],
      answer: `${diag.map((r) => `Model ${r.m} haalt ${pctNl(r.tr.acc, 3)} op de training en ${pctNl(r.te.acc, 3)} op de test (${r.d.label.split(':')[0]}).`).join(' ')} Een groot verschil tussen training en test wijst op overfitting (hoge variantie), een lage score op beide op underfitting (hoge bias); het model met de beste testscore generaliseert het best en is optimaal.`,
    });
  });
  run();
  return {
    prefill: () => {
      const v: Record<string, number | string> = { nm: '3' };
      for (const m of ['A', 'B', 'C']) for (const set of ['train', 'test']) {
        const M = ex[m][set];
        v[`${m}.${set}.TP`] = M[0][0]; v[`${m}.${set}.FN`] = M[0][1]; v[`${m}.${set}.FP`] = M[1][0]; v[`${m}.${set}.TN`] = M[1][1];
      }
      f.setValues(v);
    },
  };
}

function contTab(el: HTMLElement) {
  const out = h('div');
  let run = () => {};
  const f = new Form('mlcont', () => run());
  const alpha = f.num('alpha', 'α', 0.05);
  const yates = f.check('yates', 'Yates-correctie (enkel 2x2)', true);
  const gt = (G as any).chi2_contingency.table;
  const grid = new DataGrid({
    key: 'mlcont', cols: 4, rows: 8,
    examples: [
      { label: 'Voorbeeld: lijn x kwaliteit', data: () => ({ headers: ['lijn', 'goed', 'herwerk', 'afval'], rows: [['lijn 1', ...gt[0]], ['lijn 2', ...gt[1]]] }) },
      { label: 'Voorbeeld 2x2', data: () => ({ headers: ['', 'Y1', 'Y2'], rows: [['X1', 30, 10], ['X2', 20, 25]] }) },
    ],
    onChange: () => run(),
  });
  el.append(card('Contingentietabel: kansen en χ²-toets op onafhankelijkheid', h('p', { class: 'muted' }, 'Rijen = categorieën van X, kolommen = categorieën van Y (aantallen). Een eerste kolom met tekst wordt als rijlabel gebruikt. Uitgebreide versie met Fisher exact, Cramér V, residuen, ruwe data en correlatie: module Onafhankelijkheid.'), grid.el, row(alpha.el, yates.el)), out);
  run = live(out, () => {
    const raw = grid.getRaw();
    need(raw.length >= 2, 'Minstens 2 rijen nodig.');
    const labelCol = raw.every((r) => { const p = parseNum(r[0]); return p === null || Number.isNaN(p); });
    const heads = grid.headers.slice(labelCol ? 1 : 0);
    const rl = raw.map((r, i) => (labelCol ? r[0] || `rij ${i + 1}` : `rij ${i + 1}`));
    const t = raw.map((r) => r.slice(labelCol ? 1 : 0).map((v) => { const p = parseNum(v); need(p !== null && !Number.isNaN(p) && p >= 0, 'Alle cellen moeten aantallen >= 0 zijn (geen lege cellen).'); return p!; }));
    need(t[0].length >= 2, 'Minstens 2 kolommen met aantallen nodig.');
    need(t.every((r) => r.length === t[0].length), 'Alle rijen moeten even veel kolommen hebben.');
    const a = alpha.get();
    const c = contingency(t, yates.get());
    need(c.rs.every((v) => v > 0) && c.cs.every((v) => v > 0), 'Elke rij en kolom moet een totaal > 0 hebben.');
    const crit = chi2InvRt(a, c.df);
    const reject = c.p < a;
    const pc = (x: number) => fmt(x, 3);
    const obsT = table(['', ...heads, 'totaal'], [...t.map((r, i) => [rl[i], ...r.map(String), String(c.rs[i])]), ['totaal', ...c.cs.map(String), String(c.n)]]);
    const expT = table(['verwacht e = rij x kolom / n', ...heads], c.E.map((r, i) => [rl[i], ...r.map((v) => fmt(v))]));
    const jointT = table(['P(X en Y)', ...heads, 'P(X)'], [...c.joint.map((r, i) => [rl[i], ...r.map(pc), pc(c.margRow[i])]), ['P(Y)', ...c.margCol.map(pc), '1']]);
    const condT = table(['P(Y | X)', ...heads], [...c.condRow.map((r, i) => [rl[i], ...r.map(pc)]), ['P(Y) (marginaal)', ...c.margCol.map(pc)]]);
    return resultPanel({
      question: [`\\(H_0\\): X en Y zijn onafhankelijk versus \\(H_a\\): X en Y hangen samen, \\(\\alpha=${fmt(a).replace(',', '{,}')}\\)`],
      formula: [`\\chi^2=\\sum_{k,l}\\frac{(n_{kl}-e_{kl})^2}{e_{kl}},\\quad e_{kl}=\\frac{n_{k\\cdot}\\,n_{\\cdot l}}{n},\\quad df=(r-1)(s-1)${c.yates ? ',\\quad \\text{Yates: } (\\lvert n-e\\rvert-\\tfrac12)^2' : ''}`],
      substituted: [`\\chi^2=${fmt(c.chi2).replace(',', '{,}')},\\quad df=(${t.length}-1)(${t[0].length}-1)=${c.df}`],
      result: [['χ²', fmt(c.chi2)], ['df', String(c.df)], ['kritieke waarde', fmt(crit)], ['p-waarde', fmt(c.p)], ['kleinste verwachte frequentie', fmt(c.minE)]],
      decision: reject ? { text: 'Verwerp H₀: X en Y zijn afhankelijk', kind: 'reject' } : { text: 'H₀ niet verwerpen: geen bewijs van afhankelijkheid', kind: 'accept' },
      warnings: [c.minE < 5 ? `Een verwachte frequentie is ${fmt(c.minE)} < 5: χ²-benadering twijfelachtig, voeg klassen samen.` : '', t.length === 2 && t[0].length === 2 && !c.yates ? 'Bij een 2x2-tabel schrijft het recept de Yates-correctie voor.' : ''].filter(Boolean),
      extra: [h('h4', null, 'Waargenomen'), obsT, h('h4', null, 'Verwacht onder onafhankelijkheid'), expT, h('h4', null, 'Gezamenlijke en marginale kansen'), jointT, h('h4', null, 'Voorwaardelijke kansen (onafhankelijk als elke rij ~ de marginale rij)'), condT],
      excel: ['verwacht: =rijtotaal*kolomtotaal/totaal', 'p: =CHISQ.TEST(waargenomen;verwacht)', `kritiek: =CHISQ.INV.RT(${xl(a)};${c.df})`, `p uit χ²: =CHISQ.DIST.RT(${xl(c.chi2)};${c.df})`],
      answer: `De chi-kwadraattoets op de contingentietabel geeft chi2 = ${nl(c.chi2)} met df = ${c.df} en p = ${nl(c.p)}. ${reject ? `Omdat p < alpha = ${pctNl(a)} verwerpen we de onafhankelijkheid: de verdeling van Y verschilt tussen de categorieën van X (vergelijk P(Y|X) met P(Y)).` : `Omdat p >= alpha = ${pctNl(a)} is er geen bewijs dat X en Y samenhangen.`}`,
    });
  });
  run();
}

function theoryTab(el: HTMLElement) {
  el.append(
    card('Bias-variantie (bias-variance trade-off)',
      h('ul', null,
        h('li', null, 'Verwachte fout = bias² + variantie + onherleidbare ruis.'),
        h('li', null, 'Hoge bias (underfitting): model te eenvoudig, zwak op training én test. Oplossing: complexer model, meer features.'),
        h('li', null, 'Hoge variantie (overfitting): model leert ruis, uitstekend op training maar veel slechter op test. Oplossing: eenvoudiger model, regularisatie, snoeien, meer data.'),
        h('li', null, 'Optimaal: laagste fout op nieuwe data (test/validatie), niet op de training.'))),
    card('Train / validatie / test en k-fold cross-validatie',
      h('ul', null,
        h('li', null, 'Training: parameters schatten. Validatie: hyperparameters kiezen (diepte boom, ...). Test: eenmalig de eindprestatie meten.'),
        h('li', null, 'k-fold CV: verdeel de data in k delen; train k keer op k-1 delen en valideer op het overgebleven deel; gemiddelde fout = schatting van de generalisatiefout.'),
        h('li', null, 'Loss: MSE = gemiddelde van (y - ŷ)² (gevoelig voor uitschieters), MAE = gemiddelde van |y - ŷ|.'))),
  );
}

// small deterministic RNG for the causal demo
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
}

/** Small causal diagram (DAG) with the intervention do(T = 730). */
function dag(dir: 'ST' | 'TS'): HTMLElement {
  const arrow = dir === 'ST' ? 'M60,60 L232,60' : 'M232,60 L60,60';
  const head = dir === 'ST' ? 'M232,60 l-12,-7 l0,14 z' : 'M60,60 l12,-7 l0,14 z';
  // S -> T: the intervention on T cuts the incoming arrow S -> T (T is now set from outside).
  const cut = dir === 'ST' ? '<line class="cut" x1="136" y1="44" x2="156" y2="76"/><line class="cut" x1="156" y1="44" x2="136" y2="76"/>' : '';
  const box = document.createElement('div');
  box.innerHTML = `<svg class="dag" viewBox="0 0 300 150" role="img"><title>${dir === 'ST' ? 'S naar T' : 'T naar S'}</title>
    <circle class="node" cx="38" cy="60" r="24"/><text x="38" y="66" text-anchor="middle">${dir === 'ST' ? 'S' : 'S'}</text>
    <circle class="node" cx="254" cy="60" r="24"/><text x="254" y="66" text-anchor="middle">T</text>
    <path class="arrow" d="${arrow}"/><path class="ah" d="${head}"/>${cut}
    <path class="arrow" d="M254,128 L254,90" style="stroke:var(--bad)"/><path d="M254,86 l-7,12 l14,0 z" style="fill:var(--bad)"/>
    <text class="do" x="254" y="145" text-anchor="middle">do(T = 730)</text></svg>`;
  return box.firstElementChild as HTMLElement;
}

/** Figures for exam question 7: regression line, S -> T (dots) and T -> S (crosses) after do(T = 730). */
export function causalFigures(): HTMLElement {
  const r = rng(7);
  // Mimics the exam figure (voorbeeldexamen vraag 7): T 550-750 degC, S falls from ~450 to ~425 MPa.
  const T: number[] = [];
  const S: number[] = [];
  const regAt = (t: number) => 452 - 0.13 * (t - 550);
  const sdRes = 13;
  for (let i = 0; i < 110; i++) {
    const t = 550 + 200 * r();
    T.push(t);
    S.push(regAt(t) + sdRes * gauss(r));
  }
  const tx0 = 730;
  const mS = S.reduce((x, y) => x + y, 0) / S.length;
  const sdS = Math.sqrt(S.reduce((x, y) => x + (y - mS) ** 2, 0) / (S.length - 1));
  // b) S -> T: intervention on T does not change S: S keeps its marginal distribution
  // 10 evenly spread points (quantiles) instead of random draws, so the picture shows the distributions honestly
  const zq = Array.from({ length: 10 }, (_, i) => normInv((i + 0.5) / 10));
  const dotsB: [number, number][] = zq.map((z) => [tx0, mS + sdS * z]);
  // c) T -> S: S | do(T=730) ~ regression value at 730 + residual noise
  const dotsC: [number, number][] = zq.map((z) => [tx0, regAt(tx0) + sdRes * z]);
  const xs: [number, number] = [545, 755];
  const line: [number, number][] = xs.map((x) => [x, regAt(x)]);
  const base = { pts: T.map((t, i) => [t, S[i]] as [number, number]), dots: true, cls: 'obs' };
  const margBand = { lo: xs.map((x) => [x, mS - 2 * sdS] as [number, number]), hi: xs.map((x) => [x, mS + 2 * sdS] as [number, number]), cls: 'marg' };
  const condBand = { lo: xs.map((x) => [x, regAt(x) - 2 * sdRes] as [number, number]), hi: xs.map((x) => [x, regAt(x) + 2 * sdRes] as [number, number]), cls: 'cond' };
  const yr = { y0: 380, y1: 500 };
  const ch = (extra: any) => chartBox(lineChart({ xlabel: 'T: gloeitemperatuur (°C)', ylabel: 'S: sterkte (MPa)', ...yr, ...extra }, 560, 320));
  const capt = (t: string) => h('p', { class: 'muted' }, t);
  return h('div', null,
    h('h4', null, 'a) Regressielijn f(x) = E[S | T = x] (zien, observeren)'),
    ch({ series: [base, { pts: line, cls: 'fit' }] }),
    capt('Grijze punten = de waargenomen wolk. De rode lijn loopt bij elke temperatuur door het gemiddelde van de punten (de voorwaardelijke verwachting). In de examenfiguur daalt ze: ongeveer 450 MPa bij 550 °C naar 425 MPa bij 740 °C.'),
    h('div', { class: 'grid2' },
      h('div', null,
        h('h4', null, 'b) Causaal diagram S → T, ingreep do(T = 730): BOLLETJES'),
        dag('ST'),
        ch({ series: [base, { pts: line, cls: 'fit' }, { pts: dotsB, dots: true, marker: 'ring' }], bands: [margBand], vlines: [{ x: tx0, label: 'T = 730' }] }),
        capt('S is de oorzaak van T. Als je T van buitenaf op 730 zet, knip je de pijl S → T door: de temperatuur wordt niet meer door de sterkte bepaald, en de sterkte verandert niet. De ~10 bolletjes staan op de verticale lijn T = 730 en zijn verspreid over het VOLLEDIGE bereik van S (oranje band: gemiddelde ± 2 standaardafwijkingen van alle S-waarden, de marginale verdeling; in de examenfiguur ligt S tussen ongeveer 390 en 480 MPa), net zoals de hele wolk, niet geconcentreerd rond de rode lijn.'),
      ),
      h('div', null,
        h('h4', null, 'c) Causaal diagram T → S, ingreep do(T = 730): KRUISJES'),
        dag('TS'),
        ch({ series: [base, { pts: line, cls: 'fit' }, { pts: dotsC, dots: true, marker: 'cross' }], bands: [condBand], vlines: [{ x: tx0, label: 'T = 730' }] }),
        capt('T is de oorzaak van S. De ingreep op T werkt door op S: S volgt dezelfde verdeling als de waargenomen stukken met T = 730, dus P(S | do(T = 730)) = P(S | T = 730). De ~10 kruisjes liggen op T = 730 dicht rond de waarde van de regressielijn (ongeveer 428 MPa), binnen de smalle rode band (spreiding rond de lijn).'),
      ),
    ),
    h('h4', null, 'b en c samen: zelfde data, zelfde ingreep, ander beeld'),
    ch({ series: [base, { pts: line, cls: 'fit' }, { pts: dotsB.map(([x, y]) => [x - 4, y] as [number, number]), dots: true, marker: 'ring' }, { pts: dotsC.map(([x, y]) => [x + 4, y] as [number, number]), dots: true, marker: 'cross' }], bands: [margBand, condBand], vlines: [{ x: tx0, label: 'T = 730' }] }),
    capt(`Twee verschillen: (1) het CENTRUM: de bolletjes liggen rond het gemiddelde van alle S-waarden (${Math.round(mS)} MPa), de kruisjes rond de regressielijn bij 730 (${Math.round(regAt(tx0))} MPa); (2) de SPREIDING: de bolletjes volgen de volledige spreiding van S, de kruisjes enkel de spreiding rond de lijn. Omdat de trend in deze figuur zwak is ten opzichte van de ruis, is het breedteverschil bescheiden; bij een sterkere trend wordt het groot. De puntenwolk alleen kan niet tonen welk beeld juist is: daarvoor heb je het causale diagram nodig ("correlatie is geen causaliteit").`),
  );
}

function causalTab(el: HTMLElement) {
  el.append(
    card('Zien versus doen (seeing vs doing) - voorbeeldexamen vraag 7',
      exam.figures['7'] ? h('img', { src: exam.figures['7'], alt: 'Examenfiguur vraag 7', class: 'examfig' }) : '',
      h('p', null, 'Observeren: E[S | T = x] is de regressielijn door het midden van de puntenwolk. Ingrijpen (do-operator): T vastzetten op 730 °C. Wat er dan met S gebeurt hangt af van de causale richting, niet van de correlatie.'),
      causalFigures(),
      note('Tekenhulp: (a) trek de lijn door de "gemiddelde" S per T-waarde. (b) S -> T: alle ~10 bolletjes op de verticale lijn T = 730, verspreid over het volledige bereik van S (zoals de marginale verdeling van S). (c) T -> S: ~10 kruisjes op T = 730, dicht rond de waarde van de regressielijn bij 730, met de spreiding van S rond de lijn.', 'ok'),
    ),
    card('Causaliteit: kernbegrippen',
      h('ul', null,
        h('li', null, 'P(Y | X = x) (zien) is niet gelijk aan P(Y | do(X = x)) (doen) als er confounders zijn of als de pijl omgekeerd loopt.'),
        h('li', null, 'Confounder Z: Z -> X en Z -> Y; geeft correlatie zonder causaal effect van X op Y. Oplossing: randomiseren (RCT / A-B test) of corrigeren voor Z.'),
        h('li', null, 'DAG: gerichte graaf zonder cycli die de causale structuur weergeeft. Interventie = alle pijlen naar X schrappen.'),
        h('li', null, 'Onafhankelijkheid: P(Y | X) = P(Y) voor alle x (vergelijk in de contingentietabel de voorwaardelijke met de marginale kansen).'))),
  );
}

export const ml: ModuleDef = {
  id: 'ml',
  title: 'ML, kansen & causaliteit',
  group: 'Fase 2',
  keywords: ['machine learning', 'confusion matrix', 'accuracy', 'precision', 'recall', 'bias', 'variantie', 'overfitting', 'underfitting', 'contingentie', 'kruistabel', 'onafhankelijkheid', 'voorwaardelijke kans', 'causaliteit', 'do-operator', 'interventie', 'beslissingsboom'],
  subs: [
    ['conf', 'Confusion matrices (bias / variantie)', 'confusion matrix vraag 5 accuracy train test'],
    ['cont', 'Contingentietabel + χ² onafhankelijkheid', 'contingentie chi kwadraat onafhankelijkheid voorwaardelijke kans marginaal'],
    ['theorie', 'Bias-variantie, train/test, k-fold CV', 'bias variance cross validatie'],
    ['causal', 'Zien vs doen (do-operator), vraag 7', 'causaliteit interventie regressielijn vraag 7'],
  ],
  mount(el) {
    moduleHead(el, 'ML, kansen en causaliteit');
    const t = tabs('ml', [
      { id: 'conf', label: 'Confusion matrix', build: confTab },
      { id: 'cont', label: 'Contingentietabel', build: contTab },
      { id: 'theorie', label: 'Bias-variantie', build: theoryTab },
      { id: 'causal', label: 'Zien vs doen', build: causalTab },
    ], el);
    return { route: (sub, params) => sub && t.show(sub, params) };
  },
};
