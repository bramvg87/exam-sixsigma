# Formularium - Lean Six Sigma Black Belt

> Werkdocument, iteratief opgebouwd per les. Wiskundige notatie in LaTeX ($...$), zodat dit netjes naar PDF kan (bv. via Pandoc of Typora).
>
> Status: volledig - Les 1-5 + voorbeeldexamen (formules per vraag) + compleet Excel-formularium.

## Inhoud
1. [Les 1 - Intro & Big Data (20/05)](#les-1)
   - [Inleiding tot Machine Learning (Naert - Lecture 2)](#ml)
2. [Les 2 - Hypothesetoetsen, betrouwbaarheidsintervallen & acceptance sampling (29/05)](#les-2)
   - Toetsrecepten - volledig overzicht (na C)
   - Betrouwbaarheidsinterval voor een fractie: exact, Wilson en normaal (D)
   - Steekproefgrootte met $\alpha$ én $\beta$ (D)
   - OC-curve en ontwerp van een aanvaardingsplan; variabelenplan $(n,k)$ (E)
   - Defecten per lot bij gekende capabiliteit (F)
3. [Les 3 - Regressie & DOE (05/06)](#les-3)
4. [Les 4 - SPC & proces-capabiliteit (12/06)](#les-4)
   - SPC: andere subgroepgrootte, detectiekans en ARL (E)
5. [Les 5 - MSA / Gage R&R & simulatie (19/06)](#les-5)
   - MSA-constanten Average & Range (E)
6. [Root - Voorbeeldexamen: formules per vraag](#root)
7. [Volledig Excel-formularium](#excel)
8. [Examenstrategie: vraagtype -> formule -> tool](#strategie)

---

<a name="les-1"></a>
## Les 1 - Intro & Big Data (20/05)

*Bestanden: `van volsem.pdf` (intro/DMAIC), `naert_big data.pdf` (data & big data). De procesmatige kern + de data-/statistiekbasis hieronder.*

### Procesmodel (transferfunctie)
$$Y = f(X_1, X_2, \dots, X_n)$$
De output $Y$ is een functie van de proces-inputs (de "X-en"). DMAIC trechtert: Define >100 X-en -> Measure $\le 20$ -> Analyze $\le 6$ -> Improve $\le 4$ -> Control $\le 3$ ("vital few").

### Little's Law (flow / doorlooptijd)
<!-- tool: wachtrij -->
$$\text{WIP} = \text{Throughput} \times \text{Doorlooptijd} \qquad\Longleftrightarrow\qquad L = \lambda \cdot W$$

| Symbool | Betekenis |
|---|---|
| $L$ (WIP) | aantal flow units in het systeem (onderhanden werk) |
| $\lambda$ | doorvoersnelheid (throughput rate, eenheden per tijd) |
| $W$ | doorlooptijd (throughput time) |

$$\Rightarrow\quad W = \frac{L}{\lambda} = \frac{\text{WIP}}{\text{Throughput}}$$

- **Cyclustijd** = gemiddelde tijd tussen twee opeenvolgende voltooide eenheden.
- **Bottleneck** = processtap met de langste cyclustijd; bepaalt de doorvoer.

### Flow efficiency
<!-- tool: wachtrij -->
$$\text{Flow efficiency} = \frac{\text{waarde-toevoegende tijd}}{\text{totale doorlooptijd}}$$
Typisch is ~95% van de doorlooptijd niet-waarde-toevoegend.

### Basis beschrijvende statistiek
<!-- tool: verdelingen -->
*(Fundament voor alle volgende lessen; in de intro al via $\mu$ en $\sigma$.)*

| Maat | Steekproef (sample) | Populatie |
|---|---|---|
| Gemiddelde | $\bar{x} = \dfrac{1}{n}\sum_{i=1}^{n} x_i$ | $\mu$ |
| Variantie | $s^2 = \dfrac{1}{n-1}\sum (x_i-\bar{x})^2$ | $\sigma^2 = \dfrac{1}{N}\sum (x_i-\mu)^2$ |
| Standaardafwijking | $s=\sqrt{s^2}$ | $\sigma=\sqrt{\sigma^2}$ |
| Bereik (range) | $R = x_{\max}-x_{\min}$ | |

> Let op de noemer $n-1$ (vrijheidsgraden) bij de steekproef-variantie versus $N$ bij de populatie.

### Meetschalen (Stevens) - "NOIR"

| Schaal | Kenmerk | Toegelaten | Centrummaat | Voorbeeld (productie) |
|---|---|---|---|---|
| **Nominaal** | categorieën, geen ordening | $=,\ \ne$ | modus | type defect (barst/kras/verkleuring), machine-ID, productlijn |
| **Ordinaal** | geordende categorieën, afstand niet betekenisvol | $<,\ >$ | mediaan | kwaliteitsscore (slecht < matig < goed), hardheidsklasse, Likert-schaal |
| **Interval** | gelijke afstanden, willekeurig nulpunt | $+,\ -$ | gemiddelde | temperatuur in °C, kalenderdatum (20°C is niet "2x warmer" dan 10°C) |
| **Ratio** | gelijke afstanden + absoluut nulpunt | $+,-,\times,\div$ | (geom.) gemiddelde | lengte, gewicht, doorlooptijd, aantal defecten, concentratie |

Hoger op de ladder = meer informatie. Het meetniveau bepaalt welke statistiek/test zinvol is (bv. een gemiddelde berekenen heeft geen zin voor nominale data; verhoudingen enkel bij ratio).

### Kansverdelingen: pdf/cdf, sampling & inference
<!-- tool: verdelingen -->
$$f(x)=P(X=x)\ \text{(pmf, enkel discreet)},\qquad F(x)=P(X\le x)=\int_{-\infty}^{x} f(t)\,dt\ \text{(cdf, gecumuleerd)}$$
$f(x)=P(X=x)$ geldt enkel voor discrete verdelingen (kansmassa). Voor continue verdelingen is $f$ een **dichtheid** (pdf, vorm): $P(X=x)=0$ en $P(a\le X\le b)=\int_a^b f(x)\,dx$.
Naast de normale verdeling zijn er nog enkele kernverdelingen. De vraag die alles sorteert: **tel** je iets (discreet, staafjes) of **meet** je iets op een continue schaal (continu, curves)?

| Verdeling | Type | pmf / pdf | Param. | $E[X]$ ; $Var[X]$ | Voorbeeld |
|---|---|---|---|---|---|
| **Bernoulli** | discreet | $P(1)=p,\ P(0)=1-p$ | $p$ | $p$ ; $p(1-p)$ | 1 ja/nee-trial: muntworp; 1 stuk OK/NOK |
| **Binomiaal** | discreet | $\binom{n}{k}p^k(1-p)^{n-k}$ | $n,p$ | $np$ ; $np(1-p)$ | successen in $n$ vaste trials: defecten in batch van 100 |
| **Poisson** | discreet | $\dfrac{\lambda^k e^{-\lambda}}{k!}$ | $\lambda$ | $\lambda$ ; $\lambda$ | zeldzame events per interval: pannes per week, aankomsten per uur |
| **Uniform** | continu | $\dfrac{1}{b-a}$ op $[a,b]$ | $a,b$ | $\dfrac{a+b}{2}$ ; $\dfrac{(b-a)^2}{12}$ | enkel het bereik gekend: random getal 0-1; afrondingsfout |
| **Exponentieel** | continu | $\lambda e^{-\lambda x},\ x\ge0$ | $\lambda$ | $\dfrac{1}{\lambda}$ ; $\dfrac{1}{\lambda^2}$ | wachttijd tot volgend event: tijd tot volgende panne (geheugenloos) |
| **Normaal** | continu | $\dfrac{1}{\sigma\sqrt{2\pi}}e^{-\frac12\left(\frac{x-\mu}{\sigma}\right)^2}$ | $\mu,\sigma$ | $\mu$ ; $\sigma^2$ | som/gemiddelde van veel kleine effecten (CLT): diameter, vulgewicht |

**Hoe kiezen, in één adem:** tel je of meet je? *Tellen:* één trial (Bernoulli), een vaste batch (Binomiaal) of open-einde zeldzame events (Poisson)? *Meten:* vlak over een bereik (Uniform), een wachttijd (Exponentieel) of een gecentreerde bel (Normaal)? Discriminator tellen: Binomiaal heeft een noemer ("12 op 100"), Poisson niet ("12 events deze week"). Poisson-vingerafdruk: gemiddelde $\approx$ variantie ($=\lambda$).

**Verbanden (één familie):** stapel $n$ Bernoulli-trials -> **Binomiaal**; Binomiaal met grote $n$ en kleine $p$ -> **Poisson**; Binomiaal/sommen met grote $n$ -> **Normaal** (CLT). **Poisson** telt de events, **Exponentieel** meet de tussentijden (zelfde $\lambda$, vandaar geheugenloos: modelleert toevallige uitval, niet slijtage - dat is Weibull). *(De Naert-deck vermeldt ook de **beta**-verdeling voor afkeurfracties op $[0,1]$.)*

**Sampling vs. inference** - twee zijden van dezelfde medaille:
- **Sampling**: van verdeling -> data ("doet de natuur").
- **Inference**: van data -> verdeling ("doet de statistiek").

De kansverdeling en de (oneindige) zee aan data zijn wiskundig één en hetzelfde. Inference laat ook **voorspelling** toe (bv. uit $\lambda=2{,}96$ klanten/min volgt: $<2\%$ kans op $>7$ klanten/min).

### Marginale & voorwaardelijke kans, onafhankelijkheid
<!-- tool: onafhankelijkheid -->
Bij twee variabelen heb je de **gezamenlijke (joint) verdeling** $P(X,Y)$. *Associatie* = de joint bevat informatie die je **niet** kan achterhalen door $X$ en $Y$ apart te bestuderen.

| Begrip | Formule | Intuïtie |
|---|---|---|
| **Marginaal** | $P(X)=\int_y P(X,Y)\,dy$ (of $\sum_y$) | "kolommen wegfilteren" |
| **Voorwaardelijk** | $P(Y\mid X)=\dfrac{P(X,Y)}{P(X)}$ | "rijen filteren waar $X\approx x$" |
| **Bayes** | $P(X\mid Y)=\dfrac{P(Y\mid X)\,P(X)}{P(Y)}$ | conditie omkeren |

**Onafhankelijkheid** - drie equivalente uitdrukkingen:
$$P(X,Y)=P(X)\,P(Y)\quad\Longleftrightarrow\quad P(Y\mid X)=P(Y)\quad\Longleftrightarrow\quad P(X\mid Y)=P(X)$$
Kennis van $X$ geeft dan géén extra informatie over $Y$. *Nagaan of onafhankelijk:* vergelijk $P(Y\mid X)$ met $P(Y)$ - verschillen ze, dan zijn de variabelen afhankelijk.

*Voorbeeld (productiekwaliteit - contingentietabel).* 500 producten van 2 lijnen, ingedeeld naar kwaliteit $K$:

| | Accepted | Downgraded | Rejected | Totaal |
|---|:-:|:-:|:-:|:-:|
| **Lijn 1** | 200 | 50 | 20 | 270 |
| **Lijn 2** | 150 | 40 | 40 | 230 |
| **Totaal** | 350 | 90 | 60 | **500** |

- *Joint:* $P(\text{Lijn 2},\text{Acc})=\frac{150}{500}=0{,}30$.
- *Marginaal $P(K)$:* $P(\text{Acc})=\frac{350}{500}=0{,}70$, $P(\text{Down})=0{,}18$, $P(\text{Rej})=0{,}12$.
- *Voorwaardelijk $P(K\mid \text{Lijn 1})$* (rij Lijn 1 delen door 270): $P(\text{Acc}\mid\text{L1})=\frac{200}{270}\approx0{,}74$, $P(\text{Rej}\mid\text{L1})\approx0{,}07$.
- *Onafhankelijk?* $P(\text{Acc}\mid\text{L1})\approx0{,}74 \ne P(\text{Acc})=0{,}70$ -> **niet onafhankelijk**: Lijn 1 levert verhoudingsgewijs meer Accepted (74% vs 70%) en minder Rejected (7% vs 12%); lijn en kwaliteit hangen samen.

### Voorwaardelijke verwachtingswaarde $E[Y\mid X]$
$$E[Y\mid X=x]=\int_y y\cdot P(Y=y\mid X=x)\,dy$$
Dit is een functie van $x$ alleen: de **regressielijn**. Te onthouden: vrijwel alle *supervised machine learning* (van lineaire regressie tot diepe neurale netwerken) is in essentie een schatting van $E[Y\mid X]$.

### Associatie vs. interventie (causaliteit)
<!-- tool: ml -->
Twee fundamenteel verschillende vragen:
$$\underbrace{P(Y\mid X=x)}_{\text{associatie: we *observeren*}}\qquad\ne\qquad \underbrace{P\big(Y\mid \mathrm{do}(X=x)\big)}_{\text{interventie: we *forceren*}}$$
In het algemeen zijn deze **niet** gelijk. Uit observationele data alleen kan je het effect van een interventie *niet* bepalen - je hebt steeds bijkomende **causale aannames** nodig.

- **PINO-principe**: *Prediction Is Not Optimization*; de *cum hoc ergo propter hoc*-drogreden = correlatie verwarren met causaliteit.
- **Confounder**: verborgen factor $Z$ die zowel $X$ als $Y$ drijft (bv. ijsverkoop $\leftrightarrow$ reddingsacties, beide gedreven door warm weer). Wie de confounder negeert, ziet soms het *omgekeerde teken* (**Simpson's paradox**: een medicijn lijkt globaal te schaden maar helpt in elke subgroep).
- **Causaal diagram (DAG)** = Directed Acyclic Graph: knopen = variabelen, pijlen = veronderstelde causale relaties, geen cykels. Een DAG is een *aanname* over het fysisch proces achter de data.
- **Wat doet een interventie?** $\mathrm{do}(X=x)$ forceert $X$ op een waarde en **verwijdert alle inkomende pijlen** naar $X$ (sluit de "achterdeur"). Bv. koper legeren in staal: $\mathrm{do}(\text{Cu})$ sluit het achterdeurpad via schroot.
- Eenzelfde datapatroon kan uit verschillende structuren komen: *direct* ($X\to Y$), *mediator* ($X\to M\to Y$), *omgekeerd* ($Y\to X$) of *confounder* ($X\leftarrow Z\to Y$).

### Randomisatie: RCT & A/B-testen
- Een **Randomized Controlled Trial (RCT)** wijst eenheden willekeurig toe aan interventie-/controlegroep. Randomisatie **breekt alle achterdeurpaden** - ook via confounders die we niet eens gemeten hebben. Daarom geldt in een RCT: $P\big(Y\mid \mathrm{do}(T=t)\big)=P(Y\mid T=t)$.
- **A/B-testen** (bv. webshop toont nieuwe pagina aan 50% van de bezoekers) zijn de digitale RCT: het gemeten verschil is een *causale* schatting. Dit is exact de do-operatie die **DOE** (Les 3) via randomisatie/blocking realiseert.
- Wanneer randomiseren niet kan (ethisch/praktisch/financieel): do-calculus (Pearl), matching/propensity scores, instrumentele variabelen, difference-in-differences, regression discontinuity, SEM.

### Studiewijzer-checklist (Naert - Lecture 1: big data)
*Kanstheorie & statistiek:* sampling vs. inference ✔ · marginale kans ✔ · voorwaardelijke kans ✔ · onafhankelijkheid kennen ✔ · onafhankelijkheid nagaan ✔ · voorwaardelijke verwachtingswaarde ✔
*Causaliteit & interventie:* cum hoc / PINO ✔ · causaal diagram ✔ · eenvoudige causale redenering ✔ · RCT & A/B-testen als gouden standaard ✔

---

<a name="ml"></a>
## Inleiding tot Machine Learning (Naert - Lecture 2, 29/05)
*Tweede big-data lecture (Karsten Naert). Hieronder de uitgewerkte studiewijzer.*

### Terminologie: AI / ML / Supervised / Unsupervised
AI $\supset$ ML $\supset$ DL (deep learning) - "geen magie, gewoon statistiek". Drie leerparadigma's:
- **Supervised:** leert uit gelabelde data $(x_i,y_i)$, modelleert $P(Y\mid X)$ (bv. treksterkte voorspellen uit procesparameters). Twee types: **regressie** (continue $y$) en **classificatie** (categorische $y$).
- **Unsupervised:** enkel inputs $x_i$, modelleert $P(X)$ - ontdekt structuur (clustering, anomaliedetectie).
- **Reinforcement:** een agent leert via beloningen, modelleert $P(Y\mid \mathrm{do}(X))$ (link met interventie uit Lecture 1).

### Loss-functies (rol + MSE/MAE)
Een **loss-/kostfunctie** kwantificeert hoe slecht een model presteert: $\ L_D(\hat{f})=\frac{1}{N}\sum_{i=1}^N \ell\big(y_i,\hat{f}(x_i)\big)$. **Trainen** = de gewichten kiezen die de loss minimaliseren: $\ \hat{\theta}_D=\arg\min_\theta L_D(\hat{f}_\theta)$.
- **MSE** $=\frac{1}{N}\sum (y_i-\hat{f}(x_i))^2$: kwadratisch, straft grote afwijkingen hard, **gevoelig voor uitschieters**, impliceert Gaussische fouten.
- **MAE** $=\frac{1}{N}\sum |y_i-\hat{f}(x_i)|$: lineair, **robuuster** bij uitschieters, impliceert Laplaciaanse fouten.
- **Huber** combineert MSE (kleine fouten) + MAE (grote fouten); voor classificatie: **cross-entropie**. De keuze van de loss is een *modelleringskeuze* (bepaalt wat geoptimaliseerd wordt en de impliciete foutenverdeling).

### Cross-validatie & train-test-split
Een complexer model doet het op de trainingsdata altijd minstens even goed; wat telt is de prestatie op **ongeziene** data. Daarom: train op de **trainset**, evalueer op een **testset** die het model nooit zag. Wie hyperparameters herhaaldelijk op dezelfde testset tunet, overtraint ook dáárop -> gebruik een derde **validatieset**. **k-voudige cross-validatie:** verdeel de data in $k$ delen, train telkens op $k-1$ delen en valideer op het overige, en middel de prestatie. (Onthoud: *parameters* worden door het algoritme gevonden, *hyperparameters* - polynoomgraad, boomdiepte, $\lambda$ - kiest de analist.)

### Bias-variance trade-off
<!-- tool: ml -->
De verwachte fout ontbindt in drie bronnen:
$$E\big[(y-\hat{f}(x))^2\big]=\underbrace{\text{Bias}^2}_{\text{systematisch}}+\underbrace{\text{Var}}_{\text{gevoeligheid}}+\underbrace{\sigma^2}_{\text{ruis}}$$
- **Bias:** de modelklasse kan $f(x)$ niet vatten -> **underfitting** (te simpel).
- **Variance:** het model is te gevoelig voor de toevallige trainingsdata -> **overfitting** (te complex).
- **$\sigma^2$:** inherente ruis - niet te reduceren.
Stijgt de complexiteit, dan daalt bias maar stijgt variance: de totale fout volgt een **U-vorm**, met het optimum ertussenin. (SPC-analogie: hoge bias/lage variance = consistent maar systematisch fout; lage bias/hoge variance = gemiddeld juist maar onbetrouwbaar.)

### Confusion matrix & evaluatie van classificatie
<!-- tool: ml -->
Bij classificatie is er niet één foutgetal maar verschillende soorten fouten. De $2\times2$-matrix telt werkelijk vs. voorspeld:

| | Voorspeld $+$ | Voorspeld $-$ |
|---|:-:|:-:|
| **Werkelijk $+$** | TP | FN |
| **Werkelijk $-$** | FP | TN |

$$\text{Accuracy}=\frac{TP+TN}{TP+TN+FP+FN},\quad \text{Precision}=\frac{TP}{TP+FP},\quad \text{Recall}=\frac{TP}{TP+FN},\quad F_1=\frac{2\,P\,R}{P+R}$$
- *Accuracy* is misleidend bij klasse-onevenwicht. *Precision* = "hoe vaak klopt een positief?"; *Recall* = "hoeveel echte positieven vinden we?"; $F_1$ = harmonisch gemiddelde.
- **Welke metric?** Domeinbeslissing: vals alarm duur (alarmsysteem) -> optimaliseer **precision**; gemist defect duur (veiligheidskritisch) -> optimaliseer **recall**.

**Classificatie: extra maten.** Specificiteit $=TN/(TN+FP)$. Voorbeeldexamen vraag 5 (Goed = positief):

| Model | train acc | test acc | kloof | diagnose |
|---|---|---|---|---|
| A | 96,5% | 61,7% | 34,8 | hoge variantie (overfit) |
| B | 74,0% | 61,7% | 12,3 | hoge bias (underfit) |
| C | 85,0% | 69,2% | 15,8 | optimaal (beste test) |

Beslisregel: **train laag** -> bias; **train hoog en test veel lager** -> variantie; **beste test-score** -> optimaal.

### Neurale netwerken (hidden layers & deep learning)
Eén neuron: $\ y=f(w_1x_1+\dots+w_nx_n+b)$ met gewichten $w_i$, bias $b$ en niet-lineaire **activatie** $f$ (ReLU, sigmoid, tanh). **Deep learning** = meerdere **verborgen (hidden) lagen** stapelen. Leren via **backpropagation** (gradiënt) + gewichten bijstellen richting lagere loss. *Universele approximatiestelling:* met genoeg neuronen kan elke continue functie benaderd worden. Risico: met miljoenen parameters leert het netwerk de ruis mee (overfitting) -> **regularisatie** (dropout, early stopping, weight decay). Schitteren bij grote datasets / sterk niet-lineair / ongestructureerde input (beeld, tekst); minder bij kleine datasets of vereiste interpreteerbaarheid. Architecturen: MLP (tabeldata), CNN (beeld), RNN/LSTM (tijdreeksen), Transformer (taal/LLMs), autoencoder (anomalie).

### Beslissingsbomen (werkingsprincipe)
Splits de invoerruimte successievelijk op **drempelwaarden** - een reeks ja/nee-vragen die de data in steeds homogenere groepen verdelen. Voordelen: makkelijk te visualiseren, minimale data-voorbereiding, gaan om met ontbrekende waarden. Nadelen: gevoelig voor overfitting, meestal geen fysische/causale interpretatie. **Ensembles** lossen dit op: **Random Forest** (veel bomen op willekeurige subsets, dan middelen -> robuust) en **Gradient Boosting** (XGBoost/LightGBM: elke nieuwe boom corrigeert de vorige -> state-of-the-art voor tabeldata).

### Bayesiaanse methoden (voordelen voor gestructureerde data)
Andere filosofie dan de frequentistische: hier zijn **parameters zelf stochastisch**. Kern = de regel van Bayes:
$$P(\theta\mid \text{data})=\frac{\overbrace{P(\text{data}\mid\theta)}^{\text{likelihood}}\cdot\overbrace{P(\theta)}^{\text{prior}}}{P(\text{data})}\ \ \big(=\text{posterior}\big)$$
met **prior** $P(\theta)$ (voorkennis), **likelihood** $P(\text{data}\mid\theta)$ (datamodel) en **posterior** $P(\theta\mid\text{data})$ (bijgewerkte kennis). **Voordelen** (vooral bij gestructureerde, domeinrijke problemen): nuttig bij **weinig observaties**, als er **rijke domeinkennis** is, als de **structuur** bekend is, en wanneer je **onzekerheid** mee wil terugkrijgen (niet enkel een puntschatting). Bv. staalfabriek: a priori weten dat vloeibaar staal tussen 1400-1800 °C ligt. In de praktijk: MCMC (PyMC, Stan).

### Studiewijzer-checklist (Naert - Lecture 2: ML)
*Kernbegrippen:* terminologie AI/ML/supervised/unsupervised ✔ · rol van loss-functies + MSE/MAE ✔ · cross-validatie & train-test-split ✔ · bias-variance trade-off ✔ · confusion matrix & evaluatie ✔
*Methoden:* neurale netwerken (hidden layers, deep learning) ✔ · beslissingsbomen ✔ · Bayesiaanse methoden ✔

---

<a name="les-2"></a>
## Les 2 - Hypothesetoetsen, betrouwbaarheidsintervallen & acceptance sampling (29/05)

*Bestanden: Ottoy `Testing of Hypotheses`, `Confidence Intervals`, `Acceptance Sampling`. Dit is de meest formulerijke les.*

### A. Beslissingskader

| | Werkelijkheid: $H_0$ waar | Werkelijkheid: $H_A$ waar |
|---|---|---|
| **Beslissing: $H_0$** | OK | Type-II fout, risico $\beta$ |
| **Beslissing: $H_A$** | Type-I fout, risico $\alpha$ | OK |

- $H_0$ = status quo (do-nothing); $H_A$ = special action. $H_0$ moet altijd de status quo uitdrukken; $\alpha$ moet klein zijn.
- $\alpha$ = **significantie** = $P[\text{ten onrechte } H_0 \text{ verwerpen}]$ = **producer's risk** (bij acceptance sampling).
- $\beta$ = $P[\text{ten onrechte } H_0 \text{ aanvaarden}]$ = **consumer's risk**.
- **p-waarde** = kans op een waarde die minstens evenveel afwijkt als de waarneming, *gegeven dat $H_0$ waar is*. Beslisregel: **verwerp $H_0$ als p-waarde $< \alpha$** (equivalent met teststatistiek vs. kritieke waarde).
- $\alpha$ vooraf vastleggen (ontwerpparameter), nooit na het zien van de teststatistiek.

### A2. Hypothesetoetsen begrijpen (uitleg)
<!-- tool: hypothese -->
*Gebaseerd op de tutorial "The t-test, explained" (jar-filling voorbeeld); alle getallen herrekend.*

**Het kader: onschuldig tot het tegendeel bewezen.** Een toets is een beslisregel onder onzekerheid, geen bewijs. $H_0$ is het saaie standaardverhaal ("het proces is in orde"), $H_A$ is wat je vermoedt. Je verwerpt $H_0$ enkel als de data te ongewoon zijn om nog in $H_0$ te geloven; anders blijf je bij $H_0$, zoals een rechtbank "niet schuldig" uitspreekt en niet "onschuldig bewezen".

**Twee risico's, vooraf gekozen.** $\alpha$ = kans op vals alarm (een gezond proces stilleggen; meestal 5%). $\beta$ = kans op een gemist probleem (meestal 10 - 20%); **power** $=1-\beta$ = kans om een echt effect te zien. Denk aan een rookmelder: $\alpha$ = hoe vaak hij afgaat zonder brand, $\beta$ = hoe vaak hij zwijgt bij echte brand. Beide verkleinen tegelijk kan enkel met meer informatie (grotere $n$, betere meting).

**De vier keuzes en de steekproefgrootte.** $\alpha$ en $\beta$ (risico's), $\delta$ (kleinste effect dat er zakelijk toe doet: een beslissing, geen statistiek) en $\sigma$ (natuurlijke ruis, uit historische SPC-data, nooit verzonnen). Samen bepalen ze $n$:
$$n\approx\left(\frac{(z_{1-\alpha/2}+z_{1-\beta})\,\sigma}{\delta}\right)^2\qquad\text{bv. } \alpha=5\%,\ \beta=20\%,\ \sigma=\delta=2\ \text{g}:\ n=\left(\frac{(1{,}96+0{,}84)\cdot2}{2}\right)^2=7{,}85\Rightarrow n=8$$

**Welke formule? Dezelfde opbouw voor elke toets.** Elke toetsgrootheid is een **signaal/ruis-verhouding**:
$$\text{toetsgrootheid}=\frac{\text{schatting}-\text{waarde onder }H_0}{\text{standaardfout van de schatting}}$$
De teller is het signaal (hoe ver je waarneming van $H_0$ ligt), de noemer de ruis (hoeveel de schatting puur door toeval van steekproef tot steekproef schommelt). De keuze van de formule hangt af van **wat** je toetst (gemiddelde, spreiding, fractie, verschil) en **wat je weet** ($\sigma$ gekend of niet); het overzicht staat in "Toetsrecepten" hieronder. Voor spreiding is het geen verschil maar een verhouding ($s^2/\sigma_0^2$ of $s_1^2/s_2^2$), vandaar $\chi^2$ en $F$.

**Waarom t en niet z?** Ken je $\sigma$, dan is $\frac{\bar x-\mu_0}{\sigma/\sqrt n}$ standaardnormaal (Z-toets). Meestal ken je $\sigma$ niet en schat je hem met $s$: een tweede bron van onzekerheid. Daarom de **t-verdeling**, met dikkere staarten en $n-1$ vrijheidsgraden (één vrijheidsgraad gaat naar het schatten van $\bar x$). Kleine $n$ = dikke staarten = grotere kritieke waarde; voor grote $n$ wordt $t(n-1)$ gewoon $N(0,1)$. Kernverschil: $s$ is de *schatting* uit de steekproef, $\sigma$ de *ware* (onbekende) procesparameter.

**De kritieke waarde.** De grens van het verwerpingsgebied: de waarde die onder $H_0$ met kans $\alpha$ overschreden wordt (eenzijdig) of met kans $\alpha/2$ in elke staart (tweezijdig). Ligt de toetsgrootheid voorbij de kritieke waarde, dan is ze "te zeldzaam als $H_0$ waar was". Voorbeeld: $t(9)$, tweezijdig, $\alpha=5\%$: $t_{krit}=\pm2{,}262$ (`=T.INV.2T(0,05;9)`), groter dan $z=1{,}96$ door de dikkere staarten.

**De p-waarde.** De kans om, *als $H_0$ waar is*, een toetsgrootheid te krijgen die minstens zo extreem is als de waargenomen (de oppervlakte in de staart(en) voorbij je waarde). Kleine p = je data zijn onder $H_0$ ongewoon. De p-waarde is **niet** de kans dat $H_0$ waar is.

**Drie gelijkwaardige beslisregels** (zelfde $\alpha$, zelfde zijdigheid, dus altijd dezelfde conclusie):
1. p-waarde $<\alpha$;
2. toetsgrootheid voorbij de kritieke waarde;
3. de hypothesewaarde ligt buiten het $(1-\alpha)$-betrouwbaarheidsinterval (eenzijdige toets $\leftrightarrow$ eenzijdige grens).

**Eenzijdig of tweezijdig?** Volgt uit het vermoeden in $H_A$, niet uit de data. "Is verschoven" of "verschilt" = tweezijdig ($\alpha/2$ per staart); "is kleiner geworden", "is nauwkeuriger", "defectfractie is gestegen" = eenzijdig (heel $\alpha$ in één staart).

**Uitgewerkt voorbeeld (tweezijdige t-toets).** Een vullijn moet 250 g per pot leveren; na een klepaanpassing weeg je 10 potten: $\bar x=248{,}2$, $s=2{,}15$. $H_0:\mu=250$, $H_A:\mu\ne250$ (te weinig en te veel zijn allebei slecht).
$$t=\frac{248{,}2-250}{2{,}15/\sqrt{10}}=\frac{-1{,}8}{0{,}680}=-2{,}65,\qquad df=9,\qquad t_{krit}=\pm2{,}262,\qquad p=0{,}027$$
$\lvert t\rvert=2{,}65>2{,}262$ en $p=2{,}7\%<5\%$: verwerp $H_0$. Lezing: het waargenomen verschil is 2,65 keer de typische toevalsschommeling. *Wat je niet bewezen hebt:* dat de lijn "kapot" is, of dat $\mu$ exact 248,2 is; er blijft 2,7% kans dat dit toeval was. Excel: `=T.DIST.2T(2,65;9)`.

**De proportie-variant: $\pi$, $P$ en $E(P)$.** $\pi$ = ware fractie defecten van het proces (onbekend). $P=d/n$ = waargenomen fractie in je steekproef (schommelt). $E(P)=\pi$: gemiddeld over veel steekproeven valt $P$ op $\pi$. Verwacht aantal defecten $n\pi$, standaardfout $\sqrt{\pi(1-\pi)/n}$.
$$H_0:\pi=0{,}02,\ H_A:\pi>0{,}02,\ n=200,\ d=8\ (P=0{,}04):\quad z=\frac{0{,}04-0{,}02}{\sqrt{0{,}02\cdot0{,}98/200}}=2{,}02,\quad p=0{,}022$$
*Let op:* $n\pi_0=4<5$, dus de normale benadering is twijfelachtig. De exacte binomiale p-waarde `=1-BINOM.DIST(7;200;0,02;WAAR)` $=0{,}049$: nog net $<5\%$, dezelfde conclusie maar veel krapper. Gebruik bij weinig verwachte defecten de exacte toets.

**Valkuilen.**
- "Niet significant" betekent "onvoldoende bewijs", niet "$H_0$ is waar". Controleer de power (was $n$ groot genoeg?).
- Statistisch significant is niet hetzelfde als praktisch belangrijk: 0,01 g verschil op 250 g kan significant zijn bij $n=100\,000$ en toch irrelevant.
- $\alpha$ en de zijdigheid kies je **voor** je de data bekijkt.

*In één zin:* een toets vraagt of het verschil tussen wat je ziet en wat $H_0$ beweert groter is dan de toevalsschommeling die je onder $H_0$ zou verwachten.

### B. Toetsprocedure (recept, 7 stappen)
<!-- tool: hypothese -->
1. Formuleer $H_0$ en $H_A$ (één- of tweezijdig).
2. Kies significantie $\alpha$.
3. Kies teststatistiek + steekproevenverdeling.
4. Bepaal steekproefgrootte $n$ (rekening houdend met $\alpha$ en $\beta$).
5. Bepaal referentieverdeling + kritieke waarde (onder $H_0$).
6. Trek steekproef, bereken teststatistiek.
7. Vergelijk met kritieke waarde -> conclusie.

*Voorbeeld (de 7 stappen toegepast - t-toets voor het gemiddelde).* Een proces maakt onderdelen met een kritische maat, normaal verdeeld rond 10. Na vervanging van een machineonderdeel vreest het management dat de stukken kleiner zijn geworden. 20 stukken worden gemeten: $\bar{x}=9{,}928$, $s=0{,}1079$ (uit de 20 ruwe meetwaarden; de slide rondt af naar $s=0{,}109$).
1. $H_0:\mu=10$ (proces nog gecentreerd) vs. $H_A:\mu<10$ (verschoven naar beneden) - **eenzijdig**.
2. $\alpha=2\%$ (conservatief: enkel bijsturen bij sterk bewijs).
3. Teststatistiek $t=\dfrac{\bar{x}-\mu_0}{s/\sqrt{n}}$; steekproevenverdeling $t(n-1)=t(19)$.
4. $n=20$ (gegeven).
5. Kritieke waarde (eenzijdig links): $t_{0{,}02;\,19}=-2{,}20$ via `=T.INV(0,02;19)`.
6. $t=\dfrac{9{,}928-10}{0{,}1079/\sqrt{20}}=-2{,}98$ (de slide vindt met de afgeronde $s=0{,}109$: $t=-2{,}95$).
7. $-2{,}98<-2{,}20$ (en p-waarde $=0{,}38\%<\alpha$, via `=T.DIST(-2,98;19;WAAR)`) -> **verwerp $H_0$**: het proces is significant naar beneden verschoven en moet bijgesteld worden. Conclusie identiek met de slidewaarden. Equivalent: de eenzijdige 98%-bovengrens is $\mu<9{,}981$, dus 10 valt erbuiten.

### C. Kern-teststatistieken
<!-- tool: hypothese -->

**Standaardisatie (Z):** als $X \sim N(\mu,\sigma)$ dan
$$Z = \frac{X-\mu}{\sigma} \sim N(0,1)$$

**t-toets voor het gemiddelde** (df $= n-1$):
$$t = \frac{\bar{x}-\mu_0}{s/\sqrt{n}} \qquad \text{referentie: } t(n-1)$$
Gebruik: testen of het procesgemiddelde verschoven is. ($t(n) \to Z$ als $n \to \infty$.)

**$\chi^2$-toets voor de variantie / standaardafwijking** (df $= n-1$):
$$\chi^2 = \frac{(n-1)\,s^2}{\sigma_0^2} \qquad \text{referentie: } \chi^2(n-1)$$
Gebruik: testen of de procesvariabiliteit veranderd is. ($\chi^2$ is asymmetrisch, enkel positief; $\chi^2(n) \to N(n, 2n)$.)

**F-toets voor twee varianties** (vergelijk de spreiding van 2 normale populaties; df $= n_1-1$ teller, $n_2-1$ noemer):
$$F=\frac{s_1^2}{s_2^2}\qquad\text{en pivot}\qquad \frac{s_1^2}{s_2^2}\cdot\frac{\sigma_2^2}{\sigma_1^2}\sim F(n_1-1,\ n_2-1)$$
Gebruik: testen of de ene machine/proces *nauwkeuriger* werkt dan de andere ("nauwkeuriger" $\Leftrightarrow$ kleinere $\sigma^2$). Excel: kritieke waarde `=F.INV(α;df1;df2)` (linkerstaart) of `=F.INV.RT(α;df1;df2)` (rechterstaart); p-waarde ineens met `=F.TEST(reeks1;reeks2)`.

### Toetsrecepten - volledig overzicht (Ottoy, "Test Recipes - Further Reading")
<!-- tool: nonparam -->

| Toets | $H_0$ | Teststatistiek | Referentie | Voorwaarden | Excel |
|---|---|---|---|---|---|
| t-toets $\mu$ | $\mu=\mu_0$ | $t=\dfrac{\bar{x}-\mu_0}{s/\sqrt{n}}$ | $t(n-1)$ | X normaal (robuust bij grote n) | `T.DIST`, `T.INV` |
| t-toets $\mu_1-\mu_2$ niet gepaard | $\mu_1-\mu_2=d$ | $t=\dfrac{\bar{x}_1-\bar{x}_2-d}{s_p\sqrt{\frac1{n_1}+\frac1{n_2}}}$, $\ s_p^2=\dfrac{(n_1-1)s_1^2+(n_2-1)s_2^2}{n_1+n_2-2}$ | $t(n_1+n_2-2)$ | normaal, **$\sigma_1=\sigma_2$**, onafhankelijke steekproeven | `T.TEST(r1;r2;zijden;2)` |
| idem, ongelijke varianties (Welch) | idem | $t=\dfrac{\bar{x}_1-\bar{x}_2}{\sqrt{s_1^2/n_1+s_2^2/n_2}}$ | $t(\nu)$, $\nu$ via Welch-Satterthwaite | normaal | `T.TEST(r1;r2;zijden;3)` |
| t-toets gepaard | $\mu_v=d$ | $v_i=x_{1i}-x_{2i}$, $\ t=\dfrac{\bar{v}-d}{s_v/\sqrt{n}}$ | $t(n-1)$ | verschillen normaal; **geen** voorwaarde $\sigma_1=\sigma_2$ | `T.TEST(r1;r2;zijden;1)` |
| Z-toets $\pi$ | $\pi=\pi_0$ | $z=\dfrac{p-\pi_0}{\sqrt{\pi_0(1-\pi_0)/n}}$; continuïteitscorrectie: $p\pm\frac{1}{2n}$ (+ links, - rechts) | $N(0,1)$ | $n\pi_0>5$, anders exact (binomiaal) | `NORM.S.DIST` |
| $\chi^2$-toets $\sigma$ | $\sigma=\sigma_0$ | $\chi^2=\dfrac{(n-1)s^2}{\sigma_0^2}$ | $\chi^2(n-1)$ | X normaal, **niet robuust** | `CHISQ.DIST.RT` |
| F-toets $\sigma_1/\sigma_2$ | $\sigma_1=\sigma_2$ | $F=s_1^2/s_2^2$ | $F(n_1-1,n_2-1)$ | normaal, onafh.; **niet robuust** (dus voorzichtig als voortoets voor de pooled t-toets) | `F.DIST.RT`, `F.TEST` |
| $\chi^2$ goodness of fit | X heeft opgegeven verdeling | $\chi^2=\sum_k\dfrac{(n_k-e_k)^2}{e_k}$, $e_k=n\pi_k$ | $\chi^2(r-g-1)$, $g$ = geschatte parameters | $e_k>5$ (anders klassen samenvoegen); altijd rechtszijdig | `CHISQ.DIST.RT` |
| $\chi^2$ contingentietabel | X en Y onafhankelijk | $\chi^2=\sum_{k,l}\dfrac{(n_{kl}-e_{kl})^2}{e_{kl}}$, $e_{kl}=\dfrac{n_{k\cdot}\,n_{\cdot l}}{n}$ | $\chi^2((r-1)(s-1))$ | $e_{kl}>5$; 2x2: Yates $\lvert n-e\rvert-\frac12$ | `CHISQ.TEST(obs;exp)` geeft p |
| Wilcoxon-Mann-Whitney | mediaan$_1$ = mediaan$_2$ | $W$ = som rangen groep 1 (alle waarden samen gerangschikt, ties: gemiddelde rang) | groot: $E[W]=\frac{n_1(N+1)}{2}$, $Var[W]=\frac{n_1n_2(N+1)}{12}$, Z-toets | zelfde vorm van verdeling; niet-parametrisch alternatief voor niet-gepaarde t | - |
| Wilcoxon signed ranks | mediaan verschil = 0 | $T^+$ = som rangen van positieve verschillen (rangschik $\lvert v_i\rvert$; $v_i=0$ weglaten) | $n>15$: $E=\frac{n(n+1)}{4}$, $Var=\frac{n(n+1)(2n+1)}{24}$, Z-toets | alternatief voor gepaarde t | - |
| Runs-toets (Wald-Wolfowitz) | steekproef is random (iid) | $R$ = aantal runs boven/onder de mediaan | $E[R]\approx\frac{n}{2}+1$, $Var[R]\approx\frac{n-1}{4}$, Z-toets | test de basisaanname "random steekproef" | - |

*Rekenvoorbeeld contingentietabel (Les 1, lijn x kwaliteit, 500 stuks):* $\chi^2=11{,}80$, df $=(2-1)(3-1)=2$, p $=0{,}0027$ -> verwerp onafhankelijkheid: lijn en kwaliteit hangen samen (bevestigt de conclusie uit de voorwaardelijke kansen).

### D. Betrouwbaarheidsintervallen (CI)
<!-- tool: hypothese -->

**Centrale limietstelling (CLT):** voor voldoende grote $n$ is het steekproefgemiddelde
$$\bar{X} \sim N\!\left(\mu,\ \frac{\sigma^2}{n}\right), \qquad \text{standaardfout } SE = \frac{\sigma}{\sqrt{n}}\ \approx\ \frac{s}{\sqrt{n}}$$

**CI voor het gemiddelde $\mu$** (tweezijdig, $(1-\alpha)\cdot100\%$):
$$\bar{x} - t_{n-1;\,1-\alpha/2}\,\frac{s}{\sqrt{n}} \ \le\ \mu\ \le\ \bar{x} + t_{n-1;\,1-\alpha/2}\,\frac{s}{\sqrt{n}}$$
Eénzijdig (bovengrens): $\ \mu \in \left]-\infty,\ \bar{x} + t_{n-1;\,1-\alpha}\,\tfrac{s}{\sqrt{n}}\right[$.

**CI voor de variantie $\sigma^2$** (via $\chi^2$):
$$\frac{(n-1)s^2}{\chi^2_{n-1;\,1-\alpha/2}} \ \le\ \sigma^2\ \le\ \frac{(n-1)s^2}{\chi^2_{n-1;\,\alpha/2}}$$
Eénzijdige ondergrens voor $\sigma$: $\ \sigma \ge \sqrt{\dfrac{(n-1)s^2}{\chi^2_{n-1;\,1-\alpha}}}$.

**CI voor de verhouding van twee varianties** $\sigma_2^2/\sigma_1^2$ (via F; examenvraag 2). Eénzijdige $(1-\alpha)$-ondergrens:
$$\frac{\sigma_2^2}{\sigma_1^2}\ \ge\ \frac{s_2^2}{s_1^2}\cdot F_{\alpha}(n_1-1,\ n_2-1),\qquad F_{\alpha}=\texttt{F.INV}(\alpha;n_1{-}1;n_2{-}1)$$
*Beslisregel:* ligt de hele ondergrens $L>1$, dan is $\sigma_2^2>\sigma_1^2$ aangetoond (machine 1 nauwkeuriger). *Voorbeeld:* $n_1{=}10, n_2{=}15 \Rightarrow F_{0{,}05}(9;14)=0{,}3305$; met $s_1^2{=}0{,}004,\ s_2^2{=}0{,}015$: $L=\tfrac{0{,}015}{0{,}004}\cdot0{,}3305=1{,}24>1$ -> vermoeden bevestigd.

*Tweezijdig* (uit de pivot $\frac{s_1^2}{s_2^2}\cdot\rho\sim F(n_1-1,n_2-1)$ met $\rho=\sigma_2^2/\sigma_1^2$): **vermenigvuldig** de verhouding met beide F-kwantielen:
$$\frac{s_2^2}{s_1^2}\,F_{\alpha/2}(n_1{-}1;n_2{-}1)\ \le\ \frac{\sigma_2^2}{\sigma_1^2}\ \le\ \frac{s_2^2}{s_1^2}\,F_{1-\alpha/2}(n_1{-}1;n_2{-}1)$$
Excel: ondergrens `=(s2²/s1²)*F.INV(α/2;n1-1;n2-1)`, bovengrens `=(s2²/s1²)*F.INV(1-α/2;n1-1;n2-1)`. Handig: $F_{\alpha}(a;b)=1/F_{1-\alpha}(b;a)$, dus `F.INV(0,05;9;14)` = `1/F.INV.RT(0,05;14;9)` = 0,3305.
Wil je de verhouding andersom ($\sigma_1^2/\sigma_2^2$), keer dan teller en noemer én de vrijheidsgraden om. Schrijf op het examen altijd expliciet welke variantie in de teller staat.

**CI voor een fractie/proportie $\pi$.** Let op: de cursus (Ottoy, Confidence Intervals) gebruikt het **exacte** (binomiale/hypergeometrische) interval, niet de normale benadering: voor $n=100$, $d=4$ geven de slides **[1,1% ; 9,9%]**, terwijl de normale benadering hier [0,16% ; 7,84%] geeft, duidelijk anders. De normale benadering (grote steekproef):
$$\pi = p \pm Z_{1-\alpha/2}\sqrt{\frac{p(1-p)}{n}}, \qquad Z_{0.975}=1.96$$
is enkel geldig als er minstens ~5 defecten in de steekproef zitten. Zie het exacte interval hieronder.

**Betrouwbaarheidsinterval voor een fractie: exact, Wilson en normaal.**

*Exact (Clopper-Pearson) - de methode van de slides.* Het interval bevat alle $\pi$ waarvoor de waargenomen $d$ niet in de $\alpha/2$-staarten van de binomiale verdeling valt:
$$\pi_L=\texttt{BETA.INV}\big(\tfrac{\alpha}{2};\,d;\,n-d+1\big),\qquad \pi_U=\texttt{BETA.INV}\big(1-\tfrac{\alpha}{2};\,d+1;\,n-d\big)$$
($d=0\Rightarrow\pi_L=0$; $d=n\Rightarrow\pi_U=1$.) Eenzijdig: vervang $\alpha/2$ door $\alpha$.

| $n=100$, 95% | exact (cursus) | Wilson | normaal (Wald) |
|---|---|---|---|
| $d=0$ | [0% ; 3,6%] | [0% ; 3,7%] | onbruikbaar |
| $d=2$ | [0,3% ; 7,0%] | [0,6% ; 7,0%] | [-0,7% ; 4,7%] |
| $d=4$ | **[1,1% ; 9,9%]** | [1,6% ; 9,8%] | [0,2% ; 7,8%] |

*Noot (herrekend):* de slidewaarden zijn het exacte **hypergeometrische** interval voor een lot van $N=10000$. Zuiver binomiaal (Clopper-Pearson, `BETA.INV`) geeft bijna hetzelfde: $d=2$: [0,24% ; 7,04%] (slide 0,3% ; 7,0%), $d=4$: [1,10% ; 9,93%]; 4/100 bij 70%: [2,05% ; 7,15%] (slide [2,1 ; 7,1]). Beide methoden zijn correct; vermeld welke je gebruikt.

**Wilson (score-interval)** - beste benadering als je geen BETA.INV wil gebruiken:
$$\pi=\frac{p+\frac{z^2}{2n}\pm z\sqrt{\frac{p(1-p)}{n}+\frac{z^2}{4n^2}}}{1+\frac{z^2}{n}}$$
**Normaal (Wald)** $p\pm z\sqrt{p(1-p)/n}$: enkel als er minstens ~5 defecten in de steekproef zitten (slide: bij 1% defecten dus $n\ge500$).
*Eindige populatie:* exact via de hypergeometrische verdeling (`HYPGEOM.DIST`); bij $N=10000$, $n=100$ nauwelijks verschil met binomiaal.
*Les uit de slides:* betrouwbaarheid en nauwkeurigheid zijn een trade-off bij vaste $n$ (4/100: 70% -> [2,1;7,1], 95% -> [1,1;9,9], 99% -> [0,7;12,0]); de breedte halveren vraagt $n\times4$.

**Steekproefgrootte** (gewenste halve breedte/marge $E$):
$$\text{gemiddelde: } n=\left(\frac{Z_{1-\alpha/2}\,\sigma}{E}\right)^2 \qquad\qquad \text{proportie: } n=\frac{Z_{1-\alpha/2}^2\,p(1-p)}{E^2}$$
Worst case proportie bij $p=0.5$. Vuistregel: accuraatheid verdubbelen (CI-breedte halveren) = steekproef $\times 4$.

**Steekproefgrootte met $\alpha$ én $\beta$ (onderscheidingsvermogen).** Gemiddelde, eenzijdige toets, verschuiving $\delta$ detecteren met risico's $\alpha$ en $\beta$ (power $1-\beta$):
$$n=\left(\frac{(z_{1-\alpha}+z_{1-\beta})\,\sigma}{\delta}\right)^2\qquad(\text{tweezijdig: }z_{1-\alpha/2})$$
Omgekeerd, $\beta$ bij gegeven $n$ (eenzijdig rechts): $\beta=\Phi\!\left(z_{1-\alpha}-\dfrac{\delta\sqrt{n}}{\sigma}\right)$.
Fractie (normale benadering): $n=\left(\dfrac{z_{1-\alpha}\sqrt{\pi_0(1-\pi_0)}+z_{1-\beta}\sqrt{\pi_1(1-\pi_1)}}{\pi_1-\pi_0}\right)^2$.
Kernboodschap uit de slides: $\alpha$ kies je; $\beta$ volgt uit $\alpha$, $n$ en de werkelijke toestand. $\beta$ verkleinen bij vaste $\alpha$ kan enkel met een grotere steekproef. $\alpha\approx0$ kiezen maakt $\beta$ enorm ("de rechter die nooit een onschuldige veroordeelt, laat iedereen vrij").

**Equivalentie CI <-> toets:** toetsen met een $(1-\alpha)\cdot100\%$-CI heeft significantie $\alpha$. Als $\pi_0 \in$ CI -> aanvaard $H_0$, anders verwerp. Betrouwbaarheidsniveau en significantie bevatten dezelfde info.

### E. Acceptance sampling
<!-- tool: steekproeven -->

**Basis:** lotfractie defecten $\pi = D/N$; schatting uit steekproef $p = d/n$. $P$ is zuiver (unbiased): $E[P]=\pi$.

**Steekproevenverdeling:** correct = hypergeometrisch, goed benaderd door **binomiaal** (tenzij kleine populatie):
$$P[d=i] = \binom{n}{i}\pi^i (1-\pi)^{n-i}, \qquad \sigma_P = \sqrt{\frac{\pi(1-\pi)}{n}}$$
($\sigma_P^2$ daalt lineair met $n$; verdeling wordt normaal door CLT.)

**Plannen voor attributen:**
- Enkelvoudig $(n,c)$: aanvaard als $d \le c$.
- Dubbel $(n_1,c_1,c_2)+(n_2,c_3)$.
- Sequentieel $(Ac, Re)$ (Wald-Wolfowitz) - efficiëntst.
- **OC-curve** = $P[\text{aanvaarden}]$ als functie van $\pi$. Equivalente plannen = zelfde OC-curve.
- $AQL$ = acceptable quality level (goede kwaliteit); $LQL$/$LTPD$ = limiting quality level (slechte kwaliteit). Normen: ISO 2859 (attributen), ISO 3951 (variabelen).

**OC-curve en ontwerp van een aanvaardingsplan (rekenkant).** Enkelvoudig plan $(n,c)$, lotfractie $\pi$:
$$P_{acc}(\pi)=P[d\le c]=\sum_{i=0}^{c}\binom{n}{i}\pi^i(1-\pi)^{n-i}=\texttt{BINOM.DIST}(c;n;\pi;\text{WAAR})$$
$$\alpha=1-P_{acc}(AQL)\ (\text{producer's risk}),\qquad \beta=P_{acc}(LQL)\ (\text{consumer's risk})$$

| Plan | $P_{acc}(2\%)$ | $\alpha$ | $P_{acc}(8\%)=\beta$ |
|---|---|---|---|
| (100, 4) | 0,949 | 5,1% | 9,0% |
| (130, 5) | 0,953 | 4,7% | 4,7% |

(Hypergeometrisch met $N=10000$, $D=200$: $P_{acc}=0{,}950$.) **Ontwerp:** zoek de kleinste $n$ (met bijhorende $c$) zodat $P_{acc}(AQL)\ge1-\alpha$ én $P_{acc}(LQL)\le\beta$. Hogere $c$ bij vaste $n$: kleinere $\alpha$, grotere $\beta$.
**Dubbel plan** $(n_1,c_1,c_2)+(n_2,c_3)$: $P_{acc}=P[d_1\le c_1]+\sum_{d_1=c_1+1}^{c_2-1}P[d_1]\cdot P[d_2\le c_3-d_1]$; gemiddelde steekproefgrootte $ASN=n_1+n_2\cdot P[c_1<d_1<c_2]$. Equivalente plannen = zelfde OC-curve; dubbel/sequentieel is efficiënter (kleinere ASN).
**p-waarde bij acceptance sampling:** $P[d\ge d_{obs}\mid\pi=AQL]$.

**Plan voor variabelen** $(n,k)$ bij ondergrens-spec $\xi$:
$$Q = \frac{\bar{x}-\xi}{s}, \qquad \text{aanvaard als } Q \ge k \quad (k \approx t(1-\alpha,p_0,n))$$
($k$ is de tegenhanger van $c$.) Variabelen-plannen zijn efficiënter dan attribuut-plannen.

*Hoe $k$ berekenen.* Exact: $k=\dfrac{t'_{1-\alpha}\big(n-1;\ z_{1-p_0}\sqrt{n}\big)}{\sqrt{n}}$ (niet-centrale t). Benadering (Natrella):
$$k\approx\frac{z_{1-p_0}+\sqrt{z_{1-p_0}^2-ab}}{a},\quad a=1-\frac{z_{1-\alpha}^2}{2(n-1)},\quad b=z_{1-p_0}^2-\frac{z_{1-\alpha}^2}{n}$$
Voorbeeld $n=20$, $p_0=AQL=2\%$, $\alpha=5\%$: $k=2{,}93$ (exact), 2,91 (benadering). Aanvaard als $Q=(\bar{x}-\xi)/s\ge k$. Variabelenplannen zijn efficiënter dan attribuutplannen (meer informatie per stuk).

**Stratificatie** (variantiereductie). *Idee:* splits de populatie in homogenere deelgroepen (strata) en bemonster elk apart; zo verwijder je de spreiding *tussen* de strata uit de schattingsfout. De gestratificeerde schatter combineert de deel-schattingen met hun gewicht $W_h$ (= aandeel van stratum $h$):
$$P_s = \sum_h W_h P_h \quad(\text{2 strata: } W_A P_A + W_B P_B),\qquad E[P_s]=\pi\ (\text{zuiver})$$
Populatie-decompositie: $\sigma^2 = \underbrace{\sum_h W_h\sigma_h^2}_{\text{within}} + \underbrace{\sum_h W_h(\mu_h-\mu)^2}_{\text{between}}$, met $\mu=\sum_h W_h\mu_h$.
- **Proportionele** allocatie ($n_h=nW_h$): $\ \sigma^2[P_s]=\dfrac{1}{n}\sum_h W_h\sigma_h^2$ (enkel de *within*-term blijft over). Vergelijk met SRS: $\ \sigma^2[P]=\dfrac{\pi(1-\pi)}{n}=\dfrac{\sigma^2}{n}$ (within + between). De winst = de weggevallen *between*-variantie.
- **Optimale (Neyman)** allocatie: $\ n_A=n\cdot\dfrac{W_A\sigma_A}{W_A\sigma_A+W_B\sigma_B}$ - geef het stratum met de grootste spreiding méér steekproef. Proportioneel is enkel optimaal als $\sigma_A=\sigma_B$.

*Voorbeeld.* Lot van $N=10000$ tegels uit 2 batches: A ($N_A=6000$, $W_A=0{,}6$, defectgraad $\pi_A=3\%$) en B ($N_B=4000$, $W_B=0{,}4$, $\pi_B=0{,}5\%$). We trekken $n=100$.
- Lotfractie: $\pi=W_A\pi_A+W_B\pi_B=0{,}6\cdot0{,}03+0{,}4\cdot0{,}005=2\%$.
- Within-varianties: $\sigma_A^2=\pi_A(1-\pi_A)=0{,}0291$, $\sigma_B^2=0{,}004975$.
- **Proportioneel** ($n_A=60$, $n_B=40$): $\ \sigma^2[P_s]=\dfrac{0{,}6\cdot0{,}0291+0{,}4\cdot0{,}004975}{100}=0{,}000195$.
- **SRS** (geen stratificatie): $\ \sigma^2[P]=\dfrac{0{,}02\cdot0{,}98}{100}=0{,}000196$.
- *Conclusie:* hier is de winst minuscuul ($0{,}000195$ vs $0{,}000196$) want de *between*-variantie is klein. Voor fractie-defecten loont stratificatie dus zelden de extra organisatie. Bij **variabelen/gemiddelden** met goed gescheiden strata kan de winst wél groot zijn: bv. 2 gelijke strata met $\mu_A=10,\ \mu_B=15$ en gemeenschappelijke $\sigma^2=4$ -> $\sigma^2[\bar{x}]$ daalt van $\frac{4+(5)^2/4}{100}=0{,}1025$ (SRS) naar $\frac{4}{100}=0{,}04$ (gestratificeerd).
- **Optimaal (Neyman):** met $\sigma_A=\sqrt{0{,}0291}=0{,}171 > \sigma_B=0{,}071$ wordt $n_A=100\cdot\dfrac{0{,}6\cdot0{,}171}{0{,}6\cdot0{,}171+0{,}4\cdot0{,}071}\approx 78$ (i.p.v. 60) - méér steekproef naar het meer variabele stratum A.

**Steekproefmethoden & vertekening (bias)** - conceptueel, examenvraag 1.
- *Methoden:* **SRS** (enkelvoudig random: elk element gelijke kans) · **systematisch** (elke $k$-de) · **gestratificeerd** (random binnen homogene strata - zie boven) · **cluster** (kies hele groepen/clusters en meet iedereen daarin).
- *Vertekening:* **selectiebias** (de steekproef is niet representatief door het *selectie*proces) en **non-response bias** (gekozen eenheden antwoorden niet en verschillen systematisch van wie wél antwoordt). Belangrijk: non-response treedt op *na* de selectie, dus **geen enkele** steekproefmethode (ook cluster sampling niet) is er immuun voor.

### F. Normaalverdeling (basis; volledige capability-behandeling in Les 4)
<!-- tool: capabiliteit -->
$$\varphi(x) = \frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}, \qquad \Phi(x)=\int_{-\infty}^{x}\varphi(t)\,dt$$
Excel: CDF `=NORM.DIST(x;μ;σ;TRUE)`, inverse `=NORM.INV(p;μ;σ)`, random `=NORM.INV(RAND();μ;σ)`. Fractie conform = $\Phi(x_U)-\Phi(x_L)$.

Koppeling spec-breedte <-> capability:
$$X_U-X_L = 6\sigma \Rightarrow 99.73\%\text{ conform } (0.27\%\text{ defect}),\ C_{pk}=1$$
$$X_U-X_L = 8\sigma \Rightarrow 99.9937\%\text{ conform } (63\text{ ppm defect}),\ C_{pk}=1.33$$
$$C_{pk} = \min\!\left(\frac{X_U-\mu}{3\sigma},\ \frac{\mu-X_L}{3\sigma}\right)$$
Lotdefecten bij gekend $C_{pk}$: $\ E[i] = N\cdot\pi$ (bv. $C_{pk}=1 \Rightarrow \pi=0.27\% \Rightarrow$ in $N=10000$: $E[i]=27$).

**Defecten per lot bij gekende capabiliteit.** Defecten onafhankelijk -> aantal defecten $i$ in een lot van $N$ is binomiaal: $P(i)=\binom{N}{i}\pi^i(1-\pi)^{N-i}$. $C_{pk}=1$ (gecentreerd): $\pi=0{,}27\%$, $N=10000$ -> $E[i]=27$, praktisch tussen ~12 en ~44. $C_{pk}=1{,}33$: $\pi=0{,}0063\%$ -> $E[i]=0{,}6$, nooit meer dan ~3. Een lot met 100 defecten bij $C_{pk}=1$ is zo onwaarschijnlijk dat het proces veranderd moet zijn.

**DPMO, sigma-niveau & de 1,5σ-drift (Motorola).** Een proces op "$k$ sigma" betekent dat de dichtstbijzijnde speclimiet op $k$ standaardafwijkingen van het gemiddelde ligt. De defectkans lees je af uit de standaardnormale verdeling via de Z-waarde:
$$\text{DPMO} = P(\text{defect})\times 10^6 = \big(1-\Phi(Z_{\text{eff}})\big)\times 10^6$$

- **Korte termijn (gecentreerd, geen drift):** $Z_{\text{eff}}=k$. Een perfect gecentreerd 6σ-proces geeft dan $P(Z>6)\approx 0{,}002$ DPMO ($\approx$ 2 defecten per miljard).
- **Lange termijn - de 1,5σ-drift:** Motorola stelde empirisch vast dat een procesgemiddelde over de lange termijn met $\pm1{,}5\sigma$ verschuift (slijtage, temperatuur, operator, materiaal, kalibratie). Reken daarom met $1{,}5\sigma$ minder marge naar de dichtstbijzijnde limiet - de shift gaat naar één kant, dus **eenzijdig**:
$$Z_{\text{eff}}=k-1{,}5 \qquad\Rightarrow\qquad \text{DPMO}=\big(1-\Phi(k-1{,}5)\big)\times 10^6$$
Zo wordt een 6σ-proces in de praktijk een $4{,}5\sigma$-marge: $P(Z>4{,}5)=3{,}4\times10^{-6}\Rightarrow \boxed{6\sigma = 3{,}4\text{ DPMO}}$.

| Sigma-niveau $k$ (KT) | $Z_{\text{eff}}=k-1{,}5$ | DPMO (met 1,5σ-drift) | % Yield |
|:-:|:-:|:-:|:-:|
| 1 | $-0{,}5$ | 691.462 | 30,85% |
| 2 | $0{,}5$ | 308.538 | 69,15% |
| 3 | $1{,}5$ | 66.807 | 93,32% |
| 4 | $2{,}5$ | 6.210 | 99,38% |
| 5 | $3{,}5$ | 233 | 99,977% |
| 6 | $4{,}5$ | 3,4 | 99,99966% |

Excel: DPMO uit sigma-niveau `=(1-NORM.S.DIST(k-1,5;WAAR))*1000000`; omgekeerd het (KT-)sigma-niveau uit DPMO `=NORM.S.INV(1-DPMO/1000000)+1,5`. *(De capability-context, $C_p/C_{pk}/P_p/P_{pk}$, staat volledig in Les 4.)*

### G. Relevante Excel-functies
*(Nederlandse Excel gebruikt puntkomma's als scheidingsteken; `WAAR`/`ONWAAR` = TRUE/FALSE.)*

| Doel | Excel-functie |
|---|---|
| Gemiddelde / std / variantie (steekproef) | `=AVERAGE(...)`, `=STDEV.S(...)`, `=VAR.S(...)` |
| Normale CDF / inverse | `=NORM.DIST(x;μ;σ;WAAR)`, `=NORM.INV(p;μ;σ)` |
| Standaardnormaal $Z$ / inverse | `=NORM.S.DIST(z;WAAR)`, `=NORM.S.INV(p)` -> $Z_{0{,}975}$ = `=NORM.S.INV(0,975)` = 1,96 |
| t kritieke waarde | eenzijdig `=T.INV(α;df)`, tweezijdig `=T.INV.2T(α;df)` |
| t p-waarde | links `=T.DIST(t;df;WAAR)`, rechts `=T.DIST.RT(t;df)`, tweezijdig `=T.DIST.2T(ABS(t);df)` |
| t-toets ineens (2 reeksen) | `=T.TEST(bereik1;bereik2;zijden;type)` |
| $\chi^2$ kritieke waarde / p-waarde | `=CHISQ.INV.RT(α;df)` ; `=CHISQ.DIST.RT(χ²;df)` |
| Binomiale kans (acceptance sampling) | `=BINOM.DIST(d;n;π;cumulatief)` |
| Hypergeometrische kans | `=HYPGEOM.DIST(d;n;D;N;cumulatief)` |
| Halve breedte CI gemiddelde | `=CONFIDENCE.T(α;s;n)` (of `=CONFIDENCE.NORM(α;σ;n)` bij gekende $\sigma$) |

---

<a name="les-3"></a>
## Les 3 - Regressie & DOE (05/06)

*Bestanden: De Vuyst `BB_Regression`, `BB_DOE`. Twee blokken: (1) regressie, (2) ANOVA & Design of Experiments.*

### A. Enkelvoudige lineaire regressie
<!-- tool: regressie -->

**Model:** $\ Y = \beta_0 + \beta_1 x + \varepsilon,\quad \varepsilon \sim N(0,\sigma^2)$
- $\mu_{Y|x} = E[Y|x] = \beta_0 + \beta_1 x$, en $\text{Var}[Y|x]=\sigma^2$ (gelijke spreiding voor alle $x$ = **homoscedasticiteit**).

**Kleinste kwadraten (normaalvergelijkingen):** minimaliseer $L=\sum_{i}(Y_i-\beta_0-\beta_1 x_i)^2$:
$$\hat{\beta}_1 = \frac{S_{xY}}{S_{xx}}, \qquad \hat{\beta}_0 = \bar{Y} - \hat{\beta}_1\bar{x}$$
met $\ S_{xx}=\sum_i(x_i-\bar{x})^2,\quad S_{xY}=\sum_i(x_i-\bar{x})(Y_i-\bar{Y}),\quad S_{YY}=\sum_i(Y_i-\bar{Y})^2$.
Gefitte lijn (predictie): $\ \hat{Y}(x)=\hat{\beta}_0+\hat{\beta}_1 x$.

**ANOVA-ontbinding:**
$$SS_T = \sum(Y_i-\bar{Y})^2,\quad SS_E = \sum(Y_i-\hat{Y}_i)^2,\quad SS_R = \sum(\hat{Y}_i-\bar{Y})^2$$
$$\boxed{SS_T = SS_R + SS_E}\qquad \text{df: } (n-1)=(1)+(n-2)\ \text{[enkelvoudig]}$$
- **Determinatiecoëfficiënt:** $\ R^2 = \dfrac{SS_R}{SS_T} = 1-\dfrac{SS_E}{SS_T}$ (= fractie verklaarde variabiliteit).
- $\hat{\sigma}^2 = MSE = \dfrac{SS_E}{n-2}$ (zuivere schatter van $\sigma^2$); $MSR=\dfrac{SS_R}{1}$.
- **Correlatie (Pearson):** $\ r=\dfrac{S_{xY}}{\sqrt{S_{xx}S_{YY}}}$, en voor enkelvoudige regressie $\ R^2=r^2$. (Let op: correlatie $\ne$ causaliteit; pas op voor confounding.)

### B. Inferentie in (enkelvoudige) regressie
<!-- tool: regressie -->
Verdelingen: $\ \hat{\beta}_1 \sim N\!\left(\beta_1,\ \tfrac{\sigma^2}{S_{xx}}\right),\quad \hat{\beta}_0 \sim N\!\left(\beta_0,\ \sigma^2\big(\tfrac{1}{n}+\tfrac{\bar{x}^2}{S_{xx}}\big)\right)$.

**t-toets helling / intercept** (df $=n-2$):
$$t=\frac{\hat{\beta}_1-\beta_{1,0}}{\sqrt{MSE/S_{xx}}}, \qquad t=\frac{\hat{\beta}_0-\beta_{0,0}}{\sqrt{MSE\left(\frac{1}{n}+\frac{\bar{x}^2}{S_{xx}}\right)}}$$

**F-toets significantie regressie** ($H_0:\beta_1=0$, "regressie nutteloos"):
$$F=\frac{MSR}{MSE}\sim F_{1,\,n-2}\quad(\text{algemeen } F_{k,\,n-k-1})$$
De t-toets op $\beta_1$ en deze F-toets zijn equivalent.

**CI voor helling/intercept:** $\ \hat{\beta}_1 \pm t_{1-\alpha/2,\,n-2}\sqrt{\tfrac{MSE}{S_{xx}}}$ ; $\ \hat{\beta}_0 \pm t_{1-\alpha/2,\,n-2}\sqrt{MSE\big(\tfrac{1}{n}+\tfrac{\bar{x}^2}{S_{xx}}\big)}$.

**CI voor de gemiddelde respons** in $x_0$ ($\hat{Y}_0=\hat{\beta}_0+\hat{\beta}_1 x_0$):
$$\hat{Y}_0 \pm t_{1-\alpha/2,\,n-2}\cdot se(\hat{Y}_0),\qquad se(\hat{Y}_0)=\sqrt{MSE\left(\frac{1}{n}+\frac{(\bar{x}-x_0)^2}{S_{xx}}\right)}$$

**Predictie-interval (PI)** voor een nieuwe waarneming in $x_0$ (let op de extra $+1$, dus breder dan de CI):
$$\hat{Y}_0 \pm t_{1-\alpha/2,\,n-2}\cdot se(e_0),\qquad se(e_0)=\sqrt{MSE\left(1+\frac{1}{n}+\frac{(\bar{x}-x_0)^2}{S_{xx}}\right)}$$

### C. Meervoudige lineaire regressie
<!-- tool: regressie -->
$$Y_i = \beta_0 + \beta_1 x_{1i} + \beta_2 x_{2i} + \dots + \beta_k x_{ki} + \varepsilon_i \qquad (k+2 \text{ vrije parameters: } k{+}1 \text{ coëff.} + \sigma)$$
- $R^2=\dfrac{SS_R}{SS_T}$ stijgt altijd bij toevoegen van een variabele -> gebruik **aangepaste $R^2$** om modellen te vergelijken:
$$R^2_{adj}=1-(1-R^2)\,\frac{n-1}{n-k-1}\qquad(k=\text{aantal x-variabelen})$$
> De slide schrijft hier $n-k-2$, maar geverifieerd tegen de Excel-output (15 obs, $k=2 \Rightarrow R^2_{adj}=0{,}9599$) is de noemer $n-k-1$. Gebruik $n-k-1$.
- $\hat{\sigma}=\sqrt{MSE}=\sqrt{\dfrac{SS_E}{n-k-1}}$ (standaardfout van de voorspelling); F-toets model: $F=\dfrac{MSR}{MSE}\sim F_{k,\,n-k-1}$.

### D. Model-adequaatheid
<!-- tool: regressie -->
Residuen $e_i=Y_i-\hat{Y}_i$ als proxy voor de fouten $\varepsilon_i$. Visueel checken: constante variantie? normaal verdeeld? Plots: residuen vs. gefitte/x-waarden (geen patroon), normal-probability-plot (op diagonaal), scale-location (meeste binnen $-2..2$). Remedies: andere/extra x-variabelen, responstransformatie ($\sqrt{y}, \ln y, 1/y$). Outliers aan de rand van het x-bereik = **influential observations** (beïnvloeden de helling sterk).

### E. One-way ANOVA (één factor $A$, $a$ levels, $n$ replicaten)
<!-- tool: anova -->
- **Means-model:** $Y_{ij}=\mu_i+\varepsilon_{ij}$ ; **effects-model:** $Y_{ij}=\mu+\tau_i+\varepsilon_{ij}$ met $\sum_{i}\tau_i=0$, $\varepsilon_{ij}\sim N(0,\sigma^2)$.
- Groepsgemiddelde $\bar{Y}_{i\cdot}=\frac{1}{n}\sum_j Y_{ij}$ ; grootgemiddelde $\bar{Y}_{\cdot\cdot}=\frac{1}{an}\sum_i\sum_j Y_{ij}$.

| Bron | SS | df | MS |
|---|---|---|---|
| Treatment (between) | $SS_{Tr}=n\sum_i(\bar{Y}_{i\cdot}-\bar{Y}_{\cdot\cdot})^2$ | $a-1$ | $MS_{Tr}=\frac{SS_{Tr}}{a-1}$ |
| Error (within) | $SS_E=\sum_i\sum_j(Y_{ij}-\bar{Y}_{i\cdot})^2$ | $a(n-1)$ | $MS_E=\frac{SS_E}{a(n-1)}$ |
| Totaal | $SS_T=\sum_i\sum_j(Y_{ij}-\bar{Y}_{\cdot\cdot})^2$ | $an-1$ | |

$$SS_T = SS_{Tr}+SS_E,\qquad F=\frac{MS_{Tr}}{MS_E}\sim F_{a-1,\,a(n-1)}$$
Verwerp $H_0$ ($\mu_1=\dots=\mu_a$) als $F>F_{1-\alpha,\,a-1,\,a(n-1)}$. Rekenvorm: $SS_T=\sum y_{ij}^2-\frac{y_{\cdot\cdot}^2}{N}$, $SS_{Tr}=\sum_i\frac{y_{i\cdot}^2}{n}-\frac{y_{\cdot\cdot}^2}{N}$ (met $N=an$). Welke gemiddelden verschillen? -> post-hoc, bv. **Fisher's LSD**.

> **Wat betekent ANOVA eigenlijk?** Ondanks de naam "analyse van variantie" toetst ANOVA of de groeps*gemiddelden* verschillen - maar het doet dat door *varianties* te vergelijken. Kernidee: splits de totale spreiding van de data in twee delen:
> - **tussen de groepen** ($SS_{Tr}$): hoe ver liggen de groepsgemiddelden $\bar{Y}_{i\cdot}$ uit elkaar (het mogelijke effect van de factor);
> - **binnen de groepen** ($SS_E$): hoeveel spreiding zit er rond elk groepsgemiddelde (de zuivere toevalsruis).
>
> De F-ratio vergelijkt beide: $F=\dfrac{MS_{Tr}}{MS_E}=\dfrac{\text{spreiding tussen groepen}}{\text{spreiding binnen groepen}}$.
> - Als de factor géén effect heeft ($H_0$), schatten teller en noemer allebei dezelfde $\sigma^2$ -> $F\approx 1$.
> - Als de factor wél een effect heeft, wordt $MS_{Tr}$ opgeblazen door de echte verschillen tussen de gemiddelden -> $F\gg 1$.
>
> De toets vraagt dus: *"is de spreiding tússen de groepen groter dan wat je door puur toeval zou verwachten?"* ANOVA veralgemeent zo de tweesteekproeven-t-toets naar méér dan twee groepen, en is wiskundig een speciaal geval van regressie (met dummy-variabelen voor de factorniveaus) - vandaar dat exact dezelfde SS-ontbinding $SS_T=SS_{Tr}+SS_E$ geldt als bij regressie ($SS_T=SS_R+SS_E$).

**Waarom niet gewoon t-toetsen per paar?** Met $a=3$ groepen zijn er 3 paren; elke t-toets op 5% heeft 5% kans op vals alarm, dus de kans op minstens één vals alarm wordt $1-0{,}95^3=14{,}3\%$. ANOVA toetst alle gemiddelden in één keer op niveau $\alpha$. Pas na een significante F zoek je met een post-hoc toets (LSD, Tukey, Bonferroni $\alpha/m$) welke paren verschillen.

**Vrijheidsgraden lezen.** $a-1$ voor de factor: $a$ groepsgemiddelden, waarvan er één "vastligt" door het grootgemiddelde. $N-a$ voor de fout: $N$ waarnemingen min de $a$ geschatte groepsgemiddelden. $MS=SS/df$ maakt van een som een gemiddelde kwadratische afwijking, dus een variantieschatting; daardoor zijn teller en noemer van F vergelijkbaar.

**Uitgewerkt voorbeeld stap voor stap: van metingen naar ANOVA-tabel.**

**De vraag.** Drie leveranciers leveren dezelfde as. Van elke leverancier meet je de diameter (mm) van 4 willekeurige stuks. Leveren ze gemiddeld dezelfde diameter? $H_0:\mu_1=\mu_2=\mu_3$, $\alpha=5\%$.

**Stap 0 - de metingen.** Elke kolom is een groep (leverancier), elke cel één gemeten stuk. $a=3$ groepen, $n=4$ per groep, $N=12$ metingen.

| | Leverancier 1 | Leverancier 2 | Leverancier 3 |
|---|---|---|---|
| stuk 1 | 12,1 | 13,0 | 12,2 |
| stuk 2 | 11,8 | 12,7 | 12,6 |
| stuk 3 | 12,5 | 13,4 | 12,4 |
| stuk 4 | 12,0 | 13,1 | 12,0 |
| **groepsgemiddelde $\bar y_i$** | **12,10** | **13,05** | **12,30** |

**Stap 1 - gemiddelden.** Groepsgemiddelde = gemiddelde van een kolom, bv. $\bar y_1=(12{,}1+11{,}8+12{,}5+12{,}0)/4=48{,}4/4=12{,}10$. Grootgemiddelde = gemiddelde van alle 12 metingen: $\bar y=149{,}8/12=12{,}483$.

**Stap 2 - $SS_B$ (tussen groepen): hoe ver liggen de groepsgemiddelden van het grootgemiddelde?** Per groep: afwijking van het groepsgemiddelde, in het kwadraat, maal het aantal metingen in die groep (want elk van de 4 stuks "draagt" dat verschil).

| groep | $\bar y_i-\bar y$ | $(\bar y_i-\bar y)^2$ | $\times n=4$ |
|---|---|---|---|
| 1 | $12{,}10-12{,}483=-0{,}383$ | 0,1469 | 0,588 |
| 2 | $13{,}05-12{,}483=+0{,}567$ | 0,3211 | 1,284 |
| 3 | $12{,}30-12{,}483=-0{,}183$ | 0,0336 | 0,134 |
| | | **$SS_B$** | **2,007** |

**Stap 3 - $SS_W$ (binnen groepen): hoe ver liggen de stuks van hun eigen groepsgemiddelde?** Per meting: $y-\bar y_i$, in het kwadraat, en alles optellen.

| | Leverancier 1 ($\bar y_1=12{,}10$) | Leverancier 2 ($\bar y_2=13{,}05$) | Leverancier 3 ($\bar y_3=12{,}30$) |
|---|---|---|---|
| afwijkingen $y-\bar y_i$ | 0 ; $-0{,}3$ ; $+0{,}4$ ; $-0{,}1$ | $-0{,}05$ ; $-0{,}35$ ; $+0{,}35$ ; $+0{,}05$ | $-0{,}1$ ; $+0{,}3$ ; $+0{,}1$ ; $-0{,}3$ |
| kwadraten | 0 ; 0,09 ; 0,16 ; 0,01 | 0,0025 ; 0,1225 ; 0,1225 ; 0,0025 | 0,01 ; 0,09 ; 0,01 ; 0,09 |
| som per groep | 0,26 | 0,25 | 0,20 |

$SS_W=0{,}26+0{,}25+0{,}20=$ **0,710**. (Excel: `=DEVSQ(kolom)` per groep en optellen.)

**Stap 4 - controle met $SS_T$.** Alle 12 metingen t.o.v. het grootgemiddelde: $SS_T=\sum(y-12{,}483)^2=2{,}717$ (`=DEVSQ(alle data)`), en inderdaad $2{,}007+0{,}710=2{,}717$.

**Stap 5 - vrijheidsgraden.** Tussen: $a-1=3-1=2$ (3 groepsgemiddelden, één ligt vast door het grootgemiddelde). Binnen: $N-a=12-3=9$ (12 metingen, 3 groepsgemiddelden geschat; per groep $n-1=3$, dus $3\cdot3=9$). Totaal: $N-1=11=2+9$.

**Stap 6 - mean squares (variantieschattingen).** $MS_B=SS_B/df_B=2{,}007/2=1{,}003$. $MS_W=SS_W/df_W=0{,}710/9=0{,}0789$. $MS_W$ is de geschatte ruisvariantie, dus de stuks van eenzelfde leverancier schommelen typisch $\sqrt{0{,}0789}=0{,}28$ mm.

**Stap 7 - F en p.** $F=MS_B/MS_W=1{,}003/0{,}0789=12{,}72$. Als de leveranciers gelijk waren, zou F rond 1 liggen. Kritieke waarde $F_{0{,}95}(2;9)=4{,}26$ (`=F.INV.RT(0,05;2;9)`); p-waarde `=F.DIST.RT(12,72;2;9)` $=0{,}0024$.

**De ANOVA-tabel** vat stap 2 tot 7 samen:

| Bron | SS | df | MS | F | p |
|---|---|---|---|---|---|
| Tussen groepen | 2,007 (stap 2) | 2 | 1,003 | 12,72 | 0,0024 |
| Binnen groepen | 0,710 (stap 3) | 9 | 0,0789 | | |
| Totaal | 2,717 (stap 4) | 11 | | | |

**Besluit.** $F=12{,}72>4{,}26$ (en $p=0{,}0024<0{,}05$): verwerp $H_0$. De leveranciers leveren niet allemaal dezelfde gemiddelde diameter. $R^2=SS_B/SS_T=2{,}007/2{,}717=0{,}74$: 74% van de spreiding in diameter komt door de leverancier. Welke verschilt? LSD $=t_{0{,}975;9}\sqrt{2\cdot0{,}0789/4}=2{,}262\cdot0{,}199=0{,}45$ mm: leverancier 2 wijkt af van 1 (verschil 0,95) en van 3 (0,75); 1 en 3 verschillen niet (0,20).

**Aannames.** Onafhankelijke waarnemingen (randomiseer de volgorde), normale residuen, gelijke varianties per groep (vuistregel: grootste/kleinste $s$ niet meer dan ongeveer 2). Bij gelijke groepsgroottes is ANOVA vrij robuust.

**Tweeweg-ANOVA in één alinea.** Twee factoren A en B tegelijk: $SS_T=SS_A+SS_B+SS_{AB}+SS_E$, elke F $=MS_{bron}/MS_E$. **Interactie** $AB$: het effect van A hangt af van het niveau van B (niet-evenwijdige lijnen in het interactieplot). Lees eerst de interactie; is die significant, interpreteer dan de celgemiddelden en niet de hoofdeffecten apart. **Zonder herhaling** (1 waarneming per cel) zit de interactie in de foutterm en moet je veronderstellen dat er geen interactie is; met herhaling komt $SS_E$ uit de spreiding binnen de cellen (zuivere ruis).

### F. DOE - principes
- Doel: bepalen welke factoren $x$ de respons $y$ het sterkst beïnvloeden, en bij welke instellingen $y$ gewenst / variabiliteit minimaal is.
- **Externe ("nuisance") factoren** beheersen:

| | bekend | onbekend |
|---|---|---|
| **controleerbaar** | Blocking | - |
| **oncontroleerbaar** | - | Randomisatie |

- **Confounding:** als het effect van factor $A$ niet te onderscheiden is van $B$ (100% gecorreleerd) -> ontwerp deugt niet. Volledig-factorieel ontwerp vermijdt confounding en maakt interacties schatbaar.

### G. $2^k$ factorieel ontwerp ($k$ factoren, 2 levels, $n$ replicaten)
<!-- tool: doe -->
- **Codering** van levels naar $-1/+1$ (translatie + herschaling; interactiekolommen = product van factorkolommen).
- **Effect** van factor/interactie $Q$:
$$[Q]=\bar{y}_{Q+}-\bar{y}_{Q-}=(\text{gem. respons bij }+1)-(\text{gem. respons bij }-1)$$
- **Contrasten** (voorbeeld $2^2$, met lottotalen $(1),a,b,ab$):
$$C_A=a+ab-b-(1),\quad C_B=ab+b-a-(1),\quad C_{AB}=ab+(1)-a-b$$
- **Algemeen $2^k$:** $\ \text{Effect}=\dfrac{\text{Contrast}}{n\,2^{k-1}}$ en $\ SS=\dfrac{(\text{Contrast})^2}{n\,2^{k}}$ (voor $2^2$: $SS=\dfrac{C^2}{4n}$).
- **Significantie van een effect:** standaardfout $\ se(\text{effect})=\sqrt{\dfrac{\hat{\sigma}^2}{n\,2^{k-2}}}$; benaderend 95%-CI $\ \text{effect}\pm 2\cdot se(\text{effect})$. Bevat de CI nul -> factor niet significant ($\alpha=0{,}05$).
- **Single replicate / sparsity-of-effects:** bij grote $k$ slechts 1 replicaat; pool hogere-orde interacties in de foutterm (een volledig model is "saturated": geen df over voor inferentie).
- **Fractioneel ontwerp $2^{k-p}$:** halve fractie = $2^{k-1}$ runs, gedefinieerd door een generator/relatie (bv. $I=ABC$); leidt tot aliasing van effecten.

### H. Relevante Excel-functies
*(Nederlandse Excel: puntkomma's; `WAAR`/`ONWAAR` = TRUE/FALSE. De Analysis ToolPak geeft kant-en-klare tabellen.)*

| Doel | Excel-functie |
|---|---|
| Helling / intercept | `=SLOPE(y;x)`, `=INTERCEPT(y;x)` |
| $R^2$ / correlatie | `=RSQ(y;x)`, `=CORREL(x;y)` (of `=PEARSON(x;y)`) |
| Volledige regressie-output (matrixformule) | `=LINEST(y;x;WAAR;WAAR)` -> coëff., SE's, $R^2$, F, df, $SS_R$, $SS_E$ |
| Standaardfout van de schatting ($\sqrt{MSE}$) | `=STEYX(y;x)` |
| Voorspelling $\hat{Y}$ in $x_0$ | `=FORECAST.LINEAR(x0;y;x)` of `=TREND(...)` |
| $S_{xx}$ (kwadratensom afwijkingen) | `=DEVSQ(x)` |
| F-toets kritieke waarde / p-waarde | `=F.INV.RT(α;df1;df2)` ; `=F.DIST.RT(F;df1;df2)` |
| t voor coëfficiënten (kritiek / p) | `=T.INV.2T(α;df)` ; `=T.DIST.2T(ABS(t);df)` |
| Kant-en-klare analyse (ToolPak) | Gegevens > Gegevensanalyse > "Regressie", "ANOVA: één factor", "ANOVA: twee factoren met/zonder replicatie" |

---

<a name="les-4"></a>
## Les 4 - SPC & proces-capabiliteit (12/06)

*Bestanden: deck `Capabiliteit - SPC` (Grymonprez), `Control charts - constants`, SPC-tabellen, oefeningen. Twee blokken: (1) capabiliteit, (2) regelkaarten.*

### A. Normaalverdeling & sigma-niveau (recap)
<!-- tool: capabiliteit -->
$$Z=\frac{X-\mu}{\sigma}\sim N(0,1);\qquad P[\mu\pm1\sigma]\approx68\%,\ P[\mu\pm2\sigma]\approx95\%,\ P[\mu\pm3\sigma]\approx99{,}73\%$$
Standaardfout van het gemiddelde (CLT): $\ \sigma_{\bar{x}}=\dfrac{\sigma}{\sqrt{n}}$ (spreiding van steekproefgemiddelden < spreiding van individuele punten).

**Sigma-capability tabel** (met de empirische $\pm1{,}5\sigma$ lange-termijn shift van Motorola):

| Sigma-niveau | DPMO | % Yield |
|:-:|:-:|:-:|
| 2 | 308.538 | 69,15% |
| 3 | 66.807 | 93,32% |
| 4 | 6.210 | 99,38% |
| 5 | 233 | 99,98% |
| 6 | 3,4 | 99,99966% |

### B. Discrete capabiliteit (telgegevens)
<!-- tool: capabiliteit -->
Met $D$ = aantal defecten, $N$ = aantal eenheden (units), $O$ = opportuniteiten per eenheid:
$$DPU=\frac{D}{N},\quad DPO=\frac{D}{N\cdot O},\quad DPMO=10^6\cdot\frac{D}{N\cdot O},\quad Yield=1-DPO$$
PPM = parts per million; omrekenen van % naar PPM: $\times 10.000$.

### C. Proces-capabiliteit (continu): $C_p$, $C_{pk}$, $P_p$, $P_{pk}$
<!-- tool: capabiliteit -->

$$\boxed{C_p=\frac{USL-LSL}{6\sigma}}\qquad \boxed{C_{pk}=\min\!\left(\frac{USL-\mu}{3\sigma},\ \frac{\mu-LSL}{3\sigma}\right)}$$
- $C_p$ = breedte distributie vs. tolerantie (de *potentiële* capability; houdt geen rekening met ligging). $C_{pk}$ houdt ook rekening met de **ligging** van $\mu$ (de "k" = Japans voor off-center). Steeds $C_{pk}\le C_p$; gelijk enkel als perfect gecentreerd.
- **Korte termijn** $C_p/C_{pk}$ (within-variation, "white noise") vs. **lange termijn** $P_p/P_{pk}$ (overall variation, "black noise" - wat de klant ervaart): zelfde formules maar met $\sigma_{LT}$.
- $\sigma$ schatten uit de regelkaart: $\ \hat{\sigma}=\dfrac{\bar{R}}{d_2}$ (of $\ \hat{\sigma}=\dfrac{\bar{s}}{c_4}$).

| $C_p$ | Oordeel | Uitval (gecentreerd) |
|:-:|---|---|
| $<1$ | niet capabel | $>2700$ ppm |
| $=1$ | net capabel ($USL-LSL=6\sigma$) | 2700 ppm (99,73%) |
| $\ge1{,}33$ | aanvaardbaar ($=8\sigma$) | ~63 ppm (99,9937%) |
| $\ge1{,}67$ | goed ($=10\sigma$) | ~0,57 ppm |
| $=2$ | 6-sigma niveau (ST) | enkele ppb |

**6-sigma technisch:** $C_p=2$, $C_{pk}=1{,}5$ (door de $\pm1{,}5\sigma$ shift) $\Rightarrow 3{,}4$ DPMO.
> Vuistregel: als $C_p$ slecht is, bereken $C_{pk}$ niet. $C_{pk}$ verbeteren is meestal makkelijk (centreren/kalibreren, operator); $C_p$ verbeteren is moeilijk (veel factoren, proces-engineer).

*Uitgewerkt voorbeeld.* Gefreesd stuk, specs $100\pm10$ (dus $LSL=90$, $USL=110$). Regelkaart onder controle: $\bar{\bar{X}}=104$, $\bar{R}=9{,}30$, $n=5$.
- $\hat{\sigma}=\dfrac{\bar{R}}{d_2}=\dfrac{9{,}30}{2{,}326}\approx4$.
- $C_p=\dfrac{110-90}{6\cdot4}=\dfrac{20}{24}=0{,}83$ (niet capabel).
- $C_{pk}=\min\!\left(\dfrac{110-104}{3\cdot4},\dfrac{104-90}{3\cdot4}\right)=\min(0{,}5;\,1{,}17)=0{,}5$.
- Centreren ($\mu=100$) zou $C_{pk}$ optrekken tot $C_p=0{,}83$, maar het proces blijft niet capabel: $3\sigma=12>10$, dus zelfs gecentreerd valt output buiten de specs - de **spreiding** moet omlaag.

*Capabiliteitsoefening "as" (slide 42).* De slide geeft $C_p=1{,}17$, $C_{pk}=0{,}67$ en "uitval 5% of 2,5% eenzijdig"; dat laatste is fout. De juiste uitval is $P(Z<-2)=$ **2,28%** (bovenzijde $z=+5$ verwaarloosbaar). Gecentreerd ($\mu=72{,}1$): $z=\pm3{,}5$ -> 2 x 233 ppm = **465 ppm** (de slide zegt 400 ppm). Strikt genomen is $\hat\sigma=\bar{s}/c_4=0{,}2/0{,}940=0{,}213$ (dan $C_p=1{,}10$, $C_{pk}=0{,}63$); de slide gebruikt $\bar{s}$ rechtstreeks. Op het examen: vermeld welke $\sigma$ je gebruikt.

### D. Stabiliteit: common vs. special causes
- **Common cause** (within, korte termijn): toevallige, voorspelbare variatie - proces is stabiel; verantwoordelijkheid management (proces-engineer).
- **Special cause:** (a) *systematische* oorzaak = geleidelijk verloop (bv. slijtage); (b) *aanwijsbare* oorzaak = abrupte wijziging (nieuwe machine, ander materiaal). Verantwoordelijkheid operator.
- **Stabiel proces** = verdeling van proceskenmerken constant over de tijd ($N(\mu_0,\sigma_0)$ met $\mu_0,\sigma_0$ constant). Stabiel $\ne$ capabel: een stabiel proces voldoet niet noodzakelijk aan de klantspecs.

### E. SPC - regelkaarten
<!-- tool: spc -->
- **Regelgrenzen (UCL/LCL)** = $\pm3\sigma$ van het gemiddelde = *voice of the process*; **tolerantiegrenzen (USL/LSL)** = *voice of the customer*. Niet verwarren - regelgrenzen staan op de controlekaart, specs op het histogram.

**$\bar{X}$-kaart** (bewaakt het gemiddelde $\mu_0$):
$$CL=\bar{\bar{X}},\quad UCL/LCL=\bar{\bar{X}}\pm3\,\sigma_{\bar{x}}=\bar{\bar{X}}\pm3\frac{\sigma}{\sqrt{n}}=\bar{\bar{X}}\pm A_2\bar{R}\ \ (\text{of }\pm A_3\bar{s})$$

**$R$-kaart** (bewaakt de spreiding, kleine $n$): $\ CL=\bar{R},\quad UCL=D_4\bar{R},\quad LCL=D_3\bar{R}$.

**$s$-kaart** (spreiding, aanbevolen voor $n>10$): $\ CL=\bar{s},\quad UCL=B_4\bar{s},\quad LCL=B_3\bar{s}$.

**Controlekaart-constanten** (standaard ASTM-tabel, functie van subgroepgrootte $n$):

| $n$ | $A_2$ | $A_3$ | $d_2$ | $D_3$ | $D_4$ | $B_3$ | $B_4$ | $c_4$ |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 2 | 1,880 | 2,659 | 1,128 | 0 | 3,267 | 0 | 3,267 | 0,7979 |
| 3 | 1,023 | 1,954 | 1,693 | 0 | 2,574 | 0 | 2,568 | 0,8862 |
| 4 | 0,729 | 1,628 | 2,059 | 0 | 2,282 | 0 | 2,266 | 0,9213 |
| 5 | 0,577 | 1,427 | 2,326 | 0 | 2,114 | 0 | 2,089 | 0,9400 |
| 6 | 0,483 | 1,287 | 2,534 | 0 | 2,004 | 0,030 | 1,970 | 0,9515 |
| 7 | 0,419 | 1,182 | 2,704 | 0,076 | 1,924 | 0,118 | 1,882 | 0,9594 |
| 8 | 0,373 | 1,099 | 2,847 | 0,136 | 1,864 | 0,185 | 1,815 | 0,9650 |
| 9 | 0,337 | 1,032 | 2,970 | 0,184 | 1,816 | 0,239 | 1,761 | 0,9693 |
| 10 | 0,308 | 0,975 | 3,078 | 0,223 | 1,777 | 0,284 | 1,716 | 0,9727 |

Verbanden: $A_2=\dfrac{3}{d_2\sqrt{n}}$, $A_3=\dfrac{3}{c_4\sqrt{n}}$. Voor $n>10$ is de $s$-kaart efficiënter; voor kleine $n$ of manueel werk is $R$ eenvoudiger.

**Andere subgroepgrootte, detectiekans en ARL (oefening 4).**
1. Schat $\hat\sigma=\bar{R}/d_2(n_{oud})$ (of $\bar{s}/c_4$).
2. Nieuwe grenzen voor $n'$: $\ \bar{\bar{X}}\pm3\hat\sigma/\sqrt{n'}$ (= $\bar{\bar{X}}\pm A_2(n')\bar{R}'$ met $\bar{R}'=d_2(n')\hat\sigma$); R-kaart: $CL=d_2(n')\hat\sigma$, UCL $=D_4(n')\bar{R}'$, LCL $=D_3(n')\bar{R}'$.
3. Kans dat een verschuiving van $k\sigma$ **niet** gedetecteerd wordt op de eerstvolgende subgroep:
$$\beta=\Phi(3-k\sqrt{n})-\Phi(-3-k\sqrt{n}),\qquad P(\text{detectie})=1-\beta,\qquad ARL_1=\frac{1}{1-\beta}$$

| $n$ | detectiekans 2σ-shift | ARL |
|---|---|---|
| 3 | 67,9% | 1,47 |
| 5 | 93,0% | 1,08 |
| 8 | 99,6% | 1,004 |

Conclusie oefening 4c: kleinere subgroep = bredere grenzen voor $\bar{X}$ = tragere detectie; grotere subgroep detecteert sneller maar kost meer metingen. In-control: $\alpha=0{,}27\%$ per punt, $ARL_0=370$.
*Variabele subgroepgrootte ($\bar{X}$-s):* grenzen per subgroep: $\bar{\bar{X}}\pm A_3(n_i)\bar{s}$, $B_3(n_i)\bar{s}$, $B_4(n_i)\bar{s}$, met $\bar{s}$ gewogen.

**Out-of-control detectie - Western Electric-regels** (1 of meer treedt op = special cause):
1. 1 punt buiten de $3\sigma$-grenzen (zone A);
2. 2 van 3 opeenvolgende punten buiten $2\sigma$ aan dezelfde kant;
3. 4 van 5 opeenvolgende punten buiten $1\sigma$ aan dezelfde kant;
4. 8 opeenvolgende punten aan dezelfde kant van de centerlijn (run/trend).

Twee fouten bij interpretatie: **tampering** (reageren op common cause -> vergroot variatie) en **underreacting** (special cause missen). Belangrijk: *proces onder controle $\ne$ proces voldoet aan klanteisen.*

*SPC-oefening 2 (Excel-bestand).* In het oefenblad staan UCL 16,9 / LCL 15,7: dat zijn **geen** $\bar{X}$-kaartgrenzen. Correct ($n=5$, 20 subgroepen):
- $\bar{\bar{X}}=16{,}266$, $\bar{R}=0{,}480$ -> $\bar{X}$-kaart: UCL $=16{,}543$, LCL $=15{,}989$; R-kaart: UCL $=D_4\bar{R}=1{,}015$, LCL $=0$.
- Alternatief $\bar{X}$-s: $\bar{s}=0{,}1958$ -> UCL/LCL $=16{,}545/15{,}987$; s-kaart UCL $=0{,}409$.
- Geen enkel punt buiten de grenzen -> proces statistisch onder controle.
- Capabiliteit (specs $16{,}2\pm0{,}5$): $\hat\sigma=\bar{R}/d_2=0{,}206$ -> $C_p=0{,}81$, $C_{pk}=0{,}70$ (bovenzijde beperkend), verwachte uitval $\approx2{,}1\%$. Onder controle maar **niet capabel**.

### F. Relevante Excel-functies
*(Nederlandse Excel; `WAAR`/`ONWAAR`.)*

| Doel | Excel-functie |
|---|---|
| % uitval / yield onder spec | `=NORM.DIST(LSL;μ;σ;WAAR)` (linkerstaart); rechterstaart $=1-$`NORM.DIST(USL;μ;σ;WAAR)` |
| Standaardnormaal (Z naar p) | `=NORM.S.DIST(z;WAAR)` |
| Sigma-niveau uit yield (inverse) | `=NORM.S.INV(yield)` (= Z lange termijn); met 1,5σ-shift: `=NORM.S.INV(yield)+1,5` |
| Gemiddelde / std subgroep | `=AVERAGE(...)`, `=STDEV.S(...)` |

> Rekenwijze uitval: standaardiseer de speclimiet naar $Z=\frac{\text{spec}-\mu}{\sigma}$ en lees de staartkans af (let op één- vs. tweezijdig: tel beide staarten op bij een tweezijdige specificatie).

---

<a name="les-5"></a>
## Les 5 - MSA / Gage R&R & simulatie (19/06)

*Bestanden: Ottoy `Measurement System Analysis` + `GRR study`; De Vuyst `Simulation`. Twee losse delen.*

# Deel I - Measurement System Analysis (Ottoy)

### A. Meetsysteem & het SWIPE-foutmodel
Een **meting** = toekenning van een getal (+ eenheid) aan een eigenschap, via vergelijking met een **referentie/standaard** (de ware waarde is onkenbaar; de referentiewaarde is het surrogaat). Het **meetsysteem** = geheel van gauge, methode, operator, software, omgeving. Een meetproces is zelf een proces dat getallen produceert, dus alle SPC-technieken zijn erop toepasbaar.

Een goed meetsysteem heeft: **adequate discriminatie** (Rule of Tens: discriminatie verdeelt tolerantie/procesvariatie in $\ge 10$ delen), **statistische stabiliteit**, en **kleine variabiliteit** t.o.v. tolerantie of procesvariatie.

**SWIPE** = de zes bronnen van meetvariatie: **S**tandard, **W**orkpiece, **I**nstrument, **P**erson (procedure), **E**nvironment.

### B. Terminologie - de meetfout ontleed
| Begrip | Definitie | Verwant met |
|---|---|---|
| **Bias** | $\bar{X}-\text{ref.waarde}$ - systematische fout | accuracy |
| **Stabiliteit** | verandering van **bias over tijd** | bias |
| **Lineariteit** | verandering van **bias over het meetbereik** | bias |
| **Repeatability (EV)** | spreiding, 1 operator + 1 gauge, zelfde stuk (*within*-variatie) | precision |
| **Reproducibility (AV)** | spreiding tussen **operatoren** (zelfde gauge/stuk) | operator bias |
| **Consistency** | verandering van **repeatability over tijd** | repeatability |
| **Uniformity** | verandering van **repeatability over het bereik** | repeatability |

Geheugensteun: *stabiliteit : bias = consistency : repeatability* (over tijd), en *lineariteit : bias = uniformity : repeatability* (over bereik).

### C. Gage R&R & meetsysteem capability/performance
<!-- tool: msa -->
$$\sigma_{GRR}^2=\sigma_{rep}^2+\sigma_{repro}^2 \quad\Longleftrightarrow\quad GRR=\sqrt{EV^2+AV^2}$$
$$\sigma_{cap}^2=\sigma_{lin}^2+\sigma_{GRR}^2 \qquad \sigma_{perf}^2=\sigma_{cap}^2+\sigma_{stab}^2+\sigma_{consist}^2$$
*Capability* = korte-termijn (lineariteit + GRR); *performance* = voegt stabiliteit + consistency toe (lange termijn).

### D. Waargenomen vs. werkelijke procesvariatie + %GRR
<!-- tool: msa -->
De waargenomen variatie bevat de meetfout. Met $o$ = observed, $a$ = actual, $m$ = measurement:
$$\sigma_o^2=\sigma_a^2+\sigma_m^2 \quad\Longleftrightarrow\quad \frac{1}{C_{p,o}^2}=\frac{1}{C_{p,a}^2}+\frac{1}{C_{p,m}^2}$$
$$\%GRR_{\text{proces}}=\frac{6\sigma_m}{6\sigma_o}=\frac{\sigma_m}{\sigma_o}\ \ (\times100\%)\qquad \%GRR_{\text{tol}}=\frac{6\sigma_m}{TOL}\ \ (\times100\%)$$
Koppeling actual <-> observed Cp (tolerantie-gebaseerde %GRR):
$$C_{p,o}=C_{p,a}\sqrt{1-(\%GRR\cdot C_{p,o})^2}\quad\Longleftrightarrow\quad \frac{1}{C_{p,o}^2}=\frac{1}{C_{p,a}^2}+\%GRR^2$$
*Voorbeeld:* werkelijke $C_p=2$. Buy-off-gauge met $\%GRR=10\%$ -> waargenomen $C_p=1{,}96$; productiegauge met $\%GRR=30\%$ -> $C_p=1{,}71$ (nog aanvaardbaar); ongekwalificeerde gauge $\%GRR=60\%$ -> $1/C_{p,o}^2=0{,}25+0{,}36=0{,}61\Rightarrow C_{p,o}=1{,}28$ (onaanvaardbaar meetsysteem). Het verschil komt volledig van het meetsysteem, niet van procesverslechtering. Historisch werd voor de "volle spreiding" $5{,}15\sigma$ (99%) gebruikt; nu $6\sigma$ (99,73%).

### E. Average & range method (de GRR-studie)
<!-- tool: msa -->
$k$ operatoren meten elk $n$ stukken $r$ keer. Afgeleide grootheden:
$$EV=\bar{R}/d_2=\bar{R}\cdot K_1,\quad K_1=1/d_2 \ \text{(subgroepgrootte} = r)$$
$$AV=\sqrt{(\bar{X}_{DIFF}\cdot K_2)^2-\tfrac{EV^2}{nr}},\quad K_2=1/d_2^*\ \text{(1 subgroep van grootte } k)$$
$$PV=\sqrt{(\bar{R}_p\cdot K_3)^2-\tfrac{EV^2}{kr}}\approx \bar{R}_p\cdot K_3,\quad K_3=1/d_2^*\ \text{(1 subgroep van grootte } n)$$
met $\bar{X}_{DIFF}$ = bereik van de operator-gemiddelden, $\bar{R}_p$ = bereik van de stuk-gemiddelden. Dan:
$$GRR=\sqrt{EV^2+AV^2},\qquad TV=\sqrt{GRR^2+PV^2},\qquad \%GRR=\frac{GRR}{TV}\times100\%$$
$$\text{ndc (aantal onderscheidbare categorieën)}=1{,}41\cdot\frac{PV}{GRR}\ \text{(naar beneden afronden; }\ge 5\text{ gewenst)}$$

$d_2$-waarden (voor EV, subgroep = $r$): $\ r{=}2\to1{,}128$; $r{=}3\to1{,}693$; $r{=}4\to2{,}059$; $r{=}5\to2{,}326$. (De $d_2^*$ voor één subgroep wijken licht af; zie de MSA-tabellen.)

**MSA-constanten Average & Range (AIAG).**

| $K_1$ (trials) | 2: 0,8862 | 3: 0,5908 |
|---|---|---|
| $K_2$ (operatoren) | 2: 0,7071 | 3: 0,5231 |

$K_3$ (aantal stukken): 2: 0,7071 · 3: 0,5231 · 4: 0,4467 · 5: 0,4030 · 6: 0,3742 · 7: 0,3534 · 8: 0,3375 · 9: 0,3249 · 10: 0,3146.
$\%EV=100\,EV/TV$, $\%AV=100\,AV/TV$, $\%PV=100\,PV/TV$; tolerantie-basis: $\%GRR_{tol}=100\cdot6\,GRR/TOL$. (Controleer tegen `tabel MSA.pdf`.)

**Aanvaardingscriteria $\%GRR$:** $\le10\%$ = aanvaardbaar · $10$-$30\%$ = mogelijk aanvaardbaar (afh. van belang/kost) · $>30\%$ = niet aanvaardbaar.

### F. Bias, stabiliteit & lineariteit bepalen
<!-- tool: msa -->
- **Bias:** $\text{bias}=\bar{X}-\text{ref.waarde}$; repeatability $\sigma_r=\bar{R}/d_2$. De statistiek $t=\dfrac{\text{bias}}{\sigma_r\cdot d_2^*/(d_2\sqrt{gm})}$ volgt een $t$-verdeling -> CI voor de ware bias; **significant** als $0$ er niet in ligt.
- **Stabiliteit:** meet periodiek een referentiestandaard, plot $\bar{X}/R$- of $\bar{X}/s$-kaart over tijd; stabiel = statistische controle.
- **Lineariteit:** meet $g\ge5$ stukken over het bereik, elk $m\ge10$ keer; bereken $\text{bias}_{i,j}=m_{i,j}-\text{ref}_i$, regresseer bias op ref.waarde, en toets $H_0:\text{helling}=0$. De gauge is lineair als de lijn bias$=0$ binnen de betrouwbaarheidsbanden ligt.

### G. Meetonzekerheid
<!-- tool: msa -->
$$\text{Ref.waarde}=\text{meting}\pm U,\qquad U=k\cdot u_c$$
met $U$ = uitgebreide onzekerheid, $k$ = dekkingsfactor ($k=2$ voor 95% vertrouwen), $u_c$ = gecombineerde standaardonzekerheid $=\sigma_{\text{meetfout}}$. Een meetonzekerheid is dus een betrouwbaarheidsinterval voor de referentiewaarde.
- **Type A** (via statistiek) en **Type B** (via kalibratiecertificaten, specs, gezond verstand).
- **Propagatie** bij $y=f(x)$: $\ u(y)\approx|f'(x)|\cdot u(x)$. Voor $y=x^2$: $u(x^2)\approx 2x\,u(x)$, dus de **relatieve** onzekerheid verdubbelt. (Bv. $x=5\pm0{,}1 \Rightarrow x^2=25\pm1$.)
- **Combineren** (kwadratuur): som/verschil $u_c(x\pm y)=\sqrt{u^2(x)+u^2(y)}$; product/quotiënt $\dfrac{u_c(xy)}{|xy|}=\sqrt{(\tfrac{u(x)}{x})^2+(\tfrac{u(y)}{y})^2}$.

### H. Probable error, GPC & discriminatie
- **Probable Error:** $PE\approx0{,}67\,\sigma_m$ (= 75%-kwantiel min gemiddelde); $\approx50\%$ van de metingen ligt binnen $\mu\pm PE$. Gebruikt om specs PE-verbreed/-versmald te corrigeren voor meetfout.
- **Gauge Performance Curve (GPC):** kans om een stuk met referentiewaarde $X_r$ te aanvaarden, $\beta(X_r)=\Phi(\cdot)-\Phi(\cdot)$. Analoog aan de OC-curve uit Les 2.
- **Inadequate discriminatie** doet een $\bar{X}/R$-kaart vals "out-of-control" lijken; vuistregel (subgroep $=2$): $\le3$ mogelijke bereik-waarden binnen de regelgrenzen = te grove meeteenheid.

### I. ANOVA-methode voor GRR
<!-- tool: msa -->
Twee-weg ANOVA (operator × stuk) ontbindt $SS_{\text{totaal}}$; de **error-MS** $=EV^2$ (repeatability), de factor-MS leveren AV/PV. Voordelen boven average&range: kan **interacties** (operator × stuk) schatten, splitst reproducibility verder op (tussen operatoren/instrumenten/...), en geeft nauwkeuriger schattingen.

---

# Deel II - Simulatie van stochastische systemen (De Vuyst)

### A. Simulatie, systeem & model
Simulatie = "de kunst en wetenschap een proces of systeem na te bootsen om te experimenteren en evalueren." Een **systeem** evolueert in tijd, beïnvloed door input -> meetbare output. Een **model** is een abstractie (wiskundige beschrijving, vaak stochastisch). Kies een model naar zijn doel - de *holy trinity* **systeem - doel - model**. *"All models are wrong, but some are useful"* (Box). Twee manieren om een queue op te lossen: **wachtrijtheorie** (analytisch, exact) of **Monte Carlo / DES** (simulatie, beperkte precisie).

### B. M/M/1/K-wachtrij (analytisch)
<!-- tool: wachtrij -->
$M/M/1/K$: exponentiële tussenaankomsttijden (gem. $1/\lambda$, Poisson-aankomsten), exponentiële bedieningstijd (gem. $1/\mu$), 1 server, FIFO, capaciteit $K$. Met bezettingsgraad $\rho=\lambda/\mu<1$:
$$\pi_j=\Pr[L=j]=\frac{\rho^j(1-\rho)}{1-\rho^{K+1}},\quad j=0,\dots,K$$
$$E[L]=\sum_{j=0}^{K} j\,\pi_j,\qquad E[W]=\frac{E[L]}{\lambda(1-\pi_K)}\ \text{(Little, gecorrigeerd voor verlies)}$$

### C. Het Poisson-proces
<!-- tool: wachtrij -->
Een puntproces met intensiteit $\lambda$ waarbij de tussentijden iid $T\sim\text{Expon}(\lambda)$ zijn.
- **Onafhankelijke increments:** $X(t)-X(s)\sim\text{Poiss}(\lambda(t-s))$.
- **Superpositie:** twee onafhankelijke Poisson-processen $\lambda_1,\lambda_2$ -> samen Poisson met $\lambda_1+\lambda_2$.
- **Thinning:** elk event behouden met kans $p$ -> Poisson met $p\lambda$.

### D. Schattingstheorie
Voor een schatter $\hat\theta$ van $\theta$:
$$\text{bias}=E[\hat\theta]-\theta,\qquad \text{MSE}(\hat\theta)=\text{bias}^2+\text{Var}[\hat\theta]$$
**Accuracy** = tegengestelde van bias (hoe dicht bij de waarde); **precision** = $1/\text{variantie}$ (efficiëntie). Een schatter is **consistent** als $\hat\theta_n\to\theta$ in kans voor $n\to\infty$. Onthoud: zuiverheid (bias) en consistentie zijn los van elkaar - $\bar{X}$ is beide; $\frac{X_1+X_2+X_3}{3}$ is zuiver maar niet consistent.

### E. Monte Carlo estimatie (MCE)
<!-- tool: wachtrij -->
Elke integraal is een verwachtingswaarde: $\theta=\int_\Omega h(x)f(x)\,dx=E[h(X)]$. De **MC-schatter**:
$$\hat\theta_n=\frac{1}{n}\sum_{i=1}^{n}h(X_i)\quad\text{(zuiver én consistent)}$$
$$\text{Var}[\hat\theta_n]=\frac{\text{Var}[h(X)]}{n},\qquad \text{Dev}[\hat\theta_n]=\frac{\text{Dev}[h(X)]}{\sqrt{n}}$$
De fout daalt dus traag, als $1/\sqrt{n}$. Betrouwbaarheidsinterval via CLT ($\hat\theta_n$ wordt normaal):
$$\hat\theta_n+z_{\alpha/2}\frac{\text{Dev}[h(X)]}{\sqrt{n}}<\theta<\hat\theta_n+z_{1-\alpha/2}\frac{\text{Dev}[h(X)]}{\sqrt{n}}$$
*Voorbeeld ($\pi$ schatten):* trek punten $(X,Y)\sim\text{Unif}(-1,1)$, $h=1$ als $X^2+Y^2\le1$; dan $\hat\theta_n\to\theta=\pi/4$. Een puntschatting zonder CI is nutteloos - geef altijd een betrouwbaarheidsinterval.

### F. Steady-state & discrete-tijd-wachtrij
- **Finite horizon** = eindig aantal toevalsvariabelen (bv. $E[\max(X_1,\dots,X_k)]$); **infinite horizon** = oneindig veel (over tijd) -> vraag of er een **steady state** bestaat.
- Discrete-tijd-queue (capaciteit $C$, aankomsten $A_n$, bediening $B_n\sim\text{Bern}(q)$):
$$Q_{n+1}=\min\big(C,\ \max(Q_n-B_n,0)+A_n\big)$$
$$\hat{J}=\frac{1}{N}\sum_{n=1}^{N}Q_n=\frac{1}{N}\sum_{j=0}^{C}h_j\cdot j\quad(\text{schatter voor }E[Q],\ h_j=\text{aantal slots met }Q=j)$$
- **Warm-up:** gooi het begin van het traject weg (niet representatief voor steady state). Voor $C=\infty$ bestaat een evenwicht **enkel** als $\lambda<\mu$; bij $\lambda\ge\mu$ bestaat $E[Q]$ niet.

### G. Discrete-Event Simulation (DES)
Centraal idee: haal alle tijd-informatie uit de toestand en stop ze in een **agenda**. De toestand = **globale variabelen** (queue-grootte, status busy/idle, ...) + **agenda** (lijst van toekomstige events: tijdstip + type). Het programma springt telkens naar het event met de kleinste tijd-tag en roept een **event-handler** aan (update toestand, update statistieken, genereer nieuwe events); de **Clock** bevat de tijd van het laatst behandelde event.
- **Time-driven** (vaste stap $\Delta$) vs. **event-driven** (tijd springt van event naar event, $t_k=t_{k-1}+\tau_k$ - veel efficiënter).
- *Voorbeeld (reneging queue):* items met een levensduur verlaten de rij als die verstrijkt vóór bediening. Stabiel ook als $\lambda>\mu$ (door expiraties). Balans: aankomstrate = expiratierate + completierate = vertrekrate. Nuttige doorvoer-schatter:
$$\hat\theta=\frac{N_C(T_{sim})}{T_{sim}}\quad(N_C=\text{aantal voltooide items})$$
Drie event-types (Arrival, Expiration, Completion); een expiratie-event wordt genegeerd als het item ondertussen al in bediening is.

---

<a name="root"></a>
## Root - Voorbeeldexamen: formules per vraag

*Op basis van het examen van 9/10/2025 + worked solutions. Per vraag de kernformule(s), het antwoord en de relevante les.*

### Vraag 1 (2,5) - Interpretatie van statistische resultaten
<!-- tool: hypothese -->
- **(a)** Statistische significantie $\ne$ praktische/economische significantie: een p-waarde zegt niets over effectgrootte of kost (bij grote $n$ wordt zelfs een micro-effect "significant"). Beslissing vergt effectgrootte + kosten-batenanalyse. **Niet correct.**
- **(b)** Een 95%-CI $[1{,}4\%;2{,}2\%]$ ligt volledig boven 1% -> proces kan geen $<1\%$ halen. **Correct.**
- **(c)** CI-halfbreedte $=z\cdot\dfrac{\sigma}{\sqrt{n}}\to 0$ als $n\to\infty$; geen theoretische ondergrens (in theorie elke nauwkeurigheid). **Correct.**
- **(d)** Cluster sampling is een *selectie*-methode; non-response treedt *na* selectie op. Geen enkel design immuniseert daartegen. **Niet correct.**
- **(e)** Tweezijdige toets op niveau $\alpha$ $\Leftrightarrow$ $(1-\alpha)$-CI: $1\%\leftrightarrow99\%$. **Correct** (in de standaard, tweezijdige lezing; nuance: een eenzijdige toets op 1% hoort bij een eenzijdige 99%-grens).

### Vraag 2 (3) - F-toets voor twee varianties
<!-- tool: hypothese -->
"M1 nauwkeuriger dan M2" $\Leftrightarrow \sigma_1^2<\sigma_2^2 \Leftrightarrow \sigma_2^2/\sigma_1^2>1$. Eénzijdige 95%-ondergrens:
$$\frac{\sigma_2^2}{\sigma_1^2}\ \ge\ \frac{s_2^2}{s_1^2}\cdot F_{0{,}05}(n_1{-}1;n_2{-}1),\qquad F_{0{,}05}(9;14)=\texttt{=F.INV(0,05;9;14)}=0{,}3305$$
Ligt de ondergrens $L>1$ -> vermoeden bevestigd (M1 nauwkeuriger). *Met de voorbeeldvarianties* $s_1^2=0{,}004$, $s_2^2=0{,}015$: $L=\dfrac{0{,}015}{0{,}004}\cdot0{,}3305=3{,}75\cdot0{,}3305=1{,}24>1$ -> bevestigd (vervang door de echte waarden uit het Excel-bestand). *(Les 2.C/D.)*

### Vraag 3 (2) - Proces-capabiliteit
<!-- tool: capabiliteit -->
$$C_p=\frac{USL-LSL}{6\sigma}=\frac{60}{60}=1{,}0,\qquad C_{pk}=\min\!\Big(\frac{20}{30},\frac{40}{30}\Big)=0{,}67$$
Proces is 10 mm te hoog gecentreerd ($\mu=1440$ vs. centrum $1430$). **% uitval:** $Z_U=\frac{1460-1440}{10}=+2\to2{,}28\%$; $Z_L=-4\to\approx0$; totaal $\approx\mathbf{2{,}28\%}$ (`=1-NORM.DIST(1460;1440;10;WAAR)`). **Verbeteren:** (1) hercentreren ($\mu\to1430$), (2) $\sigma$ verlagen. **6$\sigma$-criterium:** max $\mathbf{3{,}4}$ ppm (DPMO) $=0{,}00034\%$ (lange termijn, met 1,5$\sigma$-drift; slide "Technical definition": $C_p=2$, $C_{pk}=1{,}5$). Een perfect gecentreerd 6$\sigma$-proces geeft op korte termijn ~0,002 ppm (2 per miljard; slide "Cp = 2: 2 defects per billion, short term"); vermeld dit in één zin, zo dek je beide lezingen af. *(Les 4 + Les 2 DPMO.)*

### Vraag 4 (1,5) - Regelkaarten
<!-- tool: spc -->
- **Normaliteit/gemiddelden:** door de **CLT** zijn subgroepgemiddelden $\bar{x}$ bij benadering normaal, ook als de individuele metingen dat niet zijn -> grenzen op $\mu\pm3\sigma$ (99,73%).
- **Detecteerbaar:** **bijzondere (aanwijsbare) oorzaken** (signaal: punt buiten grenzen, run, trend); common cause = ruis binnen de grenzen (niet op reageren = tampering).
- **Range als beste schatter:** bij **kleine subgroepen** ($n\lesssim8$-$10$): de range is dan bijna even efficiënt als $s$ en simpeler; voor grotere subgroepen is de s-kaart beter. *(Les 4.)*

### Vraag 5 (4) - Confusion matrix & bias-variance
<!-- tool: ml -->
Accuracy $=\dfrac{TP+TN}{\text{totaal}}$. A: train 96,5% / test 61,7% (kloof ~35) -> **hoge variantie** (overfit). B: train 74% / test 61,7% -> **hoge bias** (underfit, fit zelfs training slecht). C: train 85% / test **69,2%** (beste test) -> **optimaal**. Hoge bias in een boom verhelpen: **complexer maken** (grotere diepte, minder pruning, lagere min. samples/split, meer features). *(ML-sectie in Les 1.)*

### Vraag 6 (4) - Verdelingen & variantie
<!-- tool: verdelingen -->
| Var | Familie | $E[\cdot]$ |
|---|---|---|
| B (bestellingen/week) | **Poisson** | $175{,}3$ |
| T (tijd tussen bestellingen) | **exponentieel** | $1/175{,}3$ week $=0{,}0057$ week |
| C (capaciteit µF) | **normaal** | $820$ |
| X (conform j/n) | **Bernoulli** | $0{,}95$ |
| D (niet-conform per lot) | **binomiaal**$(100;0{,}05)$ | $np=5$ |

*$E[T]$ in uren* hangt af van de definitie van een week: 168 h -> 0,96 h; 40 werkuren -> 0,23 h. Schrijf je aanname op.

*iid onrealistisch:* B (weken niet identiek verdeeld: seizoen/promo), en D/C (stukken van dezelfde lijn correleren -> defecten clusteren bij procesdrift).
**Var berekenen:** binomiaal $\text{Var}[D]=np(1-p)=100\cdot0{,}05\cdot0{,}95=\mathbf{4{,}75}$. Normaal $\text{Var}[C]=\sigma^2$ met $\sigma$ uit de staartkans: $P(C<720)=5\%\Rightarrow\frac{720-820}{\sigma}=-1{,}645\Rightarrow\sigma=60{,}8\Rightarrow \text{Var}[C]\approx\mathbf{3696}\ \mu F^2$. *(Les 1 verdelingen.)*

### Vraag 7 (3) - Regressielijn & causale interventie
<!-- tool: ml -->
$f(x)=E[S\mid T=x]$ = voorwaardelijk gemiddelde = regressielijn door het verticale centrum van de puntenwolk.
- **do(T=730), S→T** (interventie op het *gevolg*): S behoudt zijn **marginale** verdeling -> bolletjes verticaal over de hele S-range.
- **do(T=730), T→S** (interventie op de *oorzaak*): S volgt $P(S\mid T=730)$ -> kruisjes dicht rond $E[S\mid T=730]$.

Kern: conditioneren (zien) $\ne$ interveniëren (doen); dezelfde scatter past bij beide causale richtingen, dus je kan causaliteit niet uit correlatie aflezen. *(Les 1 causaliteit.)*

---

<a name="excel"></a>
## Volledig Excel-formularium

*Nederlandse Excel: argumenten gescheiden door **puntkomma's**; `WAAR`/`ONWAAR` = TRUE/FALSE. "cumulatief" = `WAAR` voor de CDF (kans $\le$), `ONWAAR` voor de kansdichtheid/-massa in één punt.*

### Beschrijvende statistiek
| Doel | Functie |
|---|---|
| Gemiddelde | `=AVERAGE(bereik)` |
| Mediaan / modus | `=MEDIAN(bereik)` ; `=MODE.SNGL(bereik)` |
| Std.afw. steekproef / populatie | `=STDEV.S(bereik)` ; `=STDEV.P(bereik)` |
| Variantie steekproef / populatie | `=VAR.S(bereik)` ; `=VAR.P(bereik)` |
| Kwadratensom $\sum(x-\bar{x})^2$ ($S_{xx}$) | `=DEVSQ(bereik)` |
| Range | `=MAX(bereik)-MIN(bereik)` |
| Aantal / percentiel | `=COUNT(bereik)` ; `=PERCENTILE.INC(bereik;p)` |

### Normale verdeling
| Doel | Functie |
|---|---|
| CDF $P(X\le x)$ | `=NORM.DIST(x;μ;σ;WAAR)` |
| Kansdichtheid (pdf) | `=NORM.DIST(x;μ;σ;ONWAAR)` |
| Inverse (kwantiel) | `=NORM.INV(p;μ;σ)` |
| Standaardnormale CDF $\Phi(z)$ | `=NORM.S.DIST(z;WAAR)` |
| Standaardnormale inverse | `=NORM.S.INV(p)` -> `=NORM.S.INV(0,975)`$=1{,}96$ |
| Random trekking $N(\mu,\sigma)$ | `=NORM.INV(RAND();μ;σ)` |
| Fractie conform tussen specs | `=NORM.DIST(USL;μ;σ;WAAR)-NORM.DIST(LSL;μ;σ;WAAR)` |

### t-verdeling (gemiddelde, regressie-coëfficiënten)
| Doel | Functie |
|---|---|
| Kritieke $t$ eenzijdig | `=T.INV(α;df)` |
| Kritieke $t$ tweezijdig | `=T.INV.2T(α;df)` |
| p-waarde links / rechts | `=T.DIST(t;df;WAAR)` ; `=T.DIST.RT(t;df)` |
| p-waarde tweezijdig | `=T.DIST.2T(ABS(t);df)` |
| t-toets ineens (2 reeksen) | `=T.TEST(reeks1;reeks2;zijden;type)` |
| Halve CI-breedte gemiddelde | `=CONFIDENCE.T(α;s;n)` (onbekende $\sigma$) ; `=CONFIDENCE.NORM(α;σ;n)` (gekende $\sigma$) |

### $\chi^2$-verdeling (variantie)
| Doel | Functie |
|---|---|
| Kritieke $\chi^2$ rechts / links | `=CHISQ.INV.RT(α;df)` ; `=CHISQ.INV(α;df)` |
| p-waarde (rechterstaart) | `=CHISQ.DIST.RT(χ²;df)` |

### F-verdeling (twee varianties, ANOVA, regressie)
| Doel | Functie |
|---|---|
| Kritieke $F$ linkerstaart (variantieverhouding-CI) | `=F.INV(α;df1;df2)` -> `=F.INV(0,05;9;14)`$=0{,}3305$ |
| Kritieke $F$ rechterstaart | `=F.INV.RT(α;df1;df2)` |
| p-waarde (rechterstaart) | `=F.DIST.RT(F;df1;df2)` |
| F-toets twee varianties ineens | `=F.TEST(reeks1;reeks2)` |

### Discrete verdelingen (acceptance sampling)
| Doel | Functie |
|---|---|
| Binomiaal $P(d)$ of $P(\le d)$ | `=BINOM.DIST(d;n;π;cumulatief)` |
| Poisson | `=POISSON.DIST(x;λ;cumulatief)` |
| Hypergeometrisch (eindige populatie) | `=HYPGEOM.DIST(d;n;D;N;cumulatief)` |

### Regressie & correlatie
| Doel | Functie |
|---|---|
| Helling $\hat{\beta}_1$ / intercept $\hat{\beta}_0$ | `=SLOPE(y;x)` ; `=INTERCEPT(y;x)` |
| $R^2$ / correlatie $r$ | `=RSQ(y;x)` ; `=CORREL(x;y)` (of `=PEARSON(x;y)`) |
| Volledige output (matrixformule) | `=LINEST(y;x;WAAR;WAAR)` -> coëff., SE's, $R^2$, $F$, df, $SS_R$, $SS_E$ |
| Standaardfout schatting $\sqrt{MSE}$ | `=STEYX(y;x)` |
| Voorspelling $\hat{Y}$ in $x_0$ | `=FORECAST.LINEAR(x0;y;x)` of `=TREND(y;x;x0)` |
| ANOVA / regressie-tabellen | Analysis ToolPak: *Data > Gegevensanalyse* |

### Capability, sigma-niveau & DPMO
| Doel | Functie |
|---|---|
| % uitval onder LSL / boven USL | `=NORM.DIST(LSL;μ;σ;WAAR)` ; `=1-NORM.DIST(USL;μ;σ;WAAR)` |
| Totale uitval (2-zijdig) | `=NORM.DIST(LSL;μ;σ;WAAR)+(1-NORM.DIST(USL;μ;σ;WAAR))` |
| $C_p$ | `=(USL-LSL)/(6*σ)` |
| $C_{pk}$ | `=MIN((USL-μ)/(3*σ);(μ-LSL)/(3*σ))` |
| DPMO uit sigma-niveau $k$ (1,5$\sigma$-drift) | `=(1-NORM.S.DIST(k-1,5;WAAR))*1000000` |
| Sigma-niveau (KT) uit DPMO | `=NORM.S.INV(1-DPMO/1000000)+1,5` |
| Sigma-niveau uit yield | `=NORM.S.INV(yield)` (LT); met 1,5σ-shift `=NORM.S.INV(yield)+1,5` |

### Aanvulling: exacte CI, acceptance sampling, toetsen
| Doel | Functie |
|---|---|
| Exact CI fractie (Clopper-Pearson) | `=BETA.INV(α/2;d;n-d+1)` ; `=BETA.INV(1-α/2;d+1;n-d)` |
| Kritieke c bij acceptance sampling | `=BINOM.INV(n;π;1-α)` (kleinste c met cumulatieve kans ≥ 1-α) |
| t-toets twee reeksen | `=T.TEST(r1;r2;zijden;type)` type 1 = gepaard, 2 = gelijke varianties, 3 = ongelijke |
| $\chi^2$-toets onafhankelijkheid | `=CHISQ.TEST(waargenomen;verwacht)` (geeft p-waarde) |
| Exponentieel | `=EXPON.DIST(x;λ;WAAR)` |
| Gamma / lnGamma | `=GAMMA.DIST(...)`, `=GAMMALN(x)` |
| Wisselen staarten F | `=F.INV(α;a;b)` = `=1/F.INV.RT(α;b;a)` |

*Tip: `F.INV`, `T.INV` en `CHISQ.INV` zijn links-staart inversen (kans onder de waarde); de `.RT`-varianten werken vanaf de rechterstaart. Let bij CI's en kritieke waarden steeds op één- vs. tweezijdig ($\alpha$ vs. $\alpha/2$).*

---

<a name="strategie"></a>
## Examenstrategie: vraagtype -> formule -> tool

| Als de vraag gaat over... | Formule / methode | Toolkit-module |
|---|---|---|
| "Klopt deze uitspraak?" (significant, CI, steekproef) | significantie ≠ relevantie; CI <-> toets; $SE=\sigma/\sqrt n$; non-response na selectie | Formularium, M2 duality |
| "M1 nauwkeuriger dan M2?" | F-verdeling, eenzijdige CI voor variantieverhouding | M2 F-toets / CI ratio |
| "Is het gemiddelde verschoven?" | t-toets (1 steekproef), gepaard of 2 steekproeven | M2 |
| "Is de spreiding toegenomen?" | $\chi^2$-toets / CI voor $\sigma$ | M2 |
| Fractie defecten, lot aanvaarden | exact CI, OC-curve, $(n,c)$ | M2, M10 |
| Capabiliteit, % uitval, verbeteren | $C_p$, $C_{pk}$, z-scores, DPMO | M3 |
| Regelkaart opstellen / interpreteren | $\bar{X}$-R, $\bar{X}$-s, Western Electric | M6 |
| Meetsysteem goed genoeg? | GRR, %GRR, ndc | M7 |
| Welke factoren beïnvloeden y? | ANOVA, $2^k$ effecten, regressie | M7, M8, M9 |
| Welke verdeling, E en Var, σ uit staartkans | familie-tabel, $z=(x-\mu)/\sigma$ | M1 |
| Bias/variantie, confusion matrix | accuracy train vs test | M11 |
| Regressielijn schetsen, interventie | $E[S\mid T]$, do-operator | M11 uitleg |
