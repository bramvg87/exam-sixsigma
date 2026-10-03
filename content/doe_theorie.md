### Wat is een proefopzet (DOE)?

Met **Design of Experiments (DOE)** verander je bewust en systematisch een aantal **factoren** (inputs $X$, bv. temperatuur, druk, katalysator) en meet je het effect op een **respons** (output $Y$, bv. opbrengst). Doel: in zo weinig mogelijk proeven ontdekken **welke factoren ertoe doen**, **hoe groot** hun effect is en of ze **samenwerken** (interacties). Het verschil met gewoon observeren: omdat jij de factoren instelt (en randomiseert), toon je **oorzaak en gevolg** aan, niet enkel correlatie.

**Waarom niet "één factor tegelijk" (OFAT)?** Als je eerst A optimaliseert met B vast, en dan B met A vast, mis je interacties en heb je veel meer proeven nodig. Een factorieel ontwerp verandert alle factoren samen en gebruikt **elke** run voor **elke** schatting.

### Het $2^k$-ontwerp

- $k$ factoren, elk op **2 niveaus**: laag ($-$, $-1$) en hoog ($+$, $+1$). Alle combinaties: $2^k$ runs (k = 2: 4, k = 3: 8, k = 4: 16).
- $n$ **herhalingen** (replicates): elke combinatie $n$ keer uitvoeren, telkens opnieuw ingesteld. Totaal $N=n\cdot2^k$ metingen.
- **Notatie van de runs (Yates):** een kleine letter betekent "die factor op hoog". $(1)$ = alles laag, $a$ = enkel A hoog, $b$ = enkel B hoog, $ab$ = A en B hoog, $c$, $ac$, $bc$, $abc$, ... Deze **standaardvolgorde** is enkel de notatie; de proeven voer je in **willekeurige** volgorde uit.

**Tekentabel ($k=2$):**

| run | A | B | AB |
|---|---|---|---|
| $(1)$ | $-$ | $-$ | $+$ |
| $a$ | $+$ | $-$ | $-$ |
| $b$ | $-$ | $+$ | $-$ |
| $ab$ | $+$ | $+$ | $+$ |

De kolom van een interactie is het **product** van de kolommen van de factoren ($-\cdot-=+$). Alle kolommen zijn **orthogonaal** (evenveel $+$ als $-$, onderling onafhankelijk): daardoor kan je elk effect apart schatten.

### Van gegevens naar effecten

| Begrip | Betekenis | Berekening |
|---|---|---|
| **Totaal** van een run | som van de $n$ herhalingen van die run | bv. $(1)=28+25=53$ |
| **Contrast** van een effect | som van de totalen met het teken uit de tekentabel | $C_A=a+ab-b-(1)$ |
| **Effect** | gemiddelde respons op $+$ min gemiddelde op $-$ | $\frac{C}{n\,2^{k-1}}$ |
| **Coëfficiënt** (gecodeerd) | helling per eenheid van $-1$ naar $+1$ (= half effect) | $\frac{\text{effect}}{2}$ |
| **SS** van een effect | variatie die dat effect verklaart (1 vrijheidsgraad) | $\frac{C^2}{n\,2^k}$ |
| $SS_E$, $MS_E$ | zuivere fout uit de herhalingen; $MS_E$ schat $\sigma^2$ | $SS_T-\sum SS_{\text{effecten}}$, df $=2^k(n-1)$ |
| $F$, p | is het effect groter dan de ruis? | $F=SS/MS_E$, df $(1;\,2^k(n-1))$ |
| $se(\text{effect})$ | standaardfout van een effect | $\sqrt{MS_E/(n\,2^{k-2})}$ |
| BI van een effect | ongeveer $\pm2\,se$ (exact $\pm t_{1-\alpha/2}\,se$) | bevat het 0 niet, dan is het effect significant |

- **Hoofdeffect A:** hoeveel de respons gemiddeld verandert als A van laag naar hoog gaat, uitgemiddeld over de andere factoren.
- **Interactie AB:** het effect van A **hangt af** van B. $AB=\frac12(\text{effect van A bij B hoog}-\text{effect van A bij B laag})$. In het interactieplot: niet-evenwijdige lijnen.

### Uitgewerkt voorbeeld ($2^2$, $n=2$)

| run | herhaling 1 | herhaling 2 | totaal |
|---|---|---|---|
| $(1)$ | 28 | 25 | 53 |
| $a$ | 36 | 32 | 68 |
| $b$ | 18 | 19 | 37 |
| $ab$ | 31 | 30 | 61 |

- $C_A=68+61-37-53=39\Rightarrow$ effect A $=39/(2\cdot2)=9{,}75$: A van laag naar hoog verhoogt de respons gemiddeld met 9,75.
- $C_B=37+61-68-53=-23\Rightarrow$ effect B $=-5{,}75$: B hoog verlaagt de respons met 5,75.
- $C_{AB}=61+53-68-37=9\Rightarrow$ effect AB $=2{,}25$ (klein): het effect van A is bij B hoog iets groter (12) dan bij B laag (7,5).
- $SS_A=39^2/8=190{,}1$, $SS_B=66{,}1$, $SS_{AB}=10{,}1$, $SS_E=13{,}5$ met df $=4\cdot(2-1)=4$, dus $MS_E=3{,}375$.
- $F_A=56{,}3$ (p $=0{,}002$), $F_B=19{,}6$ (p $=0{,}011$), $F_{AB}=3{,}0$ (p $=0{,}16$): A en B significant, de interactie niet.
- $se(\text{effect})=\sqrt{3{,}375/(2\cdot1)}=1{,}30$; BI van A ongeveer $9{,}75\pm2\cdot1{,}30=[7{,}2;\ 12{,}3]$, ver van 0.

**Conclusie:** zet A hoog en B laag voor de hoogste respons; de interactie mag je verwaarlozen.

### Zonder herhalingen ($n=1$)

Dan is er geen zuivere fout ($SS_E$ heeft 0 df) en geen F-toets. Mogelijkheden:
- **Normaal-kansplot of Pareto van de effecten:** de meeste effecten zijn klein en toevallig en vormen een rechte lijn; echte effecten wijken af ("sparsity of effects").
- **Pooling:** neem de (verwaarloosbare) hogere-orde interacties samen als foutterm.
- **Lenth's methode:** een robuuste schatting van de standaardfout uit de effecten zelf (bruikbaar vanaf ongeveer 15 effecten, dus $k\ge4$).

### Principes van een goede proefopzet

- **Randomisatie:** voer de runs in willekeurige volgorde uit, zodat onbekende storingen (drift, temperatuur, operator) niet samenvallen met een factor.
- **Herhaling (replication):** elke run opnieuw instellen en uitvoeren (niet enkel opnieuw meten). Geeft de foutschatting $MS_E$ en dus toetsen.
- **Blokken (blocking):** gekende storende factoren (dag, batch grondstof) opvangen door runs in homogene blokken te groeperen; het blok wordt meestal gekoppeld aan de hoogste interactie.
- **Niveaus kiezen:** ver genoeg uit elkaar om een effect te zien, maar binnen het veilige werkgebied; het model is lineair tussen de twee niveaus (kromming check je met centerpunten).

### Fractionele ontwerpen: $2^{k-1}$ en aliasing

Bij veel factoren wordt $2^k$ duur (k = 7: 128 runs). Een **halve fractie** $2^{k-1}$ gebruikt de helft van de runs:
- **Generator:** de laatste factor wordt ingesteld als product van de andere, bv. bij $k=3$: $C=AB$. **Definiërende relatie:** $I=ABC$.
- **Aliasing (confounding):** in de fractie hebben sommige effecten **dezelfde tekenkolom** en zijn ze niet te onderscheiden. Alias van een term = term $\times$ definiërend woord (kwadraten vallen weg): $A\cdot ABC=BC$, dus het geschatte "effect A" is eigenlijk $A+BC$.
- **Resolutie** = lengte van het kortste woord in de definiërende relatie:
  - **III:** hoofdeffecten gealiast met 2-factor-interacties (riskant);
  - **IV:** hoofdeffecten vrij, maar 2-factor-interacties onderling gealiast;
  - **V:** hoofdeffecten en 2-factor-interacties vrij van elkaar.
- Gebruik: **screening** van veel factoren; daarna de belangrijke factoren in een volledig ontwerp of de andere helft (fold-over) uitvoeren om aliassen te scheiden.

### Verband met andere technieken

De ANOVA-tabel van een $2^k$-ontwerp is dezelfde als in de ANOVA-module (elk effect 1 df). Het model met gecodeerde factoren is een regressiemodel: $\hat y=\bar y+\sum\frac{\text{effect}}{2}x$, met $x=\pm1$. Excel: contrast `=SUMPRODUCT(tekenkolom;totalen)`, p `=F.DIST.RT(F;1;df_E)`.
