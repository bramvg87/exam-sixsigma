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
