# Voorbeeldexamen UGAIN Black Belt Module 3 (9 oktober 2025, 14u-17u, 20 punten)

Bron: `20251009_voorbeeldexamen six sigma.docx`. Tekst overgenomen; figuren (scatterplots vraag 7) en de Excel-data van vraag 2 zitten niet in het docx. Uitgewerkte oplossingen: `Six_Sigma_BB_Module3_Worked_Solutions.md`.

## Vraag 1 [2,5] - Correct of niet correct? Motiveer kort.
a. Een hypothesetest leidt tot de conclusie dat een dure aanpassing van een productieprocédé een significant positief effect heeft op de kwaliteit. Het ligt dus voor de hand te investeren.
b. Een 95%-betrouwbaarheidsinterval voor het percentage defectieven is [1,4% ; 2,2%]. Dit proces is dus niet geschikt om minder dan 1% defectieven af te leveren.
c. Het populatiegemiddelde van een grootheid X kan in theorie worden geschat met om het even welke vooropgestelde nauwkeurigheid.
d. Cluster sampling zal nooit non-response bias vertonen.
e. Om een hypothese te testen bij een significantie van 1%, dient een 99%-betrouwbaarheidsinterval te worden berekend.

## Vraag 2 [3] - Variantieverhouding (F)
Twee machines M1 en M2 maken metalen stukken, nominaal X = 10,000, beide correct afgesteld, X normaal verdeeld. Vermoeden: M1 werkt nauwkeuriger dan M2. Random steekproeven: n1 = 10 (M1), n2 = 15 (M2), data in Excel. Bepaal een eenzijdig 95%-betrouwbaarheidsinterval voor de verhouding van de machine-varianties en besluit of het vermoeden gerechtvaardigd is.
HINT: de grootheid volgt een F-verdeling met n1-1 vrijheidsgraden voor de teller en n2-1 voor de noemer. Gebruik F.INV.

## Vraag 3 [2] - Capabiliteit
Klant vereist breedte tussen 1400 en 1460 mm. Gemiddelde 1440 mm, standaardafwijking 10 mm.
a. Capabiliteit van het proces? b. Welk % uitval? c. Twee manieren om de capabiliteit te verbeteren. d. Welk % uitval kan hoogstens worden getolereerd om aan het 6 sigma-criterium te voldoen?

## Vraag 4 [1,5] - Regelkaarten
a. Waarom mogen we bij regelkaarten de normale verdeling veronderstellen en werken met gemiddelden / standaardafwijking?
b. Welk soort oorzaken van afwijking kunnen we detecteren met een meet- en regelkaart?
c. Wanneer gebruiken we de range als beste schatting?

## Vraag 5 [4] - Confusion matrices, bias en variantie
Beslissingsboom, drie varianten. Rijen = werkelijk (Goed, Slecht), kolommen = voorspeld (Goed, Slecht).

| Model | Training | Test |
|---|---|---|
| A | [[480, 20], [15, 485]] | [[180, 120], [110, 190]] |
| B | [[380, 120], [140, 360]] | [[190, 110], [120, 180]] |
| C | [[420, 80], [70, 430]] | [[200, 100], [85, 215]] |

a. Welk model heeft hoge variantie, welk hoge bias, welk is optimaal? Verklaar.
b. Je traint een boom en stelt hoge bias vast: wat verander je aan de boom?

## Vraag 6 [4] - Verdelingen
Elco's (nominaal 800 µF), niet-conform als capaciteit < 720 µF. Verkocht per lot van 100. Gemiddeld 2 op 40 niet-conform; gemiddelde capaciteit 820 µF. Gemiddeld 175,3 bestellingen per week van gemiddeld 3,6 loten.
Toevalsveranderlijken (symbolen ontbreken in het docx; in de oplossing B, T, C, X, D):
- B: aantal bestellingen in een willekeurige week
- T: tijd tussen twee opeenvolgende bestellingen
- C: capaciteit van een elco
- X: conformiteit (wel/niet) van een elco
- D: aantal niet-conforme elco's in een lot
a. Plaats de verwachtingswaarde van elke variabele in de juiste kolom: normaal, Bernoulli, exponentieel, uniform, Poisson, binomiaal.
b. Voor welke variabelen is "populatie van onafhankelijke, identiek verdeelde elementen" onrealistisch? Waarom?
c. Bereken Var[...] (variabele onleesbaar; reken zowel Var[C] als Var[D]).

## Vraag 7 [3] - Regressielijn en causale interventie
Fictieve 2D-kansverdeling: gloeitemperatuur T (°C) en sterkte S (MPa), twee scatterplots.
a. Schets de regressielijn f(x) = E[S | T = x] (eerste figuur).
b. Causaal diagram S -> T. Interventie: T vast op 730 °C. Schets met BOLLETJES ~10 mogelijke observaties na interventie (eerste figuur).
c. Causaal diagram T -> S. Zelfde interventie. Schets met KRUISJES ~10 observaties (tweede figuur).
