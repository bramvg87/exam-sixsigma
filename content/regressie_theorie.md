### Wat doet regressie?

**Regressie** beschrijft hoe een **respons** $Y$ (afhankelijke variabele, output, bv. sterkte) gemiddeld verandert met een of meer **verklarende variabelen** $X$ (onafhankelijke variabelen, inputs, bv. temperatuur). Je schat de rechte die het best door de puntenwolk past en gebruikt ze om (1) het verband te kwantificeren (helling), (2) te toetsen of het verband echt is, en (3) te voorspellen.

**Model (enkelvoudige lineaire regressie):**
$$Y_i=\beta_0+\beta_1x_i+\varepsilon_i,\qquad \varepsilon_i\sim N(0,\sigma^2)\ \text{onafhankelijk}$$
$\beta_0$ (intercept) en $\beta_1$ (helling) zijn de onbekende ware coëfficiënten; $b_0$ en $b_1$ zijn hun schattingen uit de data. De regressielijn $\hat y=b_0+b_1x$ schat $E[Y\mid X=x]$, het gemiddelde van $Y$ bij een gegeven $x$.

### De bouwstenen

| Symbool | Naam | Betekenis | Berekening | Excel |
|---|---|---|---|---|
| $n$ | aantal punten | aantal paren $(x_i, y_i)$ | tellen | `=COUNT(x)` |
| $\bar x$, $\bar y$ | gemiddelden | zwaartepunt van de puntenwolk; de regressielijn gaat er altijd door | $\frac1n\sum x_i$ | `=AVERAGE(x)` |
| $S_{xx}$ | kwadratensom van $x$ | hoe ver de $x$-waarden uit elkaar liggen | $\sum(x_i-\bar x)^2$ | `=DEVSQ(x)` |
| $S_{yy}$ | kwadratensom van $y$ | totale spreiding van $y$ (= $SS_T$) | $\sum(y_i-\bar y)^2$ | `=DEVSQ(y)` |
| $S_{xy}$ | kruisproductensom | samenhang: positief als grote $x$ samengaat met grote $y$ | $\sum(x_i-\bar x)(y_i-\bar y)$ | `=SUMPRODUCT(x-AVERAGE(x);y-AVERAGE(y))` |
| $b_1$ | helling (slope) | verandering in $\hat y$ per eenheid $x$ | $S_{xy}/S_{xx}$ | `=SLOPE(y;x)` |
| $b_0$ | intercept | $\hat y$ bij $x=0$ (vaak geen fysische betekenis) | $\bar y-b_1\bar x$ | `=INTERCEPT(y;x)` |
| $\hat y_i$ | voorspelde (gefitte) waarde | punt op de lijn bij $x_i$ | $b_0+b_1x_i$ | `=TREND(y;x;xi)` |
| $e_i$ | residu | wat de lijn niet verklaart | $y_i-\hat y_i$ | |

**Kleinste kwadraten (least squares):** $b_0$ en $b_1$ zijn zo gekozen dat de som van de gekwadrateerde residuen $\sum e_i^2$ zo klein mogelijk is. Daaruit volgen de formules hierboven.

### De spreiding opsplitsen: $SS_T=SS_R+SS_E$

Elke afwijking van het gemiddelde splits je in een verklaard en een onverklaard deel:
$$\underbrace{y_i-\bar y}_{\text{totaal}}=\underbrace{(\hat y_i-\bar y)}_{\text{verklaard door de lijn}}+\underbrace{(y_i-\hat y_i)}_{\text{residu}}$$
Gekwadrateerd en opgeteld (de kruistermen vallen weg):

| Symbool | Naam | Betekenis | Berekening | df |
|---|---|---|---|---|
| $SS_T$ | totale kwadratensom (total) | totale spreiding van $y$ rond $\bar y$: wat er te verklaren valt | $\sum(y_i-\bar y)^2=S_{yy}$ | $n-1$ |
| $SS_R$ | regressiekwadratensom (regression, verklaard) | het deel van de spreiding dat de lijn verklaart | $\sum(\hat y_i-\bar y)^2=b_1S_{xy}$ | $k$ (aantal $X$'en; 1 bij enkelvoudig) |
| $SS_E$ | foutkwadratensom (error, residual) | wat overblijft: spreiding van de punten rond de lijn | $\sum(y_i-\hat y_i)^2$ | $n-k-1$ ($n-2$ bij enkelvoudig) |
| $MS_R$ | gemiddeld verklaard kwadraat | $SS_R$ per vrijheidsgraad | $SS_R/k$ | |
| $MS_E$ | gemiddeld foutkwadraat | **schatting van $\sigma^2$**, de ruis rond de lijn | $SS_E/(n-k-1)$ | |
| $s$ | standaardfout van de regressie | typische afstand van een punt tot de lijn (in eenheden van $y$) | $\sqrt{MS_E}$ | `=STEYX(y;x)` |

**Vrijheidsgraden:** $SS_E$ heeft $n-2$ vrijheidsgraden omdat er 2 parameters ($b_0$, $b_1$) geschat zijn; bij $k$ verklarende variabelen $n-k-1$.

### Hoe goed is het model? $R^2$, $R^2_{adj}$ en $r$

| Symbool | Betekenis | Berekening | Excel |
|---|---|---|---|
| $R^2$ (determinatiecoëfficiënt) | fractie van de totale spreiding die het model verklaart (0 - 1) | $SS_R/SS_T=1-SS_E/SS_T$ | `=RSQ(y;x)` |
| $R^2_{adj}$ (aangepast) | $R^2$ met een straf voor elke extra variabele; om modellen met verschillend $k$ te vergelijken | $1-\frac{SS_E/(n-k-1)}{SS_T/(n-1)}$ | |
| $r$ (correlatiecoëfficiënt) | sterkte en richting van het **lineaire** verband ($-1$ tot $1$); bij enkelvoudige regressie $r^2=R^2$ | $\frac{S_{xy}}{\sqrt{S_{xx}S_{yy}}}$ | `=CORREL(x;y)` |

$R^2$ stijgt altijd als je een variabele toevoegt, ook een nutteloze; $R^2_{adj}$ niet. (De slide gebruikt $n-k-2$ in de noemer; Excel en dit formularium gebruiken $n-k-1$.) Een hoge $R^2$ bewijst geen oorzakelijk verband en geen correct model: kijk ook naar de residuen.

### Is het verband significant? F-toets en t-toets

**F-toets (ANOVA van de regressie):** $H_0$: geen enkele $X$ heeft effect ($\beta_1=\dots=\beta_k=0$).
$$F=\frac{MS_R}{MS_E}\sim F(k;\,n-k-1)$$
Zelfde logica als bij ANOVA: $MS_E$ schat de ruis, $MS_R$ is groter als de lijn echt iets verklaart. Rechtszijdig; p `=F.DIST.RT(F;k;n-k-1)`.

**t-toets per coëfficiënt:** $H_0:\beta_1=0$ (geen lineair verband met deze $X$).
$$se(b_1)=\sqrt{\frac{MS_E}{S_{xx}}},\qquad t=\frac{b_1}{se(b_1)}\sim t(n-k-1),\qquad \text{BI: } b_1\pm t_{1-\alpha/2;\,n-k-1}\,se(b_1)$$
De standaardfout van de helling is kleiner als er weinig ruis is ($MS_E$ klein) en als de $x$-waarden ver uit elkaar liggen ($S_{xx}$ groot): spreid je proefpunten dus breed. Bij enkelvoudige regressie geldt $F=t^2$. Ligt 0 buiten het BI van $b_1$, dan is de helling significant.

### Voorspellen: BI voor het gemiddelde en PI voor één nieuwe waarneming

Bij een gegeven $x_0$ is $\hat y_0=b_0+b_1x_0$. Twee verschillende vragen:

$$\text{BI (gemiddelde respons): } \hat y_0\pm t\,s\sqrt{\frac1n+\frac{(x_0-\bar x)^2}{S_{xx}}}\qquad \text{PI (nieuwe waarneming): } \hat y_0\pm t\,s\sqrt{1+\frac1n+\frac{(x_0-\bar x)^2}{S_{xx}}}$$

- **BI** (confidence interval): waar ligt het **gemiddelde** van $Y$ bij $x_0$? Wordt smaller met meer data.
- **PI** (prediction interval): waar ligt **één nieuwe** meting bij $x_0$? Altijd breder: de extra "1" onder de wortel is de ruis $\sigma^2$ van die ene meting, die niet verdwijnt met meer data.
- Beide zijn het smalst bij $x_0=\bar x$ en worden breder naar de randen (de term $(x_0-\bar x)^2$). **Extrapoleren** buiten het gemeten bereik is gevaarlijk: het lineaire verband is daar niet gecontroleerd.

### Aannames en residuanalyse

1. **Lineair** verband (residuplot zonder kromming).
2. **Onafhankelijke** fouten (geen patroon in de tijdsvolgorde).
3. **Constante variantie** (homoscedasticiteit: geen trechtervorm in het residuplot tegen $\hat y$).
4. **Normale** residuen (normaal-kansplot ongeveer recht).

Een goed residuplot is een structuurloze horizontale band rond 0. Kromming: voeg een kwadratische term toe of transformeer. Trechter: transformeer $y$ (bv. log). Uitschieters: controleer de meting.

### Meervoudige regressie

Meerdere $X$'en: $Y=\beta_0+\beta_1x_1+\dots+\beta_kx_k+\varepsilon$. In matrixvorm $\mathbf{b}=(X^TX)^{-1}X^T\mathbf{y}$. Elke $b_j$ is het effect van $x_j$ **bij constante andere $X$'en**. Dezelfde ANOVA-tabel ($SS_R$ met $k$ df, $SS_E$ met $n-k-1$ df), F-toets voor het hele model, t-toets per coëfficiënt; vergelijk modellen met $R^2_{adj}$. Pas op met sterk gecorreleerde $X$'en (multicollineariteit): de individuele $b_j$ worden dan onbetrouwbaar.

### Uitgewerkt voorbeeld (12 punten, $x=1..12$)

| Stap | Waarde |
|---|---|
| $\bar x$, $\bar y$ | 6,5 en 14,622 |
| $S_{xx}$, $S_{xy}$, $S_{yy}=SS_T$ | 143,0 ; 266,42 ; 507,78 |
| $b_1=S_{xy}/S_{xx}$ | $266{,}42/143=1{,}863$ |
| $b_0=\bar y-b_1\bar x$ | $14{,}622-1{,}863\cdot6{,}5=2{,}512$ |
| eerste punt $x=1$, $y=4{,}44$ | $\hat y=4{,}375$, residu $e=0{,}065$ |
| $SS_R=b_1S_{xy}$ | 496,36 (df 1) |
| $SS_E=SS_T-SS_R$ | 11,42 (df 10) |
| $MS_E$, $s$ | 1,142 ; 1,069 |
| $R^2=SS_R/SS_T$ | 0,9775 ($R^2_{adj}=0{,}9753$, $r=0{,}989$) |
| $F=MS_R/MS_E$ | $496{,}36/1{,}142=434{,}6$, p $=1{,}4\cdot10^{-9}$ |
| $se(b_1)=\sqrt{MS_E/S_{xx}}$ | 0,0894, dus $t=1{,}863/0{,}0894=20{,}85$ |
| 95%-BI voor $\beta_1$ | $1{,}863\pm2{,}228\cdot0{,}0894=[1{,}664;\ 2{,}062]$ |
| bij $x_0=7{,}5$: $\hat y_0$ | 16,48; BI gemiddelde $[15{,}77;\ 17{,}20]$; PI nieuwe waarde $[14{,}00;\ 18{,}97]$ |

Lezing: per eenheid $x$ stijgt $y$ gemiddeld met 1,86 (tussen 1,66 en 2,06 met 95% betrouwbaarheid); het model verklaart 97,8% van de spreiding; een individuele nieuwe meting bij $x=7{,}5$ ligt met 95% kans tussen 14,0 en 19,0.

**Excel:** `=LINEST(y;x;WAAR;WAAR)` geeft coëfficiënten, standaardfouten, $R^2$, $s$, $F$, df, $SS_R$ en $SS_E$ in één matrix (let op: de coëfficiënten staan in omgekeerde volgorde). Of: Gegevens > Gegevensanalyse > Regressie.

**Correlatie is geen causaliteit:** een sterk verband kan door een derde variabele (confounder) komen. Enkel een experiment (DOE, randomisatie) toont oorzaak en gevolg.
