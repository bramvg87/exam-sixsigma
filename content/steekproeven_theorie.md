### Waarom aanvaardingssteekproeven?

Een leverancier stuurt een **lot** (partij) van bv. 10 000 stuks. Alles nakijken (100%-keuring) is duur, traag, soms onmogelijk (destructieve test) en zelfs niet foutloos (vermoeidheid). Daarom neem je een **steekproef** van $n$ stuks en beslis je op basis daarvan over het **hele lot**: aanvaarden of afkeuren (terugsturen, sorteren). Dat is een **hypothesetoets** op het lot:

- $H_0$: het lot is goed (fractie defect $\pi$ op of onder een aanvaardbaar niveau).
- $H_A$: het lot is slecht (fractie defect te hoog).

Een steekproef verbetert de kwaliteit niet; ze helpt beslissen. Het doel is goede lots bijna altijd door te laten en slechte lots bijna altijd tegen te houden.

### Begrippen

| Begrip | Betekenis |
|---|---|
| $N$ | lotgrootte (aantal stuks in het lot) |
| $\pi$ | ware fractie defect in het lot (onbekend) |
| $n$ | steekproefgrootte: aantal stuks dat je keurt |
| $d$ | aantal defecten in de steekproef (wat je telt) |
| $c$ | **aanvaardingsgetal**: aanvaard het lot als $d\le c$, keur af als $d>c$ |
| **AQL** (Acceptable Quality Level) | een fractie defect die de klant nog als **goed** beschouwt; zulke lots wil je aanvaarden |
| **LQL** (Limiting Quality Level, ook LTPD of RQL) | een fractie defect die duidelijk **slecht** is; zulke lots wil je afkeuren |
| $P_{acc}(\pi)$ | kans dat een lot met fractie defect $\pi$ aanvaard wordt |
| $\alpha$ = **producentenrisico** | kans dat een **goed** lot (op AQL) toch afgekeurd wordt: $1-P_{acc}(AQL)$; fout van de 1e soort, de producent is benadeeld |
| $\beta$ = **consumentenrisico** | kans dat een **slecht** lot (op LQL) toch aanvaard wordt: $P_{acc}(LQL)$; fout van de 2e soort, de klant is benadeeld |

### Hoe werkt een enkelvoudig plan $(n,c)$? Uitgewerkt voorbeeld $(100, 4)$

**Werkwijze:** neem willekeurig 100 stuks uit het lot, tel de defecten $d$. Is $d\le4$: aanvaard het lot. Is $d\ge5$: keur af.

**Waarom de binomiale verdeling?** Elk getrokken stuk is defect met kans $\pi$, onafhankelijk van de andere (bij een groot lot). Het aantal defecten in 100 stuks is dan binomiaal: $P(d=k)=\binom{100}{k}\pi^k(1-\pi)^{100-k}$. Aanvaarden gebeurt bij $d=0,1,2,3$ of $4$, dus
$$P_{acc}(\pi)=P(d\le4)=\sum_{k=0}^{4}\binom{100}{k}\pi^k(1-\pi)^{100-k}=\texttt{BINOM.DIST}(4;100;\pi;\text{WAAR})$$

**Een goed lot (AQL = 2%):** verwacht aantal defecten in de steekproef $n\pi=100\cdot0{,}02=2$.

| $k$ defecten | 0 | 1 | 2 | 3 | 4 | **som = $P_{acc}$** |
|---|---|---|---|---|---|---|
| $P(d=k)$ bij $\pi=2\%$ | 0,1326 | 0,2707 | 0,2734 | 0,1823 | 0,0902 | **0,9492** |

Bv. $P(d=0)=0{,}98^{100}=0{,}1326$ en $P(d=1)=100\cdot0{,}02\cdot0{,}98^{99}=0{,}2707$. Een lot met 2% defect wordt dus in **94,9%** van de gevallen aanvaard; het **producentenrisico** is $\alpha=1-0{,}9492=$ **5,1%**.

**Een slecht lot (LQL = 8%):** verwacht $100\cdot0{,}08=8$ defecten, ver boven $c=4$.

| $k$ defecten | 0 | 1 | 2 | 3 | 4 | **som = $P_{acc}$** |
|---|---|---|---|---|---|---|
| $P(d=k)$ bij $\pi=8\%$ | 0,0002 | 0,0021 | 0,0090 | 0,0254 | 0,0536 | **0,0903** |

Een lot met 8% defect wordt toch nog in **9,0%** van de gevallen aanvaard: het **consumentenrisico** is $\beta=$ **9,0%**.

### De OC-curve (operating characteristic)

De OC-curve is $P_{acc}$ uitgezet tegen de ware fractie defect $\pi$. Ze beschrijft het plan volledig: voor elke kwaliteit van het lot hoe groot de kans is dat het door de keuring raakt.

- **Ideaal** (perfecte 100%-keuring): een verticale stap, alles onder een grens aanvaarden, alles erboven afkeuren.
- **Echt** (steekproef): een glooiende curve. Tussen AQL en LQL ligt een "grijze zone" waar het plan twijfelt.
- Twee punten bepalen het plan: $(AQL;\ 1-\alpha)$ moet hoog liggen, $(LQL;\ \beta)$ laag.

**Invloed van $n$ en $c$** (zelfde verhouding $c/n$):

| plan | $P_{acc}(2\%)$ | $\alpha$ | $P_{acc}(8\%)=\beta$ |
|---|---|---|---|
| $(50, 2)$ | 0,922 | 7,8% | 22,6% |
| $(100, 4)$ | 0,949 | 5,1% | 9,0% |
| $(130, 5)$ | 0,953 | 4,7% | 4,7% |
| $(200, 8)$ | 0,980 | 2,0% | 1,8% |

Een **grotere steekproef** maakt de curve **steiler**: beide risico's dalen samen. Bij vaste $n$ geeft een **grotere $c$** een kleiner $\alpha$ maar een groter $\beta$ (soepeler); een kleinere $c$ het omgekeerde. Beide risico's tegelijk verkleinen kan enkel met meer keuringen.

**Welke verdeling?** Binomiaal voor grote lots (of $n/N<10\%$). **Hypergeometrisch** is exact bij een klein lot (trekken zonder teruglegging): `HYPGEOM.DIST(d;n;D;N;WAAR)` met $D=\pi N$ defecten in het lot. **Poisson** met $\lambda=n\pi$ is een benadering voor grote $n$ en kleine $\pi$ (handig voor tabellen).

### Betrouwbaarheidsinterval versus klassieke toets: dezelfde beslissing

Een steekproefplan is een **hypothesetoets**, en elke toets kan je ook uitvoeren met een **betrouwbaarheidsinterval (BI)**. De cursus bevestigt dat met drie punten van de OC-curve van $(100, 4)$:

| $P_{acc}$ | $\pi$ in het lot | betekenis |
|---|---|---|
| 99% | 1,30% | goed lot: maar 1% kans op onterecht afkeuren |
| 90% | 2,45% | grensgeval als AQL: 10% kans op onterecht afkeuren |
| 10% | 7,85% | slecht lot: 10% kans op onterecht aanvaarden |

**Stap 1 - het plan als toets.** Kies AQL $=2{,}45\%$:
- $H_0$: lot OK $\iff \pi\le AQL=2{,}45\%$; $H_A$: lot NOK $\iff \pi>2{,}45\%$.
- Een lot met precies $\pi=2{,}45\%$ wordt met 90% kans aanvaard, dus met 10% kans onterecht afgekeurd: de **significantie is $\alpha=10\%$**. Een lot met minder defecten (bv. 1,30%) heeft nog minder kans om onterecht afgekeurd te worden (1%). Een lot met meer defecten (bv. 7,85%) wordt soms onterecht aanvaard (10%): dat is $\beta$.

**Stap 2 - dezelfde toets met een BI.** Trek $n=100$ stuks en tel $d$ defecten ($P=d/100$). Bereken het **eenzijdige 90%-BI** voor $\pi$: $[L(d);\ 100\%]$. Aanvaard $H_0$ als AQL in het BI ligt.

| $d$ | $P$ | ondergrens $L(d)$ (exact) | 2,45% in BI? | plan $(100,4)$ |
|---|---|---|---|---|
| 0 | 0% | 0% | ja | aanvaarden |
| 2 | 2% | 0,53% | ja | aanvaarden |
| 4 | 4% | 1,75% | ja | aanvaarden ($d\le4$) |
| 5 | 5% | 2,45% | grens: nee | afkeuren ($d>4$) |
| 6 | 6% | 3,18% | nee | afkeuren |

Het BI bevat de AQL precies voor $P=0\%$ tot $4\%$, dus precies voor $d\le c$: **dezelfde beslissing als het plan**. (De cursustabel toont iets andere grenzen, bv. 2,10% bij $P=4\%$, omdat ze een benaderend BI gebruikt; de conclusie is dezelfde.)

**Waarom is dat zo?** De ondergrens $L(d)$ is de $\pi$ waarbij $d$ of meer defecten precies kans $\alpha$ hebben: $P(D\ge d\mid\pi=L)=\alpha$. Bij $d=c+1=5$ is dat $P(D\ge5\mid\pi)=1-P_{acc}(\pi)=10\%$, en dat gebeurt precies bij $\pi=2{,}45\%$. In Excel:

$$\pi\ \text{bij}\ P_{acc}=\gamma:\quad \pi=\texttt{BETA.INV}(1-\gamma;\ c+1;\ n-c)$$

bv. $\texttt{BETA.INV}(0{,}1;\ 5;\ 96)=2{,}45\%$, $\texttt{BETA.INV}(0{,}01;\ 5;\ 96)=1{,}30\%$ en $\texttt{BETA.INV}(0{,}9;\ 5;\ 96)=7{,}83\%$. Zo lees je elk punt van de OC-curve af zonder te zoeken. Doe je dit voor verschillende BI-niveaus (99%, 90%, 10%), dan krijg je de drie curves van de cursusfiguur: bij $d=c+1$ snijden ze op 1,30%, 2,45% en 7,85%.

**Samengevat:** keuren met $(n,c)$ $\iff$ toetsen van $H_0:\pi\le\pi_0$ met $\alpha=1-P_{acc}(\pi_0)$ $\iff$ nagaan of $\pi_0$ in het eenzijdige $(1-\alpha)$-BI ligt. In het tabblad **Enkelvoudig plan** kan je onderaan zelf een $\pi$ invullen en dit voor elk plan bekijken.

### Een plan ontwerpen

Je kiest vooraf AQL, LQL, het toegelaten $\alpha$ en $\beta$, en zoekt het **kleinste** $n$ met een $c$ waarvoor beide eisen kloppen. Voorbeeld AQL 2%, LQL 8%, $\alpha\le5\%$, $\beta\le5\%$:

| $n$ | grootste $c$ met $\beta\le5\%$ | $\alpha$ | $\beta$ | ok? |
|---|---|---|---|---|
| 100 | 3 | 14,1% | 3,7% | nee ($\alpha$ te groot) |
| 120 | 4 | 9,4% | 3,3% | nee |
| 129 | 5 | 4,6% | 4,9% | **ja** |
| 130 | 5 | 4,7% | 4,7% | ja (cursusplan) |

Waarom wordt $n$ groot? AQL en LQL liggen maar een factor 4 uit elkaar; om zulke gelijkaardige kwaliteiten betrouwbaar te onderscheiden moet de OC-curve steil zijn, en steilheid kost keuringen.

### Dubbel steekproefplan

Een **tweede kans** bij twijfel. Plan $(n_1,c_1,c_2)+(n_2,c_3)$, cursusvoorbeeld $(90, 2, 7)+(90, 8)$:
1. Neem 90 stuks. $d_1\le2$: **aanvaard** meteen. $d_1\ge7$: **keur af** meteen.
2. Bij $3\le d_1\le6$ (twijfel): neem nog 90 stuks; aanvaard als $d_1+d_2\le8$.

| kwaliteit | meteen aanvaard | meteen afgekeurd | 2e steekproef nodig | $P_{acc}$ dubbel | $P_{acc}$ enkelvoudig $(175,8)$ | gemiddeld gekeurd (ASN) |
|---|---|---|---|---|---|---|
| 2% (goed) | 73,1% | 0,2% | 26,7% | 0,989 | 0,991 | 114 |
| 5% | 16,6% | 16,4% | 67,0% | 0,469 | 0,486 | 150 |
| 8% (slecht) | 2,2% | 58,7% | 39,2% | 0,055 | 0,055 | 125 |

De twee plannen hebben bijna dezelfde OC-curve (ze beschermen even goed), maar het dubbele plan keurt **gemiddeld minder stuks**: ASN $=n_1+n_2\cdot P(\text{2e steekproef})$, bv. bij 2%: $90+90\cdot0{,}267=114$ tegenover altijd 175. Duidelijk goede of slechte lots worden al na 90 stuks beslist. Nadeel: complexer en een wisselende werklast. **Sequentiële** plannen gaan nog verder: na elk stuk beslissen (aanvaarden, afkeuren of doorgaan).

### Variabelenplan $(n,k)$

In plaats van goed/fout te tellen, **meet** je een kenmerk (bv. diameter) met een specificatiegrens $\xi$. Uit $n$ metingen bereken je $\bar x$ en $s$ en de afstand tot de grens in standaardafwijkingen:
$$Q=\frac{\bar x-\xi}{s}\ (\text{ondergrens})\quad\text{of}\quad Q=\frac{\xi-\bar x}{s}\ (\text{bovengrens});\qquad \text{aanvaard als } Q\ge k$$
**Waarom werkt dit?** Bij een normale verdeling bepaalt de afstand gemiddelde-grens de fractie buiten specificatie: fractie $p$ hoort bij afstand $z_{1-p}$. Omdat $\bar x$ en $s$ geschat zijn, moet $k$ iets groter zijn dan $z_{1-p_0}$.
**Voorbeeld:** $n=20$, $p_0=$ AQL $=2\%$, $\alpha=5\%$: $z_{0{,}98}=2{,}05$ en $k=2{,}93$ (exact). Gemeten $\bar x=10{,}5$, $s=0{,}15$, ondergrens $\xi=10{,}0$: $Q=(10{,}5-10{,}0)/0{,}15=3{,}33\ge2{,}93$, dus **aanvaarden**.
Voordeel: meer informatie per stuk, dus veel kleinere $n$ dan een attributenplan met hetzelfde onderscheidingsvermogen. Nadeel: vereist normaliteit en een plan per kenmerk.

### Defecten in een lot bij gekende capabiliteit

Is het proces gekend ($C_{pk}$, gecentreerd), dan is $\pi=2\,P(Z>3C_{pk})$ en het aantal defecten in een lot van $N$ stuks binomiaal$(N,\pi)$. Bv. $C_{pk}=1$: $\pi=0{,}27\%$, dus in 10 000 stuks gemiddeld 27 defecten, praktisch tussen ongeveer 12 en 44. Een lot met 100 defecten is dan zo onwaarschijnlijk dat het **proces veranderd** moet zijn.

### Steekproefmethoden

| Methode | Werkwijze | Wanneer |
|---|---|---|
| **Enkelvoudig aselect (SRS)** | elk stuk heeft dezelfde kans om gekozen te worden (toevalsgetallen) | basis, als de populatie homogeen is |
| **Gestratificeerd** | populatie in strata (lijn, ploeg, leverancier), in **elk** stratum een aselecte steekproef | strata verschillen onderling: nauwkeuriger dan SRS (zie tab Stratificatie) |
| **Cluster** | kies willekeurig enkele groepen (dozen, pallets) en keur die **volledig** | goedkoop en praktisch; minder nauwkeurig als clusters verschillen |
| **Systematisch** | elk $k$-de stuk (bv. elke 50e) | eenvoudig; gevaarlijk als het proces een periodiek patroon heeft |

**Non-response en selectiebias:** fouten ontstaan ook na de selectie (stuks die niet gemeten kunnen worden, enkel de bovenste laag van een pallet nemen). Geen enkele methode is daar immuun voor; daarom willekeurig trekken uit het **hele** lot.

### p-waarde bij een lot

Met $d$ gevonden defecten kan je ook een p-waarde berekenen: $P(D\ge d\mid\pi=AQL)$. Klein betekent: zoveel defecten zijn onwaarschijnlijk als het lot echt op AQL-niveau is.
