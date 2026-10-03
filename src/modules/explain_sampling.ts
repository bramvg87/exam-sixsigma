// Study explanations for the acceptance sampling module (Aanvaardingssteekproeven). Dutch, numbers via nl().
import { nl, pctNl } from '../ui/core.ts';
import { binomPmf, poisPmf, hyperPmf } from '../stats/dist.ts';

type Ex = { question?: string[]; formula?: string[]; substituted?: string[]; result?: string[] };

const GLOSSARY = [
  'Wat is het? Bij een aanvaardingssteekproef (acceptance sampling) keur je niet het hele lot, maar neem je n stuks en beslis je op basis van het aantal defecten d of het HELE lot aanvaard of afgekeurd wordt. Het is een toets: H₀ "het lot is goed (op AQL-niveau)" tegen Hₐ "het lot is slecht (op LQL-niveau)".',
  'Begrippen: π = ware fractie defect in het lot (onbekend). n = steekproefgrootte. c = aanvaardingsgetal: aanvaard als d ≤ c, anders afkeuren. AQL (Acceptable Quality Level) = een fractie defect die de klant nog als goed beschouwt; zulke lots wil je bijna altijd aanvaarden. LQL (Limiting Quality Level, ook LTPD of RQL) = een fractie defect die duidelijk slecht is; zulke lots wil je bijna altijd afkeuren.',
  'Twee risico’s: α = producentenrisico = kans dat een GOED lot (op AQL) toch afgekeurd wordt (fout van de 1e soort; de producent is benadeeld). β = consumentenrisico = kans dat een SLECHT lot (op LQL) toch aanvaard wordt (fout van de 2e soort; de klant is benadeeld).',
];

export function exSingle(d: { n: number; c: number; A: number; L: number; Pa: number; alpha: number; beta: number; model: 'binom' | 'hyper' | 'pois'; N?: number }): Ex {
  return {
    question: GLOSSARY,
    formula: [
      `Waarom binomiaal? Elk getrokken stuk is defect met kans \\(\\pi\\), onafhankelijk van de andere: het aantal defecten d in n stuks is dan binomiaal(n, \\(\\pi\\)). P_acc(\\(\\pi\\)) = P(d ≤ c) telt de kansen op 0, 1, ..., c defecten op.`,
      d.model === 'hyper'
        ? `Hypergeometrisch: je trekt zonder teruglegging uit een eindig lot van N = ${d.N} stuks met \\(\\pi N\\) defecten. Exact, maar bij n/N klein (< 10%) bijna gelijk aan binomiaal.`
        : d.model === 'pois'
          ? 'Poisson: benadering van de binomiaal voor grote n en kleine \\(\\pi\\), met \\(\\lambda = n\\pi\\) verwachte defecten. Handig voor tabellen.'
          : 'Bij een eindig lot is de hypergeometrische verdeling exact; voor grote lots (n/N < 10%) is binomiaal een prima benadering.',
      'De OC-curve (operating characteristic) is P_acc als functie van de ware fractie defect \\(\\pi\\). Een perfecte keuring zou een verticale stap zijn: alles onder een grens aanvaarden, alles erboven afkeuren. Een steekproef geeft een glooiende curve; hoe groter n, hoe steiler en hoe beter het plan goed en slecht onderscheidt.',
    ],
    substituted: [
      ...(d.c <= 12 ? [d.A, d.L].map((pi) => {
        const pmf = (k: number) => (d.model === 'pois' ? poisPmf(k, d.n * pi) : d.model === 'hyper' ? hyperPmf(k, d.N!, Math.round(pi * d.N!), d.n) : binomPmf(k, d.n, pi));
        const terms = Array.from({ length: d.c + 1 }, (_, k) => pmf(k));
        return `P_acc(${pctNl(pi)}) = ${terms.map((t, k) => `P(d=${k})`).join(' + ')} = ${terms.map((t) => nl(t)).join(' + ')} = ${nl(terms.reduce((a, b) => a + b, 0))}: de kans op 0, 1, ..., ${d.c} defecten in de steekproef (telkens aanvaarden).`;
      }) : []),
      `Bij AQL = ${pctNl(d.A)}: verwacht aantal defecten in de steekproef n·AQL = ${nl(d.n * d.A)}; het plan aanvaardt tot c = ${d.c}, dus meestal aanvaard (P_acc = ${nl(d.Pa)}).`,
      `Bij LQL = ${pctNl(d.L)}: verwacht n·LQL = ${nl(d.n * d.L)} defecten, ruim boven c = ${d.c}, dus meestal afgekeurd (P_acc = ${nl(d.beta)}).`,
    ],
    result: [
      `α = ${pctNl(d.alpha)}: van de lots die precies op AQL-kwaliteit zijn, wordt ${pctNl(d.alpha)} onterecht afgekeurd (producentenrisico). β = ${pctNl(d.beta)}: van de lots op LQL-kwaliteit wordt ${pctNl(d.beta)} onterecht aanvaard (consumentenrisico).`,
      'In de grafiek: het groene punt (AQL) moet hoog liggen (P_acc ≈ 1 - α), het punt bij LQL laag (P_acc = β). Tussen AQL en LQL ligt de "grijze zone" waar het plan twijfelt.',
      'Hoe stuur je bij? Groter c bij vaste n: kleinere α maar grotere β (soepeler voor de producent). Kleiner c: omgekeerd. Beide risico’s tegelijk verkleinen kan enkel met een grotere n (steilere OC-curve), zie "Plan ontwerpen".',
      'p-waarde bij een waargenomen d: P(D ≥ d | π = AQL). Klein betekent: zoveel defecten zijn onwaarschijnlijk als het lot echt op AQL-niveau is.',
    ],
  };
}

export function exDesign(d: { A: number; L: number; am: number; bm: number; n: number; c: number; alpha: number; beta: number }): Ex {
  return {
    question: [
      'Wat is het? Je kiest vooraf welke kwaliteit je goed en slecht noemt (AQL, LQL) en welke risico’s je aanvaardt (α, β). De plan designer zoekt dan het goedkoopste plan: de kleinste steekproef n met een aanvaardingsgetal c dat aan beide eisen voldoet.',
      'Dit is hetzelfde als steekproefgrootte bepalen bij een hypothesetoets: twee punten op de OC-curve vastleggen (AQL, 1-α) en (LQL, β) legt n en c vast.',
    ],
    formula: [
      'Hoe werkt het? Voor elke n zoekt de tool de grootste c waarbij een slecht lot (LQL) hoogstens met kans β aanvaard wordt, en controleert dan of een goed lot (AQL) hoogstens met kans α afgekeurd wordt. De eerste n die lukt is het antwoord.',
      'Waarom wordt n groot als AQL en LQL dicht bij elkaar liggen? Dan moet de OC-curve heel steil zijn om twee bijna gelijke kwaliteiten te onderscheiden, en steilheid kost steekproefgrootte.',
    ],
    result: [
      `Plan (n = ${d.n}, c = ${d.c}): α = ${pctNl(d.alpha)} ≤ ${pctNl(d.am)} en β = ${pctNl(d.beta)} ≤ ${pctNl(d.bm)}. Omdat n en c gehele getallen zijn, liggen de werkelijke risico’s meestal iets onder de doelwaarden.`,
      'Tip: de verhouding LQL/AQL (discriminatieratio) bepaalt vooral hoe groot n moet zijn; hoe dichter bij 1, hoe duurder het plan.',
    ],
  };
}

export function exDouble(d: { N1: number; C1: number; C2: number; N2: number; C3: number; NS: number; CS: number; A: number; L: number; PaA: number; PaL: number; asnA: number; asnL: number; pSecA: number; sA: number; sL: number }): Ex {
  return {
    question: [
      'Wat is het? Een dubbel steekproefplan geeft een "tweede kans" bij twijfel. Neem eerst n₁ stuks: bij weinig defecten (d₁ ≤ c₁) meteen aanvaarden, bij veel defecten (d₁ ≥ c₂) meteen afkeuren. Daartussen (twijfelzone) neem je nog n₂ stuks en beslis je op het totaal: aanvaard als d₁ + d₂ ≤ c₃.',
      'Waarom? Duidelijk goede en duidelijk slechte lots worden al na de eerste (kleinere) steekproef beslist. Gemiddeld keur je dus minder stuks dan bij een enkelvoudig plan met dezelfde OC-curve.',
    ],
    formula: [
      'P_acc = P(meteen aanvaard) + som over de twijfelgevallen van P(d₁) · P(d₂ ≤ c₃ - d₁). Elke term is een binomiale kans.',
      'ASN (Average Sample Number) = gemiddeld aantal gekeurde stuks = n₁ + n₂ · P(tweede steekproef nodig). De ASN hangt af van de kwaliteit van het lot: het grootst bij middelmatige lots (veel twijfel), het kleinst bij heel goede of heel slechte lots.',
      'Equivalente plannen hebben (bijna) dezelfde OC-curve: dan beschermen ze producent en consument even goed, en kies je het plan met de kleinste ASN (minste keuringskost).',
    ],
    result: [
      `Bij AQL: dubbel P_acc = ${nl(d.PaA)} tegenover enkelvoudig (${d.NS}, ${d.CS}) ${nl(d.sA)}; bij LQL: ${nl(d.PaL)} tegenover ${nl(d.sL)}. Lijken die sterk op elkaar, dan zijn de plannen ongeveer equivalent.`,
      `Gemiddeld aantal gekeurde stuks: ${nl(d.asnA)} bij AQL (tweede steekproef in ${pctNl(d.pSecA)} van de lots) en ${nl(d.asnL)} bij LQL, tegenover altijd ${d.NS} bij het enkelvoudige plan. Nadeel van dubbel: administratief complexer en een variabele werklast.`,
    ],
  };
}

export function exVariables(d: { n: number; p0: number; a: number; k: number; kn: number; zp: number; za: number }): Ex {
  return {
    question: [
      'Wat is het? Bij een variabelenplan meet je de kwaliteitskenmerken (bv. een diameter) in plaats van enkel goed/fout te tellen. Uit x̄ en s van n stuks bereken je hoe ver het gemiddelde van de specificatiegrens ξ ligt, uitgedrukt in standaardafwijkingen: Q = (x̄ - ξ)/s (ondergrens) of (ξ - x̄)/s (bovengrens). Aanvaard als Q ≥ k.',
      'Begrippen: p₀ = AQL (fractie buiten specificatie die nog aanvaardbaar is), α = producentenrisico, k = aanvaardingsconstante.',
    ],
    formula: [
      'Waarom werkt dit? Als het kenmerk normaal verdeeld is, ligt de fractie buiten specificatie vast door hoeveel σ het gemiddelde van de grens ligt: fractie p hoort bij afstand \\(z_{1-p}\\). Ligt het gemiddelde ver genoeg van de grens (Q groot), dan is de fractie defect klein.',
      'Omdat x̄ en s zelf schattingen zijn, moet k groter zijn dan \\(z_{1-p_0}\\) (veiligheidsmarge). De exacte k komt uit de niet-centrale t-verdeling; Natrella geeft een gesloten benadering.',
      'Voordeel: meer informatie per stuk dan "goed/fout", dus voor hetzelfde onderscheidingsvermogen een veel kleinere n. Nadeel: vereist normaliteit en een plan per kenmerk.',
    ],
    result: [`z(1 - p₀) = ${nl(d.zp)}: bij exact p₀ = ${pctNl(d.p0)} defect ligt het gemiddelde ${nl(d.zp)}σ van de grens. Met n = ${d.n} en α = ${pctNl(d.a)} wordt dat k = ${nl(d.k)} (Natrella ${nl(d.kn)}): Q moet minstens ${nl(d.k)} zijn om het lot te aanvaarden.`],
  };
}

export function exLot(d: { C: number; N: number; pi: number; E: number; sd: number; lo: number; hi: number }): Ex {
  return {
    question: ['Wat is het? Als je de capabiliteit van het proces kent (Cpk), weet je de fractie defect \\(\\pi\\) en dus hoeveel defecten je in een lot mag verwachten. Daarmee kan je beoordelen of een lot met veel defecten nog "normaal toeval" is of een teken dat het proces veranderd is.'],
    formula: [
      'Waarom deze formule? Bij een gecentreerd proces ligt elke specificatiegrens op 3·Cpk standaardafwijkingen van het gemiddelde, dus \\(\\pi = 2\\,P(Z>3C_{pk})\\) (tweezijdig). Als de stuks onafhankelijk defect zijn, is het aantal defecten in een lot van N stuks binomiaal(N, \\(\\pi\\)), met verwachting \\(N\\pi\\) en standaardafwijking \\(\\sqrt{N\\pi(1-\\pi)}\\).',
    ],
    result: [
      `Bij Cpk = ${nl(d.C)} is π = ${pctNl(d.pi)}: gemiddeld ${nl(d.E)} defecten per lot van ${d.N}, met standaardafwijking ${nl(d.sd)}. Praktisch bereik (0,1% - 99,9%): ${d.lo} tot ${d.hi}.`,
      'Een lot ver buiten dat bereik is onder deze capabiliteit vrijwel onmogelijk: dan is het proces waarschijnlijk veranderd (speciale oorzaak) of zijn de defecten niet onafhankelijk (ze komen in clusters). Een kleine verbetering van Cpk (1 -> 1,33) verlaagt het aantal defecten drastisch.',
    ],
  };
}

export function exStrat(d: { k: number; n: number; piTot: number; varProp: number; varSrs: number; varNey: number; gainProp: number; gainNey: number; bigS: string }): Ex {
  return {
    question: [
      'Wat is het? Bij een gestratificeerde steekproef (stratified sampling) verdeel je de populatie eerst in strata: groepen die intern op elkaar lijken (bv. per machine, ploeg, leverancier of lijn). Dan trek je in ELK stratum een aselecte steekproef en combineer je de resultaten met de gewichten van de strata.',
      'Waarom? Een gewone aselecte steekproef (SRS, simple random sampling) kan door toeval te veel uit het ene en te weinig uit het andere stratum trekken. Stratificeren haalt die toevalsvariatie TUSSEN de strata weg, waardoor de schatting nauwkeuriger wordt (kleinere variantie) bij dezelfde n, en je bovendien per stratum een resultaat hebt.',
      'Begrippen: W_h = gewicht van stratum h (aandeel in de populatie, N_h/N). π_h = fractie defect in stratum h. n_h = steekproefgrootte in stratum h. S_h = \\(\\sqrt{\\pi_h(1-\\pi_h)}\\) = spreiding binnen stratum h.',
    ],
    formula: [
      'Totale schatting: \\(\\hat\\pi = \\sum W_h \\hat\\pi_h\\) (gewogen gemiddelde van de strata).',
      'Proportionele allocatie: \\(n_h = n W_h\\) (elk stratum krijgt zijn aandeel van de steekproef). Eenvoudig en altijd minstens zo goed als SRS.',
      'Neyman-allocatie (optimaal): \\(n_h \\propto W_h S_h\\). Een stratum krijgt meer steekproef als het groot is én als het intern veel spreidt; een stratum waar bijna alles hetzelfde is, heeft weinig metingen nodig. Dit geeft de kleinst mogelijke variantie voor een gegeven n.',
      'Variantieformules: SRS \\(\\pi(1-\\pi)/n\\) bevat ook de verschillen TUSSEN strata; proportioneel \\(\\sum W_h\\pi_h(1-\\pi_h)/n\\) enkel de spreiding BINNEN strata; Neyman \\((\\sum W_hS_h)^2/n\\).',
    ],
    result: [
      `Totale fractie π = ${nl(d.piTot)}. Variantie: SRS ${nl(d.varSrs)}, proportioneel ${nl(d.varProp)} (${pctNl(d.gainProp)} kleiner), Neyman ${nl(d.varNey)} (${pctNl(d.gainNey)} kleiner dan SRS).`,
      `De winst is klein als de strata gelijkaardig zijn (π_h bijna gelijk) en groot als ze sterk verschillen. Neyman legt extra steekproef in het stratum met de grootste spreiding (${d.bigS}).`,
      'Verwar niet met clusterbemonstering: bij stratificatie neem je uit ALLE groepen een steekproef (groepen intern gelijk, onderling verschillend); bij cluster sampling kies je enkele hele groepen en keur je die volledig (handig en goedkoop, maar minder nauwkeurig als de clusters verschillen).',
    ],
  };
}
