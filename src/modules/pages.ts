// Start page, "Welke toets?" wizard, Formularium, Voorbeeldexamen, Self-test.
import { h, store, tex, renderMath } from '../ui/core.ts';
import { card, note } from '../ui/form.ts';
import { table } from '../components/result.ts';
import { formularium, spiekbrief, exam } from '../generated/content.ts';
import { buildChecks, passes } from '../selftest/checks.ts';
import { BUILD } from '../generated/buildinfo.ts';
import { causalFigures } from './ml.ts';
import { moduleHead } from './util.ts';
import { tabs, type ModuleDef, type Ctx, REPO_URL, DOWNLOAD_URL } from './types.ts';
import G from '../../testdata/golden_values.json';

// ---------- Start ----------
export const start: ModuleDef = {
  id: 'start',
  title: 'Start',
  group: 'Start',
  keywords: ['start', 'home', 'overzicht'],
  mount(el, ctx) {
    moduleHead(el, 'Six Sigma Black Belt - examentoolkit', 'Volledig offline. Alles rekent in de browser; invoer blijft bewaard bij het wisselen van module.');
    const tile = (id: string, title: string, sub: string, s?: string) => {
      const a = h('a', { class: 'tile', href: `#/${id}${s ? '/' + s : ''}` }, h('b', null, title), h('span', null, sub));
      return a;
    };
    el.append(
      card('Snel naar', h('div', { class: 'tiles' },
        tile('hypothese', 'Welke toets? + Toetsen & BI', 'theorie, toetsenkiezer en alle toetsen op \u00e9\u00e9n plaats'),
        tile('verdelingen', 'Verdelingen', 'Normaal, t, χ², F, binomiaal, Poisson, ...'),
        tile('capabiliteit', 'Capabiliteit', 'Cp, Cpk, Pp, Ppk, uitval, DPMO'),
        tile('spc', 'SPC regelkaarten', 'X̄-R, X̄-s, Western Electric'),
        tile('msa', 'MSA / Gauge R&R', 'Average & Range, ANOVA, bias, linearity'),
        tile('anova', 'ANOVA', 'eenweg, tweeweg'),
        tile('regressie', 'Regressie', 'enkelvoudig en meervoudig, CI/PI'),
        tile('doe', 'DOE 2^k', 'effecten, ANOVA, fracties'),
        tile('steekproeven', 'Aanvaardingssteekproeven', 'OC-curve, (n,c), dubbel, (n,k)'),
        tile('onafhankelijkheid', 'Onafhankelijkheid', 'kruistabel + χ², gebeurtenissen, correlatie'),
        tile('ml', 'ML, kansen & causaliteit', 'confusion matrix, contingentie, do-operator'),
        tile('formularium', 'Formularium', 'alle formules + spiekbrief'),
        tile('examen', 'Voorbeeldexamen', '7 vragen met oplossing en "Laad in tool"'),
        tile('selftest', 'Zelftest', 'controle tegen scipy-referentiewaarden'),
      )),
      card('Downloaden en delen',
        h('p', null, 'Deze toolkit is één HTML-bestand dat volledig offline werkt. De nieuwste versie en de broncode staan op GitHub:'),
        h('p', null, h('a', { href: REPO_URL, target: '_blank', rel: 'noopener' }, REPO_URL)),
        h('p', null, 'Rechtstreeks het bestand: ', h('a', { href: DOWNLOAD_URL, target: '_blank', rel: 'noopener' }, 'release/sixsigma-toolkit.html'), '. Sla het op (bv. op het bureaublad) en open het met dubbelklik in Edge of Chrome; internet is daarna niet meer nodig.'),
        h('p', { class: 'muted' }, 'Op het examen zelf is er geen internet: download het bestand vooraf en controleer de Zelftest.'),
      ),
      card('Tips voor het examen',
        h('ul', null,
          h('li', null, 'Ctrl+K: zoek een module, toets of formule (bv. "uitval", "verhouding varianties", "OC-curve", "regelkaart").'),
          h('li', null, 'Grid: plak rechtstreeks uit Excel (decimale komma of punt). Enter = omlaag, Tab = rechts, Ctrl+Z = ongedaan maken.'),
          h('li', null, 'Elke berekening toont: hypothesen, formule, ingevulde formule, resultaat, Excel-formule (Nederlandse notatie) en een examenantwoord met kopieerknop.'),
          h('li', null, 'Bovenaan: 4 of 6 significante cijfers, decimaal teken, en Excel-functienamen in het Engels (zoals in de cursus) of Nederlands (NL-Excel).'),
          h('li', null, 'Open op de ochtend van het examen de Zelftest: alles moet groen zijn.'),
        ),
        h('button', { class: 'btn', type: 'button', onclick: () => { store.clearAll(); location.reload(); } }, 'Alle invoer wissen (reset)'),
      ),
    );
    void ctx;
  },
};

// ---------- Wizard ----------
interface WNode { q: string; opts: [string, string, WNode | { go: [string, string?, any?]; why: string }][] }
const side3 = (go: (side: string) => [string, string?, any?], why: string): WNode => ({
  q: 'Wat is het vermoeden (alternatieve hypothese)?',
  opts: [
    ['kleiner', 'kleiner dan (linkszijdig)', { go: go('left'), why }],
    ['groter', 'groter dan (rechtszijdig)', { go: go('right'), why }],
    ['anders', 'verschillend van (tweezijdig)', { go: go('two'), why }],
  ],
});
const TREE: WNode = {
  q: 'Wat wil je weten?',
  opts: [
    ['mean', 'Iets over een gemiddelde', {
      q: 'Hoeveel steekproeven / groepen?',
      opts: [
        ['1', 'Één steekproef tegen een norm μ₀', {
          q: 'Is σ van de populatie gekend?',
          opts: [
            ['ja', 'Ja, σ gekend', side3((s) => ['hypothese', 'z', { side: s }], 'Z-toets: σ gekend, (x̄-μ₀)/(σ/√n) ~ N(0,1).')],
            ['nee', 'Nee, geschat met s', side3((s) => ['hypothese', 't', { side: s }], 't-toets: σ geschat door s, df = n-1.')],
          ],
        }],
        ['2', 'Twee steekproeven vergelijken', {
          q: 'Zijn de metingen gepaard (zelfde stuk / persoon, voor-na)?',
          opts: [
            ['ja', 'Ja, gepaard', side3((s) => ['hypothese', 'paired', { side: s }], 'Gepaarde t-toets op de verschillen v = x₁ - x₂.')],
            ['nee', 'Nee, onafhankelijk', side3((s) => ['hypothese', 'twee', { side: s }], 'Pooled t (cursus, σ₁ = σ₂) of Welch (ongelijke varianties).')],
          ],
        }],
        ['3', 'Drie of meer groepen', { go: ['anova', 'oneway'], why: 'Eenweg-ANOVA: F = MS tussen / MS binnen.' }],
      ],
    }],
    ['spread', 'Iets over de spreiding (variantie, nauwkeurigheid)', {
      q: 'Hoeveel steekproeven?',
      opts: [
        ['1', 'Één, tegen een norm σ₀', side3((s) => ['hypothese', 'chi2', { side: s }], 'χ²-toets: (n-1)s²/σ₀² ~ χ²(n-1).')],
        ['2', 'Twee vergelijken (welke machine is nauwkeuriger?)', {
          q: 'Wat is het vermoeden?',
          opts: [
            ['l', 'Groep 1 nauwkeuriger (σ₁ < σ₂)', { go: ['hypothese', 'f', { side: 'left' }], why: 'F-verdeling, eenzijdig BI voor σ₂²/σ₁² (examen vraag 2).' }],
            ['r', 'Groep 2 nauwkeuriger (σ₁ > σ₂)', { go: ['hypothese', 'f', { side: 'right' }], why: 'F-verdeling, eenzijdig BI voor σ₁²/σ₂².' }],
            ['t', 'Verschillend', { go: ['hypothese', 'f', { side: 'two' }], why: 'F-toets tweezijdig.' }],
          ],
        }],
      ],
    }],
    ['prop', 'Iets over een fractie / percentage defecten', {
      q: 'Wat wil je doen?',
      opts: [
        ['ci', 'Interval schatten (BI voor de fractie)', { go: ['hypothese', 'propci'], why: 'Exact (Clopper-Pearson) interval, zoals in de slides.' }],
        ['test', 'Toetsen tegen een norm π₀', side3((s) => ['hypothese', 'prop', { side: s }], 'Z-toets voor π (met continuïteitscorrectie) en exacte binomiale toets.')],
        ['lot', 'Een lot aanvaarden of afkeuren', { go: ['steekproeven', 'single'], why: 'Aanvaardingssteekproef (n, c), OC-curve, α bij AQL en β bij LQL.' }],
        ['two', 'Fracties in twee of meer groepen vergelijken', { go: ['onafhankelijkheid', 'kruistabel'], why: 'χ²-toets op de kruistabel: fracties per groep vergelijken = onafhankelijkheid van groep en resultaat toetsen.' }],
      ],
    }],
    ['rel', 'Een verband tussen variabelen', {
      q: 'Welk soort variabelen?',
      opts: [
        ['num', 'Numeriek (meten)', { go: ['regressie'], why: 'Regressie: b₀, b₁, R², t-toets helling, CI/PI.' }],
        ['cat', 'Categorisch (tellen in klassen)', { go: ['onafhankelijkheid', 'kruistabel'], why: 'χ²-toets op onafhankelijkheid (kruistabel), met Fisher exact bij 2x2.' }],
        ['corr', 'Sterkte van het verband tussen twee numerieke variabelen', { go: ['onafhankelijkheid', 'correlatie'], why: 'Correlatie r met t-toets (ρ = 0) en Spearman.' }],
        ['fac', 'Effect van factoren in een experiment', { go: ['doe'], why: '2^k factorieel proefopzet: effecten, ANOVA.' }],
      ],
    }],
    ['ci', 'Een betrouwbaarheidsinterval berekenen (schatten)', { go: ['hypothese', 'bi'], why: 'Tab Betrouwbaarheidsintervallen: CLT, μ (z of t), σ² en σ (χ²), verhouding van varianties (F); fractie in tab BI fractie.' }],
    ['dist', 'Een kans of verdeling (E[X], Var[X], P(X ≤ x))', { go: ['verdelingen', 'calc'], why: 'Verdelingscalculator; zie ook "Welke verdeling?".' }],
    ['cap', 'Capabiliteit / % uitval', { go: ['capabiliteit', 'cont'], why: 'Cp, Cpk, uitval via z-scores.' }],
    ['spc', 'Stabiliteit van een proces (regelkaart)', { go: ['spc'], why: 'X̄-R of X̄-s kaart met Western Electric-regels.' }],
    ['msa', 'Is het meetsysteem goed genoeg?', { go: ['msa'], why: 'Gauge R&R: %GRR en ndc.' }],
    ['ml', 'Modelkeuze: bias of variantie (confusion matrix)', { go: ['ml', 'conf'], why: 'Vergelijk accuracy op train- en testdata.' }],
  ],
};

/**
 * "Welke toets?" decision tree as an embeddable widget. onPick receives the target [module, sub, params]
 * and the reason; it is called as soon as a leaf is reached.
 */
export function wizardWidget(onPick: (go: [string, string?, any?], why: string, path: string[]) => void): HTMLElement {
  const box = h('div', { class: 'wizard' });
  const path: string[] = [];
  const restart = () => {
    path.length = 0;
    render(TREE);
  };
  function render(node: WNode) {
    box.replaceChildren(
      path.length ? h('p', { class: 'muted' }, path.join('  >  ')) : '',
      h('h4', null, node.q),
      ...node.opts.map(([, label, nxt]) => {
        const b = h('button', { class: 'btn opt', type: 'button' }, label);
        b.addEventListener('click', () => {
          path.push(label);
          if ('go' in nxt) {
            box.replaceChildren(
              h('p', { class: 'muted' }, path.join('  >  ')),
              note('Aanbevolen: ' + nxt.why, 'ok'),
              h('div', { class: 'row' },
                h('button', { class: 'btn btn-primary', type: 'button', onclick: () => onPick(nxt.go, nxt.why, [...path]) }, 'Toon deze toets'),
                h('button', { class: 'btn', type: 'button', onclick: restart }, 'Opnieuw'),
              ),
            );
            onPick(nxt.go, nxt.why, [...path]);
          } else render(nxt);
        });
        return b;
      }),
      path.length ? h('button', { class: 'btn btn-sm', type: 'button', onclick: restart }, 'Opnieuw beginnen') : '',
    );
  }
  render(TREE);
  return box;
}

// ---------- Formularium ----------
function mdPage(el: HTMLElement, content: { html: string; toc: { depth: number; id: string; text: string }[] }, withSearch: boolean) {
  const body = h('div', { class: 'md', html: content.html });
  renderMath(body);
  const toc = h('div', { class: 'toc' }, content.toc.filter((t) => t.depth >= 2).map((t) => h('a', { href: '#', class: 'd' + t.depth, onclick: (e: Event) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' }); } }, t.text)));
  const search = h('input', { type: 'search', class: 'search', placeholder: 'Zoek in deze pagina (markeert treffers)...', style: { maxWidth: '360px' } }) as HTMLInputElement;
  const count = h('span', { class: 'muted' });
  let marks: HTMLElement[] = [];
  let idx = 0;
  function clearMarks() {
    for (const m of marks) {
      const p = m.parentNode!;
      p.replaceChild(document.createTextNode(m.textContent!), m);
      p.normalize();
    }
    marks = [];
  }
  function highlight(q: string) {
    clearMarks();
    if (q.length < 2) {
      count.textContent = '';
      return;
    }
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => ((n.parentElement?.closest('.katex') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)) });
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    const ql = q.toLowerCase();
    for (const n of nodes) {
      const t = n.data;
      const lower = t.toLowerCase();
      let i = lower.indexOf(ql);
      if (i < 0) continue;
      const frag = document.createDocumentFragment();
      let last = 0;
      while (i >= 0) {
        frag.appendChild(document.createTextNode(t.slice(last, i)));
        const m = h('mark', null, t.slice(i, i + q.length));
        marks.push(m);
        frag.appendChild(m);
        last = i + q.length;
        i = lower.indexOf(ql, last);
      }
      frag.appendChild(document.createTextNode(t.slice(last)));
      n.parentNode!.replaceChild(frag, n);
    }
    count.textContent = marks.length ? `${marks.length} treffer(s) - Enter = volgende` : 'geen treffers';
    idx = 0;
    marks[0]?.scrollIntoView({ block: 'center' });
  }
  let timer: any;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => highlight(search.value.trim()), 200);
  });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && marks.length) {
      idx = (idx + 1) % marks.length;
      marks[idx].scrollIntoView({ block: 'center' });
    }
  });
  el.append(
    h('div', { class: 'formbar' }, withSearch ? search : null, count, h('button', { class: 'btn btn-sm', type: 'button', onclick: () => window.print() }, 'Afdrukken')),
    content.toc.length > 3 ? toc : '',
    body,
  );
  return { scrollTo: (id: string) => document.getElementById(id)?.scrollIntoView() };
}

export const formulariumMod: ModuleDef = {
  id: 'formularium',
  title: 'Formularium',
  group: 'Fase 1',
  keywords: ['formularium', 'formule', 'formules', 'spiekbrief', 'excel functies', 'samenvatting'],
  subs: [['spiek', 'Spiekbrief (beslistabellen)', 'spiekbrief welke toets welke kaart welke verdeling']],
  mount(el) {
    moduleHead(el, 'Formularium');
    let api: { scrollTo(id: string): void } | null = null;
    const t = tabs('formularium', [
      { id: 'form', label: 'Formularium', build: (e) => { api = mdPage(e, formularium, true); } },
      { id: 'spiek', label: 'Spiekbrief', build: (e) => { mdPage(e, spiekbrief, false); } },
    ], el);
    return {
      route(sub) {
        if (sub === 'spiek') t.show('spiek');
        else if (sub) {
          t.show('form');
          setTimeout(() => api?.scrollTo(sub), 30);
        }
      },
    };
  },
};

// ---------- Voorbeeldexamen ----------
const LOADS: Record<string, [string, [string, string?, any?][]]> = {
  '1': ['Open de uitleg', [['hypothese', 'dual'], ['hypothese', 'propci', { d: 4, n: 100, conf: 0.95, kind: 'two' }]]],
  '2': ['Laad in F-toets (voorbeeldvarianties)', [['hypothese', 'f', { mode: 'sum', kind: 'var', v1: 0.004, n1: 10, v2: 0.015, n2: 15, alpha: 0.05, side: 'left' }]]],
  '3': ['Laad in Capabiliteit', [['capabiliteit', 'cont', { mode: 'direct', mu: 1440, sigma: 10, sigmaLT: '', LSL: 1400, USL: 1460, target: 1.33 }], ['capabiliteit', 'dpmo', { dir: 's2d', lvl: 6, shift: 1.5 }]]],
  '4': ['Open SPC', [['spc', 'xbar']]],
  '5': ['Laad confusion matrices', [['ml', 'conf', { exam: true }]]],
  '6': ['Laad σ uit staartkans', [['verdelingen', 'sigma', { what: 'sigma', mu: 820, c: 720, tail: 'left', p: 0.05 }], ['verdelingen', 'calc', { dist: 'binom', 'binom.n': 100, 'binom.pi': 0.05, mode: 'le', x: 5 }], ['verdelingen', 'welke']]],
  '7': ['Open causaliteit-uitleg', [['ml', 'causal']]],
};
const LOAD_LABELS: Record<string, string[]> = {
  '1': ['Dualiteit BI-toets', 'BI fractie'],
  '2': ['F-toets / BI verhouding'],
  '3': ['Cp/Cpk', 'DPMO bij 6 sigma'],
  '4': ['Regelkaart'],
  '5': ['Confusion matrices A/B/C'],
  '6': ['σ uit P(C<720)=5%', 'Binomiaal D', 'Welke verdeling?'],
  '7': ['Seeing vs doing'],
};

export const examen: ModuleDef = {
  id: 'examen',
  title: 'Voorbeeldexamen',
  group: 'Fase 1',
  keywords: ['voorbeeldexamen', 'examen', 'oplossing', 'vraag', 'worked solutions'],
  mount(el, ctx) {
    moduleHead(el, 'Voorbeeldexamen 9 oktober 2025', '7 vragen, 20 punten. Klik op een vraag voor de uitgewerkte oplossing; "Laad in tool" opent de juiste module met de gegevens ingevuld.');
    for (let i = 1; i <= 7; i++) {
      const k = String(i);
      const q = exam.questions[k] ?? '';
      const s = exam.solutions[k] ?? '<p>Oplossing niet beschikbaar.</p>';
      const [, loads] = LOADS[k];
      const btns = loads.map((L, j) => h('button', { class: 'btn btn-sm', type: 'button', onclick: () => ctx.go(L[0], L[1], L[2]) }, 'Laad in tool: ' + (LOAD_LABELS[k][j] ?? L[0])));
      const title = (q.match(/<p>(.*?)<\/p>/)?.[1] ?? '').slice(0, 0);
      void title;
      el.append(
        h('section', { class: 'card' },
          h('h3', null, `Vraag ${i}`),
          h('div', { class: 'md', html: q }),
          exam.figures[k] ? h('img', { src: exam.figures[k], alt: `Figuur vraag ${i}`, class: 'examfig' }) : '',
          k === '7' ? h('details', { class: 'sol', open: true }, h('summary', null, 'Visualisatie: hoe zien de schetsen eruit? (a: regressielijn, b: S \u2192 T met bolletjes, c: T \u2192 S met kruisjes)'), causalFigures()) : '',
          h('div', { class: 'row' }, btns),
          h('details', { class: 'sol' }, h('summary', null, 'Uitgewerkte oplossing (Nederlands, examenantwoord)'), h('div', { class: 'md', html: s })),
          exam.original[k] ? h('details', { class: 'sol' }, h('summary', null, 'Originele uitwerking (Worked Solutions, Engels)'), h('div', { class: 'md', html: exam.original[k] })) : '',
        ),
      );
    }
    renderMath(el);
  },
};

// ---------- Self-test ----------
export const selftest: ModuleDef = {
  id: 'selftest',
  title: 'Zelftest',
  group: 'Start',
  keywords: ['zelftest', 'self-test', 'controle', 'golden', 'scipy', 'test'],
  mount(el) {
    moduleHead(el, 'Zelftest', `Rekent alle ${Object.keys(G).length} referentiegevallen (scipy = Excel) opnieuw en vergelijkt met relatieve tolerantie 1e-6.`);
    const box = h('div');
    const runBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Opnieuw uitvoeren');
    el.append(h('div', { class: 'row' }, runBtn), box);
    const run = () => {
      const t0 = performance.now();
      const checks = buildChecks(G);
      const ms = performance.now() - t0;
      const ok = checks.filter(passes).length;
      const groups = [...new Set(checks.map((c) => c.group))];
      const gTable = table(
        ['Geval', 'Controles', 'Status'],
        groups.map((g) => {
          const cs = checks.filter((c) => c.group === g);
          const pass = cs.every(passes);
          return [g, String(cs.length), h('span', { class: pass ? 'pass' : 'fail' }, pass ? 'OK' : 'FOUT')];
        }),
      );
      const detail = table(
        ['Geval', 'Grootheid', 'Berekend', 'Verwacht', 'Rel. fout', ''],
        checks.map((c) => {
          const rel = Math.abs(c.actual - c.expected) / Math.max(Math.abs(c.expected), 1e-300);
          return [c.group, c.name, String(+c.actual.toPrecision(12)), String(+c.expected.toPrecision(12)), c.actual === c.expected ? '0' : rel.toExponential(1), h('span', { class: passes(c) ? 'pass' : 'fail' }, passes(c) ? '✓' : '✗')];
        }),
      );
      // environment checks
      let katexOk = false;
      try {
        katexOk = tex('\\frac{a}{b}').includes('katex');
      } catch {}
      const env = table(['Omgeving', 'Status'], [
        ['Build', `${BUILD.date} - ${BUILD.commit}`],
        ['Formules (KaTeX, ingebouwd)', h('span', { class: katexOk ? 'pass' : 'fail' }, katexOk ? 'OK' : 'FOUT')],
        ['Lokale opslag (localStorage)', h('span', { class: store.available ? 'pass' : 'muted' }, store.available ? 'OK' : 'niet beschikbaar (werkt toch, zonder bewaren)')],
        ['Netwerk', 'geblokkeerd door CSP (default-src none): de toolkit gebruikt geen internet'],
        ['Rekentijd', `${ms.toFixed(0)} ms`],
      ]);
      box.replaceChildren(
        h('div', { class: 'note ' + (ok === checks.length ? 'ok' : 'err') }, h('span', { class: 'big' }, ok === checks.length ? `ALLES GROEN: ${ok}/${checks.length} controles OK` : `${checks.length - ok} van ${checks.length} controles FOUT`)),
        card('Omgeving', env),
        card(`Per geval (${groups.length})`, gTable),
        h('details', { class: 'sol' }, h('summary', null, `Alle ${checks.length} controles`), detail),
      );
    };
    runBtn.addEventListener('click', run);
    run();
  },
};
