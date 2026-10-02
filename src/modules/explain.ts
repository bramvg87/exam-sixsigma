// Study explanations ("Uitleg") for the result panels: why this test, what the formula means,
// what the critical value and p-value mean, how to read the decision. Dutch, numbers via nl().
import { nl, pctNl } from '../ui/core.ts';
import type { Side } from '../calc/hypo.ts';

type Ex = { question?: string[]; formula?: string[]; substituted?: string[]; result?: string[] };

const sideWhy = (s: Side, param: string, v0: string) =>
  s === 'two'
    ? `Tweezijdig omdat het vermoeden "${param} verschilt van ${v0}" is: afwijkingen naar boven en naar beneden tellen allebei, dus \\(\\alpha\\) wordt verdeeld over twee staarten (\\(\\alpha/2\\) per staart).`
    : s === 'left'
      ? `Linkszijdig omdat het vermoeden "${param} is kleiner dan ${v0}" is: enkel een te kleine waarde is bewijs tegen \\(H_0\\), dus heel \\(\\alpha\\) ligt in de linkerstaart.`
      : `Rechtszijdig omdat het vermoeden "${param} is groter dan ${v0}" is: enkel een te grote waarde is bewijs tegen \\(H_0\\), dus heel \\(\\alpha\\) ligt in de rechterstaart.`;

const frame = 'Denk aan een rechtszaak: \\(H_0\\) is de saaie standaardhypothese ("onschuldig") die we aanhouden tot de data te onwaarschijnlijk worden onder \\(H_0\\). \\(H_a\\) is wat je eigenlijk vermoedt en wil aantonen.';

export function critText(stat: string, crit: number[], side: Side, alpha: number, dist: string): string {
  const c = crit.map((v) => nl(v)).join(' en ');
  const where = side === 'two' ? `in elke staart ${pctNl(alpha / 2)}` : side === 'left' ? `${pctNl(alpha)} links` : `${pctNl(alpha)} rechts`;
  return `Kritieke waarde ${stat}_krit = ${c}: dit is de grens van het verwerpingsgebied in de ${dist}-verdeling, gekozen zodat er onder \\(H_0\\) precies ${where} van de grens ligt. Komt de toetsgrootheid voorbij die grens, dan is het resultaat "te zeldzaam als H0 waar zou zijn" en verwerp je \\(H_0\\). De kans dat je dat ten onrechte doet (vals alarm, fout van de eerste soort) is \\(\\alpha = ${nl(alpha)}\\).`;
}

export function pText(p: number, side: Side, alpha: number): string {
  const tail = side === 'two' ? 'in beide staarten (minstens even ver van 0 als de waargenomen waarde)' : side === 'left' ? 'links van de waargenomen waarde' : 'rechts van de waargenomen waarde';
  return `p-waarde = ${nl(p)}: de kans om, ALS \\(H_0\\) waar is, een toetsgrootheid te krijgen die minstens zo extreem is als de waargenomen, dus de oppervlakte ${tail}. ${p < alpha ? `Dat is kleiner dan \\(\\alpha=${nl(alpha)}\\): zo een resultaat is onder H0 te onwaarschijnlijk.` : `Dat is niet kleiner dan \\(\\alpha=${nl(alpha)}\\): zo een resultaat kan onder H0 nog gewoon door toeval ontstaan.`} Let op: p is NIET de kans dat \\(H_0\\) waar is.`;
}

export function ruleText(reject: boolean, v0: string, ciName: string): string {
  return `Drie gelijkwaardige beslisregels (geven altijd dezelfde conclusie): (1) p < \\(\\alpha\\); (2) toetsgrootheid in het kritieke gebied; (3) de hypothesewaarde ${v0} ligt buiten het ${ciName}. ${reject ? 'Hier zijn alle drie voldaan: verwerp H0.' : 'Hier is geen enkele voldaan: H0 niet verwerpen. Dat betekent "onvoldoende bewijs", niet "H0 is bewezen" (check het onderscheidingsvermogen / de steekproefgrootte).'}`;
}

const signalNoise = (se: string) => `De toetsgrootheid is een signaal/ruis-verhouding: de teller is het signaal (hoe ver de schatting van de hypothesewaarde ligt), de noemer is de ruis (${se}: hoeveel een schatting puur door toeval van steekproef tot steekproef schommelt).`;

// ---------- one-sample mean ----------
export function exMean(kind: 'z' | 't', d: { xbar: number; s: number; n: number; m0: number; a: number; side: Side; stat: number; crit: number[]; p: number; reject: boolean; ci: [number, number]; se: number }): Ex {
  const st = kind === 'z' ? 'z' : 't';
  const dist = kind === 'z' ? 'standaardnormale' : `t(${d.n - 1})`;
  return {
    question: [frame, sideWhy(d.side, '\u03bc', nl(d.m0))],
    formula: [
      kind === 'z'
        ? 'Waarom een Z-toets? \\(\\sigma\\) van de populatie is gekend (bv. uit historische SPC-data), dus \\((\\bar{x}-\\mu_0)/(\\sigma/\\sqrt{n})\\) is onder \\(H_0\\) exact standaardnormaal verdeeld.'
        : 'Waarom een t-toets? \\(\\sigma\\) is onbekend en wordt geschat door de steekproef-standaardafwijking \\(s\\). Die schatting voegt extra onzekerheid toe, en daarom gebruik je de t-verdeling: die heeft dikkere staarten dan de normale, met \\(n-1\\) vrijheidsgraden (een vrijheidsgraad gaat op aan het schatten van het gemiddelde). Voor grote n wordt t(n-1) bijna normaal.',
      signalNoise(kind === 'z' ? '\\(\\sigma/\\sqrt{n}\\), de standaardfout' : '\\(s/\\sqrt{n}\\), de geschatte standaardfout'),
      'Het betrouwbaarheidsinterval gebruikt dezelfde bouwstenen omgekeerd: schatting \\(\\pm\\) kritieke waarde \\(\\times\\) standaardfout.',
    ],
    substituted: [
      `Standaardfout = ${nl(d.se)}. Het waargenomen verschil ${nl(d.xbar - d.m0)} is dus ${nl(Math.abs(d.stat))} standaardfouten van \\(\\mu_0=${nl(d.m0)}\\) verwijderd: ${st} = ${nl(d.stat)}.`,
      Math.abs(d.stat) < 1 ? 'Minder dan 1 standaardfout: zo een afwijking is heel gewoon bij toeval.' : Math.abs(d.stat) < 2 ? 'Tussen 1 en 2 standaardfouten: niet uitzonderlijk.' : 'Meer dan 2 standaardfouten: dat gebeurt zelden door toeval alleen.',
    ],
    result: [critText(st, d.crit, d.side, d.a, dist), pText(d.p, d.side, d.a), ruleText(d.reject, `\u03bc\u2080 = ${nl(d.m0)}`, `${pctNl(1 - d.a)}-betrouwbaarheidsinterval ${fmtCi(d.ci)}`)],
  };
}

const fmtCi = (ci: [number, number]) => `[${isFinite(ci[0]) ? nl(ci[0]) : '-oneindig'} ; ${isFinite(ci[1]) ? nl(ci[1]) : '+oneindig'}]`;

// ---------- chi2 variance ----------
export function exChi(d: { s: number; n: number; s0: number; a: number; side: Side; stat: number; crit: number[]; p: number; reject: boolean; ciS: [number, number] }): Ex {
  return {
    question: [frame, sideWhy(d.side, '\u03c3', nl(d.s0)), 'Typische vraag: "is de spreiding (nauwkeurigheid) van het proces veranderd?"'],
    formula: [
      'Waarom \\(\\chi^2\\)? Als X normaal verdeeld is, dan is \\((n-1)s^2/\\sigma^2\\) chi-kwadraat verdeeld met \\(n-1\\) vrijheidsgraden. Onder \\(H_0\\) vul je \\(\\sigma_0\\) in.',
      'Interpretatie: \\(s^2/\\sigma_0^2\\) is de verhouding tussen waargenomen en veronderstelde variantie. Onder H0 is die gemiddeld 1, dus \\(\\chi^2\\) ligt dan rond zijn gemiddelde \\(n-1\\). Veel groter wijst op meer spreiding, veel kleiner op minder.',
      'De \\(\\chi^2\\)-verdeling is asymmetrisch en enkel positief: de linker- en rechterkritieke waarden liggen dus niet symmetrisch rond het midden. Het BI voor \\(\\sigma^2\\) draai je om: grote \\(\\chi^2\\)-kwantiel in de noemer geeft de ondergrens.',
    ],
    substituted: [`\\(s^2/\\sigma_0^2 = ${nl((d.s * d.s) / (d.s0 * d.s0))}\\): de waargenomen variantie is ${nl((d.s * d.s) / (d.s0 * d.s0))} keer de veronderstelde. Verwacht onder H0: \\(\\chi^2 \\approx ${d.n - 1}\\); waargenomen ${nl(d.stat)}.`],
    result: [
      critText('\u03c7\u00b2', d.crit, d.side, d.a, `\u03c7\u00b2(${d.n - 1})`),
      pText(d.p, d.side, d.a),
      ruleText(d.reject, `\u03c3\u2080 = ${nl(d.s0)}`, `${pctNl(1 - d.a)}-BI voor \u03c3 ${fmtCi(d.ciS)}`),
      'Belangrijk: deze toets is NIET robuust. Wijkt de verdeling af van normaal, dan kloppen p en de kritieke waarden niet meer.',
    ],
  };
}

// ---------- F ----------
export function exF(d: { names: string[]; side: Side; a: number; d1: number; d2: number; F: number; crit: number[]; p: number; reject: boolean; Fa: number; L?: number }): Ex {
  const [n1, n2] = d.names;
  return {
    question: [
      frame,
      `"${n1} werkt nauwkeuriger" betekent statistisch: kleinere variantie, \\(\\sigma_1^2 < \\sigma_2^2\\). Dat is gelijk aan \\(\\sigma_2^2/\\sigma_1^2 > 1\\): een uitspraak over een VERHOUDING van varianties, daarom de F-verdeling.`,
      d.side === 'two' ? 'Tweezijdig: je wil enkel weten of de varianties verschillen.' : 'Eenzijdig: het vermoeden heeft een richting, dus een eenzijdige grens (ondergrens) volstaat. Bij een eenzijdige toets hoort een eenzijdig betrouwbaarheidsinterval.',
    ],
    formula: [
      'Waarom F? Een verhouding van twee onafhankelijke (gedeeld door hun vrijheidsgraden) chi-kwadraatgrootheden is F-verdeeld. Elke \\(s^2/\\sigma^2\\) is zo een grootheid, dus \\(\\frac{s_1^2/\\sigma_1^2}{s_2^2/\\sigma_2^2}\\sim F(n_1-1;\\,n_2-1)\\): vrijheidsgraden teller = steekproef in de teller.',
      'Herschrijven met \\(\\rho=\\sigma_2^2/\\sigma_1^2\\): \\(\\frac{s_1^2}{s_2^2}\\rho\\sim F\\). Met kans \\(1-\\alpha\\) is die grootheid \\(\\ge F_\\alpha\\), dus \\(\\rho\\ge \\frac{s_2^2}{s_1^2}F_\\alpha\\): dat is de ondergrens L. Excel F.INV geeft de LINKERstaart, dus F.INV(\\(\\alpha\\);...) is een getal kleiner dan 1.',
      'Draai je de verhouding om, dan wisselen ook de vrijheidsgraden: \\(F_\\alpha(a;b)=1/F_{1-\\alpha}(b;a)\\). Schrijf op het examen altijd welke variantie in de teller staat.',
    ],
    substituted: [
      `F.INV(${nl(d.a)};${d.d1};${d.d2}) = ${nl(d.Fa)}: slechts ${pctNl(d.a)} van de F(${d.d1};${d.d2})-verdeling ligt links van deze waarde.`,
      d.L !== undefined ? `L = ${nl(d.L)}: met ${pctNl(1 - d.a)} betrouwbaarheid is \u03c3\u2082\u00b2 minstens ${nl(d.L)} keer \u03c3\u2081\u00b2.` : '',
    ].filter(Boolean),
    result: [
      d.L !== undefined ? `Beslissing via het interval: ligt de ondergrens L boven 1, dan ligt het volledige interval boven 1 en is \\(\\sigma_2^2 > \\sigma_1^2\\) aangetoond. Ligt L onder 1, dan zit "gelijke varianties" (\\(\\rho=1\\)) nog in het interval.` : 'Beslissing via het interval: bevat het tweezijdige interval de waarde 1, dan is er geen significant verschil in variantie.',
      critText('F', d.crit, d.side, d.a, `F(${d.d1};${d.d2})`),
      pText(d.p, d.side, d.a),
      'Voorwaarden: beide populaties normaal en onafhankelijke steekproeven; de F-toets is gevoelig voor niet-normaliteit.',
    ],
  };
}

// ---------- proportion ----------
export function exProp(d: { dd: number; n: number; p0: number; a: number; side: Side; z: number; crit: number[]; pN: number; pE: number; reject: boolean; cc: boolean }): Ex {
  return {
    question: [frame, sideWhy(d.side, '\u03c0', nl(d.p0)), `Begrippen: \\(\\pi\\) = ware fractie defecten van het proces (onbekend), \\(P=d/n\\) = waargenomen fractie in de steekproef, \\(E(P)=\\pi\\): gemiddeld over veel steekproeven valt P precies op \\(\\pi\\).`],
    formula: [
      'Het aantal defecten D in n stuks is binomiaal(\\(n,\\pi\\)). Voor grote n is \\(P=D/n\\) ongeveer normaal met gemiddelde \\(\\pi\\) en standaardfout \\(\\sqrt{\\pi(1-\\pi)/n}\\); onder \\(H_0\\) vul je \\(\\pi_0\\) in. Dat geeft de Z-grootheid (signaal/ruis zoals bij de t-toets).',
      d.cc ? 'De continu\u00efteitscorrectie \\(\\pm\\frac{1}{2n}\\) corrigeert voor het feit dat je een discrete (binomiale) verdeling benadert met een continue (normale): je schuift P een halve eenheid richting \\(\\pi_0\\), wat de toets iets voorzichtiger maakt.' : 'Zonder continu\u00efteitscorrectie is de normale benadering iets te optimistisch bij kleine n.',
      'De exacte toets rekent rechtstreeks met de binomiale verdeling: p = P(D \u2265 d) (rechtszijdig) als \\(\\pi=\\pi_0\\). Die is altijd geldig en heeft de voorkeur als \\(n\\pi_0 < 5\\).',
    ],
    substituted: [`Verwacht aantal defecten onder H0: \\(n\\pi_0 = ${nl(d.n * d.p0)}\\); waargenomen d = ${d.dd}. z = ${nl(d.z)} standaardfouten.`],
    result: [
      critText('z', d.crit, d.side, d.a, 'standaardnormale'),
      `p-waarden: normale benadering ${nl(d.pN)}, exact (binomiaal) ${nl(d.pE)}. ${Math.abs(d.pN - d.pE) > 0.01 ? 'Ze verschillen merkbaar: vertrouw op de exacte waarde.' : 'Ze liggen dicht bij elkaar: de benadering is hier goed.'} De beslissing hierboven gebruikt de exacte p-waarde.`,
      d.n * d.p0 < 5 ? `Let op: \\(n\\pi_0 = ${nl(d.n * d.p0)} < 5\\), de normale benadering is hier twijfelachtig.` : '',
    ].filter(Boolean),
  };
}

// ---------- CI proportion ----------
export function exPropCi(d: { dd: number; n: number }): Ex {
  return {
    question: ['Een betrouwbaarheidsinterval geeft de reeks waarden van \\(\\pi\\) die met de data verenigbaar zijn. "95%" betekent: als je de steekproef heel vaak herhaalt, bevat 95% van de zo berekende intervallen de ware \\(\\pi\\).'],
    formula: [
      'Exact (Clopper-Pearson): de ondergrens is de kleinste \\(\\pi\\) waarbij d defecten (of meer) nog niet in de bovenste \\(\\alpha/2\\)-staart valt, de bovengrens de grootste \\(\\pi\\) waarbij d (of minder) nog niet in de onderste \\(\\alpha/2\\)-staart valt. Dat zoeken is in Excel precies BETA.INV.',
      'Wald (normale benadering) gebruikt \\(p \\pm z\\sqrt{p(1-p)/n}\\): eenvoudig, maar slecht bij weinig defecten (kan zelfs onder 0 gaan). Wilson is een betere benadering zonder BETA.INV.',
    ],
    substituted: [`Met d = ${d.dd} is de verdeling van D sterk scheef${d.dd < 5 ? ', daarom wijkt Wald hier sterk af' : ''}.`],
    result: ['Interpretatie: met de gekozen betrouwbaarheid ligt de ware fractie defecten tussen de grenzen. Een bewering als "minder dan 1% defect" is pas aangetoond als de BOVENgrens onder 1% ligt.'],
  };
}

// ---------- two samples ----------
export function exTwo(d: { pooled: { t: number; df: number; p: number; reject: boolean }; welch: { t: number; df: number; p: number }; fp: number; a: number; side: Side }): Ex {
  return {
    question: [frame, sideWhy(d.side, '\u03bc\u2081 - \u03bc\u2082', 'd'), 'Onafhankelijke steekproeven: de stuks in groep 1 hebben niets te maken met die in groep 2 (anders: gepaarde toets).'],
    formula: [
      'Pooled t (cursusrecept): als beide populaties dezelfde \\(\\sigma\\) hebben, schat je die ene \\(\\sigma^2\\) het best door de twee varianties te middelen, gewogen met hun vrijheidsgraden: \\(s_p^2\\). De standaardfout van \\(\\bar{x}_1-\\bar{x}_2\\) is dan \\(s_p\\sqrt{1/n_1+1/n_2}\\) en df = \\(n_1+n_2-2\\) (twee gemiddelden geschat).',
      'Welch: geen aanname van gelijke varianties; elke groep houdt zijn eigen \\(s^2/n\\) en de vrijheidsgraden worden geschat (Welch-Satterthwaite), meestal een niet-geheel getal.',
      'De F-voortoets controleert de aanname \\(\\sigma_1=\\sigma_2\\), maar is zelf gevoelig voor niet-normaliteit: gebruik hem voorzichtig.',
    ],
    substituted: [`Pooled: t = ${nl(d.pooled.t)} met df = ${d.pooled.df}; Welch: t = ${nl(d.welch.t)} met df = ${nl(d.welch.df)}.`],
    result: [pText(d.pooled.p, d.side, d.a), `Zijn de varianties duidelijk verschillend (F-voortoets p = ${nl(d.fp)}${d.fp < 0.05 ? ' < 0,05' : ''}), vertrouw dan eerder op Welch. Geven beide dezelfde conclusie, dan is de keuze niet kritisch.`],
  };
}

export function exPaired(d: { n: number; vbar: number; sv: number; stat: number; p: number; a: number; side: Side }): Ex {
  return {
    question: [frame, 'Gepaard: elke meting in kolom 1 hoort bij precies \u00e9\u00e9n meting in kolom 2 (zelfde stuk, zelfde persoon, voor en na). Daardoor zijn de twee kolommen afhankelijk en mag je ze niet als twee onafhankelijke steekproeven behandelen.'],
    formula: ['Truc: bereken per paar het verschil \\(v_i=x_{1i}-x_{2i}\\). De verschilkolom is \u00e9\u00e9n gewone steekproef, dus je doet een t-toets voor \u00e9\u00e9n gemiddelde op \\(v\\) met df = n - 1. Het voordeel: de variatie TUSSEN de stuks valt weg, waardoor kleine effecten beter zichtbaar worden.'],
    substituted: [`Gemiddeld verschil ${nl(d.vbar)} met standaardfout \\(s_v/\\sqrt{n} = ${nl(d.sv / Math.sqrt(d.n))}\\): t = ${nl(d.stat)}.`],
    result: [pText(d.p, d.side, d.a)],
  };
}

export const exSampleSize: Ex = {
  formula: [
    'Vier keuzes bepalen n: \\(\\alpha\\) (aanvaard risico op vals alarm, meestal 5%), \\(\\beta\\) (aanvaard risico op een gemist effect, meestal 10 - 20%; power = \\(1-\\beta\\)), \\(\\delta\\) (kleinste effect dat er zakelijk toe doet: een beslissing, geen statistiek) en \\(\\sigma\\) (natuurlijke ruis, uit historische data, nooit verzonnen).',
    'Logica: de foutmarge \\(z\\,\\sigma/\\sqrt{n}\\) moet klein genoeg zijn. Omdat n onder een wortel staat, vraagt een halvering van de marge vier keer zoveel waarnemingen.',
  ],
  result: ['Kleinere \\(\\alpha\\) of \\(\\beta\\), kleiner effect \\(\\delta\\) of grotere ruis \\(\\sigma\\): allemaal vragen ze een grotere steekproef. Bij vaste n kan je \\(\\beta\\) enkel verkleinen door \\(\\alpha\\) te vergroten.'],
};

// ---------- ANOVA ----------
export function exOneWay(d: { k: number; N: number; F: number; Fc: number; p: number; a: number; msb: number; msw: number; df1: number; df2: number; r2: number }): Ex {
  return {
    question: [
      'Vraag: verschillen de gemiddelden van k groepen (niveaus van \u00e9\u00e9n factor)? \\(H_0\\): alle \\(\\mu_i\\) gelijk; \\(H_a\\): minstens \u00e9\u00e9n verschilt (ANOVA zegt niet welke).',
      `Waarom geen reeks t-toetsen? Met ${d.k} groepen zijn er ${(d.k * (d.k - 1)) / 2} paren; elke t-toets heeft kans \\(\\alpha\\) op vals alarm, dus de kans op minstens \u00e9\u00e9n vals alarm loopt op (bij ${(d.k * (d.k - 1)) / 2} toetsen op 5%: tot ${nl(1 - Math.pow(0.95, (d.k * (d.k - 1)) / 2))}). ANOVA toetst alles in \u00e9\u00e9n keer op niveau \\(\\alpha\\).`,
    ],
    formula: [
      'Kernidee: splits de totale variatie in twee delen. \\(SS_B\\) (between) meet hoe ver de groepsgemiddelden van het algemene gemiddelde liggen: dat is het effect van de factor plus ruis. \\(SS_W\\) (within) meet de spreiding binnen de groepen: dat is enkel ruis.',
      'Delen door de vrijheidsgraden geeft "mean squares", twee schattingen van \\(\\sigma^2\\): \\(MS_W\\) schat altijd \\(\\sigma^2\\); \\(MS_B\\) schat \\(\\sigma^2\\) enkel als H0 waar is, en is groter als de gemiddelden echt verschillen. df: k - 1 voor de groepen (k gemiddelden, 1 algemeen gemiddelde gebruikt), N - k binnen (N waarnemingen, k gemiddelden geschat).',
      '\\(F = MS_B/MS_W\\) is dus een signaal/ruis-verhouding: onder H0 rond 1, bij een echt effect veel groter. Daarom is de ANOVA-toets altijd rechtszijdig.',
    ],
    substituted: [`\\(MS_B = ${nl(d.msb)}\\) en \\(MS_W = ${nl(d.msw)}\\): de variatie tussen de groepen is ${nl(d.F)} keer zo groot als wat je door ruis alleen zou verwachten.`],
    result: [
      `F-kritiek = ${nl(d.Fc)}: onder H0 ligt slechts ${pctNl(d.a)} van de F(${d.df1};${d.df2})-verdeling rechts van deze grens. F = ${nl(d.F)} ligt ${d.F > d.Fc ? 'erboven: verwerp H0' : 'eronder: H0 niet verwerpen'}.`,
      pText(d.p, 'right', d.a),
      `R\u00b2 = SS_B/SS_T = ${nl(d.r2)}: ${pctNl(d.r2)} van de totale variatie wordt verklaard door de groepen.`,
      'Na een significante ANOVA: zoek WELKE groepen verschillen met een post-hoc vergelijking (Tukey, of paarsgewijze t-toetsen met Bonferroni-correctie \\(\\alpha/m\\)). Controleer de aannames met de spreiding per groep en een residuplot.',
    ],
  };
}

export function exTwoWay(d: { rep: boolean; pA: number; pB: number; pAB?: number; a: number }): Ex {
  return {
    question: [
      'Tweeweg-ANOVA onderzoekt twee factoren tegelijk (bv. machine en operator). Je toetst drie hypothesen: geen effect van A, geen effect van B' + (d.rep ? ', en geen interactie A x B.' : '. (Zonder herhaling kan de interactie niet getoetst worden.)'),
      'Voordeel boven twee aparte eenweg-ANOVA\u2019s: de variatie door de andere factor wordt uit de foutterm gehaald, waardoor de toets gevoeliger wordt (zelfde idee als blokken in DOE).',
    ],
    formula: [
      'De totale kwadratensom wordt gesplitst: \\(SS_T = SS_A + SS_B + ' + (d.rep ? 'SS_{AB} + SS_E' : 'SS_E') + '\\). Elke bron krijgt zijn MS = SS/df, en elke F vergelijkt die MS met de foutvariantie \\(MS_E\\) (zuivere ruis).',
      d.rep
        ? 'Interactie betekent: het effect van A hangt af van het niveau van B (in het interactieplot: lijnen die niet evenwijdig lopen). \\(SS_E\\) komt hier uit de herhalingen binnen elke cel: zuivere meetruis.'
        : 'Zonder herhaling is er per cel maar \u00e9\u00e9n waarneming; wat overblijft na A en B (de residu) bevat de interactie en de ruis samen. Je moet dus veronderstellen dat er geen interactie is.',
    ],
    result: [
      d.rep && d.pAB !== undefined
        ? `Lees eerst de interactie (p = ${nl(d.pAB)}). ${d.pAB < d.a ? 'Ze is significant: de hoofdeffecten zijn dan niet los te interpreteren ("het hangt ervan af"), bekijk het interactieplot en vergelijk de celgemiddelden.' : 'Ze is niet significant: je mag de hoofdeffecten A en B afzonderlijk interpreteren.'}`
        : '',
      `Hoofdeffecten: A p = ${nl(d.pA)} (${d.pA < d.a ? 'significant' : 'niet significant'}), B p = ${nl(d.pB)} (${d.pB < d.a ? 'significant' : 'niet significant'}). Elke p-waarde is de kans op minstens zo een grote F als die factor geen effect had.`,
    ].filter(Boolean),
  };
}
