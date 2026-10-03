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

### Voorbeeld stap voor stap (AIAG-handboek: 10 stukken, 3 operatoren, 3 herhalingen)

**De studie.** 10 stukken die de spreiding van het proces dekken, worden elk 3 keer gemeten door 3 operatoren (A, B, C), in willekeurige volgorde: $10\times3\times3=90$ metingen. De waarden zijn afwijkingen t.o.v. een nominale maat. Kolom A1 = eerste meting van operator A, A2 = tweede, A3 = derde. $R_A$ = range (grootste min kleinste) van de 3 metingen van operator A op dat stuk.

| stuk | A1 | A2 | A3 | **R_A** | B1 | B2 | B3 | **R_B** | C1 | C2 | C3 | **R_C** | **stukgem.** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0,29 | 0,41 | 0,64 | **0,35** | 0,08 | 0,25 | 0,07 | **0,18** | 0,04 | −0,11 | −0,15 | **0,19** | **0,169** |
| 2 | −0,56 | −0,68 | −0,58 | **0,12** | −0,47 | −1,22 | −0,68 | **0,75** | −1,38 | −1,13 | −0,96 | **0,42** | **−0,851** |
| 3 | 1,34 | 1,17 | 1,27 | **0,17** | 1,19 | 0,94 | 1,34 | **0,40** | 0,88 | 1,09 | 0,67 | **0,42** | **1,099** |
| 4 | 0,47 | 0,50 | 0,64 | **0,17** | 0,01 | 1,03 | 0,20 | **1,02** | 0,14 | 0,20 | 0,11 | **0,09** | **0,367** |
| 5 | −0,80 | −0,92 | −0,84 | **0,12** | −0,56 | −1,20 | −1,28 | **0,72** | −1,46 | −1,07 | −1,45 | **0,39** | **−1,064** |
| 6 | 0,02 | −0,11 | −0,21 | **0,23** | −0,20 | 0,22 | 0,06 | **0,42** | −0,29 | −0,67 | −0,49 | **0,38** | **−0,186** |
| 7 | 0,59 | 0,75 | 0,66 | **0,16** | 0,47 | 0,55 | 0,83 | **0,36** | 0,02 | 0,01 | 0,21 | **0,20** | **0,454** |
| 8 | −0,31 | −0,20 | −0,17 | **0,14** | −0,63 | 0,08 | −0,34 | **0,71** | −0,46 | −0,56 | −0,49 | **0,10** | **−0,342** |
| 9 | 2,26 | 1,99 | 2,01 | **0,27** | 1,80 | 2,12 | 2,19 | **0,39** | 1,77 | 1,45 | 1,87 | **0,42** | **1,940** |
| 10 | −1,36 | −1,25 | −1,31 | **0,11** | −1,68 | −1,62 | −1,50 | **0,18** | −1,49 | −1,77 | −2,16 | **0,67** | **−1,571** |
| **R̄ per operator** | | | | **0,184** | | | | **0,513** | | | | **0,328** | |
| **gemiddelde operator** | | | | **0,190** | | | | **0,068** | | | | **−0,254** | |

**Stap 1 - ranges per stuk en per operator.** Voor elk stuk en elke operator: grootste min kleinste van de 3 herhalingen. Bv. stuk 1, operator A: metingen 0,29 ; 0,41 ; 0,64, dus $R=0{,}64-0{,}29=0{,}35$. Een range meet hoeveel **dezelfde operator op hetzelfde stuk** verschilt: dat is zuivere herhaalbaarheid.

**Stap 2 - $\bar R$ per operator en $\bar{\bar R}$.** Gemiddelde van de 10 ranges per operator: $\bar R_A=0{,}184$, $\bar R_B=0{,}513$, $\bar R_C=0{,}328$. Hun gemiddelde: $\bar{\bar R}=(0{,}184+0{,}513+0{,}328)/3=0{,}342$. Operator B herhaalt duidelijk het slechtst (grootste ranges).

**Stap 3 - EV (herhaalbaarheid).** De range omzetten naar een standaardafwijking met $K_1$ (3 herhalingen: $K_1=0{,}5908=1/1{,}693$): $EV=0{,}342\cdot0{,}5908=0{,}202$.

**Stap 4 - $\bar X_{diff}$ en AV (reproduceerbaarheid).** Gemiddelde per operator over alle 30 metingen: A $=0{,}190$, B $=0{,}068$, C $=-0{,}254$. Het verschil grootste min kleinste: $\bar X_{diff}=0{,}190-(-0{,}254)=0{,}445$: operator A meet gemiddeld 0,445 hoger dan operator C. Omzetten met $K_2$ (3 operatoren: 0,5231) en corrigeren voor het stukje herhaalbaarheid dat in elk operatorgemiddelde zit ($n=10$ stukken, $r=3$ herhalingen):
$$AV=\sqrt{(0{,}445\cdot0{,}5231)^2-\frac{0{,}202^2}{10\cdot3}}=\sqrt{0{,}05411-0{,}00136}=\sqrt{0{,}05275}=0{,}230$$

**Stap 5 - GRR (meetsysteem totaal).** Standaardafwijkingen kwadratisch optellen: $GRR=\sqrt{0{,}202^2+0{,}230^2}=0{,}306$.

**Stap 6 - $R_p$ en PV (stukvariatie).** Gemiddelde per stuk over alle 9 metingen (laatste kolom): van $-1{,}571$ (stuk 10) tot $1{,}940$ (stuk 9). $R_p=1{,}940-(-1{,}571)=3{,}511$. Omzetten met $K_3$ (10 stukken: 0,3146): $PV=3{,}511\cdot0{,}3146=1{,}105$.

**Stap 7 - TV (totale variatie).** $TV=\sqrt{GRR^2+PV^2}=\sqrt{0{,}306^2+1{,}105^2}=1{,}146$.

**Stap 8 - percentages en ndc.**

| Grootheid | waarde | % van TV ($100\cdot x/TV$) | % contributie ($100\cdot x^2/TV^2$) |
|---|---|---|---|
| EV (herhaalbaarheid) | 0,202 | 17,6% | 3,1% |
| AV (reproduceerbaarheid) | 0,230 | 20,0% | 4,0% |
| **GRR** | **0,306** | **26,7%** | **7,1%** |
| PV (stukken) | 1,105 | 96,4% | 92,9% |
| TV | 1,146 | 100% | 100% |

De percentages t.o.v. TV tellen niet op tot 100% (het zijn standaardafwijkingen); de contributies (varianties) wel: $7{,}1\%+92{,}9\%=100\%$. $ndc=\lfloor1{,}41\cdot1{,}105/0{,}306\rfloor=\lfloor5{,}09\rfloor=5$.

**Interpretatie.**
- **%GRR = 26,7%** ligt tussen 10% en 30%: het meetsysteem is **voorwaardelijk aanvaardbaar**, afhankelijk van het belang van de meting en de kost van verbetering.
- **ndc = 5:** het systeem kan de stukken in 5 betrouwbare klassen indelen; net voldoende (minimum 5).
- **Waar zit de meetfout?** EV (0,202) en AV (0,230) zijn ongeveer even groot, dus zowel het instrument als de operatoren dragen bij. Uit de tabel: operator B heeft de grootste herhalingsverschillen ($\bar R_B=0{,}513$), dus B meet minst consistent (opleiding, methode). Operator C meet systematisch lager dan A (0,445 verschil): een verschil in procedure of aflezing.
- **Verbetering:** de meetprocedure standaardiseren en operator B opleiden (verlaagt AV en een deel van EV); daarna de studie herhalen.
