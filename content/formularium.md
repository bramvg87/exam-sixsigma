# Formularium Lean Six Sigma Black Belt - Module 3 (UGAIN)

Revisie oktober 2026. Samengevoegd: basisformularium + aanvulling (correcties A1-A9 verwerkt, nieuwe secties B1-B11 ingevoegd). Alle rekenvoorbeelden zijn herrekend (scipy, gelijk aan Excel).

Notatie Excel: Engelse functienamen zoals in de cursus, Nederlandse scheiding `;`, decimale komma, `WAAR`/`ONWAAR`. Kwantielen: $z_p$ = `NORM.S.INV(p)`, $t_{p;\nu}$ = `T.INV(p;ν)`, $\chi^2_{p;\nu}$ = `CHISQ.INV(p;ν)`, $F_{p}(a;b)$ = `F.INV(p;a;b)` (telkens linkerstaartkans $p$).

---

## Les 1 - Kansen, verdelingen en causaliteit

### Lean Six Sigma kader: DMAIC, Y = f(X), Little's law

- **DMAIC**: Define (probleem, CTQ, scope, project charter) - Measure (huidige prestatie, MSA, baseline capabiliteit) - Analyze (oorzaken, $Y=f(X)$, hypothesetoetsen, regressie) - Improve (oplossingen, DOE, piloot) - Control (SPC, control plan, borging).
- **$Y=f(X)$**: de output $Y$ (CTQ) is een functie van inputs/procesvariabelen $X_1,\dots,X_k$ plus ruis. Wie $Y$ wil sturen, moet de kritische $X$'en vinden en beheersen.
- **Little's law** (stationair systeem):
$$WIP = TH \times CT \qquad (L=\lambda W)$$
met WIP = gemiddeld onderhanden werk, TH = doorzet (throughput), CT = gemiddelde doorlooptijd.
- **Flow efficiency** $=\dfrac{\text{waardetoevoegende tijd}}{\text{totale doorlooptijd}}\times100\%$. Typisch < 10% in kantoorprocessen.
- Process cycle efficiency, takt time $=\dfrac{\text{beschikbare tijd}}{\text{klantvraag}}$.

### Data en meetschalen

| Schaal | Kenmerk | Voorbeelden | Zinvolle statistiek |
|---|---|---|---|
| Nominaal | categorieën zonder orde | kleur, machine, lijn | modus, frequenties, $\chi^2$ |
| Ordinaal | categorieën met orde | klantscore 1-5, klasse A/B/C | mediaan, rangtoetsen |
| Interval | gelijke afstanden, geen absoluut nulpunt | temperatuur in °C | gemiddelde, s |
| Ratio | absoluut nulpunt, verhoudingen zinvol | lengte, tijd, gewicht | alles, ook CV $=s/\bar{x}$ |

Discreet (tellen) vs continu (meten). Attribuutdata (goed/slecht, aantal defecten) bevat minder informatie dan variabelendata (metingen).

### Kansregels, marginaal, voorwaardelijk, onafhankelijkheid, Bayes
<!-- tool: ml -->

- Complement: $P(\bar{A})=1-P(A)$.
- Somregel: $P(A\cup B)=P(A)+P(B)-P(A\cap B)$.
- Voorwaardelijke kans: $P(A\mid B)=\dfrac{P(A\cap B)}{P(B)}$, productregel $P(A\cap B)=P(A\mid B)\,P(B)$.
- Marginale kans uit een gezamenlijke tabel: $P(Y=y)=\sum_x P(X=x,Y=y)$ (rij- of kolomtotaal / $n$).
- Wet van de totale kans: $P(B)=\sum_i P(B\mid A_i)P(A_i)$.
- **Onafhankelijkheid**: $P(A\cap B)=P(A)P(B)$, equivalent $P(A\mid B)=P(A)$. Controle in een kruistabel: vergelijk $P(Y\mid X=x)$ voor elke $x$ met de marginale $P(Y)$.
- **Bayes**:
$$P(A\mid B)=\frac{P(B\mid A)\,P(A)}{P(B\mid A)P(A)+P(B\mid\bar{A})P(\bar{A})}$$
- Verwachting en variantie: $E[aX+b]=aE[X]+b$, $Var[aX+b]=a^2Var[X]$, $Var[X]=E[X^2]-E[X]^2$; $Var[X+Y]=Var[X]+Var[Y]+2Cov(X,Y)$ (onafhankelijk: $Cov=0$).
- Gemiddelde van $n$ iid waarnemingen: $E[\bar{X}]=\mu$, $Var[\bar{X}]=\sigma^2/n$, $SE=\sigma/\sqrt{n}$.

*Voorbeeld kruistabel (lijn x kwaliteit, 500 stuks)*: rij 1 = (200, 50, 20), rij 2 = (150, 40, 40). $\chi^2=11{,}80$, df $=2$, p $=0{,}0027$: lijn en kwaliteit zijn afhankelijk (zie B1).

### Kansmassa versus dichtheid (pmf vs pdf)

$f(x)=P(X=x)$ geldt **enkel voor discrete verdelingen** (kansmassafunctie). Voor continue verdelingen is $f$ een **dichtheid**: $P(X=x)=0$ en
$$P(a\le X\le b)=\int_a^b f(x)\,dx,\qquad F(x)=P(X\le x)=\int_{-\infty}^x f(t)\,dt$$
Gevolg: bij continue $X$ is $P(X<x)=P(X\le x)$; bij discrete $X$ niet ($P(X<x)=P(X\le x-1)$ voor gehele waarden).

### Verdelingenfamilie: E[X], Var[X] en Excel
<!-- tool: verdelingen -->

| Verdeling | Situatie | $P(X=x)$ of $f(x)$ | $E[X]$ | $Var[X]$ | Excel |
|---|---|---|---|---|---|
| Bernoulli$(\pi)$ | één stuk: conform ja/nee | $\pi^x(1-\pi)^{1-x}$, $x\in\{0,1\}$ | $\pi$ | $\pi(1-\pi)$ | `=BINOM.DIST(x;1;π;ONWAAR)` |
| Binomiaal$(n,\pi)$ | aantal defecten in $n$ onafhankelijke stuks | $\binom{n}{x}\pi^x(1-\pi)^{n-x}$ | $n\pi$ | $n\pi(1-\pi)$ | `=BINOM.DIST(x;n;π;WAAR)`, `=BINOM.INV(n;π;p)` |
| Poisson$(\lambda)$ | aantal gebeurtenissen per tijd/oppervlak | $e^{-\lambda}\lambda^x/x!$ | $\lambda$ | $\lambda$ | `=POISSON.DIST(x;λ;WAAR)` |
| Hypergeometrisch$(N,D,n)$ | trekken zonder teruglegging uit lot $N$ met $D$ defect | $\dfrac{\binom{D}{x}\binom{N-D}{n-x}}{\binom{N}{n}}$ | $n\frac{D}{N}$ | $n\frac{D}{N}\left(1-\frac{D}{N}\right)\frac{N-n}{N-1}$ | `=HYPGEOM.DIST(x;n;D;N;WAAR)` |
| Uniform$(a,b)$ | elke waarde in $[a,b]$ even waarschijnlijk | $\frac{1}{b-a}$ | $\frac{a+b}{2}$ | $\frac{(b-a)^2}{12}$ | `=(x-a)/(b-a)` |
| Exponentieel$(\lambda)$ | tijd tussen gebeurtenissen van een Poissonproces | $\lambda e^{-\lambda x}$, $x\ge0$ | $1/\lambda$ | $1/\lambda^2$ | `=EXPON.DIST(x;λ;WAAR)` |
| Normaal$(\mu,\sigma^2)$ | meetwaarden, sommen/gemiddelden (CLT) | $\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}$ | $\mu$ | $\sigma^2$ | `=NORM.DIST(x;μ;σ;WAAR)`, `=NORM.INV(p;μ;σ)` |
| Standaardnormaal $Z$ | $Z=(X-\mu)/\sigma$ | $\varphi(z)$ | 0 | 1 | `=NORM.S.DIST(z;WAAR)`, `=NORM.S.INV(p)` |
| $t(\nu)$ | $\frac{\bar{X}-\mu}{S/\sqrt{n}}$, $\nu=n-1$ | symmetrisch, dikkere staarten | 0 ($\nu>1$) | $\frac{\nu}{\nu-2}$ ($\nu>2$) | `=T.DIST(t;ν;WAAR)`, `=T.INV(p;ν)`, `=T.INV.2T(α;ν)` |
| $\chi^2(\nu)$ | $\frac{(n-1)S^2}{\sigma^2}$, $\nu=n-1$ | rechtsscheef, $\ge0$ | $\nu$ | $2\nu$ | `=CHISQ.DIST(x;ν;WAAR)`, `=CHISQ.INV(p;ν)`, `=CHISQ.INV.RT(α;ν)` |
| $F(\nu_1,\nu_2)$ | $\frac{S_1^2/\sigma_1^2}{S_2^2/\sigma_2^2}$ | rechtsscheef, $\ge0$ | $\frac{\nu_2}{\nu_2-2}$ | $\frac{2\nu_2^2(\nu_1+\nu_2-2)}{\nu_1(\nu_2-2)^2(\nu_2-4)}$ | `=F.DIST(x;ν1;ν2;WAAR)`, `=F.INV(p;ν1;ν2)`, `=F.INV.RT(α;ν1;ν2)` |

Benaderingen: binomiaal ~ Poisson($n\pi$) als $n$ groot en $\pi$ klein; binomiaal ~ normaal($n\pi$, $n\pi(1-\pi)$) als $n\pi\ge5$ en $n(1-\pi)\ge5$; hypergeometrisch ~ binomiaal als $n/N<0{,}1$.
Geheugenloosheid exponentieel: $P(T>s+t\mid T>s)=P(T>t)$.

### Welke verdeling? Tellen versus meten
<!-- tool: verdelingen -->

| Vraag | Antwoord | Verdeling |
|---|---|---|
| Tel ik of meet ik? | meten (continu) | normaal (meetwaarde), exponentieel (wachttijd/tijd tussen gebeurtenissen), uniform (geen voorkeur binnen interval) |
| | tellen (discreet) | zie hieronder |
| Eén stuk, twee uitkomsten? | ja | Bernoulli |
| Aantal "successen" in vast aantal $n$ onafhankelijke pogingen? | ja, met teruglegging of groot lot | binomiaal |
| | zonder teruglegging uit klein lot $N$ | hypergeometrisch |
| Aantal gebeurtenissen in een tijdsinterval/oppervlak, geen vaste bovengrens? | ja | Poisson |
| Tijd tot volgende gebeurtenis bij Poissonproces? | ja | exponentieel |
| Toetsingsgrootheid gemiddelde, $\sigma$ onbekend | | $t$ |
| Toetsingsgrootheid variantie | | $\chi^2$ |
| Verhouding van twee varianties | | $F$ |

### z-transformatie en sigma uit een staartkans
<!-- tool: verdelingen -->

$$Z=\frac{X-\mu}{\sigma}\sim N(0,1),\qquad P(X\le x)=\Phi\!\left(\frac{x-\mu}{\sigma}\right),\qquad x_p=\mu+z_p\,\sigma$$

**Sigma uit staartkans**: gegeven $\mu$, grens $x_0$ en $P(X<x_0)=p$:
$$\sigma=\frac{x_0-\mu}{z_p}=\frac{\mu-x_0}{z_{1-p}}$$
*Voorbeeldexamen vraag 6*: $\mu=820$ µF, $P(C<720)=5\%$ (2 op 40 niet-conform): $z_{0,95}=1{,}6449$, dus
$$\sigma=\frac{820-720}{1{,}6449}=60{,}80\ \mu\text{F},\qquad Var[C]=60{,}80^2=3696\ \mu\text{F}^2$$
Excel: `=(820-720)/NORM.S.INV(0,95)`.

Belangrijke z-waarden: $z_{0,90}=1{,}2816$, $z_{0,95}=1{,}6449$, $z_{0,975}=1{,}9600$, $z_{0,99}=2{,}3263$, $z_{0,995}=2{,}5758$. $P(\lvert Z\rvert>3)=0{,}27\%$.

### Centrale limietstelling (CLT)

Voor iid $X_i$ met $E=\mu$, $Var=\sigma^2$: $\bar{X}\approx N(\mu,\sigma^2/n)$ voor voldoende grote $n$, ongeacht de verdeling van $X$. Dit verklaart waarom subgroepgemiddelden op een $\bar{X}$-kaart (bij benadering) normaal zijn, en waarom de t-toets robuust is bij grote $n$.

### Voorwaardelijke verwachting en regressielijn

- $E[Y\mid X=x]$ = gemiddelde van $Y$ bij een vaste waarde $x$; als functie van $x$ is dit de **regressiefunctie** $f(x)$. Ze gaat door het "midden" van de puntenwolk bij elke $x$.
- Lineair model: $E[Y\mid X=x]=\beta_0+\beta_1x$, $Y=\beta_0+\beta_1X+\varepsilon$, $E[\varepsilon]=0$.
- Voorspellen met de regressielijn = **"seeing"** (observeren): wat verwacht ik van $Y$ als ik zie dat $X=x$.

### Causaliteit: DAG, confounder, do-operator, RCT

- **DAG** (directed acyclic graph): pijl $X\to Y$ betekent "X is een directe oorzaak van Y".
- **Confounder** $Z$: gemeenschappelijke oorzaak $X\leftarrow Z\to Y$. Geeft correlatie tussen $X$ en $Y$ zonder causaal effect. Correlatie is geen causaliteit.
- **Seeing vs doing**: $P(Y\mid X=x)$ (observeren) is in het algemeen niet gelijk aan $P(Y\mid do(X=x))$ (ingrijpen, interventie).
- **do-operator**: bij $do(X=x)$ worden alle pijlen **naar** $X$ doorgeknipt; $X$ wordt van buitenaf vastgezet.
  - Als $X\to Y$: $P(Y\mid do(X=x))=P(Y\mid X=x)$ (geen confounding). Na interventie liggen de waarnemingen rond de regressiewaarde $E[Y\mid X=x]$.
  - Als $Y\to X$: ingrijpen op $X$ verandert $Y$ niet: $P(Y\mid do(X=x))=P(Y)$, de **marginale** verdeling van $Y$.
  - Met confounder $Z$: back-door aanpassing $P(Y\mid do(x))=\sum_z P(Y\mid x,z)P(z)$.
- **RCT / A-B testing**: randomiseren van de behandeling knipt alle pijlen naar $X$ door, dus het waargenomen verschil schat het causale effect. Basis voor DOE (randomisatie).

---

## Les 1b - Machine learning
<!-- tool: ml -->

### Begrippen

- **Supervised learning**: data met label $y$; regressie (continue $y$) of classificatie (categorische $y$). **Unsupervised**: geen label; clustering (k-means), dimensiereductie (PCA).
- **Loss-functies**:
$$MSE=\frac1n\sum_{i=1}^n(y_i-\hat{y}_i)^2,\qquad RMSE=\sqrt{MSE},\qquad MAE=\frac1n\sum_{i=1}^n\lvert y_i-\hat{y}_i\rvert$$
MSE straft grote fouten zwaarder (gevoelig voor uitschieters); MAE is robuuster. Classificatie: misclassificatie-rate, cross-entropy (log loss).
- **Train / validatie / test**: train = parameters fitten; validatie = hyperparameters kiezen (diepte boom, aantal lagen); test = eenmalige, eerlijke schatting van de prestatie op nieuwe data. Nooit op de testset tunen.
- **k-fold cross-validation**: verdeel de data in $k$ delen; train $k$ keer op $k-1$ delen en evalueer op het overgebleven deel; gemiddelde fout = CV-schatting. Nuttig bij weinig data (typisch $k=5$ of 10; $k=n$: leave-one-out).

### Bias-variance trade-off

$$E\big[(Y-\hat{f}(x))^2\big]=\underbrace{\big(f(x)-E[\hat{f}(x)]\big)^2}_{\text{bias}^2}+\underbrace{Var[\hat{f}(x)]}_{\text{variantie}}+\underbrace{\sigma^2_\varepsilon}_{\text{onherleidbare ruis}}$$

| Situatie | Train-score | Test-score | Diagnose | Remedie |
|---|---|---|---|---|
| Model te eenvoudig | laag | laag (ongeveer gelijk aan train) | **hoge bias (underfit)** | complexer model, meer features, diepere boom |
| Model te complex | zeer hoog | veel lager | **hoge variantie (overfit)** | eenvoudiger model, regularisatie, pruning, meer data |
| Goede balans | hoog | hoogst haalbaar | optimaal | - |

### Confusion matrix en classificatiematen
<!-- tool: ml -->

| | voorspeld positief | voorspeld negatief |
|---|---|---|
| werkelijk positief | TP | FN |
| werkelijk negatief | FP | TN |

$$\text{Accuracy}=\frac{TP+TN}{N},\quad \text{Precision}=\frac{TP}{TP+FP},\quad \text{Recall (sensitiviteit)}=\frac{TP}{TP+FN}$$
$$\text{Specificiteit}=\frac{TN}{TN+FP},\qquad F_1=\frac{2\cdot\text{Precision}\cdot\text{Recall}}{\text{Precision}+\text{Recall}}$$

FP = type I fout (vals alarm), FN = type II fout (gemist). Bij ongebalanceerde klassen zegt accuracy weinig: kijk naar precision/recall.

**Voorbeeldexamen vraag 5** (Goed = positief, rijen = werkelijk, kolommen = voorspeld):

| Model | train acc | test acc | kloof | diagnose |
|---|---|---|---|---|
| A | 96,5% | 61,7% | 34,8 | hoge variantie (overfit) |
| B | 74,0% | 61,7% | 12,3 | hoge bias (underfit) |
| C | 85,0% | 69,2% | 15,8 | optimaal (beste test) |

Beslisregel: **train laag** -> bias; **train hoog en test veel lager** -> variantie; **beste test-score** -> optimaal.

### Beslissingsbomen

- Recursief splitsen op de variabele/drempel die de onzuiverheid het meest verlaagt (Gini $=1-\sum_k p_k^2$, entropie $=-\sum_k p_k\log_2p_k$; regressieboom: MSE).
- **Hoge bias verlagen** (boom te eenvoudig): grotere maximale diepte, kleiner minimum aantal stuks per blad / per split, minder pruning, meer of betere features.
- **Hoge variantie verlagen** (boom overfit): diepte beperken, groter minimum per blad, pruning (cost-complexity), meer trainingsdata, ensembles (random forest = bagging + random features; boosting verlaagt vooral bias).

### Neurale netwerken

- Lagen van neuronen: $a=g\!\left(\sum_j w_jx_j+b\right)$ met activatiefunctie $g$ (ReLU, sigmoid, tanh). Input-laag, verborgen lagen, output-laag.
- Training: minimaliseer de loss met gradient descent; gradiënten via backpropagation; learning rate, epochs, batches.
- Veel parameters -> risico op overfit: regularisatie (L2, dropout), early stopping op de validatieset.

### Bayes-classificatie

Kies de klasse met de grootste a-posteriori kans:
$$\hat{y}=\arg\max_k P(Y=k\mid X=x)=\arg\max_k P(X=x\mid Y=k)\,P(Y=k)$$
Naive Bayes: veronderstelt onafhankelijkheid van de features gegeven de klasse: $P(x\mid k)=\prod_j P(x_j\mid k)$. De Bayes-classifier heeft de kleinst mogelijke foutkans (Bayes error) als de kansen gekend zijn.

---

## Les 2 - Hypothesetoetsen, betrouwbaarheidsintervallen en steekproeven

### A. Toetsrecept in 7 stappen
<!-- tool: hypothese -->

1. Formuleer $H_0$ en $H_1$ (links-, rechts- of tweezijdig). $H_1$ = wat je wil aantonen.
2. Kies het significantieniveau $\alpha$ (vooraf!).
3. Kies de toetsingsgrootheid en haar verdeling onder $H_0$ (+ voorwaarden).
4. Bepaal het verwerpingsgebied (kritieke waarde).
5. Bereken de toetsingsgrootheid uit de steekproef.
6. Beslis: verwerp $H_0$ als de waarde in het verwerpingsgebied ligt (equivalent: p-waarde $<\alpha$).
7. Formuleer de conclusie in de taal van het probleem.

### B. Alpha, beta, power, p-waarde, OC-curve van een toets

| | $H_0$ waar | $H_0$ vals |
|---|---|---|
| $H_0$ niet verwerpen | juist ($1-\alpha$) | type II fout ($\beta$) |
| $H_0$ verwerpen | type I fout ($\alpha$) | juist (power $1-\beta$) |

- $\alpha$ = producer's risk / vals alarm; $\beta$ = consumer's risk / gemist effect.
- **p-waarde** = kans, onder $H_0$, op een toetsingsgrootheid minstens zo extreem als waargenomen. Klein = bewijs tegen $H_0$. Geen kans dat $H_0$ waar is.
- "Niet verwerpen" is geen bewijs dat $H_0$ waar is.
- **Significant is niet relevant**: bij grote $n$ wordt elk klein verschil significant. Beoordeel ook de effectgrootte en de kosten-baten.
- **OC-curve van een toets**: $\beta(\mu)=P(H_0\text{ niet verwerpen}\mid\mu)$ uitgezet tegen de werkelijke waarde. Power-curve $=1-\beta(\mu)$. Bij $\mu=\mu_0$ is $P(\text{verwerpen})=\alpha$. Grotere $n$ = steilere curve.
- Rechtszijdige Z-toets: $\beta(\mu)=\Phi\!\left(z_{1-\alpha}-\dfrac{(\mu-\mu_0)\sqrt{n}}{\sigma}\right)$.

*Voorbeeld t-toets (A2)*: 20 metingen, $H_0:\mu=10$ vs $H_1:\mu<10$, $\alpha=2\%$. Met de ruwe meetwaarden: $\bar{x}=9{,}928$, $s=0{,}1079$, $t=\dfrac{9{,}928-10}{0{,}1079/\sqrt{20}}=-2{,}98$, kritiek $t_{0,02;19}=-2{,}205$, p $=0{,}38\%$. De slide rekent met afgeronde $s=0{,}109$ en vindt $t=-2{,}95$. Conclusie identiek: verwerp $H_0$ bij $\alpha=2\%$. Bovengrens eenzijdig 98%-CI: $\mu<9{,}981$, dus 10 valt erbuiten.
Excel: `=T.INV(0,02;19)`, `=T.DIST(-2,98;19;WAAR)`.

*Voorbeeld $\chi^2$-toets $\sigma$*: 20 metingen, $H_0:\sigma=0{,}01$ vs $H_1:\sigma>0{,}01$, $\alpha=2\%$: $s=0{,}01165$, $\chi^2=\frac{19\cdot0{,}01165^2}{0{,}01^2}=25{,}81$, kritiek $\chi^2_{0,98;19}=33{,}69$, p $=0{,}136$: niet verwerpen. Eenzijdige 98%-ondergrens $\sigma>0{,}00875$.
Excel: `=CHISQ.INV.RT(0,02;19)`, `=CHISQ.DIST.RT(25,81;19)`.

### C. Dualiteit betrouwbaarheidsinterval en toets
<!-- tool: hypothese -->

- Een $(1-\alpha)$-betrouwbaarheidsinterval bevat precies de waarden $\theta_0$ die bij significantieniveau $\alpha$ **niet** verworpen worden.
- **Tweezijdige** toets op niveau $\alpha$ <-> **tweezijdig** $(1-\alpha)$-CI.
- **Eenzijdige** toets op niveau $\alpha$ <-> **eenzijdige** $(1-\alpha)$-grens (rechtszijdige toets: ondergrens; linkszijdige toets: bovengrens). Een eenzijdige grens op $1-\alpha$ is ook een grens van het tweezijdige $(1-2\alpha)$-CI.
- Voorbeeld: eenzijdige toets op 1% <-> eenzijdige 99%-grens = grens van een tweezijdig 98%-CI.
- Een toets kan ook zonder CI (p-waarde of kritieke waarde); het CI geeft extra informatie over de grootte van het effect.

### B1. Toetsrecepten - volledig overzicht (Ottoy, "Test Recipes - Further Reading")
<!-- tool: hypothese -->

| Toets | $H_0$ | Teststatistiek | Referentie | Voorwaarden | Excel |
|---|---|---|---|---|---|
| Z-toets $\mu$ ($\sigma$ bekend) | $\mu=\mu_0$ | $z=\dfrac{\bar{x}-\mu_0}{\sigma/\sqrt{n}}$ | $N(0,1)$ | X normaal of $n$ groot | `NORM.S.DIST`, `NORM.S.INV` |
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

Welch-Satterthwaite: $\nu=\dfrac{(s_1^2/n_1+s_2^2/n_2)^2}{\frac{(s_1^2/n_1)^2}{n_1-1}+\frac{(s_2^2/n_2)^2}{n_2-1}}$.

*Rekenvoorbeelden twee steekproeven (A: $n=12$, B: $n=15$)*: pooled $t=-0{,}559$ (df 25, p $=0{,}581$); Welch $t=-0{,}581$ (p $=0{,}566$); F-voortoets $F=0{,}493$ (tweezijdig p $=0{,}244$). Gepaard voorbeeld ($n=10$): $t=-4{,}524$, p $=0{,}0014$: gepaard ontwerp haalt de variatie tussen stuks weg en is daardoor veel gevoeliger.

### Niet-parametrische toetsen en goodness of fit
<!-- tool: nonparam -->

- **$\chi^2$ GOF Poisson-voorbeeld**: waargenomen (12, 25, 28, 18, 10, 7), $\hat\lambda=2{,}1$, verwacht (12,25; 25,72; 27,00; 18,90; 9,92; 6,21), $\chi^2=0{,}205$, df $=6-1-1=4$, p $=0{,}995$: Poisson niet verworpen.
- **2x2 met Yates**: tabel (30, 10 / 20, 25): $\chi^2=6{,}95$, p $=0{,}0084$.
- Mann-Whitney en Wilcoxon: gebruik als normaliteit twijfelachtig is en $n$ klein; ze toetsen ligging (mediaan), niet het gemiddelde. Grote-steekproefbenadering met continuïteitscorrectie $\pm\frac12$.
- Runs-toets: te weinig runs = clustering/trend; te veel runs = alternerend patroon.

### D. Betrouwbaarheidsintervallen
<!-- tool: hypothese -->

| Parameter | Tweezijdig $(1-\alpha)$-CI | Voorwaarden | Excel |
|---|---|---|---|
| $\mu$, $\sigma$ bekend | $\bar{x}\pm z_{1-\alpha/2}\dfrac{\sigma}{\sqrt{n}}$ | normaal of $n$ groot | `=CONFIDENCE.NORM(α;σ;n)` |
| $\mu$, $\sigma$ onbekend | $\bar{x}\pm t_{1-\alpha/2;n-1}\dfrac{s}{\sqrt{n}}$ | normaal (robuust bij groot $n$) | `=CONFIDENCE.T(α;s;n)` |
| $\sigma^2$ | $\left[\dfrac{(n-1)s^2}{\chi^2_{1-\alpha/2;n-1}}\ ;\ \dfrac{(n-1)s^2}{\chi^2_{\alpha/2;n-1}}\right]$ | normaal, niet robuust | `CHISQ.INV(1-α/2;n-1)`, `CHISQ.INV(α/2;n-1)` |
| $\sigma$ | vierkantswortel van de grenzen voor $\sigma^2$ | idem | `=WORTEL(...)` |
| $\sigma_2^2/\sigma_1^2$ | zie hieronder (A1) | normaal, onafhankelijk | `F.INV` |
| $\pi$ | exact (Clopper-Pearson), zie B2 | binomiaal | `BETA.INV` |
| $\mu_1-\mu_2$ | $\bar{x}_1-\bar{x}_2\pm t_{1-\alpha/2;n_1+n_2-2}\,s_p\sqrt{\frac1{n_1}+\frac1{n_2}}$ | normaal, $\sigma_1=\sigma_2$ | `T.INV` |

Eenzijdig: vervang $\alpha/2$ door $\alpha$ en neem enkel de gewenste grens. Bijvoorbeeld bovengrens voor $\mu$: $\bar{x}+t_{1-\alpha;n-1}\,s/\sqrt{n}$; ondergrens voor $\sigma$: $s\sqrt{(n-1)/\chi^2_{1-\alpha;n-1}}$.

#### CI voor de verhouding van twee varianties (A1, gecorrigeerd)

Pivot: met $\rho=\sigma_2^2/\sigma_1^2$ geldt
$$\frac{s_1^2/\sigma_1^2}{s_2^2/\sigma_2^2}=\frac{s_1^2}{s_2^2}\cdot\rho\ \sim\ F(n_1-1,\,n_2-1)$$
Tweezijdig $(1-\alpha)$-CI (beide grenzen worden **vermenigvuldigd** met een F-kwantiel):
$$\frac{s_2^2}{s_1^2}\,F_{\alpha/2}(n_1{-}1;n_2{-}1)\ \le\ \frac{\sigma_2^2}{\sigma_1^2}\ \le\ \frac{s_2^2}{s_1^2}\,F_{1-\alpha/2}(n_1{-}1;n_2{-}1)$$
Excel: ondergrens `=(s2²/s1²)*F.INV(α/2;n1-1;n2-1)`, bovengrens `=(s2²/s1²)*F.INV(1-α/2;n1-1;n2-1)`.
Eenzijdige ondergrens $(1-\alpha)$: $\dfrac{\sigma_2^2}{\sigma_1^2}\ge\dfrac{s_2^2}{s_1^2}\,F_{\alpha}(n_1-1;n_2-1)$. Als deze ondergrens $>1$: $\sigma_2>\sigma_1$, dus machine 1 nauwkeuriger.
Handig: $F_{\alpha}(a;b)=1/F_{1-\alpha}(b;a)$, dus `F.INV(0,05;9;14)` = `1/F.INV.RT(0,05;14;9)` = 0,3305.
Wil je de verhouding andersom ($\sigma_1^2/\sigma_2^2$), keer dan teller en noemer én de vrijheidsgraden om. Schrijf op het examen altijd expliciet welke variantie in de teller staat.

*Voorbeeldexamen vraag 2*: $s_1^2=0{,}004$ ($n_1=10$), $s_2^2=0{,}015$ ($n_2=15$): $L=\frac{0{,}015}{0{,}004}\cdot0{,}3305=1{,}2395>1$ -> M1 nauwkeuriger (95% eenzijdig).

#### B2. Betrouwbaarheidsinterval voor een fractie: exact, Wilson en normaal (A3)

De cursus gebruikt de **exacte** methode. De normale benadering $p\pm1{,}96\sqrt{p(1-p)/n}$ geeft bij kleine aantallen defecten duidelijk andere (en foute) grenzen: voor $n=100$, $d=4$ is exact **[1,1% ; 9,9%]**, normaal [0,16% ; 7,84%].

**Exact (Clopper-Pearson) - de methode van de slides.** Het interval bevat alle $\pi$ waarvoor de waargenomen $d$ niet in de $\alpha/2$-staarten van de binomiale verdeling valt:
$$\pi_L=\texttt{BETA.INV}\big(\tfrac{\alpha}{2};\,d;\,n-d+1\big),\qquad \pi_U=\texttt{BETA.INV}\big(1-\tfrac{\alpha}{2};\,d+1;\,n-d\big)$$
($d=0\Rightarrow\pi_L=0$; $d=n\Rightarrow\pi_U=1$.) Eenzijdig: vervang $\alpha/2$ door $\alpha$.

| $n=100$, 95% | exact (cursus) | Wilson | normaal (Wald) |
|---|---|---|---|
| $d=0$ | [0% ; 3,6%] | [0% ; 3,7%] | onbruikbaar |
| $d=2$ | [0,3% ; 7,0%] | [0,6% ; 7,0%] | [-0,7% ; 4,7%] |
| $d=4$ | **[1,1% ; 9,9%]** | [1,6% ; 9,8%] | [0,2% ; 7,8%] |

**Wilson (score-interval)** - beste benadering als je geen BETA.INV wil gebruiken:
$$\pi=\frac{p+\frac{z^2}{2n}\pm z\sqrt{\frac{p(1-p)}{n}+\frac{z^2}{4n^2}}}{1+\frac{z^2}{n}}$$
**Normaal (Wald)** $p\pm z\sqrt{p(1-p)/n}$: enkel als er minstens ~5 defecten in de steekproef zitten (slide: bij 1% defecten dus $n\ge500$).
*Eindige populatie:* exact via de hypergeometrische verdeling (`HYPGEOM.DIST`); bij $N=10000$, $n=100$ nauwelijks verschil met binomiaal. Eindige-populatiecorrectie voor de SE: $\sqrt{\frac{N-n}{N-1}}$.
*Les uit de slides:* betrouwbaarheid en nauwkeurigheid zijn een trade-off bij vaste $n$ (4/100: 70% -> [2,1;7,1], 95% -> [1,1;9,9], 99% -> [0,7;12,0]); de breedte halveren vraagt $n\times4$.

### Steekproefgrootte
<!-- tool: hypothese -->

- Gemiddelde, foutmarge $E$ (halve breedte CI): $n=\left(\dfrac{z_{1-\alpha/2}\,\sigma}{E}\right)^2$ (afronden naar boven).
- Fractie: $n=\dfrac{z_{1-\alpha/2}^2\,\pi(1-\pi)}{E^2}$; worst case $\pi=0{,}5$: bij 95% en $E=3\%$: $n=1068$.
- Nauwkeurigheid $\propto1/\sqrt{n}$: 2x nauwkeuriger = 4x zoveel waarnemingen. In theorie kan elke nauwkeurigheid bereikt worden ($SE\to0$), in de praktijk beperkt door kost, meetfout en bias.

#### B3. Steekproefgrootte met $\alpha$ én $\beta$ (onderscheidingsvermogen)

Gemiddelde, eenzijdige toets, verschuiving $\delta$ detecteren met risico's $\alpha$ en $\beta$ (power $1-\beta$):
$$n=\left(\frac{(z_{1-\alpha}+z_{1-\beta})\,\sigma}{\delta}\right)^2\qquad(\text{tweezijdig: }z_{1-\alpha/2})$$
Omgekeerd, $\beta$ bij gegeven $n$ (eenzijdig rechts): $\beta=\Phi\!\left(z_{1-\alpha}-\dfrac{\delta\sqrt{n}}{\sigma}\right)$.
Fractie (normale benadering): $n=\left(\dfrac{z_{1-\alpha}\sqrt{\pi_0(1-\pi_0)}+z_{1-\beta}\sqrt{\pi_1(1-\pi_1)}}{\pi_1-\pi_0}\right)^2$.
Kernboodschap uit de slides: $\alpha$ kies je; $\beta$ volgt uit $\alpha$, $n$ en de werkelijke toestand. $\beta$ verkleinen bij vaste $\alpha$ kan enkel met een grotere steekproef. $\alpha\approx0$ kiezen maakt $\beta$ enorm ("de rechter die nooit een onschuldige veroordeelt, laat iedereen vrij").
*Voorbeeld*: $\alpha=5\%$, $\beta=10\%$, $\delta=0{,}5\sigma$: $n=\left(\frac{1{,}6449+1{,}2816}{0{,}5}\right)^2=34{,}3\Rightarrow n=35$.

### Steekproefmethoden
<!-- tool: steekproeven -->

| Methode | Werkwijze | Voordelen | Nadelen |
|---|---|---|---|
| Enkelvoudig aselect (SRS) | elk element even grote kans, onafhankelijk | eenvoudige theorie | populatielijst nodig; kan strata missen |
| Gestratificeerd | populatie in homogene strata, SRS per stratum | kleinere variantie als strata verschillen; info per stratum | strata en gewichten moeten gekend zijn |
| Cluster | willekeurige clusters (dozen, paletten, filialen) volledig onderzoeken | goedkoop, geen volledige lijst nodig | grotere variantie als clusters intern gelijkaardig zijn |
| Systematisch | elk $k$-de element, $k=N/n$, random start | eenvoudig in productie | gevaarlijk bij periodiciteit (cyclus in proces) |

**Gestratificeerd schatten** (gewichten $W_h=N_h/N$):
$$\hat\pi_{st}=\sum_h W_h\,p_h,\qquad Var(\hat\pi_{st})=\sum_h W_h^2\,\frac{\pi_h(1-\pi_h)}{n_h}$$
- Proportionele allocatie $n_h=W_hn$: $Var=\dfrac{1}{n}\sum_h W_h\pi_h(1-\pi_h)$.
- Neyman (optimale) allocatie: $n_h=n\,\dfrac{W_hS_h}{\sum_j W_jS_j}$ met $S_h=\sqrt{\pi_h(1-\pi_h)}$ (of $\sigma_h$); $Var=\dfrac{(\sum_h W_hS_h)^2}{n}$. Meer stuks waar de spreiding groot is.

*Voorbeeld*: $W_A=0{,}6$, $W_B=0{,}4$, $\pi_A=3\%$, $\pi_B=0{,}5\%$, $n=100$ ($\pi=2\%$):

| Methode | $Var(\hat\pi)$ | Opmerking |
|---|---|---|
| SRS | $0{,}02\cdot0{,}98/100=0{,}000196$ | |
| Proportioneel ($n_A=60$, $n_B=40$) | $0{,}0001945$ | iets kleiner dan SRS |
| Neyman | $0{,}0001705$ | $n_A=78{,}4\approx78$, $n_B\approx22$ |

**Non-response bias**: elementen die geselecteerd werden maar niet antwoorden/meetbaar zijn, verschillen vaak systematisch van de rest. Kan bij **elke** selectiemethode optreden (ook cluster), want het ontstaat na de selectie. Andere bronnen van bias: selectiebias (frame dekt populatie niet), meetbias.

### E. Aanvaardingssteekproeven (acceptance sampling)
<!-- tool: steekproeven -->

- Doel: beslissen over een lot (aanvaarden/afkeuren), niet de kwaliteit verbeteren. Begrippen: **AQL** (acceptable quality level, producer's risk $\alpha$), **LQL/LTPD/RQL** (limiting quality, consumer's risk $\beta$), OC-curve, AOQ (average outgoing quality) $\approx\pi\,P_{acc}(\pi)$ bij rectificerende inspectie, AOQL = max AOQ.
- Enkelvoudig plan voor attributen $(n,c)$: neem $n$ stuks, aanvaard als aantal defecten $d\le c$.

#### B4. OC-curve en ontwerp van een aanvaardingsplan (rekenkant)

Enkelvoudig plan $(n,c)$, lotfractie $\pi$:
$$P_{acc}(\pi)=P[d\le c]=\sum_{i=0}^{c}\binom{n}{i}\pi^i(1-\pi)^{n-i}=\texttt{BINOM.DIST}(c;n;\pi;\text{WAAR})$$
$$\alpha=1-P_{acc}(AQL)\ (\text{producer's risk}),\qquad \beta=P_{acc}(LQL)\ (\text{consumer's risk})$$

| Plan | $P_{acc}(2\%)$ | $\alpha$ | $P_{acc}(8\%)=\beta$ |
|---|---|---|---|
| (100, 4) | 0,949 | 5,1% | 9,0% |
| (130, 5) | 0,953 | 4,7% | 4,7% |

(Hypergeometrisch met $N=10000$, $D=200$: $P_{acc}=0{,}950$.) **Ontwerp:** zoek de kleinste $n$ (met bijhorende $c$) zodat $P_{acc}(AQL)\ge1-\alpha$ én $P_{acc}(LQL)\le\beta$. Hogere $c$ bij vaste $n$: kleinere $\alpha$, grotere $\beta$.
**Dubbel plan** $(n_1,c_1,c_2)+(n_2,c_3)$: $P_{acc}=P[d_1\le c_1]+\sum_{d_1=c_1+1}^{c_2-1}P[d_1]\cdot P[d_2\le c_3-d_1]$; gemiddelde steekproefgrootte $ASN=n_1+n_2\cdot P[c_1<d_1<c_2]$. Equivalente plannen = zelfde OC-curve; dubbel/sequentieel is efficiënter (kleinere ASN). Cursusvoorbeeld: enkelvoudig (175, 8) versus dubbel (90, 2, 7) + (90, 8).
**Sequentieel plan**: na elk stuk beslissen (aanvaarden / afkeuren / verder), met aanvaardings- en afkeurlijnen $d=h_1+sn$ en $d=h_2+sn$; gemiddeld de kleinste ASN.
**p-waarde bij acceptance sampling:** $P[d\ge d_{obs}\mid\pi=AQL]$.
Ideale OC-curve = verticale stap bij de grenswaarde; enkel bereikbaar met 100%-controle (en dan nog niet bij inspectiefouten).

#### Plan voor variabelen $(n,k)$ en B6: hoe $k$ berekenen

Meet $n$ stuks, bereken $\bar{x}$ en $s$. Met ondergrens $\xi$ (LSL): aanvaard als $Q=(\bar{x}-\xi)/s\ge k$ (bovengrens: $Q=(\xi_U-\bar{x})/s\ge k$). Veronderstelt normaliteit.
Exact: $k=\dfrac{t'_{1-\alpha}\big(n-1;\ z_{1-p_0}\sqrt{n}\big)}{\sqrt{n}}$ (niet-centrale t). Benadering (Natrella):
$$k\approx\frac{z_{1-p_0}+\sqrt{z_{1-p_0}^2-ab}}{a},\quad a=1-\frac{z_{1-\alpha}^2}{2(n-1)},\quad b=z_{1-p_0}^2-\frac{z_{1-\alpha}^2}{n}$$
Voorbeeld $n=20$, $p_0=AQL=2\%$, $\alpha=5\%$: $k=2{,}93$ (exact), 2,91 (benadering). Aanvaard als $Q=(\bar{x}-\xi)/s\ge k$. Variabelenplannen zijn efficiënter dan attribuutplannen (meer informatie per stuk).
Met $\sigma$ bekend: $Q=(\bar{x}-\xi)/\sigma$ en $k=z_{1-p_0}-z_{1-\alpha}/\sqrt{n}$.

### F. Lotdefecten bij gekende Cpk

#### B5. Defecten per lot bij gekende capabiliteit
<!-- tool: steekproeven -->

Defecten onafhankelijk -> aantal defecten $i$ in een lot van $N$ is binomiaal: $P(i)=\binom{N}{i}\pi^i(1-\pi)^{N-i}$. $C_{pk}=1$ (gecentreerd): $\pi=0{,}27\%$, $N=10000$ -> $E[i]=27$, praktisch tussen ~12 en ~44 ($P(i\le12)=0{,}10\%$, $P(i\ge44)=0{,}16\%$). $C_{pk}=1{,}33$: $\pi=0{,}0063\%$ -> $E[i]=0{,}6$, nooit meer dan ~3. Een lot met 100 defecten bij $C_{pk}=1$ is zo onwaarschijnlijk dat het proces veranderd moet zijn.
Excel: `=BINOM.DIST(12;10000;0,0027;WAAR)`.

---

## Les 3 - Regressie, ANOVA en DOE

### A. Enkelvoudige lineaire regressie
<!-- tool: regressie -->

Model $Y_i=\beta_0+\beta_1x_i+\varepsilon_i$, $\varepsilon_i\sim N(0,\sigma^2)$ iid.
$$S_{xx}=\sum(x_i-\bar{x})^2,\quad S_{xy}=\sum(x_i-\bar{x})(y_i-\bar{y}),\quad S_{yy}=\sum(y_i-\bar{y})^2$$
$$b_1=\frac{S_{xy}}{S_{xx}},\qquad b_0=\bar{y}-b_1\bar{x}$$
- Kwadratensommen: $SST=SSR+SSE$ met $SST=S_{yy}$, $SSR=b_1S_{xy}=\sum(\hat{y}_i-\bar{y})^2$, $SSE=\sum(y_i-\hat{y}_i)^2$.
- $R^2=SSR/SST$ (fractie verklaarde variatie); $r=\dfrac{S_{xy}}{\sqrt{S_{xx}S_{yy}}}$, $R^2=r^2$ (teken van $r$ = teken van $b_1$).
- Residuele standaardafwijking: $s=\sqrt{MSE}=\sqrt{SSE/(n-2)}$.
- $se(b_1)=\dfrac{s}{\sqrt{S_{xx}}}$, $\ se(b_0)=s\sqrt{\dfrac1n+\dfrac{\bar{x}^2}{S_{xx}}}$.
- Toets helling $H_0:\beta_1=0$: $t=b_1/se(b_1)\sim t(n-2)$; equivalent $F=MSR/MSE=t^2\sim F(1,n-2)$. CI: $b_1\pm t_{1-\alpha/2;n-2}\,se(b_1)$.
- **CI voor de gemiddelde respons** bij $x_0$:
$$\hat{y}_0\pm t_{1-\alpha/2;n-2}\;s\sqrt{\frac1n+\frac{(x_0-\bar{x})^2}{S_{xx}}}$$
- **Predictie-interval (PI) voor een nieuwe waarneming** bij $x_0$ (altijd breder):
$$\hat{y}_0\pm t_{1-\alpha/2;n-2}\;s\sqrt{1+\frac1n+\frac{(x_0-\bar{x})^2}{S_{xx}}}$$
- Intervallen zijn het smalst bij $x_0=\bar{x}$; extrapoleren buiten het databereik is gevaarlijk.

*Rekenvoorbeeld* ($x=1..12$, $n=12$): $b_0=2{,}512$, $b_1=1{,}863$, $R^2=0{,}9775$, $MSE=1{,}142$, $se(b_1)=0{,}0894$, $F=434{,}6$ (p $=1{,}4\cdot10^{-9}$). Bij $x_0=7{,}5$: $\hat{y}_0=16{,}485$, 95%-CI gemiddelde [15,769 ; 17,200], 95%-PI [13,998 ; 18,971].
Excel: `=SLOPE(y;x)`, `=INTERCEPT(y;x)`, `=RSQ(y;x)`, `=STEYX(y;x)`, `=LINEST(y;x;WAAR;WAAR)`, `=CORREL(x;y)`.

### B. Meervoudige regressie
<!-- tool: regressie -->

- Matrixvorm: $\mathbf{y}=\mathbf{X}\boldsymbol\beta+\boldsymbol\varepsilon$, $\ \mathbf{b}=(\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$, $\ Cov(\mathbf{b})=\sigma^2(\mathbf{X}^T\mathbf{X})^{-1}$, $\ \hat\sigma^2=MSE=\dfrac{SSE}{n-k-1}$ ($k$ = aantal verklarende variabelen).
- ANOVA-tabel: regressie df $=k$, residu df $=n-k-1$, totaal df $=n-1$; $F=\dfrac{SSR/k}{SSE/(n-k-1)}\sim F(k,n-k-1)$ toetst $H_0:\beta_1=\dots=\beta_k=0$.
- Per coëfficiënt: $t_j=b_j/se(b_j)\sim t(n-k-1)$.
- **Adjusted $R^2$**:
$$R^2_{adj}=1-(1-R^2)\frac{n-1}{n-k-1}$$
(De slide schrijft $n-k-2$ in de noemer; Excel en dit formularium gebruiken $n-k-1$.) $R^2$ stijgt altijd met extra variabelen, $R^2_{adj}$ enkel als de variabele genoeg bijdraagt.
- Multicollineariteit: sterk gecorreleerde $X$'en geven instabiele $b_j$ met grote $se$; VIF $=1/(1-R_j^2)$, probleem als VIF > 5 à 10.
- Categorische variabelen via dummy's (0/1), interacties via productterm $x_1x_2$, kromming via $x^2$.

*Rekenvoorbeeld* ($n=15$, $k=2$): $\hat{y}=3{,}393+1{,}193\,x_1-0{,}943\,x_2$, $R^2=0{,}9590$, $R^2_{adj}=1-0{,}0410\cdot\frac{14}{12}=0{,}9522$, $F=140{,}4$ (p $=4{,}7\cdot10^{-9}$).

### C. Residuanalyse

Controleer de aannames met de residuen $e_i=y_i-\hat{y}_i$:
- residuen vs $\hat{y}$ of $x$: geen patroon (anders: kromming -> term toevoegen; trechter -> niet-constante variantie -> transformatie, bv. log);
- normal probability plot / histogram: normaliteit;
- residuen in tijdsvolgorde: onafhankelijkheid (geen trend of autocorrelatie);
- uitschieters (gestandaardiseerd residu $>\lvert 3\rvert$) en invloedrijke punten (hoge leverage, Cook's distance).

### D. ANOVA
<!-- tool: anova -->

**One-way ANOVA** ($k$ groepen, $N$ waarnemingen, $n_i$ per groep): $H_0:\mu_1=\dots=\mu_k$.

| Bron | SS | df | MS | F |
|---|---|---|---|---|
| Tussen (behandeling) | $SS_{Tr}=\sum_i n_i(\bar{y}_i-\bar{y})^2$ | $k-1$ | $MS_{Tr}=SS_{Tr}/(k-1)$ | $MS_{Tr}/MS_E$ |
| Binnen (fout) | $SS_E=\sum_i\sum_j(y_{ij}-\bar{y}_i)^2$ | $N-k$ | $MS_E=SS_E/(N-k)$ | |
| Totaal | $SST=\sum_i\sum_j(y_{ij}-\bar{y})^2$ | $N-1$ | | |

p-waarde `=F.DIST.RT(F;k-1;N-k)`. Voorwaarden: normaal, gelijke varianties, onafhankelijk. Bij verwerpen: paarsgewijze vergelijking (Tukey, Bonferroni: $\alpha/m$). $MS_E$ schat $\sigma^2$.
*Rekenvoorbeeld* (3 groepen van 4): $F=12{,}72$, df (2; 9), p $=0{,}0024$: verwerp $H_0$.

**Two-way zonder herhaling** (factor A met $a$ niveaus, B met $b$ niveaus, 1 waarneming per cel, bv. blokken):

| Bron | SS | df |
|---|---|---|
| A | $b\sum_i(\bar{y}_{i\cdot}-\bar{y})^2$ | $a-1$ |
| B | $a\sum_j(\bar{y}_{\cdot j}-\bar{y})^2$ | $b-1$ |
| Fout | $SST-SS_A-SS_B$ | $(a-1)(b-1)$ |
| Totaal | $SST$ | $ab-1$ |

Interactie niet schatbaar (zit in de fout).

**Two-way met herhaling** ($n$ per cel):

| Bron | SS | df |
|---|---|---|
| A | $bn\sum_i(\bar{y}_{i\cdot\cdot}-\bar{y})^2$ | $a-1$ |
| B | $an\sum_j(\bar{y}_{\cdot j\cdot}-\bar{y})^2$ | $b-1$ |
| AB | $n\sum_{i,j}(\bar{y}_{ij\cdot}-\bar{y}_{i\cdot\cdot}-\bar{y}_{\cdot j\cdot}+\bar{y})^2$ | $(a-1)(b-1)$ |
| Fout | $\sum(y_{ijk}-\bar{y}_{ij\cdot})^2$ | $ab(n-1)$ |
| Totaal | $SST$ | $abn-1$ |

$F$ = MS van de bron / $MS_E$. Significante interactie: hoofdeffecten niet los interpreteren (interactieplot: niet-evenwijdige lijnen).
Excel: Data Analysis ToolPak "Anova: Single Factor", "Two-Factor With/Without Replication".

### E. DOE-principes
<!-- tool: doe -->

- **Randomisatie**: volgorde van runs at random -> beschermt tegen onbekende storende factoren (tijd, drift); maakt causale conclusies mogelijk.
- **Blocking**: gekende storende factor (batch, dag, operator) als blok opnemen; vergelijkingen binnen een blok -> kleinere foutvariantie.
- **Herhaling (replication)**: onafhankelijke herhaling van elke run -> schatting van de zuivere fout ($MS_E$) en meer power. Herhaalde meting van dezelfde run is geen echte replicatie.
- Factoriële proeven zijn efficiënter dan one-factor-at-a-time (OFAT) en tonen interacties.
- Centerpunten: toets op kromming en schatting van de fout zonder volledige replicatie.

### F. $2^k$ factoriële proeven
<!-- tool: doe -->

$k$ factoren op 2 niveaus ($-1$, $+1$), $n$ replicaties, $N=n\,2^k$ runs. Standaard (Yates-) volgorde: (1), a, b, ab, c, ac, bc, abc, ...

**Tekentabel $2^2$**:

| Run | I | A | B | AB |
|---|---|---|---|---|
| (1) | + | - | - | + |
| a | + | + | - | - |
| b | + | - | + | - |
| ab | + | + | + | + |

Interactiekolom = product van de hoofdkolommen. Met $y_{(\cdot)}$ = **som** over de $n$ replicaties:
$$\text{Contrast}_A=\sum(\text{teken}_A)\cdot y_{(\cdot)},\qquad \text{Effect}_A=\frac{\text{Contrast}_A}{n\,2^{k-1}},\qquad SS_A=\frac{\text{Contrast}_A^2}{n\,2^k}$$
- Effect = gemiddelde respons op $+$ min gemiddelde op $-$. Regressiecoëfficiënt = effect/2.
- Elke SS heeft df $=1$; $SS_E=SST-\sum SS_{\text{effecten}}$ met df $=2^k(n-1)$.
- $se(\text{effect})=\sqrt{\dfrac{MS_E}{n\,2^{k-2}}}$, benaderend 95%-CI: effect $\pm2\,se$. Effect significant als het CI 0 niet bevat ($t=\text{effect}/se$, df $=2^k(n-1)$).
- $n=1$ (geen replicatie): geen $MS_E$; gebruik normal/half-normal plot of Pareto van de effecten, of pool hogere-orde interacties als fout.

*Rekenvoorbeeld $2^2$, $n=2$*: (1) = 28, 25 (som 53); a = 36, 32 (68); b = 18, 19 (37); ab = 31, 30 (61).

| Effect | Contrast | Effect | SS | F | p |
|---|---|---|---|---|---|
| A | $68+61-37-53=39$ | $39/4=9{,}75$ | $39^2/8=190{,}125$ | 56,33 | 0,0017 |
| B | $37+61-68-53=-23$ | $-5{,}75$ | 66,125 | 19,59 | 0,0115 |
| AB | $53+61-68-37=9$ | 2,25 | 10,125 | 3,00 | 0,158 |
| Fout | | | 13,5 (df 4, $MS_E=3{,}375$) | | |
| Totaal | | | 279,875 (df 7) | | |

$se(\text{effect})=\sqrt{3{,}375/2}=1{,}299$; CI A: $9{,}75\pm2{,}60$, B: $-5{,}75\pm2{,}60$ (beide significant), AB: $2{,}25\pm2{,}60$ bevat 0 (niet significant).

### G. Fractionele factoriële proeven $2^{k-p}$
<!-- tool: doe -->

- Halve fractie $2^{k-1}$: kies een **generator**, bv. $C=AB$ voor $2^{3-1}$; **defining relation** $I=ABC$.
- **Aliassen**: vermenigvuldig met de defining relation (kwadraten = I): $A\cdot ABC=BC$, dus $A=BC$, $B=AC$, $C=AB$. Gealiaste effecten zijn niet te onderscheiden; het geschatte contrast schat hun som.
- **Resolutie** = lengte van het kortste woord in de defining relation:

| Resolutie | Betekenis | Voorbeeld |
|---|---|---|
| III | hoofdeffecten gealiast met 2-factorinteracties | $2^{3-1}$, $I=ABC$ |
| IV | hoofdeffecten vrij van 2fi, 2fi onderling gealiast | $2^{4-1}$, $I=ABCD$ ($D=ABC$) |
| V | hoofdeffecten en 2fi vrij (gealiast met 3fi of hoger) | $2^{5-1}$, $I=ABCDE$ |

- Principe "sparsity of effects": hogere-orde interacties zijn meestal verwaarloosbaar, dus een fractie verliest weinig informatie. Screening met resolutie III/IV, daarna uitbreiden (fold-over).

---

## Les 4 - Capabiliteit en SPC

### A. Capabiliteitsindices
<!-- tool: capabiliteit -->

$$C_p=\frac{USL-LSL}{6\sigma_{ST}},\qquad C_{pk}=\min\left(\frac{USL-\mu}{3\sigma_{ST}},\ \frac{\mu-LSL}{3\sigma_{ST}}\right)$$
$$P_p=\frac{USL-LSL}{6\sigma_{LT}},\qquad P_{pk}=\min\left(\frac{USL-\mu}{3\sigma_{LT}},\ \frac{\mu-LSL}{3\sigma_{LT}}\right)$$
- $C_p$ = potentiële capabiliteit (spreiding t.o.v. tolerantie, ongeacht ligging); $C_{pk}$ houdt ook rekening met de centrering. $C_{pk}\le C_p$, gelijk als gecentreerd.
- Eenzijdige specificatie: enkel $C_{pk}$ ($C_{pu}$ of $C_{pl}$).
- **Korte termijn** ($\sigma_{ST}$, binnen subgroepen, $C_p/C_{pk}$) vs **lange termijn** ($\sigma_{LT}$, totale spreiding inclusief verschuivingen tussen subgroepen, $P_p/P_{pk}$). Voor een stabiel proces $\sigma_{ST}\approx\sigma_{LT}$.
- Schatters van $\sigma$:

| Schatter | Formule | Gebruik |
|---|---|---|
| uit gemiddelde range | $\hat\sigma=\bar{R}/d_2$ | korte termijn, $n\le10$ |
| uit gemiddelde s | $\hat\sigma=\bar{s}/c_4$ | korte termijn, grotere $n$ |
| totale s | $s=\sqrt{\frac{\sum(x_i-\bar{x})^2}{N-1}}$ | lange termijn ($P_p$, $P_{pk}$) |

- Vereiste $\sigma$ voor een doel-$C_{pk}$: $\sigma=\dfrac{\min(USL-\mu,\ \mu-LSL)}{3\,C_{pk}}$.
- Voorwaarden: proces **stabiel** (onder controle) en (ongeveer) normaal. Capabiliteit van een onstabiel proces is betekenisloos.

### B. Percentage uitval via z
<!-- tool: capabiliteit -->

$$z_U=\frac{USL-\mu}{\sigma},\quad z_L=\frac{\mu-LSL}{\sigma},\quad P(\text{uitval})=1-\Phi(z_U)+1-\Phi(z_L)$$
Verband: $z_{\min}=3C_{pk}$; gecentreerd: uitval $=2\,(1-\Phi(3C_p))$.
Excel: `=1-NORM.DIST(USL;μ;σ;WAAR)+NORM.DIST(LSL;μ;σ;WAAR)`.

*Voorbeeldexamen vraag 3* (LSL 1400, USL 1460, $\mu=1440$, $\sigma=10$): $C_p=60/60=1{,}00$, $C_{pk}=\min(20/30;\ 40/30)=0{,}67$ (USL beperkend). Uitval boven: $1-\Phi(2)=2{,}275\%$, onder: $\Phi(-4)=0{,}003\%$, totaal $2{,}28\%$. Gecentreerd op 1430: $2(1-\Phi(3))=0{,}27\%$.

*Capabiliteitsoefening "as" (slide 42, A6)*: slide: $C_p=1{,}17$, $C_{pk}=0{,}67$, "uitval 5% of 2,5% eenzijdig". De juiste uitval is $P(Z<-2)=$ **2,28%** (bovenzijde $z=+5$ verwaarloosbaar). Gecentreerd ($\mu=72{,}1$): $z=\pm3{,}5$ -> 2 x 233 ppm = **465 ppm** (slide: 400 ppm). Strikt genomen is $\hat\sigma=\bar{s}/c_4=0{,}2/0{,}940=0{,}213$ (dan $C_p=1{,}10$, $C_{pk}=0{,}63$); de slide gebruikt $\bar{s}$ rechtstreeks. Op het examen: vermeld welke $\sigma$ je gebruikt.

### C. Beoordelingstabel capabiliteit

| $C_p$ / $C_{pk}$ | Oordeel | Uitval (gecentreerd, korte termijn) |
|---|---|---|
| $<1$ | niet capabel | $>0{,}27\%$ |
| $1$ tot $1{,}33$ | net / beperkt capabel, strikte opvolging | 0,27% tot 63 ppm |
| $1{,}33$ tot $1{,}67$ | capabel (gangbare minimumeis) | 63 ppm tot 0,6 ppm |
| $\ge1{,}67$ | goed capabel (eis kritische kenmerken) | $<0{,}6$ ppm |
| $2$ ($C_{pk}=1{,}5$ na shift) | Six Sigma (world class) | 0,002 ppm korte termijn; 3,4 ppm lange termijn |

### D. Discrete capabiliteit: DPU, DPO, DPMO, yield, sigma-niveau
<!-- tool: capabiliteit -->

Met $D$ = aantal defecten, $N$ = aantal eenheden, $O$ = aantal kansen op een defect per eenheid:
$$DPU=\frac{D}{N},\qquad DPO=\frac{D}{N\cdot O},\qquad DPMO=DPO\times10^6$$
- Yield (first pass) $=1-\dfrac{\text{defectieve eenheden}}{N}$; via Poisson: $Y=e^{-DPU}$. Rolled throughput yield $RTY=\prod_i Y_i$.
- **Sigma-niveau met 1,5σ-shift**: lange termijn $Z_{LT}=\Phi^{-1}(1-DPMO/10^6)$, korte termijn sigma-niveau $Z_{ST}=Z_{LT}+1{,}5$.
$$DPMO=10^6\left(1-\Phi(Z_{ST}-1{,}5)\right)$$
Excel: sigma-niveau `=NORM.S.INV(1-DPMO/1000000)+1,5`; DPMO `=(1-NORM.S.DIST(Z-1,5;WAAR))*1000000`.

| Sigma-niveau (ST) | DPMO (LT, 1,5σ-shift) | Yield |
|---|---|---|
| 1 | 691 462 | 30,9% |
| 2 | 308 538 | 69,1% |
| 3 | 66 807 | 93,3% |
| 4 | 6 210 | 99,38% |
| 5 | 233 | 99,977% |
| 6 | 3,4 | 99,99966% |

**6 sigma-criterium (A7)**: primair antwoord **3,4 ppm = 0,00034%** (lange termijn, met 1,5σ-shift; slide "Technical definition": $C_p=2$, $C_{pk}=1{,}5$). Een perfect gecentreerd 6σ-proces geeft op korte termijn ~0,002 ppm (2 per miljard) (slide "Cp = 2: 2 defects per billion, short term"). Vermeld beide lezingen.

### E. Stabiliteit, oorzaken van variatie en regelkaarten
<!-- tool: spc -->

- **Stabiliteit** (statistisch onder controle: enkel gewone oorzaken, voorspelbaar) is iets anders dan **capabiliteit** (voldoet aan de specificaties). Een proces kan stabiel en niet capabel zijn (A5), of capabel maar instabiel.
- **Gewone oorzaken (common causes)**: vele kleine, altijd aanwezige bronnen van variatie; inherent aan het systeem; aanpak = systeem/proces veranderen (management).
- **Speciale / toewijsbare oorzaken (special, assignable causes)**: sporadisch, identificeerbaar (gereedschapsbreuk, nieuwe batch, operatorfout); worden door de regelkaart gedetecteerd; aanpak = lokaal opsporen en wegnemen.
- **Tampering (overcontrol)**: bijregelen op basis van gewone variatie verhoogt de variatie (Deming funnel: tot $\sqrt2\,\sigma$ bij elke keer compenseren). Enkel ingrijpen bij een signaal.
- Waarom normaal? De kaart werkt met **subgroepgemiddelden**: door de **centrale limietstelling** zijn die bij benadering normaal, ook als de individuele waarden dat niet zijn. Daardoor gelden de $\pm3\sigma_{\bar{x}}$-grenzen met vals-alarmkans 0,27% per punt.
- Fase I (grenzen opstellen uit historische data, punten met toewijsbare oorzaak verwijderen en herberekenen) en fase II (bewaken).
- Rationele subgroepen: binnen een subgroep enkel korte-termijnvariatie (opeenvolgende stuks), tussen subgroepen mogelijke verschuivingen.

### F. $\bar{X}$-R en $\bar{X}$-s kaarten
<!-- tool: spc -->

$m$ subgroepen van grootte $n$; $\bar{\bar{X}}$ = gemiddelde van de subgroepgemiddelden.

| Kaart | CL | UCL | LCL |
|---|---|---|---|
| $\bar{X}$ (met R) | $\bar{\bar{X}}$ | $\bar{\bar{X}}+A_2\bar{R}$ | $\bar{\bar{X}}-A_2\bar{R}$ |
| R | $\bar{R}$ | $D_4\bar{R}$ | $D_3\bar{R}$ |
| $\bar{X}$ (met s) | $\bar{\bar{X}}$ | $\bar{\bar{X}}+A_3\bar{s}$ | $\bar{\bar{X}}-A_3\bar{s}$ |
| s | $\bar{s}$ | $B_4\bar{s}$ | $B_3\bar{s}$ |
| $\bar{X}$, $\sigma$ bekend | $\mu$ | $\mu+3\sigma/\sqrt{n}$ | $\mu-3\sigma/\sqrt{n}$ |

Relaties: $A_2=\dfrac{3}{d_2\sqrt{n}}$, $A_3=\dfrac{3}{c_4\sqrt{n}}$.

**Wanneer R, wanneer s?** Range voor kleine subgroepen ($n\le10$; cursus: $n<10$): eenvoudig te berekenen en bijna even efficiënt als s. Voor grotere $n$ (of variabele $n$) de s-kaart: de range gebruikt enkel 2 waarden en verliest dan informatie.

**Controlekaartconstanten** (AIAG):

| $n$ | $A_2$ | $A_3$ | $d_2$ | $D_3$ | $D_4$ | $B_3$ | $B_4$ | $c_4$ |
|---|---|---|---|---|---|---|---|---|
| 2 | 1,880 | 2,659 | 1,128 | 0 | 3,267 | 0 | 3,267 | 0,7979 |
| 3 | 1,023 | 1,954 | 1,693 | 0 | 2,574 | 0 | 2,568 | 0,8862 |
| 4 | 0,729 | 1,628 | 2,059 | 0 | 2,282 | 0 | 2,266 | 0,9213 |
| 5 | 0,577 | 1,427 | 2,326 | 0 | 2,114 | 0 | 2,089 | 0,9400 |
| 6 | 0,483 | 1,287 | 2,534 | 0 | 2,004 | 0,030 | 1,970 | 0,9515 |
| 7 | 0,419 | 1,182 | 2,704 | 0,076 | 1,924 | 0,118 | 1,882 | 0,9594 |
| 8 | 0,373 | 1,099 | 2,847 | 0,136 | 1,864 | 0,185 | 1,815 | 0,9650 |
| 9 | 0,337 | 1,032 | 2,970 | 0,184 | 1,816 | 0,239 | 1,761 | 0,9693 |
| 10 | 0,308 | 0,975 | 3,078 | 0,223 | 1,777 | 0,284 | 1,716 | 0,9727 |
| 15 | 0,223 | 0,789 | 3,472 | 0,347 | 1,653 | 0,428 | 1,572 | 0,9823 |
| 20 | 0,180 | 0,680 | 3,735 | 0,415 | 1,585 | 0,510 | 1,490 | 0,9869 |
| 25 | 0,153 | 0,606 | 3,931 | 0,459 | 1,541 | 0,565 | 1,435 | 0,9896 |

*SPC-oefening 2 (A5)*. In het oefenblad staan UCL 16,9 / LCL 15,7: dat zijn **geen** $\bar{X}$-kaartgrenzen. Correct ($n=5$, 20 subgroepen):
- $\bar{\bar{X}}=16{,}266$, $\bar{R}=0{,}480$ -> $\bar{X}$-kaart: UCL $=16{,}266+0{,}577\cdot0{,}480=16{,}543$, LCL $=15{,}989$; R-kaart: UCL $=D_4\bar{R}=1{,}015$, LCL $=0$.
- Alternatief $\bar{X}$-s: $\bar{s}=0{,}1958$ -> UCL/LCL $=16{,}545/15{,}987$; s-kaart UCL $=0{,}409$.
- Geen enkel punt buiten de grenzen -> proces statistisch onder controle.
- Capabiliteit (specs $16{,}2\pm0{,}5$): $\hat\sigma=\bar{R}/d_2=0{,}206$ -> $C_p=0{,}81$, $C_{pk}=0{,}70$ (bovenzijde beperkend), verwachte uitval $\approx2{,}1\%$. Onder controle maar **niet capabel**. (Lange termijn: $s=0{,}202$, $P_p=0{,}82$, $P_{pk}=0{,}72$.)

*SPC-oefening 3* (24 subgroepen, $n=5$): $\bar{\bar{X}}=34{,}0$, $\bar{R}=1{,}767$ -> $\bar{X}$-kaart [32,98 ; 35,02], R-kaart UCL 3,735. Subgroep 9 ($\bar{x}=35{,}0$) ligt net binnen de UCL 35,02: bespreek (grensgeval, onderzoeken).

### G. Western Electric regels
<!-- tool: spc -->

Zones: A = tussen 2σ en 3σ, B = tussen 1σ en 2σ, C = binnen 1σ (σ van het geplotte kenmerk, voor $\bar{X}$: $\sigma/\sqrt{n}$).

| Regel | Signaal | Wijst op |
|---|---|---|
| 1 | 1 punt buiten 3σ | plotse grote verstoring |
| 2 | 2 van 3 opeenvolgende punten buiten 2σ, zelfde kant | verschuiving |
| 3 | 4 van 5 opeenvolgende punten buiten 1σ, zelfde kant | kleine verschuiving |
| 4 | 8 opeenvolgende punten aan dezelfde kant van de centerlijn | blijvende verschuiving |

Extra regels (Nelson): 6 punten op rij stijgend/dalend (trend), 14 punten afwisselend op/neer, 15 punten binnen zone C (te weinig variatie: stratificatie of foute grenzen). Meer regels = snellere detectie maar meer vals alarm.

### B7. SPC: andere subgroepgrootte, detectiekans en ARL (oefening 4)
<!-- tool: spc -->

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
Excel: `=NORM.S.DIST(3-2*WORTEL(5);WAAR)-NORM.S.DIST(-3-2*WORTEL(5);WAAR)` = 0,0705.

### H. Attribuutkaarten (kort)

| Kaart | Kenmerk | Grenzen |
|---|---|---|
| p | fractie defectief, $n$ per subgroep | $\bar{p}\pm3\sqrt{\bar{p}(1-\bar{p})/n}$ |
| np | aantal defectief, vaste $n$ | $n\bar{p}\pm3\sqrt{n\bar{p}(1-\bar{p})}$ |
| c | aantal defecten per eenheid | $\bar{c}\pm3\sqrt{\bar{c}}$ |
| u | defecten per eenheid, variabele grootte | $\bar{u}\pm3\sqrt{\bar{u}/n_i}$ |
| I-MR | individuele waarden | $\bar{x}\pm2{,}66\,\overline{MR}$; MR-kaart UCL $=3{,}267\,\overline{MR}$ |

LCL < 0 wordt 0.

---

## Les 5 - MSA en simulatie

### A. Meetsysteemanalyse: begrippen (SWIPE)
<!-- tool: msa -->

- **SWIPE**: bronnen van meetvariatie: Standard (referentie/kalibratie), Workpiece (stuk), Instrument, Person (operator, procedure), Environment (temperatuur, trillingen).
- **Bias** (juistheid, accuracy): verschil tussen gemiddelde meting en referentiewaarde. Toets: $t=\dfrac{\bar{x}-x_{ref}}{s/\sqrt{n}}\sim t(n-1)$.
- **Lineariteit**: verandert de bias over het meetbereik? Regressie van bias op referentiewaarde; toets helling $=0$ (en intercept $=0$).
- **Stabiliteit**: bias/spreiding constant in de tijd (regelkaart op een referentiestuk).
- **Herhaalbaarheid (repeatability, EV)**: variatie bij herhaald meten door dezelfde operator, zelfde instrument, zelfde stuk (equipment variation).
- **Reproduceerbaarheid (reproducibility, AV)**: variatie tussen operatoren (appraiser variation).
- **GRR**: $\sigma^2_{GRR}=\sigma^2_{EV}+\sigma^2_{AV}$; totale variatie $\sigma^2_{TV}=\sigma^2_{GRR}+\sigma^2_{PV}$.
- Resolutie (discriminatie): minstens 1/10 van de tolerantie of van de procesvariatie.

### B. Gauge R&R: Average & Range methode
<!-- tool: msa -->

Opzet: $n$ stuks, $k$ operatoren, $r$ herhalingen.
$$EV=\bar{\bar{R}}\cdot K_1,\qquad AV=\sqrt{(\bar{X}_{diff}\cdot K_2)^2-\frac{EV^2}{n\,r}}$$
$$GRR=\sqrt{EV^2+AV^2},\qquad PV=R_p\cdot K_3,\qquad TV=\sqrt{GRR^2+PV^2}$$
met $\bar{\bar{R}}$ = gemiddelde van de ranges per operator per stuk, $\bar{X}_{diff}$ = max - min van de operatorgemiddelden, $R_p$ = range van de stukgemiddelden. Als de wortel voor AV negatief is: $AV=0$.
$$\%GRR=100\,\frac{GRR}{TV},\qquad ndc=\left\lfloor1{,}41\,\frac{PV}{GRR}\right\rfloor\ (\text{minstens }5)$$

#### B8. MSA-constanten Average & Range (AIAG)

| $K_1$ (trials) | 2: 0,8862 | 3: 0,5908 |
|---|---|---|
| $K_2$ (operatoren) | 2: 0,7071 | 3: 0,5231 |

$K_3$ (aantal stukken): 2: 0,7071 · 3: 0,5231 · 4: 0,4467 · 5: 0,4030 · 6: 0,3742 · 7: 0,3534 · 8: 0,3375 · 9: 0,3249 · 10: 0,3146.
$\%EV=100\,EV/TV$, $\%AV=100\,AV/TV$, $\%PV=100\,PV/TV$; tolerantie-basis: $\%GRR_{tol}=100\cdot6\,GRR/TOL$. (Controleer tegen `tabel MSA.pdf`.)
($K_1=1/d_2^*$; de $K$'en zijn hier gedefinieerd voor $1\sigma$-waarden, zodat EV, AV, GRR, PV standaardafwijkingen zijn.)

### C. Gauge R&R via ANOVA (variantiecomponenten)
<!-- tool: anova -->

Two-way ANOVA met herhaling: factor Stuk ($p$ niveaus), Operator ($o$), interactie, fout; $r$ herhalingen.
$$\hat\sigma^2_{herh}=MS_E,\qquad \hat\sigma^2_{O\times P}=\frac{MS_{OP}-MS_E}{r},\qquad \hat\sigma^2_{O}=\frac{MS_O-MS_{OP}}{p\,r},\qquad \hat\sigma^2_{P}=\frac{MS_P-MS_{OP}}{o\,r}$$
$$\sigma^2_{EV}=\hat\sigma^2_{herh},\quad \sigma^2_{AV}=\hat\sigma^2_O+\hat\sigma^2_{O\times P},\quad \sigma^2_{GRR}=\sigma^2_{EV}+\sigma^2_{AV},\quad \sigma^2_{TV}=\sigma^2_{GRR}+\hat\sigma^2_P$$
Negatieve schattingen worden 0. Is de interactie niet significant (vaak p > 0,25), pool ze met de fout. ANOVA-methode is nauwkeuriger dan Average & Range en schat de interactie operator x stuk apart. %Contributie (op varianties) $=100\,\sigma^2_{GRR}/\sigma^2_{TV}$; %Study variation (op standaardafwijkingen) $=100\,\sigma_{GRR}/\sigma_{TV}$.

### D. Aanvaardingscriteria en invloed op de capabiliteit
<!-- tool: msa -->

| %GRR (t.o.v. TV of tolerantie) | Oordeel |
|---|---|
| $\le10\%$ | aanvaardbaar |
| $10\%$ tot $30\%$ | eventueel aanvaardbaar, afhankelijk van toepassing en kost |
| $>30\%$ | onaanvaardbaar, meetsysteem verbeteren |

$ndc\ge5$ vereist (aantal te onderscheiden categorieën).
**Waargenomen vs werkelijke capabiliteit**: $\sigma^2_{obs}=\sigma^2_{proces}+\sigma^2_{GRR}$, dus met tolerantie-gebaseerde %GRR (als fractie):
$$\frac{1}{C_{p,o}^2}=\frac{1}{C_{p,a}^2}+\%GRR^2$$
*Voorbeeld (A4)*: bij $\%GRR=60\%$ en werkelijke $C_p=2$: $1/C_{p,o}^2=0{,}25+0{,}36=0{,}61\Rightarrow C_{p,o}=1{,}28$. Conclusie: onaanvaardbaar meetsysteem; het proces lijkt veel slechter dan het is.

### E. Meetonzekerheid
<!-- tool: msa -->

- Standaardonzekerheid $u$: type A (statistisch: $s/\sqrt{n}$), type B (andere informatie: certificaat, resolutie; uniform over $\pm a$: $u=a/\sqrt3$; resolutie $d$: $u=d/\sqrt{12}$).
- Gecombineerde onzekerheid $u_c$; uitgebreide onzekerheid $U=k\,u_c$ ($k=2$ voor ~95%).
- **Propagatie**:
  - som/verschil $y=x_1\pm x_2$: $u_y^2=u_1^2+u_2^2$ (in kwadratuur, ook bij verschil);
  - product/quotiënt $y=x_1x_2$ of $x_1/x_2$: $\left(\dfrac{u_y}{y}\right)^2=\left(\dfrac{u_1}{x_1}\right)^2+\left(\dfrac{u_2}{x_2}\right)^2$;
  - algemeen: $u(f(x))\approx\lvert f'(x)\rvert\,u(x)$; meerdere variabelen: $u_y^2=\sum_i\left(\dfrac{\partial f}{\partial x_i}\right)^2u_i^2$ (onafhankelijk);
  - $y=c\,x$: $u_y=\lvert c\rvert u_x$; $y=x^n$: $u_y/y=\lvert n\rvert\,u_x/x$.
- Conformiteitsbeslissing: guard band, aanvaard enkel als meetwaarde $\pm U$ binnen de specificatie ligt.

### F. Poissonproces en exponentiële tussenaankomsttijden
<!-- tool: wachtrij -->

- Poissonproces met intensiteit $\lambda$: aantal aankomsten in $[0,t]$ is Poisson$(\lambda t)$: $P(N(t)=k)=e^{-\lambda t}\dfrac{(\lambda t)^k}{k!}$; tussenaankomsttijden iid exponentieel met gemiddelde $1/\lambda$.
- **Superpositie**: samenvoegen van onafhankelijke Poissonprocessen $\lambda_1,\lambda_2$ geeft een Poissonproces met $\lambda_1+\lambda_2$.
- **Thinning (splitsen)**: elke aankomst onafhankelijk met kans $p$ naar stroom 1: Poissonprocessen met $p\lambda$ en $(1-p)\lambda$.
- Simulatie: $T=-\ln(U)/\lambda$ met $U\sim$ Uniform(0,1); Excel `=-LN(RAND())/λ` of `=EXPON.DIST` invers.

### G. Wachtrijmodellen M/M/1 en M/M/1/K
<!-- tool: wachtrij -->

**M/M/1** (aankomsten Poisson $\lambda$, bediening exponentieel $\mu$, 1 server, oneindige wachtrij), $\rho=\lambda/\mu<1$:
$$\pi_j=(1-\rho)\rho^j,\quad E[L]=\frac{\rho}{1-\rho},\quad E[W]=\frac{1}{\mu-\lambda},\quad E[L_q]=\frac{\rho^2}{1-\rho},\quad E[W_q]=\frac{\rho}{\mu-\lambda}$$
Little: $E[L]=\lambda E[W]$, $E[L_q]=\lambda E[W_q]$. Bij $\rho\to1$ explodeert de wachttijd.

**M/M/1/K** (maximaal $K$ klanten in het systeem; volle systeem -> klant verloren), $\rho\ne1$:
$$\pi_j=\frac{(1-\rho)\rho^j}{1-\rho^{K+1}},\ j=0,\dots,K,\qquad E[L]=\sum_{j=0}^K j\,\pi_j$$
Effectieve aankomstintensiteit $\lambda_{eff}=\lambda(1-\pi_K)$ (verliescorrectie), dus
$$E[W]=\frac{E[L]}{\lambda(1-\pi_K)}$$
($\rho=1$: $\pi_j=1/(K+1)$.)
*Voorbeeld*: $\lambda=4$, $\mu=5$, $K=6$: $\pi_0=0{,}2531$, $\pi_K=0{,}0663$, $E[L]=2{,}142$, $\lambda_{eff}=3{,}735$, $E[W]=0{,}574$ tijdseenheden.

### H. Monte Carlo simulatie en discrete event simulatie
<!-- tool: wachtrij -->

- Schatting van een verwachting via $n$ onafhankelijke runs: $\bar{y}\pm z_{1-\alpha/2}\dfrac{s}{\sqrt{n}}$ (of $t_{1-\alpha/2;n-1}$ bij kleine $n$). Nauwkeurigheid $\propto1/\sqrt{n}$; voor foutmarge $E$: $n=(z\,s/E)^2$.
- Discrete event simulatie (DES): gebeurtenissenlijst (aankomst, start, einde bediening), simulatieklok; warm-up periode weglaten; meerdere replicaties voor een CI.
- Random getallen: inverse transformatie $X=F^{-1}(U)$, bv. `=NORM.INV(RAND();μ;σ)`.
- **Erlang A** (M/M/c+M): call center met $c$ agenten en **ongeduldige** klanten (abandonment met rate $\theta$, geduld exponentieel). Uitbreiding van Erlang C (M/M/c, geen afhaken); geeft realistischer servicelevel en kans op afhaken. Ook stabiel als $\lambda>c\mu$ (afhakers ontlasten de wachtrij).

---

## Excel-functies (Nederlandse notatie)

Argumentscheiding `;`, decimale komma, logische waarden `WAAR` / `ONWAAR` (WAAR = cumulatief).

### Beschrijvende statistiek

| Doel | Functie |
|---|---|
| Gemiddelde, mediaan | `=AVERAGE(r)`, `=MEDIAN(r)` |
| Steekproefvariantie / -standaardafwijking | `=VAR.S(r)`, `=STDEV.S(r)` |
| Populatievariantie / -standaardafwijking | `=VAR.P(r)`, `=STDEV.P(r)` |
| Kwadratensom $\sum(x-\bar{x})^2$ | `=DEVSQ(r)` |
| Range | `=MAX(r)-MIN(r)` |
| Kwartielen | `=QUARTILE.INC(r;1)` |
| Aantal | `=COUNT(r)` |
| Wortel | `=WORTEL(x)` (Engels `SQRT`) |

### Verdelingen

| Verdeling | Kans / cumulatief | Inverse |
|---|---|---|
| Normaal | `=NORM.DIST(x;μ;σ;WAAR)` | `=NORM.INV(p;μ;σ)` |
| Standaardnormaal | `=NORM.S.DIST(z;WAAR)` | `=NORM.S.INV(p)` |
| t | `=T.DIST(t;ν;WAAR)`, `=T.DIST.RT(t;ν)`, `=T.DIST.2T(t;ν)` | `=T.INV(p;ν)`, `=T.INV.2T(α;ν)` |
| $\chi^2$ | `=CHISQ.DIST(x;ν;WAAR)`, `=CHISQ.DIST.RT(x;ν)` | `=CHISQ.INV(p;ν)`, `=CHISQ.INV.RT(α;ν)` |
| F | `=F.DIST(x;ν1;ν2;WAAR)`, `=F.DIST.RT(x;ν1;ν2)` | `=F.INV(p;ν1;ν2)`, `=F.INV.RT(α;ν1;ν2)` |
| Binomiaal | `=BINOM.DIST(x;n;π;WAAR)` | `=BINOM.INV(n;π;p)` |
| Poisson | `=POISSON.DIST(x;λ;WAAR)` | - |
| Hypergeometrisch | `=HYPGEOM.DIST(x;n;D;N;WAAR)` | - |
| Exponentieel | `=EXPON.DIST(x;λ;WAAR)` | `=-LN(1-p)/λ` |
| Beta | `=BETA.DIST(x;a;b;WAAR)` | `=BETA.INV(p;a;b)` |

### Toetsen, intervallen, regressie

| Doel | Functie |
|---|---|
| Foutmarge CI gemiddelde | `=CONFIDENCE.NORM(α;σ;n)`, `=CONFIDENCE.T(α;s;n)` |
| F-toets twee varianties (tweezijdige p) | `=F.TEST(r1;r2)` |
| Z-toets (eenzijdige p, rechts) | `=Z.TEST(r;μ0;σ)` |
| Regressie | `=SLOPE(y;x)`, `=INTERCEPT(y;x)`, `=RSQ(y;x)`, `=STEYX(y;x)`, `=CORREL(x;y)`, `=LINEST(y;x;WAAR;WAAR)`, `=FORECAST.LINEAR(x0;y;x)` |
| ANOVA, regressie, t-toetsen | Data Analysis ToolPak |
| Random getallen | `=RAND()`, `=NORM.INV(RAND();μ;σ)` |

### B10. Excel-functies aanvulling

| Doel | Functie |
|---|---|
| Exact CI fractie (Clopper-Pearson) | `=BETA.INV(α/2;d;n-d+1)` ; `=BETA.INV(1-α/2;d+1;n-d)` |
| Kritieke c bij acceptance sampling | `=BINOM.INV(n;π;1-α)` (kleinste c met cumulatieve kans ≥ 1-α) |
| t-toets twee reeksen | `=T.TEST(r1;r2;zijden;type)` type 1 = gepaard, 2 = gelijke varianties, 3 = ongelijke |
| $\chi^2$-toets onafhankelijkheid | `=CHISQ.TEST(waargenomen;verwacht)` (geeft p-waarde) |
| Exponentieel | `=EXPON.DIST(x;λ;WAAR)` |
| Gamma / lnGamma | `=GAMMA.DIST(...)`, `=GAMMALN(x)` |
| Wisselen staarten F | `=F.INV(α;a;b)` = `=1/F.INV.RT(α;b;a)` |

### Veelgebruikte examenformules

| Berekening | Excel |
|---|---|
| Ondergrens $\sigma_2^2/\sigma_1^2$ (vraag 2) | `=(0,015/0,004)*F.INV(0,05;9;14)` = 1,2395 |
| Uitval boven USL (vraag 3) | `=1-NORM.DIST(1460;1440;10;WAAR)` = 0,02275 |
| Sigma uit staartkans (vraag 6) | `=(820-720)/NORM.S.INV(0,95)` = 60,80 |
| $P_{acc}$ plan (100, 4) bij 2% | `=BINOM.DIST(4;100;0,02;WAAR)` = 0,949 |
| p-waarde t-toets links | `=T.DIST(t;n-1;WAAR)` |
| p-waarde $\chi^2$ rechts | `=CHISQ.DIST.RT(chi2;n-1)` |
| DPMO bij sigma-niveau Z | `=(1-NORM.S.DIST(Z-1,5;WAAR))*1000000` |

---

## B11. Examenstrategie: vraagtype -> formule -> tool

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

Algemene tips:
- Schrijf altijd $H_0$, $H_1$, $\alpha$, de toetsingsgrootheid, de kritieke waarde of p-waarde, en de conclusie in woorden.
- Vermeld aannames (normaliteit, onafhankelijkheid, gelijke varianties, $n\pi\ge5$) en welke $\sigma$ je gebruikt (korte of lange termijn).
- Geef de Excel-formule die je gebruikte; noteer welke variantie in de teller staat bij een F-verhouding.
- Bij "correct of niet correct": geef een oordeel plus één zin motivering met het juiste begrip.
