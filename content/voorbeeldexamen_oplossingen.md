# Voorbeeldexamen Black Belt Module 3 - uitgewerkte oplossingen

Voorbeeldexamen 9 oktober 2025 (20 punten, 3 uur). Getallen herrekend (scipy, gelijk aan Excel). Excel-formules in Nederlandse notatie (`;`, decimale komma, `WAAR`/`ONWAAR`).

## Vraag 1

**Opgave [2,5]**: correct of niet correct? Motiveer kort.

**a. "Significant positief effect van een dure aanpassing, dus investeren."** - **Niet correct.**
Statistisch significant betekent enkel dat het effect waarschijnlijk niet nul is ($p<\alpha$); het zegt niets over de **grootte** van het effect. Bij een grote steekproef wordt zelfs een miniem effect significant. Of investeren loont, vraagt een kosten-batenanalyse: hoe groot is het effect (betrouwbaarheidsinterval voor de verbetering), wat levert het op en wat kost de aanpassing. Statistische significantie is niet hetzelfde als praktische of economische relevantie.

**b. "95%-CI voor het percentage defectieven is [1,4% ; 2,2%], dus het proces is niet geschikt om minder dan 1% defectieven af te leveren."** - **Correct (met nuance).**
Het volledige interval ligt boven 1%: alle waarden van $\pi$ die verenigbaar zijn met de data (op 95%-betrouwbaarheid) zijn groter dan 1%. Een toets $H_0:\pi\le1\%$ zou dus verworpen worden (zelfs op het eenzijdige 2,5%-niveau). De conclusie wordt dus door het CI ondersteund. Nuances: (1) de uitspraak geldt voor het **huidige** proces zoals het nu draait; ze zegt niets over wat na verbetering mogelijk is; (2) het is een uitspraak met 95% betrouwbaarheid, geen zekerheid; (3) ze veronderstelt een representatieve steekproef uit een stabiel proces.

**c. "Het populatiegemiddelde kan in theorie met om het even welke nauwkeurigheid geschat worden."** - **Correct (in theorie).**
De standaardfout van het gemiddelde is
$$SE(\bar{X})=\frac{\sigma}{\sqrt{n}}\ \xrightarrow{\ n\to\infty\ }\ 0$$
dus de breedte van het CI $2z_{1-\alpha/2}\sigma/\sqrt{n}$ kan zo klein gemaakt worden als gewenst door $n$ groot genoeg te kiezen: $n=(z_{1-\alpha/2}\sigma/E)^2$. In de praktijk beperkt door kost en tijd, eindige populatie, en systematische fouten (bias, meetfout) die niet verdwijnen door een grotere steekproef.

**d. "Cluster sampling zal nooit non-response bias vertonen."** - **Niet correct.**
Non-response ontstaat **na** de selectie: geselecteerde elementen die niet antwoorden, niet gemeten kunnen worden of ontbreken. Dat kan bij elke steekproefmethode gebeuren, ook als volledige clusters gekozen worden (bv. een filiaal dat niet meewerkt, ontbrekende stuks in een doos). Als de non-respondenten systematisch verschillen, is de schatting vertekend.

**e. "Om een hypothese te testen bij een significantie van 1% dient een 99%-betrouwbaarheidsinterval te worden berekend."** - **Niet correct (te absoluut).**
- Een toets kan ook zonder CI uitgevoerd worden, via de kritieke waarde of de p-waarde ("dient" is fout).
- Als je de toets via een CI uitvoert, hangt het juiste interval af van de zijdigheid: een **tweezijdige** toets op 1% hoort bij een **tweezijdig** 99%-CI; een **eenzijdige** toets op 1% hoort bij een **eenzijdige** 99%-grens (equivalent: een grens van een tweezijdig 98%-CI).

**Examenantwoord:** a niet correct: significantie zegt niets over de grootte van het effect, een kosten-batenanalyse is nodig. b correct: het hele 95%-interval ligt boven 1%, dus het huidige proces haalt geen < 1% (wat niet uitsluit dat het na verbetering wel kan). c correct in theorie, want $SE=\sigma/\sqrt{n}\to0$ (in de praktijk beperkt door kost en bias); d niet correct, want non-response ontstaat na de selectie en kan bij elke methode optreden; e niet correct, want een toets kan ook via de p-waarde, en een eenzijdige 1%-toets hoort bij een eenzijdige 99%-grens (tweezijdig 98%-CI).

## Vraag 2

**Opgave [3]**: machines M1 ($n_1=10$) en M2 ($n_2=15$), $X$ normaal. Vermoeden: M1 nauwkeuriger dan M2, dus $\sigma_1<\sigma_2$. Eenzijdig 95%-CI voor de verhouding van de varianties.
De Excel-data zitten niet in de opgave; we rekenen met de voorbeeldvarianties $s_1^2=0{,}004$ (M1) en $s_2^2=0{,}015$ (M2). Met eigen data: `=VAR.S(bereik)` per machine en dezelfde stappen.

**Stap 1 - pivot.** Onafhankelijke normale steekproeven:
$$F=\frac{s_1^2/\sigma_1^2}{s_2^2/\sigma_2^2}=\frac{s_1^2}{s_2^2}\cdot\frac{\sigma_2^2}{\sigma_1^2}\ \sim\ F(n_1-1;\,n_2-1)=F(9;14)$$
Teller: M1 ($n_1-1=9$ vrijheidsgraden), noemer: M2 ($n_2-1=14$), zoals in de hint.

**Stap 2 - eenzijdige grens.** We willen aantonen dat $\sigma_2^2/\sigma_1^2>1$, dus we zoeken een **ondergrens** voor $\rho=\sigma_2^2/\sigma_1^2$:
$$P\!\left(\frac{s_1^2}{s_2^2}\,\rho\ \ge\ F_{0,05}(9;14)\right)=0{,}95\quad\Longrightarrow\quad \frac{\sigma_2^2}{\sigma_1^2}\ \ge\ \frac{s_2^2}{s_1^2}\,F_{0,05}(9;14)$$

**Stap 3 - getallen.**
$$F_{0,05}(9;14)=\texttt{F.INV}(0{,}05;9;14)=0{,}3305$$
$$L=\frac{0{,}015}{0{,}004}\cdot0{,}3305=3{,}75\cdot0{,}3305=1{,}2395$$
Eenzijdig 95%-CI: $\dfrac{\sigma_2^2}{\sigma_1^2}\in[1{,}2395\ ;\ +\infty[$.
Excel: `=(0,015/0,004)*F.INV(0,05;9;14)` = 1,2395 (ook `=(0,015/0,004)/F.INV.RT(0,05;14;9)`).

**Andere oriëntatie (zelfde conclusie).** Voor $\sigma_1^2/\sigma_2^2$ krijg je een bovengrens:
$$\frac{\sigma_1^2}{\sigma_2^2}\le\frac{s_1^2}{s_2^2}\cdot\frac{1}{F_{0,05}(9;14)}=\frac{s_1^2}{s_2^2}\,F_{0,95}(14;9)=0{,}2667\cdot3{,}0255=0{,}807<1$$
Excel: `=(0,004/0,015)*F.INV(0,95;14;9)`.

**Stap 4 - besluit.** De ondergrens 1,24 ligt boven 1: met 95% betrouwbaarheid is $\sigma_2^2>\sigma_1^2$. Equivalent: de rechtszijdige F-toets $H_0:\sigma_1^2=\sigma_2^2$ vs $H_1:\sigma_2^2>\sigma_1^2$ verwerpt $H_0$ op $\alpha=5\%$. Aandachtspunt: de F-procedure is niet robuust tegen afwijkingen van normaliteit (gegeven: $X$ normaal).

**Examenantwoord:** Met $s_1^2=0{,}004$ ($n_1=10$) en $s_2^2=0{,}015$ ($n_2=15$) geldt $\frac{s_1^2}{s_2^2}\cdot\frac{\sigma_2^2}{\sigma_1^2}\sim F(9;14)$, dus het eenzijdige 95%-CI is $\sigma_2^2/\sigma_1^2\ge(0{,}015/0{,}004)\cdot$`F.INV(0,05;9;14)` $=3{,}75\cdot0{,}3305=1{,}24$. Omdat de ondergrens groter is dan 1, is de variantie van M2 met 95% betrouwbaarheid groter dan die van M1. Het vermoeden dat M1 nauwkeuriger werkt, is gerechtvaardigd.

## Vraag 3

**Opgave [2]**: LSL = 1400 mm, USL = 1460 mm, $\mu=1440$ mm, $\sigma=10$ mm.

**a. Capabiliteit.**
$$C_p=\frac{USL-LSL}{6\sigma}=\frac{1460-1400}{60}=1{,}00$$
$$C_{pk}=\min\left(\frac{1460-1440}{3\cdot10};\ \frac{1440-1400}{3\cdot10}\right)=\min(0{,}67;\ 1{,}33)=0{,}67$$
De bovengrens (USL) is beperkend. $C_p=1$: de spreiding past net in de tolerantie; $C_{pk}=0{,}67<1$: door de slechte centrering is het proces **niet capabel**.

**b. Percentage uitval.**
$$z_U=\frac{1460-1440}{10}=2\Rightarrow P(X>1460)=1-\Phi(2)=2{,}275\%$$
$$z_L=\frac{1400-1440}{10}=-4\Rightarrow P(X<1400)=\Phi(-4)=0{,}003\%$$
Totaal: $2{,}275\%+0{,}003\%=$ **2,28%**.
Excel: `=1-NORM.DIST(1460;1440;10;WAAR)+NORM.DIST(1400;1440;10;WAAR)` = 0,02278.
Ter vergelijking: gecentreerd op 1430 zou de uitval $2(1-\Phi(3))=0{,}27\%$ zijn.

**c. Twee manieren om te verbeteren.**
1. **Centreren**: het gemiddelde naar het midden van de tolerantie (1430 mm) verschuiven; dan $C_{pk}=C_p=1{,}00$ en daalt de uitval van 2,28% naar 0,27%.
2. **Variatie verkleinen** ($\sigma$ omlaag): bv. $\sigma=5$ geeft $C_p=2$. Voor $C_{pk}=1{,}33$ bij gecentreerd proces: $\sigma=30/(3\cdot1{,}33)=7{,}5$ mm.
(Alternatief: in overleg met de klant de toleranties verruimen, als dat functioneel kan.)

**d. 6 sigma-criterium.** Volgens de technische definitie (Six Sigma met 1,5σ-shift op lange termijn: $C_p=2$, $C_{pk}=1{,}5$) mag hoogstens **3,4 ppm = 0,00034%** uitval optreden:
$$1-\Phi(6-1{,}5)=1-\Phi(4{,}5)=3{,}4\cdot10^{-6}$$
Excel: `=1-NORM.S.DIST(4,5;WAAR)`. Een perfect gecentreerd 6σ-proces zonder shift geeft op korte termijn $2(1-\Phi(6))\approx0{,}002$ ppm (2 per miljard).

**Examenantwoord:** $C_p=60/60=1{,}00$ maar $C_{pk}=20/30=0{,}67$ (USL beperkend): het proces is niet capabel, vooral door slechte centrering. De verwachte uitval is $1-\Phi(2)+\Phi(-4)=2{,}275\%+0{,}003\%=2{,}28\%$. Verbeteren kan door te centreren op 1430 mm (uitval 0,27%) en door de spreiding te verkleinen. Het 6 sigma-criterium laat hoogstens 3,4 ppm (0,00034%) uitval toe op lange termijn (met 1,5σ-shift; gecentreerd op korte termijn 0,002 ppm).

## Vraag 4

**Opgave [1,5]**: regelkaarten.

**a. Waarom normaal veronderstellen en werken met gemiddelden / standaardafwijking?**
Op een $\bar{X}$-kaart worden **subgroepgemiddelden** uitgezet. Door de **centrale limietstelling** is het gemiddelde van $n$ onafhankelijke waarnemingen bij benadering normaal verdeeld met $E[\bar{X}]=\mu$ en $\sigma_{\bar{X}}=\sigma/\sqrt{n}$, ook als de individuele waarden niet perfect normaal zijn. Daardoor gelden de grenzen $\mu\pm3\sigma/\sqrt{n}$ met een vals-alarmkans van ongeveer 0,27% per punt, en volstaan gemiddelde en standaardafwijking (of range) om de verdeling te beschrijven.

**b. Welke oorzaken detecteren?**
Een regelkaart detecteert **speciale (toewijsbare, assignable) oorzaken**: plotse of systematische veranderingen die niet tot het normale procesgedrag horen (gereedschapsslijtage, nieuwe grondstofbatch, instelfout, andere operator). Punten buiten de grenzen of niet-random patronen (Western Electric regels) wijzen erop. De **gewone oorzaken** (common causes) vormen de natuurlijke variatie binnen de grenzen; die verminder je enkel door het systeem te veranderen, niet door in te grijpen op individuele punten (tampering).

**c. Wanneer de range als beste schatting?**
Bij **kleine subgroepen** (cursus: $n<10$, vaak $n=4$ of 5): dan is $\hat\sigma=\bar{R}/d_2$ bijna even efficiënt als $\bar{s}/c_4$ en veel eenvoudiger te berekenen (op de werkvloer). Voor grotere subgroepen gebruikt de range slechts 2 van de $n$ waarden en verliest informatie; dan is de standaardafwijking (s-kaart) beter.

**Examenantwoord:** Op de kaart staan subgroepgemiddelden, en volgens de centrale limietstelling zijn die bij benadering normaal verdeeld met standaardafwijking $\sigma/\sqrt{n}$, ook als de individuele waarden dat niet zijn. Een regelkaart detecteert speciale (toewijsbare) oorzaken, en onderscheidt die van de gewone variatie. De range is de beste (en eenvoudigste) schatter voor kleine subgroepen ($n<10$); voor grotere subgroepen gebruik je de standaardafwijking.

## Vraag 5

**Opgave [4]**: drie beslissingsbomen, confusion matrices (rijen = werkelijk Goed/Slecht, kolommen = voorspeld Goed/Slecht). Goed = positief.

**a. Accuracy op training en test.**
$$\text{Accuracy}=\frac{TP+TN}{N}$$

| Model | Train | Train acc | Test | Test acc | Kloof |
|---|---|---|---|---|---|
| A | $(480+485)/1000$ | 96,5% | $(180+190)/600$ | 61,7% | 34,8 pp |
| B | $(380+360)/1000$ | 74,0% | $(190+180)/600$ | 61,7% | 12,3 pp |
| C | $(420+430)/1000$ | 85,0% | $(200+215)/600$ | 69,2% | 15,8 pp |

Extra maten op de testset (Goed = positief):

| Model | Precision | Recall | Specificiteit | $F_1$ |
|---|---|---|---|---|
| A | 0,621 | 0,600 | 0,633 | 0,610 |
| B | 0,613 | 0,633 | 0,600 | 0,623 |
| C | 0,702 | 0,667 | 0,717 | 0,684 |

Diagnose:
- **Model A: hoge variantie (overfit).** Bijna perfect op de training (96,5%) maar sterk slechter op nieuwe data (61,7%): de boom heeft de ruis in de trainingsdata gememoriseerd.
- **Model B: hoge bias (underfit).** Al op de training matig (74,0%) en op de test even zwak als A: het model is te eenvoudig om het patroon te vatten.
- **Model C: optimaal.** Hoogste test-accuracy (69,2%) en alle andere testmaten het best; goede balans tussen bias en variantie. De test-score is bepalend, niet de train-score.

Excel (model C test): `=(200+215)/(200+100+85+215)`.

**b. Hoge bias vastgesteld: wat verander je aan de boom?**
Het model is te eenvoudig, dus maak de boom **complexer**:
- grotere maximale diepte (meer splitsingen);
- kleiner minimum aantal waarnemingen per blad / per split;
- minder (of geen) pruning, lagere complexiteitsstraf;
- meer of betere verklarende variabelen (features) toevoegen.
Daarna controleren op een validatieset (of met k-fold cross-validation) dat de testfout daalt en je niet doorschiet naar overfit.

**Examenantwoord:** Model A heeft hoge variantie: 96,5% op training maar slechts 61,7% op test (overfit). Model B heeft hoge bias: al op training slechts 74,0%, op test 61,7% (underfit). Model C is optimaal met de hoogste test-accuracy (69,2%) bij 85,0% op training. Bij hoge bias maak je de boom complexer: grotere diepte, kleiner minimum aantal stuks per blad of split, minder pruning, meer features.

## Vraag 6

**Opgave [4]**: elco's (nominaal 800 µF), niet-conform als $C<720$ µF; loten van 100; gemiddeld 2 op 40 niet-conform ($\pi=5\%$); gemiddelde capaciteit 820 µF; gemiddeld 175,3 bestellingen per week.

**a. Verdeling en verwachtingswaarde.**

| Variabele | Verdeling | Verwachtingswaarde |
|---|---|---|
| B: aantal bestellingen per week | Poisson | $E[B]=\lambda=175{,}3$ per week |
| T: tijd tussen twee bestellingen | exponentieel | $E[T]=1/\lambda=1/175{,}3=0{,}0057$ week |
| C: capaciteit van een elco | normaal | $E[C]=\mu=820$ µF |
| X: conformiteit van een elco (1 = conform) | Bernoulli | $E[X]=P(\text{conform})=1-2/40=0{,}95$ |
| D: aantal niet-conforme elco's per lot | binomiaal ($n=100$, $\pi=0{,}05$) | $E[D]=n\pi=100\cdot0{,}05=5$ |
| (uniform) | - | geen van de variabelen |

$E[T]$ in uren hangt af van de definitie van een week (A9): 168 h -> $168/175{,}3=0{,}96$ h; 40 werkuren -> $40/175{,}3=0{,}23$ h. Schrijf de aanname op.
(Codeer je X als 1 = niet-conform, dan is $E[X]=0{,}05$; vermeld de codering.)

**b. Wanneer is "iid populatie" onrealistisch?**
- **B (bestellingen per week)**: weken zijn niet identiek verdeeld: seizoenseffecten, trends, feestdagen, promoties; opeenvolgende weken kunnen gecorreleerd zijn. Een constante $\lambda$ is twijfelachtig.
- **T (tussenaankomsttijden)**: de aankomstintensiteit is niet constant over de dag/week (kantooruren, nacht, weekend), dus de tijden zijn niet identiek exponentieel verdeeld.
- **X en D (conformiteit binnen een lot)**: elco's in een lot komen uit dezelfde productiebatch (zelfde grondstof, machine-instelling); een slechte batch geeft veel defecten tegelijk. De stuks zijn dus niet onafhankelijk, en $D$ is dan breder verdeeld dan binomiaal (overdispersie).
- **C**: ook de capaciteit kan per batch verschuiven (drift, ander materiaal), waardoor waarden uit hetzelfde lot gecorreleerd zijn.

**c. Varianties.**
Binomiaal:
$$Var[D]=n\pi(1-\pi)=100\cdot0{,}05\cdot0{,}95=4{,}75$$
Normaal: uit $P(C<720)=0{,}05$ en $\mu=820$:
$$\frac{720-820}{\sigma}=z_{0,05}=-1{,}6449\ \Rightarrow\ \sigma=\frac{100}{1{,}6449}=60{,}80\ \mu\text{F},\qquad Var[C]=60{,}80^2=3696\ \mu\text{F}^2$$
Excel: `=(820-720)/NORM.S.INV(0,95)` = 60,80; `=100*0,05*0,95` = 4,75.
(Ter volledigheid: $Var[B]=175{,}3$, $Var[T]=1/175{,}3^2=3{,}25\cdot10^{-5}$ week², $Var[X]=0{,}95\cdot0{,}05=0{,}0475$.)

**Examenantwoord:** B is Poisson met $E[B]=175{,}3$ per week, T exponentieel met $E[T]=1/175{,}3=0{,}0057$ week (0,96 h bij een week van 168 h), C normaal met $E[C]=820$ µF, X Bernoulli met $E[X]=0{,}95$ en D binomiaal met $E[D]=100\cdot0{,}05=5$. De iid-veronderstelling is onrealistisch voor B en T (seizoen, trends, niet-constante intensiteit over de dag) en voor X, D en C binnen een lot (stuks uit dezelfde productiebatch zijn gecorreleerd). $Var[D]=100\cdot0{,}05\cdot0{,}95=4{,}75$ en uit $P(C<720)=5\%$ volgt $\sigma=100/1{,}6449=60{,}80$, dus $Var[C]=3696$ µF².

## Vraag 7

**Opgave [3]**: fictieve gezamenlijke verdeling van gloeitemperatuur T (°C, horizontaal) en sterkte S (MPa, verticaal), twee scatterplots. Schetsen, beschreven in woorden.

**a. Regressielijn $f(x)=E[S\mid T=x]$.**
Teken een lijn (of vloeiende curve) die bij elke temperatuur $x$ door het **midden** (het gemiddelde) van de verticale strook punten loopt. Ze volgt de trend van de wolk (bv. stijgend als hogere T samengaat met hogere S), met ongeveer evenveel punten erboven als eronder bij elke $x$. Het is niet de lijn door de uiterste punten en ook niet de hoofdas van de ellips: het is de lijn van de **voorwaardelijke gemiddelden** ("seeing").

**b. Causaal diagram $S\to T$, interventie $do(T=730)$: bolletjes (eerste figuur).**
Als S de oorzaak is van T, dan knipt de interventie de pijl $S\to T$ door: T wordt van buitenaf op 730 °C gezet, maar dat heeft **geen invloed op S**. S behoudt zijn **marginale verdeling**:
$$P(S\mid do(T=730))=P(S)$$
Schets: ~10 bolletjes op een **verticale lijn bij T = 730**, verspreid over het **volledige bereik van S** van de hele wolk (rond het totale gemiddelde van S, met de totale spreiding), dus niet geconcentreerd rond de regressielijn bij 730.

**c. Causaal diagram $T\to S$, zelfde interventie: kruisjes (tweede figuur).**
Als T de oorzaak is van S (en er is geen confounder), dan is ingrijpen hetzelfde als observeren:
$$P(S\mid do(T=730))=P(S\mid T=730)$$
Schets: ~10 kruisjes op de verticale lijn bij T = 730, **gegroepeerd rond de waarde van de regressielijn** $E[S\mid T=730]$, met de (kleinere) voorwaardelijke spreiding van de strook rond 730.

**Examenantwoord:** De regressielijn $E[S\mid T=x]$ loopt bij elke temperatuur door het gemiddelde van de punten en volgt zo de trend van de wolk. Bij $S\to T$ verandert het vastzetten van T op 730 °C niets aan S: de bolletjes liggen op een verticale lijn bij 730 maar verspreid over het volledige (marginale) bereik van S. Bij $T\to S$ geldt $P(S\mid do(T=730))=P(S\mid T=730)$: de kruisjes liggen bij 730 dicht rond de waarde van de regressielijn. Het verschil illustreert "seeing" versus "doing": een correlatie zegt niet welke kant de causale pijl uitgaat.
