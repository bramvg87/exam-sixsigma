### Waarom meetsysteemanalyse (MSA)?

Elke beslissing (is het stuk goed, is het proces verschoven, is de verbetering echt?) steunt op **metingen**. Elke meting bevat een **meetfout**:
$$\text{waargenomen variatie}=\text{procesvariatie}+\text{meetvariatie}\qquad \sigma^2_{\text{totaal}}=\sigma^2_{\text{proces}}+\sigma^2_{\text{meting}}$$
Is de meetvariatie groot, dan (1) keur je goede stukken af en slechte goed, (2) lijkt een proces minder capabel dan het is, en (3) zie je verbeteringen niet. Daarom: **eerst het meetsysteem controleren, dan pas het proces**.

**Bronnen van meetvariatie (SWIPE):** **S**tandard (referentie, kalibratie), **W**orkpiece (het stuk: vorm, vuil, temperatuur), **I**nstrument, **P**erson (operator, procedure), **E**nvironment (temperatuur, trillingen, licht).

### Juistheid en precisie

| Begrip | Betekenis | Hoe meten |
|---|---|---|
| **Bias** (juistheid, accuracy) | gemiddelde meting min referentiewaarde: zit het instrument systematisch te hoog of te laag? | referentiestuk $n$ keer meten; t-toets op de bias |
| **Lineariteit** | verandert de bias over het meetbereik? (bv. juist bij kleine, te hoog bij grote stukken) | meerdere referentiestukken; regressie van bias op referentie, toets helling = 0 |
| **Stabiliteit** | blijven bias en spreiding constant in de tijd? | referentiestuk periodiek meten; regelkaart |
| **Herhaalbaarheid** (repeatability, EV, equipment variation) | spreiding als **dezelfde** operator **hetzelfde** stuk meerdere keren meet | variatie binnen een operator |
| **Reproduceerbaarheid** (reproducibility, AV, appraiser variation) | verschil tussen **operatoren** die hetzelfde stuk meten | variatie tussen operatorgemiddelden |
| **GRR** (gauge R&R) | totale meetspreiding = herhaalbaarheid + reproduceerbaarheid | $GRR=\sqrt{EV^2+AV^2}$ |
| **PV** (part variation) | echte verschillen tussen de stukken | variatie tussen stukgemiddelden |
| **TV** (total variation) | alles samen | $TV=\sqrt{GRR^2+PV^2}$ |

Juistheid (bias) en precisie (GRR) zijn verschillende dingen: een instrument kan precies maar systematisch fout zijn (bias, te corrigeren door kalibratie), of juist gemiddeld maar met veel spreiding.

### De Gauge R&R-studie

Typisch: **10 stukken** (die de procesvariatie dekken), **2 of 3 operatoren**, elke operator meet elk stuk **2 of 3 keer**, in willekeurige volgorde en zonder te weten welk stuk het is. Uit die gegevens splits je de variatie op.

**Average & Range methode (AIAG):**

| Stap | Betekenis | Formule |
|---|---|---|
| $\bar{\bar R}$ | gemiddelde range van de herhalingen (per stuk per operator), over alles | gemiddelde van alle ranges |
| **EV** | herhaalbaarheid: $\bar{\bar R}$ omgezet naar een standaardafwijking | $EV=\bar{\bar R}\cdot K_1$ ($K_1=1/d_2$: 0,8862 bij 2 herhalingen, 0,5908 bij 3) |
| $\bar X_{diff}$ | grootste min kleinste operatorgemiddelde | |
| **AV** | reproduceerbaarheid: operatorverschil, gecorrigeerd voor het deel herhaalbaarheid dat erin zit | $AV=\sqrt{(\bar X_{diff}K_2)^2-\frac{EV^2}{n\,r}}$ ($K_2$: 0,7071 bij 2 operatoren, 0,5231 bij 3) |
| **GRR** | meetsysteem totaal | $\sqrt{EV^2+AV^2}$ |
| $R_p$ | grootste min kleinste stukgemiddelde | |
| **PV** | variatie tussen de stukken | $PV=R_p\cdot K_3$ ($K_3$ hangt af van het aantal stukken, bv. 0,3146 bij 10) |
| **TV** | totaal | $\sqrt{GRR^2+PV^2}$ |
| **%GRR** | aandeel van het meetsysteem in de totale variatie | $100\cdot GRR/TV$ |
| **ndc** | aantal te onderscheiden categorieën (hoeveel "klassen" van stukken het systeem betrouwbaar uit elkaar houdt) | $\lfloor1{,}41\cdot PV/GRR\rfloor$ |

**Tabel van de constanten (AIAG, 1$\sigma$-waarden):**

| Constante | Gebruikt voor | Hangt af van | Waarden ($K$) | Bijhorende $d_2$ of $d_2^*$ $=1/K$ |
|---|---|---|---|---|
| $K_1$ | EV $=\bar{\bar R}\cdot K_1$ | aantal herhalingen $r$ | $r=2$: **0,8862** ; $r=3$: **0,5908** | 1,128 ; 1,693 |
| $K_2$ | AV, uit $\bar X_{diff}$ | aantal operatoren $o$ | $o=2$: **0,7071** ; $o=3$: **0,5231** | 1,414 ; 1,912 |
| $K_3$ | PV $=R_p\cdot K_3$ | aantal stukken $p$ | 2: 0,7071 ; 3: 0,5231 ; 4: 0,4467 ; 5: 0,4030 ; 6: 0,3742 ; 7: 0,3534 ; 8: 0,3375 ; 9: 0,3249 ; **10: 0,3146** | 1,414 ; 1,912 ; 2,239 ; 2,481 ; 2,672 ; 2,830 ; 2,963 ; 3,078 ; 3,179 |

**Waarom $K=1/d_2$?** Een range van $m$ normale waarden is gemiddeld $d_2\cdot\sigma$ (zie SPC: $\hat\sigma=\bar R/d_2$), dus $\sigma=\text{range}\cdot\frac{1}{d_2}=\text{range}\cdot K$. Bij $K_1$ middel je veel ranges (elk stuk bij elke operator), daarom de gewone $d_2$ van de regelkaarttabel ($d_2=1{,}128$ bij 2 herhalingen, 1,693 bij 3). Bij $K_2$ en $K_3$ heb je maar **één** range (van de operatorgemiddelden of de stukgemiddelden); daarvoor geldt een licht andere constante $d_2^*$ (bv. 1,414 in plaats van 1,128 bij 2 waarden). Daarom zijn $K_2$ en $K_3$ niet gewoon $1/d_2$ uit de SPC-tabel.

**Voorbeeld (10 stukken, 3 operatoren, 3 herhalingen):** $K_1=0{,}5908$ ($r=3$), $K_2=0{,}5231$ ($o=3$), $K_3=0{,}3146$ ($p=10$). Oudere bronnen gebruiken 5,15$\sigma$-waarden ($K_1=4{,}56$ bij 2 en $3{,}05$ bij 3 herhalingen); de percentages t.o.v. TV blijven dan gelijk.

De K-constanten zetten een range om naar een standaardafwijking ($K=1/d_2$), zoals bij een regelkaart ($\hat\sigma=\bar R/d_2$). De percentages zijn verhoudingen van **standaardafwijkingen** en tellen dus niet op tot 100% (de varianties wel: % contributie).

**ANOVA-methode:** dezelfde gegevens als tweeweg-ANOVA met herhaling (stuk x operator). De mean squares geven variantiecomponenten: $\sigma^2_{EV}=MS_E$, $\sigma^2_{AV}=(MS_O-MS_E)/(p\,r)$, $\sigma^2_{PV}=(MS_P-MS_E)/(o\,r)$ (cursusmethode). Voordelen: nauwkeuriger, werkt met elk gebalanceerd ontwerp, en kan de **interactie** stuk x operator schatten (AIAG-variant).

### Beoordeling

| %GRR (t.o.v. TV of tolerantie) | % contributie (varianties) | Oordeel |
|---|---|---|
| $\le10\%$ | $\le1\%$ | aanvaardbaar |
| $10$ - $30\%$ | $1$ - $9\%$ | voorwaardelijk aanvaardbaar (belang, kost, toepassing) |
| $>30\%$ | $>9\%$ | onaanvaardbaar: meetsysteem verbeteren |

En **ndc $\ge5$**. Twee referenties:
- **%GRR t.o.v. TV:** geschikt om het **proces** te bewaken en te verbeteren (SPC, capabiliteit).
- **%GRR t.o.v. tolerantie** $=100\cdot6\,GRR/(USL-LSL)$: geschikt om **stukken te keuren** (goed/slecht).

**Wat verbeteren?** EV groot (herhaalbaarheid): het **instrument** (onderhoud, beter instrument, opspanning). AV groot (reproduceerbaarheid): de **operatoren** (opleiding, duidelijke procedure, hulpmiddelen). Interactie stuk x operator: sommige operatoren hebben moeite met bepaalde stukken.

### Gevolg voor de capabiliteit

Meetfout maakt het proces **slechter dan het is**:
$$\frac{1}{C_{p,\text{waargenomen}}^2}=\frac{1}{C_{p,\text{werkelijk}}^2}+\%GRR^2\quad(\%GRR\text{ t.o.v. tolerantie, als fractie})$$
Voorbeeld: werkelijke $C_p=2$; met $\%GRR=10\%$ zie je 1,96, met 30% 1,71, met 60% slechts 1,28. Het verschil komt volledig van het meetsysteem.

### Meetonzekerheid

Het resultaat van een meting is een interval: $\text{waarde}\pm U$ met $U=k\cdot u_c$ (uitgebreide onzekerheid, $k=2$ voor ongeveer 95%). $u_c$ = gecombineerde standaardonzekerheid uit alle bronnen (type A: uit herhaalde metingen, statistiek; type B: uit certificaten, specificaties, resolutie).
- **Som of verschil:** $u_c=\sqrt{u_1^2+u_2^2+\dots}$ (kwadratisch optellen, ook bij aftrekken).
- **Product of quotiënt:** relatieve onzekerheden kwadratisch optellen: $\frac{u_c}{|y|}=\sqrt{(\frac{u_1}{x_1})^2+(\frac{u_2}{x_2})^2}$.
- **Functie** $y=f(x)$: $u(y)\approx|f'(x)|\,u(x)$; bv. $y=x^2$: de relatieve onzekerheid verdubbelt.
- **Conformiteit:** aanvaard een stuk pas zeker als waarde $\pm U$ volledig binnen de specificatie valt (guard band).

### Voorbeeld (AIAG-handboek: 10 stukken, 3 operatoren, 3 herhalingen)

$\bar{\bar R}=0{,}342\Rightarrow EV=0{,}342\cdot0{,}5908=0{,}202$. $\bar X_{diff}=0{,}445\Rightarrow AV=\sqrt{(0{,}445\cdot0{,}5231)^2-0{,}202^2/30}=0{,}230$. $GRR=\sqrt{0{,}202^2+0{,}230^2}=0{,}306$. $R_p=3{,}51\Rightarrow PV=3{,}51\cdot0{,}3146=1{,}105$. $TV=\sqrt{0{,}306^2+1{,}105^2}=1{,}146$. **%GRR = 26,7%** (voorwaardelijk aanvaardbaar) en $ndc=\lfloor1{,}41\cdot1{,}105/0{,}306\rfloor=5$ (net voldoende). Herhaalbaarheid en reproduceerbaarheid dragen ongeveer even veel bij, dus zowel instrument als operatoren verdienen aandacht.
