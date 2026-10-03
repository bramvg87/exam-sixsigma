### Wat doet ANOVA?

**Variantieanalyse (ANOVA, analysis of variance)** toetst of de **gemiddelden** van meerdere groepen verschillen, bv. de opbrengst bij 3 temperaturen of de sterkte bij 5 katoenpercentages. Ondanks de naam vergelijkt ANOVA gemiddelden, maar het doet dat door **varianties** te vergelijken.

- Een **factor** is de variabele die je verandert (temperatuur, machine, operator). De **niveaus** (levels) zijn de waarden ervan (bv. 3 temperaturen).
- De **respons** $Y$ is wat je meet. Elke groep = alle metingen bij één niveau.
- $H_0:\ \mu_1=\mu_2=\dots=\mu_a$ (de factor heeft geen effect) tegen $H_A$: minstens één gemiddelde verschilt. ANOVA zegt **niet welk**.

**Waarom niet gewoon t-toetsen per paar?** Met 3 groepen zijn er 3 paren, met 5 groepen al 10. Elke t-toets op 5% heeft 5% kans op vals alarm, dus de kans op minstens één vals alarm loopt op ($1-0{,}95^3=14\%$ bij 3 paren, $1-0{,}95^{10}=40\%$ bij 10). ANOVA toetst alles in één keer op niveau $\alpha$.

### Het kernidee: spreiding opsplitsen

Model: $Y_{ij}=\mu+\tau_i+\varepsilon_{ij}$: elke meting = algemeen gemiddelde + effect van groep $i$ + toevallige fout ($\varepsilon\sim N(0,\sigma^2)$). Splits de totale spreiding in twee delen:

$$\underbrace{\sum_{i,j}(y_{ij}-\bar y)^2}_{SS_T\ \text{totaal}}=\underbrace{\sum_i n_i(\bar y_i-\bar y)^2}_{SS_B\ \text{tussen groepen}}+\underbrace{\sum_{i,j}(y_{ij}-\bar y_i)^2}_{SS_W\ \text{binnen groepen}}$$

| Begrip | Betekenis | Berekening |
|---|---|---|
| $\bar y_i$ | groepsgemiddelde | `=AVERAGE(groep)` |
| $\bar y$ | grootgemiddelde (alle metingen) | `=AVERAGE(alle data)` |
| $SS_B$ (between, treatment) | hoe ver de groepsgemiddelden uit elkaar liggen: **effect + ruis** | $\sum n_i(\bar y_i-\bar y)^2$ |
| $SS_W$ (within, error) | spreiding rond elk groepsgemiddelde: **enkel ruis** | $\sum$ `DEVSQ(groep)` |
| $SS_T$ | totale spreiding | `=DEVSQ(alle data)` |
| df | vrijheidsgraden | tussen: $a-1$; binnen: $N-a$; totaal: $N-1$ |
| $MS=SS/df$ | mean square: een **variantieschatting** | $MS_B=SS_B/(a-1)$, $MS_W=SS_W/(N-a)$ |
| $F$ | verhouding van de twee variantieschattingen | $MS_B/MS_W$ |

**Waarom delen door df?** Een som van kwadraten groeit met het aantal termen; delen door de vrijheidsgraden maakt er een gemiddelde kwadratische afwijking van, dus een variantie. $a-1$: van de $a$ groepsgemiddelden ligt er één vast door het grootgemiddelde. $N-a$: $N$ metingen min de $a$ geschatte groepsgemiddelden.

**De F-logica (signaal/ruis).** $MS_W$ schat altijd $\sigma^2$ (de ruis). $MS_B$ schat ook $\sigma^2$ **als $H_0$ waar is**, maar wordt groter als de groepen echt verschillen. Onder $H_0$ is $F\approx1$; een echt effect geeft $F\gg1$. De toets is daarom altijd **rechtszijdig**: verwerp $H_0$ als $F>F_{krit}=F_{1-\alpha}(a-1;N-a)$, of als p $<\alpha$.

### Uitgewerkt voorbeeld stap voor stap: van metingen naar ANOVA-tabel

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

### Na een significante F: welke groepen verschillen?

Een **post-hoc** vergelijking: paarsgewijze t-toetsen met $s_p=\sqrt{MS_W}$ en Bonferroni-correctie ($\alpha/m$ voor $m$ paren), Fisher's LSD (Least Significant Difference: $t_{1-\alpha/2;\,N-a}\sqrt{MS_W(1/n_i+1/n_j)}$), of Tukey. Kijk ook naar het gemiddeldenplot.

### Aannames

1. **Onafhankelijke** metingen (randomiseer de volgorde van de proeven).
2. **Normale** residuen per groep (residu = meting - groepsgemiddelde).
3. **Gelijke varianties** per groep (vuistregel: grootste/kleinste $s$ hoogstens ongeveer 2). Bij gelijke groepsgroottes is ANOVA vrij robuust.

### Tweeweg-ANOVA: twee factoren tegelijk

Twee factoren A (rijen, $a$ niveaus) en B (kolommen, $b$ niveaus), bv. machine en operator. Model met $r$ herhalingen per cel:
$$Y_{ijk}=\mu+\alpha_i+\beta_j+(\alpha\beta)_{ij}+\varepsilon_{ijk}$$

| Bron | SS | df | F |
|---|---|---|---|
| A (rijen) | $br\sum_i(\bar y_{i\cdot}-\bar y)^2$ | $a-1$ | $MS_A/MS_E$ |
| B (kolommen) | $ar\sum_j(\bar y_{\cdot j}-\bar y)^2$ | $b-1$ | $MS_B/MS_E$ |
| Interactie AB | $r\sum_{i,j}(\bar y_{ij}-\bar y_{i\cdot}-\bar y_{\cdot j}+\bar y)^2$ | $(a-1)(b-1)$ | $MS_{AB}/MS_E$ |
| Fout (binnen cellen) | $\sum(y_{ijk}-\bar y_{ij})^2$ | $ab(r-1)$ | |
| Totaal | $\sum(y_{ijk}-\bar y)^2$ | $abr-1$ | |

- **Hoofdeffect** A: verschillen tussen de rijgemiddelden, uitgemiddeld over B. Idem voor B.
- **Interactie** AB: het effect van A **hangt af** van het niveau van B. In het interactieplot (één lijn per niveau van A): evenwijdige lijnen = geen interactie, niet-evenwijdige of kruisende lijnen = interactie.
- **Leesvolgorde:** eerst de interactie. Is die significant, dan zijn de hoofdeffecten niet los te interpreteren ("het hangt ervan af"): bekijk de celgemiddelden. Is ze niet significant, interpreteer dan A en B apart.
- **Voordeel boven twee eenweg-ANOVA's:** de variatie door de andere factor gaat uit de foutterm, dus de toets wordt gevoeliger (zelfde idee als blokken in DOE).

**Zonder herhaling** ($r=1$, één meting per cel): er is geen zuivere fout. Wat overblijft na A en B ($SS_E=SS_T-SS_A-SS_B$, df $(a-1)(b-1)$) bevat de interactie **en** de ruis samen; je moet veronderstellen dat er geen interactie is.

**Voorbeelden (ANOVA-tool):**
- *Machines x operatoren, zonder herhaling:* volledig uitgewerkt in het voorbeeld hieronder.
- *Plantengroei: water x zon, met 5 herhalingen* (alle metingen en celgemiddelden: laad het voorbeeld in de tab Tweeweg en open "Wat betekent dit voorbeeld?"): zon $F=23{,}05$ (p $<0{,}001$, significant), water $F=0{,}001$ (p $=0{,}98$), interactie $F=1{,}24$ (p $=0{,}31$, niet significant): de zon bepaalt de groei, en dat effect is hetzelfde bij dagelijks of wekelijks water geven.

### Uitgewerkt voorbeeld tweeweg zonder herhaling: stap voor stap

**De vraag.** 5 operatoren werken elk op 4 machines; per combinatie één score (hoger = beter). Hangt de score af van de machine? Van de operator?

**Stap 0 - de metingen** met rij- en kolomgemiddelden (grootgemiddelde $\bar y=53$):

| | Milling | Turning | Painting | Cutting | rijgemiddelde | afwijking |
|---|---|---|---|---|---|---|
| Peter | 46 | 56 | 55 | 47 | 51 | $-2$ |
| Paul | 54 | 55 | 51 | 56 | 54 | $+1$ |
| Mary | 48 | 56 | 50 | 58 | 53 | $0$ |
| Donald | 46 | 60 | 51 | 59 | 54 | $+1$ |
| Hillary | 51 | 53 | 53 | 55 | 53 | $0$ |
| **kolomgemiddelde** | 49 | 56 | 52 | 55 | **53** | |
| **afwijking** | $-4$ | $+3$ | $-1$ | $+2$ | | |

**Stap 1 - $SS$ operator (rijen).** Afwijkingen van de rijgemiddelden tot 53, in het kwadraat, maal het aantal metingen per rij (4 machines): $4\cdot[(-2)^2+1^2+0^2+1^2+0^2]=4\cdot6=$ **24**, df $=5-1=4$.

**Stap 2 - $SS$ machine (kolommen).** Afwijkingen van de kolomgemiddelden, in het kwadraat, maal het aantal metingen per kolom (5 operatoren): $5\cdot[(-4)^2+3^2+(-1)^2+2^2]=5\cdot30=$ **150**, df $=4-1=3$.

**Stap 3 - $SS_T$.** Alle 20 metingen t.o.v. 53: $\sum(y-53)^2=$ **330** (`=DEVSQ(alle data)`), df $=19$.

**Stap 4 - $SS_E$ (rest).** Wat niet door operator of machine verklaard wordt: $330-24-150=$ **156**, df $=(5-1)(4-1)=12$. (Per cel is het residu $y-\text{rijgem.}-\text{kolomgem.}+53$; bv. Peter-Painting: $55-51-52+53=5$: Peter scoort daar 5 hoger dan je uit "Peter" en "Painting" afzonderlijk zou verwachten. De som van alle 20 kwadraten van zulke residuen is 156.)

**Stap 5 - MS, F en p.**

| Bron | SS | df | MS | F | $F_{krit}$ (5%) | p |
|---|---|---|---|---|---|---|
| Operator | 24 | 4 | $24/4=6$ | $6/13=0{,}46$ | 3,26 | 0,76 |
| Machine | 150 | 3 | $150/3=50$ | $50/13=3{,}85$ | 3,49 | 0,039 |
| Fout | 156 | 12 | $156/12=13$ | | | |
| Totaal | 330 | 19 | | | | |

**Besluit.** Machine: $3{,}85>3{,}49$, $p=0{,}039<0{,}05$, dus **significant**: Milling (49) scoort lager, Turning (56) en Cutting (55) hoger. Operator: $0{,}46<3{,}26$, **niet significant**: de verschillen tussen operatoren (51 tot 54) zijn kleiner dan de ruis ($\sqrt{13}=3{,}6$). Omdat er per cel maar één meting is, zit een eventuele interactie (zoals Peter die uitblinkt op Painting) mee in de foutterm.

### Verband met andere technieken

- **t-toets:** eenweg-ANOVA met 2 groepen geeft dezelfde p als de pooled t-toets ($F=t^2$).
- **Regressie:** ANOVA is regressie met dummy-variabelen; dezelfde ontbinding $SS_T=SS_R+SS_E$.
- **DOE ($2^k$):** de effecten van een factorieel proefopzet worden met dezelfde ANOVA-tabel getoetst.
- **Gauge R&R:** de ANOVA-methode splitst de meetvariatie in stukken, operatoren en herhaalbaarheid (module MSA).

**Excel:** Gegevens > Gegevensanalyse > *Anova: één factor* / *twee factoren zonder herhaling* / *twee factoren met herhaling* (blokformaat met $r$ rijen per niveau). p-waarde `=F.DIST.RT(F;df1;df2)`, kritieke waarde `=F.INV.RT(α;df1;df2)`.
