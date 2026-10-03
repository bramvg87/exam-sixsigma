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

**Stap 1 - de tekentabel met de metingen ernaast.** Links de tekens uit de tekentabel (welke factor staat laag of hoog in die run, en het teken van de interactie AB = A $\times$ B), rechts de gemeten respons van de 2 herhalingen en hun totaal.

| run | A | B | AB | herhaling 1 | herhaling 2 | totaal |
|---|---|---|---|---|---|---|
| $(1)$ | $-$ | $-$ | $+$ | 28 | 25 | 53 |
| $a$ | $+$ | $-$ | $-$ | 36 | 32 | 68 |
| $b$ | $-$ | $+$ | $-$ | 18 | 19 | 37 |
| $ab$ | $+$ | $+$ | $+$ | 31 | 30 | 61 |

**Stap 2 - contrasten: elk totaal met het teken uit zijn kolom.** Voor elk effect vermenigvuldig je het runtotaal met het teken in de kolom van dat effect en tel je op:

| run | totaal | teken A $\times$ totaal | teken B $\times$ totaal | teken AB $\times$ totaal |
|---|---|---|---|---|
| $(1)$ | 53 | $-53$ | $-53$ | $+53$ |
| $a$ | 68 | $+68$ | $-68$ | $-68$ |
| $b$ | 37 | $-37$ | $+37$ | $-37$ |
| $ab$ | 61 | $+61$ | $+61$ | $+61$ |
| **contrast** | | $C_A=$ **39** | $C_B=$ **$-23$** | $C_{AB}=$ **9** |

Lees de kolom A: de runs waar A hoog staat ($a$, $ab$) tellen positief, waar A laag staat ($(1)$, $b$) negatief. Het contrast is dus (som bij A hoog) min (som bij A laag): $(68+61)-(53+37)=129-90=39$.

**Stap 3 - effecten:** contrast gedeeld door $n\cdot2^{k-1}=2\cdot2=4$ (het aantal metingen aan elke kant).

- $C_A=68+61-37-53=39\Rightarrow$ effect A $=39/(2\cdot2)=9{,}75$: A van laag naar hoog verhoogt de respons gemiddeld met 9,75.
- $C_B=37+61-68-53=-23\Rightarrow$ effect B $=-5{,}75$: B hoog verlaagt de respons met 5,75.
- $C_{AB}=61+53-68-37=9\Rightarrow$ effect AB $=2{,}25$ (klein): het effect van A is bij B hoog iets groter (12) dan bij B laag (7,5).

**Stap 4 - kwadratensom (SS) van elk effect: hoeveel variatie verklaart het?**

$$SS_{\text{effect}}=\frac{C^2}{n\cdot2^k}=\frac{C^2}{2\cdot4}=\frac{C^2}{8}$$

| effect | contrast $C$ | $SS=C^2/8$ | of: $N\cdot(\text{effect}/2)^2$ |
|---|---|---|---|
| A | 39 | $39^2/8=1521/8=190{,}125$ | $8\cdot(9{,}75/2)^2=8\cdot4{,}875^2=190{,}125$ |
| B | $-23$ | $529/8=66{,}125$ | $8\cdot2{,}875^2=66{,}125$ |
| AB | 9 | $81/8=10{,}125$ | $8\cdot1{,}125^2=10{,}125$ |

**Waarom deze formule?** Als enkel A een effect had, zou elke meting $\pm$effect/2 van het grootgemiddelde liggen ($+4{,}875$ bij A hoog, $-4{,}875$ bij A laag). Die afwijking in het kwadraat, voor alle $N=8$ metingen, is precies $SS_A$: de spreiding die A **verklaart**. Het teken van het effect verdwijnt door het kwadraat, dus ook een negatief effect (B) verklaart variatie.

**Stap 5 - foutkwadratensom $SS_E$: de ruis.** De 2 herhalingen van dezelfde run kregen exact dezelfde instelling; hun verschil is dus zuiver toeval. Per run: afwijkingen van het rungemiddelde, in het kwadraat:

| run | metingen | rungemiddelde | afwijkingen | kwadraten |
|---|---|---|---|---|
| $(1)$ | 28 ; 25 | 26,5 | $+1{,}5$ ; $-1{,}5$ | $2{,}25+2{,}25=4{,}5$ |
| $a$ | 36 ; 32 | 34,0 | $+2$ ; $-2$ | $4+4=8{,}0$ |
| $b$ | 18 ; 19 | 18,5 | $-0{,}5$ ; $+0{,}5$ | $0{,}25+0{,}25=0{,}5$ |
| $ab$ | 31 ; 30 | 30,5 | $+0{,}5$ ; $-0{,}5$ | $0{,}5$ |
| | | | **$SS_E$** | **13,5** |

Vrijheidsgraden van de fout: per run $n-1=1$, dus $2^k(n-1)=4\cdot1=4$.

**Stap 6 - controle: $SS_T=SS_A+SS_B+SS_{AB}+SS_E$.** Grootgemiddelde $\bar y=219/8=27{,}375$. $SS_T=\sum(y-27{,}375)^2=279{,}875$ en inderdaad $190{,}125+66{,}125+10{,}125+13{,}5=279{,}875$. Elk effect neemt dus een deel van de totale spreiding voor zijn rekening: A $67{,}9\%$, B $23{,}6\%$, AB $3{,}6\%$, ruis $4{,}8\%$.

**Stap 7 - MS, F en p: is het effect groter dan de ruis?**

| bron | SS | df | MS $=SS/df$ | $F=MS/MS_E$ | p | significant? |
|---|---|---|---|---|---|---|
| A | 190,125 | 1 | 190,125 | $190{,}125/3{,}375=56{,}3$ | 0,0017 | ja |
| B | 66,125 | 1 | 66,125 | $66{,}125/3{,}375=19{,}6$ | 0,011 | ja |
| AB | 10,125 | 1 | 10,125 | $10{,}125/3{,}375=3{,}0$ | 0,158 | nee |
| fout | 13,5 | 4 | 3,375 | | | |
| totaal | 279,875 | 7 | | | | |

- Elk effect heeft **1 vrijheidsgraad** (één contrast, twee niveaus), dus $MS=SS$.
- $MS_E=13{,}5/4=3{,}375$ schat de ruisvariantie $\sigma^2$ ($\sigma\approx1{,}84$).
- **$F$ vergelijkt de variatie door het effect met de ruis.** Had A geen echt effect, dan zou $MS_A$ ook ongeveer 3,4 zijn en $F\approx1$. Kritieke waarde $F_{0{,}95}(1;4)=7{,}71$ (`=F.INV.RT(0,05;1;4)`); p `=F.DIST.RT(56,3;1;4)`.
- A ($56{,}3>7{,}71$) en B ($19{,}6>7{,}71$) zijn significant; AB ($3{,}0<7{,}71$) niet: het kleine verschil in A-effect bij B laag en hoog (7,5 tegen 12) kan toeval zijn.

**Waarom zijn SS en F relevant?** Een groot effect is pas betekenisvol als het groot is **ten opzichte van de ruis**: met veel ruis kan een effect van 9,75 toeval zijn, met weinig ruis is zelfs een klein effect echt. $SS$ zegt hoeveel variatie een factor verklaart (waar zit de hefboom?), $F$ en p zeggen of dat meer is dan toeval (mag ik erop vertrouwen?). Zo weet je welke factoren je moet instellen en welke je mag negeren.

**Stap 8 - standaardfout en betrouwbaarheidsinterval van een effect.** $se(\text{effect})=\sqrt{MS_E/(n\cdot2^{k-2})}=\sqrt{3{,}375/(2\cdot1)}=1{,}30$. BI van A ongeveer $9{,}75\pm2\cdot1{,}30=[7{,}2;\ 12{,}3]$, ver van 0 (exact: $\pm t_{0{,}975;4}\cdot1{,}30=\pm2{,}776\cdot1{,}30$). Equivalent: $t=9{,}75/1{,}30=7{,}5$ en $t^2=56{,}3=F_A$.

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

### Uitgewerkt voorbeeld: $2^{3-1}$ met $C=AB$

**Stap 1 - het ontwerp opbouwen.** Schrijf een volledig $2^2$-ontwerp voor A en B (4 runs) en stel C in als het product $A\cdot B$. Zo test je 3 factoren in 4 runs in plaats van 8. Zet er de interactiekolommen naast:

| run | A | B | C $=AB$ | BC | AC | AB |
|---|---|---|---|---|---|---|
| $c$ | $-$ | $-$ | $+$ | $-$ | $-$ | $+$ |
| $a$ | $+$ | $-$ | $-$ | $+$ | $-$ | $-$ |
| $b$ | $-$ | $+$ | $-$ | $-$ | $+$ | $-$ |
| $abc$ | $+$ | $+$ | $+$ | $+$ | $+$ | $+$ |

Vergelijk de kolommen: **BC is identiek aan A**, AC aan B en AB aan C. Uit deze 4 runs kan je die paren dus nooit uit elkaar halen: ze zijn **gealiast**. Algebraïsch: $I=ABC$, dus $A\cdot I=A\cdot ABC=A^2BC=BC$ (want $A^2=I$, een kolom maal zichzelf is overal $+$). Zo ook $B=AC$ en $C=AB$. Het kortste woord ($ABC$) heeft 3 letters: **resolutie III**.

**Stap 2 - wat gaat er mis? Een rekenvoorbeeld.** Stel dat het proces in werkelijkheid zo werkt: effect A $=8$, B $=4$, C $=-2$ en een interactie BC $=6$ (de andere interacties 0). Dat geeft deze metingen in de 4 runs:

| run | A | B | C | $y$ |
|---|---|---|---|---|
| $c$ | $-$ | $-$ | $+$ | 40 |
| $a$ | $+$ | $-$ | $-$ | 56 |
| $b$ | $-$ | $+$ | $-$ | 46 |
| $abc$ | $+$ | $+$ | $+$ | 58 |

Effect = (som bij $+$ min som bij $-$) gedeeld door 2 (het aantal runs aan elke kant):
- "A" $=\frac{(56+58)-(40+46)}{2}=\frac{28}{2}=14$. Maar A is in werkelijkheid maar 8: de 14 is $A+BC=8+6$.
- "B" $=\frac{(46+58)-(40+56)}{2}=\frac{8}{2}=4=B+AC=4+0$.
- "C" $=\frac{(40+58)-(56+46)}{2}=\frac{-4}{2}=-2=C+AB=-2+0$.

Het ontwerp meet dus telkens de **som van een effect en zijn alias**. Wie aanneemt dat 2-factor-interacties verwaarloosbaar zijn, besluit hier ten onrechte dat A een effect van 14 heeft. Bij resolutie III is dat risico reëel.

**Stap 3 - aliassen scheiden met de andere helft (fold-over).** Voer ook de andere 4 runs uit ($I=-ABC$: runs $(1)$, $ab$, $ac$, $bc$ met $y=48;\ 54;\ 48;\ 50$). Daar is BC precies het **tegengestelde** van A, dus die helft schat $A-BC$:

$$\text{"A"}_2=\frac{(54+48)-(48+50)}{2}=\frac{4}{2}=2=A-BC=8-6$$

Combineer beide helften: $A=\frac{14+2}{2}=8$ en $BC=\frac{14-2}{2}=6$. Samen vormen de 8 runs weer het volledige $2^3$-ontwerp, waarin niets meer gealiast is.

**Stap 4 - hogere resolutie: $2^{4-1}$ met $D=ABC$.** Definiërende relatie $I=ABCD$ (4 letters, **resolutie IV**). Aliassen: $A=BCD$, $B=ACD$, $C=ABD$, $D=ABC$ (hoofdeffect met een 3-factor-interactie, die is meestal verwaarloosbaar, dus hoofdeffecten zijn betrouwbaar) en $AB=CD$, $AC=BD$, $AD=BC$ (2-factor-interacties onderling gealiast). Je test 4 factoren in 8 runs in plaats van 16.

**Vuistregel:** kies de generator zo dat het definiërende woord zo lang mogelijk is (hoogste resolutie), en kies bij resolutie III of IV welke factoren je samen zet op basis van procesinzicht: alias een belangrijk effect met een interactie waarvan je weet dat ze klein is.

### Verband met andere technieken

De ANOVA-tabel van een $2^k$-ontwerp is dezelfde als in de ANOVA-module (elk effect 1 df). Het model met gecodeerde factoren is een regressiemodel: $\hat y=\bar y+\sum\frac{\text{effect}}{2}x$, met $x=\pm1$. Excel: contrast `=SUMPRODUCT(tekenkolom;totalen)`, p `=F.DIST.RT(F;1;df_E)`.
