### Waarom regelkaarten? Gewone en speciale oorzaken

Elk proces varieert. Een regelkaart (control chart, Shewhart-kaart) helpt twee soorten variatie te onderscheiden:

- **Gewone oorzaken** (common causes): altijd aanwezig, veel kleine bronnen, deel van het systeem. Een proces met enkel gewone oorzaken is **stabiel** (onder statistische controle, in control): voorspelbaar binnen grenzen. Verminderen vraagt een systeemverandering (management, procesingenieur).
- **Speciale oorzaken** (special / assignable causes): sporadisch en aanwijsbaar (nieuwe grondstof, versleten gereedschap, instelfout, andere operator). De regelkaart moet deze **signaleren**: een punt buiten de grenzen of een niet-toevallig patroon.

Doel: enkel ingrijpen bij een signaal. Bijsturen bij gewone variatie (**tampering**, overcorrectie) maakt de spreiding juist groter.

Regelgrenzen (UCL, LCL) zijn de **stem van het proces**, berekend uit de data. Ze hebben niets te maken met de specificatiegrenzen LSL/USL (de stem van de klant). Stabiel betekent dus niet capabel.

### De bouwstenen: $\bar X$, $\bar{\bar X}$, $R$ en $\bar R$

Je neemt op regelmatige tijdstippen een **subgroep** van $n$ stuks (typisch 4 of 5, kort na elkaar gemaakt). Per subgroep bereken je:

| Symbool | Naam | Betekenis | Berekening | Excel |
|---|---|---|---|---|
| $\bar X_i$ | subgroepgemiddelde ("X-bar") | waar ligt het proces op tijdstip $i$? | $\frac{1}{n}\sum_j x_{ij}$ | `=AVERAGE(rij)` |
| $R_i$ | bereik (range) van de subgroep | hoe groot is de spreiding binnen de subgroep? | $\max - \min$ | `=MAX(rij)-MIN(rij)` |
| $s_i$ | standaardafwijking van de subgroep | idem, met alle waarden | $\sqrt{\frac{\sum(x_{ij}-\bar X_i)^2}{n-1}}$ | `=STDEV.S(rij)` |

Over alle $k$ subgroepen samen:

| Symbool | Naam | Betekenis | Berekening |
|---|---|---|---|
| $\bar{\bar X}$ | grootgemiddelde ("X-double-bar") | het algemene procesgemiddelde: de **centrale lijn** van de $\bar X$-kaart | $\frac{1}{k}\sum_i \bar X_i$ |
| $\bar R$ | gemiddeld bereik ("R-bar") | de typische spreiding binnen een subgroep: de **centrale lijn** van de R-kaart en de basis voor $\hat\sigma$ | $\frac{1}{k}\sum_i R_i$ |
| $\bar s$ | gemiddelde standaardafwijking | idem voor de s-kaart | $\frac{1}{k}\sum_i s_i$ |

**Voorbeeld (SPC-oefening 2, $n=5$, eerste 5 van 20 subgroepen):**

| Subgroep | Metingen | $\bar X_i$ | $R_i$ |
|---|---|---|---|
| 1 | 15,8 - 16,3 - 16,2 - 16,1 - 16,6 | 16,20 | 16,6 - 15,8 = 0,8 |
| 2 | 16,3 - 15,9 - 15,9 - 16,2 - 16,4 | 16,14 | 0,5 |
| 3 | 16,1 - 16,2 - 16,5 - 16,4 - 16,3 | 16,30 | 0,4 |
| 4 | 16,3 - 16,2 - 15,9 - 16,5 - 16,0 | 16,18 | 0,6 |
| 5 | 16,1 - 16,1 - 16,4 - 16,6 - 16,4 | 16,32 | 0,5 |

Over alle 20 subgroepen: $\bar{\bar X}=16{,}266$ en $\bar R=0{,}480$.

**Waarom subgroepen?** De variatie **binnen** een subgroep (kort na elkaar gemaakt) is zuivere gewone variatie: daaruit schat je $\sigma$. Verschillen **tussen** subgroepen tonen dan of het proces verschuift (rationele subgroepen). En door de centrale limietstelling zijn de gemiddelden $\bar X_i$ (bij benadering) normaal verdeeld met standaardafwijking $\sigma/\sqrt n$, ook als de individuele waarden dat niet zijn.

### Van $\bar R$ naar $\sigma$: de constante $d_2$

Voor normale data is het verwachte bereik van $n$ waarnemingen een vast veelvoud van $\sigma$: $E[R]=d_2\,\sigma$. Bij $n=5$ is $d_2=2{,}326$: het bereik van 5 stuks is gemiddeld 2,326 standaardafwijkingen. Omgekeerd:
$$\hat\sigma=\frac{\bar R}{d_2}\qquad\text{(of met s: }\hat\sigma=\frac{\bar s}{c_4}\text{, met } E[s]=c_4\sigma\text{)}$$
Voorbeeld: $\hat\sigma=0{,}480/2{,}326=0{,}206$. Dit is de **korte-termijn** $\sigma$ (binnen subgroepen) die je ook voor $C_p$ en $C_{pk}$ gebruikt.

### De grenzen van de $\bar X$-kaart: waar komt $A_2$ vandaan?

Het principe is altijd **centrale lijn $\pm3$ standaardafwijkingen van wat je plot**. Je plot gemiddelden, en die hebben standaardafwijking $\sigma/\sqrt n$:
$$UCL,\ LCL=\bar{\bar X}\pm3\,\frac{\sigma}{\sqrt n}=\bar{\bar X}\pm3\,\frac{\bar R/d_2}{\sqrt n}=\bar{\bar X}\pm\underbrace{\frac{3}{d_2\sqrt n}}_{A_2}\,\bar R$$
$A_2$ bundelt dus drie dingen: de 3 sigma, de omzetting van $\bar R$ naar $\sigma$ ($/d_2$) en de $\sqrt n$ van het gemiddelde. Voor $n=5$: $A_2=\frac{3}{2{,}326\cdot\sqrt5}=0{,}577$.

Met s in plaats van R: $\bar{\bar X}\pm A_3\,\bar s$ met $A_3=\frac{3}{c_4\sqrt n}$ ($n=5$: $\frac{3}{0{,}940\cdot\sqrt5}=1{,}427$).

**Voorbeeld:** $UCL=16{,}266+0{,}577\cdot0{,}480=16{,}543$ en $LCL=16{,}266-0{,}577\cdot0{,}480=15{,}989$. Ter controle: $3\hat\sigma/\sqrt n=3\cdot0{,}206/\sqrt5=0{,}277=A_2\bar R$.

### De grenzen van de R-kaart (en s-kaart): $D_3$, $D_4$, $B_3$, $B_4$

Ook R zelf schommelt: de standaardafwijking van het bereik is $d_3\,\sigma$. Dus
$$UCL_R=\bar R+3\,d_3\frac{\bar R}{d_2}=\underbrace{\left(1+3\frac{d_3}{d_2}\right)}_{D_4}\bar R,\qquad LCL_R=\underbrace{\left(1-3\frac{d_3}{d_2}\right)}_{D_3}\bar R$$
Voor $n=5$: $d_3=0{,}864$, dus $D_4=1+3\cdot0{,}864/2{,}326=2{,}114$; $D_3$ zou negatief zijn en wordt op 0 gezet (een bereik kan niet negatief zijn). Pas vanaf $n=7$ is $D_3>0$.
Voorbeeld: $UCL_R=2{,}114\cdot0{,}480=1{,}015$, $LCL_R=0$. Voor de s-kaart analoog: $UCL_s=B_4\,\bar s$, $LCL_s=B_3\,\bar s$.

| Kaart | Centrale lijn | UCL | LCL | $\hat\sigma$ |
|---|---|---|---|---|
| $\bar X$ (met R) | $\bar{\bar X}$ | $\bar{\bar X}+A_2\bar R$ | $\bar{\bar X}-A_2\bar R$ | $\bar R/d_2$ |
| R | $\bar R$ | $D_4\bar R$ | $D_3\bar R$ | |
| $\bar X$ (met s) | $\bar{\bar X}$ | $\bar{\bar X}+A_3\bar s$ | $\bar{\bar X}-A_3\bar s$ | $\bar s/c_4$ |
| s | $\bar s$ | $B_4\bar s$ | $B_3\bar s$ | |
| I (individueel) | $\bar x$ | $\bar x+2{,}66\,\overline{MR}$ | $\bar x-2{,}66\,\overline{MR}$ | $\overline{MR}/1{,}128$ |

**Controlekaart-constanten** (standaardtabel, zoals in het formularium; kies de rij met je subgroepgrootte $n$):

| $n$ | $A_2$ | $A_3$ | $d_2$ | $D_3$ | $D_4$ | $B_3$ | $B_4$ | $c_4$ |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 2 | 1,880 | 2,659 | 1,128 | 0 | 3,267 | 0 | 3,267 | 0,7979 |
| 3 | 1,023 | 1,954 | 1,693 | 0 | 2,574 | 0 | 2,568 | 0,8862 |
| 4 | 0,729 | 1,628 | 2,059 | 0 | 2,282 | 0 | 2,266 | 0,9213 |
| **5** | **0,577** | **1,427** | **2,326** | **0** | **2,114** | **0** | **2,089** | **0,9400** |
| 6 | 0,483 | 1,287 | 2,534 | 0 | 2,004 | 0,030 | 1,970 | 0,9515 |
| 7 | 0,419 | 1,182 | 2,704 | 0,076 | 1,924 | 0,118 | 1,882 | 0,9594 |
| 8 | 0,373 | 1,099 | 2,847 | 0,136 | 1,864 | 0,185 | 1,815 | 0,9650 |
| 9 | 0,337 | 1,032 | 2,970 | 0,184 | 1,816 | 0,239 | 1,761 | 0,9693 |
| 10 | 0,308 | 0,975 | 3,078 | 0,223 | 1,777 | 0,284 | 1,716 | 0,9727 |

**Hoe gebruik je de tabel?** Zoek de rij van je subgroepgrootte $n$ (aantal metingen per subgroep, niet het aantal subgroepen). Met R: $A_2$ voor de $\bar X$-kaart, $D_3$ en $D_4$ voor de R-kaart, $d_2$ voor $\hat\sigma=\bar R/d_2$. Met s: $A_3$, $B_3$, $B_4$ en $c_4$. Bv. $n=5$ (vetgedrukt): $UCL_{\bar X}=\bar{\bar X}+0{,}577\,\bar R$, $UCL_R=2{,}114\,\bar R$, $\hat\sigma=\bar R/2{,}326$. Verbanden: $A_2=\frac{3}{d_2\sqrt n}$, $A_3=\frac{3}{c_4\sqrt n}$. $D_3=0$ en $B_3=0$ voor kleine $n$ betekent: geen ondergrens voor de spreiding. Voor $n$ van 11 tot 25: zie de tab Constanten.

**R of s?** R is eenvoudig en voor kleine subgroepen ($n\le$ ongeveer 8 - 10) bijna even goed als s. Voor grotere subgroepen gooit R te veel informatie weg (het gebruikt enkel het hoogste en laagste punt): gebruik dan s.

### Hoe lees je de kaart?

1. **Eerst de R- (of s-) kaart.** De $\bar X$-grenzen hangen af van $\bar R$; als de spreiding zelf niet stabiel is, zijn die grenzen niet zinvol.
2. **Dan de $\bar X$-kaart** met de Western Electric regels. Zones: A = tussen 2 en 3 sigma, B = tussen 1 en 2 sigma, C = binnen 1 sigma (sigma van de geplotte gemiddelden, $=(UCL-CL)/3$).
   - **Regel 1:** 1 punt buiten de 3-sigma-grenzen.
   - **Regel 2:** 2 van 3 opeenvolgende punten voorbij 2 sigma, aan dezelfde kant.
   - **Regel 3:** 4 van 5 opeenvolgende punten voorbij 1 sigma, aan dezelfde kant.
   - **Regel 4:** 8 opeenvolgende punten aan dezelfde kant van de centrale lijn.
3. **Geen signalen:** het proces is stabiel. Pas dan heeft een capabiliteitsberekening zin.

Bij een stabiel proces ligt een punt toch met kans 0,27% buiten de 3-sigma-grenzen (vals alarm): gemiddeld 1 keer per 370 punten ($ARL_0=370$). Meer regels geven snellere detectie van kleine verschuivingen, maar ook meer valse alarmen.

### Opstellen en herzien van de grenzen (fase I en II)

- **Fase I (opstellen):** verzamel minstens 20 - 25 subgroepen, bereken $\bar{\bar X}$, $\bar R$ en de grenzen. Punten met een **gevonden** speciale oorzaak laat je weg en je herberekent de grenzen (herziene grenzen, revised limits; oefening 3). Herhaal tot er geen signalen meer zijn.
- **Fase II (bewaken):** de vaste grenzen gebruik je voor nieuwe subgroepen. Je herberekent ze niet bij elk punt.
- Een punt net binnen de grens (bv. 35,0 bij UCL 35,02) is formeel geen signaal, maar verdient aandacht.

### Subgroepgrootte en detectiekans

Een grotere $n$ maakt de $\bar X$-grenzen smaller ($\pm3\sigma/\sqrt n$), zodat een verschuiving sneller opvalt. De kans om een verschuiving van $k\sigma$ **niet** te zien op de volgende subgroep is
$$\beta=\Phi(3-k\sqrt n)-\Phi(-3-k\sqrt n),\qquad ARL_1=\frac{1}{1-\beta}$$
Voorbeeld $k=2$: $n=3$: detectie 67,9%; $n=5$: 93,0%; $n=8$: 99,6%. Een andere $n$ geeft nieuwe grenzen $\bar{\bar X}\pm3\hat\sigma/\sqrt{n'}$ met dezelfde $\hat\sigma$ (tab "Andere n / detectie").

### Stabiliteit en capabiliteit

| | Stabiel | Niet stabiel |
|---|---|---|
| **Capabel** | ideaal: bewaken | speciale oorzaken wegwerken |
| **Niet capabel** | systeem verbeteren (spreiding, centrering) | eerst stabiliseren, dan verbeteren |

Uit de kaart volgt meteen de capabiliteit: $C_p=\frac{USL-LSL}{6\hat\sigma}$ en $C_{pk}$ met $\hat\sigma=\bar R/d_2$. In oefening 2 (specs $16{,}2\pm0{,}5$): $C_p=1/(6\cdot0{,}206)=0{,}81$ en $C_{pk}=0{,}70$. Het proces is stabiel maar niet capabel.

**Let op (oefening 2):** het klasblad toont UCL 16,9 en LCL 15,7. Dat zijn geen $\bar X$-grenzen (eerder spreiding van individuele waarden of specificaties); de correcte grenzen zijn 16,543 en 15,989.
